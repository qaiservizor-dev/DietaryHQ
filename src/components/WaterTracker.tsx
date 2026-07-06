import React, { useState } from "react";
import { WaterLog, UserProfile } from "../types";
import { Droplet, Plus, Trash2, GlassWater, Trophy, Sparkles, Flame, Check } from "lucide-react";
import { motion } from "motion/react";

interface WaterTrackerProps {
  profile: UserProfile;
  waterLogs: WaterLog[];
  onAddWater: (amountMl: number) => void;
  onRemoveWater: (logId: string) => void;
}

export default function WaterTracker({ profile, waterLogs, onAddWater, onRemoveWater }: WaterTrackerProps) {
  const [customAmount, setCustomAmount] = useState("");
  const todayStr = new Date().toISOString().split("T")[0];
  
  // Daily Calculations
  const todayLogs = waterLogs.filter(log => log.timestamp === todayStr);
  const todayTotal = todayLogs.reduce((sum, curr) => sum + curr.amountMl, 0);
  const target = 2500; // 2.5L Default
  const progressPercent = Math.min(100, Math.round((todayTotal / target) * 100));

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(customAmount);
    if (!isNaN(amount) && amount > 0) {
      onAddWater(amount);
      setCustomAmount("");
    }
  };

  const getHydrationTip = () => {
    if (progressPercent === 0) return "Start your day with a tall glass of water to kickstart your metabolism! 💧";
    if (progressPercent < 50) return "You're on your way! Drinking water steady keeps your energy levels high. ⚡";
    if (progressPercent < 100) return "Over halfway to your goal! Keep sipping to maintain mental clarity. 🧠";
    return "Goal achieved! Excellent hydration today! Your body is thank-full. 🎉";
  };

  return (
    <div className="space-y-6 text-left" id="water-tracker-section">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-950 dark:text-white flex items-center gap-2">
            <Droplet className="w-8 h-8 text-blue-500 fill-current" />
            Water Hydration Log
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Log your daily fluid intake, reach your goal, and maintain perfect cellular hydration.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400 px-4 py-2.5 rounded-2xl border border-blue-100 dark:border-blue-900/30 font-bold self-start">
          <Trophy className="w-4.5 h-4.5 text-blue-500" />
          <span>Goal: 2.5 Liters (2500 ml)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Visual bottle & Insights */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Hydration Status</h3>
            <div className="flex items-center justify-center py-6">
              <div className="w-24 h-44 border-4 border-blue-250 dark:border-blue-900/40 rounded-3xl relative overflow-hidden bg-blue-50/50 dark:bg-blue-950/20 flex items-end shadow-inner">
                <div
                  className="bg-gradient-to-t from-blue-500 via-blue-400 to-cyan-400 w-full transition-all duration-1000 ease-out"
                  style={{ height: `${progressPercent}%` }}
                />
                <span className="absolute inset-0 flex flex-col items-center justify-center font-black text-lg text-blue-900 dark:text-blue-200 z-10 select-none">
                  {progressPercent}%
                  <span className="text-[10px] font-bold text-blue-600/80 dark:text-blue-300/80 mt-0.5">{todayTotal} ml</span>
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 rounded-2xl p-4 flex gap-3 items-start">
            <Sparkles className="w-5 h-5 text-blue-500 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-blue-800 dark:text-blue-400">Coach Insight</p>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-normal">{getHydrationTip()}</p>
            </div>
          </div>
        </div>

        {/* Middle column: Add water, presets */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-sm space-y-6">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Log Water Intake</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "+250 ml", amount: 250, desc: "Standard Cup" },
                { label: "+500 ml", amount: 500, desc: "Sports Bottle" },
                { label: "+1.0 Liter", amount: 1000, desc: "Large Flask" }
              ].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => onAddWater(preset.amount)}
                  className="flex flex-col items-center justify-center p-4 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white border border-blue-100/40 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl transition-all cursor-pointer group"
                >
                  <GlassWater className="w-6 h-6 mb-1.5 group-hover:scale-110 transition-transform" />
                  <span className="font-extrabold text-xs">{preset.label}</span>
                  <span className="text-[8px] opacity-70 mt-0.5">{preset.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleCustomSubmit} className="space-y-3.5 border-t border-gray-50 dark:border-gray-800 pt-5">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-black text-gray-400 dark:text-gray-500 block mb-1.5">Custom Water Volume (ml)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="10"
                  max="5000"
                  placeholder="E.g. 350"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer"
                >
                  Log Custom
                </button>
              </div>
            </div>
          </form>

          <div className="bg-gray-50 dark:bg-gray-850 rounded-2xl p-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Metabolism Boost:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">+3% estimated</span>
            </div>
            <div className="flex justify-between">
              <span>Digestive Balance:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Optimum</span>
            </div>
          </div>
        </div>

        {/* Right column: Today's logs */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white pb-1.5 border-b border-gray-50 dark:border-gray-800">
            Today's Water Log History
          </h3>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {todayLogs.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs italic">
                No water logged today. Hydration matters! Log your first cup.
              </div>
            ) : (
              todayLogs.map((log) => (
                <div key={log.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-850 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600">
                      <Droplet className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <span className="font-black text-sm text-gray-800 dark:text-white">{log.amountMl} ml</span>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">Logged today</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveWater(log.id)}
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
