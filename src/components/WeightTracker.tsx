import React, { useState } from "react";
import { WeightLog, UserProfile } from "../types";
import { TrendingDown, TrendingUp, Plus, Trash2, Calendar, Scale, Sparkles, Trophy, Check } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";

interface WeightTrackerProps {
  profile: UserProfile;
  weightLogs: WeightLog[];
  onAddWeight: (weight: number) => void;
  onRemoveWeight: (logId: string) => void;
  onUpdateProfile: (updated: UserProfile) => void;
}

export default function WeightTracker({ profile, weightLogs, onAddWeight, onRemoveWeight, onUpdateProfile }: WeightTrackerProps) {
  const [newWeight, setNewWeight] = useState("");
  const [targetWeightInput, setTargetWeightInput] = useState(profile.targetWeight.toString());
  const todayStr = new Date().toISOString().split("T")[0];

  const currentWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : profile.weight;
  const weightUnit = profile.units === "metric" ? "kg" : "lbs";

  // Calculate BMI
  const heightM = profile.height / 100;
  const bmi = heightM > 0 ? (currentWeight / (heightM * heightM)) : 0;
  const roundedBmi = Math.round(bmi * 10) / 10;

  const getBmiCategory = (val: number) => {
    if (val < 18.5) return { label: "Underweight", color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-200" };
    if (val < 25) return { label: "Normal Weight", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200" };
    if (val < 30) return { label: "Overweight", color: "text-orange-600 bg-orange-50 dark:bg-orange-950/30 border-orange-200" };
    return { label: "Obese", color: "text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200" };
  };

  const bmiCat = getBmiCategory(roundedBmi);

  // Calculate Weekly Weight Loss/Gain Velocity
  const getVelocityData = () => {
    if (weightLogs.length < 2) {
      return { velocity: 0, text: "Requires multiple entries over time", hasData: false, isLoss: false };
    }
    const sorted = [...weightLogs].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const earliest = sorted[0];
    const latest = sorted[sorted.length - 1];
    
    const tEarliest = new Date(earliest.timestamp).getTime();
    const tLatest = new Date(latest.timestamp).getTime();
    const timeDiffInWeeks = (tLatest - tEarliest) / (1000 * 60 * 60 * 24 * 7);
    
    if (timeDiffInWeeks <= 0.05) { // Needs to span at least half a day
      return { velocity: 0, text: "Logs must span multiple days", hasData: false, isLoss: false };
    }
    
    const weightDiff = latest.weight - earliest.weight;
    const velocity = weightDiff / timeDiffInWeeks;
    
    const isLoss = velocity < 0;
    const absVelocity = Math.abs(velocity).toFixed(2);
    
    const targetDiff = profile.targetWeight - latest.weight;
    let weeksToGoalText = "";
    if (targetDiff !== 0 && velocity !== 0) {
      const weeksNeeded = targetDiff / velocity;
      if (weeksNeeded > 0) {
        weeksToGoalText = `At this rate, you'll reach your target weight in ~${Math.ceil(weeksNeeded)} weeks!`;
      } else {
        weeksToGoalText = "Your current trajectory is moving away from your target weight.";
      }
    }
    
    return {
      velocity: Number(velocity.toFixed(2)),
      text: isLoss 
        ? `Losing ${absVelocity} ${weightUnit}/week on average.` 
        : `Gaining ${absVelocity} ${weightUnit}/week on average.`,
      hasData: true,
      isLoss,
      weeksToGoalText,
    };
  };

  const velocityInfo = getVelocityData();

  const handleSubmitWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(newWeight);
    if (!isNaN(w) && w > 20 && w < 400) {
      onAddWeight(w);
      setNewWeight("");
    }
  };

  const handleUpdateTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const tw = parseFloat(targetWeightInput);
    if (!isNaN(tw) && tw > 20 && tw < 400) {
      onUpdateProfile({ ...profile, targetWeight: tw });
    }
  };

  // Prepare chart data sorted chronologically
  const chartData = [...weightLogs]
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map(log => ({
      date: new Date(log.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      weight: log.weight,
    }));

  return (
    <div className="space-y-6 text-left" id="weight-tracker-section">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-950 dark:text-white flex items-center gap-2">
            <Scale className="w-8 h-8 text-teal-600" />
            Biometrics & Weight Tracker
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Track your scale measurements regularly, monitor your body mass index progression, and work toward your fitness goals.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start">
          <div className="bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-400 px-4 py-2 rounded-xl border border-teal-100 dark:border-teal-900/30 font-bold text-xs flex items-center gap-1">
            <span>Weight:</span>
            <span className="text-sm font-black">{currentWeight} {weightUnit}</span>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400 px-4 py-2 rounded-xl border border-blue-100 dark:border-blue-900/30 font-bold text-xs flex items-center gap-1">
            <span>BMI:</span>
            <span className="text-sm font-black">{roundedBmi}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column - Forms (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Form: Record Weight */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 pb-2.5">
              Log Today's Weight
            </h3>
            <form onSubmit={handleSubmitWeight} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-gray-500 block mb-1">New Measurement ({weightUnit})</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="300"
                    required
                    placeholder={`E.g. ${currentWeight}`}
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer"
                  >
                    Log Weight
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Form: Target Weight */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 pb-2.5">
              Set Target Weight
            </h3>
            <form onSubmit={handleUpdateTarget} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-gray-500 block mb-1">Target Weight ({weightUnit})</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="300"
                    required
                    value={targetWeightInput}
                    onChange={(e) => setTargetWeightInput(e.target.value)}
                    className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-850 dark:bg-gray-800 hover:bg-black text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                  >
                    Update Goal
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* BMI Info card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-sm space-y-3.5">
            <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 pb-2.5">
              BMI Analysis
            </h3>
            <div className={`p-4 border rounded-2xl flex flex-col items-center justify-center text-center gap-1 ${bmiCat.color}`}>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Body Mass Index (BMI)</span>
              <span className="text-3xl font-black">{roundedBmi}</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full mt-1.5 uppercase tracking-wide border border-current">{bmiCat.label}</span>
            </div>
          </div>

          {/* Weight Velocity card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-sm space-y-3.5">
            <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 pb-2.5 flex items-center gap-1.5">
              {velocityInfo.isLoss ? <TrendingDown className="w-5 h-5 text-emerald-500" /> : <TrendingUp className="w-5 h-5 text-amber-500" />}
              Weight Velocity
            </h3>
            {velocityInfo.hasData ? (
              <div className="space-y-2 text-left">
                <div className={`p-3.5 border rounded-2xl flex flex-col gap-0.5 ${
                  velocityInfo.isLoss 
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-150 text-emerald-800 dark:text-emerald-400" 
                    : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-150 text-amber-800 dark:text-amber-400"
                }`}>
                  <span className="text-[10px] uppercase font-black opacity-80 tracking-wider">Weekly Velocity</span>
                  <span className="text-2xl font-black">{velocityInfo.velocity > 0 ? "+" : ""}{velocityInfo.velocity} {weightUnit}/wk</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-semibold mt-1">
                  {velocityInfo.text}
                </p>
                {velocityInfo.weeksToGoalText && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed mt-0.5 italic">
                    {velocityInfo.weeksToGoalText}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 dark:bg-gray-850 rounded-2xl text-center">
                <span className="text-xs text-gray-400 dark:text-gray-500 italic block">Add multiple weight logs with distinct dates to compute your weekly pacing velocity.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Chart and logs (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Chart Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-gray-50 dark:border-gray-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Weight Progress Chart
              </h3>
              <span className="text-xs text-teal-600 dark:text-teal-400 font-extrabold bg-teal-50 dark:bg-teal-950/40 px-3 py-1 rounded-full uppercase tracking-wider">
                Trend Analysis
              </span>
            </div>

            <div className="h-[280px] w-full pt-2">
              {chartData.length < 2 ? (
                <div className="h-full flex items-center justify-center text-center text-gray-400 text-xs italic">
                  Log at least 2 weight updates to visualize your progress trend over time.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} />
                    <YAxis domain={["dataMin - 2", "dataMax + 2"]} stroke="#9ca3af" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "12px" }} />
                    <ReferenceLine y={profile.targetWeight} stroke="#ef4444" strokeDasharray="3 3" label={{ value: `Goal (${profile.targetWeight} ${weightUnit})`, fill: "#ef4444", fontSize: 9, position: "insideBottomRight" }} />
                    <Area type="monotone" dataKey="weight" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#weightGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Weight Log History */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white pb-1.5 border-b border-gray-50 dark:border-gray-800">
              Biometric Logging History
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[450px] overflow-y-auto pr-1">
              {[...weightLogs].reverse().map((log) => (
                <div key={log.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-850 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-600 font-bold text-xs">
                      ⚖️
                    </div>
                    <div>
                      <span className="font-black text-sm text-gray-800 dark:text-white">{log.weight} {weightUnit}</span>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">{new Date(log.timestamp).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveWeight(log.id)}
                    className="p-1.5 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white rounded-lg transition-all dark:bg-red-950/20 dark:hover:bg-red-900 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
