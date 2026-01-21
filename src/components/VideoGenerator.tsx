import { useState, useEffect } from 'react';
import type { GeneratedImage, GeneratedVideo, KlingModel, KlingVideoMode, KlingVideoDuration, VideoGenerationStatus } from '../types';
import { generateVideoFromImage, isKlingConfigured } from '../services/kling';
import { saveGeneratedVideo, getAllGeneratedVideos, deleteGeneratedVideo } from '../services/identityStore';

interface Props {
  deviceId: string;
  galleryImages: GeneratedImage[];
  onRefresh: () => void;
}

export function VideoGenerator({ deviceId, galleryImages, onRefresh }: Props) {
  // Estado de selección
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);

  // Estado del formulario
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<KlingModel>('kling-v1-6');
  const [mode, setMode] = useState<KlingVideoMode>('std');
  const [duration, setDuration] = useState<KlingVideoDuration>('5');

  // Estado de generación
  const [generationStatus, setGenerationStatus] = useState<VideoGenerationStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Videos generados
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<GeneratedVideo | null>(null);

  // Cargar videos al montar
  useEffect(() => {
    loadVideos();
  }, [deviceId]);

  const loadVideos = async () => {
    try {
      const videos = await getAllGeneratedVideos(deviceId);
      setGeneratedVideos(videos);
    } catch (err) {
      console.error('Error cargando videos:', err);
    }
  };

  const handleImageSelect = (image: GeneratedImage) => {
    setSelectedImage(image);
    setShowImagePicker(false);
  };

  const handleGenerate = async () => {
    if (!selectedImage || !prompt.trim()) return;

    setError(null);
    setGenerationStatus('creating');
    setProgress(0);

    try {
      const result = await generateVideoFromImage(
        selectedImage.imageUrl,
        prompt,
        { model_name: model, mode, duration },
        (status, prog) => {
          setGenerationStatus(status as VideoGenerationStatus);
          if (prog !== undefined) setProgress(prog);
        }
      );

      // Guardar el video
      await saveGeneratedVideo(
        deviceId,
        selectedImage.imageUrl,
        prompt,
        result.videoUrl,
        result.duration,
        result.taskId,
        model,
        mode,
        selectedImage.id
      );

      // Recargar lista
      await loadVideos();
      onRefresh();

      // Limpiar formulario
      setPrompt('');
      setSelectedImage(null);
      setGenerationStatus('idle');
      setProgress(0);
    } catch (err) {
      console.error('Error generando video:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setGenerationStatus('failed');
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('¿Eliminar este video?')) return;
    await deleteGeneratedVideo(id);
    if (selectedVideo?.id === id) setSelectedVideo(null);
    await loadVideos();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status: VideoGenerationStatus): string => {
    switch (status) {
      case 'creating': return 'Creando tarea...';
      case 'submitted': return 'Tarea enviada...';
      case 'processing': return 'Generando video...';
      case 'succeed': return 'Completado';
      case 'failed': return 'Error';
      default: return '';
    }
  };

  // Verificar configuración de Kling
  if (!isKlingConfigured()) {
    return (
      <div className="video-generator">
        <div className="panel-header">
          <h2>Generador de Video</h2>
        </div>
        <div className="video-not-configured">
          <div className="warning-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h3>API de Kling no configurada</h3>
          <p>
            Para usar el generador de videos, configura las variables de entorno:
          </p>
          <code>
            VITE_APP_API_KLING_KEY=tu_access_key<br />
            VITE_APP_SECRET_KLING=tu_secret_key
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="video-generator">
      <div className="panel-header">
        <h2>Generador de Video (Kling AI)</h2>
      </div>

      <div className="video-generator-content">
        {/* Panel de generación */}
        <div className="video-form-section">
          <h3>Crear Video desde Imagen</h3>

          {/* Selector de imagen */}
          <div className="form-group">
            <label>Imagen de origen</label>
            {selectedImage ? (
              <div className="selected-image-preview">
                <img src={selectedImage.imageUrl} alt="Imagen seleccionada" />
                <div className="selected-image-info">
                  <span className="identity-label">{selectedImage.identityName}</span>
                  <button
                    className="btn-change-image"
                    onClick={() => setShowImagePicker(true)}
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="btn-select-image"
                onClick={() => setShowImagePicker(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                Seleccionar imagen de la galeria
              </button>
            )}
          </div>

          {/* Prompt */}
          <div className="form-group">
            <label>Prompt de movimiento</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe como quieres que se mueva la imagen..."
              rows={3}
              disabled={generationStatus !== 'idle' && generationStatus !== 'failed'}
            />
          </div>

          {/* Opciones */}
          <div className="video-options">
            <div className="form-group">
              <label>Modelo</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as KlingModel)}
                disabled={generationStatus !== 'idle' && generationStatus !== 'failed'}
              >
                <option value="kling-v1">Kling V1</option>
                <option value="kling-v1-5">Kling V1.5</option>
                <option value="kling-v1-6">Kling V1.6</option>
                <option value="kling-v2-master">Kling V2 Master</option>
                <option value="kling-v2-1">Kling V2.1</option>
                <option value="kling-v2-1-master">Kling V2.1 Master</option>
              </select>
            </div>

            <div className="form-group">
              <label>Modo</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as KlingVideoMode)}
                disabled={generationStatus !== 'idle' && generationStatus !== 'failed'}
              >
                <option value="std">Estandar (rapido)</option>
                <option value="pro">Profesional (mejor calidad)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Duracion</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value as KlingVideoDuration)}
                disabled={generationStatus !== 'idle' && generationStatus !== 'failed'}
              >
                <option value="5">5 segundos</option>
                <option value="10">10 segundos</option>
              </select>
            </div>
          </div>

          {/* Progreso */}
          {generationStatus !== 'idle' && generationStatus !== 'failed' && (
            <div className="video-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="progress-text">
                {getStatusText(generationStatus)} ({Math.round(progress)}%)
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="video-error">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Botón de generar */}
          <button
            className="btn-generate-video"
            onClick={handleGenerate}
            disabled={
              !selectedImage ||
              !prompt.trim() ||
              (generationStatus !== 'idle' && generationStatus !== 'failed')
            }
          >
            {generationStatus !== 'idle' && generationStatus !== 'failed' ? (
              <>
                <div className="spinner-small" />
                Generando...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Generar Video
              </>
            )}
          </button>
        </div>

        {/* Galería de videos */}
        <div className="video-gallery-section">
          <h3>Videos Generados ({generatedVideos.length})</h3>

          {generatedVideos.length === 0 ? (
            <div className="video-gallery-empty">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
              </svg>
              <p>No hay videos generados todavia</p>
            </div>
          ) : (
            <div className="video-grid">
              {generatedVideos.map((video) => (
                <div
                  key={video.id}
                  className="video-item"
                  onClick={() => setSelectedVideo(video)}
                >
                  <div className="video-thumbnail">
                    <img src={video.sourceImageThumbnail || video.sourceImageUrl} alt="Thumbnail" />
                    <div className="video-play-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </div>
                    <span className="video-duration">{video.duration}s</span>
                  </div>
                  <div className="video-item-info">
                    <p className="video-prompt">{video.prompt}</p>
                    <span className="video-date">{formatDate(video.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de selección de imagen */}
      {showImagePicker && (
        <div className="modal-overlay" onClick={() => setShowImagePicker(false)}>
          <div className="modal-content image-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Seleccionar imagen</h3>
              <button className="modal-close" onClick={() => setShowImagePicker(false)}>×</button>
            </div>
            <div className="image-picker-grid">
              {galleryImages.length === 0 ? (
                <div className="image-picker-empty">
                  <p>No hay imagenes en la galeria. Genera algunas primero.</p>
                </div>
              ) : (
                galleryImages.map((image) => (
                  <div
                    key={image.id}
                    className="image-picker-item"
                    onClick={() => handleImageSelect(image)}
                  >
                    <img src={image.imageUrl} alt={image.prompt} />
                    <div className="image-picker-overlay">
                      <span>{image.identityName}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de video */}
      {selectedVideo && (
        <div className="modal-overlay" onClick={() => setSelectedVideo(null)}>
          <div className="modal-content video-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedVideo(null)}>×</button>
            <div className="video-player-container">
              <video
                src={selectedVideo.videoUrl}
                controls
                autoPlay
                loop
                className="video-player"
              />
            </div>
            <div className="video-modal-info">
              <p className="video-modal-prompt">{selectedVideo.prompt}</p>
              <div className="video-modal-meta">
                <span>Duracion: {selectedVideo.duration}s</span>
                <span>Modelo: {selectedVideo.model}</span>
                <span>Modo: {selectedVideo.mode === 'pro' ? 'Profesional' : 'Estandar'}</span>
                <span>{formatDate(selectedVideo.createdAt)}</span>
              </div>
              <div className="video-modal-actions">
                <a
                  href={selectedVideo.videoUrl}
                  download={`video-${selectedVideo.id}.mp4`}
                  className="btn-download-video"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Descargar
                </a>
                <button
                  className="btn-danger"
                  onClick={() => handleDeleteVideo(selectedVideo.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
