import { writable, derived } from 'svelte/store';

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

const initialToken = localStorage.getItem('token');
export const token = writable(initialToken);

export const user = derived(token, ($token) => {
  if (!$token) return null;
  return parseJwt($token);
});

token.subscribe((value) => {
  if (value) {
    localStorage.setItem('token', value);
  } else {
    localStorage.removeItem('token');
  }
});
