import { useState, useRef } from 'react';
import type { Identity, IdentityPhoto } from '../types';
import {
  createIdentity,
  updateIdentity,
  deleteIdentity,
  addPhotoToIdentity,
  removePhotoFromIdentity,
  updatePhotoFaceDescription,
  removePhotoFaceDescription,
  deleteGeneratedImagesByIdentity,
  deleteFaceVariantsByIdentity
} from '../services/identityStore';
import { analyzeFaceForConsistency, generateIdentityContext } from '../services/gemini';
import { FaceVariantsGenerator } from './FaceVariantsGenerator';

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
  const [analyzingPhotoId, setAnalyzingPhotoId] = useState<string | null>(null);
  const [expandedPhotoId, setExpandedPhotoId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para el contexto de identidad
  const [isEditingContext, setIsEditingContext] = useState(false);
  const [contextIdeas, setContextIdeas] = useState('');
  const [editedContext, setEditedContext] = useState('');
  const [isGeneratingContext, setIsGeneratingContext] = useState(false);
  const [showContextPanel, setShowContextPanel] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;

    await createIdentity(deviceId, newName.trim(), newDescription.trim());
    setNewName('');
    setNewDescription('');
    setIsCreating(false);
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    const confirmMessage = '¿Eliminar esta identidad?\n\nTambien se eliminarán todas las imágenes generadas y variantes de rostro.';
    if (!confirm(confirmMessage)) return;

    // Eliminar imágenes asociadas a la identidad
    await deleteGeneratedImagesByIdentity(id);
    // Eliminar variantes de rostro
    await deleteFaceVariantsByIdentity(id);
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
    // Al eliminar la foto, también se elimina la descripción facial asociada
    await removePhotoFromIdentity(selectedIdentity.id, photoId);
    if (expandedPhotoId === photoId) {
      setExpandedPhotoId(null);
    }
    onRefresh();
  };

  const handleGenerateFaceDescription = async (photo: IdentityPhoto) => {
    if (!selectedIdentity || analyzingPhotoId) return;

    setAnalyzingPhotoId(photo.id);
    try {
      const description = await analyzeFaceForConsistency(photo.dataUrl);
      await updatePhotoFaceDescription(selectedIdentity.id, photo.id, description);
      setExpandedPhotoId(photo.id);
      onRefresh();
    } catch (error) {
      console.error('Error al analizar rostro:', error);
      alert('Error al generar la descripción del rostro. Por favor, intenta de nuevo.');
    } finally {
      setAnalyzingPhotoId(null);
    }
  };

  const handleRemoveFaceDescription = async (photoId: string) => {
    if (!selectedIdentity) return;
    if (!confirm('¿Eliminar la descripción facial de esta foto?')) return;

    await removePhotoFaceDescription(selectedIdentity.id, photoId);
    if (expandedPhotoId === photoId) {
      setExpandedPhotoId(null);
    }
    onRefresh();
  };

  const togglePhotoExpansion = (photoId: string) => {
    setExpandedPhotoId(expandedPhotoId === photoId ? null : photoId);
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

  // Funciones para manejo del contexto de identidad
  const handleStartEditContext = () => {
    if (!selectedIdentity) return;
    setEditedContext(selectedIdentity.context || '');
    setContextIdeas('');
    setIsEditingContext(true);
    setShowContextPanel(true);
  };

  const handleSaveContext = async () => {
    if (!selectedIdentity) return;

    const updated = {
      ...selectedIdentity,
      context: editedContext.trim() || undefined
    };
    await updateIdentity(updated);
    setIsEditingContext(false);
    onRefresh();
  };

  const handleCancelEditContext = () => {
    setIsEditingContext(false);
    setContextIdeas('');
    setEditedContext('');
  };

  const handleGenerateContext = async () => {
    if (!contextIdeas.trim()) {
      alert('Por favor, escribe algunas ideas principales para generar el contexto.');
      return;
    }

    setIsGeneratingContext(true);
    try {
      const generatedContext = await generateIdentityContext(
        contextIdeas,
        selectedIdentity?.name
      );
      setEditedContext(generatedContext);
    } catch (error) {
      console.error('Error generando contexto:', error);
      alert('Error al generar el contexto. Por favor, intenta de nuevo.');
    } finally {
      setIsGeneratingContext(false);
    }
  };

  const handleRemoveContext = async () => {
    if (!selectedIdentity) return;
    if (!confirm('¿Eliminar el contexto de esta identidad?')) return;

    const updated = {
      ...selectedIdentity,
      context: undefined
    };
    await updateIdentity(updated);
    setShowContextPanel(false);
    onRefresh();
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

          {/* Sección de Contexto de Identidad */}
          <div className="context-section">
            <div className="context-header">
              <span className="context-title">
                Contexto de Personalidad
                {selectedIdentity.context && <span className="context-badge">Definido</span>}
              </span>
              {!isEditingContext && (
                <div className="context-actions">
                  {selectedIdentity.context ? (
                    <>
                      <button
                        className="btn-secondary btn-small"
                        onClick={() => setShowContextPanel(!showContextPanel)}
                      >
                        {showContextPanel ? 'Ocultar' : 'Ver'}
                      </button>
                      <button
                        className="btn-secondary btn-small"
                        onClick={handleStartEditContext}
                      >
                        Editar
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn-primary btn-small"
                      onClick={handleStartEditContext}
                    >
                      + Agregar Contexto
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Panel de visualización del contexto */}
            {showContextPanel && selectedIdentity.context && !isEditingContext && (
              <div className="context-view-panel">
                <pre className="context-content">{selectedIdentity.context}</pre>
                <div className="context-view-actions">
                  <button
                    className="btn-danger btn-small"
                    onClick={handleRemoveContext}
                  >
                    Eliminar Contexto
                  </button>
                </div>
              </div>
            )}

            {/* Panel de edición del contexto */}
            {isEditingContext && (
              <div className="context-edit-panel">
                <div className="context-ideas-section">
                  <label className="context-label">
                    Ideas principales (escribe notas breves y genera un contexto completo):
                  </label>
                  <textarea
                    className="context-ideas-input"
                    placeholder="Ej: Mujer de 35 años, ingeniera de software, escéptica, usa sarcasmo, le gusta el café, odia las fotos de comida..."
                    value={contextIdeas}
                    onChange={(e) => setContextIdeas(e.target.value)}
                    rows={3}
                    disabled={isGeneratingContext}
                  />
                  <button
                    className="btn-generate-context"
                    onClick={handleGenerateContext}
                    disabled={isGeneratingContext || !contextIdeas.trim()}
                  >
                    {isGeneratingContext ? 'Generando...' : 'Generar Contexto Completo'}
                  </button>
                </div>

                <div className="context-divider">
                  <span>o edita directamente:</span>
                </div>

                <div className="context-editor-section">
                  <label className="context-label">Contexto detallado:</label>
                  <textarea
                    className="context-editor-input"
                    placeholder="Describe la personalidad, sesgos, intereses, estilo de comunicación, etc. Este contexto se usará para generar comentarios realistas en el Feed."
                    value={editedContext}
                    onChange={(e) => setEditedContext(e.target.value)}
                    rows={10}
                    disabled={isGeneratingContext}
                  />
                </div>

                <div className="context-form-actions">
                  <button
                    className="btn-secondary"
                    onClick={handleCancelEditContext}
                    disabled={isGeneratingContext}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleSaveContext}
                    disabled={isGeneratingContext}
                  >
                    Guardar Contexto
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Generador de variantes de rostro */}
          <FaceVariantsGenerator identity={selectedIdentity} onRefresh={onRefresh} />

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
                <div
                  key={photo.id}
                  className={`photo-item-container ${expandedPhotoId === photo.id ? 'expanded' : ''} ${photo.faceDescription ? 'has-description' : ''}`}
                >
                  <div className="photo-item">
                    <img src={photo.thumbnail} alt="" onClick={() => photo.faceDescription && togglePhotoExpansion(photo.id)} />

                    {/* Indicador de descripción facial */}
                    {photo.faceDescription && (
                      <div
                        className="face-description-indicator"
                        onClick={() => togglePhotoExpansion(photo.id)}
                        title="Ver descripción facial"
                      >
                        📋
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div className="photo-actions">
                      {!photo.faceDescription ? (
                        <button
                          className="btn-generate-description"
                          onClick={() => handleGenerateFaceDescription(photo)}
                          disabled={analyzingPhotoId !== null}
                          title="Generar descripción facial"
                        >
                          {analyzingPhotoId === photo.id ? '⏳' : '🔍'}
                        </button>
                      ) : (
                        <button
                          className="btn-remove-description"
                          onClick={() => handleRemoveFaceDescription(photo.id)}
                          title="Eliminar descripción facial"
                        >
                          📋✕
                        </button>
                      )}
                      <button
                        className="photo-delete"
                        onClick={() => handleRemovePhoto(photo.id)}
                        title="Eliminar foto y descripción"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {/* Panel expandido con descripción facial */}
                  {expandedPhotoId === photo.id && photo.faceDescription && (
                    <div className="face-description-panel">
                      <div className="face-description-header">
                        <span>Descripción Facial Antropométrica</span>
                        <button
                          className="btn-close-panel"
                          onClick={() => setExpandedPhotoId(null)}
                        >
                          ×
                        </button>
                      </div>
                      <div className="face-description-content">
                        <pre>{photo.faceDescription}</pre>
                      </div>
                      <div className="face-description-footer">
                        <small>
                          Generada: {new Date(photo.faceDescriptionGeneratedAt || 0).toLocaleString()}
                        </small>
                        <button
                          className="btn-regenerate"
                          onClick={() => handleGenerateFaceDescription(photo)}
                          disabled={analyzingPhotoId !== null}
                        >
                          {analyzingPhotoId === photo.id ? 'Analizando...' : 'Regenerar'}
                        </button>
                      </div>
                    </div>
                  )}
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
