// ============================================================
// API Types
// ============================================================

export interface User {
  id: string;
  email: string;
  username: string;
  ranksBalance: number;
  totalEarned: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  subcategories: Subcategory[];
  createdAt: string;
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  createdAt: string;
}

export interface Ranking {
  id: string;
  title: string;
  description?: string;
  subcategoryId: string;
  subcategory: Subcategory & { category?: Category };
  initiatorId: string;
  initiator: { id: string; username: string };
  status: string;
  periodType: string;
  periodStart: string;
  periodEnd: string;
  rankingDurationDays?: number;
  pointsPerRank: number;
  totalVotesCollected?: number;
  winnerEntityName?: string;
  winnerCertificateUrl?: string;
  imageUrl?: string;
  createdAt: string;
  closedAt?: string;
  _count?: { votes: number; comments: number };
}

export interface Vote {
  id: string;
  rankingId: string;
  ranking?: Ranking;
  userId: string;
  user: User;
  points: number;
  motivation: string;
  proofLinks: string[];
  rank: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  rankingId: string;
  userId: string;
  user: User;
  text: string;
  likes: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'purchase' | 'fee' | 'credit' | 'reward';
  amount: number;
  description: string;
  createdAt: string;
}

export interface RevenueDistribution {
  id: string;
  rankingId: string;
  ranking?: Ranking;
  userId: string;
  user?: User;
  amount: number;
  role: 'initiator' | 'contributor';
  createdAt: string;
}

export interface WinnerCertificate {
  id: string;
  rankingId: string;
  ranking?: Ranking;
  userId: string;
  user?: User;
  url: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================
// Auth Token Helpers
// ============================================================

const TOKEN_KEY = 'rankapp_auth_token';

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ============================================================
// API Client
// ============================================================

const BASE_URL = '/api';

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestInit
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });

  if (!response.ok) {
    if (response.status === 401) {
      removeAuthToken();
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }

    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    const message =
      (errorData as { message?: string })?.message ||
      `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, errorData);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const apiClient = {
  get: <T>(path: string, options?: RequestInit) =>
    request<T>('GET', path, undefined, options),

  post: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>('POST', path, body, options),

  put: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>('PUT', path, body, options),

  del: <T>(path: string, options?: RequestInit) =>
    request<T>('DELETE', path, undefined, options),
};

export { ApiError };
