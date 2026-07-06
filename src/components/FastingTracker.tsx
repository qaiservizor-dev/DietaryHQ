/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { FastingSession } from "../types";
import { Zap, Timer, Play, Square, RefreshCw, Activity, Sparkles, HelpCircle } from "lucide-react";

interface FastingTrackerProps {
  onToggleFast: (type: string, duration: number) => void;
  activeSession: FastingSession | null;
}

export default function FastingTracker({ onToggleFast, activeSession }: FastingTrackerProps) {
  const [selectedType, setSelectedType] = useState("16:8");
  const [durationHours, setDurationHours] = useState(16);
  const [timeLeftStr, setTimeLeftStr] = useState("16:00:00");
  const [percentDone, setPercentDone] = useState(0);
  const [elapsedHours, setElapsedHours] = useState(0);

  // Fasting presets
  const PRESETS = [
    { name: "16:8 Fast", type: "16:8", hours: 16, desc: "Standard intermittent split. Great for fat loss and metabolic rest." },
    { name: "18:6 Fast", type: "18:6", hours: 18, desc: "Moderate metabolic shift. Speeds up ketosis and cellular repair." },
    { name: "20:4 Fast", type: "20:4", hours: 20, desc: "Warrior fast. Prolonged lipolysis with enhanced growth hormone release." },
    { name: "OMAD", type: "OMAD", hours: 24, desc: "One Meal A Day. Intense autophagic repair and maximum insulin sensitivity." },
  ];

  const handleSelectPreset = (type: string, hrs: number) => {
    setSelectedType(type);
    setDurationHours(hrs);
  };

  useEffect(() => {
    if (!activeSession || !activeSession.isActive) {
      setPercentDone(0);
      setElapsedHours(0);
      setTimeLeftStr(`${durationHours}:00:00`);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(activeSession.startTime).getTime();
      const targetHours = activeSession.durationHours;
      const targetMs = targetHours * 60 * 60 * 1000;
      const elapsedMs = now - start;
      const remainingMs = Math.max(0, targetMs - elapsedMs);

      // Compute stats
      const elapsedH = elapsedMs / (1000 * 60 * 60);
      setElapsedHours(elapsedH);

      const pct = Math.min(100, (elapsedMs / targetMs) * 100);
      setPercentDone(pct);

      // Format countdown string
      const hrs = Math.floor(remainingMs / (1000 * 60 * 60));
      const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((remainingMs % (1000 * 60)) / 1000);

      const pad = (n: number) => n.toString().padStart(2, "0");
      setTimeLeftStr(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`);

      if (remainingMs === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, durationHours]);

  const handleStartStop = () => {
    onToggleFast(selectedType, durationHours);
  };

  // Determine current biochemical state based on elapsed hours
  const getFastingStage = (hours: number) => {
    if (hours === 0) return { title: "Fasting not started", desc: "Choose a schedule to trigger metabolic ketosis indicators." };
    if (hours < 4) return { title: "Anabolic Stage (0-4h)", desc: "Your blood glucose levels rise as food digests. Insulin is actively storing glycogen." };
    if (hours < 12) return { title: "Catabolic Rest (4-12h)", desc: "Blood sugar drops to standard baselines. Glucagon initiates breakdown of stored liver glycogen." };
    if (hours < 16) return { title: "Lipolysis / Fat Burning (12-16h)", desc: "Glycogen depletion triggers heavy fat lipid oxidation. Growth hormone spikes significantly." };
    return { title: "Active Autophagy (16h+)", desc: "Cells undergo heavy autophagic self-cleaning, recycling old proteins and neutralizing inflammatory markers." };
  };

  const stage = getFastingStage(activeSession?.isActive ? elapsedHours : 0);

  return (
    <div className="space-y-8" id="fasting-tracker-section">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 dark:border-gray-805 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Timer className="w-8 h-8 text-emerald-500" />
            Intermittent Fasting Tracker
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Configure intermittent calorie-restriction splits and view your live metabolic cellular progress clock.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Presets selector */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4 text-left">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 pb-2 uppercase tracking-wide">
              Fasting Schedules
            </h3>

            <div className="space-y-3">
              {PRESETS.map((p) => (
                <button
                  key={p.type}
                  disabled={activeSession?.isActive}
                  onClick={() => handleSelectPreset(p.type, p.hours)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedType === p.type
                      ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400"
                      : "border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-extrabold text-sm">{p.name}</span>
                    <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                      {p.hours} hours
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-normal">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center column: Circular Timer Dial */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6 flex flex-col items-center justify-center">
          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                className="text-gray-100 dark:text-gray-800"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke={activeSession?.isActive ? "#10b981" : "#e5e7eb"}
                strokeWidth="6"
                fill="transparent"
                strokeDasharray="276.4"
                strokeDashoffset={276.4 - (276.4 * (activeSession?.isActive ? percentDone : 0)) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute text-center space-y-1">
              <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-widest">
                {activeSession?.isActive ? "Remaining Fast" : "Ready to Begin"}
              </p>
              <h2 className="text-4xl font-black text-gray-800 dark:text-white tracking-tight font-mono">
                {activeSession?.isActive ? timeLeftStr : `${durationHours}:00:00`}
              </h2>
              {activeSession?.isActive && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold">
                  {Math.round(percentDone)}% Completed
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleStartStop}
            className={`w-full max-w-[200px] py-3 font-bold rounded-2xl shadow transition-all flex items-center justify-center gap-2 ${
              activeSession?.isActive
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-emerald-500 hover:bg-emerald-600 text-white"
            }`}
          >
            {activeSession?.isActive ? (
              <>
                <Square className="w-4 h-4 fill-current" /> Stop Fasting
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Begin Fasting Now
              </>
            )}
          </button>
        </div>

        {/* Right column: Cellular Progress Indicator */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/10 dark:to-teal-950/10 border border-emerald-100 dark:border-emerald-900/30 p-6 rounded-3xl space-y-4 text-left">
            <span className="bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 text-[10px] uppercase font-black px-2.5 py-1 rounded-full">
              Bio-Metabolic Progression
            </span>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-teal-950 dark:text-white flex items-center gap-1">
                <Activity className="w-5 h-5 text-emerald-600 animate-pulse" />
                {stage.title}
              </h3>
              <p className="text-xs text-teal-800/80 dark:text-gray-350 leading-relaxed mt-1">
                {stage.desc}
              </p>
            </div>

            <div className="border-t border-emerald-100/50 dark:border-emerald-900/30 pt-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Elapsed Fast Time: {elapsedHours.toFixed(2)} hrs</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                <Timer className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Preset Schedule Target: {durationHours} hrs</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-3.5 text-left">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-50 dark:border-gray-800 pb-2">
              Fast Tracker Recommendations
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-500 dark:text-gray-400 leading-normal">
              <li>• Sip black coffee or green tea without sugars to suppress insulin release.</li>
              <li>• Supplement standard sodium/potassium electrolytes on fasts exceeding 18h.</li>
              <li>• Break the fast using high-protein easy-to-digest bone broths.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
