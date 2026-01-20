// WebGPU utilities para procesamiento de imágenes

export interface WebGPUSupport {
  available: boolean;
  adapter: GPUAdapter | null;
  device: GPUDevice | null;
}

let webgpuSupport: WebGPUSupport | null = null;

export async function initWebGPU(): Promise<WebGPUSupport> {
  if (webgpuSupport) return webgpuSupport;

  if (!navigator.gpu) {
    webgpuSupport = { available: false, adapter: null, device: null };
    return webgpuSupport;
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      webgpuSupport = { available: false, adapter: null, device: null };
      return webgpuSupport;
    }

    const device = await adapter.requestDevice();
    webgpuSupport = { available: true, adapter, device };
    return webgpuSupport;
  } catch {
    webgpuSupport = { available: false, adapter: null, device: null };
    return webgpuSupport;
  }
}

export function isWebGPUAvailable(): boolean {
  return webgpuSupport?.available ?? false;
}

// Shader para procesamiento básico de imagen
const imageProcessShader = `
@group(0) @binding(0) var inputTexture: texture_2d<f32>;
@group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var texSampler: sampler;

struct Uniforms {
  brightness: f32,
  contrast: f32,
  saturation: f32,
  padding: f32,
}
@group(0) @binding(3) var<uniform> uniforms: Uniforms;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let dims = textureDimensions(inputTexture);
  if (global_id.x >= dims.x || global_id.y >= dims.y) {
    return;
  }

  let uv = vec2<f32>(global_id.xy) / vec2<f32>(dims);
  var color = textureSampleLevel(inputTexture, texSampler, uv, 0.0);

  // Ajustar brillo
  color = vec4<f32>(color.rgb + uniforms.brightness, color.a);

  // Ajustar contraste
  color = vec4<f32>((color.rgb - 0.5) * uniforms.contrast + 0.5, color.a);

  // Ajustar saturación
  let gray = dot(color.rgb, vec3<f32>(0.299, 0.587, 0.114));
  color = vec4<f32>(mix(vec3<f32>(gray), color.rgb, uniforms.saturation), color.a);

  // Clamp valores
  color = clamp(color, vec4<f32>(0.0), vec4<f32>(1.0));

  textureStore(outputTexture, vec2<i32>(global_id.xy), color);
}
`;

export interface ImageProcessOptions {
  brightness?: number; // -1 a 1
  contrast?: number;   // 0 a 2
  saturation?: number; // 0 a 2
}

export async function processImageWithWebGPU(
  imageData: ImageData,
  options: ImageProcessOptions = {}
): Promise<ImageData | null> {
  const support = await initWebGPU();
  if (!support.available || !support.device) return null;

  const device = support.device;
  const { width, height } = imageData;

  const brightness = options.brightness ?? 0;
  const contrast = options.contrast ?? 1;
  const saturation = options.saturation ?? 1;

  try {
    // Crear texturas
    const inputTexture = device.createTexture({
      size: [width, height],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    const outputTexture = device.createTexture({
      size: [width, height],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC,
    });

    // Subir imagen de entrada
    device.queue.writeTexture(
      { texture: inputTexture },
      imageData.data,
      { bytesPerRow: width * 4 },
      [width, height]
    );

    // Crear sampler
    const sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });

    // Crear buffer de uniforms
    const uniformBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(
      uniformBuffer,
      0,
      new Float32Array([brightness, contrast, saturation, 0])
    );

    // Crear pipeline
    const shaderModule = device.createShaderModule({ code: imageProcessShader });

    const pipeline = device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: shaderModule,
        entryPoint: 'main',
      },
    });

    // Crear bind group
    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: inputTexture.createView() },
        { binding: 1, resource: outputTexture.createView() },
        { binding: 2, resource: sampler },
        { binding: 3, resource: { buffer: uniformBuffer } },
      ],
    });

    // Ejecutar compute
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatchWorkgroups(Math.ceil(width / 8), Math.ceil(height / 8));
    passEncoder.end();

    // Crear buffer para leer resultado
    const readBuffer = device.createBuffer({
      size: width * height * 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    commandEncoder.copyTextureToBuffer(
      { texture: outputTexture },
      { buffer: readBuffer, bytesPerRow: width * 4 },
      [width, height]
    );

    device.queue.submit([commandEncoder.finish()]);

    // Leer resultado
    await readBuffer.mapAsync(GPUMapMode.READ);
    const resultData = new Uint8ClampedArray(readBuffer.getMappedRange().slice(0));
    readBuffer.unmap();

    // Limpiar recursos
    inputTexture.destroy();
    outputTexture.destroy();
    readBuffer.destroy();

    return new ImageData(resultData, width, height);
  } catch (error) {
    console.error('Error procesando imagen con WebGPU:', error);
    return null;
  }
}

// Procesar imagen desde data URL
export async function processDataUrlWithWebGPU(
  dataUrl: string,
  options: ImageProcessOptions = {}
): Promise<string | null> {
  const support = await initWebGPU();
  if (!support.available) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const processed = await processImageWithWebGPU(imageData, options);

      if (processed) {
        ctx.putImageData(processed, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}
