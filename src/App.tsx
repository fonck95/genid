import { useState, useEffect, useCallback } from 'react';
import type { Identity, GeneratedImage } from './types';
import { getAllIdentities, getAllGeneratedImages, getIdentity, createEditingThread, getActiveEditingThreads } from './services/identityStore';
import { getDeviceId } from './services/deviceStore';
import { IdentityManager } from './components/IdentityManager';
import { ImageGenerator } from './components/ImageGenerator';
import { Gallery } from './components/Gallery';
import { ImageEditor } from './components/ImageEditor';
import { AuthProvider } from './contexts/AuthContext';
import { GoogleLoginButton } from './components/GoogleLoginButton';

type Tab = 'generate' | 'gallery' | 'editor';

function App() {
  const [deviceId, setDeviceId] = useState<string>('');
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [selectedIdentity, setSelectedIdentity] = useState<Identity | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('generate');
  const [isLoading, setIsLoading] = useState(true);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeThreadsCount, setActiveThreadsCount] = useState(0);

  // Inicializar deviceId al montar
  useEffect(() => {
    const id = getDeviceId();
    setDeviceId(id);
  }, []);

  const loadData = useCallback(async () => {
    if (!deviceId) return;

    try {
      const [ids, imgs, activeThreads] = await Promise.all([
        getAllIdentities(deviceId),
        getAllGeneratedImages(deviceId),
        getActiveEditingThreads(deviceId)
      ]);
      setIdentities(ids);
      setGeneratedImages(imgs);
      setActiveThreadsCount(activeThreads.length);

      // Actualizar identidad seleccionada si existe
      if (selectedIdentity) {
        const updated = await getIdentity(selectedIdentity.id);
        if (updated && updated.deviceId === deviceId) {
          setSelectedIdentity(updated);
        } else {
          setSelectedIdentity(null);
        }
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId, selectedIdentity]);

  useEffect(() => {
    if (deviceId) {
      loadData();
    }
  }, [deviceId]);

  const handleSelectIdentity = (identity: Identity | null) => {
    setSelectedIdentity(identity);
  };

  const handleImageGenerated = () => {
    loadData();
  };

  // Función para iniciar un hilo de edición desde una imagen generada
  const handleStartEditingThread = async (
    imageUrl: string,
    prompt: string,
    identityId?: string,
    identityName?: string
  ) => {
    try {
      const thread = await createEditingThread(
        deviceId,
        imageUrl,
        prompt,
        identityId,
        identityName
      );
      setActiveThreadId(thread.id);
      setActiveTab('editor');
      loadData();
    } catch (error) {
      console.error('Error creando hilo de edición:', error);
    }
  };

  const handleThreadChange = (threadId: string | null) => {
    setActiveThreadId(threadId);
    loadData();
  };

  if (isLoading || !deviceId) {
    return (
      <AuthProvider>
        <div className="app loading">
          <div className="loader"></div>
          <p>Cargando GenID...</p>
        </div>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <div className="app">
        <header className="app-header">
          <div className="header-left">
            <h1>GenID</h1>
            <p className="subtitle">Generador de Imagenes con Identidades</p>
          </div>
          <div className="header-right">
            <GoogleLoginButton compact />
          </div>
        </header>

        <main className="app-main">
          <aside className="sidebar">
            <IdentityManager
              deviceId={deviceId}
              identities={identities}
              selectedIdentity={selectedIdentity}
              onSelectIdentity={handleSelectIdentity}
              onRefresh={loadData}
            />
          </aside>

          <section className="content">
            <nav className="tabs">
              <button
                className={`tab ${activeTab === 'generate' ? 'active' : ''}`}
                onClick={() => setActiveTab('generate')}
              >
                Generar
              </button>
              <button
                className={`tab ${activeTab === 'gallery' ? 'active' : ''}`}
                onClick={() => setActiveTab('gallery')}
              >
                Galeria ({generatedImages.length})
              </button>
              <button
                className={`tab ${activeTab === 'editor' ? 'active' : ''}`}
                onClick={() => setActiveTab('editor')}
              >
                Editor {activeThreadsCount > 0 && `(${activeThreadsCount})`}
              </button>
            </nav>

            <div className="tab-content">
              {activeTab === 'generate' && (
                <ImageGenerator
                  deviceId={deviceId}
                  selectedIdentity={selectedIdentity}
                  identities={identities}
                  onImageGenerated={handleImageGenerated}
                  onCreateIdentity={() => {}}
                  onStartEditingThread={handleStartEditingThread}
                />
              )}
              {activeTab === 'gallery' && (
                <Gallery
                  images={generatedImages}
                  identities={identities}
                  onRefresh={loadData}
                  onStartEditingThread={handleStartEditingThread}
                />
              )}
              {activeTab === 'editor' && (
                <ImageEditor
                  deviceId={deviceId}
                  identities={identities}
                  activeThreadId={activeThreadId}
                  onThreadChange={handleThreadChange}
                  onImageSaved={loadData}
                />
              )}
            </div>
          </section>
        </main>

        <footer className="app-footer">
          <p>Powered by Nano Banana Pro (Gemini)</p>
        </footer>
      </div>
    </AuthProvider>
  );
}

export default App;
