import { useAuthStore } from '../stores/auth';

const API_BASE_URL = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3000/dev';

export interface CheckoutSessionRequest {
  priceId: string;
  email: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface PortalSessionResponse {
  url: string;
}

async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { accessToken } = useAuthStore.getState();

  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
      },
    }));
    throw new Error(error.error?.message || 'Request failed');
  }

  return response.json();
}

export async function createCheckoutSession(
  data: CheckoutSessionRequest
): Promise<CheckoutSessionResponse> {
  return fetchWithAuth<CheckoutSessionResponse>('/payment/checkout', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createPortalSession(): Promise<PortalSessionResponse> {
  return fetchWithAuth<PortalSessionResponse>('/payment/portal', {
    method: 'POST',
  });
}
