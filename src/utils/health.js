// Keys match the server. Do not rename them.
export const DISEASES = [
  ['diabetes', 'Diabetes'],
  ['hypertension_bp', 'High blood pressure'],
  ['low_bp', 'Low blood pressure'],
  ['high_cholesterol', 'High cholesterol'],
  ['pcos', 'PCOS'],
  ['hypothyroidism', 'Hypothyroidism'],
  ['hyperthyroidism', 'Hyperthyroidism']
];
export const DISEASE_LABEL = Object.fromEntries(DISEASES);

// The same five goals in the Gym and Individual plans. Keys match the server.
export const GOALS = [
  ['weight_loss', 'Lose weight / lose body fat'],
  ['weight_gain', 'Gain weight / build muscle'],
  ['muscle_gain', 'Build muscle'],
  ['recomp', 'Lose fat / build muscle'],
  ['maintain', 'Maintain weight / stay fit']
];
export const GOAL_LABEL = Object.fromEntries(GOALS);
// Weight direction of each goal: lose, gain, or hold (stay about the same)
export const GOAL_DIRECTION = { weight_loss: 'lose', weight_gain: 'gain', muscle_gain: 'hold', recomp: 'hold', maintain: 'hold' };
// Vitamins, minerals and other factors a meal can carry. Keys match the server. A blank box is saved as NA.
export const NUTRIENT_GROUPS = {
  vitamins: [
    {
      key: 'vitaminA',
      label: 'Vitamin A',
      unit: 'mcg'
    },
    {
      key: 'vitaminB1',
      label: 'Vitamin B1 (thiamine)',
      unit: 'mg'
    },
    {
      key: 'vitaminB2',
      label: 'Vitamin B2 (riboflavin)',
      unit: 'mg'
    },
    {
      key: 'vitaminB3',
      label: 'Vitamin B3 (niacin)',
      unit: 'mg'
    },
    {
      key: 'vitaminB5',
      label: 'Vitamin B5 (pantothenic acid)',
      unit: 'mg'
    },
    {
      key: 'vitaminB6',
      label: 'Vitamin B6',
      unit: 'mg'
    },
    {
      key: 'vitaminB7',
      label: 'Vitamin B7 (biotin)',
      unit: 'mcg'
    },
    {
      key: 'vitaminB9',
      label: 'Vitamin B9 (folate)',
      unit: 'mcg'
    },
    {
      key: 'vitaminB12',
      label: 'Vitamin B12',
      unit: 'mcg'
    },
    {
      key: 'vitaminC',
      label: 'Vitamin C',
      unit: 'mg'
    },
    {
      key: 'vitaminD',
      label: 'Vitamin D',
      unit: 'mcg'
    },
    {
      key: 'vitaminE',
      label: 'Vitamin E',
      unit: 'mg'
    },
    {
      key: 'vitaminK',
      label: 'Vitamin K',
      unit: 'mcg'
    }
  ],
  minerals: [
    {
      key: 'sodium',
      label: 'Sodium',
      unit: 'mg'
    },
    {
      key: 'potassium',
      label: 'Potassium',
      unit: 'mg'
    },
    {
      key: 'calcium',
      label: 'Calcium',
      unit: 'mg'
    },
    {
      key: 'iron',
      label: 'Iron',
      unit: 'mg'
    },
    {
      key: 'magnesium',
      label: 'Magnesium',
      unit: 'mg'
    },
    {
      key: 'zinc',
      label: 'Zinc',
      unit: 'mg'
    },
    {
      key: 'phosphorus',
      label: 'Phosphorus',
      unit: 'mg'
    },
    {
      key: 'iodine',
      label: 'Iodine',
      unit: 'mcg'
    },
    {
      key: 'selenium',
      label: 'Selenium',
      unit: 'mcg'
    },
    {
      key: 'copper',
      label: 'Copper',
      unit: 'mg'
    },
    {
      key: 'manganese',
      label: 'Manganese',
      unit: 'mg'
    },
    {
      key: 'chromium',
      label: 'Chromium',
      unit: 'mcg'
    },
    {
      key: 'molybdenum',
      label: 'Molybdenum',
      unit: 'mcg'
    },
    {
      key: 'chloride',
      label: 'Chloride',
      unit: 'mg'
    }
  ],
  additional: [
    {
      key: 'addedSugar',
      label: 'Added sugar',
      unit: 'g'
    },
    {
      key: 'totalSugar',
      label: 'Total sugar',
      unit: 'g'
    },
    {
      key: 'saturatedFat',
      label: 'Saturated fat',
      unit: 'g'
    },
    {
      key: 'transFat',
      label: 'Trans fat',
      unit: 'g'
    },
    {
      key: 'cholesterol',
      label: 'Cholesterol',
      unit: 'mg'
    },
    {
      key: 'ala',
      label: 'Omega-3 (ALA)',
      unit: 'g'
    },
    {
      key: 'linoleicAcid',
      label: 'Omega-6 (linoleic acid)',
      unit: 'g'
    },
    {
      key: 'purines',
      label: 'Purines',
      unit: 'mg'
    },
    {
      key: 'choline',
      label: 'Choline',
      unit: 'mg'
    },
    {
      key: 'caffeine',
      label: 'Caffeine',
      unit: 'mg'
    },
    {
      key: 'oxalates',
      label: 'Oxalates',
      unit: 'mg'
    }
  ]
};
export const NUTRIENT_GROUP_TITLES = { vitamins: 'Vitamins', minerals: 'Minerals', additional: 'Other nutritional factors' };

// A person has only one of each pair: blood pressure is high or low, thyroid is under or over active.
export const EXCLUSIVE_GROUPS = [['hypertension_bp', 'low_bp'], ['hypothyroidism', 'hyperthyroidism']];
// Ticking one condition unticks its partner
export function toggleCondition(list, key) {
  if (list.includes(key)) return list.filter((x) => x !== key);
  const partner = EXCLUSIVE_GROUPS.find((g) => g.includes(key))?.find((k) => k !== key);
  return [...list.filter((x) => x !== partner), key];
}
