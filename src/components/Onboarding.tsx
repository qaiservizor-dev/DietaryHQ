import React, { useState } from "react";
import { UserProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, ArrowLeft, Check, Sparkles, User, Ruler, Target, Flame, Activity } from "lucide-react";

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  darkMode: boolean;
}

export default function Onboarding({ onComplete, darkMode }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [age, setAge] = useState<number>(25);
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [height, setHeight] = useState<number>(175);
  const [weight, setWeight] = useState<number>(75);
  const [targetWeight, setTargetWeight] = useState<number>(70);
  const [activityLevel, setActivityLevel] = useState<UserProfile["activityLevel"]>("moderately_active");
  const [fitnessGoal, setFitnessGoal] = useState<UserProfile["fitnessGoal"]>("lose_weight");
  const [dietPreference, setDietPreference] = useState<UserProfile["dietPreference"]>("none");

  // Multi-step calculations
  const calculateBMR = () => {
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    if (gender === "male") {
      bmr += 5;
    } else if (gender === "female") {
      bmr -= 161;
    } else {
      bmr -= 78;
    }
    return Math.round(bmr);
  };

  const calculateTDEE = (bmr: number) => {
    const activityMultipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
    };
    return Math.round(bmr * activityMultipliers[activityLevel]);
  };

  const calculateTargets = () => {
    const bmr = calculateBMR();
    const tdee = calculateTDEE(bmr);
    
    // Calorie Goal
    let dailyCalorieGoal = tdee;
    if (fitnessGoal === "lose_weight") {
      dailyCalorieGoal = Math.max(1200, tdee - 500);
    } else if (fitnessGoal === "gain_weight" || fitnessGoal === "gain_muscle") {
      dailyCalorieGoal = tdee + 300;
    }

    // Macro distributions
    let proteinPct = 0.30;
    let carbsPct = 0.45;
    let fatPct = 0.25;

    if (dietPreference === "keto") {
      proteinPct = 0.25;
      carbsPct = 0.05;
      fatPct = 0.70;
    } else if (dietPreference === "low_carb") {
      proteinPct = 0.35;
      carbsPct = 0.20;
      fatPct = 0.45;
    } else if (dietPreference === "high_protein") {
      proteinPct = 0.40;
      carbsPct = 0.35;
      fatPct = 0.25;
    }

    const proteinGoal = Math.round((dailyCalorieGoal * proteinPct) / 4);
    const carbsGoal = Math.round((dailyCalorieGoal * carbsPct) / 4);
    const fatGoal = Math.round((dailyCalorieGoal * fatPct) / 9);

    return {
      bmr,
      tdee,
      dailyCalorieGoal,
      proteinGoal,
      carbsGoal,
      fatGoal,
    };
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(prev => prev + 1);
    } else {
      const computed = calculateTargets();
      const finalProfile: UserProfile = {
        name: name || "Alex",
        age,
        gender,
        height,
        weight,
        targetWeight,
        activityLevel,
        fitnessGoal,
        dietPreference,
        allergies: [],
        restrictions: [],
        units: "metric",
        ...computed
      };
      onComplete(finalProfile);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const progressPct = (step / 5) * 100;
  const targets = calculateTargets();

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-all ${
      darkMode ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900"
    }`}>
      <div className={`w-full max-w-xl rounded-3xl border shadow-xl p-8 relative overflow-hidden transition-all ${
        darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
      }`}>
        {/* Progress bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100 dark:bg-gray-800">
          <div 
            className="h-full bg-emerald-500 transition-all duration-300" 
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex justify-between items-center mb-8">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-500">
            Step {step} of 5
          </span>
          {step > 1 && (
            <button 
              onClick={handleBack}
              className="text-gray-400 hover:text-emerald-500 flex items-center gap-1 text-xs font-bold transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 text-left"
            >
              <div>
                <h2 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-2 text-gray-900 dark:text-white">
                  <User className="text-emerald-500 w-8 h-8" />
                  Welcome to DietaryHQ!
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Let's personalize your health experience. Tell us a bit about yourself.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">What should we call you?</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Your Age</label>
                    <input
                      type="number"
                      min="10"
                      max="120"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Your Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other / Prefer not to say</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 text-left"
            >
              <div>
                <h2 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-2">
                  <Ruler className="text-emerald-500 w-8 h-8" />
                  Your Biometrics
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  We use height and weight to calculate your basal metabolic rates.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Height (cm)</label>
                  <input
                    type="number"
                    min="100"
                    max="250"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Current Weight (kg)</label>
                  <input
                    type="number"
                    min="30"
                    max="300"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 text-left"
            >
              <div>
                <h2 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-2">
                  <Target className="text-emerald-500 w-8 h-8" />
                  Set Your Goal
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  What is your primary fitness aspiration? This customizes your daily caloric budget.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Primary Fitness Goal</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { id: "lose_weight", label: "Lose Weight", desc: "Healthy gradual caloric deficit" },
                      { id: "gain_muscle", label: "Build Muscle", desc: "Lean surplus to power growth" },
                      { id: "recomposition", label: "Body Recomp", desc: "Preserve muscle, lose body fat" },
                      { id: "maintain", label: "Maintain weight", desc: "Stable weight & general health" },
                    ].map(g => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setFitnessGoal(g.id as any)}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          fitnessGoal === g.id
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                            : "border-gray-150 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        <p className="font-extrabold text-sm">{g.label}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 leading-normal">{g.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Target Weight (kg)</label>
                  <input
                    type="number"
                    min="30"
                    max="300"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 text-left"
            >
              <div>
                <h2 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-2">
                  <Activity className="text-emerald-500 w-8 h-8" />
                  Lifestyle & Diet
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tell us about your physical activity and eating preferences.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Activity level</label>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value as any)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="sedentary">Sedentary (Little/No exercise, desk job)</option>
                    <option value="lightly_active">Lightly Active (Light exercise 1-3 days/wk)</option>
                    <option value="moderately_active">Moderately Active (Moderate exercise 3-5 days/wk)</option>
                    <option value="very_active">Very Active (Heavy exercise 6-7 days/wk)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Dietary Preference</label>
                  <select
                    value={dietPreference}
                    onChange={(e) => setDietPreference(e.target.value as any)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="none">Standard / Balanced (No restriction)</option>
                    <option value="keto">Keto (High fat, very low carb)</option>
                    <option value="vegan">Vegan (No animal products)</option>
                    <option value="vegetarian">Vegetarian (No meat, dairy/eggs OK)</option>
                    <option value="low_carb">Low Carb (Higher protein/fat, reduced carb)</option>
                    <option value="high_protein">High Protein (Elevated protein split)</option>
                    <option value="mediterranean">Mediterranean (Whole foods, healthy fats)</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 text-left"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-3xl font-black tracking-tight mb-2">
                  Your Scientific Blueprint
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Based on your biometrics, we have custom calculated your metabolic requirements:
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-100 dark:border-gray-800 p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-900/30">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Basal Metabolic (BMR)</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white mt-1">{targets.bmr} kcal/day</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">Energy burned at complete rest</p>
                </div>

                <div className="border border-gray-100 dark:border-gray-800 p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-900/30">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Total Expenditure (TDEE)</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white mt-1">{targets.tdee} kcal/day</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">Energy burned including activity</p>
                </div>

                <div className="col-span-2 border border-emerald-100 dark:border-emerald-900 p-5 rounded-2xl bg-emerald-500/5 text-center">
                  <p className="text-xs uppercase font-black tracking-wider text-emerald-600 dark:text-emerald-400">Target Daily Caloric Budget</p>
                  <p className="text-3xl font-black text-emerald-500 mt-1">{targets.dailyCalorieGoal} kcal</p>
                  <p className="text-[10px] text-gray-400 mt-1">Adjusted specifically for your goal to {fitnessGoal.replace("_", " ")}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2 text-center">Calculated Macro Target Distribution</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5 rounded-xl text-center">
                    <p className="text-[9px] font-bold text-emerald-600 uppercase">Protein</p>
                    <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 mt-0.5">{targets.proteinGoal}g</p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-2.5 rounded-xl text-center">
                    <p className="text-[9px] font-bold text-amber-600 uppercase">Carbs</p>
                    <p className="text-sm font-black text-amber-700 dark:text-amber-400 mt-0.5">{targets.carbsGoal}g</p>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/20 px-3 py-2.5 rounded-xl text-center">
                    <p className="text-[9px] font-bold text-rose-600 uppercase">Fat</p>
                    <p className="text-sm font-black text-rose-700 dark:text-rose-400 mt-0.5">{targets.fatGoal}g</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 pt-4 border-t border-gray-50 dark:border-gray-800 flex justify-end">
          <button
            onClick={handleNext}
            disabled={step === 1 && !name.trim()}
            className="w-full md:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {step === 5 ? "Let's Begin!" : "Continue"}
            {step === 5 ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
