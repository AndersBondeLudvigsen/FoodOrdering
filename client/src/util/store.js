// src/stores.js
import { writable } from 'svelte/store';

export const user = writable(null);
export const page = writable('login');
