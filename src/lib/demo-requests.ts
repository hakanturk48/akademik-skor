export type DemoRequestStatus = 'new' | 'contacted' | 'archived';

export type DemoRequest = {
  id: string;
  name: string;
  contact: string;
  source: string;
  status: DemoRequestStatus;
  createdAt: string;
  updatedAt: string;
};

type DemoRequestInput = {
  name: string;
  contact: string;
  source?: string;
};

type DemoRequestSuccess = {
  ok: true;
  request: DemoRequest;
};

type DemoRequestFailure = {
  ok: false;
  message: string;
};

export type DemoRequestResult = DemoRequestSuccess | DemoRequestFailure;

const DEMO_REQUESTS_KEY = 'akademik-skor.demo-requests';
let memoryDemoRequests: DemoRequest[] = [];

function hasLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function makeDemoRequestId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `demo-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function normalizeContact(contact: string) {
  return contact.trim().replace(/\s+/g, ' ');
}

function isValidContact(contact: string) {
  const normalized = normalizeContact(contact);
  const looksLikeEmail = /^\S+@\S+\.\S+$/.test(normalized.toLowerCase());
  const looksLikePhone = /^\+?[\d\s().-]{7,}$/.test(normalized);
  return looksLikeEmail || looksLikePhone;
}

function readDemoRequests(): DemoRequest[] {
  if (!hasLocalStorage()) {
    return memoryDemoRequests;
  }

  try {
    const raw = window.localStorage.getItem(DEMO_REQUESTS_KEY);
    return raw ? (JSON.parse(raw) as DemoRequest[]) : [];
  } catch {
    return [];
  }
}

function writeDemoRequests(requests: DemoRequest[]) {
  if (!hasLocalStorage()) {
    memoryDemoRequests = requests;
    return;
  }

  window.localStorage.setItem(DEMO_REQUESTS_KEY, JSON.stringify(requests));
}

export function getDemoRequests() {
  return readDemoRequests();
}

export function submitDemoRequest(input: DemoRequestInput): DemoRequestResult {
  const name = input.name.trim();
  const contact = normalizeContact(input.contact);

  if (name.length < 2) {
    return { ok: false, message: 'Lütfen ad soyad bilgisini girin.' };
  }

  if (!isValidContact(contact)) {
    return { ok: false, message: 'Geçerli bir e-posta veya telefon girin.' };
  }

  const now = new Date().toISOString();
  const request: DemoRequest = {
    id: makeDemoRequestId(),
    name,
    contact,
    source: input.source?.trim() || 'public-home',
    status: 'new',
    createdAt: now,
    updatedAt: now,
  };

  writeDemoRequests([request, ...readDemoRequests()]);
  return { ok: true, request };
}