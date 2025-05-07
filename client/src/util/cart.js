// src/stores/cart.js
import { writable } from 'svelte/store';

// Each entry: { id, name, price, quantity }
export const cart = writable([]);
