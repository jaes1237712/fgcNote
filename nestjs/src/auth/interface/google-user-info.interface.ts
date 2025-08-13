export interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string; // Optional if not always present
  google_sub: string; // Google User ID
}
