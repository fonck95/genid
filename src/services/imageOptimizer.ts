// Image Optimizer Service - WebGPU-accelerated image scaling with Super-Resolution
// Reduces token usage by downscaling images before sending to AI
// Upscales received images using GPU-accelerated super-resolution techniques
// Inspired by Real-ESRGAN and ESPCN architectures for edge-aware enhancement

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
  // Upscaling algorithm to use
  upscaleAlgorithm: UpscaleAlgorithm;
  // Sharpening intensity for super-resolution (0-1)
  sharpeningIntensity: number;
  // Enable edge enhancement
  edgeEnhancement: boolean;
}

// Available upscaling algorithms
export type UpscaleAlgorithm = 'bicubic' | 'superres' | 'lanczos';

// Optimization presets for different use cases
export type OptimizationPreset = 'ultra' | 'high' | 'balanced' | 'quality';

// Preset configurations
export const OPTIMIZATION_PRESETS: Record<OptimizationPreset, ImageOptimizationConfig> = {
  // Ultra: Maximum token savings (up to 90% reduction)
  // Best for: Quick iterations, drafts, low-cost testing
  ultra: {
    maxInputDimension: 256,
    targetOutputDimension: 2048,
    compressionQuality: 0.75,
    enableUpscaling: true,
    upscaleAlgorithm: 'superres',
    sharpeningIntensity: 0.5,
    edgeEnhancement: true,
  },
  // High: Significant token savings (75-85% reduction)
  // Best for: Regular generation with good quality
  high: {
    maxInputDimension: 384,
    targetOutputDimension: 1536,
    compressionQuality: 0.80,
    enableUpscaling: true,
    upscaleAlgorithm: 'superres',
    sharpeningIntensity: 0.35,
    edgeEnhancement: true,
  },
  // Balanced: Moderate token savings (60-70% reduction)
  // Best for: Standard usage with better AI understanding
  balanced: {
    maxInputDimension: 512,
    targetOutputDimension: 1024,
    compressionQuality: 0.85,
    enableUpscaling: true,
    upscaleAlgorithm: 'bicubic',
    sharpeningIntensity: 0.2,
    edgeEnhancement: false,
  },
  // Quality: Minimal compression for best AI comprehension
  // Best for: Complex scenes, fine details, important generations
  quality: {
    maxInputDimension: 768,
    targetOutputDimension: 1024,
    compressionQuality: 0.90,
    enableUpscaling: true,
    upscaleAlgorithm: 'bicubic',
    sharpeningIntensity: 0.15,
    edgeEnhancement: false,
  },
};

// Default configuration optimized for token savings (balanced preset)
export const defaultOptimizationConfig: ImageOptimizationConfig = {
  ...OPTIMIZATION_PRESETS.balanced,
};

// Current active preset (for UI display)
let activePreset: OptimizationPreset | 'custom' = 'balanced';

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

// Super-Resolution shader with edge-aware enhancement
// Uses gradient detection and adaptive sharpening for better quality upscaling
const superResolutionShader = `
struct Uniforms {
  inputWidth: f32,
  inputHeight: f32,
  outputWidth: f32,
  outputHeight: f32,
  sharpeningIntensity: f32,
  edgeThreshold: f32,
  padding1: f32,
  padding2: f32,
}

@group(0) @binding(0) var inputTexture: texture_2d<f32>;
@group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var texSampler: sampler;
@group(0) @binding(3) var<uniform> uniforms: Uniforms;

// Catmull-Rom spline for sharp interpolation
fn catmullRom(x: f32) -> f32 {
  let ax = abs(x);
  if (ax < 1.0) {
    return 1.5 * ax * ax * ax - 2.5 * ax * ax + 1.0;
  } else if (ax < 2.0) {
    return -0.5 * ax * ax * ax + 2.5 * ax * ax - 4.0 * ax + 2.0;
  }
  return 0.0;
}

// Lanczos-3 kernel for high-quality interpolation
fn lanczos3(x: f32) -> f32 {
  let ax = abs(x);
  if (ax < 0.0001) {
    return 1.0;
  }
  if (ax >= 3.0) {
    return 0.0;
  }
  let pix = 3.14159265359 * ax;
  return (sin(pix) / pix) * (sin(pix / 3.0) / (pix / 3.0));
}

// Sobel edge detection
fn detectEdge(uv: vec2<f32>, texelSize: vec2<f32>) -> f32 {
  // Sample 3x3 neighborhood
  let tl = textureSampleLevel(inputTexture, texSampler, uv + vec2<f32>(-1.0, -1.0) * texelSize, 0.0).rgb;
  let tc = textureSampleLevel(inputTexture, texSampler, uv + vec2<f32>( 0.0, -1.0) * texelSize, 0.0).rgb;
  let tr = textureSampleLevel(inputTexture, texSampler, uv + vec2<f32>( 1.0, -1.0) * texelSize, 0.0).rgb;
  let ml = textureSampleLevel(inputTexture, texSampler, uv + vec2<f32>(-1.0,  0.0) * texelSize, 0.0).rgb;
  let mr = textureSampleLevel(inputTexture, texSampler, uv + vec2<f32>( 1.0,  0.0) * texelSize, 0.0).rgb;
  let bl = textureSampleLevel(inputTexture, texSampler, uv + vec2<f32>(-1.0,  1.0) * texelSize, 0.0).rgb;
  let bc = textureSampleLevel(inputTexture, texSampler, uv + vec2<f32>( 0.0,  1.0) * texelSize, 0.0).rgb;
  let br = textureSampleLevel(inputTexture, texSampler, uv + vec2<f32>( 1.0,  1.0) * texelSize, 0.0).rgb;

  // Convert to luminance
  let lumTL = dot(tl, vec3<f32>(0.299, 0.587, 0.114));
  let lumTC = dot(tc, vec3<f32>(0.299, 0.587, 0.114));
  let lumTR = dot(tr, vec3<f32>(0.299, 0.587, 0.114));
  let lumML = dot(ml, vec3<f32>(0.299, 0.587, 0.114));
  let lumMR = dot(mr, vec3<f32>(0.299, 0.587, 0.114));
  let lumBL = dot(bl, vec3<f32>(0.299, 0.587, 0.114));
  let lumBC = dot(bc, vec3<f32>(0.299, 0.587, 0.114));
  let lumBR = dot(br, vec3<f32>(0.299, 0.587, 0.114));

  // Sobel operators
  let gx = -lumTL - 2.0 * lumML - lumBL + lumTR + 2.0 * lumMR + lumBR;
  let gy = -lumTL - 2.0 * lumTC - lumTR + lumBL + 2.0 * lumBC + lumBR;

  return sqrt(gx * gx + gy * gy);
}

// Adaptive unsharp mask based on local contrast
fn adaptiveSharpening(color: vec3<f32>, uv: vec2<f32>, texelSize: vec2<f32>, intensity: f32) -> vec3<f32> {
  // Sample neighbors for unsharp mask
  let up = textureSampleLevel(inputTexture, texSampler, uv + vec2<f32>(0.0, -1.0) * texelSize, 0.0).rgb;
  let down = textureSampleLevel(inputTexture, texSampler, uv + vec2<f32>(0.0, 1.0) * texelSize, 0.0).rgb;
  let left = textureSampleLevel(inputTexture, texSampler, uv + vec2<f32>(-1.0, 0.0) * texelSize, 0.0).rgb;
  let right = textureSampleLevel(inputTexture, texSampler, uv + vec2<f32>(1.0, 0.0) * texelSize, 0.0).rgb;

  // Laplacian for detail detection
  let laplacian = 4.0 * color - up - down - left - right;

  // Apply adaptive sharpening (stronger at edges)
  let edge = detectEdge(uv, texelSize);
  let adaptiveIntensity = intensity * (0.5 + 0.5 * smoothstep(0.02, 0.15, edge));

  return color + laplacian * adaptiveIntensity;
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let outputDims = vec2<u32>(u32(uniforms.outputWidth), u32(uniforms.outputHeight));

  if (global_id.x >= outputDims.x || global_id.y >= outputDims.y) {
    return;
  }

  // Calculate position in input texture
  let scaleX = uniforms.inputWidth / uniforms.outputWidth;
  let scaleY = uniforms.inputHeight / uniforms.outputHeight;

  let srcX = (f32(global_id.x) + 0.5) * scaleX - 0.5;
  let srcY = (f32(global_id.y) + 0.5) * scaleY - 0.5;

  // Integer source pixel
  let srcXi = i32(floor(srcX));
  let srcYi = i32(floor(srcY));

  // Fraction for interpolation
  let fracX = srcX - floor(srcX);
  let fracY = srcY - floor(srcY);

  // Texel size for sampling
  let texelSize = vec2<f32>(1.0 / uniforms.inputWidth, 1.0 / uniforms.inputHeight);

  // Use 6x6 sampling for Lanczos-3 or 4x4 for Catmull-Rom
  var color = vec4<f32>(0.0);
  var totalWeight = 0.0;

  // 6x6 Lanczos sampling for maximum quality
  for (var j = -2; j <= 3; j++) {
    for (var i = -2; i <= 3; i++) {
      let px = clamp(srcXi + i, 0, i32(uniforms.inputWidth) - 1);
      let py = clamp(srcYi + j, 0, i32(uniforms.inputHeight) - 1);

      let uv = vec2<f32>(f32(px) + 0.5, f32(py) + 0.5) / vec2<f32>(uniforms.inputWidth, uniforms.inputHeight);
      let sample = textureSampleLevel(inputTexture, texSampler, uv, 0.0);

      // Use Lanczos-3 weights
      let weightX = lanczos3(f32(i) - fracX);
      let weightY = lanczos3(f32(j) - fracY);
      let weight = weightX * weightY;

      color += sample * weight;
      totalWeight += weight;
    }
  }

  // Normalize
  if (totalWeight > 0.0) {
    color = color / totalWeight;
  }

  // Apply edge-aware sharpening
  let centerUV = vec2<f32>(srcX + 0.5, srcY + 0.5) / vec2<f32>(uniforms.inputWidth, uniforms.inputHeight);
  let sharpened = adaptiveSharpening(color.rgb, centerUV, texelSize, uniforms.sharpeningIntensity);

  // Detect edges for detail enhancement
  let edgeStrength = detectEdge(centerUV, texelSize);

  // Apply edge enhancement only where edges are detected
  var finalColor = sharpened;
  if (edgeStrength > uniforms.edgeThreshold) {
    // Slight contrast boost at edges for definition
    let gray = dot(finalColor, vec3<f32>(0.299, 0.587, 0.114));
    let contrast = (finalColor - vec3<f32>(gray)) * 1.1 + vec3<f32>(gray);
    finalColor = mix(finalColor, contrast, smoothstep(uniforms.edgeThreshold, uniforms.edgeThreshold + 0.1, edgeStrength) * 0.3);
  }

  // Clamp final values
  finalColor = clamp(finalColor, vec3<f32>(0.0), vec3<f32>(1.0));

  textureStore(outputTexture, vec2<i32>(global_id.xy), vec4<f32>(finalColor, 1.0));
}
`;

// Lanczos-only shader (lighter alternative to super-resolution)
const lanczosUpscaleShader = `
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

fn lanczos3(x: f32) -> f32 {
  let ax = abs(x);
  if (ax < 0.0001) { return 1.0; }
  if (ax >= 3.0) { return 0.0; }
  let pix = 3.14159265359 * ax;
  return (sin(pix) / pix) * (sin(pix / 3.0) / (pix / 3.0));
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let outputDims = vec2<u32>(u32(uniforms.outputWidth), u32(uniforms.outputHeight));

  if (global_id.x >= outputDims.x || global_id.y >= outputDims.y) {
    return;
  }

  let scaleX = uniforms.inputWidth / uniforms.outputWidth;
  let scaleY = uniforms.inputHeight / uniforms.outputHeight;

  let srcX = (f32(global_id.x) + 0.5) * scaleX - 0.5;
  let srcY = (f32(global_id.y) + 0.5) * scaleY - 0.5;

  let srcXi = i32(floor(srcX));
  let srcYi = i32(floor(srcY));

  let fracX = srcX - floor(srcX);
  let fracY = srcY - floor(srcY);

  var color = vec4<f32>(0.0);
  var totalWeight = 0.0;

  for (var j = -2; j <= 3; j++) {
    for (var i = -2; i <= 3; i++) {
      let px = clamp(srcXi + i, 0, i32(uniforms.inputWidth) - 1);
      let py = clamp(srcYi + j, 0, i32(uniforms.inputHeight) - 1);

      let uv = vec2<f32>(f32(px) + 0.5, f32(py) + 0.5) / vec2<f32>(uniforms.inputWidth, uniforms.inputHeight);
      let sample = textureSampleLevel(inputTexture, texSampler, uv, 0.0);

      let weightX = lanczos3(f32(i) - fracX);
      let weightY = lanczos3(f32(j) - fracY);
      let weight = weightX * weightY;

      color += sample * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight > 0.0) {
    color = color / totalWeight;
  }

  color = clamp(color, vec4<f32>(0.0), vec4<f32>(1.0));
  textureStore(outputTexture, vec2<i32>(global_id.xy), color);
}
`;

// Cache para pipelines compilados
let upscalePipeline: GPUComputePipeline | null = null;
let downscalePipeline: GPUComputePipeline | null = null;
let superResPipeline: GPUComputePipeline | null = null;
let lanczosPipeline: GPUComputePipeline | null = null;

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

// ============================================================
// SUPER-RESOLUTION UPSCALING WITH WEBGPU
// ============================================================

/**
 * Perform super-resolution upscaling with edge-aware enhancement
 * Uses advanced shaders for higher quality than basic bicubic
 */
async function performSuperResolutionUpscale(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  sharpeningIntensity: number = 0.35,
  edgeEnhancement: boolean = true
): Promise<string | null> {
  const support = await initWebGPU();
  if (!support.available || !support.device) return null;

  const device = support.device;

  try {
    // Create source canvas to get ImageData
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = img.width;
    srcCanvas.height = img.height;
    const srcCtx = srcCanvas.getContext('2d')!;
    srcCtx.drawImage(img, 0, 0);
    const srcImageData = srcCtx.getImageData(0, 0, img.width, img.height);

    // Create textures
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

    // Upload image
    device.queue.writeTexture(
      { texture: inputTexture },
      srcImageData.data,
      { bytesPerRow: img.width * 4 },
      [img.width, img.height]
    );

    // Create sampler with linear filtering
    const sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });

    // Create uniform buffer (8 floats = 32 bytes)
    const uniformBuffer = device.createBuffer({
      size: 32,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(
      uniformBuffer,
      0,
      new Float32Array([
        img.width,
        img.height,
        targetWidth,
        targetHeight,
        sharpeningIntensity,
        edgeEnhancement ? 0.05 : 1.0, // Edge threshold (1.0 = disabled)
        0, 0 // Padding
      ])
    );

    // Create pipeline if not cached
    if (!superResPipeline) {
      const shaderModule = device.createShaderModule({ code: superResolutionShader });
      superResPipeline = device.createComputePipeline({
        layout: 'auto',
        compute: { module: shaderModule, entryPoint: 'main' },
      });
    }

    // Create bind group
    const bindGroup = device.createBindGroup({
      layout: superResPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: inputTexture.createView() },
        { binding: 1, resource: outputTexture.createView() },
        { binding: 2, resource: sampler },
        { binding: 3, resource: { buffer: uniformBuffer } },
      ],
    });

    // Execute compute shader
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(superResPipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatchWorkgroups(
      Math.ceil(targetWidth / 8),
      Math.ceil(targetHeight / 8)
    );
    passEncoder.end();

    // Read result
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

    // Cleanup GPU resources
    inputTexture.destroy();
    outputTexture.destroy();
    readBuffer.destroy();

    // Convert to canvas and then to dataUrl
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = targetWidth;
    resultCanvas.height = targetHeight;
    const resultCtx = resultCanvas.getContext('2d')!;
    const resultImageData = new ImageData(resultData, targetWidth, targetHeight);
    resultCtx.putImageData(resultImageData, 0, 0);

    return resultCanvas.toDataURL('image/jpeg', 0.94);
  } catch (error) {
    console.error('Error in super-resolution upscale:', error);
    return null;
  }
}

/**
 * Perform Lanczos-3 upscaling (high quality, lighter than super-res)
 */
async function performLanczosUpscale(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
): Promise<string | null> {
  const support = await initWebGPU();
  if (!support.available || !support.device) return null;

  const device = support.device;

  try {
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = img.width;
    srcCanvas.height = img.height;
    const srcCtx = srcCanvas.getContext('2d')!;
    srcCtx.drawImage(img, 0, 0);
    const srcImageData = srcCtx.getImageData(0, 0, img.width, img.height);

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

    device.queue.writeTexture(
      { texture: inputTexture },
      srcImageData.data,
      { bytesPerRow: img.width * 4 },
      [img.width, img.height]
    );

    const sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });

    const uniformBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(
      uniformBuffer,
      0,
      new Float32Array([img.width, img.height, targetWidth, targetHeight])
    );

    if (!lanczosPipeline) {
      const shaderModule = device.createShaderModule({ code: lanczosUpscaleShader });
      lanczosPipeline = device.createComputePipeline({
        layout: 'auto',
        compute: { module: shaderModule, entryPoint: 'main' },
      });
    }

    const bindGroup = device.createBindGroup({
      layout: lanczosPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: inputTexture.createView() },
        { binding: 1, resource: outputTexture.createView() },
        { binding: 2, resource: sampler },
        { binding: 3, resource: { buffer: uniformBuffer } },
      ],
    });

    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(lanczosPipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatchWorkgroups(
      Math.ceil(targetWidth / 8),
      Math.ceil(targetHeight / 8)
    );
    passEncoder.end();

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

    inputTexture.destroy();
    outputTexture.destroy();
    readBuffer.destroy();

    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = targetWidth;
    resultCanvas.height = targetHeight;
    const resultCtx = resultCanvas.getContext('2d')!;
    const resultImageData = new ImageData(resultData, targetWidth, targetHeight);
    resultCtx.putImageData(resultImageData, 0, 0);

    return resultCanvas.toDataURL('image/jpeg', 0.93);
  } catch (error) {
    console.error('Error in Lanczos upscale:', error);
    return null;
  }
}

// ============================================================
// UNIFIED UPSCALING API WITH ALGORITHM SELECTION
// ============================================================

export interface AdvancedUpscaleOptions {
  targetDimension: number;
  algorithm?: UpscaleAlgorithm;
  sharpeningIntensity?: number;
  edgeEnhancement?: boolean;
}

/**
 * Advanced upscaling with algorithm selection
 * Automatically selects the best algorithm based on config or falls back to simpler methods
 */
export async function upscaleImageAdvanced(
  dataUrl: string,
  options: AdvancedUpscaleOptions
): Promise<string | null> {
  const {
    targetDimension,
    algorithm = 'superres',
    sharpeningIntensity = 0.35,
    edgeEnhancement = true
  } = options;

  const support = await initWebGPU();

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      // Calculate new dimensions maintaining aspect ratio
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
        // Image is already large enough
        resolve(dataUrl);
        return;
      }

      // If WebGPU not available, use canvas fallback
      if (!support.available || !support.device) {
        console.log('WebGPU unavailable, using Canvas fallback');
        const result = await upscaleWithCanvas(dataUrl, targetDimension);
        resolve(result);
        return;
      }

      let result: string | null = null;

      // Try requested algorithm, fallback to simpler ones if it fails
      switch (algorithm) {
        case 'superres':
          result = await performSuperResolutionUpscale(img, newWidth, newHeight, sharpeningIntensity, edgeEnhancement);
          if (!result) {
            console.log('Super-res failed, falling back to Lanczos');
            result = await performLanczosUpscale(img, newWidth, newHeight);
          }
          break;

        case 'lanczos':
          result = await performLanczosUpscale(img, newWidth, newHeight);
          break;

        case 'bicubic':
        default:
          result = await performWebGPUUpscale(img, newWidth, newHeight);
          break;
      }

      // Final fallback to canvas if all GPU methods fail
      if (!result) {
        result = await upscaleWithCanvas(dataUrl, targetDimension);
      }

      resolve(result || dataUrl);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// ============================================================
// PRESET MANAGEMENT FUNCTIONS
// ============================================================

/**
 * Apply a preset configuration
 */
export function applyOptimizationPreset(preset: OptimizationPreset): ImageOptimizationConfig {
  activePreset = preset;
  return { ...OPTIMIZATION_PRESETS[preset] };
}

/**
 * Get the current active preset name
 */
export function getActivePreset(): OptimizationPreset | 'custom' {
  return activePreset;
}

/**
 * Set the active preset to custom (when user modifies individual settings)
 */
export function setCustomPreset(): void {
  activePreset = 'custom';
}

/**
 * Get preset description for UI
 */
export function getPresetDescription(preset: OptimizationPreset): string {
  const descriptions: Record<OptimizationPreset, string> = {
    ultra: 'Máximo ahorro de tokens (~90%). Entrada 256px, salida 2048px. Ideal para borradores.',
    high: 'Alto ahorro (~80%). Entrada 384px, salida 1536px. Buen balance calidad/costo.',
    balanced: 'Ahorro moderado (~65%). Entrada 512px, salida 1024px. Uso estándar.',
    quality: 'Mínima compresión (~40%). Entrada 768px. Mejor comprensión por la IA.',
  };
  return descriptions[preset];
}

/**
 * Estimate cost savings for a given preset compared to no optimization
 */
export function estimatePresetSavings(
  originalWidth: number,
  originalHeight: number,
  preset: OptimizationPreset
): { inputTokens: number; originalTokens: number; savingsPercent: number; outputResolution: string } {
  const config = OPTIMIZATION_PRESETS[preset];
  const { originalTokens, optimizedTokens, savings } = estimateTokenSavings(
    originalWidth,
    originalHeight,
    config.maxInputDimension
  );

  // Calculate output resolution
  let outWidth = originalWidth;
  let outHeight = originalHeight;
  if (outWidth > outHeight) {
    outWidth = config.targetOutputDimension;
    outHeight = Math.round((originalHeight / originalWidth) * config.targetOutputDimension);
  } else {
    outHeight = config.targetOutputDimension;
    outWidth = Math.round((originalWidth / originalHeight) * config.targetOutputDimension);
  }

  return {
    inputTokens: optimizedTokens,
    originalTokens,
    savingsPercent: savings,
    outputResolution: `${outWidth}x${outHeight}`,
  };
}

// ============================================================
// AUTOMATIC OPTIMIZATION PIPELINE
// ============================================================

export interface OptimizationResult {
  optimizedDataUrl: string;
  originalDimensions: { width: number; height: number };
  optimizedDimensions: { width: number; height: number };
  tokensSaved: number;
  savingsPercent: number;
  processingTimeMs: number;
}

/**
 * Complete optimization pipeline: downscale for API, then upscale result
 * This is the main entry point for automatic image optimization
 */
export async function optimizeAndUpscaleImage(
  inputDataUrl: string,
  config: ImageOptimizationConfig
): Promise<OptimizationResult> {
  const startTime = performance.now();

  // Get original dimensions
  const originalDimensions = await getImageDimensions(inputDataUrl);

  // Downscale for API (token savings)
  const downscaled = await downscaleImage(
    inputDataUrl,
    config.maxInputDimension,
    config.compressionQuality
  );

  // Get downscaled dimensions
  const downscaledDimensions = await getImageDimensions(downscaled);

  // Calculate token savings
  const { originalTokens, optimizedTokens, savings } = estimateTokenSavings(
    originalDimensions.width,
    originalDimensions.height,
    config.maxInputDimension
  );

  // Upscale if enabled
  let finalDataUrl = downscaled;
  let finalDimensions = downscaledDimensions;

  if (config.enableUpscaling) {
    const upscaled = await upscaleImageAdvanced(downscaled, {
      targetDimension: config.targetOutputDimension,
      algorithm: config.upscaleAlgorithm,
      sharpeningIntensity: config.sharpeningIntensity,
      edgeEnhancement: config.edgeEnhancement,
    });

    if (upscaled) {
      finalDataUrl = upscaled;
      finalDimensions = await getImageDimensions(upscaled);
    }
  }

  const processingTimeMs = performance.now() - startTime;

  return {
    optimizedDataUrl: finalDataUrl,
    originalDimensions,
    optimizedDimensions: finalDimensions,
    tokensSaved: originalTokens - optimizedTokens,
    savingsPercent: savings,
    processingTimeMs,
  };
}

/**
 * Quick upscale for generated images (after receiving from API)
 * Uses current config settings
 */
export async function upscaleGeneratedImage(
  generatedImageUrl: string,
  config: ImageOptimizationConfig
): Promise<string> {
  if (!config.enableUpscaling) {
    return generatedImageUrl;
  }

  const upscaled = await upscaleImageAdvanced(generatedImageUrl, {
    targetDimension: config.targetOutputDimension,
    algorithm: config.upscaleAlgorithm,
    sharpeningIntensity: config.sharpeningIntensity,
    edgeEnhancement: config.edgeEnhancement,
  });

  return upscaled || generatedImageUrl;
}
