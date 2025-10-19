const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

const resolveApiUrl = (path: string) => {
  if (!API_BASE_URL) {
    return path;
  }

  try {
    return new URL(path, API_BASE_URL).toString();
  } catch {
    return `${API_BASE_URL}${path}`;
  }
};

const buildHeaders = (initData: string) => {
  const headers = new Headers({
    'Content-Type': 'application/json',
  });

  if (initData) {
    headers.set('X-Telegram-Init-Data', initData);
  }

  return headers;
};

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, options: { status: number; data?: unknown; cause?: unknown }) {
    super(message, { cause: options.cause });
    this.status = options.status;
    this.data = options.data;
    this.name = 'ApiError';
  }
}

export interface AccountResponse {
  username: string;
  tag?: string | null;
  status: string;
  expireAt?: string;
  trafficLimitBytes?: number;
  usedTrafficBytes?: number;
  happ?: {
    cryptoLink?: string;
  };
}

export interface TrialAccountResponse {
  account: AccountResponse;
  created: boolean;
}

interface RequestOptions {
  signal?: AbortSignal;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const readStringField = (source: Record<string, unknown> | undefined, key: string) => {
  if (!source) {
    return undefined;
  }

  const value = source[key];
  return typeof value === 'string' ? value : undefined;
};

const parseResponse = async (response: Response) => {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const payload = isRecord(data) ? data : undefined;
    const message =
      readStringField(payload, 'error') ??
      readStringField(payload, 'message') ??
      'Beklenmeyen bir hata oluştu.';

    throw new ApiError(message, {
      status: response.status,
      data,
    });
  }

  return data;
};

export const fetchAccount = async (initData: string, options: RequestOptions = {}) => {
  const response = await fetch(resolveApiUrl('/api/account'), {
    method: 'POST',
    headers: buildHeaders(initData),
    signal: options.signal,
  });

  return (await parseResponse(response)) as AccountResponse;
};

export const createTrialAccount = async (initData: string, options: RequestOptions = {}) => {
  const response = await fetch(resolveApiUrl('/api/account/trial'), {
    method: 'POST',
    headers: buildHeaders(initData),
    signal: options.signal,
  });

  return (await parseResponse(response)) as TrialAccountResponse;
};

