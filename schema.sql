-- --------------------------------------------------
-- Schema: normalized menu_items ↔ ingredients
-- --------------------------------------------------

-- 1) Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer'
);

-- 2) Menu items
CREATE TABLE IF NOT EXISTS menu_items (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  price      NUMERIC(8,2) NOT NULL,
  category   TEXT,
  image_url  TEXT,
  available  BOOLEAN NOT NULL DEFAULT TRUE
);

-- 3) Ingredients lookup
CREATE TABLE IF NOT EXISTS ingredients (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- 4) Join table for menu_items ↔ ingredients
CREATE TABLE IF NOT EXISTS menu_item_ingredients (
  menu_item_id  INTEGER NOT NULL
    REFERENCES menu_items(id)
    ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL
    REFERENCES ingredients(id)
    ON DELETE CASCADE,
  PRIMARY KEY (menu_item_id, ingredient_id)
);

-- 5) Orders
CREATE TABLE IF NOT EXISTS orders (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL
    REFERENCES users(id),
  status     TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6) Order items
CREATE TABLE IF NOT EXISTS order_items (
  id            SERIAL PRIMARY KEY,
  order_id      INTEGER NOT NULL
    REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id  INTEGER NOT NULL
    REFERENCES menu_items(id),
  quantity      INTEGER NOT NULL DEFAULT 1
);
