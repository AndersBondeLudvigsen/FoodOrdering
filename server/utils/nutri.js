// server/utils/nutrClient.js
import 'dotenv/config';

const APP_ID  = process.env.NUTRITIONIX_APP_ID;
const APP_KEY = process.env.NUTRITIONIX_APP_KEY;

if (!APP_ID || !APP_KEY) {
  console.error(
    'Manglende Nutritionix‐nøgle: Sæt NUTRITIONIX_APP_ID og NUTRITIONIX_APP_KEY i .env'
  );
  process.exit(1);
}


export async function analyzeNutritionix(ingredientLines) {
  const endpoint = 'https://trackapi.nutritionix.com/v2/natural/nutrients';

  // Sammensæt alle ingredienslinjer i én streng adskilt af newline
  const queryString = ingredientLines.join('\n');

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-id': APP_ID,
      'x-app-key': APP_KEY
    },
    body: JSON.stringify({ query: queryString })
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Nutritionix API fejl:', errText);
    throw new Error(`Nutritionix API returned status ${res.status}`);
  }

  return res.json();
}
