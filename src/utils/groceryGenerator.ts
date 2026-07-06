/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GroceryItem } from "../types";

export function parseIngredient(ingStr: string) {
  let str = ingStr.trim();
  
  // Clean up bullets or prefixes
  str = str.replace(/^-\s*/, "");
  
  let qty = 1;
  let hasQty = false;
  
  // Match fractions like 1/2, 1/4, 3/4
  const fracMatch = str.match(/^(\d+)\/(\d+)\s*/);
  const mixedFracMatch = str.match(/^(\d+)\s+(\d+)\/(\d+)\s*/);
  const decimalMatch = str.match(/^(\d+(\.\d+)?)\s*/);
  
  if (mixedFracMatch) {
    qty = parseFloat(mixedFracMatch[1]) + parseFloat(mixedFracMatch[2]) / parseFloat(mixedFracMatch[3]);
    str = str.slice(mixedFracMatch[0].length);
    hasQty = true;
  } else if (fracMatch) {
    qty = parseFloat(fracMatch[1]) / parseFloat(fracMatch[2]);
    str = str.slice(fracMatch[0].length);
    hasQty = true;
  } else if (decimalMatch) {
    qty = parseFloat(decimalMatch[1]);
    str = str.slice(decimalMatch[0].length);
    hasQty = true;
  }
  
  // Standard units
  const units = ["g", "kg", "ml", "l", "cup", "cups", "tbsp", "tsp", "slice", "slices", "can", "cans", "oz", "pint", "pints", "bag", "bags", "tub", "tubs", "scoop", "scoops", "medium", "large", "small", "piece", "pieces", "item", "items", "bunch", "bunches", "head", "heads", "pack", "packs"];
  
  let unit = "item(s)";
  
  const words = str.split(/\s+/);
  if (words.length > 0) {
    const potentialUnit = words[0].toLowerCase().replace(/s$/, ""); // singularize
    const foundUnit = units.find(u => u === words[0].toLowerCase() || u === potentialUnit);
    if (foundUnit) {
      unit = words[0];
      str = words.slice(1).join(" ");
    }
  }
  
  return {
    qty: hasQty ? qty : 1,
    unit: hasQty ? unit : "item(s)",
    name: str.trim()
  };
}

export function getIngredientCategory(name: string): GroceryItem["category"] {
  const lower = name.toLowerCase();
  
  if (
    lower.includes("chicken") || 
    lower.includes("salmon") || 
    lower.includes("steak") || 
    lower.includes("beef") || 
    lower.includes("sirloin") || 
    lower.includes("tuna") || 
    lower.includes("turkey") || 
    lower.includes("tofu") || 
    lower.includes("pork") || 
    lower.includes("shrimp") || 
    lower.includes("fish") || 
    lower.includes("ham") || 
    lower.includes("bacon") || 
    lower.includes("sausage") || 
    lower.includes("lamb") || 
    lower.includes("egg") || 
    lower.includes("protein")
  ) {
    return "Proteins";
  }
  
  if (
    lower.includes("avocado") || 
    lower.includes("spinach") || 
    lower.includes("broccoli") || 
    lower.includes("potato") || 
    lower.includes("sweet potato") || 
    lower.includes("blueberry") || 
    lower.includes("blueberries") || 
    lower.includes("banana") || 
    lower.includes("apple") || 
    lower.includes("lemon") || 
    lower.includes("lime") || 
    lower.includes("asparagus") || 
    lower.includes("garlic") || 
    lower.includes("onion") || 
    lower.includes("tomato") || 
    lower.includes("lettuce") || 
    lower.includes("cucumber") || 
    lower.includes("carrot") || 
    lower.includes("berry") || 
    lower.includes("berries") || 
    lower.includes("salad") || 
    lower.includes("pepper") || 
    lower.includes("cabbage") || 
    lower.includes("kale") ||
    lower.includes("greens")
  ) {
    return "Produce";
  }
  
  if (
    lower.includes("yogurt") || 
    lower.includes("milk") || 
    lower.includes("cheese") || 
    lower.includes("butter") || 
    lower.includes("cream")
  ) {
    return "Dairy";
  }
  
  if (
    lower.includes("oat") || 
    lower.includes("rice") || 
    lower.includes("quinoa") || 
    lower.includes("bread") || 
    lower.includes("toast") || 
    lower.includes("sourdough") || 
    lower.includes("flour") || 
    lower.includes("pasta") || 
    lower.includes("noodle") || 
    lower.includes("cereal") ||
    lower.includes("wheat")
  ) {
    return "Grains";
  }
  
  if (
    lower.includes("frozen") || 
    lower.includes("ice cream") || 
    lower.includes("pod")
  ) {
    return "Frozen";
  }
  
  if (
    lower.includes("salt") || 
    lower.includes("pepper") || 
    lower.includes("cinnamon") || 
    lower.includes("oregano") || 
    lower.includes("parsley") || 
    lower.includes("garlic powder") || 
    lower.includes("spice") || 
    lower.includes("seasoning") || 
    lower.includes("paprika") || 
    lower.includes("curry") || 
    lower.includes("ginger") || 
    lower.includes("vanilla")
  ) {
    return "Spices";
  }
  
  if (
    lower.includes("water") || 
    lower.includes("coffee") || 
    lower.includes("tea") || 
    lower.includes("juice") || 
    lower.includes("soda") || 
    lower.includes("beverage")
  ) {
    return "Beverages";
  }
  
  return "Pantry";
}

export function decomposeMealToIngredients(mealName: string): string[] {
  const lower = mealName.toLowerCase();

  // Match standard exact seed meals first
  if (lower.includes("rolled oats with greek yogurt")) {
    return ["1/2 cup Rolled Oats", "1 cup Greek Yogurt 0%", "1/2 cup Blueberries"];
  }
  if (lower.includes("seared atlantic salmon")) {
    return ["100g Atlantic Salmon", "1 medium Sweet Potato"];
  }
  if (lower.includes("grilled chicken breast with white rice")) {
    return ["100g Chicken Breast", "1 cup White Rice", "1 cup Broccoli"];
  }
  if (lower.includes("scrambled eggs with avocado")) {
    return ["2 Whole Eggs", "1/2 Avocado", "1 slice Whole Wheat Bread"];
  }
  if (lower.includes("canned tuna salad")) {
    return ["1 can Canned Tuna in Water", "2 cups Spinach Fresh", "1 tbsp Extra Virgin Olive Oil"];
  }
  if (lower.includes("lean ground turkey")) {
    return ["100g Lean Ground Turkey 93%", "1 cup Brown Rice cooked"];
  }
  if (lower.includes("whey protein isolate shake")) {
    return ["1 scoop Whey Protein Isolate", "1 Banana"];
  }
  if (lower.includes("tofu stir fry")) {
    return ["100g Tofu Firm", "1 cup White Rice"];
  }
  if (lower.includes("beef sirloin steak")) {
    return ["100g Beef Sirloin Steak", "5 Asparagus spears"];
  }
  if (lower.includes("hearty avocado toast")) {
    return ["1 slice Whole Wheat Bread", "1/2 Avocado", "2 Whole Eggs"];
  }
  if (lower.includes("crispy grilled chicken")) {
    return ["150g Chicken Breast", "1 medium Sweet Potato", "1 tbsp Extra Virgin Olive Oil"];
  }
  if (lower.includes("blueberry greek yogurt parfait")) {
    return ["1 cup Greek Yogurt 0%", "1/2 cup Blueberries", "1 tbsp Chia Seeds", "2 tbsp Rolled Oats"];
  }

  // Keyword matching fallback for custom meals
  const ingredients: string[] = [];
  if (lower.includes("chicken")) ingredients.push("150g Chicken Breast");
  if (lower.includes("salmon")) ingredients.push("150g Atlantic Salmon");
  if (lower.includes("steak") || lower.includes("beef") || lower.includes("sirloin")) ingredients.push("150g Beef Sirloin Steak");
  if (lower.includes("turkey")) ingredients.push("150g Lean Ground Turkey 93%");
  if (lower.includes("egg")) ingredients.push("2 Whole Eggs");
  if (lower.includes("tuna")) ingredients.push("1 can Canned Tuna in Water");
  if (lower.includes("tofu")) ingredients.push("100g Tofu Firm");
  if (lower.includes("lentil")) ingredients.push("1 cup Lentils cooked");
  if (lower.includes("white rice") || lower.includes("jasmine rice")) ingredients.push("1 cup White Rice");
  else if (lower.includes("rice")) ingredients.push("1 cup Brown Rice cooked");
  if (lower.includes("quinoa")) ingredients.push("1 cup Quinoa cooked");
  if (lower.includes("oat")) ingredients.push("1/2 cup Rolled Oats");
  if (lower.includes("bread") || lower.includes("toast") || lower.includes("sourdough")) ingredients.push("2 slices Whole Wheat Bread");
  if (lower.includes("avocado")) ingredients.push("1/2 Avocado");
  if (lower.includes("spinach")) ingredients.push("1 bag Spinach Fresh");
  if (lower.includes("broccoli")) ingredients.push("1 head Broccoli");
  if (lower.includes("sweet potato")) ingredients.push("1 medium Sweet Potato");
  if (lower.includes("banana")) ingredients.push("1 Banana");
  if (lower.includes("apple")) ingredients.push("1 Apple");
  if (lower.includes("blueberry") || lower.includes("blueberries")) ingredients.push("1 cup Blueberries");
  if (lower.includes("yogurt")) ingredients.push("1 cup Greek Yogurt 0%");
  if (lower.includes("olive oil")) ingredients.push("1 tbsp Extra Virgin Olive Oil");
  if (lower.includes("chia")) ingredients.push("1 tbsp Chia Seeds");
  if (lower.includes("peanut butter")) ingredients.push("2 tbsp Peanut Butter");
  if (lower.includes("almond")) ingredients.push("1 oz Almonds");
  if (lower.includes("milk")) ingredients.push("1 cup Skim Milk 0%");
  if (lower.includes("cottage cheese")) ingredients.push("1/2 cup Cottage Cheese 2%");

  if (ingredients.length === 0) {
    ingredients.push(`1 items ${mealName}`);
  }

  return ingredients;
}

export function mergeIngredients(ingredientStrings: string[]): GroceryItem[] {
  const merged: Record<string, { qty: number; unit: string; category: GroceryItem["category"] }> = {};

  ingredientStrings.forEach(ingStr => {
    const { qty, unit, name } = parseIngredient(ingStr);
    const category = getIngredientCategory(name);
    const key = name.trim().toLowerCase();
    
    if (merged[key]) {
      if (merged[key].unit.toLowerCase() === unit.toLowerCase()) {
        merged[key].qty += qty;
      } else {
        // Different units fallback: use the first unit, sum numeric values anyway
        merged[key].qty += qty;
      }
    } else {
      merged[key] = { qty, unit, category };
    }
  });

  return Object.entries(merged).map(([key, value]) => {
    const displayName = key.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    
    let amountStr = "";
    if (value.qty > 0) {
      const roundedQty = Math.round(value.qty * 100) / 100;
      amountStr = `${roundedQty} ${value.unit}`;
    }

    return {
      id: `g_gen_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: displayName,
      category: value.category,
      checked: false,
      amount: amountStr || undefined
    };
  });
}
