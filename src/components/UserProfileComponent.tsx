/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { UserProfile } from "../types";
import { 
  User, 
  Activity, 
  Flame, 
  ShieldAlert, 
  Check, 
  HelpCircle, 
  RefreshCw, 
  Download, 
  Ruler, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Scale 
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";

interface MeasurementLog {
  id: string;
  timestamp: string;
  waist: number;
  chest: number;
  hips: number;
}

interface UserProfileProps {
  profile: UserProfile;
  onUpdate: (updated: UserProfile) => void;
  mealLogs?: any[];
  weightLogs?: any[];
}

export default function UserProfileComponent({ 
  profile, 
  onUpdate, 
  mealLogs = [], 
  weightLogs = [] 
}: UserProfileProps) {
  const [formData, setFormData] = useState<UserProfile>({ ...profile });
  const [newAllergy, setNewAllergy] = useState("");
  const [newRestriction, setNewRestriction] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // --- BODY MEASUREMENTS & CSV EXPORTS ---
  const [measurementLogs, setMeasurementLogs] = useState<MeasurementLog[]>(() => {
    const saved = localStorage.getItem("diet_measurement_logs");
    if (saved) return JSON.parse(saved);
    return [
      { id: "m1", timestamp: "2026-06-10", waist: 88.0, chest: 102.0, hips: 98.0 },
      { id: "m2", timestamp: "2026-06-17", waist: 87.2, chest: 101.5, hips: 97.5 },
      { id: "m3", timestamp: "2026-06-24", waist: 86.5, chest: 101.0, hips: 97.0 },
      { id: "m4", timestamp: "2026-07-01", waist: 85.8, chest: 100.2, hips: 96.2 },
    ];
  });

  useEffect(() => {
    localStorage.setItem("diet_measurement_logs", JSON.stringify(measurementLogs));
  }, [measurementLogs]);

  const [measDate, setMeasDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [measWaist, setMeasWaist] = useState("");
  const [measChest, setMeasChest] = useState("");
  const [measHips, setMeasHips] = useState("");

  const handleAddMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    const w = Number(measWaist);
    const c = Number(measChest);
    const h = Number(measHips);
    if (!w || !c || !h) return;

    const newLog: MeasurementLog = {
      id: `meas_${Date.now()}`,
      timestamp: measDate,
      waist: w,
      chest: c,
      hips: h
    };

    setMeasurementLogs((prev) => {
      // Avoid duplicate dates if logging on the same day, replace or append
      const filtered = prev.filter(log => log.timestamp !== measDate);
      return [...filtered, newLog].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    });

    setMeasWaist("");
    setMeasChest("");
    setMeasHips("");

    // Simple visual toast
    const t = document.createElement("div");
    t.className = "fixed bottom-5 right-5 bg-emerald-600 text-white text-xs px-4 py-2.5 rounded-xl z-50 shadow-lg border border-emerald-500 font-bold flex items-center gap-1 animate-bounce";
    t.innerHTML = "📐 Body measurements logged successfully!";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  };

  const handleDeleteMeasurement = (id: string) => {
    setMeasurementLogs(prev => prev.filter(log => log.id !== id));
  };

  const handleExportMealLogs = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Meal Type,Food Name,Brand,Serving Size,Calories,Protein,Carbs,Fat,Servings\n";
    
    mealLogs.forEach(log => {
      const foodsList = log.foods || [];
      foodsList.forEach((fItem: any) => {
        if (!fItem || !fItem.food) return;
        const row = [
          log.timestamp,
          log.mealType,
          `"${fItem.food.name.replace(/"/g, '""')}"`,
          `"${(fItem.food.brand || "").replace(/"/g, '""')}"`,
          `"${(fItem.food.servingSize || "1 serving").replace(/"/g, '""')}"`,
          fItem.food.calories,
          fItem.food.protein,
          fItem.food.carbs,
          fItem.food.fat,
          fItem.servings
        ].join(",");
        csvContent += row + "\n";
      });
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `diet_meal_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportWeightLogs = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Weight,Unit,Body Fat (%),Muscle Mass (%),BMI\n";
    
    weightLogs.forEach(log => {
      const displayWeight = formData.units === "imperial" ? (log.weight * 2.20462).toFixed(1) : log.weight.toFixed(1);
      const row = [
        log.timestamp,
        displayWeight,
        formData.units === "imperial" ? "lbs" : "kg",
        log.bodyFat || "",
        log.muscleMass || "",
        log.bmi || ""
      ].join(",");
      csvContent += row + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `diet_weight_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    setFormData({ ...profile });
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNum = ["age", "height", "weight", "targetWeight", "bodyFat"].includes(name);
    setFormData((prev) => ({
      ...prev,
      [name]: isNum ? Number(value) : value,
    }));
  };

  const calculateTargets = () => {
    // Mifflin-St Jeor Formula
    const w = formData.weight;
    const h = formData.height;
    const a = formData.age;
    
    let bmr = 0;
    if (formData.gender === "male") {
      bmr = 10 * w + 6.25 * h - 5 * a + 5;
    } else {
      bmr = 10 * w + 6.25 * h - 5 * a - 161;
    }

    // Activity multiplier
    const activityMultipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
    };
    const tdee = bmr * activityMultipliers[formData.activityLevel];

    // Goal adjustments
    let calorieGoal = Math.round(tdee);
    if (formData.fitnessGoal === "lose_weight") {
      calorieGoal = Math.round(tdee - 500);
    } else if (formData.fitnessGoal === "gain_weight" || formData.fitnessGoal === "gain_muscle") {
      calorieGoal = Math.round(tdee + 350);
    } else if (formData.fitnessGoal === "recomposition") {
      calorieGoal = Math.round(tdee - 200);
    }

    // Guard minimum safe calories
    if (calorieGoal < 1200) calorieGoal = 1200;

    // Macro distributions
    let proteinPct = 0.3; // default
    let fatPct = 0.25;
    let carbsPct = 0.45;

    // Adjust based on diet preferences
    if (formData.dietPreference === "keto") {
      proteinPct = 0.25;
      fatPct = 0.70;
      carbsPct = 0.05;
    } else if (formData.dietPreference === "low_carb") {
      proteinPct = 0.35;
      fatPct = 0.40;
      carbsPct = 0.25;
    } else if (formData.dietPreference === "high_protein" || formData.fitnessGoal === "gain_muscle") {
      proteinPct = 0.40;
      fatPct = 0.25;
      carbsPct = 0.35;
    }

    const proteinG = Math.round((calorieGoal * proteinPct) / 4);
    const fatG = Math.round((calorieGoal * fatPct) / 9);
    const carbsG = Math.round((calorieGoal * carbsPct) / 4);

    const updatedProfile: UserProfile = {
      ...formData,
      dailyCalorieGoal: calorieGoal,
      proteinGoal: proteinG,
      carbsGoal: carbsG,
      fatGoal: fatG,
    };

    setFormData(updatedProfile);
    onUpdate(updatedProfile);
    triggerSuccessMessage();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    calculateTargets();
  };

  const triggerSuccessMessage = () => {
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !formData.allergies.includes(newAllergy.trim())) {
      const updated = { ...formData, allergies: [...formData.allergies, newAllergy.trim()] };
      setFormData(updated);
      onUpdate(updated);
      setNewAllergy("");
    }
  };

  const removeAllergy = (index: number) => {
    const updatedAllergies = [...formData.allergies];
    updatedAllergies.splice(index, 1);
    const updated = { ...formData, allergies: updatedAllergies };
    setFormData(updated);
    onUpdate(updated);
  };

  const addRestriction = () => {
    if (newRestriction.trim() && !formData.restrictions.includes(newRestriction.trim())) {
      const updated = { ...formData, restrictions: [...formData.restrictions, newRestriction.trim()] };
      setFormData(updated);
      onUpdate(updated);
      setNewRestriction("");
    }
  };

  const removeRestriction = (index: number) => {
    const updatedRestrictions = [...formData.restrictions];
    updatedRestrictions.splice(index, 1);
    const updated = { ...formData, restrictions: updatedRestrictions };
    setFormData(updated);
    onUpdate(updated);
  };

  // Unit converter labels
  const weightLabel = formData.units === "metric" ? "kg" : "lbs";
  const heightLabel = formData.units === "metric" ? "cm" : "inches";

  return (
    <div className="space-y-8" id="profile-section">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <User className="w-8 h-8 text-emerald-500" />
            My Profile & Goals
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Personalize your health metrics, fitness objectives, and calculated daily targets.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportMealLogs}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 font-bold border border-gray-200 rounded-xl text-xs transition-all cursor-pointer"
            title="Download your meal history log as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Export Meals (CSV)
          </button>
          
          <button
            onClick={handleExportWeightLogs}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 font-bold border border-gray-200 rounded-xl text-xs transition-all cursor-pointer"
            title="Download your weight logs as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Export Weights (CSV)
          </button>

          <button
            onClick={calculateTargets}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 rounded-xl text-xs transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Recalculate Macros
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form Column */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-3">
            <Activity className="w-5 h-5 text-emerald-500" />
            Biometric Profile
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Preferred Units</label>
              <select
                name="units"
                value={formData.units}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
              >
                <option value="metric">Metric (kg/cm)</option>
                <option value="imperial">Imperial (lbs/inches)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                placeholder="E.g., Alex Johnson"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Age (years)</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="10"
                max="100"
                required
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Height ({heightLabel})</label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleChange}
                min="50"
                max="250"
                required
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Weight ({weightLabel})</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                min="30"
                max="300"
                step="0.1"
                required
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Target Weight ({weightLabel})</label>
              <input
                type="number"
                name="targetWeight"
                value={formData.targetWeight}
                onChange={handleChange}
                min="30"
                max="300"
                step="0.1"
                required
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Body Fat (%)</label>
              <input
                type="number"
                name="bodyFat"
                value={formData.bodyFat || ""}
                onChange={handleChange}
                min="3"
                max="60"
                placeholder="Optional"
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Activity Level</label>
              <select
                name="activityLevel"
                value={formData.activityLevel}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
              >
                <option value="sedentary">Sedentary (Office job)</option>
                <option value="lightly_active">Lightly Active (1-3 days/wk)</option>
                <option value="moderately_active">Moderately Active (3-5 days/wk)</option>
                <option value="very_active">Very Active (6-7 days/wk)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Fitness Goal</label>
              <select
                name="fitnessGoal"
                value={formData.fitnessGoal}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
              >
                <option value="lose_weight">Lose Weight (Caloric Deficit)</option>
                <option value="gain_weight">Gain Weight (Caloric Surplus)</option>
                <option value="gain_muscle">Gain Lean Muscle</option>
                <option value="recomposition">Body Recomposition</option>
                <option value="maintain">Maintain Current Weight</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-3 mb-4">
              <ShieldAlert className="w-5 h-5 text-emerald-500" />
              Dietary Preferences & Allergies
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Dietary Style</label>
                <select
                  name="dietPreference"
                  value={formData.dietPreference}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                >
                  <option value="none">Balanced / No Restriction</option>
                  <option value="keto">Ketogenic (Very Low Carb)</option>
                  <option value="vegan">Vegan (Plant Based)</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="mediterranean">Mediterranean</option>
                  <option value="low_carb">Low Carbohydrate</option>
                  <option value="high_protein">High Protein</option>
                  <option value="intermittent_fasting">Intermittent Fasting</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Food Allergies</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    placeholder="E.g., Peanuts, Dairy, Gluten"
                    className="flex-1 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAllergy())}
                  />
                  <button
                    type="button"
                    onClick={addAllergy}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl px-4 py-2 text-sm transition-all"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.allergies.length === 0 ? (
                    <span className="text-gray-400 text-xs italic">No allergies listed</span>
                  ) : (
                    formData.allergies.map((allergy, i) => (
                      <span
                        key={i}
                        className="bg-red-50 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer hover:bg-red-100"
                        onClick={() => removeAllergy(i)}
                      >
                        {allergy} &times;
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Other Food Restrictions (Religious/Ethical)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRestriction}
                    onChange={(e) => setNewRestriction(e.target.value)}
                    placeholder="E.g., Halal, Kosher, Pork-free"
                    className="flex-1 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRestriction())}
                  />
                  <button
                    type="button"
                    onClick={addRestriction}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl px-4 py-2 text-sm transition-all"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.restrictions.length === 0 ? (
                    <span className="text-gray-400 text-xs italic">No specific restrictions</span>
                  ) : (
                    formData.restrictions.map((restriction, i) => (
                      <span
                        key={i}
                        className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer hover:bg-blue-100"
                        onClick={() => removeRestriction(i)}
                      >
                        {restriction} &times;
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
            {saveSuccess && (
              <span className="text-emerald-600 text-sm font-semibold flex items-center gap-1 mr-auto self-center animate-fade-in">
                <Check className="w-4 h-4" /> Profile & targets successfully computed!
              </span>
            )}
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg text-sm flex items-center gap-2"
            >
              Save & Calculate Macros
            </button>
          </div>
        </form>

        {/* Right Sidebar: Macro Targets Summary Panel */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-1/4 translate-x-1/4">
              <Flame className="w-64 h-64" />
            </div>

            <div className="relative z-10 space-y-4">
              <span className="bg-emerald-500/20 text-emerald-300 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                My Target Calculator
              </span>
              <div>
                <p className="text-emerald-100/70 text-sm font-medium">Daily Calorie Target</p>
                <h2 className="text-4xl font-black mt-1 text-emerald-300">
                  {profile.dailyCalorieGoal.toLocaleString()} <span className="text-lg font-normal text-white">kcal</span>
                </h2>
              </div>

              <div className="border-t border-white/10 my-4 pt-4 space-y-3.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-emerald-200">Protein (g)</span>
                  <span className="font-extrabold text-emerald-300">{profile.proteinGoal}g</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: "35%" }}></div>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-emerald-200">Carbohydrates (g)</span>
                  <span className="font-extrabold text-emerald-300">{profile.carbsGoal}g</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: "40%" }}></div>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-emerald-200">Fats (g)</span>
                  <span className="font-extrabold text-emerald-300">{profile.fatGoal}g</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div className="bg-rose-400 h-1.5 rounded-full" style={{ width: "25%" }}></div>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 text-xs text-emerald-200 leading-relaxed flex items-start gap-2.5">
                <HelpCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-300">Targeting Strategy</p>
                  <p className="mt-0.5">
                    Your custom metabolic budget is automatically configured based on a Mifflin-St Jeor BMR projection for your
                    {profile.activityLevel.replace("_", " ")} lifestyle. Adjust activity or objectives to dynamically reallocate.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-50 pb-2">
              Diet Breakdown (TDEE Projections)
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-medium">Basal Metabolic Rate (BMR):</span>
                <span className="font-bold text-gray-900">
                  {Math.round(10 * profile.weight + 6.25 * profile.height - 5 * profile.age + (profile.gender === "male" ? 5 : -161))} kcal
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-medium">Total Daily Energy Expenditure (TDEE):</span>
                <span className="font-bold text-gray-900">
                  {Math.round(
                    (10 * profile.weight + 6.25 * profile.height - 5 * profile.age + (profile.gender === "male" ? 5 : -161)) *
                    (profile.activityLevel === "sedentary" ? 1.2 : profile.activityLevel === "lightly_active" ? 1.375 : profile.activityLevel === "moderately_active" ? 1.55 : 1.725)
                  )} kcal
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-medium">Daily Caloric Deficit/Surplus:</span>
                <span className={`font-bold ${profile.fitnessGoal === "lose_weight" ? "text-red-600" : profile.fitnessGoal === "maintain" ? "text-gray-600" : "text-emerald-600"}`}>
                  {profile.fitnessGoal === "lose_weight" ? "-500 kcal" : profile.fitnessGoal === "maintain" ? "0 kcal" : "+350 kcal"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📐 BODY MEASUREMENTS TRACKING SECTION */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-850 shadow-sm space-y-6 text-left mt-8">
        <div className="border-b border-gray-50 dark:border-gray-800 pb-3 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
              <Ruler className="w-5 h-5 text-emerald-500" />
              Body Circumference Tracker
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Track waist, chest, and hip dimensions over time to assess body composition changes beyond scale weight.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl">
            Active Metric: {formData.units === "metric" ? "cm" : "inches"}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add Entry Form */}
          <form onSubmit={handleAddMeasurement} className="lg:col-span-4 bg-gray-50/50 dark:bg-gray-800/10 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl space-y-4">
            <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-1">
              <Plus className="w-4 h-4 text-emerald-500" /> Add New Log
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider mb-1">Log Date</label>
                <input 
                  type="date"
                  value={measDate}
                  onChange={(e) => setMeasDate(e.target.value)}
                  className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-850 rounded-xl px-3 py-2 text-xs text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider mb-1">
                  Waist Circumference ({formData.units === "metric" ? "cm" : "inches"})
                </label>
                <input 
                  type="number"
                  step="0.1"
                  min="10"
                  max="200"
                  placeholder="E.g. 84.5"
                  value={measWaist}
                  onChange={(e) => setMeasWaist(e.target.value)}
                  className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-850 rounded-xl px-3 py-2 text-xs text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider mb-1">
                  Chest Circumference ({formData.units === "metric" ? "cm" : "inches"})
                </label>
                <input 
                  type="number"
                  step="0.1"
                  min="10"
                  max="200"
                  placeholder="E.g. 101.2"
                  value={measChest}
                  onChange={(e) => setMeasChest(e.target.value)}
                  className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-850 rounded-xl px-3 py-2 text-xs text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider mb-1">
                  Hip Circumference ({formData.units === "metric" ? "cm" : "inches"})
                </label>
                <input 
                  type="number"
                  step="0.1"
                  min="10"
                  max="200"
                  placeholder="E.g. 96.0"
                  value={measHips}
                  onChange={(e) => setMeasHips(e.target.value)}
                  className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-850 rounded-xl px-3 py-2 text-xs text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Log Measurements
            </button>
          </form>

          {/* Chart and History list */}
          <div className="lg:col-span-8 space-y-6 w-full">
            {/* Recharts graph */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
              <h4 className="font-extrabold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> Circumference History (Trends)
              </h4>
              
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={measurementLogs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.15)" />
                    <XAxis dataKey="timestamp" tick={{ fontSize: 10, fill: "#888888" }} tickLine={false} axisLine={false} />
                    <YAxis domain={["dataMin - 5", "dataMax + 5"]} tick={{ fontSize: 10, fill: "#888888" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "#1f2937", border: "none", borderRadius: "12px", color: "#ffffff", fontSize: "12px" }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="waist" stroke="#10b981" name={`Waist (${formData.units === 'metric' ? 'cm' : 'in'})`} strokeWidth={2.5} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="chest" stroke="#3b82f6" name={`Chest (${formData.units === 'metric' ? 'cm' : 'in'})`} strokeWidth={2.5} />
                    <Line type="monotone" dataKey="hips" stroke="#ec4899" name={`Hips (${formData.units === 'metric' ? 'cm' : 'in'})`} strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* List log */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Log Entries</h4>
              
              <div className="max-h-[300px] overflow-y-auto space-y-2 border border-gray-100 dark:border-gray-800 rounded-xl p-3 bg-gray-50/20 dark:bg-gray-900/40">
                {measurementLogs.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-4">No logged entries yet</p>
                ) : (
                  [...measurementLogs].reverse().map((log) => (
                    <div key={log.id} className="flex justify-between items-center bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-850 rounded-xl px-4 py-2.5 shadow-sm text-xs">
                      <div>
                        <span className="font-black text-gray-800 dark:text-gray-200">{log.timestamp}</span>
                      </div>
                      <div className="flex gap-4 text-gray-600 dark:text-gray-300 font-semibold">
                        <span>Waist: <strong className="text-emerald-600 dark:text-emerald-400">{log.waist}</strong></span>
                        <span>Chest: <strong className="text-blue-600 dark:text-blue-400">{log.chest}</strong></span>
                        <span>Hips: <strong className="text-pink-600 dark:text-pink-400">{log.hips}</strong></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteMeasurement(log.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                        title="Delete log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
