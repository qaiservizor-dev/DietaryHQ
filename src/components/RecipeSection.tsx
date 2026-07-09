/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Recipe, UserProfile, FoodItem, MealType } from "../types";
import { BookOpen, Sparkles, Clock, Flame, Check, Plus, Heart, HelpCircle, Loader2, Search, Trash2, ChevronRight, PlusCircle, ShoppingBag } from "lucide-react";

interface RecipeSectionProps {
  profile: UserProfile;
  onAddCustomRecipe: (recipe: Recipe) => void;
  onAddMealLog?: (mealType: MealType, food: FoodItem, servings: number) => void;
}

interface SelectedIngredient {
  food: FoodItem;
  servings: number;
}

export default function RecipeSection({ profile, onAddCustomRecipe, onAddMealLog }: RecipeSectionProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  
  // Custom manual/composite recipe form
  const [showManualForm, setShowManualForm] = useState(false);
  const [recipeName, setRecipeName] = useState("");
  const [cookingTime, setCookingTime] = useState<number>(15);
  const [servingsCount, setServingsCount] = useState<number>(1);
  const [manualInstructions, setManualInstructions] = useState("");
  
  // Composite food combination database lookup
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [searchFoodResults, setSearchFoodResults] = useState<FoodItem[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
  const [searchingFoods, setSearchingFoods] = useState(false);

  // AI Recipe Generator state
  const [targetIngredients, setTargetIngredients] = useState("");
  const [dietType, setDietType] = useState(profile.dietPreference);
  const [maxTime, setMaxTime] = useState<number>(30);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // Quick UI feedback for meal logging
  const [loggedStatus, setLoggedStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const res = await fetch("/api/recipes");
      const data = await res.json();
      setRecipes(data);
    } catch (err) {
      console.error("Error fetching recipes:", err);
    }
  };

  // Debounced ingredient food search
  useEffect(() => {
    if (!ingredientSearch.trim()) {
      setSearchFoodResults([]);
      return;
    }
    const searchFoods = async () => {
      setSearchingFoods(true);
      try {
        const res = await fetch(`/api/foods/search?q=${encodeURIComponent(ingredientSearch)}`);
        const data = await res.json();
        setSearchFoodResults(data);
      } catch (err) {
        console.error("Error searching composite foods:", err);
      } finally {
        setSearchingFoods(false);
      }
    };

    const timer = setTimeout(searchFoods, 250);
    return () => clearTimeout(timer);
  }, [ingredientSearch]);

  const handleToggleFavorite = async (recipeId: string) => {
    try {
      const res = await fetch(`/api/recipes/${recipeId}/favorite`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setRecipes(prev => prev.map(rec => {
          if (rec.id === recipeId) {
            return { ...rec, isFavorite: data.isFavorite };
          }
          return rec;
        }));
        if (selectedRecipe?.id === recipeId) {
          setSelectedRecipe(prev => prev ? { ...prev, isFavorite: data.isFavorite } : null);
        }
      }
    } catch (err) {
      console.error("Failed to toggle recipe favorite status:", err);
      // Fallback
      setRecipes(prev => prev.map(rec => {
        if (rec.id === recipeId) {
          return { ...rec, isFavorite: !rec.isFavorite };
        }
        return rec;
      }));
    }
  };

  // Live Auto-Calculation of Composite Recipe macros
  const calculatedTotals = selectedIngredients.reduce(
    (acc, item) => {
      const scale = item.servings;
      acc.calories += Math.round((item.food.calories || 0) * scale);
      acc.protein += Number(((item.food.protein || 0) * scale).toFixed(1));
      acc.carbs += Number(((item.food.carbs || 0) * scale).toFixed(1));
      acc.fat += Number(((item.food.fat || 0) * scale).toFixed(1));
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const calculatedPerServing = {
    calories: Math.round(calculatedTotals.calories / (servingsCount || 1)),
    protein: Number((calculatedTotals.protein / (servingsCount || 1)).toFixed(1)),
    carbs: Number((calculatedTotals.carbs / (servingsCount || 1)).toFixed(1)),
    fat: Number((calculatedTotals.fat / (servingsCount || 1)).toFixed(1)),
  };

  const handleAddIngredient = (food: FoodItem) => {
    setSelectedIngredients(prev => {
      const existingIdx = prev.findIndex(item => item.food.id === food.id);
      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].servings += 1;
        return copy;
      }
      return [...prev, { food, servings: 1 }];
    });
    setIngredientSearch("");
    setSearchFoodResults([]);
  };

  const handleUpdateIngredientServings = (foodId: string, val: number) => {
    setSelectedIngredients(prev => 
      prev.map(item => {
        if (item.food.id === foodId) {
          const newServ = Math.max(0.1, Number((item.servings + val).toFixed(1)));
          return { ...item, servings: newServ };
        }
        return item;
      })
    );
  };

  const handleRemoveIngredient = (foodId: string) => {
    setSelectedIngredients(prev => prev.filter(item => item.food.id !== foodId));
  };

  const handleCustomRecipeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeName || selectedIngredients.length === 0) return;

    const ingredientStrings = selectedIngredients.map(
      item => `${item.servings}x serving(s) of ${item.food.name} (${item.food.servingSize})`
    );

    const steps = manualInstructions
      ? manualInstructions.split("\n").map(s => s.trim()).filter(Boolean)
      : ["Mix all ingredients together.", "Heat in a pan or serve chilled.", "Enjoy!"];

    const newRecipe: Recipe = {
      id: `recipe_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
      name: recipeName,
      calories: calculatedPerServing.calories,
      protein: calculatedPerServing.protein,
      carbs: calculatedPerServing.carbs,
      fat: calculatedPerServing.fat,
      cookingTime: Number(cookingTime || 15),
      difficulty: "Easy",
      servings: servingsCount || 1,
      ingredients: ingredientStrings,
      instructions: steps,
      image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&auto=format&fit=crop&q=80",
    };

    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecipe),
      });
      if (res.ok) {
        const saved = await res.json();
        onAddCustomRecipe(saved);
        setRecipes(prev => [saved, ...prev]);
        setSelectedRecipe(saved);
        setShowManualForm(false);
        // Reset
        setRecipeName("");
        setCookingTime(15);
        setServingsCount(1);
        setSelectedIngredients([]);
        setManualInstructions("");
      }
    } catch (err) {
      console.error("Failed to save custom recipe to backend:", err);
      // Fallback
      onAddCustomRecipe(newRecipe);
      setRecipes(prev => [newRecipe, ...prev]);
      setSelectedRecipe(newRecipe);
      setShowManualForm(false);
    }
  };

  // One-Tap Meal Logging Handler
  const handleLogRecipeToMeal = (mealType: MealType) => {
    if (!selectedRecipe || !onAddMealLog) return;

    // Convert Recipe to logged food item representation
    const foodItemRepresentation: FoodItem = {
      id: `recipe_food_${selectedRecipe.id}_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
      name: `[Recipe] ${selectedRecipe.name}`,
      servingSize: "1 serving",
      calories: selectedRecipe.calories,
      protein: selectedRecipe.protein,
      carbs: selectedRecipe.carbs,
      fat: selectedRecipe.fat,
    };

    onAddMealLog(mealType, foodItemRepresentation, 1);
    setLoggedStatus(mealType);
    setTimeout(() => setLoggedStatus(null), 3000);
  };

  const generateAIRecipe = async () => {
    setAiLoading(true);
    setAiError("");
    try {
      const payload = {
        ingredients: targetIngredients.split(",").map(i => i.trim()).filter(Boolean),
        goal: profile.fitnessGoal,
        dietType,
        maxTime,
      };

      const res = await fetch("/api/ai/recipe-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("AI request failed");
      const recipe = await res.json();

      recipe.image = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80";
      recipe.id = `recipe_ai_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

      onAddCustomRecipe(recipe);
      setRecipes(prev => [recipe, ...prev]);
      setSelectedRecipe(recipe);
      setTargetIngredients("");
    } catch (err) {
      setAiError("Could not call AI generator. Connecting your Gemini key in Secrets Panel will unlock this feature.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-8" id="recipe-section">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 dark:border-gray-805 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-emerald-500" />
            Healthy Recipe Book
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Browse dietitian-approved templates or combine ingredients to auto-calculate macros per serving.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowManualForm(!showManualForm);
              setSelectedIngredients([]);
            }}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" /> Custom Recipe Builder
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: AI Generator & Saved List */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* AI Chef panel */}
          <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-6 shadow-lg space-y-4">
            <span className="bg-emerald-500/20 text-emerald-300 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
              Gemini AI Smart Chef
            </span>
            <div className="space-y-1">
              <h3 className="text-base font-black flex items-center gap-1 text-emerald-300">
                <Sparkles className="w-5 h-5 animate-pulse" /> Generate meal recipe
              </h3>
              <p className="text-xs text-emerald-100/70 leading-normal">
                Tell Gemini what ingredients you have in your pantry. It compiles healthy macros matching your diet style.
              </p>
            </div>

            <div className="space-y-3.5 pt-1">
              <div>
                <label className="block text-[10px] text-emerald-300/80 font-bold uppercase tracking-wider mb-1">Target Ingredients</label>
                <input
                  type="text"
                  placeholder="E.g., Chicken breast, spinach, eggs"
                  value={targetIngredients}
                  onChange={(e) => setTargetIngredients(e.target.value)}
                  className="w-full bg-white/10 border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-400 outline-none placeholder:text-white/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-emerald-300/80 font-bold uppercase tracking-wider mb-1">Diet Preference</label>
                  <select
                    value={dietType}
                    onChange={(e) => setDietType(e.target.value as any)}
                    className="w-full bg-white/10 border border-white/10 text-white rounded-xl px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="none" className="text-gray-900">Standard</option>
                    <option value="keto" className="text-gray-900">Keto</option>
                    <option value="vegan" className="text-gray-900">Vegan</option>
                    <option value="vegetarian" className="text-gray-900">Vegetarian</option>
                    <option value="low_carb" className="text-gray-900">Low Carb</option>
                    <option value="high_protein" className="text-gray-900">High Protein</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-emerald-300/80 font-bold uppercase tracking-wider mb-1">Max Cook Time</label>
                  <select
                    value={maxTime}
                    onChange={(e) => setMaxTime(Number(e.target.value))}
                    className="w-full bg-white/10 border border-white/10 text-white rounded-xl px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="15" className="text-gray-900">15 min</option>
                    <option value="30" className="text-gray-900">30 min</option>
                    <option value="45" className="text-gray-900">45 min</option>
                    <option value="60" className="text-gray-900">1 hour</option>
                  </select>
                </div>
              </div>

              {aiError && (
                <p className="text-[10px] text-amber-300 leading-normal">{aiError}</p>
              )}

              <button
                type="button"
                onClick={generateAIRecipe}
                disabled={aiLoading}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Cooking recipe...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> AI Generate Recipe
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Recipes scrollable list */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide border-b border-gray-50 dark:border-gray-800 pb-2">
              Available Recipes
            </h3>
            <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
              {recipes.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRecipe(rec)}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex gap-3 ${
                    selectedRecipe?.id === rec.id
                      ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 shadow-inner"
                      : "border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {rec.image && (
                    <img src={rec.image} alt={rec.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100 dark:bg-gray-800 shrink-0" referrerPolicy="no-referrer" />
                  )}
                  <div className="truncate flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-bold text-gray-800 dark:text-gray-200 text-xs truncate">{rec.name}</p>
                      {rec.isFavorite && <Heart className="w-3 h-3 text-rose-500 fill-current shrink-0" />}
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      {rec.cookingTime} mins • <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{rec.calories} kcal/serving</span>
                    </p>
                    <div className="flex gap-1.5 pt-0.5">
                      <span className="text-[8px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 px-1 py-0.2 rounded font-extrabold uppercase">P: {rec.protein}g</span>
                      <span className="text-[8px] bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 px-1 py-0.2 rounded font-extrabold uppercase">C: {rec.carbs}g</span>
                      <span className="text-[8px] bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-450 px-1 py-0.2 rounded font-extrabold uppercase">F: {rec.fat}g</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center / Right Column: Active manual builder or detailed recipe card view */}
        <div className="lg:col-span-2">
          
          {showManualForm ? (
            <form onSubmit={handleCustomRecipeSubmit} className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6 animate-fade-in text-left">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">Custom Recipe Builder</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Combine raw food ingredients to automatically synthesize nutrition targets and macro profiles per serving.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 block mb-1">Recipe Name</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., High-Protein Mediterranean Avocado Salad"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 block mb-1">Cooking Time (minutes)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={cookingTime}
                    onChange={(e) => setCookingTime(Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 block mb-1">Servings Count</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={servingsCount}
                    onChange={(e) => setServingsCount(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* SEARCH & ADD INGREDIENTS FROM DATABASE */}
              <div className="border-t border-gray-50 dark:border-gray-800 pt-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-wider">1. Search & Add Ingredients</h4>
                  <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-black uppercase">From System DB</span>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search database (e.g., egg, chicken, salmon, oats, milk)..."
                    value={ingredientSearch}
                    onChange={(e) => setIngredientSearch(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  
                  {/* Search results overlay */}
                  {searchFoodResults.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl z-50 max-h-[220px] overflow-y-auto">
                      {searchFoodResults.map((food) => (
                        <div
                          key={food.id}
                          onClick={() => handleAddIngredient(food)}
                          className="flex items-center justify-between p-3 border-b border-gray-50 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-all"
                        >
                          <div className="text-left">
                            <p className="font-extrabold text-xs text-gray-800 dark:text-white">{food.name}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">{food.servingSize} • {food.calories} kcal</p>
                          </div>
                          <PlusCircle className="w-5 h-5 text-emerald-500" />
                        </div>
                      ))}
                    </div>
                  )}

                  {searchingFoods && (
                    <div className="absolute right-3 top-3.5">
                      <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                    </div>
                  )}
                </div>

                {/* Selected Ingredients List */}
                <div className="space-y-2 mt-2">
                  {selectedIngredients.length === 0 ? (
                    <div className="p-5 border border-dashed border-gray-100 dark:border-gray-800 rounded-2xl text-center text-[11px] text-gray-400">
                      No ingredients added yet. Search and tap items above to stack ingredients!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[240px] overflow-y-auto">
                      {selectedIngredients.map((item) => (
                        <div key={item.food.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-850 rounded-2xl">
                          <div className="text-left flex-1 min-w-0 pr-3">
                            <p className="font-bold text-xs text-gray-800 dark:text-white truncate">{item.food.name}</p>
                            <p className="text-[10px] text-gray-450 dark:text-gray-550 truncate">
                              {item.food.servingSize} • {Math.round(item.food.calories * item.servings)} kcal
                            </p>
                          </div>
                          
                          {/* Quantity control */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateIngredientServings(item.food.id, -1)}
                              className="w-6 h-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 flex items-center justify-center font-bold text-xs"
                            >
                              -
                            </button>
                            <span className="font-extrabold text-xs text-gray-800 dark:text-white w-8 text-center">{item.servings}x</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateIngredientServings(item.food.id, 1)}
                              className="w-6 h-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 flex items-center justify-center font-bold text-xs"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveIngredient(item.food.id)}
                              className="text-rose-500 hover:text-rose-600 p-1 bg-rose-50 dark:bg-rose-950/20 rounded-lg ml-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* LIVE MACRO CALCULATOR STATS */}
              {selectedIngredients.length > 0 && (
                <div className="border-t border-gray-50 dark:border-gray-800 pt-5 space-y-3.5">
                  <h4 className="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-wider">2. Live Calculated Recipe Macros</h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-2xl">
                      <p className="text-[9px] uppercase font-bold text-emerald-800 dark:text-emerald-400">Calories / Serv</p>
                      <p className="text-base font-black text-emerald-600 dark:text-emerald-400">{calculatedPerServing.calories} kcal</p>
                      <p className="text-[8px] text-gray-400 dark:text-gray-500">Total: {calculatedTotals.calories} kcal</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-2xl">
                      <p className="text-[9px] uppercase font-bold text-emerald-800 dark:text-emerald-400">Protein / Serv</p>
                      <p className="text-base font-black text-gray-800 dark:text-gray-200">{calculatedPerServing.protein}g</p>
                      <p className="text-[8px] text-gray-400 dark:text-gray-500">Total: {calculatedTotals.protein}g</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-2xl">
                      <p className="text-[9px] uppercase font-bold text-emerald-800 dark:text-emerald-400">Carbs / Serv</p>
                      <p className="text-base font-black text-gray-800 dark:text-gray-200">{calculatedPerServing.carbs}g</p>
                      <p className="text-[8px] text-gray-400 dark:text-gray-500">Total: {calculatedTotals.carbs}g</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-2xl">
                      <p className="text-[9px] uppercase font-bold text-emerald-800 dark:text-emerald-400">Fat / Serv</p>
                      <p className="text-base font-black text-gray-800 dark:text-gray-200">{calculatedPerServing.fat}g</p>
                      <p className="text-[8px] text-gray-400 dark:text-gray-500">Total: {calculatedTotals.fat}g</p>
                    </div>
                  </div>
                </div>
              )}

              {/* RECIPE DIRECTIONS */}
              <div className="border-t border-gray-50 dark:border-gray-800 pt-5 space-y-3">
                <label className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 block">3. Cooking Instructions (one step per line)</label>
                <textarea
                  rows={3}
                  placeholder="E.g.&#10;1. Toss ingredients in a bowl.&#10;2. Mix in dressing.&#10;3. Plate and serve fresh."
                  value={manualInstructions}
                  onChange={(e) => setManualInstructions(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 text-xs font-bold pt-4 border-t border-gray-50 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="px-4 py-2 bg-gray-150 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedIngredients.length === 0}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl shadow cursor-pointer transition-all"
                >
                  Save Recipe
                </button>
              </div>
            </form>
          ) : selectedRecipe ? (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden text-left animate-fade-in">
              {selectedRecipe.image && (
                <div className="h-64 w-full overflow-hidden relative">
                  <img src={selectedRecipe.image} alt={selectedRecipe.name} className="w-full h-full object-cover bg-gray-100 dark:bg-gray-850" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent"></div>
                  <div className="absolute bottom-5 left-6 right-6 flex justify-between items-end text-white">
                    <div>
                      <span className="bg-emerald-500 text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full">
                        {selectedRecipe.difficulty || "Easy"}
                      </span>
                      <h2 className="text-2xl font-black mt-2 tracking-tight">{selectedRecipe.name}</h2>
                    </div>
                    <button
                      onClick={() => handleToggleFavorite(selectedRecipe.id)}
                      className={`p-2 rounded-xl backdrop-blur-md transition-all cursor-pointer ${
                        selectedRecipe.isFavorite
                          ? "bg-rose-500/80 text-white"
                          : "bg-white/25 hover:bg-white/40 text-white"
                      }`}
                    >
                      <Heart className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                </div>
              )}

              <div className="p-6 md:p-8 space-y-6">
                
                {/* ONE TAP MEAL LOGGING */}
                {onAddMealLog && (
                  <div className="p-5 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/60 dark:border-emerald-900/40 rounded-3xl space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400">
                        <ShoppingBag className="w-4 h-4 animate-bounce" />
                        <h4 className="font-extrabold text-xs uppercase tracking-wider">Log recipe to meal logs</h4>
                      </div>
                      <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-black">1 TAP LOGGING</span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Adds the exact macro allowance for 1 serving of this recipe directly to today's nutrition diaries.</p>
                    
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((meal) => (
                        <button
                          key={meal}
                          onClick={() => handleLogRecipeToMeal(meal)}
                          className="py-2 px-1 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-sm font-black text-[10px] uppercase text-gray-600 dark:text-gray-300 transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          {loggedStatus === meal ? (
                            <span className="text-emerald-500 flex items-center gap-0.5">
                              <Check className="w-3.5 h-3.5" /> Done
                            </span>
                          ) : (
                            meal
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-gray-105 dark:border-gray-800 pb-5 text-center">
                  <div className="bg-gray-50 dark:bg-gray-850 p-3 rounded-2xl">
                    <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Calories</p>
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{selectedRecipe.calories} kcal</p>
                    <p className="text-[9px] text-gray-400">Per Serving</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-850 p-3 rounded-2xl">
                    <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Protein</p>
                    <p className="text-lg font-black text-gray-800 dark:text-gray-200">{selectedRecipe.protein}g</p>
                    <p className="text-[9px] text-gray-400">Per Serving</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-850 p-3 rounded-2xl">
                    <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Carbs</p>
                    <p className="text-lg font-black text-gray-800 dark:text-gray-200">{selectedRecipe.carbs}g</p>
                    <p className="text-[9px] text-gray-400">Per Serving</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-850 p-3 rounded-2xl">
                    <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Time / Servs</p>
                    <p className="text-sm font-black text-gray-800 dark:text-gray-200 flex items-center justify-center gap-1 pt-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" /> {selectedRecipe.cookingTime}m • {selectedRecipe.servings || 1} serv(s)
                    </p>
                  </div>
                </div>

                {/* Ingredients & Steps split */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                  <div className="md:col-span-2 space-y-3.5 text-left">
                    <h4 className="font-extrabold text-xs text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 pb-1.5 uppercase tracking-wide">
                      Ingredients
                    </h4>
                    <ul className="space-y-2">
                      {selectedRecipe.ingredients.map((ing, idx) => (
                        <li key={idx} className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-2 leading-relaxed text-left">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{ing}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="md:col-span-3 space-y-3.5 text-left">
                    <h4 className="font-extrabold text-xs text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 pb-1.5 uppercase tracking-wide">
                      Cooking Steps
                    </h4>
                    <ol className="space-y-3">
                      {selectedRecipe.instructions.map((inst, idx) => (
                        <li key={idx} className="text-xs text-gray-600 dark:text-gray-300 flex gap-3 leading-relaxed items-start text-left">
                          <span className="w-5 h-5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-extrabold text-[10px] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="flex-1">{inst}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] border border-dashed border-gray-200 dark:border-gray-800 rounded-3xl flex flex-col justify-center items-center p-8 text-center bg-gray-50/50 dark:bg-gray-850/20">
              <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-2" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No Recipe Selected</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 max-w-[280px] mt-1 leading-relaxed">
                Choose a nutritious dietitian-approved recipe from the list on the left or tap Custom Recipe Builder to create your own!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
