// client/src/stores/favorites.js
import { writable } from 'svelte/store';

export const favorites = writable([]);


export async function loadFavorites() {
  const token = localStorage.getItem('token');
  if (!token) {
    favorites.set([]);
    return;
  }
  const res = await fetch('http://localhost:8080/favorites', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.ok) {
    const items = await res.json(); 
    const ids = items.map(item => item.id);
    favorites.set(ids);
  } else {
    favorites.set([]);
  }
}

export async function toggleFavorite(menuItemId) {
  const token = localStorage.getItem('token');
  if (!token) return;

  let current;
  favorites.subscribe(v => current = v)();
  const isFav = current.includes(menuItemId);

  if (isFav) {
    // send DELETE
    const res = await fetch(`http://localhost:8080/favorites/${menuItemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      favorites.update(arr => arr.filter(id => id !== menuItemId));
    }
  } else {
    // send POST
    const res = await fetch('http://localhost:8080/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ menuItemId })
    });
    if (res.ok) {
      favorites.update(arr => [...arr, menuItemId]);
    }
  }
}
