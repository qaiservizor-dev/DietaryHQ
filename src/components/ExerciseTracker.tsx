import React, { useState } from "react";
import { ExerciseLog, UserProfile } from "../types";
import { Dumbbell, Plus, Trash2, Trophy, Clock, Flame, Calendar, Sparkles } from "lucide-react";

interface ExerciseTrackerProps {
  profile: UserProfile;
  exerciseLogs: ExerciseLog[];
  onAddExercise: (type: string, duration: number, calories: number) => void;
  onRemoveExercise: (logId: string) => void;
}

export default function ExerciseTracker({ profile, exerciseLogs, onAddExercise, onRemoveExercise }: ExerciseTrackerProps) {
  const [exType, setExType] = useState("Running");
  const [duration, setDuration] = useState("");
  const [customCalories, setCustomCalories] = useState("");
  const todayStr = new Date().toISOString().split("T")[0];

  const todayLogs = exerciseLogs.filter(log => log.timestamp === todayStr);
  const totalBurned = todayLogs.reduce((sum, curr) => sum + curr.caloriesBurned, 0);
  const totalMinutes = todayLogs.reduce((sum, curr) => sum + curr.durationMin, 0);

  // Calorie burn rate approximations per minute
  const MET_CALORIES: Record<string, number> = {
    Running: 11.4,
    Cycling: 8.5,
    Swimming: 9.8,
    Walking: 4.5,
    Strength: 6.0,
    Yoga: 3.5,
    Pilates: 4.0,
    Cardio: 8.0,
  };

  const handleCalculateCalories = (type: string, mins: number) => {
    const rate = MET_CALORIES[type] || 6.0;
    return Math.round(rate * mins);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(duration);
    if (isNaN(mins) || mins <= 0) return;

    let cal = parseInt(customCalories);
    if (isNaN(cal) || cal <= 0) {
      cal = handleCalculateCalories(exType, mins);
    }

    onAddExercise(exType, mins, cal);
    setDuration("");
    setCustomCalories("");
  };

  return (
    <div className="space-y-6 text-left" id="exercise-tracker-section">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-950 dark:text-white flex items-center gap-2">
            <Dumbbell className="w-8 h-8 text-orange-500" />
            Exercise & Activity Tracker
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Log your cardiovascular and strength workouts to dynamically increase your daily metabolic calorie budget.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-950/30 text-orange-800 dark:text-orange-400 px-4 py-2.5 rounded-2xl border border-orange-100 dark:border-orange-900/30 font-bold self-start">
          <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
          <span>Extra Calorie Budget: +{totalBurned} kcal</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form to log workout */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 pb-3">
            Log New Workout
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-gray-500 block mb-1">Activity Type</label>
              <select
                value={exType}
                onChange={(e) => setExType(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="Running">🏃 Running (high intensity)</option>
                <option value="Cycling">🚴 Cycling (moderate intensity)</option>
                <option value="Swimming">🏊 Swimming</option>
                <option value="Walking">🚶 Walking</option>
                <option value="Strength">🏋️ Strength & Weight Training</option>
                <option value="Yoga">🧘 Yoga & Flexibility</option>
                <option value="Pilates">🧘 Pilates</option>
                <option value="Cardio">⚡ Aerobics / Cardio Dance</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-gray-500 block mb-1">Duration (Min)</label>
                <input
                  type="number"
                  min="1"
                  max="360"
                  required
                  placeholder="E.g. 30"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-gray-500 block mb-1">Calories Burned</label>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  placeholder="Auto-estimate"
                  value={customCalories}
                  onChange={(e) => setCustomCalories(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="text-[10px] text-gray-400 italic bg-gray-50 dark:bg-gray-850 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800/40">
              * Leave calories empty for automated MET estimation based on standard metabolic equivalent rates.
            </div>

            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold rounded-xl py-2.5 text-xs transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Log Exercise Log
            </button>
          </form>
        </div>

        {/* Middle Column: Current summary stats */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Workout Performance</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-50/40 dark:bg-orange-950/20 border border-orange-100/50 dark:border-orange-900/30 p-4 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-orange-700 dark:text-orange-400 block">Total Active Minutes</span>
                <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{totalMinutes} <span className="text-xs font-normal">mins</span></p>
              </div>
              <div className="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 p-4 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block">Calories Burned Today</span>
                <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{totalBurned} <span className="text-xs font-normal">kcal</span></p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/30 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/40 rounded-2xl p-4 flex gap-3">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Burn to Earn!</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                By logging {totalBurned} kcal burned, you can now consume up to <span className="text-emerald-600 font-extrabold">{profile.dailyCalorieGoal + totalBurned} kcal</span> total today while staying perfectly on track!
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Workout Diary */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white pb-1.5 border-b border-gray-50 dark:border-gray-800">
            Today's Workout Diary
          </h3>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {todayLogs.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs italic">
                No active training sessions logged today. Stay active!
              </div>
            ) : (
              todayLogs.map((log) => (
                <div key={log.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-850 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-600 font-bold">
                      🏃
                    </div>
                    <div>
                      <span className="font-black text-sm text-gray-800 dark:text-white">{log.type}</span>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        {log.durationMin} min • <span className="text-orange-600 dark:text-orange-400 font-bold">-{log.caloriesBurned} kcal</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveExercise(log.id)}
                    className="p-1.5 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white rounded-lg transition-all dark:bg-red-950/20 dark:hover:bg-red-900 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
