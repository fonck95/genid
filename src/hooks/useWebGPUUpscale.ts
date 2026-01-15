import { useState, useEffect, useCallback, useRef } from 'react';

interface UpscaleResult {
  upscaledUrl: string | null;
  isLoading: boolean;
  error: string | null;
  isWebGPUSupported: boolean;
}

interface UpscaleOptions {
  targetWidth?: number;
  targetHeight?: number;
  scaleFactor?: number;
}

// Shader WGSL para upscaling bicúbico de alta calidad
const UPSCALE_SHADER = `
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) texCoord: vec2<f32>,
}

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  var pos = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(1.0, 1.0)
  );

  var texCoords = array<vec2<f32>, 6>(
    vec2<f32>(0.0, 1.0),
    vec2<f32>(1.0, 1.0),
    vec2<f32>(0.0, 0.0),
    vec2<f32>(0.0, 0.0),
    vec2<f32>(1.0, 1.0),
    vec2<f32>(1.0, 0.0)
  );

  var output: VertexOutput;
  output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
  output.texCoord = texCoords[vertexIndex];
  return output;
}

@group(0) @binding(0) var inputTexture: texture_2d<f32>;
@group(0) @binding(1) var textureSampler: sampler;

// Función de peso bicúbico (Catmull-Rom spline)
fn cubicWeight(x: f32) -> f32 {
  let absX = abs(x);
  if (absX <= 1.0) {
    return 1.5 * absX * absX * absX - 2.5 * absX * absX + 1.0;
  } else if (absX < 2.0) {
    return -0.5 * absX * absX * absX + 2.5 * absX * absX - 4.0 * absX + 2.0;
  }
  return 0.0;
}

@fragment
fn fragmentMain(@location(0) texCoord: vec2<f32>) -> @location(0) vec4<f32> {
  let texSize = vec2<f32>(textureDimensions(inputTexture));
  let srcCoord = texCoord * texSize;
  let srcPixel = floor(srcCoord);
  let frac = srcCoord - srcPixel;

  var color = vec4<f32>(0.0);
  var weightSum = 0.0;

  // Kernel bicúbico 4x4
  for (var y = -1; y <= 2; y++) {
    for (var x = -1; x <= 2; x++) {
      let samplePos = (srcPixel + vec2<f32>(f32(x), f32(y)) + 0.5) / texSize;
      let weight = cubicWeight(f32(x) - frac.x) * cubicWeight(f32(y) - frac.y);

      // Clamp a los bordes de la textura
      let clampedPos = clamp(samplePos, vec2<f32>(0.0), vec2<f32>(1.0));
      color += textureSample(inputTexture, textureSampler, clampedPos) * weight;
      weightSum += weight;
    }
  }

  // Normalizar y aplicar ajuste de nitidez suave
  color = color / weightSum;

  // Ligero aumento de contraste para mejorar nitidez
  let gray = dot(color.rgb, vec3<f32>(0.299, 0.587, 0.114));
  let sharpened = color.rgb + (color.rgb - vec3<f32>(gray)) * 0.1;

  return vec4<f32>(clamp(sharpened, vec3<f32>(0.0), vec3<f32>(1.0)), color.a);
}
`;

async function checkWebGPUSupport(): Promise<GPUAdapter | null> {
  if (!navigator.gpu) {
    return null;
  }
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return adapter;
  } catch {
    return null;
  }
}

async function loadImageBitmap(src: string): Promise<ImageBitmap> {
  const response = await fetch(src);
  const blob = await response.blob();
  return createImageBitmap(blob);
}

async function upscaleWithWebGPU(
  imageBitmap: ImageBitmap,
  targetWidth: number,
  targetHeight: number
): Promise<string> {
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error('WebGPU adapter not available');

  const device = await adapter.requestDevice();

  // Crear textura de entrada desde la imagen
  const inputTexture = device.createTexture({
    size: [imageBitmap.width, imageBitmap.height, 1],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  });

  device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture: inputTexture },
    [imageBitmap.width, imageBitmap.height]
  );

  // Crear textura de salida
  const outputTexture = device.createTexture({
    size: [targetWidth, targetHeight, 1],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
  });

  // Crear sampler con filtrado lineal
  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
    mipmapFilter: 'linear',
  });

  // Crear shader module
  const shaderModule = device.createShaderModule({
    code: UPSCALE_SHADER,
  });

  // Crear bind group layout
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        texture: { sampleType: 'float' },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: { type: 'filtering' },
      },
    ],
  });

  // Crear pipeline
  const pipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    }),
    vertex: {
      module: shaderModule,
      entryPoint: 'vertexMain',
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fragmentMain',
      targets: [{ format: 'rgba8unorm' }],
    },
    primitive: {
      topology: 'triangle-list',
    },
  });

  // Crear bind group
  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      { binding: 0, resource: inputTexture.createView() },
      { binding: 1, resource: sampler },
    ],
  });

  // Ejecutar el render pass
  const commandEncoder = device.createCommandEncoder();
  const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: outputTexture.createView(),
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

  // Leer resultado a un buffer
  const bytesPerRow = Math.ceil((targetWidth * 4) / 256) * 256;
  const outputBuffer = device.createBuffer({
    size: bytesPerRow * targetHeight,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });

  commandEncoder.copyTextureToBuffer(
    { texture: outputTexture },
    { buffer: outputBuffer, bytesPerRow },
    [targetWidth, targetHeight]
  );

  device.queue.submit([commandEncoder.finish()]);

  // Esperar a que termine y leer los datos
  await outputBuffer.mapAsync(GPUMapMode.READ);
  const outputData = new Uint8Array(outputBuffer.getMappedRange());

  // Crear canvas para convertir a imagen
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(targetWidth, targetHeight);

  // Copiar datos (teniendo en cuenta el padding del bytesPerRow)
  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const srcIdx = y * bytesPerRow + x * 4;
      const dstIdx = (y * targetWidth + x) * 4;
      imageData.data[dstIdx] = outputData[srcIdx];
      imageData.data[dstIdx + 1] = outputData[srcIdx + 1];
      imageData.data[dstIdx + 2] = outputData[srcIdx + 2];
      imageData.data[dstIdx + 3] = outputData[srcIdx + 3];
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Limpiar recursos
  outputBuffer.unmap();
  inputTexture.destroy();
  outputTexture.destroy();
  device.destroy();

  return canvas.toDataURL('image/png');
}

function upscaleWithCanvas(
  imageBitmap: ImageBitmap,
  targetWidth: number,
  targetHeight: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d')!;

  // Configurar interpolación de alta calidad
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

  return canvas.toDataURL('image/png');
}

export function useWebGPUUpscale(
  imageSrc: string | null,
  options: UpscaleOptions = {}
): UpscaleResult {
  const [upscaledUrl, setUpscaledUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWebGPUSupported, setIsWebGPUSupported] = useState(false);
  const processedSrcRef = useRef<string | null>(null);

  const { targetWidth, targetHeight, scaleFactor = 2 } = options;

  useEffect(() => {
    checkWebGPUSupport().then(adapter => {
      setIsWebGPUSupported(!!adapter);
    });
  }, []);

  const processImage = useCallback(async () => {
    if (!imageSrc || processedSrcRef.current === imageSrc) return;

    setIsLoading(true);
    setError(null);
    processedSrcRef.current = imageSrc;

    try {
      const imageBitmap = await loadImageBitmap(imageSrc);

      const finalWidth = targetWidth || Math.round(imageBitmap.width * scaleFactor);
      const finalHeight = targetHeight || Math.round(imageBitmap.height * scaleFactor);

      let resultUrl: string;

      const adapter = await checkWebGPUSupport();
      if (adapter) {
        try {
          resultUrl = await upscaleWithWebGPU(imageBitmap, finalWidth, finalHeight);
        } catch (webgpuError) {
          console.warn('WebGPU upscaling failed, falling back to canvas:', webgpuError);
          resultUrl = upscaleWithCanvas(imageBitmap, finalWidth, finalHeight);
        }
      } else {
        resultUrl = upscaleWithCanvas(imageBitmap, finalWidth, finalHeight);
      }

      setUpscaledUrl(resultUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing image');
      setUpscaledUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, [imageSrc, targetWidth, targetHeight, scaleFactor]);

  useEffect(() => {
    processImage();
  }, [processImage]);

  return {
    upscaledUrl,
    isLoading,
    error,
    isWebGPUSupported,
  };
}

export default useWebGPUUpscale;
