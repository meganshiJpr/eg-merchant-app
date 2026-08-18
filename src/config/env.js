/**
 * Centralized Environment Configuration
 *
 * Reads environment variables from process.env with appropriate fallbacks.
 * Preserves existing environment variable names:
 *   - NEXT_PUBLIC_API_BASE_URL
 *   - NEXT_PUBLIC_ENCRYPT
 *   - NEXT_PUBLIC_AES_KEY
 *   - NEXT_PUBLIC_AES_IV
 */

export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "https://staging.paybyapis.com",
  encryptMode: process.env.NEXT_PUBLIC_ENCRYPT || "apisi",
  aesKey: process.env.NEXT_PUBLIC_AES_KEY || "0123456789abcdef0123456789abcdef",
  aesIv: process.env.NEXT_PUBLIC_AES_IV || "abcdef9876543210",
};
