/**
 * WebAuthn browser API utilities for FIDO2/Security Key enrollment and authentication.
 */

/** Convert an ArrayBuffer to a base64url-encoded string. */
export function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const b of bytes) {
    binary += String.fromCodePoint(b);
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

/** Convert a base64url-encoded string to an ArrayBuffer. */
export function base64urlToBuffer(str: string): ArrayBuffer {
  const base64 = str.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.codePointAt(i) ?? 0;
  }
  return bytes.buffer;
}

/** Check if WebAuthn is supported in the current browser. */
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator.credentials !== 'undefined'
  );
}

/**
 * Perform WebAuthn registration (credential creation) ceremony.
 * Takes the JSON options from the server and invokes navigator.credentials.create().
 * Returns the attestation response fields as base64url-encoded strings.
 */
export async function performRegistration(optionsJson: string): Promise<{
  authenticator_data: string;
  client_data_json: string;
  id: string;
}> {
  const options = JSON.parse(optionsJson);
  const publicKey = options.publicKey;

  // Decode challenge and user.id from base64url
  publicKey.challenge = base64urlToBuffer(publicKey.challenge);
  publicKey.user.id = base64urlToBuffer(publicKey.user.id);

  // Decode excludeCredentials IDs
  if (publicKey.excludeCredentials) {
    publicKey.excludeCredentials = publicKey.excludeCredentials.map(
      (cred: any) => ({
        ...cred,
        id: base64urlToBuffer(cred.id),
      }),
    );
  }

  const credential = (await navigator.credentials.create({
    publicKey,
  })) as PublicKeyCredential;

  const response = credential.response as AuthenticatorAttestationResponse;

  return {
    id: bufferToBase64url(credential.rawId),
    client_data_json: bufferToBase64url(response.clientDataJSON),
    authenticator_data: bufferToBase64url(response.attestationObject),
  };
}

/**
 * Perform WebAuthn authentication (assertion) ceremony.
 * Takes the JSON options from the server and invokes navigator.credentials.get().
 * Returns the assertion response fields as base64url-encoded strings.
 */
export async function performAssertion(optionsJson: string): Promise<{
  authenticator_data: string;
  client_data_json: string;
  id: string;
  signature: string;
  user_handle?: string;
}> {
  const options = JSON.parse(optionsJson);
  const publicKey = options.publicKey;

  // Decode challenge from base64url
  publicKey.challenge = base64urlToBuffer(publicKey.challenge);

  // Decode allowCredentials IDs
  if (publicKey.allowCredentials) {
    publicKey.allowCredentials = publicKey.allowCredentials.map(
      (cred: any) => ({
        ...cred,
        id: base64urlToBuffer(cred.id),
      }),
    );
  }

  const credential = (await navigator.credentials.get({
    publicKey,
  })) as PublicKeyCredential;

  const response = credential.response as AuthenticatorAssertionResponse;

  const result: {
    authenticator_data: string;
    client_data_json: string;
    id: string;
    signature: string;
    user_handle?: string;
  } = {
    id: bufferToBase64url(credential.rawId),
    client_data_json: bufferToBase64url(response.clientDataJSON),
    authenticator_data: bufferToBase64url(response.authenticatorData),
    signature: bufferToBase64url(response.signature),
  };

  if (response.userHandle) {
    result.user_handle = bufferToBase64url(response.userHandle);
  }

  return result;
}
