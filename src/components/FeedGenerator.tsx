import { useState, useRef, useEffect } from 'react';
import type { Identity, FeedComment, FeedImage, ExistingComment } from '../types';
import { generateFeedCommentsThreaded } from '../services/gemini';

interface Props {
  identities: Identity[];
}

export function FeedGenerator({ identities }: Props) {
  // Estado para múltiples imágenes
  const [feedImages, setFeedImages] = useState<FeedImage[]>([]);
  const [postDescription, setPostDescription] = useState('');
  const [opinionBias, setOpinionBias] = useState('');
  // Estado para comentarios existentes de personas reales
  const [existingComments, setExistingComments] = useState<ExistingComment[]>([]);
  const [newExistingComment, setNewExistingComment] = useState({ authorName: '', content: '' });
  const [selectedIdentityIds, setSelectedIdentityIds] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<string>('');
  const [expandedComment, setExpandedComment] = useState<FeedComment | null>(null);
  const [copiedCommentId, setCopiedCommentId] = useState<string | null>(null);
  // Estado para modo de hilo
  const [threadedMode, setThreadedMode] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Identidades que tienen contexto definido
  const identitiesWithContext = identities.filter(id => id.context);

  // Función para procesar archivo de imagen y agregarlo al array
  const processImageFile = (file: File, imageType: FeedImage['type'] = 'post') => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;

      // Crear thumbnail
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);

        // Agregar nueva imagen al array
        const newImage: FeedImage = {
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: dataUrl,
          thumbnail,
          type: imageType,
        };
        setFeedImages(prev => [...prev, newImage]);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Manejar pegado de imágenes desde el portapapeles (soporta múltiples)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            // Si ya hay imágenes, las nuevas se agregan como capturas de comentarios
            const imageType = feedImages.length === 0 ? 'post' : 'comments_screenshot';
            processImageFile(file, imageType);
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [feedImages.length]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageType: FeedImage['type'] = 'post') => {
    const file = e.target.files?.[0];
    if (!file) return;

    processImageFile(file, imageType);

    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Eliminar una imagen específica
  const handleRemoveImage = (imageId: string) => {
    setFeedImages(prev => prev.filter(img => img.id !== imageId));
  };

  // Eliminar todas las imágenes
  const handleClearAllImages = () => {
    setFeedImages([]);
    setComments([]);
  };

  // Cambiar tipo de imagen
  const handleChangeImageType = (imageId: string, newType: FeedImage['type']) => {
    setFeedImages(prev => prev.map(img =>
      img.id === imageId ? { ...img, type: newType } : img
    ));
  };

  // Agregar comentario existente (de persona real)
  const handleAddExistingComment = () => {
    if (!newExistingComment.authorName.trim() || !newExistingComment.content.trim()) return;

    const newComment: ExistingComment = {
      id: `existing-${Date.now()}`,
      authorName: newExistingComment.authorName.trim(),
      content: newExistingComment.content.trim(),
    };
    setExistingComments(prev => [...prev, newComment]);
    setNewExistingComment({ authorName: '', content: '' });
  };

  // Eliminar comentario existente
  const handleRemoveExistingComment = (commentId: string) => {
    setExistingComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handleToggleIdentity = (identityId: string) => {
    const newSelected = new Set(selectedIdentityIds);
    if (newSelected.has(identityId)) {
      newSelected.delete(identityId);
    } else {
      newSelected.add(identityId);
    }
    setSelectedIdentityIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIdentityIds.size === identitiesWithContext.length) {
      setSelectedIdentityIds(new Set());
    } else {
      setSelectedIdentityIds(new Set(identitiesWithContext.map(id => id.id)));
    }
  };

  const handleGenerateComments = async () => {
    if (feedImages.length === 0 || selectedIdentityIds.size === 0) return;

    setIsGenerating(true);
    setComments([]);
    setGenerationProgress('Analizando imágenes...');

    try {
      const selectedIdentities = identities.filter(id => selectedIdentityIds.has(id.id));

      // Callback para actualizar el progreso en tiempo real
      const onProgress = (current: number, total: number, identityName: string) => {
        setGenerationProgress(`Generando comentario ${current}/${total}: ${identityName}...`);
      };

      const generatedComments = await generateFeedCommentsThreaded(
        feedImages,
        postDescription || undefined,
        selectedIdentities,
        existingComments.length > 0 ? existingComments : undefined,
        opinionBias || undefined,
        threadedMode,
        onProgress
      );

      setComments(generatedComments);
      setGenerationProgress('');
    } catch (error) {
      console.error('Error generando comentarios:', error);
      alert('Error al generar los comentarios. Por favor, intenta de nuevo.');
      setGenerationProgress('');
    } finally {
      setIsGenerating(false);
    }
  };

  const getSentimentEmoji = (sentiment: FeedComment['sentiment']) => {
    switch (sentiment) {
      case 'positive': return '👍';
      case 'negative': return '👎';
      case 'controversial': return '🔥';
      case 'humorous': return '😂';
      default: return '💬';
    }
  };

  const getSentimentClass = (sentiment: FeedComment['sentiment']) => {
    return `comment-sentiment comment-sentiment-${sentiment}`;
  };

  // Copiar comentario al portapapeles
  const handleCopyComment = async (comment: FeedComment) => {
    try {
      await navigator.clipboard.writeText(comment.content);
      setCopiedCommentId(comment.id);
      setTimeout(() => setCopiedCommentId(null), 2000);
    } catch (error) {
      console.error('Error al copiar comentario:', error);
    }
  };

  return (
    <div className="feed-generator">
      <div className="feed-header">
        <h2>Feed de Comentarios</h2>
        <p className="feed-description">
          Sube una imagen de publicación y genera comentarios realistas basados en el contexto de cada identidad.
        </p>
      </div>

      <div className="feed-content">
        {/* Sección de imágenes del post */}
        <div className="feed-post-section">
          <h3>Imágenes de Contexto</h3>
          <p className="feed-section-hint">
            Sube capturas de la publicación y de los comentarios existentes para que las identidades tengan contexto completo.
          </p>

          {/* Área de carga de imágenes */}
          <div className="feed-upload-area">
            <label className="feed-upload-label">
              <div className="feed-upload-content">
                <span className="feed-upload-icon">📷</span>
                <span className="feed-upload-text">Agregar imagen</span>
                <span className="feed-upload-hint">
                  {feedImages.length === 0
                    ? 'La primera imagen se considera la publicación principal'
                    : `${feedImages.length} imagen(es) cargada(s) - agrega más capturas`}
                </span>
                <span className="feed-upload-paste-hint">Ctrl+V para pegar desde el portapapeles</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, feedImages.length === 0 ? 'post' : 'comments_screenshot')}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Lista de imágenes cargadas */}
          {feedImages.length > 0 && (
            <div className="feed-images-grid">
              {feedImages.map((image, index) => (
                <div key={image.id} className="feed-image-item">
                  <div className="feed-image-preview">
                    <img src={image.thumbnail} alt={`Imagen ${index + 1}`} />
                    <button
                      className="feed-image-remove"
                      onClick={() => handleRemoveImage(image.id)}
                      title="Eliminar imagen"
                    >
                      ×
                    </button>
                    <span className={`feed-image-badge ${image.type}`}>
                      {image.type === 'post' ? '📝 Post' : image.type === 'comments_screenshot' ? '💬 Comentarios' : '📎 Otro'}
                    </span>
                  </div>
                  <select
                    className="feed-image-type-select"
                    value={image.type}
                    onChange={(e) => handleChangeImageType(image.id, e.target.value as FeedImage['type'])}
                  >
                    <option value="post">Publicación</option>
                    <option value="comments_screenshot">Captura de comentarios</option>
                    <option value="other">Otro contexto</option>
                  </select>
                </div>
              ))}
              <button
                className="feed-clear-images btn-secondary btn-small"
                onClick={handleClearAllImages}
              >
                Limpiar todas
              </button>
            </div>
          )}

          {/* Descripción y sesgo (solo si hay imágenes) */}
          {feedImages.length > 0 && (
            <div className="feed-post-details">
              <textarea
                className="feed-post-description"
                placeholder="Descripción del post (opcional) - ayuda a contextualizar los comentarios"
                value={postDescription}
                onChange={(e) => setPostDescription(e.target.value)}
                rows={2}
              />
              <textarea
                className="feed-opinion-bias"
                placeholder="Sesgo de opinión (opcional) - Ej: 'Las identidades deben defender la política X', 'Debatir sobre el tema Y', 'Mostrar escepticismo hacia Z', etc."
                value={opinionBias}
                onChange={(e) => setOpinionBias(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Sección de comentarios existentes (de personas reales) */}
        {feedImages.length > 0 && (
          <div className="feed-existing-comments-section">
            <h3>Comentarios Existentes (Opcional)</h3>
            <p className="feed-section-hint">
              Agrega comentarios de personas reales que las identidades podrán leer y responder, creando un hilo más realista.
            </p>

            {/* Lista de comentarios existentes */}
            {existingComments.length > 0 && (
              <div className="feed-existing-comments-list">
                {existingComments.map(comment => (
                  <div key={comment.id} className="feed-existing-comment">
                    <div className="feed-existing-comment-header">
                      <span className="feed-existing-comment-author">@{comment.authorName}</span>
                      <button
                        className="feed-existing-comment-remove"
                        onClick={() => handleRemoveExistingComment(comment.id)}
                      >
                        ×
                      </button>
                    </div>
                    <p className="feed-existing-comment-content">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Formulario para agregar comentario existente */}
            <div className="feed-add-existing-comment">
              <input
                type="text"
                className="feed-existing-author-input"
                placeholder="Nombre de usuario (ej: juan_perez)"
                value={newExistingComment.authorName}
                onChange={(e) => setNewExistingComment(prev => ({ ...prev, authorName: e.target.value }))}
              />
              <textarea
                className="feed-existing-content-input"
                placeholder="Texto del comentario..."
                value={newExistingComment.content}
                onChange={(e) => setNewExistingComment(prev => ({ ...prev, content: e.target.value }))}
                rows={2}
              />
              <button
                className="btn-secondary btn-small"
                onClick={handleAddExistingComment}
                disabled={!newExistingComment.authorName.trim() || !newExistingComment.content.trim()}
              >
                + Agregar comentario
              </button>
            </div>
          </div>
        )}

        {/* Sección de selección de identidades */}
        <div className="feed-identities-section">
          <div className="feed-identities-header">
            <h3>Identidades que comentarán</h3>
            {identitiesWithContext.length > 0 && (
              <button
                className="btn-secondary btn-small"
                onClick={handleSelectAll}
              >
                {selectedIdentityIds.size === identitiesWithContext.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
              </button>
            )}
          </div>

          {identitiesWithContext.length === 0 ? (
            <div className="feed-no-identities">
              <p className="feed-warning">
                No hay identidades con contexto definido.
              </p>
              <p className="feed-hint">
                Para generar comentarios, primero debes agregar un contexto de personalidad a al menos una identidad desde el panel de Identidades.
              </p>
            </div>
          ) : (
            <div className="feed-identities-grid">
              {identitiesWithContext.map(identity => (
                <div
                  key={identity.id}
                  className={`feed-identity-card ${selectedIdentityIds.has(identity.id) ? 'selected' : ''}`}
                  onClick={() => handleToggleIdentity(identity.id)}
                >
                  <div className="feed-identity-avatar">
                    {identity.photos[0] ? (
                      <img src={identity.photos[0].thumbnail} alt={identity.name} />
                    ) : (
                      <div className="feed-identity-no-avatar">?</div>
                    )}
                  </div>
                  <div className="feed-identity-info">
                    <span className="feed-identity-name">{identity.name}</span>
                    {identity.description && (
                      <span className="feed-identity-desc">{identity.description}</span>
                    )}
                  </div>
                  <div className="feed-identity-check">
                    {selectedIdentityIds.has(identity.id) ? '✓' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botón de generación */}
        {feedImages.length > 0 && selectedIdentityIds.size > 0 && (
          <div className="feed-generate-section">
            <div className="feed-generate-options">
              <label className="feed-threaded-toggle">
                <input
                  type="checkbox"
                  checked={threadedMode}
                  onChange={(e) => setThreadedMode(e.target.checked)}
                />
                <span className="feed-toggle-label">
                  Modo hilo de conversación
                  <span className="feed-toggle-hint">
                    {threadedMode
                      ? 'Las identidades comentan en secuencia, cada una ve lo que dijeron las anteriores'
                      : 'Comentarios independientes, sin contexto de los otros'}
                  </span>
                </span>
              </label>
            </div>
            <button
              className="btn-primary btn-generate-comments"
              onClick={handleGenerateComments}
              disabled={isGenerating}
            >
              {isGenerating ? generationProgress || 'Generando...' : `Generar ${selectedIdentityIds.size} Comentario(s) en Hilo`}
            </button>
            {selectedIdentityIds.size > 1 && threadedMode && (
              <p className="feed-generate-hint">
                Los comentarios se generarán secuencialmente, creando una conversación natural entre las identidades.
              </p>
            )}
          </div>
        )}

        {/* Sección de comentarios generados */}
        {comments.length > 0 && (
          <div className="feed-comments-section">
            <h3>Comentarios Generados ({comments.length})</h3>
            <p className="feed-section-hint">
              {threadedMode && comments.length > 1
                ? 'Hilo de conversación - cada identidad respondió considerando los comentarios anteriores'
                : 'Comentarios generados basándose en el contexto visual'}
            </p>
            <div className="feed-comments-list">
              {comments.map((comment, index) => (
                <div key={comment.id} className={`feed-comment ${threadedMode ? 'threaded' : ''}`}>
                  {threadedMode && (
                    <div className="feed-comment-thread-indicator">
                      <span className="feed-comment-thread-number">#{index + 1}</span>
                      {index > 0 && <div className="feed-comment-thread-line" />}
                    </div>
                  )}
                  <div className="feed-comment-avatar">
                    {comment.identityThumbnail ? (
                      <img src={comment.identityThumbnail} alt={comment.identityName} />
                    ) : (
                      <div className="feed-comment-no-avatar">?</div>
                    )}
                  </div>
                  <div className="feed-comment-content">
                    <div className="feed-comment-header">
                      <span className="feed-comment-name">{comment.identityName}</span>
                      <span className={getSentimentClass(comment.sentiment)}>
                        {getSentimentEmoji(comment.sentiment)}
                      </span>
                    </div>
                    <p className="feed-comment-text">{comment.content}</p>
                    <div className="feed-comment-footer">
                      <span className="feed-comment-time">
                        {new Date(comment.createdAt).toLocaleTimeString()}
                      </span>
                      <div className="feed-comment-actions">
                        <button
                          className={`feed-comment-action-btn ${copiedCommentId === comment.id ? 'copied' : ''}`}
                          onClick={() => handleCopyComment(comment)}
                          title="Copiar comentario"
                        >
                          {copiedCommentId === comment.id ? '✓ Copiado' : '📋 Copiar'}
                        </button>
                        <button
                          className="feed-comment-action-btn"
                          onClick={() => setExpandedComment(comment)}
                          title="Ver comentario completo"
                        >
                          🔍 Ver completo
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal para ver comentario completo */}
        {expandedComment && (
          <div className="feed-comment-modal-overlay" onClick={() => setExpandedComment(null)}>
            <div className="feed-comment-modal" onClick={(e) => e.stopPropagation()}>
              <div className="feed-comment-modal-header">
                <div className="feed-comment-modal-identity">
                  <div className="feed-comment-modal-avatar">
                    {expandedComment.identityThumbnail ? (
                      <img src={expandedComment.identityThumbnail} alt={expandedComment.identityName} />
                    ) : (
                      <div className="feed-comment-no-avatar">?</div>
                    )}
                  </div>
                  <div className="feed-comment-modal-info">
                    <span className="feed-comment-modal-name">{expandedComment.identityName}</span>
                    <span className={getSentimentClass(expandedComment.sentiment)}>
                      {getSentimentEmoji(expandedComment.sentiment)} {expandedComment.sentiment}
                    </span>
                  </div>
                </div>
                <button className="feed-comment-modal-close" onClick={() => setExpandedComment(null)}>
                  ×
                </button>
              </div>
              <div className="feed-comment-modal-body">
                <p className="feed-comment-modal-text">{expandedComment.content}</p>
              </div>
              <div className="feed-comment-modal-footer">
                <span className="feed-comment-time">
                  {new Date(expandedComment.createdAt).toLocaleTimeString()}
                </span>
                <button
                  className={`btn-secondary ${copiedCommentId === expandedComment.id ? 'copied' : ''}`}
                  onClick={() => handleCopyComment(expandedComment)}
                >
                  {copiedCommentId === expandedComment.id ? '✓ Copiado al portapapeles' : '📋 Copiar comentario'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
