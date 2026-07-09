/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { UserProfile, MealLog, WaterLog, ExerciseLog, WeightLog, Habit, FastingSession, FoodItem, MealType, Recipe, GroceryItem, Message } from "./types";
import Dashboard from "./components/Dashboard";
import MealLogger from "./components/MealLogger";
import RecipeSection from "./components/RecipeSection";
import AICoach, { AICoachChat } from "./components/AICoach";
import FastingTracker from "./components/FastingTracker";
import GrocerySection from "./components/GrocerySection";
import UserProfileComponent from "./components/UserProfileComponent";
import MealPlanner from "./components/MealPlanner";
import WeeklyMealPlanner from "./components/WeeklyMealPlanner";
import Onboarding from "./components/Onboarding";
import Challenges from "./components/Challenges";
import AnalyticsReports from "./components/AnalyticsReports";
import WaterTracker from "./components/WaterTracker";
import ExerciseTracker from "./components/ExerciseTracker";
import WeightTracker from "./components/WeightTracker";
import HabitsTracker from "./components/HabitsTracker";
import { motion } from "motion/react";
import { LayoutDashboard, PlusCircle, BookOpen, Sparkles, Timer, ShoppingCart, User, Sun, Moon, Zap, Calendar, CalendarDays, MoreHorizontal, Trophy, BarChart3, Droplet, Dumbbell, Scale, Award, MessageSquare } from "lucide-react";

// --- PRE-SEED DATA FOR IMMERSIVE FIRST-LOAD ---
const DEFAULT_PROFILE: UserProfile = {
  name: "Alex Rivera",
  age: 28,
  gender: "male",
  height: 178,
  weight: 79.5,
  targetWeight: 75.0,
  activityLevel: "moderately_active",
  fitnessGoal: "lose_weight",
  dietPreference: "none",
  allergies: ["Peanuts"],
  restrictions: [],
  units: "metric",
  dailyCalorieGoal: 1950,
  proteinGoal: 145,
  carbsGoal: 200,
  fatGoal: 65,
};

const DEFAULT_WEIGHT_LOGS: WeightLog[] = [
  { id: "w_day_1", weight: 83.5, timestamp: "2026-06-02" },
  { id: "w_day_2", weight: 83.2, timestamp: "2026-06-04" },
  { id: "w_day_3", weight: 82.9, timestamp: "2026-06-07" },
  { id: "w_day_4", weight: 82.6, timestamp: "2026-06-10" },
  { id: "w_day_5", weight: 82.1, timestamp: "2026-06-14" },
  { id: "w_day_6", weight: 81.7, timestamp: "2026-06-17" },
  { id: "w_day_7", weight: 81.4, timestamp: "2026-06-20" },
  { id: "w_day_8", weight: 81.0, timestamp: "2026-06-23" },
  { id: "w_day_9", weight: 80.6, timestamp: "2026-06-26" },
  { id: "w_day_10", weight: 80.1, timestamp: "2026-06-29" },
  { id: "w_day_11", weight: 79.5, timestamp: "2026-07-02" },
];

const DEFAULT_HABITS: Habit[] = [
  { id: "h1", name: "Water intake (2.5L)", completed: true, date: "2026-06-30", streak: 4 },
  { id: "h2", name: "Mindful protein targets", completed: false, date: "2026-06-30", streak: 2 },
  { id: "h3", name: "30-min active exercise", completed: true, date: "2026-06-30", streak: 5 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [pinnedTabs, setPinnedTabs] = useState<string[]>(() => {
    const saved = localStorage.getItem("diet_pinned_mobile_tabs");
    return saved ? JSON.parse(saved) : ["dashboard", "meals", "coach", "chats"];
  });
  const [isCustomizingNav, setIsCustomizingNav] = useState<boolean>(false);

  // Onboarding & Notification Simulator States
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return localStorage.getItem("diet_onboarded") === "true";
  });
  const [notificationToast, setNotificationToast] = useState<{ title: string; body: string; type: string } | null>(null);

  const triggerNotificationToast = (title: string, body: string, type: string) => {
    setNotificationToast({ title, body, type });
    setTimeout(() => {
      setNotificationToast(null);
    }, 4500);
  };

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem("diet_profile", JSON.stringify(newProfile));
    localStorage.setItem("diet_onboarded", "true");
    setIsOnboarded(true);
    setActiveTab("dashboard");
    
    // Trigger onboarding reminder scheduling notification
    triggerNotificationToast(
      "Reminders Activated ⏰",
      "Successfully scheduled meal, weight, and water logging push notification reminders!",
      "success"
    );
  };

  // --- LOCAL PERSISTENCE STORES ---
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("diet_profile");
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });

  const [mealLogs, setMealLogs] = useState<MealLog[]>(() => {
    const saved = localStorage.getItem("diet_meal_logs");
    if (saved) return JSON.parse(saved);
    
    // Seed 1 default breakfast item
    return [
      {
        id: "m_seed_1",
        mealType: "breakfast",
        timestamp: new Date().toISOString().split("T")[0],
        foods: [
          {
            id: "lf_1",
            servings: 1,
            food: { id: "seed_f_1", name: "Avocado", brand: "Fresh Produce", servingSize: "1 medium", calories: 240, protein: 3, carbs: 12, fat: 22 },
          },
          {
            id: "lf_2",
            servings: 2,
            food: { id: "seed_f_2", name: "Whole Egg", brand: "Organic Pasture", servingSize: "1 large", calories: 70, protein: 6, carbs: 0.6, fat: 5 },
          }
        ],
      },
    ];
  });

  const [waterLogs, setWaterLogs] = useState<WaterLog[]>(() => {
    const saved = localStorage.getItem("diet_water_logs");
    if (saved) return JSON.parse(saved);
    return [{ id: "wat_seed", amountMl: 500, timestamp: new Date().toISOString().split("T")[0] }];
  });

  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>(() => {
    const saved = localStorage.getItem("diet_exercise_logs");
    if (saved) return JSON.parse(saved);
    return [{ id: "ex_seed", type: "Running", durationMin: 30, caloriesBurned: 340, timestamp: new Date().toISOString().split("T")[0] }];
  });

  const [weightLogs, setWeightLogs] = useState<WeightLog[]>(() => {
    const saved = localStorage.getItem("diet_weight_logs");
    return saved ? JSON.parse(saved) : DEFAULT_WEIGHT_LOGS;
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem("diet_habits");
    return saved ? JSON.parse(saved) : DEFAULT_HABITS;
  });

  const [activeFastingSession, setActiveFastingSession] = useState<FastingSession | null>(() => {
    const saved = localStorage.getItem("diet_active_fast");
    return saved ? JSON.parse(saved) : null;
  });

  const [groceryList, setGroceryList] = useState<GroceryItem[]>(() => {
    const saved = localStorage.getItem("diet_grocery_list");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seenIds = new Set<string>();
          return parsed.map((item, idx) => {
            if (!item.id || seenIds.has(item.id)) {
              const uniqueId = `g_item_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000000)}`;
              seenIds.add(uniqueId);
              return { ...item, id: uniqueId };
            }
            seenIds.add(item.id);
            return item;
          });
        }
      } catch (e) {
        console.error("Failed to parse grocery list", e);
      }
    }
    return [
      { id: "g1", name: "Avocado", category: "Fruits", checked: false, amount: "2 medium" },
      { id: "g2", name: "Chicken Breast", category: "Meat", checked: false, amount: "500g" },
      { id: "g3", name: "Organic Blueberries", category: "Fruits", checked: false, amount: "1 pint" },
      { id: "g4", name: "Greek Yogurt 0%", category: "Dairy", checked: true, amount: "1 tub" },
      { id: "g5", name: "Chia Seeds", category: "Pantry", checked: false, amount: "1 bag" },
      { id: "g6", name: "Rolled Oats", category: "Pantry", checked: false, amount: "1 bag" },
      { id: "g7", name: "Fresh Spinach", category: "Vegetables", checked: false, amount: "1 bag" },
      { id: "g8", name: "Sweet Potato", category: "Vegetables", checked: false, amount: "4 items" },
    ];
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("diet_messages");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "m0",
        sender: "ai",
        text: `Hello there! I am OnSpace AI, your personal GPT-powered Nutrition Coach. Based on your profile, I see your target calorie budget is **${profile.dailyCalorieGoal} kcal** with a **${profile.dietPreference === "none" ? "Balanced" : profile.dietPreference}** dietary preference. 

How can I help you optimize your eating habits, plan meals, or calculate macros today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ];
  });

  // Sync state stores to localStorage on change
  useEffect(() => {
    localStorage.setItem("diet_profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("diet_messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("diet_grocery_list", JSON.stringify(groceryList));
  }, [groceryList]);

  // Fetch AI daily nutrition recommendation
  const [aiNutritionTip, setAiNutritionTip] = useState<string>("");
  const [loadingAiTip, setLoadingAiTip] = useState<boolean>(false);

  useEffect(() => {
    const fetchAiTip = async () => {
      setLoadingAiTip(true);
      try {
        const todayStr = new Date().toISOString().split("T")[0];
        let eatenCalories = 0;
        let eatenProtein = 0;
        let eatenCarbs = 0;
        let eatenFat = 0;

        mealLogs.forEach((log) => {
          if (log.timestamp === todayStr) {
            log.foods.forEach((loggedFood) => {
              const f = loggedFood.food;
              const servings = loggedFood.servings;
              eatenCalories += f.calories * servings;
              eatenProtein += f.protein * servings;
              eatenCarbs += f.carbs * servings;
              eatenFat += f.fat * servings;
            });
          }
        });

        const todayMacros = {
          calories: Math.round(eatenCalories),
          protein: Math.round(eatenProtein),
          carbs: Math.round(eatenCarbs),
          fat: Math.round(eatenFat)
        };

        const res = await fetch("/api/ai/nutrition-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userProfile: profile, todayMacros })
        });
        const data = await res.json();
        if (data.recommendation) {
          setAiNutritionTip(data.recommendation);
        }
      } catch (err) {
        console.error("Error fetching AI nutrition tip:", err);
      } finally {
        setLoadingAiTip(false);
      }
    };

    fetchAiTip();
  }, [mealLogs, profile]);

  const handleAddGroceryItem = (name: string, category: GroceryItem["category"], amount?: string) => {
    setGroceryList(prev => {
      const exists = prev.find(item => item.name.toLowerCase() === name.toLowerCase());
      if (exists) return prev;
      return [
        {
          id: `g_item_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
          name,
          category,
          checked: false,
          amount
        },
        ...prev
      ];
    });
  };

  useEffect(() => {
    localStorage.setItem("diet_meal_logs", JSON.stringify(mealLogs));
  }, [mealLogs]);

  useEffect(() => {
    localStorage.setItem("diet_water_logs", JSON.stringify(waterLogs));
  }, [waterLogs]);

  useEffect(() => {
    localStorage.setItem("diet_exercise_logs", JSON.stringify(exerciseLogs));
  }, [exerciseLogs]);

  useEffect(() => {
    localStorage.setItem("diet_weight_logs", JSON.stringify(weightLogs));
  }, [weightLogs]);

  useEffect(() => {
    localStorage.setItem("diet_habits", JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem("diet_active_fast", JSON.stringify(activeFastingSession));
  }, [activeFastingSession]);

  // Handle dark mode class application
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // --- STATE MUTATORS ---

  const handleUpdateProfile = (updated: UserProfile) => {
    setProfile(updated);
  };

  const handleGenerateGroceryFromPlanner = (items: GroceryItem[]) => {
    setGroceryList(prev => {
      const updated = [...prev];
      items.forEach(newItem => {
        const existingIdx = updated.findIndex(i => i.name.toLowerCase() === newItem.name.toLowerCase());
        if (existingIdx > -1) {
          const existing = updated[existingIdx];
          const existingMatch = existing.amount?.match(/^(\d+(\.\d+)?)\s*(\w+)/);
          const newMatch = newItem.amount?.match(/^(\d+(\.\d+)?)\s*(\w+)/);
          if (existingMatch && newMatch && existingMatch[3].toLowerCase() === newMatch[3].toLowerCase()) {
            const sumQty = parseFloat(existingMatch[1]) + parseFloat(newMatch[1]);
            existing.amount = `${Math.round(sumQty * 100) / 100} ${existingMatch[3]}`;
          }
        } else {
          updated.push(newItem);
        }
      });
      return updated;
    });
    triggerNotificationToast(
      "Shopping List Generated 🛒",
      `Successfully generated/merged ${items.length} ingredients from your weekly meal plan! Check your Grocery tab.`,
      "success"
    );
  };

  const handleAddMealLog = (mealType: MealType, food: FoodItem, servings: number) => {
    const today = new Date().toISOString().split("T")[0];
    setMealLogs((prev) => {
      const existing = prev.find((log) => log.mealType === mealType && log.timestamp === today);
      const newLoggedFood = {
        id: `lf_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
        food,
        servings,
      };

      if (existing) {
        return prev.map((log) =>
          log.id === existing.id
            ? { ...log, foods: [...log.foods, newLoggedFood] }
            : log
        );
      } else {
        const newLog: MealLog = {
          id: `meal_log_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
          mealType,
          foods: [newLoggedFood],
          timestamp: today,
        };
        return [...prev, newLog];
      }
    });
  };

  const handleRemoveMealLog = (logId: string, loggedFoodId: string) => {
    setMealLogs((prev) =>
      prev
        .map((log) => {
          if (log.id === logId) {
            return {
              ...log,
              foods: log.foods.filter((lf) => lf.id !== loggedFoodId),
            };
          }
          return log;
        })
        .filter((log) => log.foods.length > 0)
    );
  };

  const handleAddWater = (amountMl: number) => {
    const today = new Date().toISOString().split("T")[0];
    const newLog: WaterLog = {
      id: `wat_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
      amountMl,
      timestamp: today,
    };
    setWaterLogs((prev) => [...prev, newLog]);
  };

  const handleAddExercise = (type: string, duration: number, calories: number) => {
    const today = new Date().toISOString().split("T")[0];
    const newLog: ExerciseLog = {
      id: `ex_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
      type,
      durationMin: duration,
      caloriesBurned: calories,
      timestamp: today,
    };
    setExerciseLogs((prev) => [...prev, newLog]);
  };

  const handleAddWeight = (weight: number) => {
    const today = new Date().toISOString().split("T")[0];
    const newLog: WeightLog = {
      id: `w_log_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
      weight,
      timestamp: today,
    };
    setWeightLogs((prev) => {
      // replace today's log if it exists, else add new
      const filtered = prev.filter((w) => w.timestamp !== today);
      return [...filtered, newLog].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    });
    // Dynamically update biometric profile weight as well
    setProfile(prev => ({ ...prev, weight }));
  };

  const handleToggleHabit = (habitId: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === idToMatch(h.id, habitId)) {
          return {
            ...h,
            completed: !h.completed,
            streak: !h.completed ? h.streak + 1 : Math.max(0, h.streak - 1),
          };
        }
        return h;
      })
    );
  };

  const handleRemoveWater = (logId: string) => {
    setWaterLogs((prev) => prev.filter((log) => log.id !== logId));
  };

  const handleRemoveExercise = (logId: string) => {
    setExerciseLogs((prev) => prev.filter((log) => log.id !== logId));
  };

  const handleRemoveWeight = (logId: string) => {
    setWeightLogs((prev) => prev.filter((log) => log.id !== logId));
  };

  const handleAddHabit = (name: string) => {
    const newHabit: Habit = {
      id: `h_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
      name,
      completed: false,
      date: new Date().toISOString().split("T")[0],
      streak: 0,
    };
    setHabits((prev) => [...prev, newHabit]);
  };

  const handleRemoveHabit = (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
  };

  const togglePinnedTab = (tabId: string) => {
    setPinnedTabs((prev) => {
      if (prev.includes(tabId)) {
        if (prev.length <= 1) return prev;
        const updated = prev.filter((id) => id !== tabId);
        localStorage.setItem("diet_pinned_mobile_tabs", JSON.stringify(updated));
        return updated;
      } else {
        if (prev.length >= 4) {
          triggerNotificationToast(
            "Navbar Limit Reached! 📌",
            "You can pin up to 4 tabs to your mobile bottom bar. Unpin an existing tab first.",
            "info"
          );
          return prev;
        }
        const updated = [...prev, tabId];
        localStorage.setItem("diet_pinned_mobile_tabs", JSON.stringify(updated));
        return updated;
      }
    });
  };

  const idToMatch = (id1: string, id2: string) => id1 === id2 ? id1 : id2;

  // --- REAL-TIME TODAY MACROS & CALORIE REMAINING MATH ---
  const todayStr = new Date().toISOString().split("T")[0];
  const todayMeals = mealLogs.filter(log => log.timestamp === todayStr);
  let eatenCalories = 0;
  let eatenProtein = 0;
  let eatenCarbs = 0;
  let eatenFat = 0;

  todayMeals.forEach((log) => {
    log.foods.forEach((loggedFood) => {
      const f = loggedFood.food;
      const servings = loggedFood.servings;
      eatenCalories += (f.calories || 0) * servings;
      eatenProtein += (f.protein || 0) * servings;
      eatenCarbs += (f.carbs || 0) * servings;
      eatenFat += (f.fat || 0) * servings;
    });
  });

  const todayExerciseCalories = exerciseLogs
    .filter(log => log.timestamp === todayStr)
    .reduce((sum, curr) => sum + curr.caloriesBurned, 0);

  const todayMacros = {
    calories: Math.round(eatenCalories),
    protein: Math.round(eatenProtein),
    carbs: Math.round(eatenCarbs),
    fat: Math.round(eatenFat),
    remainingCalories: Math.max(0, profile.dailyCalorieGoal - Math.round(eatenCalories) + todayExerciseCalories)
  };

  const handleToggleFast = (type: string, duration: number) => {
    if (activeFastingSession && activeFastingSession.isActive) {
      // Stop the fast
      setActiveFastingSession((prev) =>
        prev
          ? {
              ...prev,
              isActive: false,
              endTime: new Date().toISOString(),
            }
          : null
      );
    } else {
      // Start a fast
      const newSession: FastingSession = {
        id: `fast_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
        type,
        durationHours: duration,
        startTime: new Date().toISOString(),
        isActive: true,
      };
      setActiveFastingSession(newSession);
    }
  };

  // Dummy placeholder for recipes additions (passed to Section recipe creations)
  const handleAddRecipe = (recipe: Recipe) => {
    console.log("Adding dynamic recipe", recipe);
  };

  // Menu items array definition
  const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", shortLabel: "Dashboard", icon: LayoutDashboard },
    { id: "meals", label: "Log Food", shortLabel: "Meals", icon: PlusCircle },
    { id: "planner", label: "AI Planner", shortLabel: "Planner", icon: Calendar },
    { id: "weekly_planner", label: "Weekly Planner", shortLabel: "Weekly", icon: CalendarDays },
    { id: "recipes", label: "Recipes", shortLabel: "Recipes", icon: BookOpen },
    { id: "coach", label: "Coaching Guide", shortLabel: "Coach", icon: Sparkles },
    { id: "chats", label: "Dietitian Chat", shortLabel: "Chat", icon: MessageSquare },
    { id: "fasting", label: "Fasting", shortLabel: "Fasting", icon: Timer },
    { id: "water", label: "Water Log", shortLabel: "Water", icon: Droplet },
    { id: "exercise", label: "Exercise Log", shortLabel: "Workout", icon: Dumbbell },
    { id: "weight", label: "Weight Tracker", shortLabel: "Weight", icon: Scale },
    { id: "habits", label: "Habits Tracker", shortLabel: "Habits", icon: Award },
    { id: "grocery", label: "Grocery List", shortLabel: "Grocery", icon: ShoppingCart },
    { id: "challenges", label: "Challenges", shortLabel: "Awards", icon: Trophy },
    { id: "tracker", label: "Tracker & Reports", shortLabel: "Reports", icon: BarChart3 },
    { id: "profile", label: "My Profile", shortLabel: "Profile", icon: User },
  ];

  if (!isOnboarded) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-all ${darkMode ? "bg-gray-950 text-gray-100 dark" : "bg-gray-50/50 text-gray-800"}`}>
        {/* FLOATING PUSH NOTIFICATION SIMULATOR TOAST */}
        {notificationToast && (
          <div className="fixed top-5 right-5 z-50 max-w-sm w-full bg-white dark:bg-gray-900 border-l-4 border-emerald-500 shadow-2xl rounded-2xl p-4 flex gap-3 animate-slide-in items-start pointer-events-auto transition-all text-left">
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center shrink-0">
              <span className="text-sm">🔔</span>
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="font-extrabold text-gray-900 dark:text-white text-xs">{notificationToast.title}</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">{notificationToast.body}</p>
            </div>
            <button onClick={() => setNotificationToast(null)} className="text-gray-400 hover:text-gray-600 text-xs font-bold font-mono">×</button>
          </div>
        )}
        <Onboarding onComplete={handleOnboardingComplete} darkMode={darkMode} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans flex transition-all relative overflow-x-hidden ${darkMode ? "bg-gray-950 text-gray-100 dark" : "bg-gray-50 text-gray-800"}`}>
      
      {/* Decorative ambient glowing blobs for frosted glass look */}
      <div className="fixed -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl pointer-events-none z-0" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 rounded-full bg-teal-500/10 dark:bg-teal-500/5 blur-3xl pointer-events-none z-0" />
      <div className="fixed top-1/2 left-1/3 w-80 h-80 rounded-full bg-amber-500/5 dark:bg-amber-500/3 blur-3xl pointer-events-none z-0" />

      {/* FLOATING PUSH NOTIFICATION SIMULATOR TOAST */}
      {notificationToast && (
        <div className="fixed top-5 right-5 z-50 max-w-sm w-full bg-white/80 dark:bg-gray-900/80 border-l-4 border-emerald-500 shadow-2xl backdrop-blur-xl rounded-2xl p-4 flex gap-3 animate-slide-in items-start pointer-events-auto transition-all text-left">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
            <span className="text-sm">🔔</span>
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="font-extrabold text-gray-900 dark:text-white text-xs">{notificationToast.title}</h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">{notificationToast.body}</p>
          </div>
          <button onClick={() => setNotificationToast(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-xs font-bold font-mono">×</button>
        </div>
      )}
      
      {/* SIDEBAR: Desktop Layout */}
      <aside className={`hidden lg:flex flex-col w-64 shrink-0 border-r border-gray-100/60 dark:border-gray-900/60 fixed top-0 bottom-0 left-0 h-screen z-30 backdrop-blur-xl ${darkMode ? "bg-slate-900/50" : "bg-white/50"}`}>
        <div className="p-6 border-b border-gray-100/60 dark:border-gray-800/60 flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-black shadow-lg shadow-emerald-500/20">
            D
          </div>
          <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">DietaryHQ</span>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-extrabold rounded-2xl uppercase tracking-wider transition-all ${
                  activeTab === item.id
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/10"
                    : `text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50`
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer info block */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-3 text-left">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Zap className="w-4 h-4 text-emerald-500" />
            <span className="text-gray-500 dark:text-gray-400">Target Budget: {profile.dailyCalorieGoal} kcal</span>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center justify-between px-3 py-2 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <span>Theme Toggle</span>
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-500" />}
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER CONTENT SECTION */}
      <div className={`flex-1 flex flex-col min-w-0 lg:pl-64 ${activeTab === "chats" ? "lg:h-screen lg:overflow-hidden" : ""}`}>
        
        {/* TOP COMPACT BAR: Mobile Logo & Quick Theme selection */}
        <header className={`lg:hidden flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-900 ${darkMode ? "bg-gray-900" : "bg-white"}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-extrabold">
              D
            </div>
            <span className="font-black text-base text-emerald-600">DietaryHQ</span>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 border border-gray-100 dark:border-gray-800 rounded-xl"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-500" />}
          </button>
        </header>

        {/* Dynamic sub-tab viewport */}
        <main className={`flex-grow min-w-0 ${activeTab === "chats" ? "w-full max-w-full p-0 flex flex-col h-[calc(100vh-4.5rem)] lg:h-screen overflow-hidden pb-[4.5rem] lg:pb-0" : "p-6 md:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8 overflow-x-hidden"}`}>
          {activeTab === "dashboard" && (
            <Dashboard
              profile={profile}
              mealLogs={mealLogs}
              waterLogs={waterLogs}
              exerciseLogs={exerciseLogs}
              weightLogs={weightLogs}
              habits={habits}
              onAddWater={handleAddWater}
              onAddExercise={handleAddExercise}
              onAddWeight={handleAddWeight}
              onToggleHabit={handleToggleHabit}
              onTriggerNotification={triggerNotificationToast}
              aiNutritionTip={aiNutritionTip}
              loadingAiTip={loadingAiTip}
            />
          )}

          {activeTab === "meals" && (
            <MealLogger
              profile={profile}
              mealLogs={mealLogs}
              onAddMealLog={handleAddMealLog}
              onRemoveMealLog={handleRemoveMealLog}
            />
          )}

          {activeTab === "recipes" && (
            <RecipeSection
              profile={profile}
              onAddCustomRecipe={handleAddRecipe}
              onAddMealLog={handleAddMealLog}
            />
          )}

          {activeTab === "coach" && (
            <AICoach
              profile={profile}
              todayMacros={todayMacros}
              onNavigateToChat={() => setActiveTab("chats")}
            />
          )}

          {activeTab === "chats" && (
            <AICoachChat
              profile={profile}
              todayMacros={todayMacros}
              messages={messages}
              setMessages={setMessages}
            />
          )}

          {activeTab === "fasting" && (
            <FastingTracker
              onToggleFast={handleToggleFast}
              activeSession={activeFastingSession}
            />
          )}

          {activeTab === "planner" && (
            <MealPlanner
              profile={profile}
              onAddMealLog={handleAddMealLog}
              onAddGroceryItem={handleAddGroceryItem}
              onGenerateGroceryList={handleGenerateGroceryFromPlanner}
            />
          )}

          {activeTab === "weekly_planner" && (
            <WeeklyMealPlanner
              profile={profile}
              onAddMealLog={handleAddMealLog}
              onGenerateGroceryList={handleGenerateGroceryFromPlanner}
            />
          )}

          {activeTab === "grocery" && (
            <GrocerySection
              groceryList={groceryList}
              setGroceryList={setGroceryList}
            />
          )}

          {activeTab === "profile" && (
            <UserProfileComponent
              profile={profile}
              onUpdate={handleUpdateProfile}
              mealLogs={mealLogs}
              weightLogs={weightLogs}
            />
          )}

          {activeTab === "challenges" && (
            <Challenges
              profile={profile}
              mealLogs={mealLogs}
              waterLogs={waterLogs}
              exerciseLogs={exerciseLogs}
              onTriggerNotification={triggerNotificationToast}
            />
          )}

          {activeTab === "tracker" && (
            <AnalyticsReports
              profile={profile}
              mealLogs={mealLogs}
              waterLogs={waterLogs}
              exerciseLogs={exerciseLogs}
              weightLogs={weightLogs}
            />
          )}

          {activeTab === "water" && (
            <WaterTracker
              profile={profile}
              waterLogs={waterLogs}
              onAddWater={handleAddWater}
              onRemoveWater={handleRemoveWater}
            />
          )}

          {activeTab === "exercise" && (
            <ExerciseTracker
              profile={profile}
              exerciseLogs={exerciseLogs}
              onAddExercise={handleAddExercise}
              onRemoveExercise={handleRemoveExercise}
            />
          )}

          {activeTab === "weight" && (
            <WeightTracker
              profile={profile}
              weightLogs={weightLogs}
              onAddWeight={handleAddWeight}
              onRemoveWeight={handleRemoveWeight}
              onUpdateProfile={handleUpdateProfile}
            />
          )}

          {activeTab === "habits" && (
            <HabitsTracker
              habits={habits}
              onToggleHabit={handleToggleHabit}
              onAddHabit={handleAddHabit}
              onRemoveHabit={handleRemoveHabit}
            />
          )}
        </main>

        {/* BOTTOM NAVIGATION: Mobile Layout */}
        <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-gray-150 dark:border-gray-900/60 flex justify-around items-center px-1.5 py-2.5 pb-safe shadow-[0_-12px_28px_rgba(0,0,0,0.05)] backdrop-blur-md ${darkMode ? "bg-gray-950/90" : "bg-white/90"}`}>
          {NAV_ITEMS.filter(item => pinnedTabs.includes(item.id)).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id && !isMobileMenuOpen;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-all relative ${
                  isActive ? "text-emerald-500 font-black scale-105" : "text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {isActive && (
                  <motion.span 
                    layoutId="activeTabPill"
                    className="absolute -top-2.5 w-7 h-1 bg-emerald-500 rounded-full"
                  />
                )}
                <Icon className="w-5 h-5" />
                <span className="text-[8px] uppercase font-black tracking-widest mt-0.5 leading-none">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
          
          <button
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-all relative ${
              isMobileMenuOpen || !pinnedTabs.includes(activeTab)
                ? "text-emerald-500 font-black scale-105"
                : "text-gray-400"
            }`}
          >
            {(isMobileMenuOpen || !pinnedTabs.includes(activeTab)) && (
              <motion.span 
                layoutId="activeTabPill"
                className="absolute -top-2.5 w-7 h-1 bg-emerald-500 rounded-full"
              />
            )}
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[8px] uppercase font-black tracking-widest mt-0.5 leading-none">More</span>
          </button>
        </nav>

        {/* MOBILE SLIDE-UP DRAWER FOR ADDITIONAL NAV ITEMS */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
            {/* Backdrop click to dismiss */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsCustomizingNav(false);
              }}
            />
            
            {/* Drawer Body */}
            <div className={`relative z-10 w-full rounded-t-3xl border-t p-6 shadow-2xl transition-transform max-h-[85vh] overflow-y-auto ${
              darkMode ? "bg-gray-950 border-gray-900 text-white" : "bg-white border-gray-100 text-gray-800"
            }`}>
              {/* Pill Drag handle */}
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-800 rounded-full mx-auto mb-5" />
              
              <div className="flex justify-between items-center mb-5 gap-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    {isCustomizingNav ? "📌 Pin to bottom (Max 4)" : "Explore DietaryHQ"}
                  </h4>
                  {isCustomizingNav && (
                    <p className="text-[9px] text-amber-500 font-bold mt-0.5">Toggle star to pin/unpin</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={() => setIsCustomizingNav(!isCustomizingNav)}
                    className={`text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      isCustomizingNav 
                        ? "bg-amber-500 text-white" 
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {isCustomizingNav ? "Done" : "⚙️ Customize"}
                  </button>
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsCustomizingNav(false);
                    }}
                    className="text-xs font-extrabold text-emerald-500 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Grid of all tabs */}
              <div className="grid grid-cols-3 gap-2.5 mb-6">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const isPinned = pinnedTabs.includes(item.id);
                  return (
                    <div key={item.id} className="relative">
                      <button
                        onClick={() => {
                          if (isCustomizingNav) {
                            togglePinnedTab(item.id);
                          } else {
                            setActiveTab(item.id);
                            setIsMobileMenuOpen(false);
                          }
                        }}
                        className={`w-full flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all ${
                          isActive && !isCustomizingNav
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/10 font-bold" 
                            : "bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        <Icon className={`w-5.5 h-5.5 mb-1.5 ${isActive && !isCustomizingNav ? "text-white" : "text-emerald-500"}`} />
                        <span className="text-[9px] font-black text-center uppercase tracking-wider leading-tight">
                          {item.label}
                        </span>
                      </button>
                      
                      {/* Interactive pin badge */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePinnedTab(item.id);
                        }}
                        className={`absolute -top-1.5 -right-1.5 p-1 rounded-full shadow-md border text-[10px] leading-none transition-transform hover:scale-110 cursor-pointer ${
                          isPinned 
                            ? "bg-amber-400 border-amber-300 text-white" 
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400"
                        }`}
                        title={isPinned ? "Unpin tab" : "Pin tab"}
                      >
                        {isPinned ? "★" : "☆"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
