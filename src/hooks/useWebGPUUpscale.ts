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

export function useWebGPUUpscale(
  imageSrc: string,
  options: UpscaleOptions = {}
) {
  const { scaleFactor = 2, sharpness = 0.5 } = options;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<UpscaleState>({
    isLoading: true,
    isSupported: true,
    error: null,
  });

  const fallbackUpscale = useCallback(async (
    canvas: HTMLCanvasElement,
    img: HTMLImageElement
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const targetWidth = Math.round(img.width * scaleFactor);
    const targetHeight = Math.round(img.height * scaleFactor);

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Use high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw scaled image
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // Apply sharpening via convolution
    if (sharpness > 0) {
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

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error('No GPU adapter found');
    }

    const device = await adapter.requestDevice();

    const targetWidth = Math.round(img.width * scaleFactor);
    const targetHeight = Math.round(img.height * scaleFactor);

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

    // Create texture from image
    const imageBitmap = await createImageBitmap(img);
    const texture = device.createTexture({
      size: [imageBitmap.width, imageBitmap.height],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING |
             GPUTextureUsage.COPY_DST |
             GPUTextureUsage.RENDER_ATTACHMENT,
    });

    device.queue.copyExternalImageToTexture(
      { source: imageBitmap },
      { texture },
      [imageBitmap.width, imageBitmap.height]
    );

    // Create sampler with linear filtering
    const sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'linear',
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

    // Cleanup
    texture.destroy();
    uniformBuffer.destroy();
  }, [scaleFactor, sharpness]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;

    setState({ isLoading: true, isSupported: true, error: null });

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = async () => {
      try {
        await webgpuUpscale(canvas, img);
        setState({ isLoading: false, isSupported: true, error: null });
      } catch (err) {
        console.warn('WebGPU upscale failed, using fallback:', err);
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
    };

    img.onerror = () => {
      setState({ isLoading: false, isSupported: false, error: 'Failed to load image' });
    };

    img.src = imageSrc;
  }, [imageSrc, webgpuUpscale, fallbackUpscale]);

  return { canvasRef, ...state };
}
