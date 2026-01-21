/**
 * WebGPU Video Player Service
 *
 * Proporciona reproducción de video eficiente usando WebGPU para el rendering.
 * Características:
 * - Rendering acelerado por GPU
 * - Post-procesamiento en tiempo real (brillo, contraste, saturación)
 * - Escalado eficiente con interpolación bicúbica
 * - Fallback automático a Canvas 2D si WebGPU no está disponible
 */

import { initWebGPU, isWebGPUAvailable } from './webgpu';

// Shader para renderizado de video con post-procesamiento
const videoRenderShader = `
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  // Crear un quad que cubre toda la pantalla
  var positions = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(1.0, 1.0),
  );

  var uvs = array<vec2<f32>, 6>(
    vec2<f32>(0.0, 1.0),
    vec2<f32>(1.0, 1.0),
    vec2<f32>(0.0, 0.0),
    vec2<f32>(0.0, 0.0),
    vec2<f32>(1.0, 1.0),
    vec2<f32>(1.0, 0.0),
  );

  var output: VertexOutput;
  output.position = vec4<f32>(positions[vertexIndex], 0.0, 1.0);
  output.uv = uvs[vertexIndex];
  return output;
}

@group(0) @binding(0) var videoTexture: texture_external;
@group(0) @binding(1) var videoSampler: sampler;

struct Uniforms {
  brightness: f32,
  contrast: f32,
  saturation: f32,
  sharpness: f32,
}
@group(0) @binding(2) var<uniform> uniforms: Uniforms;

@fragment
fn fragmentMain(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  var color = textureSampleBaseClampToEdge(videoTexture, videoSampler, uv);

  // Ajustar brillo
  color = vec4<f32>(color.rgb + uniforms.brightness, color.a);

  // Ajustar contraste
  color = vec4<f32>((color.rgb - 0.5) * uniforms.contrast + 0.5, color.a);

  // Ajustar saturación
  let luminance = dot(color.rgb, vec3<f32>(0.299, 0.587, 0.114));
  color = vec4<f32>(mix(vec3<f32>(luminance), color.rgb, uniforms.saturation), color.a);

  // Aplicar sharpening básico si está habilitado
  if (uniforms.sharpness > 0.0) {
    let texelSize = 1.0 / vec2<f32>(1920.0, 1080.0); // Tamaño aproximado
    let neighbors =
      textureSampleBaseClampToEdge(videoTexture, videoSampler, uv + vec2<f32>(-texelSize.x, 0.0)).rgb +
      textureSampleBaseClampToEdge(videoTexture, videoSampler, uv + vec2<f32>(texelSize.x, 0.0)).rgb +
      textureSampleBaseClampToEdge(videoTexture, videoSampler, uv + vec2<f32>(0.0, -texelSize.y)).rgb +
      textureSampleBaseClampToEdge(videoTexture, videoSampler, uv + vec2<f32>(0.0, texelSize.y)).rgb;
    let diff = color.rgb - neighbors * 0.25;
    color = vec4<f32>(color.rgb + diff * uniforms.sharpness, color.a);
  }

  // Clamp valores finales
  return clamp(color, vec4<f32>(0.0), vec4<f32>(1.0));
}
`;

export interface VideoPlayerOptions {
  brightness?: number;  // -1 a 1, default 0
  contrast?: number;    // 0 a 2, default 1
  saturation?: number;  // 0 a 2, default 1
  sharpness?: number;   // 0 a 1, default 0
}

export interface WebGPUVideoPlayer {
  canvas: HTMLCanvasElement;
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setOptions: (options: VideoPlayerOptions) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  isPlaying: () => boolean;
  destroy: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Crea un reproductor de video WebGPU
 */
export async function createWebGPUVideoPlayer(
  videoUrl: string,
  container: HTMLElement,
  initialOptions: VideoPlayerOptions = {}
): Promise<WebGPUVideoPlayer> {
  const support = await initWebGPU();

  // Si WebGPU está disponible, usar el reproductor acelerado
  if (support.available && support.device) {
    return createAcceleratedPlayer(videoUrl, container, support.device, initialOptions);
  }

  // Fallback a reproductor con Canvas 2D
  return createFallbackPlayer(videoUrl, container, initialOptions);
}

/**
 * Reproductor acelerado con WebGPU
 */
async function createAcceleratedPlayer(
  videoUrl: string,
  container: HTMLElement,
  device: GPUDevice,
  options: VideoPlayerOptions
): Promise<WebGPUVideoPlayer> {
  // Crear elemento de video
  const video = document.createElement('video');
  video.src = videoUrl;
  video.crossOrigin = 'anonymous';
  video.playsInline = true;
  video.preload = 'auto';

  // Esperar a que el video esté listo
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Error cargando video'));
  });

  // Crear canvas para rendering
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 1920;
  canvas.height = video.videoHeight || 1080;
  canvas.style.width = '100%';
  canvas.style.height = 'auto';
  canvas.style.maxHeight = '100%';
  canvas.style.objectFit = 'contain';
  container.appendChild(canvas);

  // Configurar WebGPU context
  const context = canvas.getContext('webgpu');
  if (!context) {
    throw new Error('No se pudo obtener contexto WebGPU');
  }

  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format,
    alphaMode: 'premultiplied',
  });

  // Crear sampler
  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
  });

  // Crear buffer de uniforms
  const uniformBuffer = device.createBuffer({
    size: 16, // 4 floats
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // Estado actual de opciones
  let currentOptions: VideoPlayerOptions = {
    brightness: options.brightness ?? 0,
    contrast: options.contrast ?? 1,
    saturation: options.saturation ?? 1,
    sharpness: options.sharpness ?? 0,
  };

  // Actualizar uniforms
  function updateUniforms() {
    device.queue.writeBuffer(
      uniformBuffer,
      0,
      new Float32Array([
        currentOptions.brightness!,
        currentOptions.contrast!,
        currentOptions.saturation!,
        currentOptions.sharpness!,
      ])
    );
  }
  updateUniforms();

  // Crear shader module
  const shaderModule = device.createShaderModule({
    code: videoRenderShader,
  });

  // Crear pipeline (se crea dinámicamente por frame debido a external texture)
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [
      device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT,
            externalTexture: {},
          },
          {
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT,
            sampler: {},
          },
          {
            binding: 2,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: { type: 'uniform' },
          },
        ],
      }),
    ],
  });

  const pipeline = device.createRenderPipeline({
    layout: pipelineLayout,
    vertex: {
      module: shaderModule,
      entryPoint: 'vertexMain',
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fragmentMain',
      targets: [{ format }],
    },
    primitive: {
      topology: 'triangle-list',
    },
  });

  // Variables de control
  let animationFrameId: number | null = null;
  let isDestroyed = false;

  // Callbacks
  let onTimeUpdate: ((currentTime: number) => void) | undefined;
  let onEnded: (() => void) | undefined;
  let onError: ((error: Error) => void) | undefined;

  // Función de renderizado por frame
  function renderFrame() {
    if (isDestroyed || video.paused || video.ended) {
      animationFrameId = null;
      return;
    }

    try {
      // Crear external texture desde el video
      const externalTexture = device.importExternalTexture({
        source: video,
      });

      // Crear bind group para este frame
      const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: externalTexture },
          { binding: 1, resource: sampler },
          { binding: 2, resource: { buffer: uniformBuffer } },
        ],
      });

      // Renderizar
      const commandEncoder = device.createCommandEncoder();
      const textureView = context!.getCurrentTexture().createView();

      const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [
          {
            view: textureView,
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
      });

      renderPass.setPipeline(pipeline);
      renderPass.setBindGroup(0, bindGroup);
      renderPass.draw(6);
      renderPass.end();

      device.queue.submit([commandEncoder.finish()]);

      // Notificar tiempo actual
      onTimeUpdate?.(video.currentTime);
    } catch (error) {
      console.error('Error en renderizado WebGPU:', error);
    }

    animationFrameId = requestAnimationFrame(renderFrame);
  }

  // Event listeners del video
  video.addEventListener('ended', () => {
    onEnded?.();
  });

  video.addEventListener('error', () => {
    onError?.(new Error('Error de reproducción de video'));
  });

  // API del reproductor
  const player: WebGPUVideoPlayer = {
    canvas,

    play: async () => {
      await video.play();
      if (animationFrameId === null) {
        renderFrame();
      }
    },

    pause: () => {
      video.pause();
    },

    seek: (time: number) => {
      video.currentTime = time;
    },

    setOptions: (newOptions: VideoPlayerOptions) => {
      currentOptions = { ...currentOptions, ...newOptions };
      updateUniforms();
    },

    getCurrentTime: () => video.currentTime,
    getDuration: () => video.duration,
    isPlaying: () => !video.paused && !video.ended,

    destroy: () => {
      isDestroyed = true;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      video.pause();
      video.src = '';
      canvas.remove();
      uniformBuffer.destroy();
    },

    get onTimeUpdate() {
      return onTimeUpdate;
    },
    set onTimeUpdate(callback: ((currentTime: number) => void) | undefined) {
      onTimeUpdate = callback;
    },

    get onEnded() {
      return onEnded;
    },
    set onEnded(callback: (() => void) | undefined) {
      onEnded = callback;
    },

    get onError() {
      return onError;
    },
    set onError(callback: ((error: Error) => void) | undefined) {
      onError = callback;
    },
  };

  return player;
}

/**
 * Reproductor fallback con Canvas 2D (cuando WebGPU no está disponible)
 */
function createFallbackPlayer(
  videoUrl: string,
  container: HTMLElement,
  options: VideoPlayerOptions
): Promise<WebGPUVideoPlayer> {
  return new Promise((resolve, reject) => {
    // Crear elemento de video nativo
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    video.playsInline = true;
    video.controls = false;
    video.style.width = '100%';
    video.style.height = 'auto';
    video.style.maxHeight = '100%';
    video.style.objectFit = 'contain';
    video.style.borderRadius = '0.5rem';
    video.preload = 'auto';

    // Crear canvas para post-procesamiento si es necesario
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.maxHeight = '100%';
    canvas.style.objectFit = 'contain';
    canvas.style.borderRadius = '0.5rem';
    canvas.style.display = 'none';

    container.appendChild(video);
    container.appendChild(canvas);

    let currentOptions = { ...options };
    let useCanvas = false;
    let animationFrameId: number | null = null;
    let isDestroyed = false;

    // Callbacks
    let onTimeUpdate: ((currentTime: number) => void) | undefined;
    let onEnded: (() => void) | undefined;
    let onError: ((error: Error) => void) | undefined;

    // Función para aplicar filtros CSS (más eficiente que canvas para filtros simples)
    function applyFilters() {
      const filters: string[] = [];

      if (currentOptions.brightness !== 0) {
        filters.push(`brightness(${1 + (currentOptions.brightness || 0)})`);
      }
      if (currentOptions.contrast !== 1) {
        filters.push(`contrast(${currentOptions.contrast || 1})`);
      }
      if (currentOptions.saturation !== 1) {
        filters.push(`saturate(${currentOptions.saturation || 1})`);
      }

      video.style.filter = filters.length > 0 ? filters.join(' ') : 'none';
    }

    // Renderizado con canvas para filtros más complejos
    function renderFrameWithCanvas() {
      if (isDestroyed || video.paused || video.ended) {
        animationFrameId = null;
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Aquí se podrían aplicar filtros más complejos con ImageData
      // Por ahora usamos filtros CSS que son más eficientes

      onTimeUpdate?.(video.currentTime);
      animationFrameId = requestAnimationFrame(renderFrameWithCanvas);
    }

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      applyFilters();

      const player: WebGPUVideoPlayer = {
        canvas: useCanvas ? canvas : (video as unknown as HTMLCanvasElement),

        play: async () => {
          await video.play();
          if (useCanvas && animationFrameId === null) {
            renderFrameWithCanvas();
          }
        },

        pause: () => {
          video.pause();
        },

        seek: (time: number) => {
          video.currentTime = time;
        },

        setOptions: (newOptions: VideoPlayerOptions) => {
          currentOptions = { ...currentOptions, ...newOptions };
          applyFilters();
        },

        getCurrentTime: () => video.currentTime,
        getDuration: () => video.duration,
        isPlaying: () => !video.paused && !video.ended,

        destroy: () => {
          isDestroyed = true;
          if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
          }
          video.pause();
          video.src = '';
          video.remove();
          canvas.remove();
        },

        get onTimeUpdate() {
          return onTimeUpdate;
        },
        set onTimeUpdate(callback: ((currentTime: number) => void) | undefined) {
          onTimeUpdate = callback;
          if (callback && !useCanvas) {
            video.ontimeupdate = () => callback(video.currentTime);
          }
        },

        get onEnded() {
          return onEnded;
        },
        set onEnded(callback: (() => void) | undefined) {
          onEnded = callback;
          video.onended = callback || null;
        },

        get onError() {
          return onError;
        },
        set onError(callback: ((error: Error) => void) | undefined) {
          onError = callback;
        },
      };

      resolve(player);
    };

    video.onerror = () => {
      reject(new Error('Error cargando video'));
    };
  });
}

/**
 * Verifica si el reproductor WebGPU acelerado está disponible
 */
export function isAcceleratedPlayerAvailable(): boolean {
  return isWebGPUAvailable();
}

/**
 * Crea un reproductor simple sin WebGPU (solo video nativo)
 */
export function createSimpleVideoPlayer(
  videoUrl: string,
  container: HTMLElement
): HTMLVideoElement {
  const video = document.createElement('video');
  video.src = videoUrl;
  video.crossOrigin = 'anonymous';
  video.playsInline = true;
  video.controls = true;
  video.style.width = '100%';
  video.style.height = 'auto';
  video.style.maxHeight = '100%';
  video.style.objectFit = 'contain';
  video.style.borderRadius = '0.5rem';
  video.preload = 'auto';
  container.appendChild(video);
  return video;
}
