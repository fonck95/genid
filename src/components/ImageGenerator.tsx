import { useState, useRef, useEffect } from 'react';
import type { Identity, AttachedImage } from '../types';
import {
  generateImageWithIdentity,
  generateWithAttachedImages,
  setOptimizationConfig,
  getOptimizationConfig,
  applyPreset,
  getCurrentPreset,
} from '../services/gemini';
import { saveGeneratedImage } from '../services/identityStore';
import { processDataUrlWithWebGPU, initWebGPU, isWebGPUAvailable } from '../services/webgpu';
import {
  upscaleImageAdvanced,
  estimateTokenSavings,
  getImageDimensions,
  getPresetDescription,
  type OptimizationPreset,
  type UpscaleAlgorithm,
} from '../services/imageOptimizer';

interface Props {
  deviceId: string;
  selectedIdentity: Identity | null;
  identities: Identity[];
  onImageGenerated: () => void;
  onCreateIdentity: () => void;
  onStartEditingThread?: (imageUrl: string, prompt: string, identityId?: string, identityName?: string) => void;
}

export function ImageGenerator({ deviceId, selectedIdentity, identities, onImageGenerated, onStartEditingThread }: Props) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedPrompt, setLastGeneratedPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [webgpuStatus, setWebgpuStatus] = useState<string>('Verificando...');
  const [useWebGPU, setUseWebGPU] = useState(true);
  const [webgpuBrightness, setWebgpuBrightness] = useState(0);
  const [webgpuContrast, setWebgpuContrast] = useState(1);
  const [webgpuSaturation, setWebgpuSaturation] = useState(1);
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);

  // Optimization settings
  const [showOptimizationSettings, setShowOptimizationSettings] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<OptimizationPreset | 'custom'>(getCurrentPreset());
  const [maxInputDimension, setMaxInputDimension] = useState(getOptimizationConfig().maxInputDimension);
  const [targetOutputDimension, setTargetOutputDimension] = useState(getOptimizationConfig().targetOutputDimension);
  const [enableUpscaling, setEnableUpscaling] = useState(getOptimizationConfig().enableUpscaling);
  const [upscaleAlgorithm, setUpscaleAlgorithm] = useState<UpscaleAlgorithm>(getOptimizationConfig().upscaleAlgorithm);
  const [sharpeningIntensity, setSharpeningIntensity] = useState(getOptimizationConfig().sharpeningIntensity);
  const [edgeEnhancement, setEdgeEnhancement] = useState(getOptimizationConfig().edgeEnhancement);
  const [tokenSavingsInfo, setTokenSavingsInfo] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  // Preset labels for UI
  const presetLabels: Record<OptimizationPreset, string> = {
    ultra: 'Ultra (máx. ahorro)',
    high: 'Alto ahorro',
    balanced: 'Balanceado',
    quality: 'Calidad',
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptAreaRef = useRef<HTMLDivElement>(null);

  // Update optimization config when settings change
  useEffect(() => {
    setOptimizationConfig({
      maxInputDimension,
      targetOutputDimension,
      enableUpscaling,
      upscaleAlgorithm,
      sharpeningIntensity,
      edgeEnhancement,
    });
  }, [maxInputDimension, targetOutputDimension, enableUpscaling, upscaleAlgorithm, sharpeningIntensity, edgeEnhancement]);

  // Handle preset change
  const handlePresetChange = (preset: OptimizationPreset) => {
    const config = applyPreset(preset);
    setSelectedPreset(preset);
    setMaxInputDimension(config.maxInputDimension);
    setTargetOutputDimension(config.targetOutputDimension);
    setEnableUpscaling(config.enableUpscaling);
    setUpscaleAlgorithm(config.upscaleAlgorithm);
    setSharpeningIntensity(config.sharpeningIntensity);
    setEdgeEnhancement(config.edgeEnhancement);
  };

  // Mark as custom when individual settings change
  const handleCustomSettingChange = () => {
    setSelectedPreset('custom');
  };

  // Calculate token savings when attached images change
  useEffect(() => {
    async function calculateSavings() {
      if (attachedImages.length === 0 && (!selectedIdentity || selectedIdentity.photos.length === 0)) {
        setTokenSavingsInfo(null);
        return;
      }

      let totalOriginal = 0;
      let totalOptimized = 0;

      // Calculate for attached images
      for (const img of attachedImages) {
        try {
          const dims = await getImageDimensions(img.dataUrl);
          const savings = estimateTokenSavings(dims.width, dims.height, maxInputDimension);
          totalOriginal += savings.originalTokens;
          totalOptimized += savings.optimizedTokens;
        } catch {
          // Ignore errors
        }
      }

      // Calculate for identity photos
      if (selectedIdentity) {
        for (const photo of selectedIdentity.photos.slice(0, 5)) {
          if (!photo.dataUrl.startsWith('http')) {
            try {
              const dims = await getImageDimensions(photo.dataUrl);
              const savings = estimateTokenSavings(dims.width, dims.height, maxInputDimension);
              totalOriginal += savings.originalTokens;
              totalOptimized += savings.optimizedTokens;
            } catch {
              // Ignore errors
            }
          }
        }
      }

      if (totalOriginal > 0) {
        const savingsPercent = Math.round(((totalOriginal - totalOptimized) / totalOriginal) * 100);
        setTokenSavingsInfo(`~${totalOptimized} tokens (ahorro: ${savingsPercent}%)`);
      }
    }

    calculateSavings();
  }, [attachedImages, selectedIdentity, maxInputDimension]);

  // Verificar WebGPU al montar
  useState(() => {
    initWebGPU().then((support) => {
      setWebgpuStatus(support.available ? 'WebGPU disponible' : 'WebGPU no disponible');
    });
  });

  // Manejar pegado de imágenes desde el portapapeles
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Solo permitir pegado si hay una identidad seleccionada
      if (!selectedIdentity) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      const imageItems: DataTransferItem[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          imageItems.push(items[i]);
        }
      }

      if (imageItems.length > 0) {
        e.preventDefault();

        for (const item of imageItems) {
          const file = item.getAsFile();
          if (file) {
            await addImageFromFile(file);
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [selectedIdentity]);

  const addImageFromFile = async (file: File): Promise<void> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;

        // Crear thumbnail
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = 100;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const scale = Math.max(size / img.width, size / img.height);
            const x = (size - img.width * scale) / 2;
            const y = (size - img.height * scale) / 2;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          }
          const thumbnail = canvas.toDataURL('image/jpeg', 0.7);

          const newImage: AttachedImage = {
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            dataUrl,
            thumbnail,
            mimeType: file.type || 'image/jpeg'
          };

          setAttachedImages(prev => [...prev, newImage]);
          resolve();
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      await addImageFromFile(files[i]);
    }

    // Limpiar el input para permitir seleccionar los mismos archivos de nuevo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachedImage = (id: string) => {
    setAttachedImages(prev => prev.filter(img => img.id !== id));
  };

  const clearAllAttachedImages = () => {
    setAttachedImages([]);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !selectedIdentity) return;

    setIsGenerating(true);
    setError(null);
    setPreviewImage(null);
    setProcessingStatus('Optimizando imagenes de entrada...');

    try {
      let imageUrl: string;

      setProcessingStatus('Generando imagen con IA...');

      // Si hay imágenes adjuntas, usar la función con imágenes adjuntas
      if (attachedImages.length > 0) {
        imageUrl = await generateWithAttachedImages(
          prompt,
          attachedImages,
          selectedIdentity.photos,
          selectedIdentity.name,
          selectedIdentity.description
        );
      } else if (selectedIdentity.photos.length > 0) {
        // Generar con identidad y fotos de referencia
        imageUrl = await generateImageWithIdentity(
          prompt,
          selectedIdentity.photos,
          selectedIdentity.name,
          selectedIdentity.description
        );
      } else {
        // Generar con imágenes adjuntas solamente
        imageUrl = await generateWithAttachedImages(prompt, attachedImages);
      }

      // Upscale con WebGPU si está habilitado (super-resolución avanzada)
      if (enableUpscaling && isWebGPUAvailable()) {
        const algorithmName = upscaleAlgorithm === 'superres' ? 'super-resolucion' :
                              upscaleAlgorithm === 'lanczos' ? 'Lanczos-3' : 'bicubico';
        setProcessingStatus(`Escalando imagen con WebGPU (${algorithmName})...`);
        const upscaled = await upscaleImageAdvanced(imageUrl, {
          targetDimension: targetOutputDimension,
          algorithm: upscaleAlgorithm,
          sharpeningIntensity,
          edgeEnhancement,
        });
        if (upscaled) {
          imageUrl = upscaled;
        }
      }

      // Aplicar procesamiento WebGPU de color si está habilitado
      if (useWebGPU && isWebGPUAvailable()) {
        const needsProcessing = webgpuBrightness !== 0 || webgpuContrast !== 1 || webgpuSaturation !== 1;
        if (needsProcessing) {
          setProcessingStatus('Aplicando ajustes de color...');
          const processed = await processDataUrlWithWebGPU(imageUrl, {
            brightness: webgpuBrightness,
            contrast: webgpuContrast,
            saturation: webgpuSaturation
          });
          if (processed) {
            imageUrl = processed;
          }
        }
      }

      setProcessingStatus('Guardando imagen...');

      // Guardar en IndexedDB con deviceId e identityId
      await saveGeneratedImage(
        deviceId,
        selectedIdentity.id,
        selectedIdentity.name,
        prompt,
        imageUrl
      );

      setPreviewImage(imageUrl);
      setLastGeneratedPrompt(prompt); // Guardar el prompt usado
      setAttachedImages([]); // Limpiar imágenes adjuntas después de generar
      setProcessingStatus('');
      onImageGenerated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setProcessingStatus('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!previewImage) return;

    const link = document.createElement('a');
    link.href = previewImage;
    link.download = `genid-${selectedIdentity?.name || 'imagen'}-${Date.now()}.png`;
    link.click();
  };

  // Si no hay identidades, mostrar mensaje para crear una
  if (identities.length === 0) {
    return (
      <div className="image-generator">
        <div className="no-identity-prompt">
          <div className="no-identity-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
              <line x1="12" y1="11" x2="12" y2="17"></line>
              <line x1="9" y1="14" x2="15" y2="14"></line>
            </svg>
          </div>
          <h3>Crea tu primera identidad</h3>
          <p>
            Para generar imagenes, primero necesitas crear una identidad.
            Una identidad es un perfil con fotos de referencia que permite
            generar imagenes manteniendo las caracteristicas faciales.
          </p>
          <div className="no-identity-steps">
            <div className="step">
              <span className="step-number">1</span>
              <span>Haz clic en "+ Nueva" en el panel de identidades</span>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <span>Asigna un nombre a tu identidad</span>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <span>Sube fotos de referencia (rostro visible)</span>
            </div>
            <div className="step">
              <span className="step-number">4</span>
              <span>Genera imagenes con esa identidad</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si hay identidades pero ninguna seleccionada
  if (!selectedIdentity) {
    return (
      <div className="image-generator">
        <div className="no-identity-prompt">
          <div className="no-identity-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <h3>Selecciona una identidad</h3>
          <p>
            Elige una identidad del panel lateral para comenzar a generar imagenes.
            Las imagenes generadas se asociaran a la identidad seleccionada.
          </p>
          <div className="identity-preview-list">
            {identities.slice(0, 3).map((identity) => (
              <div key={identity.id} className="identity-preview-card">
                {identity.photos[0] ? (
                  <img src={identity.photos[0].thumbnail} alt={identity.name} />
                ) : (
                  <div className="no-photo-preview">?</div>
                )}
                <span>{identity.name}</span>
              </div>
            ))}
            {identities.length > 3 && (
              <span className="more-identities">+{identities.length - 3} mas</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  const promptSuggestions = [
    `${selectedIdentity.name} en una playa tropical al atardecer`,
    `${selectedIdentity.name} como astronauta en el espacio`,
    `${selectedIdentity.name} en una oficina moderna trabajando`,
    `${selectedIdentity.name} cocinando en una cocina profesional`,
    `${selectedIdentity.name} practicando yoga en las montañas`,
    `${selectedIdentity.name} en un estudio de arte pintando`,
  ];

  const attachedImagesSuggestions = attachedImages.length > 0 ? [
    'Mejora la calidad y nitidez de estas imágenes',
    'Combina estas imágenes en una composición artística',
    'Aplica un estilo de pintura al óleo a estas imágenes',
    'Genera una variación creativa de estas imágenes',
  ] : [];

  const canGenerate = selectedIdentity &&
    (selectedIdentity.photos.length > 0 || attachedImages.length > 0) &&
    prompt.trim();

  return (
    <div className="image-generator">
      <div className="panel-header">
        <h2>Generar Imagen</h2>
        <span className={`webgpu-badge ${isWebGPUAvailable() ? 'available' : ''}`}>
          {webgpuStatus}
        </span>
      </div>

      <div className="identity-selected">
        <div className="selected-preview">
          {selectedIdentity.photos[0] && (
            <img src={selectedIdentity.photos[0].thumbnail} alt="" />
          )}
        </div>
        <span>Generando para: <strong>{selectedIdentity.name}</strong></span>
        {selectedIdentity.photos.length === 0 && attachedImages.length === 0 && (
          <span className="warning">Añade fotos a esta identidad o adjunta imagenes</span>
        )}
      </div>

      {/* Sección de imágenes adjuntas */}
      <div className="attached-images-section" ref={promptAreaRef}>
        <div className="attached-header">
          <span className="attached-label">
            Imagenes adjuntas {attachedImages.length > 0 && `(${attachedImages.length})`}
          </span>
          <div className="attached-actions">
            <button
              className="btn-attach"
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating}
              title="Subir imágenes"
            >
              + Adjuntar
            </button>
            {attachedImages.length > 0 && (
              <button
                className="btn-clear-all"
                onClick={clearAllAttachedImages}
                disabled={isGenerating}
                title="Limpiar todas"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {attachedImages.length > 0 ? (
          <div className="attached-thumbnails">
            {attachedImages.map((img) => (
              <div key={img.id} className="attached-thumbnail">
                <img src={img.thumbnail} alt="Adjunta" />
                <button
                  className="thumbnail-remove"
                  onClick={() => removeAttachedImage(img.id)}
                  disabled={isGenerating}
                  title="Eliminar"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="attached-placeholder">
            <span>Ctrl+V para pegar imagenes del portapapeles</span>
            <span>o haz clic en "Adjuntar" para subir</span>
          </div>
        )}
      </div>

      <div className="prompt-section">
        <textarea
          placeholder={
            attachedImages.length > 0
              ? 'Describe qué quieres hacer con las imágenes adjuntas...'
              : `Describe la situación para ${selectedIdentity.name}...`
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          disabled={isGenerating}
        />

        <div className="suggestions">
          {(attachedImages.length > 0 ? attachedImagesSuggestions : promptSuggestions).map((suggestion, i) => (
            <button
              key={i}
              className="suggestion-chip"
              onClick={() => setPrompt(suggestion)}
              disabled={isGenerating}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Optimization Settings Section */}
      <div className="optimization-section">
        <button
          className="optimization-toggle"
          onClick={() => setShowOptimizationSettings(!showOptimizationSettings)}
        >
          <span>Optimizacion WebGPU</span>
          <span className={`toggle-arrow ${showOptimizationSettings ? 'open' : ''}`}>
            {showOptimizationSettings ? '▼' : '▶'}
          </span>
        </button>

        {tokenSavingsInfo && (
          <div className="token-savings-info">
            Tokens estimados: {tokenSavingsInfo}
          </div>
        )}

        {showOptimizationSettings && (
          <div className="optimization-settings">
            <div className="optimization-info">
              <strong>Ahorro de tokens:</strong> Las imagenes se comprimen antes de enviar al modelo.
              <br />
              <strong>Upscaling GPU:</strong> Las imagenes generadas se escalan localmente usando tu GPU con super-resolucion.
            </div>

            {/* Preset Selector */}
            <div className="preset-selector">
              <label>Preset de optimizacion:</label>
              <div className="preset-buttons">
                {(Object.keys(presetLabels) as OptimizationPreset[]).map((preset) => (
                  <button
                    key={preset}
                    className={`preset-btn ${selectedPreset === preset ? 'active' : ''}`}
                    onClick={() => handlePresetChange(preset)}
                    disabled={isGenerating}
                    title={getPresetDescription(preset)}
                  >
                    {presetLabels[preset]}
                  </button>
                ))}
              </div>
              {selectedPreset !== 'custom' && (
                <span className="preset-description">{getPresetDescription(selectedPreset)}</span>
              )}
              {selectedPreset === 'custom' && (
                <span className="preset-description">Configuracion personalizada</span>
              )}
            </div>

            <div className="optimization-sliders">
              <label>
                Resolucion entrada (max): {maxInputDimension}px
                <input
                  type="range"
                  min="256"
                  max="1024"
                  step="64"
                  value={maxInputDimension}
                  onChange={(e) => { setMaxInputDimension(parseInt(e.target.value)); handleCustomSettingChange(); }}
                  disabled={isGenerating}
                />
                <span className="slider-hint">Menor = menos tokens (256px ahorra ~90%)</span>
              </label>

              <label>
                Resolucion salida (target): {targetOutputDimension}px
                <input
                  type="range"
                  min="512"
                  max="2048"
                  step="128"
                  value={targetOutputDimension}
                  onChange={(e) => { setTargetOutputDimension(parseInt(e.target.value)); handleCustomSettingChange(); }}
                  disabled={isGenerating}
                />
                <span className="slider-hint">Mayor = mejor calidad final</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={enableUpscaling}
                  onChange={(e) => { setEnableUpscaling(e.target.checked); handleCustomSettingChange(); }}
                  disabled={isGenerating}
                />
                Habilitar upscaling WebGPU
              </label>

              {enableUpscaling && (
                <>
                  <label>
                    Algoritmo de upscaling:
                    <select
                      value={upscaleAlgorithm}
                      onChange={(e) => { setUpscaleAlgorithm(e.target.value as UpscaleAlgorithm); handleCustomSettingChange(); }}
                      disabled={isGenerating}
                    >
                      <option value="superres">Super-Resolucion (mejor calidad)</option>
                      <option value="lanczos">Lanczos-3 (rapido, alta calidad)</option>
                      <option value="bicubic">Bicubico (mas rapido)</option>
                    </select>
                  </label>

                  {upscaleAlgorithm === 'superres' && (
                    <>
                      <label>
                        Intensidad de nitidez: {(sharpeningIntensity * 100).toFixed(0)}%
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={sharpeningIntensity}
                          onChange={(e) => { setSharpeningIntensity(parseFloat(e.target.value)); handleCustomSettingChange(); }}
                          disabled={isGenerating}
                        />
                      </label>

                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={edgeEnhancement}
                          onChange={(e) => { setEdgeEnhancement(e.target.checked); handleCustomSettingChange(); }}
                          disabled={isGenerating}
                        />
                        Mejora de bordes (edge-aware)
                      </label>
                    </>
                  )}
                </>
              )}
            </div>

            {isWebGPUAvailable() && (
              <div className="color-adjustments">
                <h4>Ajustes de color (post-proceso)</h4>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={useWebGPU}
                    onChange={(e) => setUseWebGPU(e.target.checked)}
                  />
                  Habilitar ajustes de color
                </label>

                {useWebGPU && (
                  <div className="webgpu-sliders">
                    <label>
                      Brillo: {webgpuBrightness.toFixed(2)}
                      <input
                        type="range"
                        min="-0.5"
                        max="0.5"
                        step="0.05"
                        value={webgpuBrightness}
                        onChange={(e) => setWebgpuBrightness(parseFloat(e.target.value))}
                      />
                    </label>
                    <label>
                      Contraste: {webgpuContrast.toFixed(2)}
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.05"
                        value={webgpuContrast}
                        onChange={(e) => setWebgpuContrast(parseFloat(e.target.value))}
                      />
                    </label>
                    <label>
                      Saturacion: {webgpuSaturation.toFixed(2)}
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.05"
                        value={webgpuSaturation}
                        onChange={(e) => setWebgpuSaturation(parseFloat(e.target.value))}
                      />
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <button
        className="btn-generate"
        onClick={handleGenerate}
        disabled={isGenerating || !canGenerate}
      >
        {isGenerating
          ? (processingStatus || 'Procesando...')
          : attachedImages.length > 0
            ? 'Procesar Imagenes'
            : 'Generar Imagen'}
      </button>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {previewImage && (
        <div className="preview-section">
          <img src={previewImage} alt="Imagen generada" className="preview-image" />
          <div className="preview-actions">
            <button className="btn-download" onClick={handleDownload}>
              Descargar
            </button>
            {onStartEditingThread && (
              <button
                className="btn-edit-thread"
                onClick={() => onStartEditingThread(
                  previewImage,
                  lastGeneratedPrompt,
                  selectedIdentity?.id,
                  selectedIdentity?.name
                )}
              >
                Editar en Hilo
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
