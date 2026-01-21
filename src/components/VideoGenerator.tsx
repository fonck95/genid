import { useState, useEffect, useRef, useCallback } from 'react';
import type { Identity, GeneratedImage, GeneratedVideo } from '../types';
import { generateVideoFromImage } from '../services/veo';
import {
  getAllGeneratedVideos,
  saveGeneratedVideo,
  deleteGeneratedVideo,
  getIdentity
} from '../services/identityStore';
import { createSimpleVideoPlayer, isAcceleratedPlayerAvailable } from '../services/webgpuVideoPlayer';

interface Props {
  deviceId: string;
  selectedIdentity: Identity | null;
  generatedImages: GeneratedImage[];
  identities: Identity[];
  onRefresh: () => void;
}

export function VideoGenerator({
  deviceId,
  selectedIdentity,
  generatedImages,
  identities,
  onRefresh
}: Props) {
  // Estados principales
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Videos generados
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<GeneratedVideo | null>(null);

  // Modal de selección de imagen
  const [showImagePicker, setShowImagePicker] = useState(false);

  // Filtro de galería
  const [galleryFilter, setGalleryFilter] = useState<string>('all');

  // Referencia al contenedor del video player
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  // WebGPU status
  const [webgpuAvailable] = useState(() => isAcceleratedPlayerAvailable());

  // Cargar videos generados
  const loadVideos = useCallback(async () => {
    try {
      const videos = await getAllGeneratedVideos(deviceId);
      setGeneratedVideos(videos);
    } catch (err) {
      console.error('Error cargando videos:', err);
    }
  }, [deviceId]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  // Filtrar imágenes por identidad seleccionada
  const filteredImages = galleryFilter === 'all'
    ? generatedImages
    : generatedImages.filter(img => img.identityId === galleryFilter);

  // Obtener identidades únicas de las imágenes
  const uniqueIdentityIds = [...new Set(generatedImages.map(img => img.identityId))];
  const identityOptions = uniqueIdentityIds.map(id => {
    const identity = identities.find(i => i.id === id);
    return {
      id,
      name: identity?.name || generatedImages.find(img => img.identityId === id)?.identityName || 'Desconocido'
    };
  });

  // Manejar selección de imagen
  const handleSelectImage = (image: GeneratedImage) => {
    setSelectedImage(image);
    setShowImagePicker(false);
    setError(null);
  };

  // Generar video
  const handleGenerateVideo = async () => {
    if (!selectedImage || !prompt.trim()) {
      setError('Selecciona una imagen y escribe un prompt para generar el video');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationStatus('Iniciando...');

    try {
      // Obtener la identidad y sus fotos de referencia si existe
      let identity: Identity | null = null;
      if (selectedImage.identityId) {
        identity = await getIdentity(selectedImage.identityId);
      }

      // Generar el video
      const videoUrl = await generateVideoFromImage(
        selectedImage.imageUrl,
        prompt,
        selectedImage.identityName,
        identity?.photos,
        identity?.description,
        (status) => setGenerationStatus(status)
      );

      // Guardar el video
      const savedVideo = await saveGeneratedVideo(
        deviceId,
        selectedImage.imageUrl,
        prompt,
        videoUrl,
        8, // Duración por defecto
        selectedImage.identityId,
        selectedImage.identityName
      );

      // Actualizar lista y seleccionar el nuevo video
      await loadVideos();
      setSelectedVideo(savedVideo);
      setPrompt('');
      setGenerationStatus('Video generado exitosamente!');

      onRefresh();
    } catch (err) {
      console.error('Error generando video:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al generar video');
    } finally {
      setIsGenerating(false);
    }
  };

  // Reproducir video seleccionado
  useEffect(() => {
    if (selectedVideo && videoContainerRef.current) {
      // Limpiar video anterior
      if (videoElementRef.current) {
        videoElementRef.current.pause();
        videoElementRef.current.remove();
        videoElementRef.current = null;
      }

      // Crear nuevo reproductor
      const video = createSimpleVideoPlayer(
        selectedVideo.videoUrl,
        videoContainerRef.current
      );
      videoElementRef.current = video;
    }

    return () => {
      if (videoElementRef.current) {
        videoElementRef.current.pause();
        videoElementRef.current.remove();
        videoElementRef.current = null;
      }
    };
  }, [selectedVideo]);

  // Eliminar video
  const handleDeleteVideo = async (video: GeneratedVideo) => {
    if (!confirm('¿Eliminar este video?')) return;

    try {
      await deleteGeneratedVideo(video.id);
      if (selectedVideo?.id === video.id) {
        setSelectedVideo(null);
      }
      await loadVideos();
    } catch (err) {
      console.error('Error eliminando video:', err);
    }
  };

  // Descargar video
  const handleDownloadVideo = (video: GeneratedVideo) => {
    const link = document.createElement('a');
    link.href = video.videoUrl;
    link.download = `genid-video-${video.identityName || 'sin-identidad'}-${video.id}.mp4`;
    link.click();
  };

  // Formatear fecha
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Sugerencias de prompts
  const promptSuggestions = [
    'La persona camina hacia la camara con expresion seria',
    'La persona sonrie y saluda a la camara',
    'La persona gira la cabeza lentamente mirando a su alrededor',
    'La persona habla animadamente como en una entrevista',
    'Efecto cinematico con movimiento de camara lento',
    'La persona baila al ritmo de musica',
  ];

  return (
    <div className="video-generator">
      <div className="panel-header">
        <h2>Generador de Video</h2>
        <span className={`webgpu-badge ${webgpuAvailable ? 'available' : ''}`}>
          {webgpuAvailable ? 'WebGPU Activo' : 'WebGPU No disponible'}
        </span>
      </div>

      {/* Sección de selección de imagen */}
      <div className="video-source-section">
        <div className="section-header">
          <h3>1. Selecciona una imagen base</h3>
          {selectedIdentity && (
            <span className="identity-badge">
              Identidad: {selectedIdentity.name}
            </span>
          )}
        </div>

        {selectedImage ? (
          <div className="selected-source">
            <img
              src={selectedImage.imageUrl}
              alt={selectedImage.prompt}
              className="source-preview"
            />
            <div className="source-info">
              <p className="source-identity">{selectedImage.identityName}</p>
              <p className="source-prompt">{selectedImage.prompt}</p>
              <button
                className="btn-secondary btn-small"
                onClick={() => setShowImagePicker(true)}
                disabled={isGenerating}
              >
                Cambiar imagen
              </button>
            </div>
          </div>
        ) : (
          <div className="source-placeholder" onClick={() => setShowImagePicker(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <p>Haz clic para seleccionar una imagen de la galeria</p>
          </div>
        )}
      </div>

      {/* Sección de prompt */}
      <div className="video-prompt-section">
        <h3>2. Describe el movimiento del video</h3>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe como quieres que se mueva la persona o que accion realice en el video..."
          disabled={isGenerating}
          rows={4}
        />

        <div className="suggestions">
          {promptSuggestions.map((suggestion, index) => (
            <button
              key={index}
              className="suggestion-chip"
              onClick={() => setPrompt(suggestion)}
              disabled={isGenerating}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Botón de generar */}
      <button
        className="btn-generate"
        onClick={handleGenerateVideo}
        disabled={isGenerating || !selectedImage || !prompt.trim()}
      >
        {isGenerating ? generationStatus : 'Generar Video con Veo 3'}
      </button>

      {/* Mensaje de error */}
      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* Vista previa del video generado */}
      {selectedVideo && (
        <div className="video-preview-section">
          <div className="section-header">
            <h3>Video Generado</h3>
            <div className="video-actions">
              <button
                className="btn-secondary btn-small"
                onClick={() => handleDownloadVideo(selectedVideo)}
              >
                Descargar
              </button>
              <button
                className="btn-danger btn-small"
                onClick={() => handleDeleteVideo(selectedVideo)}
              >
                Eliminar
              </button>
            </div>
          </div>

          <div className="video-player-container" ref={videoContainerRef}></div>

          <div className="video-info">
            <p className="video-identity">{selectedVideo.identityName || 'Sin identidad'}</p>
            <p className="video-prompt">{selectedVideo.prompt}</p>
            <p className="video-date">{formatDate(selectedVideo.createdAt)}</p>
          </div>
        </div>
      )}

      {/* Galería de videos generados */}
      {generatedVideos.length > 0 && (
        <div className="videos-gallery">
          <h3>Videos Generados ({generatedVideos.length})</h3>
          <div className="videos-grid">
            {generatedVideos.map((video) => (
              <div
                key={video.id}
                className={`video-card ${selectedVideo?.id === video.id ? 'selected' : ''}`}
                onClick={() => setSelectedVideo(video)}
              >
                <div className="video-thumbnail">
                  <img src={video.sourceImageThumbnail} alt={video.prompt} />
                  <div className="video-play-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5,3 19,12 5,21"></polygon>
                    </svg>
                  </div>
                </div>
                <div className="video-card-info">
                  <span className="video-card-identity">{video.identityName || 'Sin identidad'}</span>
                  <span className="video-card-date">{formatDate(video.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de selección de imagen */}
      {showImagePicker && (
        <div className="modal-overlay" onClick={() => setShowImagePicker(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Seleccionar imagen base</h3>
              <button className="modal-close" onClick={() => setShowImagePicker(false)}>
                ×
              </button>
            </div>

            {generatedImages.length === 0 ? (
              <div className="gallery-picker-empty">
                <p>No hay imagenes en la galeria.</p>
                <p>Primero genera algunas imagenes en la pestaña "Generar".</p>
              </div>
            ) : (
              <>
                {identityOptions.length > 1 && (
                  <div className="gallery-filter">
                    <select
                      value={galleryFilter}
                      onChange={(e) => setGalleryFilter(e.target.value)}
                    >
                      <option value="all">Todas las identidades</option>
                      {identityOptions.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="gallery-picker">
                  <div className="gallery-picker-grid">
                    {filteredImages.map((image) => (
                      <div
                        key={image.id}
                        className="gallery-picker-item"
                        onClick={() => handleSelectImage(image)}
                      >
                        <img src={image.imageUrl} alt={image.prompt} />
                        <div className="gallery-picker-overlay">
                          <span>{image.identityName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
