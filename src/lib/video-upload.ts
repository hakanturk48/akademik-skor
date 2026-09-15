import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

import { firebaseAuth, firebaseStorage, isFirebaseStorageConfigured } from './firebase';

const databaseName = 'akademik-skor-video-media';
const storeName = 'assets';
const assetPrefix = 'asset:';

export type MediaUploadKind = 'video-lesson' | 'listening' | 'thumbnail';

type MediaUploadRule = {
  label: string;
  acceptedMimePrefixes: string[];
  acceptedExtensions: string[];
  maxSizeBytes: number;
};

const mediaUploadRules: Record<MediaUploadKind, MediaUploadRule> = {
  'video-lesson': {
    label: 'video',
    acceptedMimePrefixes: ['video/'],
    acceptedExtensions: ['mp4', 'webm', 'mov', 'm4v'],
    maxSizeBytes: 500 * 1024 * 1024,
  },
  listening: {
    label: 'ses veya video',
    acceptedMimePrefixes: ['audio/', 'video/'],
    acceptedExtensions: ['mp3', 'm4a', 'aac', 'wav', 'ogg', 'opus', 'mp4', 'webm', 'mov', 'm4v'],
    maxSizeBytes: 250 * 1024 * 1024,
  },
  thumbnail: {
    label: 'görsel',
    acceptedMimePrefixes: ['image/'],
    acceptedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    maxSizeBytes: 8 * 1024 * 1024,
  },
};

export type StoredVideoAsset = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  file: Blob;
};

export type SavedMediaUpload = {
  id: string;
  storageKey: string;
  downloadUrl: string;
  storagePath: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  source: 'firebase';
  uploadedAt: string;
};

export type SavedVideoUpload = SavedMediaUpload;

export function isVideoAssetUrl(value?: string) {
  return Boolean(value && /^asset:[a-z0-9-]+$/i.test(value.trim()));
}

export function isRemoteVideoUrl(value?: string) {
  return Boolean(value && /^https:\/\//i.test(value.trim()));
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

function extensionFromName(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

function fallbackMimeType(kind: MediaUploadKind, name: string) {
  const extension = extensionFromName(name);
  if (extension === 'mp3') return 'audio/mpeg';
  if (extension === 'm4a') return 'audio/mp4';
  if (extension === 'aac') return 'audio/aac';
  if (extension === 'wav') return 'audio/wav';
  if (extension === 'ogg') return 'audio/ogg';
  if (extension === 'opus') return 'audio/opus';
  if (extension === 'webm') return kind === 'listening' ? 'video/webm' : 'video/webm';
  if (extension === 'mov') return 'video/quicktime';
  if (extension === 'm4v') return 'video/x-m4v';
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  return kind === 'thumbnail' ? 'image/jpeg' : kind === 'listening' ? 'audio/mpeg' : 'video/mp4';
}

function validateFile(file: File, kind: MediaUploadKind) {
  const rule = mediaUploadRules[kind];
  const extension = extensionFromName(file.name);
  const mimeType = file.type || fallbackMimeType(kind, file.name);
  const mimeOk = rule.acceptedMimePrefixes.some((prefix) => mimeType.toLowerCase().startsWith(prefix));
  const extensionOk = rule.acceptedExtensions.includes(extension);
  if (!mimeOk && !extensionOk) throw new Error(`Bu alan yalnızca ${rule.label} dosyası kabul eder.`);
  if (file.size > rule.maxSizeBytes) throw new Error(`Dosya çok büyük. Bu alan için üst sınır ${formatBytes(rule.maxSizeBytes)}.`);
  return mimeType;
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function safeFileName(name: string) {
  const fallback = 'upload';
  return (name || fallback)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || fallback;
}

function makeUploadId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function uploadPath(userId: string, kind: MediaUploadKind, id: string, fileName: string) {
  const month = new Date().toISOString().slice(0, 7);
  return `admin-media/${userId}/${kind}/${month}/${id}-${safeFileName(fileName)}`;
}

export async function saveMediaUpload(file: File, options: { kind: MediaUploadKind; contentId?: string; onProgress?: (percent: number) => void }): Promise<SavedMediaUpload> {
  if (!isFirebaseStorageConfigured || !firebaseStorage) {
    throw new Error('Firebase Storage ayarı eksik. EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET secret değerini ve Storage rules kurulumunu kontrol edin.');
  }
  const user = firebaseAuth?.currentUser;
  if (!user) throw new Error('Dosya yüklemek için Firebase admin hesabıyla giriş yapmalısınız.');

  const mimeType = validateFile(file, options.kind);
  const id = makeUploadId();
  const storagePath = uploadPath(user.uid, options.kind, id, file.name);
  const storageReference = ref(firebaseStorage, storagePath);
  const uploadTask = uploadBytesResumable(storageReference, file, {
    contentType: mimeType,
    customMetadata: {
      kind: options.kind,
      originalName: file.name,
      uploadedBy: user.uid,
      ...(options.contentId ? { contentId: options.contentId } : {}),
    },
  });

  await new Promise<void>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const total = snapshot.totalBytes || file.size || 1;
        options.onProgress?.(Math.round((snapshot.bytesTransferred / total) * 100));
      },
      (error) => reject(error),
      () => resolve(),
    );
  });

  const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
  return {
    id,
    storageKey: downloadUrl,
    downloadUrl,
    storagePath,
    name: file.name,
    mimeType,
    sizeBytes: file.size,
    source: 'firebase',
    uploadedAt: new Date().toISOString(),
  };
}

export async function saveVideoUpload(file: File, options?: { contentId?: string; onProgress?: (percent: number) => void }): Promise<SavedVideoUpload> {
  return saveMediaUpload(file, { kind: 'video-lesson', ...options });
}

export async function saveListeningUpload(file: File, options?: { contentId?: string; onProgress?: (percent: number) => void }): Promise<SavedMediaUpload> {
  return saveMediaUpload(file, { kind: 'listening', ...options });
}

export async function getVideoUploadUrl(storageKey?: string) {
  if (isRemoteVideoUrl(storageKey)) return storageKey!.trim();
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