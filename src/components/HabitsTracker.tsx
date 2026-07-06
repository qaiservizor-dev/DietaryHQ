import React, { useState } from "react";
import { Habit } from "../types";
import { Check, Trophy, Plus, Trash2, Award, Zap, Flame, Sparkles } from "lucide-react";

interface HabitsTrackerProps {
  habits: Habit[];
  onToggleHabit: (habitId: string) => void;
  onAddHabit: (name: string) => void;
  onRemoveHabit: (habitId: string) => void;
}

export default function HabitsTracker({ habits, onToggleHabit, onAddHabit, onRemoveHabit }: HabitsTrackerProps) {
  const [newHabitName, setNewHabitName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHabitName.trim()) {
      onAddHabit(newHabitName.trim());
      setNewHabitName("");
    }
  };

  const completedCount = habits.filter(h => h.completed).length;
  const totalCount = habits.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6 text-left" id="habits-tracker-section">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-950 dark:text-white flex items-center gap-2">
            <Trophy className="w-8 h-8 text-amber-500" />
            Daily Habits Checklist
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Build healthy lifestyles brick by brick. Complete actions daily to accumulate high active streaks and level up.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 px-4 py-2.5 rounded-2xl border border-amber-100 dark:border-amber-900/30 font-bold self-start">
          <Zap className="w-5 h-5 text-amber-500 animate-pulse fill-current" />
          <span>Active Streak: 5 Days Hot 🔥</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Add Habit */}
        <div className="lg:col-span-1 space-y-6">
          {/* Progress Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Today's Progress</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-500 dark:text-gray-400">Completed Habits:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{completedCount} / {totalCount}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-850 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-700 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400 block text-right">{progressPercent}% Completed</span>
            </div>
          </div>

          {/* Form: Add Custom Habit */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 pb-2.5">
              Create Custom Habit
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-gray-500 block mb-1">Habit Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="E.g. Sleep 8 Hours"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer"
                  >
                    Add Habit
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Motivation Insight */}
          <div className="bg-amber-50/25 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/40 p-4 rounded-2xl flex gap-3">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs text-gray-600 dark:text-gray-300">
              <p className="font-bold text-gray-850 dark:text-white">Habit Tip</p>
              <p className="leading-relaxed">
                "We are what we repeatedly do. Excellence, then, is not an act, but a habit." Focus on small steps every day.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Habits checklist (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white pb-1.5 border-b border-gray-50 dark:border-gray-800">
            Checklist & Streaks
          </h3>

          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
            {habits.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs italic">
                No habits declared. Add your first habit on the left!
              </div>
            ) : (
              habits.map((habit) => (
                <div
                  key={habit.id}
                  className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${
                    habit.completed
                      ? "bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-100/50 dark:border-emerald-900/30 text-gray-850 dark:text-white"
                      : "bg-gray-50 dark:bg-gray-850 border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <button
                      onClick={() => onToggleHabit(habit.id)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer ${
                        habit.completed
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-gray-300 dark:border-gray-700 hover:border-emerald-500"
                      }`}
                    >
                      {habit.completed && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <div>
                      <span className={`font-extrabold text-sm ${habit.completed ? "line-through text-gray-400" : ""}`}>{habit.name}</span>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                        <Flame className="w-3.5 h-3.5 text-orange-500 fill-current" />
                        <span>Streak: <span className="font-extrabold text-orange-600 dark:text-orange-400">{habit.streak} days</span></span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveHabit(habit.id)}
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
