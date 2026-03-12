/**
 * Authenticated client for internal document signing sessions.
 *
 * Uses the nginx public proxy route which forwards directly to
 * paperless HTTP server (port 9501). The paperless HTTP server
 * handles JWT auth verification internally for /auth/ endpoints.
 *
 * Route: /public/v1/signing/sessions/auth/{token}
 *   → nginx rewrites to /api/v1/signing/sessions/auth/{token}
 *   → paperless HTTP server verifies Bearer token
 */

import { useAccessStore } from '@vben/stores';

import type {
  SigningSessionResponse,
  SubmitSigningRequest,
  SubmitSigningResponse,
} from './public-client';

const MODULE_BASE_URL = '/public/v1/signing';

function getAuthHeaders(): Record<string, string> {
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getAuthenticatedSigningSession(
  token: string,
): Promise<SigningSessionResponse> {
  const response = await fetch(
    `${MODULE_BASE_URL}/sessions/auth/${token}`,
    {
      headers: { ...getAuthHeaders() },
    },
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new AuthRequiredError(
        data.error || 'Please log in to access this signing session',
      );
    }
    throw new Error(
      data.error ||
        data.message ||
        `Failed to load signing session (${response.status})`,
    );
  }

  return response.json();
}

export async function submitAuthenticatedSigning(
  token: string,
  data: SubmitSigningRequest,
): Promise<SubmitSigningResponse> {
  const response = await fetch(
    `${MODULE_BASE_URL}/sessions/auth/${token}/submit`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new AuthRequiredError(
        errData.error || 'Please log in to submit your signature',
      );
    }
    throw new Error(
      errData.error ||
        errData.message ||
        `Failed to submit signing (${response.status})`,
    );
  }

  return response.json();
}

export class AuthRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthRequiredError';
  }
}
