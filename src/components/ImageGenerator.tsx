import { useState, useRef, useEffect } from 'react';
import type { Identity, AttachedImage } from '../types';
import { generateImageWithIdentity, generateSimpleImage, generateWithAttachedImages } from '../services/gemini';
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
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptAreaRef = useRef<HTMLDivElement>(null);

  // Verificar WebGPU al montar
  useState(() => {
    initWebGPU().then((support) => {
      setWebgpuStatus(support.available ? 'WebGPU disponible' : 'WebGPU no disponible');
    });
  });

  // Manejar pegado de imágenes desde el portapapeles
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
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
  }, []);

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
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setPreviewImage(null);

    try {
      let imageUrl: string;

      // Si hay imágenes adjuntas, usar la nueva función
      if (attachedImages.length > 0) {
        if (selectedIdentity && selectedIdentity.photos.length > 0) {
          imageUrl = await generateWithAttachedImages(
            prompt,
            attachedImages,
            selectedIdentity.photos,
            selectedIdentity.name
          );
        } else {
          imageUrl = await generateWithAttachedImages(prompt, attachedImages);
        }

        // Guardar en IndexedDB
        await saveGeneratedImage(
          selectedIdentity?.id || 'simple',
          selectedIdentity?.name || 'Sin identidad',
          prompt,
          imageUrl
        );
      } else if (selectedIdentity && selectedIdentity.photos.length > 0) {
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
      setAttachedImages([]); // Limpiar imágenes adjuntas después de generar
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

  const attachedImagesSuggestions = attachedImages.length > 0 ? [
    'Mejora la calidad y nitidez de estas imágenes',
    'Combina estas imágenes en una composición artística',
    'Aplica un estilo de pintura al óleo a estas imágenes',
    'Genera una variación creativa de estas imágenes',
  ] : [];

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

      {/* Sección de imágenes adjuntas */}
      <div className="attached-images-section" ref={promptAreaRef}>
        <div className="attached-header">
          <span className="attached-label">
            Imágenes adjuntas {attachedImages.length > 0 && `(${attachedImages.length})`}
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
            <span>Ctrl+V para pegar imágenes del portapapeles</span>
            <span>o haz clic en "Adjuntar" para subir</span>
          </div>
        )}
      </div>

      <div className="prompt-section">
        <textarea
          placeholder={
            attachedImages.length > 0
              ? 'Describe qué quieres hacer con las imágenes adjuntas...'
              : selectedIdentity
                ? `Describe la situación para ${selectedIdentity.name}...`
                : 'Describe la imagen que quieres generar...'
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
        disabled={isGenerating || !prompt.trim() || (selectedIdentity !== null && selectedIdentity.photos.length === 0 && attachedImages.length === 0)}
      >
        {isGenerating ? 'Generando...' : attachedImages.length > 0 ? 'Procesar Imágenes' : 'Generar Imagen'}
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
