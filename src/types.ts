/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  servingSize: string; // e.g. "100g", "1 medium"
  calories: number;
  protein: number; // in g
  carbs: number; // in g
  fat: number; // in g
  fiber?: number; // in g
  sugar?: number; // in g
  sodium?: number; // in mg
  potassium?: number; // in mg
  cholesterol?: number; // in mg
  isCustom?: boolean;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snacks";

export interface LoggedFood {
  id: string;
  food: FoodItem;
  servings: number; // multiply nutrition parameters by this
}

export interface MealLog {
  id: string;
  mealType: MealType;
  foods: LoggedFood[];
  notes?: string;
  photoUrl?: string;
  timestamp: string; // ISO string or simple YYYY-MM-DD
}

export interface WaterLog {
  id: string;
  amountMl: number;
  timestamp: string; // YYYY-MM-DD
}

export interface WeightLog {
  id: string;
  weight: number; // always stored in standard but display in preferred units
  bodyFat?: number;
  muscleMass?: number;
  bmi?: number;
  timestamp: string; // YYYY-MM-DD
  measurements?: {
    waist?: number;
    chest?: number;
    arms?: number;
    legs?: number;
    neck?: number;
    hips?: number;
  };
}

export interface ExerciseLog {
  id: string;
  type: string; // "Walking", "Running", "Cycling", etc.
  durationMin: number;
  caloriesBurned: number;
  timestamp: string; // YYYY-MM-DD
}

export interface FastingSession {
  id: string;
  type: string; // "16:8" | "18:6" | "20:4" | "OMAD" | "Custom"
  startTime: string; // ISO String
  endTime?: string; // ISO String
  durationHours: number;
  isActive: boolean;
}

export interface Habit {
  id: string;
  name: string; // "Water Tracker" | "Sleep" | "Exercise" | "Meditation" | "Supplements" | "Meal Timing"
  completed: boolean;
  date: string; // YYYY-MM-DD
  streak: number;
}

export interface Recipe {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string[];
  cookingTime: number; // in mins
  difficulty: "Easy" | "Medium" | "Hard";
  servings: number;
  image?: string;
  isFavorite?: boolean;
}

export interface UserProfile {
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  height: number; // in cm
  weight: number; // in kg
  targetWeight: number; // in kg
  bodyFat?: number;
  activityLevel: "sedentary" | "lightly_active" | "moderately_active" | "very_active";
  fitnessGoal: "lose_weight" | "gain_weight" | "gain_muscle" | "recomposition" | "maintain";
  dietPreference: "none" | "keto" | "vegan" | "vegetarian" | "mediterranean" | "low_carb" | "high_protein" | "intermittent_fasting";
  allergies: string[];
  restrictions: string[];
  units: "metric" | "imperial";
  dailyCalorieGoal: number;
  proteinGoal: number; // grams
  carbsGoal: number; // grams
  fatGoal: number; // grams
  manualMacros?: boolean;
}

export interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  category: "Proteins" | "Produce" | "Dairy" | "Pantry" | "Grains" | "Frozen" | "Spices" | "Beverages" | "Other";
  checked: boolean;
  amount?: string;
}
