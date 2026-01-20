// Servicio para gestionar el ID único del dispositivo
// El ID se guarda en localStorage para persistir incluso si se limpia IndexedDB

const DEVICE_ID_KEY = 'genid_device_id';

function generateUUID(): string {
  // Generar UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = generateUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

export function resetDeviceId(): string {
  const newDeviceId = generateUUID();
  localStorage.setItem(DEVICE_ID_KEY, newDeviceId);
  return newDeviceId;
}

export function hasDeviceId(): boolean {
  return localStorage.getItem(DEVICE_ID_KEY) !== null;
}
