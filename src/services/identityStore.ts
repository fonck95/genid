import type { Identity, IdentityPhoto, GeneratedImage, EditingThread, EditingStep } from '../types';
import { uploadFileToCloudinary, uploadToCloudinary, getThumbnailUrl } from './cloudinary';

const DB_NAME = 'GenID_IdentityStore';
const DB_VERSION = 3; // Incrementar versión para nuevo store de hilos
const IDENTITIES_STORE = 'identities';
const GENERATED_STORE = 'generated';
const THREADS_STORE = 'editing_threads';

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
      const oldVersion = event.oldVersion;

      // Crear o actualizar store de identidades
      if (!database.objectStoreNames.contains(IDENTITIES_STORE)) {
        const identitiesStore = database.createObjectStore(IDENTITIES_STORE, { keyPath: 'id' });
        identitiesStore.createIndex('deviceId', 'deviceId', { unique: false });
      } else if (oldVersion < 2) {
        // Migración: agregar índice deviceId al store existente
        const transaction = (event.target as IDBOpenDBRequest).transaction;
        if (transaction) {
          const identitiesStore = transaction.objectStore(IDENTITIES_STORE);
          if (!identitiesStore.indexNames.contains('deviceId')) {
            identitiesStore.createIndex('deviceId', 'deviceId', { unique: false });
          }
        }
      }

      // Crear o actualizar store de imágenes generadas
      if (!database.objectStoreNames.contains(GENERATED_STORE)) {
        const genStore = database.createObjectStore(GENERATED_STORE, { keyPath: 'id' });
        genStore.createIndex('identityId', 'identityId', { unique: false });
        genStore.createIndex('deviceId', 'deviceId', { unique: false });
      } else if (oldVersion < 2) {
        // Migración: agregar índice deviceId al store existente
        const transaction = (event.target as IDBOpenDBRequest).transaction;
        if (transaction) {
          const genStore = transaction.objectStore(GENERATED_STORE);
          if (!genStore.indexNames.contains('deviceId')) {
            genStore.createIndex('deviceId', 'deviceId', { unique: false });
          }
        }
      }

      // Crear store de hilos de edición (nuevo en versión 3)
      if (!database.objectStoreNames.contains(THREADS_STORE)) {
        const threadsStore = database.createObjectStore(THREADS_STORE, { keyPath: 'id' });
        threadsStore.createIndex('deviceId', 'deviceId', { unique: false });
        threadsStore.createIndex('identityId', 'identityId', { unique: false });
        threadsStore.createIndex('isActive', 'isActive', { unique: false });
      }
    };
  });
}

// === IDENTIDADES ===

export async function getAllIdentities(deviceId?: string): Promise<Identity[]> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(IDENTITIES_STORE, 'readonly');
    const store = transaction.objectStore(IDENTITIES_STORE);

    let request: IDBRequest;

    if (deviceId) {
      // Filtrar por deviceId usando el índice
      const index = store.index('deviceId');
      request = index.getAll(deviceId);
    } else {
      request = store.getAll();
    }

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

export async function createIdentity(deviceId: string, name: string, description: string): Promise<Identity> {
  const database = await openDB();
  const now = Date.now();

  const identity: Identity = {
    id: generateId(),
    deviceId,
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

/**
 * Actualiza la descripción facial de una foto específica.
 * Al estar vinculada a la foto, si se elimina la foto también se elimina la descripción.
 */
export async function updatePhotoFaceDescription(
  identityId: string,
  photoId: string,
  faceDescription: string
): Promise<Identity> {
  const identity = await getIdentity(identityId);
  if (!identity) throw new Error('Identidad no encontrada');

  const photoIndex = identity.photos.findIndex(p => p.id === photoId);
  if (photoIndex === -1) throw new Error('Foto no encontrada');

  identity.photos[photoIndex] = {
    ...identity.photos[photoIndex],
    faceDescription,
    faceDescriptionGeneratedAt: Date.now()
  };

  return updateIdentity(identity);
}

/**
 * Elimina la descripción facial de una foto específica.
 */
export async function removePhotoFaceDescription(
  identityId: string,
  photoId: string
): Promise<Identity> {
  const identity = await getIdentity(identityId);
  if (!identity) throw new Error('Identidad no encontrada');

  const photoIndex = identity.photos.findIndex(p => p.id === photoId);
  if (photoIndex === -1) throw new Error('Foto no encontrada');

  const { faceDescription, faceDescriptionGeneratedAt, ...photoWithoutDescription } = identity.photos[photoIndex];
  identity.photos[photoIndex] = photoWithoutDescription as typeof identity.photos[number];

  return updateIdentity(identity);
}

// === IMÁGENES GENERADAS (Con Cloudinary) ===

export async function saveGeneratedImage(
  deviceId: string,
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
    deviceId,
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

export async function getAllGeneratedImages(deviceId?: string): Promise<GeneratedImage[]> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(GENERATED_STORE, 'readonly');
    const store = transaction.objectStore(GENERATED_STORE);

    let request: IDBRequest;

    if (deviceId) {
      // Filtrar por deviceId usando el índice
      const index = store.index('deviceId');
      request = index.getAll(deviceId);
    } else {
      request = store.getAll();
    }

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const images = request.result as GeneratedImage[];
      resolve(images.sort((a, b) => b.createdAt - a.createdAt));
    };
  });
}

export async function getGeneratedImagesByIdentity(identityId: string): Promise<GeneratedImage[]> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(GENERATED_STORE, 'readonly');
    const store = transaction.objectStore(GENERATED_STORE);
    const index = store.index('identityId');
    const request = index.getAll(identityId);

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

export async function deleteGeneratedImagesByIdentity(identityId: string): Promise<void> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(GENERATED_STORE, 'readwrite');
    const store = transaction.objectStore(GENERATED_STORE);
    const index = store.index('identityId');
    const request = index.getAllKeys(identityId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const keys = request.result;
      keys.forEach(key => store.delete(key));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  });
}

export async function clearAllData(): Promise<void> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([IDENTITIES_STORE, GENERATED_STORE, THREADS_STORE], 'readwrite');

    transaction.objectStore(IDENTITIES_STORE).clear();
    transaction.objectStore(GENERATED_STORE).clear();
    transaction.objectStore(THREADS_STORE).clear();

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// === HILOS DE EDICIÓN ===

/**
 * Crea un nuevo hilo de edición con una imagen inicial
 */
export async function createEditingThread(
  deviceId: string,
  initialImageUrl: string,
  initialPrompt: string,
  identityId?: string,
  identityName?: string,
  name?: string
): Promise<EditingThread> {
  const database = await openDB();
  const now = Date.now();

  // Crear thumbnail para la imagen inicial
  const thumbnail = await createThumbnail(initialImageUrl, 150);

  // Subir imagen inicial a Cloudinary
  const uploadResult = await uploadToCloudinary(
    initialImageUrl,
    `genid/threads/${identityId || 'general'}`
  );

  const initialStep: EditingStep = {
    id: generateId(),
    imageUrl: uploadResult.secure_url,
    thumbnail,
    prompt: initialPrompt,
    cloudinaryId: uploadResult.public_id,
    createdAt: now
  };

  const thread: EditingThread = {
    id: generateId(),
    deviceId,
    identityId,
    identityName,
    name: name || `Edicion ${new Date().toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })}`,
    steps: [initialStep],
    isActive: true,
    createdAt: now,
    updatedAt: now
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(THREADS_STORE, 'readwrite');
    const store = transaction.objectStore(THREADS_STORE);
    const request = store.add(thread);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(thread);
  });
}

/**
 * Obtiene un hilo de edición por su ID
 */
export async function getEditingThread(id: string): Promise<EditingThread | null> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(THREADS_STORE, 'readonly');
    const store = transaction.objectStore(THREADS_STORE);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

/**
 * Obtiene todos los hilos de edición de un dispositivo
 */
export async function getAllEditingThreads(deviceId: string): Promise<EditingThread[]> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(THREADS_STORE, 'readonly');
    const store = transaction.objectStore(THREADS_STORE);
    const index = store.index('deviceId');
    const request = index.getAll(deviceId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const threads = request.result as EditingThread[];
      // Ordenar por fecha de actualización, más reciente primero
      resolve(threads.sort((a, b) => b.updatedAt - a.updatedAt));
    };
  });
}

/**
 * Obtiene hilos de edición activos de un dispositivo
 */
export async function getActiveEditingThreads(deviceId: string): Promise<EditingThread[]> {
  const threads = await getAllEditingThreads(deviceId);
  return threads.filter(t => t.isActive);
}

/**
 * Agrega un nuevo paso de edición a un hilo existente
 */
export async function addStepToThread(
  threadId: string,
  imageUrl: string,
  prompt: string
): Promise<EditingThread> {
  const thread = await getEditingThread(threadId);
  if (!thread) throw new Error('Hilo de edición no encontrado');

  const now = Date.now();

  // Crear thumbnail
  const thumbnail = await createThumbnail(imageUrl, 150);

  // Subir imagen a Cloudinary
  const uploadResult = await uploadToCloudinary(
    imageUrl,
    `genid/threads/${thread.identityId || 'general'}`
  );

  const newStep: EditingStep = {
    id: generateId(),
    imageUrl: uploadResult.secure_url,
    thumbnail,
    prompt,
    cloudinaryId: uploadResult.public_id,
    createdAt: now
  };

  thread.steps.push(newStep);
  thread.updatedAt = now;

  return updateEditingThread(thread);
}

/**
 * Actualiza un hilo de edición
 */
export async function updateEditingThread(thread: EditingThread): Promise<EditingThread> {
  const database = await openDB();
  thread.updatedAt = Date.now();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(THREADS_STORE, 'readwrite');
    const store = transaction.objectStore(THREADS_STORE);
    const request = store.put(thread);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(thread);
  });
}

/**
 * Finaliza un hilo de edición y guarda la imagen final en la galería
 */
export async function finalizeEditingThread(
  threadId: string,
  saveToGallery: boolean = true
): Promise<{ thread: EditingThread; savedImage?: GeneratedImage }> {
  const thread = await getEditingThread(threadId);
  if (!thread) throw new Error('Hilo de edición no encontrado');

  let savedImage: GeneratedImage | undefined;

  if (saveToGallery && thread.steps.length > 0) {
    const lastStep = thread.steps[thread.steps.length - 1];

    // Si hay identidad asociada, guardar la imagen en la galería
    if (thread.identityId && thread.identityName) {
      const database = await openDB();

      savedImage = {
        id: generateId(),
        deviceId: thread.deviceId,
        identityId: thread.identityId,
        identityName: thread.identityName,
        prompt: `[Editada] ${lastStep.prompt}`,
        imageUrl: lastStep.imageUrl,
        cloudinaryId: lastStep.cloudinaryId,
        createdAt: Date.now()
      };

      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(GENERATED_STORE, 'readwrite');
        const store = transaction.objectStore(GENERATED_STORE);
        const request = store.add(savedImage);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });

      thread.savedImageId = savedImage.id;
    }
  }

  thread.isActive = false;
  thread.updatedAt = Date.now();

  const updatedThread = await updateEditingThread(thread);

  return { thread: updatedThread, savedImage };
}

/**
 * Elimina un hilo de edición
 */
export async function deleteEditingThread(id: string): Promise<void> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(THREADS_STORE, 'readwrite');
    const store = transaction.objectStore(THREADS_STORE);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Revierte un hilo a un paso anterior (elimina pasos posteriores)
 */
export async function revertThreadToStep(
  threadId: string,
  stepId: string
): Promise<EditingThread> {
  const thread = await getEditingThread(threadId);
  if (!thread) throw new Error('Hilo de edición no encontrado');

  const stepIndex = thread.steps.findIndex(s => s.id === stepId);
  if (stepIndex === -1) throw new Error('Paso no encontrado en el hilo');

  // Mantener solo los pasos hasta el seleccionado (inclusive)
  thread.steps = thread.steps.slice(0, stepIndex + 1);
  thread.updatedAt = Date.now();

  return updateEditingThread(thread);
}

/**
 * Crea un thumbnail de una imagen
 */
async function createThumbnail(imageUrl: string, size: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

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

    img.onerror = () => {
      // Si falla, devolver la URL original
      resolve(imageUrl);
    };

    img.src = imageUrl;
  });
}
