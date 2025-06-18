// src/stores/cart.js
import { writable } from 'svelte/store';
    
import * as toast from '../util/toast.js';


export const cart = writable([]);


export function clearCart() {
  cart.set([]);
}

export function decreaseQuantity(itemId) {
  cart.update(items => {
    const item = items.find(i => i.id === itemId);
    if (item && item.quantity > 1) {
      // Hvis der er mere end 1, træk en fra
      item.quantity--;
      return items;
    } else {
      // Ellers, fjern hele varen fra listen
      return items.filter(i => i.id !== itemId);
    }
  });
}

 export function addToCart(item) {
        cart.update(current => {
            const idx = current.findIndex(i => i.id === item.id);
            if (idx > -1) {
                current[idx].quantity += 1;
                return current;
            } else {
                return [...current, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
            }
        });
            toast.success(`${item.name} added to basket`);

    }