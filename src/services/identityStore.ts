import type { Identity, IdentityPhoto, GeneratedImage } from '../types';
import { uploadFileToCloudinary, uploadToCloudinary, getThumbnailUrl } from './cloudinary';

const DB_NAME = 'GenID_IdentityStore';
const DB_VERSION = 1;
const IDENTITIES_STORE = 'identities';
const GENERATED_STORE = 'generated';

let db: IDBDatabase | null = null;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function openDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains(IDENTITIES_STORE)) {
        database.createObjectStore(IDENTITIES_STORE, { keyPath: 'id' });
      }

      if (!database.objectStoreNames.contains(GENERATED_STORE)) {
        const genStore = database.createObjectStore(GENERATED_STORE, { keyPath: 'id' });
        genStore.createIndex('identityId', 'identityId', { unique: false });
      }
    };
  });
}

// === IDENTIDADES ===

export async function getAllIdentities(): Promise<Identity[]> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(IDENTITIES_STORE, 'readonly');
    const store = transaction.objectStore(IDENTITIES_STORE);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const identities = request.result as Identity[];
      resolve(identities.sort((a, b) => b.updatedAt - a.updatedAt));
    };
  });
}

export async function getIdentity(id: string): Promise<Identity | null> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(IDENTITIES_STORE, 'readonly');
    const store = transaction.objectStore(IDENTITIES_STORE);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

export async function createIdentity(name: string, description: string): Promise<Identity> {
  const database = await openDB();
  const now = Date.now();

  const identity: Identity = {
    id: generateId(),
    name,
    description,
    photos: [],
    createdAt: now,
    updatedAt: now
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(IDENTITIES_STORE, 'readwrite');
    const store = transaction.objectStore(IDENTITIES_STORE);
    const request = store.add(identity);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(identity);
  });
}

export async function updateIdentity(identity: Identity): Promise<Identity> {
  const database = await openDB();
  identity.updatedAt = Date.now();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(IDENTITIES_STORE, 'readwrite');
    const store = transaction.objectStore(IDENTITIES_STORE);
    const request = store.put(identity);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(identity);
  });
}

export async function deleteIdentity(id: string): Promise<void> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(IDENTITIES_STORE, 'readwrite');
    const store = transaction.objectStore(IDENTITIES_STORE);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// === FOTOS DE IDENTIDAD (Con Cloudinary) ===

export async function addPhotoToIdentity(identityId: string, imageFile: File): Promise<Identity> {
  const identity = await getIdentity(identityId);
  if (!identity) throw new Error('Identidad no encontrada');

  // Subir a Cloudinary
  const uploadResult = await uploadFileToCloudinary(imageFile, `genid/identities/${identityId}`);

  const photo: IdentityPhoto = {
    id: generateId(),
    dataUrl: uploadResult.secure_url, // URL completa de Cloudinary
    thumbnail: getThumbnailUrl(uploadResult.public_id, 150),
    cloudinaryId: uploadResult.public_id,
    addedAt: Date.now()
  };

  identity.photos.push(photo);
  return updateIdentity(identity);
}

export async function removePhotoFromIdentity(identityId: string, photoId: string): Promise<Identity> {
  const identity = await getIdentity(identityId);
  if (!identity) throw new Error('Identidad no encontrada');

  identity.photos = identity.photos.filter(p => p.id !== photoId);
  return updateIdentity(identity);
}

// === IMÁGENES GENERADAS (Con Cloudinary) ===

export async function saveGeneratedImage(
  identityId: string,
  identityName: string,
  prompt: string,
  imageDataUrl: string
): Promise<GeneratedImage> {
  const database = await openDB();

  // Subir imagen generada a Cloudinary
  const uploadResult = await uploadToCloudinary(imageDataUrl, `genid/generated/${identityId}`);

  const generated: GeneratedImage = {
    id: generateId(),
    identityId,
    identityName,
    prompt,
    imageUrl: uploadResult.secure_url,
    cloudinaryId: uploadResult.public_id,
    createdAt: Date.now()
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(GENERATED_STORE, 'readwrite');
    const store = transaction.objectStore(GENERATED_STORE);
    const request = store.add(generated);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(generated);
  });
}

export async function getAllGeneratedImages(): Promise<GeneratedImage[]> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(GENERATED_STORE, 'readonly');
    const store = transaction.objectStore(GENERATED_STORE);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const images = request.result as GeneratedImage[];
      resolve(images.sort((a, b) => b.createdAt - a.createdAt));
    };
  });
}

export async function deleteGeneratedImage(id: string): Promise<void> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(GENERATED_STORE, 'readwrite');
    const store = transaction.objectStore(GENERATED_STORE);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function clearAllData(): Promise<void> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([IDENTITIES_STORE, GENERATED_STORE], 'readwrite');

    transaction.objectStore(IDENTITIES_STORE).clear();
    transaction.objectStore(GENERATED_STORE).clear();

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
