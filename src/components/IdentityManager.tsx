import { useState, useRef } from 'react';
import type { Identity } from '../types';
import {
  createIdentity,
  updateIdentity,
  deleteIdentity,
  addPhotoToIdentity,
  removePhotoFromIdentity,
  deleteGeneratedImagesByIdentity
} from '../services/identityStore';

interface Props {
  deviceId: string;
  identities: Identity[];
  selectedIdentity: Identity | null;
  onSelectIdentity: (identity: Identity | null) => void;
  onRefresh: () => void;
}

export function IdentityManager({ deviceId, identities, selectedIdentity, onSelectIdentity, onRefresh }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;

    await createIdentity(deviceId, newName.trim(), newDescription.trim());
    setNewName('');
    setNewDescription('');
    setIsCreating(false);
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    const confirmMessage = '¿Eliminar esta identidad?\n\nTambien se eliminarán todas las imágenes generadas con esta identidad.';
    if (!confirm(confirmMessage)) return;

    // Eliminar imágenes asociadas a la identidad
    await deleteGeneratedImagesByIdentity(id);
    // Eliminar la identidad
    await deleteIdentity(id);

    if (selectedIdentity?.id === id) {
      onSelectIdentity(null);
    }
    onRefresh();
  };

  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedIdentity || !e.target.files?.length) return;

    setIsUploading(true);
    try {
      const files = Array.from(e.target.files);
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        await addPhotoToIdentity(selectedIdentity.id, file);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onRefresh();
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async (photoId: string) => {
    if (!selectedIdentity) return;
    await removePhotoFromIdentity(selectedIdentity.id, photoId);
    onRefresh();
  };

  const handleStartEdit = () => {
    if (!selectedIdentity) return;
    setEditName(selectedIdentity.name);
    setEditDescription(selectedIdentity.description);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedIdentity || !editName.trim()) return;

    const updated = {
      ...selectedIdentity,
      name: editName.trim(),
      description: editDescription.trim()
    };
    await updateIdentity(updated);
    setIsEditing(false);
    onRefresh();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName('');
    setEditDescription('');
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewName('');
    setNewDescription('');
  };

  return (
    <div className="identity-manager">
      <div className="panel-header">
        <h2>Identidades</h2>
        <button className="btn-primary" onClick={() => setIsCreating(true)} disabled={isCreating}>
          + Nueva
        </button>
      </div>

      {isCreating && (
        <div className="create-form">
          <input
            type="text"
            placeholder="Nombre de la identidad"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
          <textarea
            placeholder="Descripcion (opcional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows={2}
          />
          <div className="form-actions">
            <button className="btn-secondary" onClick={handleCancelCreate}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={handleCreate} disabled={!newName.trim()}>
              Crear
            </button>
          </div>
        </div>
      )}

      <div className="identity-list">
        {identities.length === 0 ? (
          <div className="empty-identities">
            <p className="empty-message">No hay identidades creadas</p>
            <p className="empty-hint">Crea tu primera identidad para comenzar a generar imagenes</p>
          </div>
        ) : (
          identities.map((identity) => (
            <div
              key={identity.id}
              className={`identity-item ${selectedIdentity?.id === identity.id ? 'selected' : ''}`}
              onClick={() => onSelectIdentity(identity)}
            >
              <div className="identity-preview">
                {identity.photos[0] ? (
                  <img src={identity.photos[0].thumbnail} alt={identity.name} />
                ) : (
                  <div className="no-photo">?</div>
                )}
              </div>
              <div className="identity-info">
                <span className="identity-name">{identity.name}</span>
                <span className="photo-count">{identity.photos.length} fotos</span>
              </div>
              <button
                className="btn-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(identity.id);
                }}
                title="Eliminar identidad"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {selectedIdentity && (
        <div className="identity-details">
          <div className="details-header">
            {isEditing ? (
              <div className="edit-form">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nombre"
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  placeholder="Descripcion"
                />
                <div className="form-actions">
                  <button className="btn-secondary" onClick={handleCancelEdit}>
                    Cancelar
                  </button>
                  <button className="btn-primary" onClick={handleSaveEdit} disabled={!editName.trim()}>
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3>{selectedIdentity.name}</h3>
                {selectedIdentity.description && (
                  <p className="description">{selectedIdentity.description}</p>
                )}
                <button className="btn-secondary btn-small" onClick={handleStartEdit}>
                  Editar
                </button>
              </>
            )}
          </div>

          <div className="photos-section">
            <div className="photos-header">
              <span>Fotos de referencia ({selectedIdentity.photos.length})</span>
              <label className={`btn-secondary btn-small ${isUploading ? 'disabled' : ''}`}>
                {isUploading ? 'Subiendo...' : '+ Añadir'}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAddPhoto}
                  style={{ display: 'none' }}
                  disabled={isUploading}
                />
              </label>
            </div>

            <div className="photos-grid">
              {selectedIdentity.photos.map((photo) => (
                <div key={photo.id} className="photo-item">
                  <img src={photo.thumbnail} alt="" />
                  <button
                    className="photo-delete"
                    onClick={() => handleRemovePhoto(photo.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
              {selectedIdentity.photos.length === 0 && (
                <p className="empty-photos">Añade fotos de referencia para usar esta identidad en la generacion de imagenes</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
