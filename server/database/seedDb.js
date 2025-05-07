// fill_db.js
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

async function ensureSchema() {
  // Unique constraint & image_url column if missing
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname='menu_items_name_unique'
      ) THEN
        ALTER TABLE menu_items
          ADD CONSTRAINT menu_items_name_unique UNIQUE(name);
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='menu_items' AND column_name='image_url'
      ) THEN
        ALTER TABLE menu_items ADD COLUMN image_url TEXT;
      END IF;
    END$$;
  `);
}

async function seed() {
  console.log('⏳ Ensuring schema…');
  await ensureSchema();

  console.log('⏳ Fetching categories…');
  const respCat = await fetch('https://www.themealdb.com/api/json/v1/1/categories.php');
  const { categories } = await respCat.json();

  for (const cat of categories) {
    const categoryName = cat.strCategory;
    console.log(`\n📂 Category: ${categoryName}`);

    // 1) Get meal list
    const respList = await fetch(
      `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(categoryName)}`
    );
    const { meals } = await respList.json();
    const toSeed = meals.slice(0, ITEMS_PER_CATEGORY);

    for (const m of toSeed) {
      try {
        // 2) Fetch full meal detail
        const detailJson = await fetch(
          `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${m.idMeal}`
        ).then(r => r.json());
        const meal = detailJson.meals[0];

        // 3) Build ingredients array
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
          const ing     = meal[`strIngredient${i}`]?.trim();
          const measure = meal[`strMeasure${i}`]?.trim();
          if (ing) ingredients.push(measure ? `${measure} ${ing}` : ing);
        }

        // 4) Gather values
        const name     = meal.strMeal;
        const imageUrl = meal.strMealThumb;                 // new
        const priceDKK = Math.floor(Math.random() * 51) + 100;
        const inStock  = Math.random() < 0.8;

        // 5) Insert
        const res = await pool.query(
          `INSERT INTO menu_items
             (name, ingredients, price, category, available, image_url)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (name) DO NOTHING
           RETURNING id;`,
          [name, ingredients, priceDKK, categoryName, inStock, imageUrl]
        );

        if (res.rowCount) {
          console.log(`  → Inserted "${name}" (id=${res.rows[0].id})`);
        } else {
          console.log(`  → Skipped "${name}" (exists)`);
        }
      } catch (err) {
        console.error(`  ✗ Error seeding ${m.idMeal}:`, err.message);
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
