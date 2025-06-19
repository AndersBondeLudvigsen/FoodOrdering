// server/routes/menuNutrition.js
import { Router } from 'express';

import { query } from '../database/connection.js';     
       
import { analyzeNutritionix } from '../utils/nutri.js';

const router = Router();


router.get( '/:id', async (req, res) => {
    const menuItemId = parseInt(req.params.id, 10);
    if (isNaN(menuItemId)) {
      return res.status(400).send({ error: 'Ugyldigt menu-item id' });
    }

    try {
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
        return res
          .status(404)
          .send({ error: 'Menu-item ikke fundet eller uden ingredienser' });
      }

      // rows[0].ingredients er et array af strenge: ["1kg Beef", "2 tbs Flour", …]
      const ingredientLines = rows[0].ingredients;

      //  Kalder Nutritionix-helper med ingredient-array
      const nutritionixData = await analyzeNutritionix(ingredientLines);

      //  Returnér Nutritionix-svar som JSON
      return res.send(nutritionixData);
    } catch (err) {
      console.error('Fejl i GET /menu/:id/nutrition:', err);
      return res
        .status(500)
        .send({ error: 'Server-fejl ved hentning af ernæringsdata' });
    }
  }
);

export default router;
