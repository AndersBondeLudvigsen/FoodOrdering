// server/routes/menuNutrition.js
import { Router } from 'express';
import { query } from '../database/connection.js';             // Din SQL-helper (PG Pool eller lignende)
import { analyzeNutritionix } from '../utils/nutri.js';

const router = Router();

/**
 * GET /api/menu/:id/nutrition
 * Auth: Kræver gyldig JWT (om nødvendigt)
 *
 * Returnerer Nutritionix-data for den menu_item med id = req.params.id.
 * Først hentes alle ingrediensnavne (array af strenge) fra DB, derefter kaldes analyzeNutritionix().
 */
router.get(
  '/menu/:id/nutrition', // Hvis du vil beskytte endpointet med token. Fjern linjen, hvis du vil have det offentligt.
  async (req, res) => {
    // 1) Parse menu_item_id
    const menuItemId = parseInt(req.params.id, 10);
    if (isNaN(menuItemId)) {
      return res.status(400).json({ error: 'Ugyldigt menu-item id' });
    }

    try {
      // 2) Hent ingrediens-navne fra DB til præcis dette menu_item_id
      //    (Returnerer én række med et JSON-array 'ingredients')
      const { rows } = await query(
        `
        SELECT
          COALESCE(
            json_agg(i.name) FILTER (WHERE i.id IS NOT NULL),
            '[]'
          ) AS ingredients
        FROM ingredients i
        JOIN menu_item_ingredients mii
          ON mii.ingredient_id = i.id
        WHERE mii.menu_item_id = $1
        GROUP BY mii.menu_item_id
        `,
        [menuItemId]
      );

      if (!rows.length) {
        // Enten findes item ikke, eller der er ingen ingredienser
        return res
          .status(404)
          .json({ error: 'Menu-item ikke fundet eller uden ingredienser' });
      }

      // rows[0].ingredients er et array af strenge: ["1kg Beef", "2 tbs Flour", …]
      const ingredientLines = rows[0].ingredients;

      // 3) Kalder Nutritionix-helper med ingredient-array
      const nutritionixData = await analyzeNutritionix(ingredientLines);

      // 4) Returnér Nutritionix-svar som JSON
      return res.json(nutritionixData);
    } catch (err) {
      console.error('Fejl i GET /menu/:id/nutrition:', err);
      return res
        .status(500)
        .json({ error: 'Server-fejl ved hentning af ernæringsdata' });
    }
  }
);

export default router;
