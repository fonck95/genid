import type { Identity, IdentityPhoto, GeneratedImage } from '../types';

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

// === FOTOS DE IDENTIDAD ===

async function createThumbnail(dataUrl: string, maxSize: number = 150): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      let { width, height } = img;
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
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = dataUrl;
  });
}

export async function addPhotoToIdentity(identityId: string, imageFile: File): Promise<Identity> {
  const identity = await getIdentity(identityId);
  if (!identity) throw new Error('Identidad no encontrada');

  const dataUrl = await fileToDataUrl(imageFile);
  const thumbnail = await createThumbnail(dataUrl);

  const photo: IdentityPhoto = {
    id: generateId(),
    dataUrl,
    thumbnail,
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

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// === IMÁGENES GENERADAS ===

export async function saveGeneratedImage(
  identityId: string,
  identityName: string,
  prompt: string,
  imageUrl: string
): Promise<GeneratedImage> {
  const database = await openDB();

  const generated: GeneratedImage = {
    id: generateId(),
    identityId,
    identityName,
    prompt,
    imageUrl,
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
