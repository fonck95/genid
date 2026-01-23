import { useState, useEffect, useCallback } from 'react';

export type DownloadStatus = 'idle' | 'downloading' | 'success' | 'error';

/**
 * Elimina todos los metadatos (EXIF, GPS, información de cámara, etc.) de una imagen
 * usando Canvas API. Al redibujar la imagen en un canvas, solo se preservan los píxeles,
 * eliminando automáticamente cualquier metadata incrustada.
 */
async function stripImageMetadata(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          URL.revokeObjectURL(url);
          // Si no hay contexto 2D, devolver el blob original
          resolve(blob);
          return;
        }

        // Establecer dimensiones del canvas igual a la imagen
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Dibujar la imagen en el canvas (esto elimina todos los metadatos)
        ctx.drawImage(img, 0, 0);

        // Convertir a blob PNG (sin metadatos)
        canvas.toBlob(
          (newBlob) => {
            URL.revokeObjectURL(url);
            if (newBlob) {
              resolve(newBlob);
            } else {
              // Si falla la conversión, devolver el original
              resolve(blob);
            }
          },
          'image/png',
          1.0
        );
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Error al cargar la imagen para eliminar metadatos'));
    };

    img.src = url;
  });
}

interface DownloadState {
  status: DownloadStatus;
  progress: number;
  fileName: string;
  error?: string;
}

interface DownloadNotificationProps {
  downloadState: DownloadState;
  onClose: () => void;
}

export function DownloadNotification({ downloadState, onClose }: DownloadNotificationProps) {
  const { status, progress, fileName, error } = downloadState;
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onClose, 300);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  if (status === 'idle') return null;

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  return (
    <div className={`download-notification ${status} ${isExiting ? 'exiting' : ''}`}>
      <div className="download-notification-content">
        <div className="download-icon-wrapper">
          {status === 'downloading' && (
            <div className="download-spinner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
            </div>
          )}
          {status === 'success' && (
            <div className="download-success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
          {status === 'error' && (
            <div className="download-error-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>

        <div className="download-info">
          <div className="download-title">
            {status === 'downloading' && 'Descargando...'}
            {status === 'success' && 'Descarga completada'}
            {status === 'error' && 'Error en la descarga'}
          </div>
          <div className="download-filename">{fileName}</div>
          {status === 'error' && error && (
            <div className="download-error-message">{error}</div>
          )}
        </div>

        {status === 'downloading' && (
          <div className="download-progress-container">
            <div
              className="download-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <button className="download-close-btn" onClick={handleClose} aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
            <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Hook para manejar descargas
export function useDownload() {
  const [downloadState, setDownloadState] = useState<DownloadState>({
    status: 'idle',
    progress: 0,
    fileName: '',
  });

  const downloadImage = useCallback(async (imageUrl: string, fileName: string) => {
    setDownloadState({
      status: 'downloading',
      progress: 0,
      fileName,
    });

    try {
      // Intentar descargar usando fetch para evitar ventanas emergentes
      const response = await fetch(imageUrl, {
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      let loaded = 0;
      const reader = response.body?.getReader();
      const chunks: BlobPart[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          chunks.push(value);
          loaded += value.length;

          if (total > 0) {
            setDownloadState(prev => ({
              ...prev,
              progress: Math.round((loaded / total) * 100),
            }));
          } else {
            // Si no conocemos el tamaño total, simular progreso
            setDownloadState(prev => ({
              ...prev,
              progress: Math.min(prev.progress + 10, 90),
            }));
          }
        }
      }

      // Crear blob y eliminar metadatos antes de descargar
      const originalBlob = new Blob(chunks);

      // Actualizar estado indicando que se están procesando los metadatos
      setDownloadState(prev => ({
        ...prev,
        progress: 95,
      }));

      // Eliminar metadatos de la imagen usando Canvas
      const cleanBlob = await stripImageMetadata(originalBlob);
      const url = URL.createObjectURL(cleanBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Limpiar URL del blob
      setTimeout(() => URL.revokeObjectURL(url), 100);

      setDownloadState({
        status: 'success',
        progress: 100,
        fileName,
      });
    } catch (error) {
      // Si falla CORS, intentar método alternativo
      try {
        // Abrir en nueva pestaña como fallback pero de forma más elegante
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = fileName;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setDownloadState({
          status: 'success',
          progress: 100,
          fileName,
        });
      } catch {
        setDownloadState({
          status: 'error',
          progress: 0,
          fileName,
          error: 'No se pudo descargar la imagen. Intenta de nuevo.',
        });
      }
    }
  }, []);

  const resetDownload = useCallback(() => {
    setDownloadState({
      status: 'idle',
      progress: 0,
      fileName: '',
    });
  }, []);

  return {
    downloadState,
    downloadImage,
    resetDownload,
  };
}
