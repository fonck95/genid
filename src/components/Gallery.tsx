import { useState } from 'react';
import type { GeneratedImage, GeneratedVideo, Identity } from '../types';
import { deleteGeneratedImage, deleteGeneratedVideo } from '../services/identityStore';
import { DownloadNotification, useDownload } from './DownloadNotification';

/** Tipo unificado para elementos de la galería */
type GalleryItem =
  | (GeneratedImage & { type: 'image' })
  | (GeneratedVideo & { type: 'video' });

interface Props {
  images: GeneratedImage[];
  videos: GeneratedVideo[];
  identities: Identity[];
  onRefresh: () => void;
  onStartEditingThread?: (imageUrl: string, prompt: string, identityId?: string, identityName?: string) => void;
}

export function Gallery({ images, videos, identities, onRefresh, onStartEditingThread }: Props) {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'images' | 'videos'>('all');
  const { downloadState, downloadImage, resetDownload } = useDownload();

  // Combinar imágenes y videos en una lista unificada
  const allItems: GalleryItem[] = [
    ...images.map(img => ({ ...img, type: 'image' as const })),
    ...videos.map(vid => ({ ...vid, type: 'video' as const }))
  ].sort((a, b) => b.createdAt - a.createdAt);

  // Obtener identidades únicas de todos los items
  const uniqueIdentityIds = [...new Set(allItems.map(item => item.identityId).filter(Boolean))];
  const identityOptions = uniqueIdentityIds.map(id => {
    const identity = identities.find(i => i.id === id);
    const item = allItems.find(i => i.identityId === id);
    return {
      id: id!,
      name: identity?.name || (item && 'identityName' in item ? item.identityName : 'Desconocido') || 'Desconocido'
    };
  });

  // Filtrar items por identidad y tipo
  let filteredItems = filter === 'all'
    ? allItems
    : allItems.filter(item => item.identityId === filter);

  if (typeFilter !== 'all') {
    filteredItems = filteredItems.filter(item =>
      typeFilter === 'images' ? item.type === 'image' : item.type === 'video'
    );
  }

  const handleDeleteImage = async (id: string) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    await deleteGeneratedImage(id);
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
    onRefresh();
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('¿Eliminar este video?')) return;
    await deleteGeneratedVideo(id);
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
    onRefresh();
  };

  const handleDownloadImage = (image: GeneratedImage) => {
    const fileName = `genid-${image.identityName}-${image.id}.png`;
    downloadImage(image.imageUrl, fileName);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Contadores
  const imageCount = images.length;
  const videoCount = videos.length;

  // Si no hay items y no hay identidades
  if (allItems.length === 0 && identities.length === 0) {
    return (
      <div className="gallery">
        <div className="panel-header">
          <h2>Galeria</h2>
        </div>
        <div className="gallery-empty">
          <div className="gallery-empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </div>
          <h3>Tu galeria esta vacia</h3>
          <p>
            Crea una identidad y genera tu primera imagen para verla aqui.
            Las imagenes y videos se guardan automaticamente en la galeria.
          </p>
        </div>
      </div>
    );
  }

  // Si no hay items pero hay identidades
  if (allItems.length === 0) {
    return (
      <div className="gallery">
        <div className="panel-header">
          <h2>Galeria</h2>
        </div>
        <div className="gallery-empty">
          <div className="gallery-empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </div>
          <h3>No hay contenido generado</h3>
          <p>
            Selecciona una identidad y genera imagenes o videos.
            Todo el contenido aparecera aqui organizado por fecha.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery">
      <div className="panel-header">
        <h2>Galeria ({filteredItems.length})</h2>
        <div className="gallery-filters">
          {/* Filtro por tipo */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | 'images' | 'videos')}
            className="type-filter"
          >
            <option value="all">Todo ({imageCount + videoCount})</option>
            <option value="images">Imagenes ({imageCount})</option>
            <option value="videos">Videos ({videoCount})</option>
          </select>

          {/* Filtro por identidad */}
          {identityOptions.length > 1 && (
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Todas las identidades</option>
              {identityOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="gallery-grid">
        {filteredItems.map((item) => (
          <div
            key={`${item.type}-${item.id}`}
            className={`gallery-item ${item.type === 'video' ? 'video-item' : ''}`}
            onClick={() => setSelectedItem(item)}
          >
            {item.type === 'image' ? (
              <img src={item.imageUrl} alt={item.prompt} />
            ) : (
              <>
                <img src={item.sourceImageThumbnail || item.sourceImageUrl} alt={item.prompt} />
                <div className="video-indicator">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  <span className="video-duration-badge">{item.duration}s</span>
                </div>
              </>
            )}
            <div className="gallery-item-overlay">
              <span className="identity-label">
                {item.type === 'image' ? item.identityName : (item.identityName || 'Sin identidad')}
              </span>
              {item.type === 'video' && (
                <span className="type-badge video-badge">Video</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox para imágenes */}
      {selectedItem && selectedItem.type === 'image' && (
        <div className="lightbox" onClick={() => setSelectedItem(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setSelectedItem(null)}>
              ×
            </button>
            <img src={selectedItem.imageUrl} alt={selectedItem.prompt} />
            <div className="lightbox-info">
              <p className="lightbox-identity">{selectedItem.identityName}</p>
              <p className="lightbox-prompt">{selectedItem.prompt}</p>
              <p className="lightbox-date">{formatDate(selectedItem.createdAt)}</p>
              <div className="lightbox-actions">
                <button
                  className="btn-download-fancy"
                  onClick={() => handleDownloadImage(selectedItem)}
                  disabled={downloadState.status === 'downloading'}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Descargar</span>
                </button>
                {onStartEditingThread && (
                  <button
                    className="btn-edit-thread"
                    onClick={() => {
                      onStartEditingThread(
                        selectedItem.imageUrl,
                        selectedItem.prompt,
                        selectedItem.identityId,
                        selectedItem.identityName
                      );
                      setSelectedItem(null);
                    }}
                  >
                    Editar
                  </button>
                )}
                <button
                  className="btn-danger"
                  onClick={() => handleDeleteImage(selectedItem.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox para videos */}
      {selectedItem && selectedItem.type === 'video' && (
        <div className="lightbox" onClick={() => setSelectedItem(null)}>
          <div className="lightbox-content video-lightbox" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setSelectedItem(null)}>
              ×
            </button>
            <div className="video-player-container">
              <video
                src={selectedItem.videoUrl}
                controls
                autoPlay
                loop
                className="video-player"
              />
            </div>
            <div className="lightbox-info">
              <p className="lightbox-identity">{selectedItem.identityName || 'Sin identidad'}</p>
              <p className="lightbox-prompt">{selectedItem.prompt}</p>
              <div className="video-meta">
                <span>Duracion: {selectedItem.duration}s</span>
                <span>Modelo: {selectedItem.model}</span>
                <span>Modo: {selectedItem.mode === 'pro' ? 'Profesional' : 'Estandar'}</span>
              </div>
              <p className="lightbox-date">{formatDate(selectedItem.createdAt)}</p>
              <div className="lightbox-actions">
                <a
                  href={selectedItem.videoUrl}
                  download={`video-${selectedItem.identityName || 'genid'}-${selectedItem.id}.mp4`}
                  className="btn-download-fancy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Descargar</span>
                </a>
                <button
                  className="btn-danger"
                  onClick={() => handleDeleteVideo(selectedItem.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DownloadNotification
        downloadState={downloadState}
        onClose={resetDownload}
      />
    </div>
  );
}
