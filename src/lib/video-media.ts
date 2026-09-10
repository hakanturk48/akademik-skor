import { isVideoAssetUrl } from './video-upload';

export type VideoMediaProvider = 'youtube' | 'vimeo' | 'upload';
export type VideoTimedLine = { startSeconds: number; text: string };

export const videoMediaProviders: { value: VideoMediaProvider; label: string }[] = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'vimeo', label: 'Vimeo' },
  { value: 'upload', label: 'Yüklenen video' },
];

function extractYouTubeId(value: string) {
  const match = value.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/i);
  return match?.[1] ?? null;
}

function extractVimeoId(value: string) {
  const match = value.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d{6,})/i);
  return match?.[1] ?? null;
}

export function getVideoEmbedUrl(provider?: VideoMediaProvider, mediaUrl?: string) {
  const value = mediaUrl?.trim() ?? '';
  if (!value || !provider) return null;
  if (provider === 'upload') return null;
  if (provider === 'youtube') {
    const id = extractYouTubeId(value);
    return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` : null;
  }
  const id = extractVimeoId(value);
  return id ? `https://player.vimeo.com/video/${id}?dnt=1` : null;
}

export function validateVideoMediaUrl(provider: VideoMediaProvider | undefined, mediaUrl: string | undefined) {
  const value = mediaUrl?.trim() ?? '';
  if (!value) return 'Video bağlantısı gerekli.';
  if (!provider) return 'Video sağlayıcısı seçilmeli.';
  if (provider === 'upload') return isVideoAssetUrl(value) ? null : 'Yüklenen video dosyası seçilmeli.';
  if (!/^https:\/\//i.test(value)) return 'Video bağlantısı https:// ile başlamalı.';
  if (!getVideoEmbedUrl(provider, value)) return provider === 'youtube' ? 'Geçerli bir YouTube video bağlantısı girin.' : 'Geçerli bir Vimeo video bağlantısı girin.';
  return null;
}

function parseTimestamp(value: string) {
  const parts = value.trim().split(':').map(Number);
  if (parts.some((part) => !Number.isInteger(part) || part < 0) || (parts.length !== 2 && parts.length !== 3)) return null;
  const seconds = parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0] * 3600 + parts[1] * 60 + parts[2];
  return parts.length === 2 && parts[1] >= 60 ? null : parts.length === 3 && (parts[1] >= 60 || parts[2] >= 60) ? null : seconds;
}

export function parseVideoTimedText(value?: string) {
  const invalidLines: string[] = [];
  const lines: VideoTimedLine[] = [];
  (value ?? '').split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const separator = trimmed.indexOf('|');
    const timestamp = separator >= 0 ? parseTimestamp(trimmed.slice(0, separator)) : null;
    const text = separator >= 0 ? trimmed.slice(separator + 1).trim() : '';
    if (timestamp === null || !text) {
      invalidLines.push(trimmed);
      return;
    }
    lines.push({ startSeconds: timestamp, text });
  });
  return { lines: lines.sort((left, right) => left.startSeconds - right.startSeconds), invalidLines };
}

export function formatVideoTimestamp(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainder = safeSeconds % 60;
  return hours > 0
    ? String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ':' + String(remainder).padStart(2, '0')
    : String(minutes).padStart(2, '0') + ':' + String(remainder).padStart(2, '0');
}

export function serializeVideoTimedText(lines?: VideoTimedLine[]) {
  return (lines ?? []).map((line) => formatVideoTimestamp(line.startSeconds) + '|' + line.text).join('\n');
}

export function videoProviderLabel(provider?: VideoMediaProvider) {
  return videoMediaProviders.find((item) => item.value === provider)?.label ?? 'Video kaynağı';
}
