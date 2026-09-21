import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

import { firebaseAuth, firebaseStorage, isFirebaseStorageConfigured } from '@/lib/firebase';

export type SpeakingRecordingUpload = {
  downloadUrl: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
};

const maxRecordingSizeBytes = 25 * 1024 * 1024;

function safeSegment(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'item';
}

export async function uploadSpeakingRecording(blob: Blob, input: { userId: string; taskId: string; attemptId: string; onProgress?: (percent: number) => void }): Promise<SpeakingRecordingUpload> {
  if (!isFirebaseStorageConfigured || !firebaseStorage) throw new Error('Ses kaydı yüklemek için Firebase Storage ayarı tamamlanmalıdır.');
  const user = firebaseAuth?.currentUser;
  if (!user || user.uid !== input.userId) throw new Error('Ses kaydını yüklemek için öğrenci hesabıyla giriş yapmalısınız.');
  if (!blob.type.toLowerCase().startsWith('audio/')) throw new Error('Tarayıcı geçerli bir ses kaydı üretemedi.');
  if (blob.size < 1) throw new Error('Ses kaydı boş. Lütfen yeniden kaydedin.');
  if (blob.size > maxRecordingSizeBytes) throw new Error('Ses kaydı 25 MB sınırını aşıyor. Daha kısa bir yanıt kaydedin.');

  const extension = blob.type.includes('ogg') ? 'ogg' : blob.type.includes('mp4') ? 'm4a' : 'webm';
  const storagePath = `speaking-attempts/${input.userId}/${safeSegment(input.taskId)}/${input.attemptId}.${extension}`;
  const uploadTask = uploadBytesResumable(ref(firebaseStorage, storagePath), blob, {
    contentType: blob.type,
    customMetadata: { kind: 'speaking-attempt', taskId: input.taskId, attemptId: input.attemptId, uploadedBy: input.userId },
  });

  await new Promise<void>((resolve, reject) => {
    uploadTask.on('state_changed', (snapshot) => {
      input.onProgress?.(Math.round((snapshot.bytesTransferred / Math.max(1, snapshot.totalBytes)) * 100));
    }, reject, resolve);
  });

  return {
    downloadUrl: await getDownloadURL(uploadTask.snapshot.ref),
    storagePath,
    mimeType: blob.type,
    sizeBytes: blob.size,
  };
}
