import { useState, useRef } from 'react';
import type { Identity, FeedComment } from '../types';
import { generateFeedComments } from '../services/gemini';

interface Props {
  identities: Identity[];
}

export function FeedGenerator({ identities }: Props) {
  const [postImage, setPostImage] = useState<string | null>(null);
  const [postImageThumbnail, setPostImageThumbnail] = useState<string | null>(null);
  const [postDescription, setPostDescription] = useState('');
  const [selectedIdentityIds, setSelectedIdentityIds] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Identidades que tienen contexto definido
  const identitiesWithContext = identities.filter(id => id.context);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    // Leer imagen como data URL
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setPostImage(dataUrl);

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
        setPostImageThumbnail(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);

    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setPostImage(null);
    setPostImageThumbnail(null);
    setComments([]);
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
    if (!postImage || selectedIdentityIds.size === 0) return;

    setIsGenerating(true);
    setComments([]);
    setGenerationProgress('Analizando imagen...');

    try {
      const selectedIdentities = identities.filter(id => selectedIdentityIds.has(id.id));

      setGenerationProgress(`Generando comentarios para ${selectedIdentities.length} identidad(es)...`);

      const generatedComments = await generateFeedComments(
        postImage,
        postDescription || undefined,
        selectedIdentities
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

  return (
    <div className="feed-generator">
      <div className="feed-header">
        <h2>Feed de Comentarios</h2>
        <p className="feed-description">
          Sube una imagen de publicación y genera comentarios realistas basados en el contexto de cada identidad.
        </p>
      </div>

      <div className="feed-content">
        {/* Sección de imagen del post */}
        <div className="feed-post-section">
          <h3>Publicación</h3>

          {!postImage ? (
            <div className="feed-upload-area">
              <label className="feed-upload-label">
                <div className="feed-upload-content">
                  <span className="feed-upload-icon">📷</span>
                  <span className="feed-upload-text">Haz clic para subir una imagen</span>
                  <span className="feed-upload-hint">Esta será la publicación que las identidades van a comentar</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          ) : (
            <div className="feed-post-preview">
              <div className="feed-post-image-container">
                <img
                  src={postImageThumbnail || postImage}
                  alt="Post"
                  className="feed-post-image"
                />
                <button
                  className="feed-post-remove"
                  onClick={handleRemoveImage}
                  title="Eliminar imagen"
                >
                  ×
                </button>
              </div>
              <textarea
                className="feed-post-description"
                placeholder="Descripción del post (opcional) - ayuda a contextualizar los comentarios"
                value={postDescription}
                onChange={(e) => setPostDescription(e.target.value)}
                rows={2}
              />
            </div>
          )}
        </div>

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
        {postImage && selectedIdentityIds.size > 0 && (
          <div className="feed-generate-section">
            <button
              className="btn-primary btn-generate-comments"
              onClick={handleGenerateComments}
              disabled={isGenerating}
            >
              {isGenerating ? generationProgress || 'Generando...' : `Generar ${selectedIdentityIds.size} Comentario(s)`}
            </button>
          </div>
        )}

        {/* Sección de comentarios generados */}
        {comments.length > 0 && (
          <div className="feed-comments-section">
            <h3>Comentarios Generados</h3>
            <div className="feed-comments-list">
              {comments.map(comment => (
                <div key={comment.id} className="feed-comment">
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
                    <span className="feed-comment-time">
                      {new Date(comment.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
