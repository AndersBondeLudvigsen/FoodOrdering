import { writable } from 'svelte/store';

// Initialize the token store with any existing token from localStorage
const initialToken = localStorage.getItem('token');
export const token = writable(initialToken);

// Keep localStorage in sync with the store
token.subscribe((value) => {
  if (value) {
    localStorage.setItem('token', value);
  } else {
    localStorage.removeItem('token');
  }
});