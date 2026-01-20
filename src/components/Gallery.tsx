import { useState } from 'react';
import type { GeneratedImage } from '../types';
import { deleteGeneratedImage } from '../services/identityStore';

interface Props {
  images: GeneratedImage[];
  onRefresh: () => void;
}

export function Gallery({ images, onRefresh }: Props) {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const uniqueIdentities = [...new Set(images.map(img => img.identityName))];

  const filteredImages = filter === 'all'
    ? images
    : images.filter(img => img.identityName === filter);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    await deleteGeneratedImage(id);
    if (selectedImage?.id === id) {
      setSelectedImage(null);
    }
    onRefresh();
  };

  const handleDownload = (image: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = image.imageUrl;
    link.download = `genid-${image.identityName}-${image.id}.png`;
    link.click();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="gallery">
      <div className="panel-header">
        <h2>Galería ({filteredImages.length})</h2>
        {uniqueIdentities.length > 1 && (
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Todas</option>
            {uniqueIdentities.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        )}
      </div>

      {filteredImages.length === 0 ? (
        <p className="empty-message">No hay imágenes generadas</p>
      ) : (
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
      )}

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
                  className="btn-secondary"
                  onClick={() => handleDownload(selectedImage)}
                >
                  Descargar
                </button>
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
    </div>
  );
}
