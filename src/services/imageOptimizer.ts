// Image Optimizer Service - WebGPU-accelerated image scaling
// Reduces token usage by downscaling images before sending to AI
// Upscales received images using GPU-accelerated bicubic interpolation

import { initWebGPU, isWebGPUAvailable } from './webgpu';

// Configuration for image optimization
export interface ImageOptimizationConfig {
  // Maximum dimension for images sent to AI (reduces tokens)
  maxInputDimension: number;
  // Target dimension for upscaled output images
  targetOutputDimension: number;
  // JPEG quality for compressed images (0-1)
  compressionQuality: number;
  // Enable WebGPU upscaling
  enableUpscaling: boolean;
}

// Default configuration optimized for token savings
export const defaultOptimizationConfig: ImageOptimizationConfig = {
  maxInputDimension: 512, // Send images at max 512px to save ~75% tokens
  targetOutputDimension: 1024, // Upscale received images to 1024px
  compressionQuality: 0.85,
  enableUpscaling: true,
};

// Shader para upscaling con interpolación bicúbica mejorada
// Bicubic produces smoother results than bilinear
const bicubicUpscaleShader = `
struct Uniforms {
  inputWidth: f32,
  inputHeight: f32,
  outputWidth: f32,
  outputHeight: f32,
}

@group(0) @binding(0) var inputTexture: texture_2d<f32>;
@group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var texSampler: sampler;
@group(0) @binding(3) var<uniform> uniforms: Uniforms;

// Función de peso de Mitchell-Netravali (B=1/3, C=1/3)
// Produce resultados más nítidos que B-Spline estándar
fn mitchellWeight(x: f32) -> f32 {
  let ax = abs(x);
  if (ax < 1.0) {
    return (7.0 * ax * ax * ax - 12.0 * ax * ax + 5.333333) / 6.0;
  } else if (ax < 2.0) {
    return (-2.333333 * ax * ax * ax + 12.0 * ax * ax - 20.0 * ax + 10.666667) / 6.0;
  }
  return 0.0;
}

// Función de peso Catmull-Rom (más nítido)
fn catmullRomWeight(x: f32) -> f32 {
  let ax = abs(x);
  if (ax < 1.0) {
    return 1.5 * ax * ax * ax - 2.5 * ax * ax + 1.0;
  } else if (ax < 2.0) {
    return -0.5 * ax * ax * ax + 2.5 * ax * ax - 4.0 * ax + 2.0;
  }
  return 0.0;
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let outputDims = vec2<u32>(u32(uniforms.outputWidth), u32(uniforms.outputHeight));

  if (global_id.x >= outputDims.x || global_id.y >= outputDims.y) {
    return;
  }

  // Calcular posición en la imagen de entrada
  let scaleX = uniforms.inputWidth / uniforms.outputWidth;
  let scaleY = uniforms.inputHeight / uniforms.outputHeight;

  let srcX = (f32(global_id.x) + 0.5) * scaleX - 0.5;
  let srcY = (f32(global_id.y) + 0.5) * scaleY - 0.5;

  // Píxel de origen entero
  let srcXi = i32(floor(srcX));
  let srcYi = i32(floor(srcY));

  // Fracción para interpolación
  let fracX = srcX - floor(srcX);
  let fracY = srcY - floor(srcY);

  // Interpolación bicúbica 4x4
  var color = vec4<f32>(0.0);
  var totalWeight = 0.0;

  for (var j = -1; j <= 2; j++) {
    for (var i = -1; i <= 2; i++) {
      let px = clamp(srcXi + i, 0, i32(uniforms.inputWidth) - 1);
      let py = clamp(srcYi + j, 0, i32(uniforms.inputHeight) - 1);

      let uv = vec2<f32>(f32(px) + 0.5, f32(py) + 0.5) / vec2<f32>(uniforms.inputWidth, uniforms.inputHeight);
      let sample = textureSampleLevel(inputTexture, texSampler, uv, 0.0);

      // Usar Catmull-Rom para resultados más nítidos
      let weightX = catmullRomWeight(f32(i) - fracX);
      let weightY = catmullRomWeight(f32(j) - fracY);
      let weight = weightX * weightY;

      color += sample * weight;
      totalWeight += weight;
    }
  }

  // Normalizar
  if (totalWeight > 0.0) {
    color = color / totalWeight;
  }

  // Aplicar sharpening leve para mejorar detalles
  // Esto compensa la pérdida de nitidez del upscaling
  let center = textureSampleLevel(inputTexture, texSampler,
    vec2<f32>(srcX + 0.5, srcY + 0.5) / vec2<f32>(uniforms.inputWidth, uniforms.inputHeight), 0.0);
  let sharpAmount = 0.15; // Cantidad sutil de sharpening
  color = mix(color, center, sharpAmount);

  // Clamp valores finales
  color = clamp(color, vec4<f32>(0.0), vec4<f32>(1.0));

  textureStore(outputTexture, vec2<i32>(global_id.xy), color);
}
`;

// Shader para downscaling con antialiasing
const downscaleShader = `
struct Uniforms {
  inputWidth: f32,
  inputHeight: f32,
  outputWidth: f32,
  outputHeight: f32,
}

@group(0) @binding(0) var inputTexture: texture_2d<f32>;
@group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var texSampler: sampler;
@group(0) @binding(3) var<uniform> uniforms: Uniforms;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let outputDims = vec2<u32>(u32(uniforms.outputWidth), u32(uniforms.outputHeight));

  if (global_id.x >= outputDims.x || global_id.y >= outputDims.y) {
    return;
  }

  // Calcular el área en la imagen de entrada que corresponde a este píxel de salida
  let scaleX = uniforms.inputWidth / uniforms.outputWidth;
  let scaleY = uniforms.inputHeight / uniforms.outputHeight;

  let srcX = f32(global_id.x) * scaleX;
  let srcY = f32(global_id.y) * scaleY;

  // Box filter con muestreo múltiple para antialiasing
  var color = vec4<f32>(0.0);
  let samples = 4; // 4x4 = 16 muestras
  let sampleStep = 1.0 / f32(samples);

  for (var j = 0; j < samples; j++) {
    for (var i = 0; i < samples; i++) {
      let offsetX = (f32(i) + 0.5) * sampleStep * scaleX;
      let offsetY = (f32(j) + 0.5) * sampleStep * scaleY;

      let sampleX = (srcX + offsetX) / uniforms.inputWidth;
      let sampleY = (srcY + offsetY) / uniforms.inputHeight;

      let uv = vec2<f32>(sampleX, sampleY);
      color += textureSampleLevel(inputTexture, texSampler, uv, 0.0);
    }
  }

  color = color / f32(samples * samples);
  textureStore(outputTexture, vec2<i32>(global_id.xy), color);
}
`;

// Cache para pipelines compilados
let upscalePipeline: GPUComputePipeline | null = null;
let downscalePipeline: GPUComputePipeline | null = null;

/**
 * Reduce la resolución de una imagen usando Canvas (fallback)
 * o WebGPU si está disponible para mejor calidad
 */
export async function downscaleImage(
  dataUrl: string,
  maxDimension: number,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      // Calcular nuevas dimensiones manteniendo aspecto
      let newWidth = img.width;
      let newHeight = img.height;

      if (img.width > maxDimension || img.height > maxDimension) {
        if (img.width > img.height) {
          newWidth = maxDimension;
          newHeight = Math.round((img.height / img.width) * maxDimension);
        } else {
          newHeight = maxDimension;
          newWidth = Math.round((img.width / img.height) * maxDimension);
        }
      } else {
        // La imagen ya es suficientemente pequeña
        resolve(dataUrl);
        return;
      }

      // Intentar usar WebGPU para mejor calidad
      if (isWebGPUAvailable()) {
        const result = await downscaleWithWebGPU(img, newWidth, newHeight, quality);
        if (result) {
          resolve(result);
          return;
        }
      }

      // Fallback a Canvas con múltiples pasos para mejor calidad
      const result = downscaleWithCanvas(img, newWidth, newHeight, quality);
      resolve(result);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Downscale usando Canvas con técnica de múltiples pasos
 * para mejor calidad que un solo resize
 */
function downscaleWithCanvas(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  quality: number
): string {
  // Usar múltiples pasos para evitar aliasing
  let currentWidth = img.width;
  let currentHeight = img.height;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Primer paso: dibujar imagen original
  canvas.width = currentWidth;
  canvas.height = currentHeight;
  ctx.drawImage(img, 0, 0);

  // Reducir en pasos del 50% hasta llegar al tamaño objetivo
  while (currentWidth > targetWidth * 2 || currentHeight > targetHeight * 2) {
    const nextWidth = Math.max(targetWidth, Math.floor(currentWidth / 2));
    const nextHeight = Math.max(targetHeight, Math.floor(currentHeight / 2));

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = nextWidth;
    tempCanvas.height = nextHeight;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';
    tempCtx.drawImage(canvas, 0, 0, currentWidth, currentHeight, 0, 0, nextWidth, nextHeight);

    canvas.width = nextWidth;
    canvas.height = nextHeight;
    ctx.drawImage(tempCanvas, 0, 0);

    currentWidth = nextWidth;
    currentHeight = nextHeight;
  }

  // Paso final al tamaño objetivo
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = targetWidth;
  finalCanvas.height = targetHeight;
  const finalCtx = finalCanvas.getContext('2d')!;
  finalCtx.imageSmoothingEnabled = true;
  finalCtx.imageSmoothingQuality = 'high';
  finalCtx.drawImage(canvas, 0, 0, currentWidth, currentHeight, 0, 0, targetWidth, targetHeight);

  return finalCanvas.toDataURL('image/jpeg', quality);
}

/**
 * Downscale usando WebGPU para máxima calidad
 */
async function downscaleWithWebGPU(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  quality: number
): Promise<string | null> {
  const support = await initWebGPU();
  if (!support.available || !support.device) return null;

  const device = support.device;

  try {
    // Crear canvas temporal para obtener ImageData
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = img.width;
    srcCanvas.height = img.height;
    const srcCtx = srcCanvas.getContext('2d')!;
    srcCtx.drawImage(img, 0, 0);
    const srcImageData = srcCtx.getImageData(0, 0, img.width, img.height);

    // Crear texturas
    const inputTexture = device.createTexture({
      size: [img.width, img.height],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    const outputTexture = device.createTexture({
      size: [targetWidth, targetHeight],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC,
    });

    // Subir imagen
    device.queue.writeTexture(
      { texture: inputTexture },
      srcImageData.data,
      { bytesPerRow: img.width * 4 },
      [img.width, img.height]
    );

    // Crear sampler
    const sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });

    // Crear uniform buffer
    const uniformBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(
      uniformBuffer,
      0,
      new Float32Array([img.width, img.height, targetWidth, targetHeight])
    );

    // Crear pipeline si no existe
    if (!downscalePipeline) {
      const shaderModule = device.createShaderModule({ code: downscaleShader });
      downscalePipeline = device.createComputePipeline({
        layout: 'auto',
        compute: { module: shaderModule, entryPoint: 'main' },
      });
    }

    // Crear bind group
    const bindGroup = device.createBindGroup({
      layout: downscalePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: inputTexture.createView() },
        { binding: 1, resource: outputTexture.createView() },
        { binding: 2, resource: sampler },
        { binding: 3, resource: { buffer: uniformBuffer } },
      ],
    });

    // Ejecutar
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(downscalePipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatchWorkgroups(
      Math.ceil(targetWidth / 8),
      Math.ceil(targetHeight / 8)
    );
    passEncoder.end();

    // Leer resultado
    const bytesPerRow = targetWidth * 4;
    const alignedBytesPerRow = Math.ceil(bytesPerRow / 256) * 256;
    const bufferSize = alignedBytesPerRow * targetHeight;

    const readBuffer = device.createBuffer({
      size: bufferSize,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    commandEncoder.copyTextureToBuffer(
      { texture: outputTexture },
      { buffer: readBuffer, bytesPerRow: alignedBytesPerRow },
      [targetWidth, targetHeight]
    );

    device.queue.submit([commandEncoder.finish()]);

    await readBuffer.mapAsync(GPUMapMode.READ);
    const paddedData = new Uint8Array(readBuffer.getMappedRange());

    const resultData = new Uint8ClampedArray(targetWidth * targetHeight * 4);
    if (alignedBytesPerRow === bytesPerRow) {
      resultData.set(paddedData);
    } else {
      for (let y = 0; y < targetHeight; y++) {
        const srcOffset = y * alignedBytesPerRow;
        const dstOffset = y * bytesPerRow;
        resultData.set(paddedData.subarray(srcOffset, srcOffset + bytesPerRow), dstOffset);
      }
    }
    readBuffer.unmap();

    // Limpiar
    inputTexture.destroy();
    outputTexture.destroy();
    readBuffer.destroy();

    // Convertir a canvas y luego a dataUrl
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = targetWidth;
    resultCanvas.height = targetHeight;
    const resultCtx = resultCanvas.getContext('2d')!;
    const resultImageData = new ImageData(resultData, targetWidth, targetHeight);
    resultCtx.putImageData(resultImageData, 0, 0);

    return resultCanvas.toDataURL('image/jpeg', quality);
  } catch (error) {
    console.error('Error en downscale WebGPU:', error);
    return null;
  }
}

/**
 * Escala una imagen a mayor resolución usando WebGPU
 * con interpolación bicúbica Catmull-Rom
 */
export async function upscaleImageWebGPU(
  dataUrl: string,
  targetDimension: number
): Promise<string | null> {
  const support = await initWebGPU();
  if (!support.available || !support.device) {
    console.log('WebGPU no disponible, usando fallback Canvas');
    return upscaleWithCanvas(dataUrl, targetDimension);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      // Calcular nuevas dimensiones
      let newWidth = img.width;
      let newHeight = img.height;

      if (img.width < targetDimension && img.height < targetDimension) {
        if (img.width > img.height) {
          newWidth = targetDimension;
          newHeight = Math.round((img.height / img.width) * targetDimension);
        } else {
          newHeight = targetDimension;
          newWidth = Math.round((img.width / img.height) * targetDimension);
        }
      } else {
        // La imagen ya es suficientemente grande
        resolve(dataUrl);
        return;
      }

      const result = await performWebGPUUpscale(img, newWidth, newHeight);
      resolve(result || dataUrl);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Upscale usando Canvas como fallback
 */
async function upscaleWithCanvas(
  dataUrl: string,
  targetDimension: number
): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let newWidth = img.width;
      let newHeight = img.height;

      if (img.width < targetDimension && img.height < targetDimension) {
        if (img.width > img.height) {
          newWidth = targetDimension;
          newHeight = Math.round((img.height / img.width) * targetDimension);
        } else {
          newHeight = targetDimension;
          newWidth = Math.round((img.width / img.height) * targetDimension);
        }
      } else {
        resolve(dataUrl);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

/**
 * Realiza el upscaling con WebGPU
 */
async function performWebGPUUpscale(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
): Promise<string | null> {
  const support = await initWebGPU();
  if (!support.available || !support.device) return null;

  const device = support.device;

  try {
    // Crear canvas temporal para obtener ImageData
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = img.width;
    srcCanvas.height = img.height;
    const srcCtx = srcCanvas.getContext('2d')!;
    srcCtx.drawImage(img, 0, 0);
    const srcImageData = srcCtx.getImageData(0, 0, img.width, img.height);

    // Crear texturas
    const inputTexture = device.createTexture({
      size: [img.width, img.height],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    const outputTexture = device.createTexture({
      size: [targetWidth, targetHeight],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC,
    });

    // Subir imagen
    device.queue.writeTexture(
      { texture: inputTexture },
      srcImageData.data,
      { bytesPerRow: img.width * 4 },
      [img.width, img.height]
    );

    // Crear sampler con filtrado lineal
    const sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });

    // Crear uniform buffer
    const uniformBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(
      uniformBuffer,
      0,
      new Float32Array([img.width, img.height, targetWidth, targetHeight])
    );

    // Crear pipeline si no existe
    if (!upscalePipeline) {
      const shaderModule = device.createShaderModule({ code: bicubicUpscaleShader });
      upscalePipeline = device.createComputePipeline({
        layout: 'auto',
        compute: { module: shaderModule, entryPoint: 'main' },
      });
    }

    // Crear bind group
    const bindGroup = device.createBindGroup({
      layout: upscalePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: inputTexture.createView() },
        { binding: 1, resource: outputTexture.createView() },
        { binding: 2, resource: sampler },
        { binding: 3, resource: { buffer: uniformBuffer } },
      ],
    });

    // Ejecutar compute shader
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(upscalePipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatchWorkgroups(
      Math.ceil(targetWidth / 8),
      Math.ceil(targetHeight / 8)
    );
    passEncoder.end();

    // Leer resultado
    const bytesPerRow = targetWidth * 4;
    const alignedBytesPerRow = Math.ceil(bytesPerRow / 256) * 256;
    const bufferSize = alignedBytesPerRow * targetHeight;

    const readBuffer = device.createBuffer({
      size: bufferSize,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    commandEncoder.copyTextureToBuffer(
      { texture: outputTexture },
      { buffer: readBuffer, bytesPerRow: alignedBytesPerRow },
      [targetWidth, targetHeight]
    );

    device.queue.submit([commandEncoder.finish()]);

    await readBuffer.mapAsync(GPUMapMode.READ);
    const paddedData = new Uint8Array(readBuffer.getMappedRange());

    const resultData = new Uint8ClampedArray(targetWidth * targetHeight * 4);
    if (alignedBytesPerRow === bytesPerRow) {
      resultData.set(paddedData);
    } else {
      for (let y = 0; y < targetHeight; y++) {
        const srcOffset = y * alignedBytesPerRow;
        const dstOffset = y * bytesPerRow;
        resultData.set(paddedData.subarray(srcOffset, srcOffset + bytesPerRow), dstOffset);
      }
    }
    readBuffer.unmap();

    // Limpiar recursos GPU
    inputTexture.destroy();
    outputTexture.destroy();
    readBuffer.destroy();

    // Convertir a canvas y luego a dataUrl
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = targetWidth;
    resultCanvas.height = targetHeight;
    const resultCtx = resultCanvas.getContext('2d')!;
    const resultImageData = new ImageData(resultData, targetWidth, targetHeight);
    resultCtx.putImageData(resultImageData, 0, 0);

    return resultCanvas.toDataURL('image/jpeg', 0.92);
  } catch (error) {
    console.error('Error en upscale WebGPU:', error);
    return null;
  }
}

/**
 * Obtiene información sobre el ahorro de tokens estimado
 */
export function estimateTokenSavings(
  originalWidth: number,
  originalHeight: number,
  maxDimension: number
): { originalTokens: number; optimizedTokens: number; savings: number } {
  // Gemini usa aproximadamente 1 token por cada 750 píxeles
  const PIXELS_PER_TOKEN = 750;

  const originalPixels = originalWidth * originalHeight;

  let newWidth = originalWidth;
  let newHeight = originalHeight;

  if (originalWidth > maxDimension || originalHeight > maxDimension) {
    if (originalWidth > originalHeight) {
      newWidth = maxDimension;
      newHeight = Math.round((originalHeight / originalWidth) * maxDimension);
    } else {
      newHeight = maxDimension;
      newWidth = Math.round((originalWidth / originalHeight) * maxDimension);
    }
  }

  const optimizedPixels = newWidth * newHeight;

  const originalTokens = Math.ceil(originalPixels / PIXELS_PER_TOKEN);
  const optimizedTokens = Math.ceil(optimizedPixels / PIXELS_PER_TOKEN);
  const savings = Math.round(((originalTokens - optimizedTokens) / originalTokens) * 100);

  return { originalTokens, optimizedTokens, savings };
}

/**
 * Obtiene las dimensiones de una imagen desde dataUrl
 */
export function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = dataUrl;
  });
}
