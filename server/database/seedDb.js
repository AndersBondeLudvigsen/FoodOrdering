// seedDb.js
import pg     from 'pg';
import fetch  from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

const ITEMS_PER_CATEGORY = 5;

async function seed() {
  console.log('⏳ Fetching categories…');
  const { categories } = await fetch(
    'https://www.themealdb.com/api/json/v1/1/categories.php'
  ).then(r => r.json());

  for (const cat of categories) {
    console.log(`\n📂 Category: ${cat.strCategory}`);
    // get up to N meals in this category
    const { meals } = await fetch(
      `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(cat.strCategory)}`
    ).then(r => r.json());
    const toSeed = meals.slice(0, ITEMS_PER_CATEGORY);

    for (const { idMeal } of toSeed) {
      try {
        const meal = (await fetch(
          `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${idMeal}`
        ).then(r => r.json())).meals[0];

        // build your ingredient strings
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
          const name = meal[`strIngredient${i}`]?.trim();
          const measure = meal[`strMeasure${i}`]?.trim();
          if (name) {
            ingredients.push(measure ? `${measure} ${name}` : name);
          }
        }

        const name     = meal.strMeal;
        const imageUrl = meal.strMealThumb;
        const price    = Math.floor(Math.random() * 51) + 100;
        const available = Math.random() < 0.8;

        // 1) insert menu_items
        const insertMenu = await pool.query(
          `INSERT INTO menu_items
             (name, price, category, image_url, available)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (name) DO NOTHING
           RETURNING id`,
          [name, price, cat.strCategory, imageUrl, available]
        );
        const menuItemId = insertMenu.rows[0]?.id
          || (await pool.query(
               `SELECT id FROM menu_items WHERE name = $1`,
               [name]
             )).rows[0].id;

        console.log(`  → "${name}" inserted as id=${menuItemId}`);

        // 2) for each ingredient: upsert + link
        for (const ingName of ingredients) {
          // upsert into ingredients
          const insIng = await pool.query(
            `INSERT INTO ingredients (name)
             VALUES ($1)
             ON CONFLICT (name) DO NOTHING
             RETURNING id`,
            [ingName]
          );
          const ingredientId = insIng.rows[0]?.id
            || (await pool.query(
                 `SELECT id FROM ingredients WHERE name = $1`,
                 [ingName]
               )).rows[0].id;

          // insert into join table
          await pool.query(
            `INSERT INTO menu_item_ingredients
               (menu_item_id, ingredient_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [menuItemId, ingredientId]
          );
        }
      } catch (err) {
        console.error(`  ✗ Error seeding meal ${idMeal}:`, err.message);
      }
    }
  }

  await pool.end();
  console.log('\n🎉 Seeding complete!');
}

seed().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
