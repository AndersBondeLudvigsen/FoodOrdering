// src/stores/auth.js
import { writable, derived } from 'svelte/store';

// Helper to decode JWT payload without external dependencies
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Initialize the token store with any existing token from localStorage
const initialToken = localStorage.getItem('token');
export const token = writable(initialToken);

// Derived store for decoded user payload (id, username, role, etc.)
export const user = derived(token, ($token) => {
  if (!$token) return null;
  return parseJwt($token);
});

// Keep localStorage in sync with the store
token.subscribe((value) => {
  if (value) {
    localStorage.setItem('token', value);
  } else {
    localStorage.removeItem('token');
  }
});
