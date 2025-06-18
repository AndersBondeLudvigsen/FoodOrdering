
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer'
);

CREATE TABLE IF NOT EXISTS menu_items (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  price      INTEGER NOT NULL,
  category   TEXT,
  image_url  TEXT,
  available  BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ingredients (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS menu_item_ingredients (
  menu_item_id  INTEGER NOT NULL
    REFERENCES menu_items(id)
    ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL
    REFERENCES ingredients(id)
    ON DELETE CASCADE,
  PRIMARY KEY (menu_item_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL
    REFERENCES users(id),
  status     TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id            SERIAL PRIMARY KEY,
  order_id      INTEGER NOT NULL
    REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id  INTEGER NOT NULL
    REFERENCES menu_items(id),
  quantity      INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id      INTEGER NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,
  menu_item_id INTEGER NOT NULL
    REFERENCES menu_items(id)
    ON DELETE CASCADE,
  PRIMARY KEY (user_id, menu_item_id)
);

