/**
 * Google OAuth2 Authentication Service for Veo API
 *
 * Implements OAuth2 flow to get access tokens for Vertex AI video generation.
 * Tokens are stored in localStorage with automatic refresh handling.
 */

// OAuth2 Configuration from environment variables
const GOOGLE_CLIENT_ID = import.meta.env.VITE_APP_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_APP_GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = import.meta.env.VITE_APP_GOOGLE_CALLBACK_URL || `${window.location.origin}/auth/callback`;

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'genid_google_access_token',
  REFRESH_TOKEN: 'genid_google_refresh_token',
  TOKEN_EXPIRY: 'genid_google_token_expiry',
  USER_EMAIL: 'genid_google_user_email',
  USER_NAME: 'genid_google_user_name',
  USER_PICTURE: 'genid_google_user_picture',
};

// Scopes required for Vertex AI access
const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

// Google OAuth2 endpoints
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

export interface GoogleUser {
  email: string;
  name: string;
  picture: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: GoogleUser | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

/**
 * Check if OAuth2 is properly configured
 */
export function isOAuth2Configured(): boolean {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}

/**
 * Generate a random string for PKCE code verifier
 */
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate code challenge from verifier for PKCE
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Start the OAuth2 login flow
 * Opens a popup window for Google authentication
 */
export async function startLoginFlow(): Promise<void> {
  if (!isOAuth2Configured()) {
    throw new Error('OAuth2 no configurado. Verifica las variables de entorno VITE_APP_GOOGLE_CLIENT_ID y VITE_APP_GOOGLE_CLIENT_SECRET');
  }

  // Generate and store PKCE code verifier
  const codeVerifier = generateCodeVerifier();
  sessionStorage.setItem('oauth_code_verifier', codeVerifier);

  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Generate state for CSRF protection
  const state = generateCodeVerifier();
  sessionStorage.setItem('oauth_state', state);

  // Build authorization URL
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope: OAUTH_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;

  // Redirect to Google auth
  window.location.href = authUrl;
}

/**
 * Handle the OAuth2 callback
 * Exchanges authorization code for tokens
 */
export async function handleAuthCallback(code: string, state: string): Promise<GoogleUser> {
  // Verify state to prevent CSRF
  const storedState = sessionStorage.getItem('oauth_state');
  if (state !== storedState) {
    throw new Error('Estado de autenticacion invalido. Por favor intenta de nuevo.');
  }

  // Get the code verifier for PKCE
  const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
  if (!codeVerifier) {
    throw new Error('No se encontro el verificador de codigo. Por favor intenta de nuevo.');
  }

  // Exchange code for tokens
  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code: code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: GOOGLE_CALLBACK_URL,
    }),
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.text();
    console.error('Token exchange error:', errorData);
    throw new Error('Error al obtener tokens de acceso. Por favor intenta de nuevo.');
  }

  const tokens: TokenResponse = await tokenResponse.json();

  // Store tokens
  storeTokens(tokens);

  // Clean up PKCE data
  sessionStorage.removeItem('oauth_code_verifier');
  sessionStorage.removeItem('oauth_state');

  // Fetch user info
  const user = await fetchUserInfo(tokens.access_token);
  storeUserInfo(user);

  return user;
}

/**
 * Store tokens in localStorage
 */
function storeTokens(tokens: TokenResponse): void {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token);

  if (tokens.refresh_token) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token);
  }

  // Calculate expiry time (current time + expires_in seconds - 5 minutes buffer)
  const expiryTime = Date.now() + (tokens.expires_in - 300) * 1000;
  localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
}

/**
 * Store user info in localStorage
 */
function storeUserInfo(user: GoogleUser): void {
  localStorage.setItem(STORAGE_KEYS.USER_EMAIL, user.email);
  localStorage.setItem(STORAGE_KEYS.USER_NAME, user.name);
  localStorage.setItem(STORAGE_KEYS.USER_PICTURE, user.picture);
}

/**
 * Fetch user info from Google
 */
async function fetchUserInfo(accessToken: string): Promise<GoogleUser> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener informacion del usuario');
  }

  const data = await response.json();
  return {
    email: data.email,
    name: data.name,
    picture: data.picture,
  };
}

/**
 * Check if the current access token is expired
 */
export function isTokenExpired(): boolean {
  const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
  if (!expiry) return true;
  return Date.now() >= parseInt(expiry, 10);
}

/**
 * Refresh the access token using the refresh token
 */
export async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

  if (!refreshToken) {
    throw new Error('No hay refresh token disponible. Por favor inicia sesion de nuevo.');
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    // If refresh fails, clear stored tokens and require re-login
    clearAuthData();
    throw new Error('La sesion ha expirado. Por favor inicia sesion de nuevo.');
  }

  const tokens: TokenResponse = await response.json();
  storeTokens(tokens);

  return tokens.access_token;
}

/**
 * Get a valid access token, refreshing if necessary
 */
export async function getValidAccessToken(): Promise<string | null> {
  let accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  if (!accessToken) {
    return null;
  }

  // Check if token is expired and refresh if needed
  if (isTokenExpired()) {
    try {
      accessToken = await refreshAccessToken();
    } catch {
      return null;
    }
  }

  return accessToken;
}

/**
 * Get the current stored access token without validation
 */
export function getStoredAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

/**
 * Get stored user info
 */
export function getStoredUser(): GoogleUser | null {
  const email = localStorage.getItem(STORAGE_KEYS.USER_EMAIL);
  const name = localStorage.getItem(STORAGE_KEYS.USER_NAME);
  const picture = localStorage.getItem(STORAGE_KEYS.USER_PICTURE);

  if (!email || !name) {
    return null;
  }

  return { email, name, picture: picture || '' };
}

/**
 * Check if user is currently authenticated
 */
export function isAuthenticated(): boolean {
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  return Boolean(accessToken && refreshToken);
}

/**
 * Clear all authentication data (logout)
 */
export function clearAuthData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

/**
 * Logout the user
 */
export function logout(): void {
  clearAuthData();
}

/**
 * Check if we're on the auth callback page
 */
export function isAuthCallback(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('code') && urlParams.has('state');
}

/**
 * Process the auth callback from URL
 */
export async function processAuthCallback(): Promise<GoogleUser | null> {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const error = urlParams.get('error');

  // Check for errors
  if (error) {
    const errorDescription = urlParams.get('error_description') || error;
    throw new Error(`Error de autenticacion: ${errorDescription}`);
  }

  if (!code || !state) {
    return null;
  }

  // Handle the callback
  const user = await handleAuthCallback(code, state);

  // Clean up URL
  window.history.replaceState({}, document.title, window.location.pathname);

  return user;
}

/**
 * Initialize authentication state
 * Call this on app startup to restore session
 */
export async function initializeAuth(): Promise<AuthState> {
  // Check if we're on the auth callback
  if (isAuthCallback()) {
    try {
      const user = await processAuthCallback();
      if (user) {
        const accessToken = await getValidAccessToken();
        return {
          isAuthenticated: true,
          user,
          accessToken,
          isLoading: false,
          error: null,
        };
      }
    } catch (err) {
      return {
        isAuthenticated: false,
        user: null,
        accessToken: null,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Error de autenticacion',
      };
    }
  }

  // Check for existing session
  if (isAuthenticated()) {
    const user = getStoredUser();
    try {
      const accessToken = await getValidAccessToken();
      if (accessToken && user) {
        return {
          isAuthenticated: true,
          user,
          accessToken,
          isLoading: false,
          error: null,
        };
      }
    } catch {
      // Token refresh failed, session expired
      clearAuthData();
    }
  }

  // No valid session
  return {
    isAuthenticated: false,
    user: null,
    accessToken: null,
    isLoading: false,
    error: null,
  };
}
