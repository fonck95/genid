import { useState } from 'react';
import type { GeneratedImage, Identity } from '../types';
import { deleteGeneratedImage } from '../services/identityStore';
import { DownloadNotification, useDownload } from './DownloadNotification';

interface Props {
  images: GeneratedImage[];
  identities: Identity[];
  onRefresh: () => void;
  onStartEditingThread?: (imageUrl: string, prompt: string, identityId?: string, identityName?: string) => void;
}

export function Gallery({ images, identities, onRefresh, onStartEditingThread }: Props) {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const { downloadState, downloadImage, resetDownload } = useDownload();

  // Obtener identidades únicas de las imágenes
  const uniqueIdentityIds = [...new Set(images.map(img => img.identityId))];
  const identityOptions = uniqueIdentityIds.map(id => {
    const identity = identities.find(i => i.id === id);
    return {
      id,
      name: identity?.name || images.find(img => img.identityId === id)?.identityName || 'Desconocido'
    };
  });

  const filteredImages = filter === 'all'
    ? images
    : images.filter(img => img.identityId === filter);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    await deleteGeneratedImage(id);
    if (selectedImage?.id === id) {
      setSelectedImage(null);
    }
    onRefresh();
  };

  const handleDownload = (image: GeneratedImage) => {
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

  // Si no hay imágenes y no hay identidades
  if (images.length === 0 && identities.length === 0) {
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
            Las imagenes se guardan automaticamente en la galeria.
          </p>
        </div>
      </div>
    );
  }

  // Si no hay imágenes pero hay identidades
  if (images.length === 0) {
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
          <h3>No hay imagenes generadas</h3>
          <p>
            Selecciona una identidad y genera imagenes.
            Todas las imagenes aparecerán aqui organizadas por identidad.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery">
      <div className="panel-header">
        <h2>Galeria ({filteredImages.length})</h2>
        {identityOptions.length > 1 && (
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Todas las identidades</option>
            {identityOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="gallery-grid">
        {filteredImages.map((image) => (
          <div
            key={image.id}
            className="gallery-item"
            onClick={() => setSelectedImage(image)}
          >
            <img src={image.imageUrl} alt={image.prompt} />
            <div className="gallery-item-overlay">
              <span className="identity-label">{image.identityName}</span>
            </div>
          </div>
        ))}
      </div>

      {selectedImage && (
        <div className="lightbox" onClick={() => setSelectedImage(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setSelectedImage(null)}>
              ×
            </button>
            <img src={selectedImage.imageUrl} alt={selectedImage.prompt} />
            <div className="lightbox-info">
              <p className="lightbox-identity">{selectedImage.identityName}</p>
              <p className="lightbox-prompt">{selectedImage.prompt}</p>
              <p className="lightbox-date">{formatDate(selectedImage.createdAt)}</p>
              <div className="lightbox-actions">
                <button
                  className="btn-download-fancy"
                  onClick={() => handleDownload(selectedImage)}
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
                        selectedImage.imageUrl,
                        selectedImage.prompt,
                        selectedImage.identityId,
                        selectedImage.identityName
                      );
                      setSelectedImage(null);
                    }}
                  >
                    Editar
                  </button>
                )}
                <button
                  className="btn-danger"
                  onClick={() => handleDelete(selectedImage.id)}
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
