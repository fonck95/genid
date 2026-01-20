import { useState } from 'react';
import type { Identity } from '../types';
import { generateImageWithIdentity, generateSimpleImage } from '../services/gemini';
import { saveGeneratedImage } from '../services/identityStore';
import { processDataUrlWithWebGPU, initWebGPU, isWebGPUAvailable } from '../services/webgpu';

interface Props {
  selectedIdentity: Identity | null;
  onImageGenerated: () => void;
}

export function ImageGenerator({ selectedIdentity, onImageGenerated }: Props) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [webgpuStatus, setWebgpuStatus] = useState<string>('Verificando...');
  const [useWebGPU, setUseWebGPU] = useState(true);
  const [webgpuBrightness, setWebgpuBrightness] = useState(0);
  const [webgpuContrast, setWebgpuContrast] = useState(1);
  const [webgpuSaturation, setWebgpuSaturation] = useState(1);

  // Verificar WebGPU al montar
  useState(() => {
    initWebGPU().then((support) => {
      setWebgpuStatus(support.available ? 'WebGPU disponible' : 'WebGPU no disponible');
    });
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setPreviewImage(null);

    try {
      let imageUrl: string;

      if (selectedIdentity && selectedIdentity.photos.length > 0) {
        imageUrl = await generateImageWithIdentity(
          prompt,
          selectedIdentity.photos,
          selectedIdentity.name
        );

        // Guardar en IndexedDB
        await saveGeneratedImage(
          selectedIdentity.id,
          selectedIdentity.name,
          prompt,
          imageUrl
        );
      } else {
        imageUrl = await generateSimpleImage(prompt);

        // Guardar como generación sin identidad
        await saveGeneratedImage('simple', 'Sin identidad', prompt, imageUrl);
      }

      // Aplicar procesamiento WebGPU si está habilitado
      if (useWebGPU && isWebGPUAvailable()) {
        const processed = await processDataUrlWithWebGPU(imageUrl, {
          brightness: webgpuBrightness,
          contrast: webgpuContrast,
          saturation: webgpuSaturation
        });
        if (processed) {
          imageUrl = processed;
        }
      }

      setPreviewImage(imageUrl);
      onImageGenerated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!previewImage) return;

    const link = document.createElement('a');
    link.href = previewImage;
    link.download = `genid-${Date.now()}.png`;
    link.click();
  };

  const promptSuggestions = selectedIdentity ? [
    `${selectedIdentity.name} en una playa tropical al atardecer`,
    `${selectedIdentity.name} como astronauta en el espacio`,
    `${selectedIdentity.name} en una oficina moderna trabajando`,
    `${selectedIdentity.name} cocinando en una cocina profesional`,
    `${selectedIdentity.name} practicando yoga en las montañas`,
    `${selectedIdentity.name} en un estudio de arte pintando`,
  ] : [
    'Un paisaje futurista de ciudad cyberpunk',
    'Un gato samurai con armadura japonesa',
    'Un bosque mágico con criaturas de luz',
    'Un robot amigable sirviendo café',
  ];

  return (
    <div className="image-generator">
      <div className="panel-header">
        <h2>Generar Imagen</h2>
        <span className={`webgpu-badge ${isWebGPUAvailable() ? 'available' : ''}`}>
          {webgpuStatus}
        </span>
      </div>

      {selectedIdentity ? (
        <div className="identity-selected">
          <div className="selected-preview">
            {selectedIdentity.photos[0] && (
              <img src={selectedIdentity.photos[0].thumbnail} alt="" />
            )}
          </div>
          <span>Generando para: <strong>{selectedIdentity.name}</strong></span>
          {selectedIdentity.photos.length === 0 && (
            <span className="warning">Añade fotos a esta identidad primero</span>
          )}
        </div>
      ) : (
        <div className="no-identity-info">
          Selecciona una identidad o genera una imagen simple
        </div>
      )}

      <div className="prompt-section">
        <textarea
          placeholder={selectedIdentity
            ? `Describe la situación para ${selectedIdentity.name}...`
            : 'Describe la imagen que quieres generar...'
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          disabled={isGenerating}
        />

        <div className="suggestions">
          {promptSuggestions.map((suggestion, i) => (
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

      {isWebGPUAvailable() && (
        <div className="webgpu-controls">
          <label className="webgpu-toggle">
            <input
              type="checkbox"
              checked={useWebGPU}
              onChange={(e) => setUseWebGPU(e.target.checked)}
            />
            Procesamiento WebGPU
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
                Saturación: {webgpuSaturation.toFixed(2)}
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

      <button
        className="btn-generate"
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim() || (selectedIdentity !== null && selectedIdentity.photos.length === 0)}
      >
        {isGenerating ? 'Generando...' : 'Generar Imagen'}
      </button>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {previewImage && (
        <div className="preview-section">
          <img src={previewImage} alt="Imagen generada" className="preview-image" />
          <button className="btn-download" onClick={handleDownload}>
            Descargar
          </button>
        </div>
      )}
    </div>
  );
}
