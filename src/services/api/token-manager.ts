/**
 * Token Manager
 * 
 * This utility handles storage and retrieval of authentication tokens
 * in a consistent manner across the application.
 * 
 * Features:
 * - Secure token storage in localStorage
 * - Automatic token refresh
 * - Token validation and expiration handling
 */

// Constants for token storage keys
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';

// URL for token refresh API endpoint
const REFRESH_TOKEN_URL = '/auth/refresh-token';

/**
 * Token Manager Class
 * Provides methods for managing authentication tokens
 */
class TokenManager {
  /**
   * Set the access token in storage
   * 
   * @param token - The access token to store
   */
  setToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  /**
   * Get the current access token from storage
   * 
   * @returns The access token or null if not found
   */
  getToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  /**
   * Remove the access token from storage
   */
  removeToken(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  /**
   * Check if an access token exists
   * 
   * @returns True if a token exists, false otherwise
   */
  hasToken(): boolean {
    return !!this.getToken();
  }

  /**
   * Clear all authentication tokens
   */
  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }

  /**
   * Alias for clearTokens to maintain compatibility with base client
   */
  clearToken(): Promise<void> {
    this.clearTokens();
    return Promise.resolve();
  }

  /**
   * Set the refresh token in storage
   * 
   * @param token - The refresh token to store
   */
  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  /**
   * Get the refresh token from storage
   * 
   * @returns The refresh token or null if not found
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Set the token expiry timestamp
   * 
   * @param expiryTime - Expiry time in milliseconds since epoch
   */
  setTokenExpiry(expiryTime: number): void {
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  }

  /**
   * Get the token expiry timestamp
   * 
   * @returns The expiry time in milliseconds since epoch, or null if not set
   */
  getTokenExpiry(): number | null {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    return expiry ? parseInt(expiry, 10) : null;
  }

  /**
   * Check if the current token is expired
   * 
   * @returns True if the token is expired or expiry info is not available
   */
  isTokenExpired(): boolean {
    const expiry = this.getTokenExpiry();
    if (!expiry) return true;
    
    // Add a 30-second buffer to account for network latency
    return Date.now() > expiry - 30000;
  }

  /**
   * Remove the refresh token from storage
   */
  removeRefreshToken(): void {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Store both access and refresh tokens
   * 
   * @param accessToken - The access token to store
   * @param refreshToken - The refresh token to store
   * @param expiresIn - Optional token expiry time in seconds
   */
  setTokens(accessToken: string, refreshToken: string, expiresIn?: number): void {
    this.setToken(accessToken);
    this.setRefreshToken(refreshToken);
    
    // Set token expiry if provided
    if (expiresIn) {
      const expiryTime = Date.now() + expiresIn * 1000;
      this.setTokenExpiry(expiryTime);
    }
    
    // Dispatch an event to notify listeners that the token has changed
    try {
      document.dispatchEvent(new CustomEvent('token-changed', {
        detail: { token: accessToken }
      }));
    } catch (error) {
      console.error('Failed to dispatch token-changed event:', error);
    }
  }

  /**
   * Refresh the access token using the refresh token
   * 
   * @returns A promise that resolves to true if refresh was successful
   */
  async refreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;
    
    try {
      // Make a refresh token request
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}${REFRESH_TOKEN_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }
      
      const data = await response.json();
      
      // Store the new tokens
      if (data.accessToken) {
        this.setToken(data.accessToken);
        
        if (data.refreshToken) {
          this.setRefreshToken(data.refreshToken);
        }
        
        if (data.expiresIn) {
          const expiryTime = Date.now() + data.expiresIn * 1000;
          this.setTokenExpiry(expiryTime);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }
  
  /**
   * Clear all tokens from storage
   */
  clearTokens(): void {
    this.removeToken();
    this.removeRefreshToken();
  }

  /**
   * Check if the user is logged in based on token existence
   * 
   * @returns True if access token exists, false otherwise
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}

// Export a singleton instance
export const tokenManager = new TokenManager();

export default tokenManager;
