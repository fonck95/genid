import { useEffect, useRef, useState, useCallback } from 'react';

interface UpscaleOptions {
  scaleFactor?: number;
  sharpness?: number;
}

interface UpscaleState {
  isLoading: boolean;
  isSupported: boolean;
  error: string | null;
}

// WebGPU shader for bicubic upscaling with sharpening
const shaderCode = `
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) texCoord: vec2f,
};

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  var positions = array<vec2f, 6>(
    vec2f(-1.0, -1.0),
    vec2f(1.0, -1.0),
    vec2f(-1.0, 1.0),
    vec2f(-1.0, 1.0),
    vec2f(1.0, -1.0),
    vec2f(1.0, 1.0)
  );

  var texCoords = array<vec2f, 6>(
    vec2f(0.0, 1.0),
    vec2f(1.0, 1.0),
    vec2f(0.0, 0.0),
    vec2f(0.0, 0.0),
    vec2f(1.0, 1.0),
    vec2f(1.0, 0.0)
  );

  var output: VertexOutput;
  output.position = vec4f(positions[vertexIndex], 0.0, 1.0);
  output.texCoord = texCoords[vertexIndex];
  return output;
}

@group(0) @binding(0) var inputTexture: texture_2d<f32>;
@group(0) @binding(1) var texSampler: sampler;

struct Uniforms {
  sharpness: f32,
  texelSize: vec2f,
  _padding: f32,
};
@group(0) @binding(2) var<uniform> uniforms: Uniforms;

// Lanczos weight function for high-quality upscaling
fn lanczos(x: f32, a: f32) -> f32 {
  if (abs(x) < 0.0001) {
    return 1.0;
  }
  if (abs(x) >= a) {
    return 0.0;
  }
  let pi = 3.14159265359;
  let pix = pi * x;
  return (a * sin(pix) * sin(pix / a)) / (pix * pix);
}

// Sharpen using unsharp mask
fn sharpen(color: vec3f, texCoord: vec2f) -> vec3f {
  let offset = uniforms.texelSize;

  let center = color;
  let top = textureSample(inputTexture, texSampler, texCoord + vec2f(0.0, -offset.y)).rgb;
  let bottom = textureSample(inputTexture, texSampler, texCoord + vec2f(0.0, offset.y)).rgb;
  let left = textureSample(inputTexture, texSampler, texCoord + vec2f(-offset.x, 0.0)).rgb;
  let right = textureSample(inputTexture, texSampler, texCoord + vec2f(offset.x, 0.0)).rgb;

  let blur = (top + bottom + left + right) * 0.25;
  let sharpened = center + (center - blur) * uniforms.sharpness;

  return clamp(sharpened, vec3f(0.0), vec3f(1.0));
}

@fragment
fn fragmentMain(@location(0) texCoord: vec2f) -> @location(0) vec4f {
  // Sample with high-quality filtering
  var color = textureSample(inputTexture, texSampler, texCoord).rgb;

  // Apply sharpening
  color = sharpen(color, texCoord);

  // Slight contrast enhancement
  color = (color - 0.5) * 1.05 + 0.5;
  color = clamp(color, vec3f(0.0), vec3f(1.0));

  return vec4f(color, 1.0);
}
`;

// Check if running in a secure context (required for WebGPU)
const isSecureContext = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.isSecureContext === true;
};

// Check WebGPU availability
const checkWebGPUSupport = async (): Promise<boolean> => {
  if (!isSecureContext()) {
    console.warn('WebGPU requires a secure context (HTTPS)');
    return false;
  }

  if (!navigator.gpu) {
    console.warn('WebGPU is not supported in this browser');
    return false;
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      console.warn('No WebGPU adapter available');
      return false;
    }
    return true;
  } catch (err) {
    console.warn('WebGPU adapter request failed:', err);
    return false;
  }
};

export function useWebGPUUpscale(
  imageSrc: string,
  options: UpscaleOptions = {}
) {
  const { scaleFactor = 2, sharpness = 0.5 } = options;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const deviceRef = useRef<GPUDevice | null>(null);
  const [state, setState] = useState<UpscaleState>({
    isLoading: true,
    isSupported: true,
    error: null,
  });

  // High-quality Canvas 2D fallback
  const fallbackUpscale = useCallback(async (
    canvas: HTMLCanvasElement,
    img: HTMLImageElement
  ) => {
    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
    });
    if (!ctx) {
      throw new Error('Could not get 2D context');
    }

    const targetWidth = Math.round(img.naturalWidth * scaleFactor);
    const targetHeight = Math.round(img.naturalHeight * scaleFactor);

    // Ensure valid dimensions
    if (targetWidth <= 0 || targetHeight <= 0) {
      throw new Error(`Invalid dimensions: ${targetWidth}x${targetHeight}`);
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Use high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw scaled image
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // Apply sharpening via convolution
    if (sharpness > 0) {
      try {
        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const data = imageData.data;
        const tempData = new Uint8ClampedArray(data);

        const kernel = [
          0, -sharpness, 0,
          -sharpness, 1 + 4 * sharpness, -sharpness,
          0, -sharpness, 0
        ];

        for (let y = 1; y < targetHeight - 1; y++) {
          for (let x = 1; x < targetWidth - 1; x++) {
            for (let c = 0; c < 3; c++) {
              let sum = 0;
              for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                  const idx = ((y + ky) * targetWidth + (x + kx)) * 4 + c;
                  sum += tempData[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
                }
              }
              const idx = (y * targetWidth + x) * 4 + c;
              data[idx] = Math.max(0, Math.min(255, sum));
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);
      } catch (sharpenErr) {
        // Sharpening failed (possibly due to tainted canvas), but base upscale succeeded
        console.warn('Sharpening failed, using unsharpened image:', sharpenErr);
      }
    }
  }, [scaleFactor, sharpness]);

  const webgpuUpscale = useCallback(async (
    canvas: HTMLCanvasElement,
    img: HTMLImageElement
  ) => {
    // Check WebGPU support
    if (!navigator.gpu) {
      throw new Error('WebGPU not supported');
    }

    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance',
    });
    if (!adapter) {
      throw new Error('No GPU adapter found');
    }

    const device = await adapter.requestDevice();
    deviceRef.current = device;

    // Listen for device loss
    device.lost.then((info) => {
      console.warn('WebGPU device lost:', info.message);
      deviceRef.current = null;
    });

    const targetWidth = Math.round(img.naturalWidth * scaleFactor);
    const targetHeight = Math.round(img.naturalHeight * scaleFactor);

    // Ensure valid dimensions
    if (targetWidth <= 0 || targetHeight <= 0) {
      throw new Error(`Invalid dimensions: ${targetWidth}x${targetHeight}`);
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext('webgpu');
    if (!context) {
      throw new Error('WebGPU context not available');
    }

    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
      device,
      format,
      alphaMode: 'premultiplied',
    });

    // Create shader module
    const shaderModule = device.createShaderModule({
      code: shaderCode,
    });

    // Check for shader compilation errors
    const compilationInfo = await shaderModule.getCompilationInfo();
    const errors = compilationInfo.messages.filter(m => m.type === 'error');
    if (errors.length > 0) {
      throw new Error(`Shader compilation error: ${errors[0].message}`);
    }

    // Create texture from image
    const imageBitmap = await createImageBitmap(img, {
      premultiplyAlpha: 'premultiply',
      colorSpaceConversion: 'default',
    });

    const texture = device.createTexture({
      size: [imageBitmap.width, imageBitmap.height],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING |
             GPUTextureUsage.COPY_DST |
             GPUTextureUsage.RENDER_ATTACHMENT,
    });

    device.queue.copyExternalImageToTexture(
      { source: imageBitmap, flipY: false },
      { texture },
      [imageBitmap.width, imageBitmap.height]
    );

    // Create sampler with linear filtering
    const sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });

    // Create uniform buffer
    const uniformBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const uniformData = new Float32Array([
      sharpness,
      1.0 / targetWidth,
      1.0 / targetHeight,
      0, // padding
    ]);
    device.queue.writeBuffer(uniformBuffer, 0, uniformData);

    // Create bind group layout
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
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
      ],
    });

    // Create bind group
    const bindGroup = device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: texture.createView() },
        { binding: 1, resource: sampler },
        { binding: 2, resource: { buffer: uniformBuffer } },
      ],
    });

    // Create render pipeline
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
        targets: [{ format }],
      },
      primitive: {
        topology: 'triangle-list',
      },
    });

    // Render
    const commandEncoder = device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
        loadOp: 'clear',
        storeOp: 'store',
      }],
    });

    renderPass.setPipeline(pipeline);
    renderPass.setBindGroup(0, bindGroup);
    renderPass.draw(6);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);

    // Wait for GPU work to complete
    await device.queue.onSubmittedWorkDone();

    // Cleanup
    texture.destroy();
    uniformBuffer.destroy();
    imageBitmap.close();
  }, [scaleFactor, sharpness]);

  // Load image handling - tries without CORS first, falls back if needed
  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      // First try: Load without crossOrigin for same-origin images
      const img = new Image();

      const handleLoad = () => {
        // Check if image has valid dimensions
        if (img.naturalWidth === 0 || img.naturalHeight === 0) {
          reject(new Error('Image loaded with invalid dimensions'));
          return;
        }
        resolve(img);
      };

      const handleError = () => {
        // If failed, might be a cross-origin image - try with CORS
        if (!img.crossOrigin) {
          const corsImg = new Image();
          corsImg.crossOrigin = 'anonymous';
          corsImg.onload = () => {
            if (corsImg.naturalWidth === 0 || corsImg.naturalHeight === 0) {
              reject(new Error('Image loaded with invalid dimensions'));
              return;
            }
            resolve(corsImg);
          };
          corsImg.onerror = () => {
            reject(new Error(`Failed to load image: ${src}`));
          };
          corsImg.src = src;
        } else {
          reject(new Error(`Failed to load image: ${src}`));
        }
      };

      img.onload = handleLoad;
      img.onerror = handleError;

      // For data URLs or blob URLs, load directly
      if (src.startsWith('data:') || src.startsWith('blob:')) {
        img.src = src;
      } else {
        // For relative URLs or same-origin, try loading directly
        // For cross-origin URLs, set crossOrigin
        try {
          const url = new URL(src, window.location.href);
          if (url.origin !== window.location.origin) {
            img.crossOrigin = 'anonymous';
          }
        } catch {
          // Invalid URL, just try loading
        }
        img.src = src;
      }
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) {
      setState({ isLoading: false, isSupported: false, error: 'No canvas or image source' });
      return;
    }

    let isMounted = true;

    const processImage = async () => {
      setState({ isLoading: true, isSupported: true, error: null });

      try {
        // Load image first
        const img = await loadImage(imageSrc);

        if (!isMounted) return;

        // Check WebGPU support
        const webgpuSupported = await checkWebGPUSupport();

        if (webgpuSupported) {
          try {
            await webgpuUpscale(canvas, img);
            if (isMounted) {
              setState({ isLoading: false, isSupported: true, error: null });
            }
            return;
          } catch (err) {
            console.warn('WebGPU upscale failed, using fallback:', err);
          }
        }

        // Fallback to Canvas 2D
        if (isMounted) {
          try {
            await fallbackUpscale(canvas, img);
            setState({ isLoading: false, isSupported: false, error: null });
          } catch (fallbackErr) {
            setState({
              isLoading: false,
              isSupported: false,
              error: fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error'
            });
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Image processing failed:', err);
          setState({
            isLoading: false,
            isSupported: false,
            error: err instanceof Error ? err.message : 'Failed to process image'
          });
        }
      }
    };

    processImage();

    return () => {
      isMounted = false;
      // Cleanup GPU device on unmount
      if (deviceRef.current) {
        deviceRef.current.destroy();
        deviceRef.current = null;
      }
    };
  }, [imageSrc, webgpuUpscale, fallbackUpscale, loadImage]);

  return { canvasRef, ...state };
}
