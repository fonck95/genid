import { useState, useRef, useEffect } from 'react';
import type {
  Identity,
  FaceVariantsSet,
  FaceVariant,
  FaceEthnicity,
  FaceAgeRange,
  FaceSex,
  FacialAccessory,
  FaceVariantOptions
} from '../types';
import { generateCustomFaceVariant } from '../services/gemini';
import {
  saveFaceVariantSingle,
  getFaceVariantsByIdentity,
  deleteFaceVariantsSet,
  useVariantAsIdentityPhoto
} from '../services/identityStore';

interface Props {
  identity: Identity;
  onRefresh: () => void;
}

type GenerationStatus = 'idle' | 'generating' | 'completed' | 'error';

// Opciones de etnia
const ETHNICITY_OPTIONS: { value: FaceEthnicity; label: string }[] = [
  { value: 'afroamerican', label: 'Afroamericana' },
  { value: 'latin', label: 'Latina/Hispana' },
  { value: 'caucasian', label: 'Caucásica/Europea' },
  { value: 'asian', label: 'Asiática Oriental' },
  { value: 'middleeastern', label: 'Medio Oriente' },
  { value: 'southasian', label: 'Sur de Asia' },
  { value: 'mixed', label: 'Mixta/Mestiza' }
];

// Opciones de rango de edad
const AGE_RANGE_OPTIONS: { value: FaceAgeRange; label: string }[] = [
  { value: '18-25', label: '18-25 años' },
  { value: '26-35', label: '26-35 años' },
  { value: '36-45', label: '36-45 años' },
  { value: '46-55', label: '46-55 años' },
  { value: '56+', label: '56+ años' }
];

// Opciones de sexo
const SEX_OPTIONS: { value: FaceSex; label: string }[] = [
  { value: 'female', label: 'Femenino' },
  { value: 'male', label: 'Masculino' }
];

// Opciones de accesorios faciales agrupados
const ACCESSORY_GROUPS = [
  {
    title: 'Gafas',
    options: [
      { value: 'glasses' as FacialAccessory, label: 'Gafas de ver' },
      { value: 'sunglasses' as FacialAccessory, label: 'Gafas de sol' }
    ]
  },
  {
    title: 'Joyería',
    options: [
      { value: 'earrings' as FacialAccessory, label: 'Aretes/Pendientes' }
    ]
  },
  {
    title: 'Piercings',
    options: [
      { value: 'nose_piercing' as FacialAccessory, label: 'Piercing nariz' },
      { value: 'lip_piercing' as FacialAccessory, label: 'Piercing labio' },
      { value: 'eyebrow_piercing' as FacialAccessory, label: 'Piercing ceja' }
    ]
  },
  {
    title: 'Cabeza',
    options: [
      { value: 'headscarf' as FacialAccessory, label: 'Pañuelo/Hijab' },
      { value: 'hat' as FacialAccessory, label: 'Sombrero/Gorra' },
      { value: 'headband' as FacialAccessory, label: 'Diadema/Cinta' }
    ]
  },
  {
    title: 'Vello facial',
    options: [
      { value: 'beard' as FacialAccessory, label: 'Barba completa' },
      { value: 'mustache' as FacialAccessory, label: 'Bigote' },
      { value: 'goatee' as FacialAccessory, label: 'Perilla/Chivo' }
    ]
  }
];

// Helper para obtener la descripción de la variante
function getVariantDescription(options: FaceVariantOptions): string {
  const ethnicity = ETHNICITY_OPTIONS.find(e => e.value === options.ethnicity)?.label || options.ethnicity;
  const age = AGE_RANGE_OPTIONS.find(a => a.value === options.ageRange)?.label || options.ageRange;
  const sex = SEX_OPTIONS.find(s => s.value === options.sex)?.label || options.sex;

  let desc = `${ethnicity}, ${sex}, ${age}`;
  if (options.accessories.length > 0) {
    const accLabels = options.accessories.map(acc => {
      for (const group of ACCESSORY_GROUPS) {
        const found = group.options.find(o => o.value === acc);
        if (found) return found.label;
      }
      return acc;
    });
    desc += ` + ${accLabels.join(', ')}`;
  }
  return desc;
}

export function FaceVariantsGenerator({ identity, onRefresh }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [baseImageThumbnail, setBaseImageThumbnail] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('idle');
  const [generatedVariant, setGeneratedVariant] = useState<{ imageUrl: string; options: FaceVariantOptions } | null>(null);
  const [savedVariantsSets, setSavedVariantsSets] = useState<FaceVariantsSet[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariantForView, setSelectedVariantForView] = useState<FaceVariant | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para las opciones de personalización
  const [selectedEthnicity, setSelectedEthnicity] = useState<FaceEthnicity>('latin');
  const [selectedAgeRange, setSelectedAgeRange] = useState<FaceAgeRange>('26-35');
  const [selectedSex, setSelectedSex] = useState<FaceSex>('female');
  const [selectedAccessories, setSelectedAccessories] = useState<FacialAccessory[]>([]);

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

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setBaseImage(dataUrl);

      const thumbnail = await createThumbnail(dataUrl, 150);
      setBaseImageThumbnail(thumbnail);

      setGenerationStatus('idle');
      setGeneratedVariant(null);
      setError(null);
    };
    reader.readAsDataURL(file);

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
    setGeneratedVariant(null);

    const options: FaceVariantOptions = {
      ethnicity: selectedEthnicity,
      ageRange: selectedAgeRange,
      sex: selectedSex,
      accessories: selectedAccessories
    };

    try {
      const imageUrl = await generateCustomFaceVariant(
        baseImage,
        options,
        (status) => {
          if (status === 'error') {
            setGenerationStatus('error');
          }
        }
      );

      setGeneratedVariant({ imageUrl, options });
      setGenerationStatus('completed');

      // Guardar en el store
      await saveFaceVariantSingle(identity.id, baseImage, imageUrl, options);
      await loadSavedVariants();

    } catch (err) {
      console.error('Error generando variante:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al generar variante');
      setGenerationStatus('error');
    }
  };

  const handleUseAsPhoto = async (variant: FaceVariant) => {
    try {
      await useVariantAsIdentityPhoto(identity.id, variant);
      onRefresh();
      alert(`Variante agregada como foto de referencia`);
    } catch (err) {
      console.error('Error al usar variante como foto:', err);
      alert('Error al agregar la variante como foto de referencia');
    }
  };

  const handleDeleteVariantsSet = async (setId: string) => {
    if (!confirm('¿Eliminar esta variante?')) return;

    try {
      await deleteFaceVariantsSet(setId);
      await loadSavedVariants();
    } catch (err) {
      console.error('Error eliminando variante:', err);
    }
  };

  const handleClearBaseImage = () => {
    setBaseImage(null);
    setBaseImageThumbnail(null);
    setGeneratedVariant(null);
    setGenerationStatus('idle');
    setError(null);
  };

  const toggleAccessory = (accessory: FacialAccessory) => {
    setSelectedAccessories(prev =>
      prev.includes(accessory)
        ? prev.filter(a => a !== accessory)
        : [...prev, accessory]
    );
  };

  return (
    <div className="face-variants-generator">
      <div
        className="face-variants-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="face-variants-title">
          <span className="face-variants-icon">🎭</span>
          <span>Generar Variante de Rostro</span>
          {savedVariantsSets.length > 0 && (
            <span className="variants-count">({savedVariantsSets.length})</span>
          )}
        </div>
        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
      </div>

      {isExpanded && (
        <div className="face-variants-content">
          <p className="face-variants-description">
            Genera una variante personalizada del rostro seleccionando etnia, edad, sexo y accesorios.
            La variante conservará la esencia y estructura del rostro original.
          </p>

          {/* Sección de carga de imagen */}
          <div className="base-image-section">
            <div className="base-image-header">
              <span>1. Imagen Base</span>
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
                <button
                  className="btn-secondary btn-small"
                  onClick={handleClearBaseImage}
                >
                  Cambiar
                </button>
              </div>
            )}

            {!baseImage && (
              <div className="base-image-placeholder">
                <span>Carga una imagen de rostro para generar la variante</span>
              </div>
            )}
          </div>

          {/* Selectores de personalización - Solo se muestran si hay imagen cargada */}
          {baseImage && (
            <div className="variant-customization-section">
              <div className="customization-header">
                <span>2. Personalizar Variante</span>
              </div>

              {/* Selector de Etnia */}
              <div className="customization-group">
                <label className="customization-label">Etnia</label>
                <div className="option-buttons">
                  {ETHNICITY_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      className={`option-btn ${selectedEthnicity === option.value ? 'selected' : ''}`}
                      onClick={() => setSelectedEthnicity(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector de Sexo */}
              <div className="customization-group">
                <label className="customization-label">Sexo</label>
                <div className="option-buttons">
                  {SEX_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      className={`option-btn ${selectedSex === option.value ? 'selected' : ''}`}
                      onClick={() => setSelectedSex(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector de Edad */}
              <div className="customization-group">
                <label className="customization-label">Rango de Edad</label>
                <div className="option-buttons">
                  {AGE_RANGE_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      className={`option-btn ${selectedAgeRange === option.value ? 'selected' : ''}`}
                      onClick={() => setSelectedAgeRange(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector de Accesorios */}
              <div className="customization-group">
                <label className="customization-label">Accesorios (opcionales)</label>
                <div className="accessories-groups">
                  {ACCESSORY_GROUPS.map(group => (
                    <div key={group.title} className="accessory-group">
                      <span className="accessory-group-title">{group.title}</span>
                      <div className="accessory-options">
                        {group.options.map(option => (
                          <button
                            key={option.value}
                            className={`accessory-btn ${selectedAccessories.includes(option.value) ? 'selected' : ''}`}
                            onClick={() => toggleAccessory(option.value)}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón de generar */}
              <div className="generate-action">
                <button
                  className="btn-primary btn-generate"
                  onClick={handleGenerate}
                  disabled={generationStatus === 'generating'}
                >
                  {generationStatus === 'generating' ? (
                    <>
                      <span className="spinner"></span>
                      Generando variante...
                    </>
                  ) : (
                    'Generar Variante'
                  )}
                </button>
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

          {/* Variante generada (resultado actual) */}
          {generatedVariant && generationStatus === 'completed' && (
            <div className="generated-variant-result">
              <h4>Variante Generada</h4>
              <div className="variant-result-card">
                <div className="variant-comparison">
                  <div className="comparison-image original">
                    <img src={baseImageThumbnail || baseImage || ''} alt="Original" />
                    <span className="comparison-label">Original</span>
                  </div>
                  <div className="comparison-arrow">→</div>
                  <div className="comparison-image generated">
                    <img
                      src={generatedVariant.imageUrl}
                      alt="Variante generada"
                      onClick={() => setSelectedVariantForView({
                        id: 'current',
                        type: generatedVariant.options.ethnicity,
                        label: getVariantDescription(generatedVariant.options),
                        imageUrl: generatedVariant.imageUrl,
                        thumbnail: generatedVariant.imageUrl,
                        options: generatedVariant.options,
                        createdAt: Date.now()
                      })}
                    />
                    <span className="comparison-label">Variante</span>
                  </div>
                </div>
                <div className="variant-result-info">
                  <p className="variant-description">{getVariantDescription(generatedVariant.options)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Variantes guardadas anteriormente */}
          {savedVariantsSets.length > 0 && (
            <div className="saved-variants-section">
              <h4>Variantes Guardadas</h4>
              <div className="saved-variants-list">
                {savedVariantsSets.map(set => {
                  // Soporte para formato antiguo (variants array) y nuevo (variant single)
                  const variant = set.variant || (set.variants && set.variants[0]);
                  if (!variant) return null;

                  return (
                    <div key={set.id} className="saved-variant-item-card">
                      <div className="saved-variant-images">
                        <img
                          src={set.baseImageThumbnail}
                          alt="Base"
                          className="saved-base-thumb"
                        />
                        <span className="saved-arrow">→</span>
                        <img
                          src={variant.thumbnail}
                          alt={variant.label}
                          className="saved-variant-thumb"
                          onClick={() => setSelectedVariantForView(variant)}
                        />
                      </div>
                      <div className="saved-variant-meta">
                        <span className="saved-variant-label">{variant.label}</span>
                        <span className="saved-variant-date">
                          {new Date(set.createdAt).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="saved-variant-actions">
                        <button
                          className="btn-use-saved"
                          onClick={() => handleUseAsPhoto(variant)}
                          title="Usar como foto de referencia"
                        >
                          +
                        </button>
                        <button
                          className="btn-delete-saved"
                          onClick={() => handleDeleteVariantsSet(set.id)}
                          title="Eliminar"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                  <h3>Variante Generada</h3>
                  <p>{selectedVariantForView.label}</p>
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
