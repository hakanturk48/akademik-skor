const databaseName = 'akademik-skor-video-media';
const storeName = 'assets';
const assetPrefix = 'asset:';

export type StoredVideoAsset = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  file: Blob;
};

function makeAssetId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'video-' + Date.now() + '-' + Math.round(Math.random() * 100000);
}

export function isVideoAssetUrl(value?: string) {
  return Boolean(value && /^asset:[a-z0-9-]+$/i.test(value.trim()));
}

function openDatabase() {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('Tarayıcı medya depolaması kullanılamıyor.'));
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Medya depolaması açılamadı.'));
  });
}

export async function saveVideoUpload(file: File) {
  if (!file.type.startsWith('video/')) throw new Error('Yalnızca video dosyaları yüklenebilir.');
  const asset: StoredVideoAsset = {
    id: makeAssetId(),
    name: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    createdAt: new Date().toISOString(),
    file,
  };
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = database.transaction(storeName, 'readwrite').objectStore(storeName).put(asset);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('Video depolanamadı.'));
  });
  database.close();
  return { id: asset.id, storageKey: assetPrefix + asset.id, name: asset.name, mimeType: asset.mimeType, sizeBytes: asset.sizeBytes };
}

export async function getVideoUploadUrl(storageKey?: string) {
  if (!isVideoAssetUrl(storageKey)) return null;
  const id = storageKey!.slice(assetPrefix.length);
  const database = await openDatabase();
  const asset = await new Promise<StoredVideoAsset | undefined>((resolve, reject) => {
    const request = database.transaction(storeName, 'readonly').objectStore(storeName).get(id);
    request.onsuccess = () => resolve(request.result as StoredVideoAsset | undefined);
    request.onerror = () => reject(request.error ?? new Error('Video okunamadı.'));
  });
  database.close();
  return asset ? URL.createObjectURL(asset.file) : null;
}

export function revokeVideoUploadUrl(url?: string | null) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
}
