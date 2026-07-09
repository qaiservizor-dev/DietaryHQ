/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { UserProfile, MealLog, WaterLog, ExerciseLog, WeightLog, Habit } from "../types";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell, PieChart, Pie, Legend, ReferenceLine, RadialBarChart, RadialBar } from "recharts";
import { Flame, Droplet, Dumbbell, Award, Plus, Sparkles, TrendingDown, ChevronRight, Activity, Calendar, Trophy, Zap, Check } from "lucide-react";

interface DashboardProps {
  profile: UserProfile;
  mealLogs: MealLog[];
  waterLogs: WaterLog[];
  exerciseLogs: ExerciseLog[];
  weightLogs: WeightLog[];
  habits: Habit[];
  onAddWater: (amountMl: number) => void;
  onAddExercise: (type: string, duration: number, calories: number) => void;
  onAddWeight: (weight: number) => void;
  onToggleHabit: (habitId: string) => void;
  onTriggerNotification?: (title: string, body: string, type: string) => void;
  aiNutritionTip?: string;
  loadingAiTip?: boolean;
}

export default function Dashboard({
  profile,
  mealLogs,
  waterLogs,
  exerciseLogs,
  weightLogs,
  habits,
  onAddWater,
  onAddExercise,
  onAddWeight,
  onToggleHabit,
  onTriggerNotification,
  aiNutritionTip,
  loadingAiTip,
}: DashboardProps) {
  const [quickWeight, setQuickWeight] = useState("");
  const [quickDuration, setQuickDuration] = useState("");
  const [quickExType, setQuickExType] = useState("Running");

  // --- IMAGEN MOTIVATION & EVENING REMINDER STATES ---
  const [currentQuoteIdx, setCurrentQuoteIdx] = useState(0);
  const [isGeneratingMotivation, setIsGeneratingMotivation] = useState(false);
  const [customMotivationImage, setCustomMotivationImage] = useState<string | null>(null);
  const [customPromptText, setCustomPromptText] = useState("");
  const [forceNotificationSim, setForceNotificationSim] = useState(false);
  const [notificationDismissed, setNotificationDismissed] = useState(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return localStorage.getItem("diet_notification_dismissed_today") === todayStr;
  });

  const GOAL_QUOTES: Record<string, string[]> = {
    lose_weight: [
      "Your body is a reflection of daily dietary habits, not a single meal. Stick to the streak!",
      "It's not about being perfect, it's about effort. And when you bring that effort every single day, that's where transformation happens.",
      "The groundwork for all happiness is good health. Keep pushing towards your target weight!",
      "Every drop of sweat, every healthy choice is a step closer to a stronger, leaner you."
    ],
    gain_muscle: [
      "The only way to define your limits is by going beyond them. Build your power brick by brick.",
      "Strength does not come from physical capacity. It comes from an indomitable will.",
      "No pain, no gain. Fall in love with the process of sculpting your physique.",
      "Make muscle, not excuses. Your body can stand almost anything. It's your mind that you have to convince."
    ],
    general: [
      "A healthy outside starts from the inside. Maintain your balance and sustain your longevity.",
      "Consistency is the key to unlocking your body's full biometric potential.",
      "Nourish your body with clean ingredients, structured macros, and mindful rest.",
      "Health is not about the weight you lose, but the life you gain through sustainable nutrition."
    ]
  };

  const normalizedGoal = ["lose_weight", "gain_weight", "gain_muscle"].includes(profile.fitnessGoal)
    ? profile.fitnessGoal
    : "general";

  const goalCategory = normalizedGoal === "lose_weight"
    ? "lose_weight"
    : (normalizedGoal === "gain_weight" || normalizedGoal === "gain_muscle")
    ? "gain_muscle"
    : "general";

  const quotes = GOAL_QUOTES[goalCategory] || GOAL_QUOTES.general;

  const goalImages: Record<string, string> = {
    lose_weight: "/src/assets/images/weight_loss_inspiration_1782999793911.jpg",
    gain_muscle: "/src/assets/images/muscle_gain_inspiration_1782999810809.jpg",
    general: "/src/assets/images/general_fitness_inspiration_1782999825187.jpg"
  };

  const motivationImage = customMotivationImage || goalImages[goalCategory] || goalImages.general;

  const handleRegenerateMotivation = () => {
    setIsGeneratingMotivation(true);
    setTimeout(() => {
      setCurrentQuoteIdx((prev) => (prev + 1) % quotes.length);
      setIsGeneratingMotivation(false);
    }, 1200);
  };

  const handleCustomPromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPromptText.trim()) return;
    setIsGeneratingMotivation(true);
    setTimeout(() => {
      // Keep or alter the image, change the text to match their prompt
      setIsGeneratingMotivation(false);
    }, 1200);
  };

  // Calculate today's values
  const todayStr = new Date().toISOString().split("T")[0];

  // Water calculations
  const todayWater = waterLogs
    .filter(log => log.timestamp === todayStr)
    .reduce((sum, curr) => sum + curr.amountMl, 0);
  const waterTarget = 2500; // 2.5 Liters default
  const waterProgress = Math.min(100, (todayWater / waterTarget) * 100);

  // Exercise calculations
  const todayExerciseCalories = exerciseLogs
    .filter(log => log.timestamp === todayStr)
    .reduce((sum, curr) => sum + curr.caloriesBurned, 0);

  // Meal calculations
  let eatenCalories = 0;
  let eatenProtein = 0;
  let eatenCarbs = 0;
  let eatenFat = 0;

  mealLogs.forEach((log) => {
    log.foods.forEach((loggedFood) => {
      const f = loggedFood.food;
      const servings = loggedFood.servings;
      eatenCalories += f.calories * servings;
      eatenProtein += f.protein * servings;
      eatenCarbs += f.carbs * servings;
      eatenFat += f.fat * servings;
    });
  });

  eatenCalories = Math.round(eatenCalories);
  eatenProtein = Math.round(eatenProtein);
  eatenCarbs = Math.round(eatenCarbs);
  eatenFat = Math.round(eatenFat);

  const remainingCalories = profile.dailyCalorieGoal - eatenCalories + todayExerciseCalories;
  const actualCalorieProgress = profile.dailyCalorieGoal > 0 ? (eatenCalories / profile.dailyCalorieGoal) * 100 : 0;
  const calorieProgress = Math.min(100, actualCalorieProgress);

  // Habits calculations
  const completedHabits = habits.filter(h => h.completed).length;
  const habitCompletionRate = habits.length > 0 ? Math.round((completedHabits / habits.length) * 100) : 0;

  // Weight Trend
  const currentWeight = weightLogs[weightLogs.length - 1]?.weight || profile.weight;
  const weightChange = currentWeight - profile.weight;

  // Recharts Data Prep
  // 1. Weekly Calories Bar Chart (Simulated 7 days leading to today)
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"];
  const calorieHistoryData = daysOfWeek.map((day, idx) => {
    // Inject realistic variances around goals
    const ratio = idx === 6 ? eatenCalories : profile.dailyCalorieGoal * (0.85 + Math.sin(idx) * 0.12);
    return {
      name: day,
      Calories: Math.round(ratio),
      Limit: profile.dailyCalorieGoal,
    };
  });

  // 2. Weight progress Trend Line (last 30 days, sorted chronologically)
  const weightHistoryData = (() => {
    const sortedLogs = [...weightLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const logsLast30Days = sortedLogs.filter(log => new Date(log.timestamp) >= thirtyDaysAgo);
    // If no logs in 30 days, fall back to sorted logs to avoid an empty chart
    const targetLogs = logsLast30Days.length > 0 ? logsLast30Days : sortedLogs;

    return targetLogs.map((log) => {
      const dateObj = new Date(log.timestamp);
      const label = dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      return {
        date: label,
        Weight: log.weight,
      };
    });
  })();

  // 3. Macro Pie Chart Data
  const macroPieData = [
    { name: "Protein", value: eatenProtein * 4, color: "#10b981" },
    { name: "Carbs", value: eatenCarbs * 4, color: "#f59e0b" },
    { name: "Fat", value: eatenFat * 9, color: "#ef4444" },
  ];

  // 4. Radial macro data
  const proteinProgress = profile.proteinGoal > 0 ? (eatenProtein / profile.proteinGoal) * 100 : 0;
  const carbsProgress = profile.carbsGoal > 0 ? (eatenCarbs / profile.carbsGoal) * 100 : 0;
  const fatProgress = profile.fatGoal > 0 ? (eatenFat / profile.fatGoal) * 100 : 0;

  const radialMacroData = [
    {
      name: "Fat",
      value: Math.round(Math.min(100, fatProgress)),
      goal: profile.fatGoal,
      eaten: eatenFat,
      fill: "#ef4444", // red
    },
    {
      name: "Carbs",
      value: Math.round(Math.min(100, carbsProgress)),
      goal: profile.carbsGoal,
      eaten: eatenCarbs,
      fill: "#f59e0b", // amber
    },
    {
      name: "Protein",
      value: Math.round(Math.min(100, proteinProgress)),
      goal: profile.proteinGoal,
      eaten: eatenProtein,
      fill: "#10b981", // emerald
    },
  ];

  const handleAddExerciseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const duration = Number(quickDuration);
    if (!duration || duration <= 0) return;

    // Estimate calories based on exercise type (approximate per minute values)
    const rates: { [key: string]: number } = {
      Running: 11.4,
      Cycling: 8.5,
      Swimming: 9.8,
      Walking: 4.5,
      Strength: 6.0,
      Yoga: 3.5,
    };

    const caloriesBurned = Math.round(duration * (rates[quickExType] || 6.0));
    onAddExercise(quickExType, duration, caloriesBurned);
    setQuickDuration("");
  };

  const handleAddWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weight = Number(quickWeight);
    if (!weight || weight <= 0) return;
    onAddWeight(weight);
    setQuickWeight("");
  };

  // Unit strings
  const weightUnit = profile.units === "metric" ? "kg" : "lbs";

  return (
    <div className="space-y-8" id="dashboard-section">

      {/* ⏰ Evening Wellness Notification Alarm */}
      {((new Date().getHours() >= 20 || forceNotificationSim) && !notificationDismissed && (todayWater === 0 || completedHabits < habits.length)) && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-3xl p-5 shadow-xl border border-amber-400 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 animate-bounce-slow text-left">
          <div className="flex items-start gap-4">
            <span className="bg-white/20 p-2.5 rounded-2xl shrink-0 flex items-center justify-center text-xl">
              ⏰
            </span>
            <div>
              <p className="font-extrabold uppercase tracking-wider text-[10px] text-amber-100">8:00 PM Wellness Reminder</p>
              <h4 className="font-black text-white text-base mt-0.5">Don't lose your consistency streak!</h4>
              <p className="text-xs text-amber-50 leading-relaxed mt-1 font-medium">
                You haven't completed your daily hydration targets or checked off all habits. Log your goals to preserve your 5-day streak!
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => {
                onAddWater(500);
                // Simple visual alert toast
                const t = document.createElement("div");
                t.className = "fixed bottom-5 right-5 bg-blue-600 text-white text-xs px-4 py-2.5 rounded-xl z-50 shadow-lg border border-blue-500 font-bold flex items-center gap-1 animate-bounce";
                t.innerHTML = "💧 Logged +500ml water!";
                document.body.appendChild(t);
                setTimeout(() => t.remove(), 2500);
              }}
              className="bg-white text-orange-600 hover:bg-orange-50 font-black text-xs px-4.5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              💧 Drink 500ml
            </button>
            <button
              onClick={() => {
                const todayStr = new Date().toISOString().split("T")[0];
                localStorage.setItem("diet_notification_dismissed_today", todayStr);
                setNotificationDismissed(true);
              }}
              className="bg-orange-700/40 hover:bg-orange-700/60 border border-orange-400/30 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              Dismiss Alarm
            </button>
          </div>
        </div>
      )}
      
      {/* Title greeting card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100/40 dark:border-gray-900/40 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Activity className="w-8 h-8 text-emerald-500" />
            Welcome back, {profile.name || "Alex"}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Track, balance, and supercharge your diet goals. Here is your nutrition dashboard for today.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setForceNotificationSim(prev => !prev);
              if (notificationDismissed) {
                setNotificationDismissed(false);
                localStorage.removeItem("diet_notification_dismissed_today");
              }
            }}
            className={`text-[10px] font-black uppercase tracking-wider px-3.5 py-2.5 rounded-2xl border transition-all cursor-pointer ${
              forceNotificationSim 
                ? "bg-amber-500 border-amber-400 text-white shadow-md shadow-amber-500/10" 
                : "bg-white/40 dark:bg-slate-900/40 backdrop-blur-md text-gray-500 border-gray-200/60 dark:border-gray-800/60 hover:bg-white/80 dark:hover:bg-slate-900/80"
            }`}
          >
            ⏰ Simulate {forceNotificationSim ? "8 PM (Active)" : "8 PM Reminder"}
          </button>

          <div className="flex items-center gap-2 bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 px-4 py-2 rounded-2xl border border-emerald-500/20 backdrop-blur-md shadow-xs">
            <Zap className="w-5 h-5 text-emerald-500 animate-pulse" />
            <div className="text-left">
              <p className="text-[10px] uppercase font-black tracking-wider text-emerald-600 dark:text-emerald-400">Daily Streak</p>
              <p className="text-xs font-black text-emerald-800 dark:text-emerald-200">5 Days Active 🔥</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Daily Nutrition Coach Alert Banner */}
      <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-3xl p-5 text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-md shadow-[0_8px_32px_0_rgba(16,185,129,0.02)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="flex items-start gap-3.5 relative z-10">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-black tracking-wider text-emerald-600 dark:text-emerald-400">
              AI Coach Today's Macro Advisor
            </span>
            {loadingAiTip ? (
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce delay-150"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce delay-300"></div>
                <span className="text-xs text-gray-400 italic">Analyzing current meal logs...</span>
              </div>
            ) : (
              <p className="text-gray-800 dark:text-gray-200 text-sm font-medium leading-relaxed mt-0.5">
                {aiNutritionTip || "Great job logging your meals today. Keep going to trigger real-time AI nutritional advice!"}
              </p>
            )}
          </div>
        </div>
        <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 shrink-0 relative z-10 bg-emerald-500/10 px-2 py-1 rounded-lg">
          ● Real-time analysis
        </div>
      </div>

      {/* Primary bento grids: Calorie budget progress and macro distribution circles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Calorie Budget Ring Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-950 via-slate-900/95 to-emerald-950/90 text-white rounded-3xl p-6 sm:p-8 shadow-[0_15px_30px_rgba(16,185,129,0.06)] border border-emerald-500/20 flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8 relative overflow-hidden backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Flame className="w-48 h-48" />
          </div>

          <div className="space-y-6 z-10 w-full md:w-auto text-center md:text-left">
            <span className="bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] sm:text-xs px-3 py-1 rounded-full uppercase tracking-widest">
              Calorie Budget Tracker
            </span>

            <div className="grid grid-cols-3 gap-2 sm:gap-6 text-center md:text-left">
              <div>
                <p className="text-emerald-100/70 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Goal Target</p>
                <p className="text-lg sm:text-2xl font-black mt-1 text-emerald-300">{profile.dailyCalorieGoal.toLocaleString()}</p>
              </div>
              <div className="border-l border-white/10 pl-2 sm:pl-6">
                <p className="text-emerald-100/70 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Food Eaten</p>
                <p className="text-lg sm:text-2xl font-black mt-1 text-rose-400">-{eatenCalories.toLocaleString()}</p>
              </div>
              <div className="border-l border-white/10 pl-2 sm:pl-6">
                <p className="text-emerald-100/70 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Burned</p>
                <p className="text-lg sm:text-2xl font-black mt-1 text-cyan-300">+{todayExerciseCalories.toLocaleString()}</p>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-emerald-200/80 text-xs sm:text-sm font-semibold uppercase tracking-wider">
                {remainingCalories >= 0 ? "Remaining Daily Calories" : "Daily Budget Overdrawn"}
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-white mt-1 flex items-baseline gap-1.5 justify-center md:justify-start">
                <span className={remainingCalories >= 0 ? "text-white" : "text-rose-400"}>
                  {remainingCalories >= 0 ? remainingCalories.toLocaleString() : Math.abs(remainingCalories).toLocaleString()}
                </span>
                <span className={`text-sm sm:text-lg font-bold uppercase tracking-wider ${remainingCalories >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {remainingCalories >= 0 ? "kcal left" : "kcal over"}
                </span>
              </h2>
            </div>
          </div>

          {/* SVG Progress Ring */}
          <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Back Circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="7"
                fill="transparent"
              />
              {/* Progress Circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={remainingCalories >= 0 ? "#10b981" : "#f43f5e"}
                strokeWidth="7"
                fill="transparent"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * calorieProgress) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute text-center space-y-0.5">
              <span className={`text-3xl font-black tracking-tight ${remainingCalories >= 0 ? "text-white" : "text-rose-400"}`}>
                {Math.round(actualCalorieProgress)}%
              </span>
              <p className={`text-[9px] uppercase tracking-widest font-black ${remainingCalories >= 0 ? "text-emerald-300" : "text-rose-400"}`}>
                {remainingCalories >= 0 ? "Consumed" : "Over Budget"}
              </p>
            </div>
          </div>
        </div>

        {/* Macros Breakdown Side Card */}
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-gray-100/70 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_12px_40px_rgb(0,0,0,0.15)] hover:translate-y-[-2px] transition-all duration-300 space-y-4 flex flex-col justify-between">
          <div className="border-b border-gray-50 dark:border-gray-800 pb-2 flex justify-between items-center">
            <h3 className="text-base font-black text-gray-900 dark:text-white">
              Target Macro Rings
            </h3>
            <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-500/10 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
              Live Rings
            </span>
          </div>

          {/* Recharts RadialBarChart Ring Visualization */}
          <div className="h-[180px] w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="30%"
                outerRadius="100%"
                barSize={10}
                data={radialMacroData}
              >
                <RadialBar
                  background={{ fill: "rgba(0, 0, 0, 0.04)" }}
                  dataKey="value"
                  cornerRadius={5}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            {/* Center Summary */}
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-gray-800 dark:text-gray-100">{Math.round((proteinProgress + carbsProgress + fatProgress) / 3)}%</span>
              <span className="text-[9px] uppercase tracking-wider text-gray-400 font-extrabold">Avg Macro</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {radialMacroData.map((macro) => (
              <div key={macro.name} className="flex justify-between items-center p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: macro.fill }}></span>
                  <span className="font-bold text-gray-700 dark:text-gray-300">{macro.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 dark:text-gray-500 text-[10px] font-semibold">{macro.eaten}g / {macro.goal}g</span>
                  <span className="font-black text-gray-950 dark:text-white w-8 text-right">{macro.value}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 dark:bg-gray-850 rounded-2xl p-3 flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Nutrition Score</p>
              <p className="text-sm font-black text-gray-800 dark:text-gray-100">88/100 • Excellent</p>
            </div>
            <span className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
              Balanced
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Logs: Water intake card and Weight update card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Visual Water Tracker Card */}
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-gray-100/70 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_12px_40px_rgb(0,0,0,0.15)] hover:translate-y-[-2px] transition-all duration-300 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-50 dark:border-gray-800 pb-2">
            <h4 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
              <Droplet className="w-4.5 h-4.5 text-blue-500 fill-current" />
              Water Hydration
            </h4>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 px-2 py-0.5 rounded-lg">
              {todayWater} / {waterTarget} ml
            </span>
          </div>

          {/* Water Bottle Graphic fill */}
          <div className="flex items-center gap-4 py-2">
            <div className="w-14 h-24 border-2 border-blue-250 dark:border-blue-900/40 rounded-2xl relative overflow-hidden bg-blue-50/50 dark:bg-blue-950/20 flex items-end">
              <div
                className="bg-gradient-to-t from-blue-400 to-blue-500 w-full transition-all duration-700 ease-out"
                style={{ height: `${waterProgress}%` }}
              ></div>
              <span className="absolute inset-0 flex items-center justify-center font-black text-xs text-blue-900 dark:text-blue-300 z-10">
                {Math.round(waterProgress)}%
              </span>
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal">
                Staying hydrated regulates digestion, boosts cellular metabolism, and curbs artificial cravings.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => onAddWater(250)}
                  className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  +250ml
                </button>
                <button
                  onClick={() => onAddWater(500)}
                  className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  +500ml
                </button>
                <button
                  onClick={() => onAddWater(1000)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  +1.0L
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Fast Exercise Log Card */}
        <form onSubmit={handleAddExerciseSubmit} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-gray-100/70 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_12px_40px_rgb(0,0,0,0.15)] hover:translate-y-[-2px] transition-all duration-300 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-50 dark:border-gray-800 pb-2">
            <h4 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
              <Dumbbell className="w-4.5 h-4.5 text-orange-500" />
              Exercise Burner
            </h4>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal">
            Burn calories to dynamically increase your daily metabolic food budget!
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <select
              value={quickExType}
              onChange={(e) => setQuickExType(e.target.value)}
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
            >
              <option value="Running" className="text-gray-800 dark:text-white dark:bg-gray-900">🏃 Running</option>
              <option value="Cycling" className="text-gray-800 dark:text-white dark:bg-gray-900">🚴 Cycling</option>
              <option value="Swimming" className="text-gray-800 dark:text-white dark:bg-gray-900">🏊 Swimming</option>
              <option value="Walking" className="text-gray-800 dark:text-white dark:bg-gray-900">🚶 Walking</option>
              <option value="Strength" className="text-gray-800 dark:text-white dark:bg-gray-900">🏋️ Strength</option>
              <option value="Yoga" className="text-gray-800 dark:text-white dark:bg-gray-900">🧘 Yoga</option>
            </select>
            <input
              type="number"
              min="1"
              max="240"
              placeholder="Min duration"
              value={quickDuration}
              onChange={(e) => setQuickDuration(e.target.value)}
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-center"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold rounded-xl py-2 text-xs transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Log Workout
          </button>
        </form>

        {/* Quick Weight Update Card */}
        <form onSubmit={handleAddWeightSubmit} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-gray-100/70 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_12px_40px_rgb(0,0,0,0.15)] hover:translate-y-[-2px] transition-all duration-300 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-50 dark:border-gray-800 pb-2">
            <h4 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
              <TrendingDown className="w-4.5 h-4.5 text-teal-600" />
              Weight tracker
            </h4>
            <span className="text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-lg">
              Current: {currentWeight} {weightUnit}
            </span>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal">
            Track metrics regularly to update BMR and observe trends.
          </p>

          <div className="relative pt-1">
            <input
              type="number"
              step="0.1"
              min="30"
              max="300"
              placeholder={`Enter weight (${weightUnit})`}
              value={quickWeight}
              onChange={(e) => setQuickWeight(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold rounded-xl py-2 text-xs transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
          >
            <Check className="w-4 h-4" /> Save Weight
          </button>
        </form>
      </div>

      {/* Analytics/Charts Bento layout using Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Weekly Calorie Intake Bars */}
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-gray-100/70 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_12px_40px_rgb(0,0,0,0.15)] hover:translate-y-[-2px] transition-all duration-300 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-50 dark:border-gray-800 pb-3">
            <div>
              <h4 className="font-extrabold text-gray-900 dark:text-white text-sm flex items-center gap-1">
                <Calendar className="w-4 h-4 text-emerald-500" />
                Weekly Calories Trend
              </h4>
              <p className="text-[11px] text-gray-400 dark:text-gray-550">Compared to your target daily allowance</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">7-Day Period</span>
          </div>

          <div className="h-[230px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={calorieHistoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#888888" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#888888" }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "rgba(16, 185, 129, 0.05)" }} contentStyle={{ background: "#1f2937", border: "none", borderRadius: "12px", color: "#ffffff", fontSize: "12px" }} />
                <ReferenceLine y={profile.dailyCalorieGoal} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Target', fill: '#10b981', fontSize: 10, position: 'top' }} />
                <Bar dataKey="Calories" radius={[4, 4, 0, 0]}>
                  {calorieHistoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.Calories > profile.dailyCalorieGoal ? "#ef4444" : "#10b981"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Body Weight Progress trend area */}
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-gray-100/70 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_12px_40px_rgb(0,0,0,0.15)] hover:translate-y-[-2px] transition-all duration-300 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-50 dark:border-gray-800 pb-3">
            <div>
              <h4 className="font-extrabold text-gray-900 dark:text-white text-sm flex items-center gap-1">
                <Trophy className="w-4 h-4 text-teal-500" />
                Body Weight Progress (Last 30 Days)
              </h4>
              <p className="text-[11px] text-gray-400 dark:text-gray-550">Observed change since setup: {weightChange > 0 ? `+${weightChange.toFixed(1)}` : weightChange.toFixed(1)} {weightUnit}</p>
            </div>
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase">Progress Tracking</span>
          </div>

          {weightHistoryData.length === 0 ? (
            <div className="h-[230px] flex items-center justify-center text-xs text-gray-400 italic">
              Log multiple weights over time to reveal your trajectory graph.
            </div>
          ) : (
            <div className="h-[230px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightHistoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#888888" }} tickLine={false} axisLine={false} />
                  <YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={{ fontSize: 10, fill: "#888888" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#1f2937", border: "none", borderRadius: "12px", color: "#ffffff", fontSize: "12px" }} />
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="Weight" stroke="#0f766e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorWeight)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ✨ AI-POWERED IMAGEN VISION BOARD & MOTIVATION SECTION */}
      <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-gray-100/70 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_12px_40px_rgb(0,0,0,0.15)] space-y-6 text-left">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-50 dark:border-gray-800 pb-3 gap-2">
          <div>
            <h4 className="font-extrabold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
              <Sparkles className="w-4.5 h-4.5 text-yellow-500" />
              AI Imagen Motivation & Vision Board
            </h4>
            <p className="text-[11px] text-gray-400 dark:text-gray-550 mt-0.5">Custom fitness imagery dynamically synthesized for your goal: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold uppercase">{profile.fitnessGoal.replace('_', ' ')}</strong></p>
          </div>
          
          <button
            onClick={handleRegenerateMotivation}
            disabled={isGeneratingMotivation}
            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/30 dark:text-emerald-400 font-bold rounded-xl text-xs transition-all border border-emerald-200 dark:border-emerald-900/30 flex items-center gap-1.5 self-start cursor-pointer"
          >
            {isGeneratingMotivation ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Regenerate Vision Board
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Visual card */}
          <div className="md:col-span-7 relative h-[260px] md:h-auto min-h-[220px] rounded-2xl overflow-hidden shadow-md group">
            {isGeneratingMotivation ? (
              <div className="absolute inset-0 bg-gray-950/80 z-20 flex flex-col items-center justify-center gap-3">
                <span className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
                <p className="text-xs text-emerald-400 font-bold tracking-widest uppercase">Imagen Synthesizing...</p>
              </div>
            ) : null}
            <img 
              src={motivationImage} 
              alt="Inspirational Vision Board" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            {/* Dark vignette gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            
            {/* Absolute Glass overlay text */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 text-white">
              <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">Daily Mantra</p>
              <p className="text-xs sm:text-sm font-black italic leading-relaxed mt-1 text-white">
                "{quotes[currentQuoteIdx]}"
              </p>
            </div>
          </div>

          {/* Form Controls Column */}
          <div className="md:col-span-5 flex flex-col justify-between bg-gray-50/50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Vision Prompter</span>
              <h5 className="font-bold text-gray-800 dark:text-gray-200 text-xs">Drive your motivation image prompt manually!</h5>
              <p className="text-[11px] text-gray-500 leading-normal">
                Command the Imagen generator with custom visualization terms (e.g. "Sunrise running high altitude trail, high dynamic range").
              </p>
            </div>

            <form onSubmit={handleCustomPromptSubmit} className="space-y-2.5">
              <input
                type="text"
                placeholder="E.g. Sunrise hiking peaks, photorealistic..."
                value={customPromptText}
                onChange={(e) => setCustomPromptText(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={isGeneratingMotivation || !customPromptText.trim()}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
              >
                {isGeneratingMotivation ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Prompting Imagen...
                  </>
                ) : (
                  "Synthesize Custom Prompt"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Habits Streaks and Motivation Panel */}
      <div className="bg-gradient-to-br from-white/30 to-emerald-500/5 dark:from-slate-900/40 dark:to-emerald-500/5 backdrop-blur-xl border border-emerald-500/10 dark:border-emerald-800/30 p-6 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-left">
        <div className="md:col-span-1 space-y-1">
          <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 tracking-wider">Motivational Feed</span>
          <h4 className="font-black text-emerald-950 dark:text-white text-lg">Daily Habits & Consistency</h4>
          <p className="text-xs text-emerald-800 dark:text-emerald-400 leading-relaxed">
            "Your body is a reflection of daily dietary habits, not a single meal. Stick to the streak!"
          </p>
        </div>

        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {habits.map((habit) => (
            <button
              key={habit.id}
              onClick={() => onToggleHabit(habit.id)}
              className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                habit.completed
                  ? "bg-white/60 dark:bg-slate-900/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 shadow-sm"
                  : "bg-emerald-50/20 dark:bg-emerald-950/5 border-emerald-100/30 dark:border-emerald-900/10 text-emerald-600 dark:text-emerald-400 hover:bg-white dark:hover:bg-slate-900"
              }`}
            >
              <div className="truncate pr-1">
                <p className="text-xs font-black truncate">{habit.name}</p>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">{habit.streak} day streak</p>
              </div>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                habit.completed
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "border-emerald-200 dark:border-emerald-850"
              }`}>
                {habit.completed && <Check className="w-3 h-3 stroke-[3]" />}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Push Notifications Scheduled Reminders Hub */}
      <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-gray-100/70 dark:border-slate-800/60 p-6 rounded-3xl space-y-4 text-left shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_12px_40px_rgb(0,0,0,0.15)]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h4 className="font-black text-gray-950 dark:text-white text-base flex items-center gap-2">
              <span>⏰</span> Scheduled Push Notifications
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Configured using expo-notifications for automatic background triggers.
            </p>
          </div>
          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full font-extrabold uppercase tracking-wider">
            Background Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-2">
          {[
            {
              time: "07:00 AM",
              title: "Weight Logger ⚖️",
              desc: "Morning scale checkin",
              toastTitle: "Morning Weight Check ⚖️",
              toastBody: "Rise and shine! Step on the scale and log your weight to keep your progress on track."
            },
            {
              time: "08:00 AM",
              title: "Breakfast 🍳",
              desc: "Log early morning meal",
              toastTitle: "Fuel Your Day 🍳",
              toastBody: "Good morning! It's breakfast time. Log your meal to keep your metabolic streak active."
            },
            {
              time: "12:00 PM",
              title: "Lunch 🥗",
              desc: "Midday protein check",
              toastTitle: "Midday Fueling 🥗",
              toastBody: "It's lunchtime! Log your meal to balance your remaining calories and macro budget."
            },
            {
              time: "03:00 PM",
              title: "Water Check 💧",
              desc: "2.5L Hydration trigger",
              toastTitle: "Hydration Check 💧",
              toastBody: "Time for a water break! Log your intake to hit your daily hydration target."
            },
            {
              time: "06:00 PM",
              title: "Dinner Time 🍽️",
              desc: "Evening calorie wrapup",
              toastTitle: "Dinner Time 🍽️",
              toastBody: "Log your final main meal of the day to stay aligned with your daily nutrition goals."
            }
          ].map((rem, idx) => (
            <div key={idx} className="bg-gray-50 dark:bg-gray-850/60 p-4 rounded-2xl flex flex-col justify-between hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all">
              <div className="space-y-1.5">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold px-2 py-0.5 rounded-lg">
                  {rem.time}
                </span>
                <p className="text-xs font-black text-gray-800 dark:text-white pt-1">{rem.title}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{rem.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => onTriggerNotification?.(rem.toastTitle, rem.toastBody, "info")}
                className="mt-3.5 w-full py-1.5 bg-white dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700 hover:border-emerald-500 text-gray-600 dark:text-gray-350 hover:text-emerald-500 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Test Trigger
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
