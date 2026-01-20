import { useState, useEffect, useCallback } from 'react';
import type { Identity, GeneratedImage } from './types';
import { getAllIdentities, getAllGeneratedImages, getIdentity } from './services/identityStore';
import { getDeviceId } from './services/deviceStore';
import { IdentityManager } from './components/IdentityManager';
import { ImageGenerator } from './components/ImageGenerator';
import { Gallery } from './components/Gallery';

type Tab = 'generate' | 'gallery';

function App() {
  const [deviceId, setDeviceId] = useState<string>('');
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [selectedIdentity, setSelectedIdentity] = useState<Identity | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('generate');
  const [isLoading, setIsLoading] = useState(true);

  // Inicializar deviceId al montar
  useEffect(() => {
    const id = getDeviceId();
    setDeviceId(id);
  }, []);

  const loadData = useCallback(async () => {
    if (!deviceId) return;

    try {
      const [ids, imgs] = await Promise.all([
        getAllIdentities(deviceId),
        getAllGeneratedImages(deviceId)
      ]);
      setIdentities(ids);
      setGeneratedImages(imgs);

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

  if (isLoading || !deviceId) {
    return (
      <div className="app loading">
        <div className="loader"></div>
        <p>Cargando GenID...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>GenID</h1>
        <p className="subtitle">Generador de Imagenes con Identidades</p>
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
          </nav>

          <div className="tab-content">
            {activeTab === 'generate' ? (
              <ImageGenerator
                deviceId={deviceId}
                selectedIdentity={selectedIdentity}
                identities={identities}
                onImageGenerated={handleImageGenerated}
                onCreateIdentity={() => {}}
              />
            ) : (
              <Gallery
                images={generatedImages}
                identities={identities}
                onRefresh={loadData}
              />
            )}
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>Powered by Nano Banana Pro (Gemini) + WebGPU</p>
      </footer>
    </div>
  );
}

export default App;
