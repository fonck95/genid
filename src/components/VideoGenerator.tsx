import { useState } from 'react';
import type { GeneratedImage, KlingModel, KlingVideoMode, KlingVideoDuration, VideoGenerationStatus, Identity } from '../types';
import { generateVideoFromImage, isKlingConfigured } from '../services/kling';
import { saveGeneratedVideo, getIdentity } from '../services/identityStore';

/** Video pendiente que aun no ha sido guardado en la galeria */
interface PendingVideo {
  id: string;
  sourceImageId?: string;
  sourceImageUrl: string;
  sourceImageThumbnail?: string;
  identityId?: string;
  identityName?: string;
  prompt: string;
  videoUrl: string;
  duration: string;
  klingTaskId: string;
  model: string;
  mode: string;
  createdAt: number;
}

interface Props {
  deviceId: string;
  galleryImages: GeneratedImage[];
  selectedIdentity: Identity | null;
  onRefresh: () => void;
}

export function VideoGenerator({ deviceId, galleryImages, selectedIdentity, onRefresh }: Props) {
  // Estado de seleccion
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);

  // Estado del formulario
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<KlingModel>('kling-v2-1-master');
  const [mode, setMode] = useState<KlingVideoMode>('pro');
  const [duration, setDuration] = useState<KlingVideoDuration>('5');

  // Estado de generacion
  const [generationStatus, setGenerationStatus] = useState<VideoGenerationStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Videos pendientes (no guardados en galeria)
  const [pendingVideos, setPendingVideos] = useState<PendingVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<PendingVideo | null>(null);

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
      // Obtener descripción facial antropométrica de la identidad si existe
      let faceDescription: string | undefined;
      if (selectedImage.identityId) {
        const identity = await getIdentity(selectedImage.identityId);
        if (identity?.photos) {
          // Combinar todas las descripciones faciales disponibles
          const faceDescriptions = identity.photos
            .filter(photo => photo.faceDescription)
            .map((photo, index) => `[Reference ${index + 1}]\n${photo.faceDescription}`)
            .join('\n\n');

          if (faceDescriptions) {
            faceDescription = faceDescriptions;
          }
        }
      }

      const result = await generateVideoFromImage(
        selectedImage.imageUrl,
        prompt,
        { model_name: model, mode, duration, faceDescription },
        (status, prog) => {
          setGenerationStatus(status as VideoGenerationStatus);
          if (prog !== undefined) setProgress(prog);
        }
      );

      // Crear video pendiente (NO guardar automaticamente)
      const pendingVideo: PendingVideo = {
        id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sourceImageId: selectedImage.id,
        sourceImageUrl: selectedImage.imageUrl,
        sourceImageThumbnail: selectedImage.imageUrl,
        identityId: selectedImage.identityId,
        identityName: selectedImage.identityName,
        prompt,
        videoUrl: result.videoUrl,
        duration: result.duration,
        klingTaskId: result.taskId,
        model,
        mode,
        createdAt: Date.now()
      };

      // Agregar a videos pendientes
      setPendingVideos(prev => [pendingVideo, ...prev]);

      // Limpiar formulario
      setPrompt('');
      setGenerationStatus('idle');
      setProgress(0);
    } catch (err) {
      console.error('Error generando video:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setGenerationStatus('failed');
    }
  };

  const handleSaveVideo = async (pendingVideo: PendingVideo) => {
    try {
      // Guardar en IndexedDB con identidad
      await saveGeneratedVideo(
        deviceId,
        pendingVideo.sourceImageUrl,
        pendingVideo.prompt,
        pendingVideo.videoUrl,
        pendingVideo.duration,
        pendingVideo.klingTaskId,
        pendingVideo.model,
        pendingVideo.mode,
        pendingVideo.sourceImageId,
        pendingVideo.identityId,
        pendingVideo.identityName,
        pendingVideo.sourceImageThumbnail
      );

      // Remover de pendientes
      setPendingVideos(prev => prev.filter(v => v.id !== pendingVideo.id));

      // Refrescar galería
      onRefresh();

      // Si estaba seleccionado, deseleccionar
      if (selectedVideo?.id === pendingVideo.id) {
        setSelectedVideo(null);
      }
    } catch (err) {
      console.error('Error guardando video:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar video');
    }
  };

  const handleDiscardPending = (id: string) => {
    if (!confirm('¿Descartar este video? No se podra recuperar.')) return;
    setPendingVideos(prev => prev.filter(v => v.id !== id));
    if (selectedVideo?.id === id) setSelectedVideo(null);
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

  // Filtrar imagenes de la galeria por identidad seleccionada
  const filteredGalleryImages = selectedIdentity
    ? galleryImages.filter(img => img.identityId === selectedIdentity.id)
    : galleryImages;

  // Verificar configuracion de Kling
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
        {selectedIdentity && (
          <span className="selected-identity-badge">
            {selectedIdentity.name}
          </span>
        )}
      </div>

      <div className="video-generator-content">
        {/* Panel de generacion */}
        <div className="video-form-section">
          <h3>Crear Video desde Imagen</h3>

          {/* Selector de imagen */}
          <div className="form-group">
            <label>Imagen de origen {selectedIdentity && `(de ${selectedIdentity.name})`}</label>
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
                <option value="kling-v2-1-master">Kling V2.1 Master (Recomendado)</option>
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
                <option value="3">3 segundos</option>
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

          {/* Boton de generar */}
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

        {/* Seccion de videos pendientes */}
        <div className="video-pending-section">
          <h3>Videos Pendientes ({pendingVideos.length})</h3>
          <p className="pending-hint">
            Los videos generados aparecen aqui. Guardalos en la galeria o descártalos.
          </p>

          {pendingVideos.length === 0 ? (
            <div className="video-gallery-empty">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
              </svg>
              <p>No hay videos pendientes</p>
              <span className="hint">Genera un video para verlo aqui</span>
            </div>
          ) : (
            <div className="video-grid">
              {pendingVideos.map((video) => (
                <div
                  key={video.id}
                  className="video-item pending"
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
                    <span className="pending-badge">Pendiente</span>
                  </div>
                  <div className="video-item-info">
                    <p className="video-prompt">{video.prompt}</p>
                    <span className="video-identity">{video.identityName}</span>
                    <div className="video-item-actions">
                      <button
                        className="btn-save-video"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveVideo(video);
                        }}
                        title="Guardar en galeria"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                          <polyline points="17 21 17 13 7 13 7 21"></polyline>
                          <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        Guardar
                      </button>
                      <button
                        className="btn-discard-video"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDiscardPending(video.id);
                        }}
                        title="Descartar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de seleccion de imagen */}
      {showImagePicker && (
        <div className="modal-overlay" onClick={() => setShowImagePicker(false)}>
          <div className="modal-content image-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Seleccionar imagen {selectedIdentity && `de ${selectedIdentity.name}`}</h3>
              <button className="modal-close" onClick={() => setShowImagePicker(false)}>x</button>
            </div>
            <div className="image-picker-grid">
              {filteredGalleryImages.length === 0 ? (
                <div className="image-picker-empty">
                  <p>No hay imagenes en la galeria{selectedIdentity ? ` para ${selectedIdentity.name}` : ''}. Genera algunas primero.</p>
                </div>
              ) : (
                filteredGalleryImages.map((image) => (
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

      {/* Modal de video pendiente */}
      {selectedVideo && (
        <div className="modal-overlay" onClick={() => setSelectedVideo(null)}>
          <div className="modal-content video-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedVideo(null)}>x</button>
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
              {selectedVideo.identityName && (
                <p className="video-modal-identity">Identidad: {selectedVideo.identityName}</p>
              )}
              <div className="video-modal-meta">
                <span>Duracion: {selectedVideo.duration}s</span>
                <span>Modelo: {selectedVideo.model}</span>
                <span>Modo: {selectedVideo.mode === 'pro' ? 'Profesional' : 'Estandar'}</span>
                <span>{formatDate(selectedVideo.createdAt)}</span>
              </div>
              <div className="video-modal-actions">
                <button
                  className="btn-save-video-large"
                  onClick={() => handleSaveVideo(selectedVideo)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  Guardar en Galeria
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleDiscardPending(selectedVideo.id)}
                >
                  Descartar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
