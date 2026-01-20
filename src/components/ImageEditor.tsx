import { useState, useEffect } from 'react';
import type { EditingThread, Identity, GeneratedImage } from '../types';
import {
  getAllEditingThreads,
  getEditingThread,
  addStepToThread,
  finalizeEditingThread,
  deleteEditingThread,
  revertThreadToStep,
  createEditingThread,
  getIdentity
} from '../services/identityStore';
import { generateWithAttachedImages } from '../services/gemini';
import { isWebGPUAvailable } from '../services/webgpu';
import { upscaleImageWebGPU } from '../services/imageOptimizer';

interface Props {
  deviceId: string;
  identities: Identity[];
  activeThreadId: string | null;
  onThreadChange: (threadId: string | null) => void;
  onImageSaved: () => void;
  onStartNewThread?: (imageUrl: string, prompt: string, identityId?: string, identityName?: string) => void;
}

export function ImageEditor({
  deviceId,
  identities: _identities, // No se usa directamente - obtenemos la identidad de IndexedDB
  activeThreadId,
  onThreadChange,
  onImageSaved
}: Props) {
  const [threads, setThreads] = useState<EditingThread[]>([]);
  const [currentThread, setCurrentThread] = useState<EditingThread | null>(null);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);
  const [editPrompt, setEditPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GeneratedImage[]>([]);

  // Cargar todos los hilos al montar
  useEffect(() => {
    loadThreads();
  }, [deviceId]);

  // Cargar el hilo activo cuando cambia
  useEffect(() => {
    if (activeThreadId) {
      loadThread(activeThreadId);
    } else {
      setCurrentThread(null);
    }
  }, [activeThreadId]);

  const loadThreads = async () => {
    try {
      const allThreads = await getAllEditingThreads(deviceId);
      setThreads(allThreads);
    } catch (err) {
      console.error('Error cargando hilos:', err);
    }
  };

  const loadThread = async (threadId: string) => {
    try {
      const thread = await getEditingThread(threadId);
      if (thread) {
        setCurrentThread(thread);
        setSelectedStepIndex(thread.steps.length - 1);
        setError(null);
      }
    } catch (err) {
      console.error('Error cargando hilo:', err);
      setError('Error al cargar el hilo de edición');
    }
  };

  const handleSelectThread = (thread: EditingThread) => {
    onThreadChange(thread.id);
  };

  const handleNewThread = () => {
    setShowGalleryPicker(true);
    loadGalleryImages();
  };

  const loadGalleryImages = async () => {
    try {
      const { getAllGeneratedImages } = await import('../services/identityStore');
      const images = await getAllGeneratedImages(deviceId);
      setGalleryImages(images);
    } catch (err) {
      console.error('Error cargando galería:', err);
    }
  };

  const handleSelectGalleryImage = async (image: GeneratedImage) => {
    setShowGalleryPicker(false);
    setIsProcessing(true);
    setProcessingStatus('Creando hilo de edición...');

    try {
      const thread = await createEditingThread(
        deviceId,
        image.imageUrl,
        image.prompt,
        image.identityId,
        image.identityName
      );

      await loadThreads();
      onThreadChange(thread.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear hilo');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleEditImage = async () => {
    if (!currentThread || !editPrompt.trim()) return;

    setIsProcessing(true);
    setError(null);
    setProcessingStatus('Cargando identidad y fotos de referencia...');

    try {
      const currentStep = currentThread.steps[selectedStepIndex];

      // Obtener la identidad directamente de IndexedDB para tener los datos más actualizados
      // incluyendo todas las fotos de referencia y sus descripciones faciales (faceDescription)
      let identity: Identity | null = null;
      if (currentThread.identityId) {
        identity = await getIdentity(currentThread.identityId);
      }

      setProcessingStatus('Aplicando edición con IA...');

      // Generar nueva imagen usando la imagen actual como referencia
      // Se pasan las fotos de referencia de la identidad con sus descripciones faciales
      let newImageUrl = await generateWithAttachedImages(
        editPrompt,
        [{
          id: 'current-image',
          dataUrl: currentStep.imageUrl,
          thumbnail: currentStep.thumbnail,
          mimeType: 'image/jpeg'
        }],
        identity?.photos,
        identity?.name,
        identity?.description
      );

      // Aplicar upscaling si está disponible WebGPU
      if (isWebGPUAvailable()) {
        setProcessingStatus('Mejorando calidad con WebGPU...');
        const upscaled = await upscaleImageWebGPU(newImageUrl, 1024);
        if (upscaled) {
          newImageUrl = upscaled;
        }
      }

      setProcessingStatus('Guardando cambios...');

      // Agregar nuevo paso al hilo
      const updatedThread = await addStepToThread(
        currentThread.id,
        newImageUrl,
        editPrompt
      );

      setCurrentThread(updatedThread);
      setSelectedStepIndex(updatedThread.steps.length - 1);
      setEditPrompt('');
      await loadThreads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al editar imagen');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleRevertToStep = async (stepIndex: number) => {
    if (!currentThread || stepIndex === currentThread.steps.length - 1) return;

    if (!confirm('¿Descartar los cambios posteriores a este paso?')) return;

    try {
      const stepId = currentThread.steps[stepIndex].id;
      const updatedThread = await revertThreadToStep(currentThread.id, stepId);
      setCurrentThread(updatedThread);
      setSelectedStepIndex(stepIndex);
      await loadThreads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al revertir');
    }
  };

  const handleFinalizeThread = async (saveToGallery: boolean) => {
    if (!currentThread) return;

    if (!confirm(`¿${saveToGallery ? 'Guardar la imagen final en la galería' : 'Finalizar el hilo sin guardar'}?`)) return;

    setIsProcessing(true);
    setProcessingStatus(saveToGallery ? 'Guardando en galería...' : 'Finalizando...');

    try {
      await finalizeEditingThread(currentThread.id, saveToGallery);
      await loadThreads();
      onThreadChange(null);
      if (saveToGallery) {
        onImageSaved();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al finalizar');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleDeleteThread = async () => {
    if (!currentThread) return;
    if (!confirm('¿Eliminar este hilo de edición? Esta acción no se puede deshacer.')) return;

    try {
      await deleteEditingThread(currentThread.id);
      await loadThreads();
      onThreadChange(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const handleDownload = () => {
    if (!currentThread) return;
    const currentStep = currentThread.steps[selectedStepIndex];

    const link = document.createElement('a');
    link.href = currentStep.imageUrl;
    link.download = `genid-edit-${currentThread.name}-${Date.now()}.png`;
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

  // Sugerencias de edición comunes
  const editSuggestions = [
    'Mejora la iluminación de la imagen',
    'Aumenta el contraste y la nitidez',
    'Cambia el fondo a un atardecer',
    'Añade un efecto cinematográfico',
    'Corrige los colores para que sean más naturales',
    'Haz la imagen más vibrante y colorida'
  ];

  // Vista sin hilo activo
  if (!currentThread) {
    return (
      <div className="image-editor">
        <div className="panel-header">
          <h2>Editor de Imagenes</h2>
          <button className="btn-primary" onClick={handleNewThread}>
            + Nuevo Hilo
          </button>
        </div>

        {threads.length === 0 ? (
          <div className="editor-empty">
            <div className="editor-empty-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </div>
            <h3>Edita tus imagenes con IA</h3>
            <p>
              Crea un hilo de edición para trabajar sobre una imagen.
              Puedes hacer cambios iterativos hasta obtener el resultado deseado.
            </p>
            <div className="editor-features">
              <div className="feature">
                <span className="feature-icon">1</span>
                <span>Selecciona una imagen de la galería</span>
              </div>
              <div className="feature">
                <span className="feature-icon">2</span>
                <span>Describe los cambios que deseas</span>
              </div>
              <div className="feature">
                <span className="feature-icon">3</span>
                <span>Itera hasta estar satisfecho</span>
              </div>
              <div className="feature">
                <span className="feature-icon">4</span>
                <span>Guarda el resultado en la galería</span>
              </div>
            </div>
            <button className="btn-generate" onClick={handleNewThread}>
              Comenzar a Editar
            </button>
          </div>
        ) : (
          <div className="threads-list">
            <h3>Hilos de Edición</h3>
            <div className="threads-grid">
              {threads.map(thread => (
                <div
                  key={thread.id}
                  className={`thread-card ${thread.isActive ? 'active' : 'finished'}`}
                  onClick={() => handleSelectThread(thread)}
                >
                  <div className="thread-preview">
                    {thread.steps.length > 0 && (
                      <img
                        src={thread.steps[thread.steps.length - 1].thumbnail}
                        alt={thread.name}
                      />
                    )}
                    {!thread.isActive && (
                      <div className="thread-finished-badge">Finalizado</div>
                    )}
                  </div>
                  <div className="thread-info">
                    <span className="thread-name">{thread.name}</span>
                    <span className="thread-meta">
                      {thread.steps.length} paso{thread.steps.length !== 1 ? 's' : ''}
                      {thread.identityName && ` • ${thread.identityName}`}
                    </span>
                    <span className="thread-date">{formatDate(thread.updatedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal de selección de imagen de galería */}
        {showGalleryPicker && (
          <div className="modal-overlay" onClick={() => setShowGalleryPicker(false)}>
            <div className="modal-content gallery-picker" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Selecciona una imagen para editar</h3>
                <button className="modal-close" onClick={() => setShowGalleryPicker(false)}>
                  ×
                </button>
              </div>
              {galleryImages.length === 0 ? (
                <div className="gallery-picker-empty">
                  <p>No hay imágenes en la galería.</p>
                  <p>Genera algunas imágenes primero para poder editarlas.</p>
                </div>
              ) : (
                <div className="gallery-picker-grid">
                  {galleryImages.map(image => (
                    <div
                      key={image.id}
                      className="gallery-picker-item"
                      onClick={() => handleSelectGalleryImage(image)}
                    >
                      <img src={image.imageUrl} alt={image.prompt} />
                      <div className="gallery-picker-overlay">
                        <span>{image.identityName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Vista con hilo activo
  const currentStep = currentThread.steps[selectedStepIndex];

  return (
    <div className="image-editor">
      <div className="panel-header">
        <div className="editor-header-info">
          <button className="btn-back" onClick={() => onThreadChange(null)}>
            ← Volver
          </button>
          <h2>{currentThread.name}</h2>
          {currentThread.identityName && (
            <span className="editor-identity-badge">{currentThread.identityName}</span>
          )}
        </div>
        <div className="editor-header-actions">
          {currentThread.isActive && (
            <>
              <button
                className="btn-secondary btn-small"
                onClick={() => handleFinalizeThread(false)}
                disabled={isProcessing}
              >
                Descartar
              </button>
              <button
                className="btn-primary btn-small"
                onClick={() => handleFinalizeThread(true)}
                disabled={isProcessing}
              >
                Guardar en Galeria
              </button>
            </>
          )}
          <button
            className="btn-danger btn-small"
            onClick={handleDeleteThread}
            disabled={isProcessing}
          >
            Eliminar
          </button>
        </div>
      </div>

      <div className="editor-workspace">
        {/* Panel de historial de pasos */}
        <div className="editor-timeline">
          <div className="timeline-header">
            <span>Historial ({currentThread.steps.length})</span>
          </div>
          <div className="timeline-steps">
            {currentThread.steps.map((step, index) => (
              <div
                key={step.id}
                className={`timeline-step ${index === selectedStepIndex ? 'selected' : ''}`}
                onClick={() => setSelectedStepIndex(index)}
              >
                <img src={step.thumbnail} alt={`Paso ${index + 1}`} />
                <div className="step-info">
                  <span className="step-number">#{index + 1}</span>
                  <span className="step-prompt" title={step.prompt}>
                    {step.prompt.length > 30 ? step.prompt.slice(0, 30) + '...' : step.prompt}
                  </span>
                </div>
                {currentThread.isActive && index < currentThread.steps.length - 1 && (
                  <button
                    className="step-revert"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRevertToStep(index);
                    }}
                    title="Revertir a este paso"
                  >
                    ↩
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Panel principal de imagen */}
        <div className="editor-main">
          <div className="editor-image-container">
            <img
              src={currentStep.imageUrl}
              alt={currentStep.prompt}
              className="editor-image"
            />
            <button className="btn-download-overlay" onClick={handleDownload} title="Descargar">
              ↓
            </button>
          </div>

          <div className="editor-step-info">
            <p className="step-prompt-full">{currentStep.prompt}</p>
            <span className="step-timestamp">{formatDate(currentStep.createdAt)}</span>
          </div>

          {/* Panel de edición - solo si el hilo está activo */}
          {currentThread.isActive && (
            <div className="editor-controls">
              <div className="edit-prompt-section">
                <textarea
                  placeholder="Describe los cambios que quieres aplicar a la imagen..."
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  rows={3}
                  disabled={isProcessing}
                />
                <div className="edit-suggestions">
                  {editSuggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      className="suggestion-chip"
                      onClick={() => setEditPrompt(suggestion)}
                      disabled={isProcessing}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="btn-generate"
                onClick={handleEditImage}
                disabled={isProcessing || !editPrompt.trim()}
              >
                {isProcessing ? processingStatus || 'Procesando...' : 'Aplicar Cambios'}
              </button>
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {!currentThread.isActive && (
            <div className="editor-finished-notice">
              <p>Este hilo de edición ha sido finalizado.</p>
              {currentThread.savedImageId && (
                <p>La imagen fue guardada en la galería.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
