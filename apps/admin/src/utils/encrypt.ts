import CryptoJS from 'crypto-js';

/**
 * Encrypt a password with AES-CBC before sending to the server.
 * Uses the VITE_AES_KEY env variable as both key and IV.
 */
export function encryptPassword(password: string): string {
  const key = import.meta.env.VITE_AES_KEY;
  if (!key) {
    throw new Error('VITE_AES_KEY is not set in environment');
  }
  const keyHex = CryptoJS.enc.Utf8.parse(key);
  const ivHex = CryptoJS.enc.Utf8.parse(key);
  const encrypted = CryptoJS.AES.encrypt(password, keyHex, {
    iv: ivHex,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return encrypted.toString();
}
