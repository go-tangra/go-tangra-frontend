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

  // --- WebAuthn Debug Logging ---
  console.group('[WebAuthn Debug] performRegistration');
  console.log('Browser origin:', window.location.origin);
  console.log('Server rp.id:', publicKey.rp?.id);
  console.log('Server rp.name:', publicKey.rp?.name);
  console.log('rpId vs hostname match:', publicKey.rp?.id === window.location.hostname ? '✓ MATCH' : `✗ MISMATCH`);
  console.groupEnd();
  // --- End Debug ---

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

  // --- WebAuthn Debug Logging ---
  console.group('[WebAuthn Debug] performAssertion');
  console.log('Browser origin:', window.location.origin);
  console.log('Browser hostname:', window.location.hostname);
  console.log('Server rpId:', publicKey.rpId);
  console.log('Server timeout:', publicKey.timeout);
  console.log('allowCredentials count:', publicKey.allowCredentials?.length ?? 0);
  if (publicKey.allowCredentials) {
    publicKey.allowCredentials.forEach((c: any, i: number) => {
      console.log(`  credential[${i}]: type=${c.type}, id=${typeof c.id === 'string' ? c.id.substring(0, 20) + '...' : '(buffer)'}, transports=${c.transports?.join(',') ?? 'none'}`);
    });
  }
  console.log('rpId vs hostname match:', publicKey.rpId === window.location.hostname ? '✓ MATCH' : `✗ MISMATCH (rpId="${publicKey.rpId}" hostname="${window.location.hostname}")`);
  console.groupEnd();
  // --- End Debug ---

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

  let credential: PublicKeyCredential;
  try {
    credential = (await navigator.credentials.get({
      publicKey,
    })) as PublicKeyCredential;
  } catch (err) {
    // Enhanced error logging for WebAuthn failures
    console.error('[WebAuthn Debug] navigator.credentials.get() FAILED');
    console.error('  Error name:', (err as Error).name);
    console.error('  Error message:', (err as Error).message);
    console.error('  rpId:', publicKey.rpId);
    console.error('  origin:', window.location.origin);
    console.error('  protocol:', window.location.protocol);
    if ((err as Error).name === 'NotAllowedError') {
      console.error('  DIAGNOSIS: User denied, timed out, or rpId/origin mismatch.');
      console.error('  Check: Is rpId "' + publicKey.rpId + '" a registrable suffix of "' + window.location.hostname + '"?');
    } else if ((err as Error).name === 'SecurityError') {
      console.error('  DIAGNOSIS: rpId is not valid for this origin. Must use HTTPS (except localhost).');
    } else if ((err as Error).name === 'InvalidStateError') {
      console.error('  DIAGNOSIS: No matching credential found on the authenticator for this rpId.');
    }
    throw err;
  }

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
