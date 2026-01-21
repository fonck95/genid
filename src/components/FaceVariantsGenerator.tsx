import { useState, useRef, useEffect } from 'react';
import type { Identity, FaceVariantsSet, FaceVariant, FaceVariantType } from '../types';
import { generateAllFaceVariants } from '../services/gemini';
import {
  saveFaceVariantsSet,
  getFaceVariantsByIdentity,
  deleteFaceVariantsSet,
  useVariantAsIdentityPhoto
} from '../services/identityStore';

interface Props {
  identity: Identity;
  onRefresh: () => void;
}

type GenerationStatus = 'idle' | 'generating' | 'completed' | 'error';
type VariantStatus = 'pending' | 'generating' | 'completed' | 'error';

const VARIANT_LABELS: Record<FaceVariantType, string> = {
  afroamerican: 'Afroamericana',
  latin: 'Latina',
  caucasian: 'Caucásica'
};

const VARIANT_DESCRIPTIONS: Record<FaceVariantType, string> = {
  afroamerican: 'Rasgos afroamericanos con proporciones de belleza optimizadas',
  latin: 'Rasgos latinos con proporciones de belleza optimizadas',
  caucasian: 'Rasgos caucásicos/anglosajones con proporciones de belleza optimizadas'
};

export function FaceVariantsGenerator({ identity, onRefresh }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [baseImageThumbnail, setBaseImageThumbnail] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('idle');
  const [variantStatuses, setVariantStatuses] = useState<Record<FaceVariantType, VariantStatus>>({
    afroamerican: 'pending',
    latin: 'pending',
    caucasian: 'pending'
  });
  const [generatedVariants, setGeneratedVariants] = useState<Record<FaceVariantType, string> | null>(null);
  const [savedVariantsSets, setSavedVariantsSets] = useState<FaceVariantsSet[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariantForView, setSelectedVariantForView] = useState<FaceVariant | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar variantes guardadas al montar
  useEffect(() => {
    loadSavedVariants();
  }, [identity.id]);

  const loadSavedVariants = async () => {
    try {
      const sets = await getFaceVariantsByIdentity(identity.id);
      setSavedVariantsSets(sets);
    } catch (err) {
      console.error('Error cargando variantes guardadas:', err);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convertir a base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setBaseImage(dataUrl);

      // Crear thumbnail
      const thumbnail = await createThumbnail(dataUrl, 150);
      setBaseImageThumbnail(thumbnail);

      // Resetear estados
      setGenerationStatus('idle');
      setGeneratedVariants(null);
      setError(null);
      setVariantStatuses({
        afroamerican: 'pending',
        latin: 'pending',
        caucasian: 'pending'
      });
    };
    reader.readAsDataURL(file);

    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const createThumbnail = (imageUrl: string, size: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const scale = Math.max(size / img.width, size / img.height);
          const x = (size - img.width * scale) / 2;
          const y = (size - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        }
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => resolve(imageUrl);
      img.src = imageUrl;
    });
  };

  const handleGenerate = async () => {
    if (!baseImage) return;

    setGenerationStatus('generating');
    setError(null);
    setVariantStatuses({
      afroamerican: 'pending',
      latin: 'pending',
      caucasian: 'pending'
    });

    try {
      const variants = await generateAllFaceVariants(
        baseImage,
        (variantType, status) => {
          setVariantStatuses(prev => ({
            ...prev,
            [variantType]: status === 'generating' ? 'generating' : status === 'completed' ? 'completed' : 'error'
          }));
        }
      );

      setGeneratedVariants(variants);
      setGenerationStatus('completed');

      // Guardar en el store
      await saveFaceVariantsSet(identity.id, baseImage, variants);
      await loadSavedVariants();

    } catch (err) {
      console.error('Error generando variantes:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al generar variantes');
      setGenerationStatus('error');
    }
  };

  const handleUseAsPhoto = async (variant: FaceVariant) => {
    try {
      await useVariantAsIdentityPhoto(identity.id, variant);
      onRefresh();
      alert(`Variante ${variant.label} agregada como foto de referencia`);
    } catch (err) {
      console.error('Error al usar variante como foto:', err);
      alert('Error al agregar la variante como foto de referencia');
    }
  };

  const handleDeleteVariantsSet = async (setId: string) => {
    if (!confirm('¿Eliminar este conjunto de variantes?')) return;

    try {
      await deleteFaceVariantsSet(setId);
      await loadSavedVariants();
    } catch (err) {
      console.error('Error eliminando variantes:', err);
    }
  };

  const handleClearBaseImage = () => {
    setBaseImage(null);
    setBaseImageThumbnail(null);
    setGeneratedVariants(null);
    setGenerationStatus('idle');
    setError(null);
  };

  const getStatusIcon = (status: VariantStatus): string => {
    switch (status) {
      case 'pending': return '⏳';
      case 'generating': return '🔄';
      case 'completed': return '✅';
      case 'error': return '❌';
    }
  };

  return (
    <div className="face-variants-generator">
      <div
        className="face-variants-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="face-variants-title">
          <span className="face-variants-icon">🎭</span>
          <span>Definir Rostro</span>
          {savedVariantsSets.length > 0 && (
            <span className="variants-count">({savedVariantsSets.length})</span>
          )}
        </div>
        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
      </div>

      {isExpanded && (
        <div className="face-variants-content">
          <p className="face-variants-description">
            Genera 3 variantes del rostro (Afroamericana, Latina, Caucásica)
            con proporciones de belleza matemática optimizadas.
          </p>

          {/* Sección de carga de imagen */}
          <div className="base-image-section">
            <div className="base-image-header">
              <span>Imagen Base</span>
              {!baseImage && (
                <label className="btn-secondary btn-small">
                  Cargar Imagen
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>

            {baseImage && (
              <div className="base-image-preview">
                <img src={baseImageThumbnail || baseImage} alt="Imagen base" />
                <div className="base-image-actions">
                  <button
                    className="btn-secondary btn-small"
                    onClick={handleClearBaseImage}
                  >
                    Cambiar
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleGenerate}
                    disabled={generationStatus === 'generating'}
                  >
                    {generationStatus === 'generating' ? 'Generando...' : 'Generar Variantes'}
                  </button>
                </div>
              </div>
            )}

            {!baseImage && (
              <div className="base-image-placeholder">
                <span>Carga una imagen de rostro para generar variantes</span>
              </div>
            )}
          </div>

          {/* Progreso de generación */}
          {generationStatus === 'generating' && (
            <div className="generation-progress">
              <h4>Generando variantes...</h4>
              <div className="variants-progress-list">
                {(['afroamerican', 'latin', 'caucasian'] as FaceVariantType[]).map(type => (
                  <div key={type} className={`variant-progress-item ${variantStatuses[type]}`}>
                    <span className="variant-status-icon">{getStatusIcon(variantStatuses[type])}</span>
                    <span className="variant-label">{VARIANT_LABELS[type]}</span>
                    <span className="variant-status-text">
                      {variantStatuses[type] === 'pending' && 'En espera'}
                      {variantStatuses[type] === 'generating' && 'Generando...'}
                      {variantStatuses[type] === 'completed' && 'Completada'}
                      {variantStatuses[type] === 'error' && 'Error'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="generation-error">
              <span>Error: {error}</span>
              <button className="btn-secondary btn-small" onClick={() => setError(null)}>
                Cerrar
              </button>
            </div>
          )}

          {/* Variantes generadas (resultado actual) */}
          {generatedVariants && generationStatus === 'completed' && (
            <div className="generated-variants">
              <h4>Variantes Generadas</h4>
              <div className="variants-grid">
                {(['afroamerican', 'latin', 'caucasian'] as FaceVariantType[]).map(type => (
                  <div key={type} className="variant-card">
                    <div className="variant-image-container">
                      <img
                        src={generatedVariants[type]}
                        alt={VARIANT_LABELS[type]}
                        onClick={() => setSelectedVariantForView({
                          id: type,
                          type,
                          label: VARIANT_LABELS[type],
                          imageUrl: generatedVariants[type],
                          thumbnail: generatedVariants[type],
                          createdAt: Date.now()
                        })}
                      />
                    </div>
                    <div className="variant-info">
                      <span className="variant-label">{VARIANT_LABELS[type]}</span>
                      <span className="variant-description">{VARIANT_DESCRIPTIONS[type]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Variantes guardadas anteriormente */}
          {savedVariantsSets.length > 0 && (
            <div className="saved-variants-section">
              <h4>Variantes Guardadas</h4>
              {savedVariantsSets.map(set => (
                <div key={set.id} className="saved-variants-set">
                  <div className="saved-set-header">
                    <div className="saved-set-base">
                      <img src={set.baseImageThumbnail} alt="Base" />
                      <span className="saved-set-date">
                        {new Date(set.createdAt).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <button
                      className="btn-delete-set"
                      onClick={() => handleDeleteVariantsSet(set.id)}
                      title="Eliminar conjunto"
                    >
                      ×
                    </button>
                  </div>
                  <div className="saved-variants-grid">
                    {set.variants.map(variant => (
                      <div key={variant.id} className="saved-variant-item">
                        <img
                          src={variant.thumbnail}
                          alt={variant.label}
                          onClick={() => setSelectedVariantForView(variant)}
                        />
                        <div className="saved-variant-overlay">
                          <span className="saved-variant-label">{variant.label}</span>
                          <button
                            className="btn-use-variant"
                            onClick={() => handleUseAsPhoto(variant)}
                            title="Usar como foto de referencia"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal de vista ampliada */}
          {selectedVariantForView && (
            <div className="variant-modal" onClick={() => setSelectedVariantForView(null)}>
              <div className="variant-modal-content" onClick={e => e.stopPropagation()}>
                <button
                  className="variant-modal-close"
                  onClick={() => setSelectedVariantForView(null)}
                >
                  ×
                </button>
                <img src={selectedVariantForView.imageUrl} alt={selectedVariantForView.label} />
                <div className="variant-modal-info">
                  <h3>{selectedVariantForView.label}</h3>
                  <p>{VARIANT_DESCRIPTIONS[selectedVariantForView.type]}</p>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      handleUseAsPhoto(selectedVariantForView);
                      setSelectedVariantForView(null);
                    }}
                  >
                    Usar como Foto de Referencia
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
