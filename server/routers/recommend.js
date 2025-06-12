import { Router } from 'express';
import { query }    from '../database/connection.js';

const router   = Router();
const CHAT_URL = 'https://api.mistral.ai/v1/chat/completions';
const API_KEY  = process.env.MISTRALAI_API_KEY;

router.post('/', async (req, res) => {
  const { likedIngredients } = req.body;
  if (!Array.isArray(likedIngredients)) {
    return res
      .status(400)
      .json({ message: 'likedIngredients must be an array' });
  }

  try {
    const { rows: menuItems } = await query(`
      SELECT
        mi.id,
        mi.name,
        mi.image_url,
        mi.price,      -- <--- ADDED: Select the price
        mi.available,  -- <--- ADDED: Select the 'available' status
        COALESCE(
          json_agg(i.name) FILTER (WHERE i.id IS NOT NULL),
          '[]'
        ) AS ingredients
      FROM menu_items mi
      LEFT JOIN menu_item_ingredients mii
        ON mii.menu_item_id = mi.id
      LEFT JOIN ingredients i
        ON i.id = mii.ingredient_id
      WHERE mi.available = true
      GROUP BY mi.id, mi.name, mi.image_url, mi.price, mi.available -- <--- ADDED: Group by price and available
      ORDER BY mi.id
    `);

    const menuDetailsMap = new Map();
    menuItems.forEach(item => {
      menuDetailsMap.set(item.name, {
        id: item.id,
        image_url: item.image_url,
        price: item.price,        
        available: item.available 
      });
    });

    const menuText = menuItems
      .map(m => `- ${m.name} (${m.ingredients.join(', ')})`)
      .join('\n');

    const prompt = `
Here are the available dishes:
${menuText}

The customer likes: ${likedIngredients.join(', ')}.

Suggest up to 5 dishes from the above list, formatted as a JSON array:
[
  { "name": "...", "why": "..." },
  ...
]
    `.trim();

    const apiRes = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model:    'open-mixtral-8x7b',
        messages: [
          { role: 'system', content: 'You are a restaurant recommendation assistant.' },
          { role: 'user',   content: prompt }
        ],
        max_tokens: 500
      })
    });

    if (!apiRes.ok) {
      return res.status(502).json({ message: 'AI service error' });
    }

    const apiJson = await apiRes.json();

    const rawText = apiJson.choices[0].message?.content
      ?? apiJson.choices[0].content;

    if (typeof rawText !== 'string') {
      throw new Error('Unexpected AI response format');
    }

    const text = rawText.trim();
    let recommendations = JSON.parse(text);

    const finalRecommendations = recommendations.map(rec => {
        const details = menuDetailsMap.get(rec.name);
        if (details) {
            return {
                id: details.id,
                name: rec.name,
                why: rec.why,
                image_url: details.image_url,
                price: details.price,       
                available: details.available 
            };
        }
        return {
            id: null,
            name: rec.name,
            why: rec.why,
            image_url: null,
            price: null,        
            available: false    
        };
    });

    return res.send(finalRecommendations);

  } catch (err) {
    console.error('Recommendation failed:', err);
    return res.status(500).send({ message: 'Recommendation failed' });
  }
});

export default router;