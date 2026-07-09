/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { UserProfile, FoodItem, GroceryItem } from "../types";
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Search, 
  Check, 
  AlertCircle, 
  Utensils, 
  HelpCircle, 
  Info, 
  Sparkles,
  Award,
  ChevronDown,
  ShoppingCart
} from "lucide-react";
import { decomposeMealToIngredients, mergeIngredients } from "../utils/groceryGenerator";

// Local seed foods database copy for robust, responsive local searches
const PLANNER_SEED_FOODS = [
  { id: "1", name: "Avocado", brand: "Fresh Produce", servingSize: "1 medium (150g)", calories: 240, protein: 3, carbs: 12, fat: 22 },
  { id: "2", name: "Chicken Breast", brand: "Farms Select", servingSize: "100g cooked", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: "3", name: "White Rice", brand: "Jasmine Premium", servingSize: "1 cup cooked (150g)", calories: 205, protein: 4.2, carbs: 44.5, fat: 0.4 },
  { id: "4", name: "Whole Wheat Bread", brand: "Baker's Choice", servingSize: "1 slice (40g)", calories: 80, protein: 4, carbs: 15, fat: 1 },
  { id: "5", name: "Whole Egg", brand: "Organic Pasture", servingSize: "1 large (50g)", calories: 70, protein: 6, carbs: 0.6, fat: 5 },
  { id: "6", name: "Atlantic Salmon", brand: "Wild Caught", servingSize: "100g grilled", calories: 206, protein: 22, carbs: 0, fat: 12.4 },
  { id: "7", name: "Greek Yogurt 0%", brand: "Chobani", servingSize: "1 cup (150g)", calories: 90, protein: 15, carbs: 6, fat: 0 },
  { id: "8", name: "Peanut Butter", brand: "Skippy Creamy", servingSize: "2 tbsp (32g)", calories: 190, protein: 7, carbs: 6, fat: 16 },
  { id: "9", name: "Rolled Oats", brand: "Quaker", servingSize: "1/2 cup dry (40g)", calories: 150, protein: 5, carbs: 27, fat: 2.5 },
  { id: "10", name: "Banana", brand: "Fresh Produce", servingSize: "1 medium (118g)", calories: 105, protein: 1.3, carbs: 27, fat: 0.3 },
  { id: "11", name: "Whey Protein Isolate", brand: "Optimum Nutrition", servingSize: "1 scoop (30g)", calories: 120, protein: 24, carbs: 3, fat: 1 },
  { id: "12", name: "Broccoli", brand: "Fresh Produce", servingSize: "1 cup chopped (90g)", calories: 31, protein: 2.5, carbs: 6, fat: 0.3 },
  { id: "13", name: "Sweet Potato", brand: "Fresh Produce", servingSize: "1 medium (130g)", calories: 112, protein: 2, carbs: 26, fat: 0.1 },
  { id: "14", name: "Almonds", brand: "Blue Diamond", servingSize: "1 oz (28g)", calories: 160, protein: 6, carbs: 6, fat: 14 },
  { id: "15", name: "Extra Virgin Olive Oil", brand: "Bertolli", servingSize: "1 tbsp (15ml)", calories: 120, protein: 0, carbs: 0, fat: 14 },
  { id: "18", name: "Canned Tuna in Water", brand: "Starkist", servingSize: "1 can (150g)", calories: 130, protein: 29, carbs: 0, fat: 1 },
  { id: "19", name: "Apple", brand: "Fresh Produce", servingSize: "1 medium (182g)", calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  { id: "20", name: "Blueberries", brand: "Fresh Produce", servingSize: "1 cup (148g)", calories: 84, protein: 1.1, carbs: 21, fat: 0.5 },
  { id: "21", name: "Beef Sirloin Steak", brand: "Butcher's Choice", servingSize: "100g cooked", calories: 200, protein: 28, carbs: 0, fat: 9 },
  { id: "22", name: "Spinach Fresh", brand: "Fresh Express", servingSize: "2 cups (60g)", calories: 14, protein: 1.7, carbs: 2.2, fat: 0.2 },
  { id: "23", name: "Tofu Firm", brand: "House Foods", servingSize: "100g", calories: 76, protein: 8, carbs: 1.9, fat: 4.8 },
  { id: "24", name: "Lentils cooked", brand: "Goya", servingSize: "1 cup (198g)", calories: 230, protein: 18, carbs: 40, fat: 0.8 },
];

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

interface WeeklyMealPlannerProps {
  profile: UserProfile;
  onAddMealLog?: (mealType: "breakfast" | "lunch" | "dinner" | "snacks", food: FoodItem, servings: number) => void;
  onGenerateGroceryList?: (items: GroceryItem[]) => void;
}

interface GridMeal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string;
}

type DayGrid = Record<"breakfast" | "lunch" | "dinner", GridMeal | null>;
type WeeklyGrid = Record<string, DayGrid>;

const DEFAULT_GRID: WeeklyGrid = {
  Monday: {
    breakfast: { name: "Rolled Oats with Greek Yogurt & Blueberries", calories: 324, protein: 21.1, carbs: 54, fat: 3 },
    lunch: { name: "Seared Atlantic Salmon with Sweet Potato", calories: 318, protein: 24, carbs: 26, fat: 12.5 },
    dinner: { name: "Grilled Chicken Breast with White Rice & Broccoli", calories: 401, protein: 37.7, carbs: 50.5, fat: 4.3 }
  },
  Tuesday: {
    breakfast: { name: "Scrambled Eggs with Avocado & Whole Wheat Toast", calories: 460, protein: 19, carbs: 27.6, fat: 28 },
    lunch: { name: "Canned Tuna Salad with Spinach & Olive Oil", calories: 264, protein: 30.7, carbs: 2.2, fat: 15.2 },
    dinner: { name: "Lean Ground Turkey with Brown Rice", calories: 388, protein: 31, carbs: 45, fat: 9.8 }
  },
  Wednesday: {
    breakfast: { name: "Whey Protein Isolate Shake with Banana", calories: 225, protein: 25.3, carbs: 30, fat: 1.3 },
    lunch: { name: "Tofu Stir Fry with Jasmine Rice", calories: 281, protein: 12.2, carbs: 46.4, fat: 5.2 },
    dinner: { name: "Beef Sirloin Steak with Roasted Asparagus", calories: 320, protein: 30.5, carbs: 6, fat: 23 }
  },
  Thursday: { breakfast: null, lunch: null, dinner: null },
  Friday: { breakfast: null, lunch: null, dinner: null },
  Saturday: { breakfast: null, lunch: null, dinner: null },
  Sunday: { breakfast: null, lunch: null, dinner: null }
};

export default function WeeklyMealPlanner({ profile, onAddMealLog, onGenerateGroceryList }: WeeklyMealPlannerProps) {
  // Load grid state from localStorage or seed
  const [weeklyGrid, setWeeklyGrid] = useState<WeeklyGrid>(() => {
    const saved = localStorage.getItem("diet_weekly_grid");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading saved weekly grid", e);
      }
    }
    return DEFAULT_GRID;
  });

  // Food Picker Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState<{ day: string; mealType: "breakfast" | "lunch" | "dinner" } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<typeof PLANNER_SEED_FOODS>(PLANNER_SEED_FOODS);
  
  // Custom Food Form inside Modal State
  const [customName, setCustomName] = useState("");
  const [customCalories, setCustomCalories] = useState<number | "">("");
  const [customProtein, setCustomProtein] = useState<number | "">("");
  const [customCarbs, setCustomCarbs] = useState<number | "">("");
  const [customFat, setCustomFat] = useState<number | "">("");

  // Save weekly grid to localStorage
  useEffect(() => {
    localStorage.setItem("diet_weekly_grid", JSON.stringify(weeklyGrid));
  }, [weeklyGrid]);

  // Handle local searching inside modal
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults(PLANNER_SEED_FOODS);
      return;
    }
    const filtered = PLANNER_SEED_FOODS.filter(f => 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.brand && f.brand.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setSearchResults(filtered);
  }, [searchQuery]);

  // Open food selection modal for a specific day and meal slot
  const openFoodPicker = (day: string, mealType: "breakfast" | "lunch" | "dinner") => {
    setModalTarget({ day, mealType });
    setSearchQuery("");
    setCustomName("");
    setCustomCalories("");
    setCustomProtein("");
    setCustomCarbs("");
    setCustomFat("");
    setIsModalOpen(true);
  };

  // Assign selected food to grid
  const assignFood = (food: typeof PLANNER_SEED_FOODS[0]) => {
    if (!modalTarget) return;
    const { day, mealType } = modalTarget;
    
    setWeeklyGrid(prev => {
      const dayGrid = prev[day] || { breakfast: null, lunch: null, dinner: null };
      return {
        ...prev,
        [day]: {
          ...dayGrid,
          [mealType]: {
            name: food.name,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
            servingSize: food.servingSize || "1 portion"
          }
        }
      };
    });
    setIsModalOpen(false);
  };

  // Save custom food input from form
  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTarget || !customName || customCalories === "") return;
    const { day, mealType } = modalTarget;

    setWeeklyGrid(prev => {
      const dayGrid = prev[day] || { breakfast: null, lunch: null, dinner: null };
      return {
        ...prev,
        [day]: {
          ...dayGrid,
          [mealType]: {
            name: customName,
            calories: Number(customCalories),
            protein: Number(customProtein || 0),
            carbs: Number(customCarbs || 0),
            fat: Number(customFat || 0),
            servingSize: "1 custom portion"
          }
        }
      };
    });
    setIsModalOpen(false);
  };

  // Remove food from a specific slot
  const clearSlot = (day: string, mealType: "breakfast" | "lunch" | "dinner") => {
    setWeeklyGrid(prev => {
      const dayGrid = prev[day] || { breakfast: null, lunch: null, dinner: null };
      return {
        ...prev,
        [day]: {
          ...dayGrid,
          [mealType]: null
        }
      };
    });
  };

  // Clear entire week's schedule
  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear the entire weekly planner?")) {
      const cleared: WeeklyGrid = {};
      DAYS.forEach(day => {
        cleared[day] = { breakfast: null, lunch: null, dinner: null };
      });
      setWeeklyGrid(cleared);
    }
  };

  const handleGenerateGrocery = () => {
    const allIngredientStrings: string[] = [];

    DAYS.forEach(day => {
      const dayGrid = weeklyGrid[day];
      if (dayGrid) {
        (["breakfast", "lunch", "dinner"] as const).forEach(slot => {
          const meal = dayGrid[slot];
          if (meal) {
            const decomposed = decomposeMealToIngredients(meal.name);
            allIngredientStrings.push(...decomposed);
          }
        });
      }
    });

    if (allIngredientStrings.length === 0) {
      alert("Your weekly meal plan is currently empty! Assign some meals first to generate a grocery list.");
      return;
    }

    const groceryItems = mergeIngredients(allIngredientStrings);
    if (onGenerateGroceryList) {
      onGenerateGroceryList(groceryItems);
    }
  };

  // Helper to calculate totals for a day
  const calculateDayTotals = (dayGrid: DayGrid | undefined) => {
    if (!dayGrid) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    let cal = 0, pro = 0, carb = 0, fat = 0;
    
    (["breakfast", "lunch", "dinner"] as const).forEach(slot => {
      const meal = dayGrid[slot];
      if (meal) {
        cal += meal.calories;
        pro += meal.protein;
        carb += meal.carbs;
        fat += meal.fat;
      }
    });

    return {
      calories: Math.round(cal),
      protein: Math.round(pro * 10) / 10,
      carbs: Math.round(carb * 10) / 10,
      fat: Math.round(fat * 10) / 10
    };
  };

  // Helper to determine calorie budget status and style
  // Hits the goal if within ±100 kcal of daily goal. Otherwise, misses.
  const getBudgetStatus = (calories: number) => {
    if (calories === 0) return { status: "empty", text: "Empty Plan", class: "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/10 text-gray-400" };
    
    const diff = calories - profile.dailyCalorieGoal;
    
    if (Math.abs(diff) <= 100) {
      return { 
        status: "hit", 
        text: "🎯 Hit Goal", 
        class: "border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 shadow-sm shadow-emerald-500/5",
        badge: "bg-emerald-500 text-white"
      };
    } else if (diff < -100) {
      return { 
        status: "under", 
        text: `📉 Under by ${Math.abs(diff)} kcal`, 
        class: "border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400",
        badge: "bg-amber-500 text-white"
      };
    } else {
      return { 
        status: "over", 
        text: `📈 Over by ${diff} kcal`, 
        class: "border-rose-300 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400",
        badge: "bg-rose-500 text-white"
      };
    }
  };

  // Helper to quickly log a planned meal to the live logs
  const handleQuickLog = (meal: GridMeal, mealType: "breakfast" | "lunch" | "dinner") => {
    if (!onAddMealLog) return;
    const foodItem: FoodItem = {
      id: `grid_${mealType}_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
      name: meal.name,
      servingSize: meal.servingSize,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat
    };
    onAddMealLog(mealType, foodItem, 1);

    // Beautiful UI Toast
    const toast = document.createElement("div");
    toast.className = "fixed bottom-5 right-5 z-50 bg-emerald-600 text-white text-xs px-4 py-3 rounded-2xl shadow-xl border border-emerald-500 font-bold flex items-center gap-2 animate-bounce";
    toast.innerHTML = `<span class="bg-white/20 p-1 rounded-full">✓</span> Added "${meal.name}" to today's ${mealType}!`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  return (
    <div className="space-y-8" id="weekly-meal-planner-view">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 dark:border-gray-900 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Calendar className="w-8 h-8 text-emerald-500" />
            7-Day Weekly Meal Planner
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Map out your week's meals. Assign custom foods to slots, track daily macro aggregations, and optimize alignment with your target budget of <strong className="text-emerald-600 dark:text-emerald-400">{profile.dailyCalorieGoal} kcal</strong>.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleGenerateGrocery}
            className="px-4.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer hover:shadow-emerald-500/10"
            id="btn-generate-grocery-list"
          >
            <ShoppingCart className="w-4 h-4" /> Generate Grocery List
          </button>
          
          <button
            onClick={handleClearAll}
            className="px-4.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 font-bold rounded-xl text-xs transition-all border border-rose-200 dark:border-rose-900/30 cursor-pointer"
          >
            Reset Whole Week
          </button>
        </div>
      </div>

      {/* Guide Card */}
      <div className="bg-emerald-50/50 dark:bg-emerald-950/5 border border-emerald-100 dark:border-emerald-900/30 p-4.5 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed flex gap-3 text-left">
        <Sparkles className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
        <div>
          <p className="font-extrabold uppercase tracking-wide mb-0.5">Budget Target Guidelines</p>
          <p>
            Each day is analyzed against your biometric daily calorie target of <strong className="font-bold">{profile.dailyCalorieGoal} kcal</strong>. Days within <strong>±100 kcal</strong> are highlighted in green as hitting your goal, keeping you securely on track without restrictive margins.
          </p>
        </div>
      </div>

      {/* The 7-Day Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {DAYS.map((day) => {
          const dayGrid = weeklyGrid[day] || { breakfast: null, lunch: null, dinner: null };
          const totals = calculateDayTotals(dayGrid);
          const status = getBudgetStatus(totals.calories);

          return (
            <div 
              key={day}
              className={`flex flex-col justify-between bg-white dark:bg-gray-900 rounded-3xl border p-5 shadow-sm hover:shadow-md transition-all ${
                status.status === "hit" 
                  ? "border-emerald-300 dark:border-emerald-800/80 shadow-emerald-500/5" 
                  : status.status !== "empty" 
                  ? "border-amber-200 dark:border-amber-900/40" 
                  : "border-gray-100 dark:border-gray-850"
              }`}
            >
              <div>
                {/* Header info (Day name, highlight status) */}
                <div className="flex justify-between items-center border-b border-gray-50 dark:border-gray-800 pb-3">
                  <h3 className="font-black text-gray-900 dark:text-white text-base">{day}</h3>
                  {totals.calories > 0 && (
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${status.class.split(" ")[0]} ${status.class.split(" ")[1]}`}>
                      {status.text}
                    </span>
                  )}
                </div>

                {/* Day's Meal Slots */}
                <div className="space-y-3.5 mt-4">
                  {(["breakfast", "lunch", "dinner"] as const).map((slot) => {
                    const meal = dayGrid[slot];
                    return (
                      <div key={slot} className="space-y-1 text-left">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-extrabold text-gray-400 dark:text-gray-500 tracking-wider">
                            {slot}
                          </span>
                          {meal && (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleQuickLog(meal, slot)}
                                title="Quick log to diary"
                                className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                              >
                                Log
                              </button>
                              <button
                                onClick={() => clearSlot(day, slot)}
                                className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-0.5 rounded transition-all cursor-pointer"
                                title="Remove meal"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {meal ? (
                          <div className="bg-gray-50/50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/50 rounded-2xl p-3 space-y-1 hover:border-gray-200 dark:hover:border-gray-700 transition-all">
                            <p className="font-bold text-gray-800 dark:text-gray-200 text-xs leading-snug">{meal.name}</p>
                            <div className="flex flex-wrap gap-2 text-[9px] text-gray-400">
                              <span>🔥 <strong className="text-gray-600 dark:text-gray-300 font-semibold">{meal.calories} kcal</strong></span>
                              <span>🥩 <strong className="text-gray-600 dark:text-gray-300 font-semibold">{meal.protein}g</strong> P</span>
                              <span>🌾 <strong className="text-gray-600 dark:text-gray-300 font-semibold">{meal.carbs}g</strong> C</span>
                              <span>🥑 <strong className="text-gray-600 dark:text-gray-300 font-semibold">{meal.fat}g</strong> F</span>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => openFoodPicker(day, slot)}
                            className="w-full py-3.5 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl flex items-center justify-center gap-1.5 text-gray-400 hover:text-emerald-500 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all text-xs font-bold bg-white dark:bg-gray-900 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Assign Meal
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Day footer: Aggregated macro values */}
              {totals.calories > 0 && (
                <div className={`mt-5 pt-4 border-t border-gray-50 dark:border-gray-800 space-y-2.5 ${status.class} p-3 rounded-2xl`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold">Total Calories:</span>
                    <span className="font-extrabold text-sm">{totals.calories} / {profile.dailyCalorieGoal} kcal</span>
                  </div>
                  
                  {/* Miniature Macro bars */}
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] font-black uppercase">
                    <div className="bg-white/40 dark:bg-black/20 p-1.5 rounded-xl">
                      <p className="text-gray-500 dark:text-gray-400">P</p>
                      <p className="font-black mt-0.5">{totals.protein}g</p>
                    </div>
                    <div className="bg-white/40 dark:bg-black/20 p-1.5 rounded-xl">
                      <p className="text-gray-500 dark:text-gray-400">C</p>
                      <p className="font-black mt-0.5">{totals.carbs}g</p>
                    </div>
                    <div className="bg-white/40 dark:bg-black/20 p-1.5 rounded-xl">
                      <p className="text-gray-500 dark:text-gray-400">F</p>
                      <p className="font-black mt-0.5">{totals.fat}g</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SEARCH/ASSIGN MODAL */}
      {isModalOpen && modalTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl w-full max-w-lg p-6 flex flex-col max-h-[90vh] shadow-2xl animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-gray-50 dark:border-gray-800 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                  Assign to {modalTarget.day}'s {modalTarget.mealType}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Select from our premium food database or write in custom targets.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick search input */}
            <div className="relative mt-4 shrink-0">
              <Search className="absolute left-3 top-3 w-4.5 h-4.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search food database..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Scrollable list & custom builder */}
            <div className="flex-1 overflow-y-auto mt-4 space-y-6 pr-1 text-left">
              
              {/* Database Search Results */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-gray-500">Database Options</p>
                <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {searchResults.map((food) => (
                    <button
                      key={food.id}
                      onClick={() => assignFood(food)}
                      className="w-full flex justify-between items-center py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 rounded-xl px-2 transition-all text-left group cursor-pointer"
                    >
                      <div>
                        <p className="font-bold text-gray-800 dark:text-white text-xs group-hover:text-emerald-500 transition-all">{food.name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {food.servingSize} • <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{food.calories} kcal</strong> • P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g
                        </p>
                      </div>
                      <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-1 rounded-lg shrink-0">
                        Select
                      </span>
                    </button>
                  ))}
                  {searchResults.length === 0 && (
                    <p className="text-xs text-gray-400 italic text-center py-4">No matching food entries found.</p>
                  )}
                </div>
              </div>

              {/* Custom manual food form */}
              <form onSubmit={handleAddCustom} className="bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/30 rounded-2xl p-4.5 space-y-3.5">
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Manual Custom Entry
                </p>

                <div className="space-y-2.5">
                  <div>
                    <label className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-gray-500 block mb-1">Meal / Food Name</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g. Roasted Chicken Caesar Salad"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-850 dark:text-white rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2.5">
                    <div>
                      <label className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-gray-500 block mb-1">Cals (kcal)</label>
                      <input
                        type="number"
                        required
                        value={customCalories}
                        onChange={(e) => setCustomCalories(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-850 dark:text-white rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-gray-500 block mb-1">Pro (g)</label>
                      <input
                        type="number"
                        value={customProtein}
                        onChange={(e) => setCustomProtein(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-850 dark:text-white rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-gray-500 block mb-1">Carb (g)</label>
                      <input
                        type="number"
                        value={customCarbs}
                        onChange={(e) => setCustomCarbs(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-850 dark:text-white rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-gray-500 block mb-1">Fat (g)</label>
                      <input
                        type="number"
                        value={customFat}
                        onChange={(e) => setCustomFat(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-850 dark:text-white rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Confirm & Assign
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
