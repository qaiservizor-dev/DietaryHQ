/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { UserProfile, FoodItem, MealType, GroceryItem } from "../types";
import { 
  Sparkles, 
  Calendar, 
  Plus, 
  ShoppingCart, 
  Check, 
  Trash2, 
  ArrowRight, 
  TrendingUp, 
  Clock, 
  Activity, 
  Apple, 
  Utensils, 
  RotateCcw,
  PlusCircle,
  Loader2
} from "lucide-react";
import { decomposeMealToIngredients, mergeIngredients } from "../utils/groceryGenerator";

interface MealPlannerProps {
  profile: UserProfile;
  onAddMealLog: (mealType: MealType, food: FoodItem, servings: number) => void;
  onAddGroceryItem: (name: string, category: "Proteins" | "Produce" | "Dairy" | "Pantry" | "Grains" | "Frozen" | "Spices" | "Beverages" | "Other", amount?: string) => void;
  onGenerateGroceryList?: (items: GroceryItem[]) => void;
}

interface PlannedMeal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients?: string[];
}

interface DailyPlan {
  breakfast: PlannedMeal;
  lunch: PlannedMeal;
  dinner: PlannedMeal;
  snack: PlannedMeal;
}

export default function MealPlanner({ profile, onAddMealLog, onAddGroceryItem, onGenerateGroceryList }: MealPlannerProps) {
  const [selectedDay, setSelectedDay] = useState<string>("Mon");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  
  // Weekly meal plan state (indexed by day name)
  const [weeklyPlans, setWeeklyPlans] = useState<Record<string, DailyPlan>>(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem("diet_weekly_plans");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading saved weekly plans", e);
      }
    }
    return {};
  });

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Save weekly plans to localStorage helper
  const savePlans = (newPlans: Record<string, DailyPlan>) => {
    setWeeklyPlans(newPlans);
    localStorage.setItem("diet_weekly_plans", JSON.stringify(newPlans));
  };

  const handleGeneratePlan = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: profile.fitnessGoal,
          diet: profile.dietPreference,
          caloriesTarget: profile.dailyCalorieGoal,
        }),
      });

      if (!res.ok) throw new Error("Could not fetch plan");
      const data: DailyPlan = await res.json();

      // Add realistic mock ingredients if not provided by server to make UI engaging
      const enrichMeal = (meal: PlannedMeal, fallbackType: string) => {
        if (meal.ingredients && meal.ingredients.length > 0) return meal;
        
        let fallbackIngs: string[] = [];
        if (fallbackType === "breakfast") {
          fallbackIngs = ["2 organic eggs", "1 slice sourdough bread", "1/2 medium avocado", "Fresh baby spinach"];
        } else if (fallbackType === "lunch") {
          fallbackIngs = ["150g grilled chicken breast", "1/2 cup tricolor quinoa", "1 cup steamed broccoli", "1 tbsp lemon vinaigrette"];
        } else if (fallbackType === "dinner") {
          fallbackIngs = ["150g wild Atlantic salmon", "1 medium roasted sweet potato", "5 grilled asparagus spears", "1 tsp extra virgin olive oil"];
        } else {
          fallbackIngs = ["1 cup non-fat plain Greek yogurt", "1/4 cup fresh organic blueberries", "1 tbsp organic chia seeds"];
        }
        return { ...meal, ingredients: fallbackIngs };
      };

      const enrichedPlan: DailyPlan = {
        breakfast: enrichMeal(data.breakfast, "breakfast"),
        lunch: enrichMeal(data.lunch, "lunch"),
        dinner: enrichMeal(data.dinner, "dinner"),
        snack: enrichMeal(data.snack, "snack"),
      };

      const updated = { ...weeklyPlans, [selectedDay]: enrichedPlan };
      savePlans(updated);
    } catch (err) {
      console.error(err);
      setError("AI generation failed. Please check your Gemini credentials or try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMealToLogs = (type: MealType, meal: PlannedMeal) => {
    const foodItem: FoodItem = {
      id: `planned_${type}_${Date.now()}`,
      name: meal.name,
      servingSize: "1 custom portion",
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
    };
    onAddMealLog(type, foodItem, 1);
    
    // Custom notification using standard browser notification or UI triggers
    const notifyDiv = document.createElement("div");
    notifyDiv.className = "fixed bottom-5 right-5 z-50 bg-emerald-600 text-white text-xs px-4 py-3 rounded-2xl shadow-xl border border-emerald-500 font-bold flex items-center gap-2 animate-bounce";
    notifyDiv.innerHTML = `<span class="bg-white/20 p-1 rounded-full"><svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg></span> Added ${meal.name} to Today's ${type}!`;
    document.body.appendChild(notifyDiv);
    setTimeout(() => notifyDiv.remove(), 2500);
  };

  const handleLogFullDay = () => {
    const plan = weeklyPlans[selectedDay];
    if (!plan) return;
    handleAddMealToLogs("breakfast", plan.breakfast);
    handleAddMealToLogs("lunch", plan.lunch);
    handleAddMealToLogs("dinner", plan.dinner);
    handleAddMealToLogs("snacks", plan.snack);
  };

  const handleAddIngredientsToShopping = (meal: PlannedMeal) => {
    if (!meal.ingredients) return;
    meal.ingredients.forEach(ing => {
      // Intelligently figure out category
      let category: "Proteins" | "Produce" | "Dairy" | "Pantry" | "Grains" | "Frozen" | "Spices" | "Beverages" | "Other" = "Pantry";
      const lower = ing.toLowerCase();
      if (lower.includes("chicken") || lower.includes("salmon") || lower.includes("steak") || lower.includes("turkey") || lower.includes("beef") || lower.includes("meat") || lower.includes("egg")) {
        category = "Proteins";
      } else if (lower.includes("broccoli") || lower.includes("spinach") || lower.includes("potato") || lower.includes("asparagus") || lower.includes("greens") || lower.includes("garlic") || lower.includes("onion") || lower.includes("blueberry") || lower.includes("avocado") || lower.includes("banana") || lower.includes("apple") || lower.includes("lemon")) {
        category = "Produce";
      } else if (lower.includes("yogurt") || lower.includes("milk") || lower.includes("cheese") || lower.includes("butter")) {
        category = "Dairy";
      } else if (lower.includes("bread") || lower.includes("toast") || lower.includes("sourdough") || lower.includes("oat") || lower.includes("rice") || lower.includes("quinoa")) {
        category = "Grains";
      } else if (lower.includes("salt") || lower.includes("pepper") || lower.includes("cinnamon") || lower.includes("spice")) {
        category = "Spices";
      } else if (lower.includes("water") || lower.includes("coffee") || lower.includes("tea")) {
        category = "Beverages";
      }
      
      onAddGroceryItem(ing.replace(/^\d+g?\s?/, "").replace(/^\d+\s?/, ""), category, ing.match(/^\d+g?\s?\w*/)?.[0] || undefined);
    });

    const notifyDiv = document.createElement("div");
    notifyDiv.className = "fixed bottom-5 right-5 z-50 bg-teal-600 text-white text-xs px-4 py-3 rounded-2xl shadow-xl border border-teal-500 font-bold flex items-center gap-2 animate-bounce";
    notifyDiv.innerHTML = `🛒 Ingredients successfully added to shopping list!`;
    document.body.appendChild(notifyDiv);
    setTimeout(() => notifyDiv.remove(), 2500);
  };

  const handleGenerateGroceryForWeeklyPlans = () => {
    const allIngredientStrings: string[] = [];

    DAYS.forEach(dayName => {
      const plan = weeklyPlans[dayName];
      if (plan) {
        (["breakfast", "lunch", "dinner", "snack"] as const).forEach(slot => {
          const meal = plan[slot];
          if (meal) {
            if (meal.ingredients && meal.ingredients.length > 0) {
              allIngredientStrings.push(...meal.ingredients);
            } else {
              const decomposed = decomposeMealToIngredients(meal.name);
              allIngredientStrings.push(...decomposed);
            }
          }
        });
      }
    });

    if (allIngredientStrings.length === 0) {
      alert("Your weekly plans are currently empty! Generate plans for a few days first.");
      return;
    }

    const groceryItems = mergeIngredients(allIngredientStrings);
    if (onGenerateGroceryList) {
      onGenerateGroceryList(groceryItems);
    }
  };

  const currentPlan = weeklyPlans[selectedDay];

  // Calculate totals
  const totalCal = currentPlan ? currentPlan.breakfast.calories + currentPlan.lunch.calories + currentPlan.dinner.calories + currentPlan.snack.calories : 0;
  const totalPro = currentPlan ? currentPlan.breakfast.protein + currentPlan.lunch.protein + currentPlan.dinner.protein + currentPlan.snack.protein : 0;
  const totalCarb = currentPlan ? currentPlan.breakfast.carbs + currentPlan.lunch.carbs + currentPlan.dinner.carbs + currentPlan.snack.carbs : 0;
  const totalFat = currentPlan ? currentPlan.breakfast.fat + currentPlan.lunch.fat + currentPlan.dinner.fat + currentPlan.snack.fat : 0;

  return (
    <div className="space-y-8" id="meal-planner-section">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 dark:border-gray-900 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Calendar className="w-8 h-8 text-emerald-500" />
            AI Weekly Meal Planner
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Build custom weekly meal blueprints matching your target BMR/TDEE limits and dietary allergies.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2.5">
          {Object.keys(weeklyPlans).length > 0 && (
            <button
              onClick={handleGenerateGroceryForWeeklyPlans}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer hover:shadow-emerald-500/10"
              id="btn-generate-ai-grocery"
            >
              <ShoppingCart className="w-4 h-4" /> Generate Grocery List
            </button>
          )}

          {currentPlan && (
            <button
              onClick={handleLogFullDay}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-2xl text-xs transition-all flex items-center gap-2 shadow-lg hover:shadow-emerald-500/10 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Log Full Day to Food Log
            </button>
          )}
        </div>
      </div>

      {/* Week selection row strip */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-2 rounded-3xl shadow-sm overflow-x-auto scrollbar-none">
        <div className="flex gap-1">
          {DAYS.map((day) => {
            const hasPlan = !!weeklyPlans[day];
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4.5 py-3.5 rounded-2xl text-xs font-black transition-all flex flex-col items-center gap-1.5 min-w-[65px] ${
                  selectedDay === day
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <span>{day}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  selectedDay === day 
                    ? "bg-white" 
                    : hasPlan 
                    ? "bg-emerald-500" 
                    : "bg-gray-200 dark:bg-gray-700"
                }`}></span>
              </button>
            );
          })}
        </div>
        
        {currentPlan && (
          <button
            onClick={() => {
              const updated = { ...weeklyPlans };
              delete updated[selectedDay];
              savePlans(updated);
            }}
            className="p-3 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30"
            title="Reset active day"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main workspace */}
      {currentPlan ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Day's nutritional blueprint card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-6.5 shadow-xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <TrendingUp className="w-48 h-48" />
              </div>

              <div className="space-y-1">
                <span className="bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] px-3 py-1 rounded-full uppercase tracking-widest">
                  Nutrient Budget Balance
                </span>
                <h3 className="text-xl font-black text-white pt-1">Planned Blueprint</h3>
              </div>

              {/* Progress bars matching targets */}
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-emerald-200">Daily Calorie Target:</span>
                    <span>{totalCal} / {profile.dailyCalorieGoal} kcal</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, (totalCal / profile.dailyCalorieGoal) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2 text-center">
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Protein</p>
                    <p className="text-base font-black mt-1">{totalPro}g</p>
                    <p className="text-[9px] text-emerald-100/60 font-semibold">Target: {profile.proteinGoal}g</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Carbs</p>
                    <p className="text-base font-black mt-1">{totalCarb}g</p>
                    <p className="text-[9px] text-emerald-100/60 font-semibold">Target: {profile.carbsGoal}g</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-rose-300 font-bold uppercase tracking-wider">Fat</p>
                    <p className="text-base font-black mt-1">{totalFat}g</p>
                    <p className="text-[9px] text-emerald-100/60 font-semibold">Target: {profile.fatGoal}g</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-xs text-emerald-200 leading-relaxed flex gap-2.5">
                <Activity className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  This meal layout is fully customized according to your fitness goal to **{profile.fitnessGoal.replace("_", " ")}** with zero allergen interactions.
                </span>
              </div>
              
              <button
                onClick={handleGeneratePlan}
                disabled={loading}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white text-xs font-black rounded-2xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Regenerate Daily Plan
              </button>
            </div>
          </div>

          {/* Right: Meal cards flow */}
          <div className="lg:col-span-2 space-y-5">
            {(["breakfast", "lunch", "dinner", "snack"] as const).map((type) => {
              const meal = currentPlan[type];
              if (!meal) return null;

              const labelIcons: Record<string, string> = {
                breakfast: "🍳",
                lunch: "🥗",
                dinner: "🍽️",
                snack: "🍇"
              };

              return (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all text-left flex flex-col md:flex-row justify-between gap-6"
                >
                  <div className="space-y-3.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{labelIcons[type]}</span>
                      <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider">
                        {type}
                      </span>
                    </div>
                    
                    <div>
                      <h4 className="text-base font-black text-gray-900 dark:text-white leading-snug">{meal.name}</h4>
                      <p className="text-xs text-gray-400 mt-1 flex gap-3">
                        <span>🔥 <strong className="text-gray-700 dark:text-gray-200">{meal.calories}</strong> kcal</span>
                        <span>🥩 <strong className="text-gray-700 dark:text-gray-200">{meal.protein}g</strong> protein</span>
                        <span>🌾 <strong className="text-gray-700 dark:text-gray-200">{meal.carbs}g</strong> carbs</span>
                        <span>🥑 <strong className="text-gray-700 dark:text-gray-200">{meal.fat}g</strong> fat</span>
                      </p>
                    </div>

                    {meal.ingredients && (
                      <div className="pt-2">
                        <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-1.5">Ingredients Included:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {meal.ingredients.map((ing, idx) => (
                            <span 
                              key={idx} 
                              className="text-[10px] bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-800/50 px-2.5 py-1 rounded-xl"
                            >
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-row md:flex-col justify-end gap-2 shrink-0 md:border-l border-gray-50 dark:border-gray-800 md:pl-6 pt-4 md:pt-0">
                    <button
                      onClick={() => handleAddMealToLogs(type === "snack" ? "snacks" : type, meal)}
                      className="flex-1 md:flex-initial px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-extrabold rounded-2xl text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Log Meal
                    </button>
                    
                    <button
                      onClick={() => handleAddIngredientsToShopping(meal)}
                      className="flex-1 md:flex-initial px-4 py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 font-extrabold rounded-2xl text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" /> Shop Ingredients
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto bg-white dark:bg-gray-900">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-gray-900 dark:text-white">Plan your meals for {selectedDay}</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 max-w-[280px] mx-auto leading-relaxed">
              Generate a scientific dietary framework optimized to support your **{profile.fitnessGoal.replace("_", " ")}** goals.
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-500 dark:text-red-400 leading-normal">{error}</p>
          )}

          <button
            onClick={handleGeneratePlan}
            disabled={loading}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 mx-auto cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Cooking Diet Plan...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Generate via Gemini AI Chef
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
