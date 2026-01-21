import { useState, useRef } from 'react';
import type { GeneratedImage, KlingModel, KlingVideoMode, KlingVideoDuration, VideoGenerationStatus, Identity, MotionControlOrientation } from '../types';
import { generateVideoFromImage, generateMotionControlVideo, isKlingConfigured } from '../services/kling';
import type { KlingMotionControlOptions } from '../services/kling';
import { saveGeneratedVideo, getIdentity } from '../services/identityStore';
import { uploadVideoToCloudinary } from '../services/cloudinary';

/** Tipo de modo de video */
type VideoMode = 'image2video' | 'motion-control';

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
  generationType: VideoMode;
  motionVideoUrl?: string;
  characterOrientation?: MotionControlOrientation;
  createdAt: number;
}

interface Props {
  deviceId: string;
  galleryImages: GeneratedImage[];
  selectedIdentity: Identity | null;
  identities: Identity[];
  onSelectIdentity: (identity: Identity | null) => void;
  onRefresh: () => void;
}

export function VideoGenerator({ deviceId, galleryImages, selectedIdentity, identities, onSelectIdentity, onRefresh }: Props) {
  // Estado de modo de video
  const [videoMode, setVideoMode] = useState<VideoMode>('image2video');

  // Estado de seleccion
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);

  // Estado del formulario - Image to Video
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<KlingModel>('kling-v2-1-master');
  const [mode, setMode] = useState<KlingVideoMode>('pro');
  const [duration, setDuration] = useState<KlingVideoDuration>('5');

  // Estado del formulario - Motion Control
  const [motionVideoFile, setMotionVideoFile] = useState<File | null>(null);
  const [motionVideoPreview, setMotionVideoPreview] = useState<string | null>(null);
  const [characterOrientation, setCharacterOrientation] = useState<MotionControlOrientation>('image');
  const [keepOriginalSound, setKeepOriginalSound] = useState<'yes' | 'no'>('no');
  const [motionPrompt, setMotionPrompt] = useState('');
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

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

    // Auto-seleccionar la identidad correspondiente a la imagen
    if (image.identityId) {
      const imageIdentity = identities.find(id => id.id === image.identityId);
      if (imageIdentity && (!selectedIdentity || selectedIdentity.id !== imageIdentity.id)) {
        onSelectIdentity(imageIdentity);
      }
    }
  };

  const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ['video/mp4', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      setError('Formato de video no soportado. Usa MP4 o MOV.');
      return;
    }

    // Validar tamaño (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError('El video no debe superar 100MB.');
      return;
    }

    setMotionVideoFile(file);
    setMotionVideoPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleClearMotionVideo = () => {
    if (motionVideoPreview) {
      URL.revokeObjectURL(motionVideoPreview);
    }
    setMotionVideoFile(null);
    setMotionVideoPreview(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const handleGenerateImage2Video = async () => {
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
        generationType: 'image2video',
        createdAt: Date.now()
      };

      setPendingVideos(prev => [pendingVideo, ...prev]);
      setPrompt('');
      setGenerationStatus('idle');
      setProgress(0);
    } catch (err) {
      console.error('Error generando video:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setGenerationStatus('failed');
    }
  };

  const handleGenerateMotionControl = async () => {
    if (!selectedImage || !motionVideoFile) return;

    setError(null);
    setGenerationStatus('creating');
    setProgress(0);

    try {
      // Primero subir el video a Cloudinary
      setIsUploadingVideo(true);
      const uploadResult = await uploadVideoToCloudinary(motionVideoFile, 'genid_motion_videos');
      setIsUploadingVideo(false);

      const options: KlingMotionControlOptions = {
        prompt: motionPrompt || undefined,
        keep_original_sound: keepOriginalSound,
        character_orientation: characterOrientation,
        mode
      };

      const result = await generateMotionControlVideo(
        selectedImage.imageUrl,
        uploadResult.secure_url,
        options,
        (status, prog) => {
          setGenerationStatus(status as VideoGenerationStatus);
          if (prog !== undefined) setProgress(prog);
        }
      );

      const pendingVideo: PendingVideo = {
        id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sourceImageId: selectedImage.id,
        sourceImageUrl: selectedImage.imageUrl,
        sourceImageThumbnail: selectedImage.imageUrl,
        identityId: selectedImage.identityId,
        identityName: selectedImage.identityName,
        prompt: motionPrompt || 'Motion Control',
        videoUrl: result.videoUrl,
        duration: result.duration,
        klingTaskId: result.taskId,
        model: 'motion-control',
        mode,
        generationType: 'motion-control',
        motionVideoUrl: uploadResult.secure_url,
        characterOrientation,
        createdAt: Date.now()
      };

      setPendingVideos(prev => [pendingVideo, ...prev]);
      handleClearMotionVideo();
      setMotionPrompt('');
      setGenerationStatus('idle');
      setProgress(0);
    } catch (err) {
      console.error('Error generando video Motion Control:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setGenerationStatus('failed');
      setIsUploadingVideo(false);
    }
  };

  const handleGenerate = () => {
    if (videoMode === 'image2video') {
      handleGenerateImage2Video();
    } else {
      handleGenerateMotionControl();
    }
  };

  const handleSaveVideo = async (pendingVideo: PendingVideo) => {
    try {
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

      setPendingVideos(prev => prev.filter(v => v.id !== pendingVideo.id));
      onRefresh();

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
    if (isUploadingVideo) return 'Subiendo video de referencia...';
    switch (status) {
      case 'creating': return 'Creando tarea...';
      case 'submitted': return 'Tarea enviada...';
      case 'processing': return 'Generando video...';
      case 'succeed': return 'Completado';
      case 'failed': return 'Error';
      default: return '';
    }
  };

  // Filtrar imagenes de la galeria por identidad seleccionada (solo para image2video)
  const filteredGalleryImages = videoMode === 'image2video' && selectedIdentity
    ? galleryImages.filter(img => img.identityId === selectedIdentity.id)
    : galleryImages;

  const isGenerating = generationStatus !== 'idle' && generationStatus !== 'failed';

  const canGenerate = videoMode === 'image2video'
    ? selectedImage && prompt.trim() && !isGenerating
    : selectedImage && motionVideoFile && !isGenerating;

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
          {/* Selector de modo */}
          <div className="video-mode-selector">
            <button
              className={`mode-btn ${videoMode === 'image2video' ? 'active' : ''}`}
              onClick={() => setVideoMode('image2video')}
              disabled={isGenerating}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              Imagen a Video
            </button>
            <button
              className={`mode-btn ${videoMode === 'motion-control' ? 'active' : ''}`}
              onClick={() => setVideoMode('motion-control')}
              disabled={isGenerating}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="10 8 16 12 10 16 10 8"></polygon>
              </svg>
              Motion Control
            </button>
          </div>

          <h3>{videoMode === 'image2video' ? 'Crear Video desde Imagen' : 'Motion Control'}</h3>
          {videoMode === 'motion-control' && (
            <p className="mode-description">
              Aplica el movimiento de un video de referencia a tu imagen.
            </p>
          )}

          {/* Selector de imagen */}
          <div className="form-group">
            <label>
              Imagen de referencia
              {videoMode === 'image2video' && selectedIdentity && ` (de ${selectedIdentity.name})`}
            </label>
            {selectedImage ? (
              <div className="selected-image-preview">
                <img src={selectedImage.imageUrl} alt="Imagen seleccionada" />
                <div className="selected-image-info">
                  <span className="identity-label">{selectedImage.identityName}</span>
                  <button
                    className="btn-change-image"
                    onClick={() => setShowImagePicker(true)}
                    disabled={isGenerating}
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="btn-select-image"
                onClick={() => setShowImagePicker(true)}
                disabled={isGenerating}
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

          {/* Contenido especifico del modo */}
          {videoMode === 'image2video' ? (
            <>
              {/* Prompt para Image to Video */}
              <div className="form-group">
                <label>Prompt de movimiento</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe como quieres que se mueva la imagen..."
                  rows={3}
                  disabled={isGenerating}
                />
              </div>

              {/* Opciones de Image to Video */}
              <div className="video-options">
                <div className="form-group">
                  <label>Modelo</label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value as KlingModel)}
                    disabled={isGenerating}
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
                    disabled={isGenerating}
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
                    disabled={isGenerating}
                  >
                    <option value="3">3 segundos</option>
                    <option value="5">5 segundos</option>
                    <option value="10">10 segundos</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Video de referencia para Motion Control */}
              <div className="form-group">
                <label>Video de referencia de movimiento</label>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,.mp4,.mov"
                  onChange={handleVideoFileSelect}
                  style={{ display: 'none' }}
                />
                {motionVideoPreview ? (
                  <div className="motion-video-preview">
                    <video src={motionVideoPreview} controls muted />
                    <button
                      className="btn-remove-video"
                      onClick={handleClearMotionVideo}
                      disabled={isGenerating}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                      Quitar
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn-upload-video"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isGenerating}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7"></polygon>
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                    </svg>
                    Subir video de movimiento
                  </button>
                )}
                <p className="form-hint">
                  MP4 o MOV, max 100MB, 3-30 segundos. El personaje debe ser visible completamente.
                </p>
              </div>

              {/* Prompt opcional para Motion Control */}
              <div className="form-group">
                <label>Prompt (opcional)</label>
                <textarea
                  value={motionPrompt}
                  onChange={(e) => setMotionPrompt(e.target.value)}
                  placeholder="Descripcion adicional del movimiento deseado..."
                  rows={2}
                  disabled={isGenerating}
                />
              </div>

              {/* Opciones de Motion Control */}
              <div className="video-options">
                <div className="form-group">
                  <label>Orientacion del personaje</label>
                  <select
                    value={characterOrientation}
                    onChange={(e) => setCharacterOrientation(e.target.value as MotionControlOrientation)}
                    disabled={isGenerating}
                  >
                    <option value="image">Igual que la imagen (max 10s)</option>
                    <option value="video">Igual que el video (max 30s)</option>
                  </select>
                  <p className="form-hint">
                    Elige si el personaje mantiene la orientacion de la imagen o adopta la del video.
                  </p>
                </div>

                <div className="form-group">
                  <label>Modo</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as KlingVideoMode)}
                    disabled={isGenerating}
                  >
                    <option value="std">Estandar (rapido)</option>
                    <option value="pro">Profesional (mejor calidad)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Audio original</label>
                  <select
                    value={keepOriginalSound}
                    onChange={(e) => setKeepOriginalSound(e.target.value as 'yes' | 'no')}
                    disabled={isGenerating}
                  >
                    <option value="no">Sin audio</option>
                    <option value="yes">Mantener audio del video</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Progreso */}
          {isGenerating && (
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
            disabled={!canGenerate}
          >
            {isGenerating ? (
              <>
                <div className="spinner-small" />
                Generando...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                {videoMode === 'image2video' ? 'Generar Video' : 'Generar Motion Control'}
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
                    {video.generationType === 'motion-control' && (
                      <span className="motion-badge">Motion</span>
                    )}
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
              <h3>
                Seleccionar imagen
                {videoMode === 'image2video' && selectedIdentity && ` de ${selectedIdentity.name}`}
              </h3>
              <button className="modal-close" onClick={() => setShowImagePicker(false)}>x</button>
            </div>
            <div className="image-picker-grid">
              {filteredGalleryImages.length === 0 ? (
                <div className="image-picker-empty">
                  <p>No hay imagenes en la galeria{videoMode === 'image2video' && selectedIdentity ? ` para ${selectedIdentity.name}` : ''}. Genera algunas primero.</p>
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
                <span>Tipo: {selectedVideo.generationType === 'motion-control' ? 'Motion Control' : 'Image to Video'}</span>
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
