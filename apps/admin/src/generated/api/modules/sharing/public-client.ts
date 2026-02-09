/**
 * Public (unauthenticated) client for viewing shared content.
 *
 * Uses the public nginx route: /public/v1/sharing/shared/{token}
 */

const PUBLIC_BASE_URL = '/public/v1/sharing';

export interface ViewSharedContentResponse {
  resourceType: string;
  resourceName: string;
  password?: string;
  fileName?: string;
  mimeType?: string;
  fileContent?: string; // base64-encoded file content for documents
  error?: string;
}

export async function viewSharedContent(
  token: string,
): Promise<ViewSharedContentResponse> {
  const response = await fetch(`${PUBLIC_BASE_URL}/shared/${token}`);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      data.error || `Failed to load shared content (${response.status})`,
    );
  }

  return response.json();
}

export function getSharedDownloadUrl(token: string): string {
  return `${PUBLIC_BASE_URL}/shared/${token}/download`;
}
