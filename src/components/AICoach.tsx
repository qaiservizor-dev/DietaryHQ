/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from "react";
import { Message, UserProfile } from "../types";
import { 
  Sparkles, 
  Send, 
  Loader2, 
  HelpCircle, 
  MessageSquare, 
  Apple, 
  Zap, 
  Activity, 
  ArrowRight, 
  Brain, 
  CheckCircle2, 
  Info,
  Calendar,
  Compass
} from "lucide-react";

interface AICoachProps {
  profile: UserProfile;
  todayMacros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    remainingCalories: number;
  };
  onNavigateToChat?: () => void;
}

// Default export is the newly redesigned AI Dietitian & Nutrition Hub
export default function AICoach({ profile, todayMacros, onNavigateToChat }: AICoachProps) {
  // Generate customized daily guidelines based on user profile
  const getGoalAdvice = () => {
    switch (profile.fitnessGoal) {
      case "lose_weight":
        return {
          title: "Sustained Caloric Deficit",
          summary: "Focus on nutrient-dense, high-volume, low-calorie foods to maintain fullness while staying within your budget.",
          breakfast: "Egg white scramble with spinach, mushrooms, and cherry tomatoes, topped with light avocado.",
          lunch: "Large grilled chicken salad with cucumber, radishes, mixed baby greens, and light olive oil vinaigrette.",
          dinner: "Pan-seared cod or salmon with steamed asparagus and a small portion of roasted sweet potato.",
          snacks: "Fat-free Greek yogurt with berries, celery sticks with light cottage cheese.",
        };
      case "gain_muscle":
        return {
          title: "Lean Mass Hypertrophy Surplus",
          summary: "Prioritize consistent protein distribution, moderate complex carbs, and healthy fats to fuel heavy resistance training.",
          breakfast: "Whole eggs and egg whites, oatmeal with peanut butter and half a banana.",
          lunch: "Lean ground turkey with white or jasmine rice and roasted broccoli florets.",
          dinner: "Sirloin steak or high-grade soy tofu with quinoa and garlic-sautéed green beans.",
          snacks: "Whey or pea protein shake with almonds, whole grain toast with boiled eggs.",
        };
      case "maintain":
        return {
          title: "Metabolic Equilibrium Balance",
          summary: "Focus on macro balance, dietary fiber, and dynamic intake matching to sustain high daily energy levels.",
          breakfast: "Smoked salmon on whole-grain sourdough toast with microgreens and poached egg.",
          lunch: "Quinoa grain bowl with mixed bell peppers, edamame, and lean grilled chicken or chickpeas.",
          dinner: "Baked salmon with roasted Brussels sprouts and a side of brown rice.",
          snacks: "Mixed nuts, apple slices with almond butter.",
        };
      default:
        return {
          title: "General Wellness Plate",
          summary: "Optimize macro ratios for general physiological health, high mental clarity, and consistent stamina.",
          breakfast: "Nutrient-dense berry protein smoothie with oats and chia seeds.",
          lunch: "Turkey wrap on a high-fiber whole wheat tortilla with lettuce, tomato, and avocado.",
          dinner: "Sautéed shrimp or extra firm tofu stir-fry with mixed vegetables and wild rice.",
          snacks: "Hummus with cucumber slices and baby carrots.",
        };
    }
  };

  const advice = getGoalAdvice();

  return (
    <div className="space-y-8" id="dietitian-hub-section">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 dark:border-gray-805 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-emerald-500 animate-pulse" />
            AI Dietitian Hub
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Clinical-grade nutrition targets, personalized daily meal structures, and real-time biometric analysis.
          </p>
        </div>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Biometrics & Coach details */}
        <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-6 shadow-md space-y-4 text-left flex flex-col justify-between">
          <div>
            <span className="bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
              Dietitian Profile Context
            </span>
            <div className="space-y-2.5 pt-4">
              <div className="flex justify-between items-center text-xs border-b border-white/10 pb-2">
                <span className="text-emerald-200">User Goal:</span>
                <span className="font-extrabold capitalize text-emerald-300">{profile.fitnessGoal.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-white/10 pb-2">
                <span className="text-emerald-200">Diet Type:</span>
                <span className="font-extrabold capitalize text-emerald-300">{profile.dietPreference}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-white/10 pb-2">
                <span className="text-emerald-200">Allergies:</span>
                <span className="font-extrabold text-rose-300">{profile.allergies.join(", ") || "None"}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-1">
                <span className="text-emerald-200">Calorie Target:</span>
                <span className="font-extrabold text-emerald-300">{profile.dailyCalorieGoal} kcal</span>
              </div>
            </div>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl text-[10px] text-emerald-200 leading-normal flex gap-2 mt-2">
            <HelpCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              OnSpace AI dynamically tracks these details to customize recipes and ingredients.
            </span>
          </div>
        </div>

        {/* Card 2: Metabolic Analytics */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between text-left">
          <div>
            <div className="flex justify-between items-center border-b border-gray-50 dark:border-gray-800 pb-2.5">
              <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-500" />
                Live Intake Status
              </h4>
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-extrabold px-2 py-0.5 rounded-md">
                Today
              </span>
            </div>
            
            <div className="space-y-3.5 pt-4">
              <div className="flex justify-between items-end">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Calorie Budget</span>
                <span className="text-xs font-black text-gray-800 dark:text-white">
                  {todayMacros?.calories || 0} / {profile.dailyCalorieGoal} <span className="text-[9px] font-normal text-gray-400">kcal</span>
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (((todayMacros?.calories || 0) / (profile.dailyCalorieGoal || 2000)) * 100))}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="bg-gray-50 dark:bg-gray-850 p-2 rounded-xl">
                  <p className="text-[9px] text-gray-400 uppercase font-black">Protein</p>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-0.5">{todayMacros?.protein || 0}g</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-850 p-2 rounded-xl">
                  <p className="text-[9px] text-gray-400 uppercase font-black">Carbs</p>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-0.5">{todayMacros?.carbs || 0}g</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-850 p-2 rounded-xl">
                  <p className="text-[9px] text-gray-400 uppercase font-black">Fat</p>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-0.5">{todayMacros?.fat || 0}g</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-4 leading-normal flex items-center gap-1.5 pt-2">
            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            {todayMacros?.remainingCalories !== undefined && todayMacros.remainingCalories > 0 ? (
              <span>You have <strong>{todayMacros.remainingCalories} kcal</strong> left to consume.</span>
            ) : (
              <span>Calorie target reached! Focus on hydration and rest.</span>
            )}
          </div>
        </div>

        {/* Card 3: Healthy Substitutions */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between text-left">
          <div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-50 dark:border-gray-800 pb-2.5 flex items-center gap-1">
              <Apple className="w-4 h-4 text-emerald-500" />
              Healthy Substitutions
            </h4>
            <div className="space-y-3 text-xs text-gray-500 dark:text-gray-400 leading-normal pt-4">
              <div className="flex items-start gap-2">
                <span className="shrink-0 text-emerald-500">🌱</span>
                <p>Replace <strong className="text-gray-800 dark:text-gray-250">Mayo</strong> with <strong className="text-emerald-600 dark:text-emerald-400">Greek Yogurt</strong> or Mashed Avocado.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="shrink-0 text-emerald-500">🍝</span>
                <p>Replace <strong className="text-gray-800 dark:text-gray-250">Pasta</strong> with <strong className="text-emerald-600 dark:text-emerald-400">Spaghetti Squash</strong> or Zucchini Noodles.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="shrink-0 text-emerald-500">🥛</span>
                <p>Replace <strong className="text-gray-800 dark:text-gray-250">Whole Milk</strong> with <strong className="text-emerald-600 dark:text-emerald-400">Unsweetened Almond Milk</strong>.</p>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-3 italic">
            * Ask AI Dietitian in the Chat panel to swap elements instantly.
          </p>
        </div>
      </div>

      {/* Call To Action: Go to Separate Chats Page */}
      {onNavigateToChat && (
        <button
          onClick={onNavigateToChat}
          className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-6 rounded-3xl shadow-md hover:shadow-lg transition-all flex flex-col sm:flex-row items-center justify-between gap-4 text-left group cursor-pointer border border-emerald-400/20"
        >
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
              <MessageSquare className="w-5.5 h-5.5 text-emerald-100 group-hover:scale-110 transition-transform" />
              Launch Live Chat & Conversation Workspace
            </h3>
            <p className="text-xs text-emerald-50 text-left">
              Connect with your dedicated OnSpace AI dietitian. Discuss dynamic recipes, ingredient replacements, custom fasting plans, and target macros.
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0">
            Open Chat Page
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      )}

      {/* REDESIGNED COMPREHENSIVE DETAIL VIEW (Utilizing all available space) */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm p-8 text-left space-y-6">
        <div className="border-b border-gray-50 dark:border-gray-800 pb-4">
          <span className="bg-amber-500/10 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 font-extrabold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
            Clinical Meal Architecture
          </span>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mt-3">
            Meal Plan Structure for {advice.title}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
            {advice.summary}
          </p>
        </div>

        {/* Detailed Grid (No nested card-in-card elements, beautifully laid out with dividers) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-wider">
              <span className="text-emerald-500 text-sm">🍳</span> Breakfast
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
              {advice.breakfast}
            </p>
          </div>

          <div className="space-y-2 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800/80 pt-4 md:pt-0 md:pl-8">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-wider">
              <span className="text-emerald-500 text-sm">🥗</span> Lunch
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
              {advice.lunch}
            </p>
          </div>

          <div className="space-y-2 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800/80 pt-4 md:pt-0 md:pl-8">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-wider">
              <span className="text-emerald-500 text-sm">🍽️</span> Dinner
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
              {advice.dinner}
            </p>
          </div>

          <div className="space-y-2 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800/80 pt-4 md:pt-0 md:pl-8">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-wider">
              <span className="text-emerald-500 text-sm">🍎</span> Snacks
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
              {advice.snacks}
            </p>
          </div>
        </div>

        {/* Extra Clinical Details */}
        <div className="bg-gray-50/50 dark:bg-gray-850/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="text-xs font-extrabold text-gray-800 dark:text-white flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-emerald-500" />
              Dynamic Metabolic Adaptation
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
              Based on your target weight of <strong>{profile.targetWeight} kg</strong> and activity level of <strong>{profile.activityLevel.replace("_", " ")}</strong>, our AI adjusts your energy ratios weekly to prevent physiological plateaus.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 self-end md:self-auto">
            <Info className="w-3.5 h-3.5" /> Updated Live
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// NEW SEPARATE COMPONENT FOR THE DEDICATED AI CHAT PAGE (No nested cards, clean full-screen feel)
// ---------------------------------------------------------------------------------------------
interface AICoachChatProps {
  profile: UserProfile;
  todayMacros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    remainingCalories: number;
  };
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export function AICoachChat({ profile, todayMacros, messages, setMessages }: AICoachChatProps) {
  const [inputMessage, setInputMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const SUGGESTED_PROMPTS = [
    { text: "Suggest a healthy dinner recipe", icon: "🍽️" },
    { text: "What are some high-protein snacks?", icon: "🥚" },
    { text: "Healthy restaurant alternatives", icon: "🥗" },
    { text: "Explain BMR vs TDEE macros", icon: "📊" },
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: `m_user_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      const chatHistory = [...messages, userMsg].map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatHistory,
          userProfile: profile,
          todayMacros: todayMacros,
        }),
      });

      if (!res.ok) throw new Error("Failed to contact AI Coach endpoint");
      const data = await res.json();

      const aiMsg: Message = {
        id: `m_ai_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
        sender: "ai",
        text: data.responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      const fallbackMsg: Message = {
        id: `m_ai_err_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
        sender: "ai",
        text: "I had a temporary connection issue. Please make sure your **Gemini API Key** is connected in the Secrets Panel so that OnSpace AI can run full real-time coaching conversations. To help you in the meantime, a balanced protein and low-GI carb plate is always a great choice!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full flex-grow w-full bg-white dark:bg-gray-900" id="dedicated-chat-view">
      {/* Messages display (Borderless scroll area) */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Elegant Intro Section (Replaces the duplicate sticky header) */}
          <div className="text-center py-8 px-4 border-b border-gray-100 dark:border-gray-800/60 mb-6 space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-emerald-500 text-white font-black text-2xl shadow-md shadow-emerald-500/10 animate-pulse">
              AI
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                OnSpace AI Dietitian
              </h2>
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-gray-400">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                <span>Active Chat Session</span>
                <span className="text-gray-300 dark:text-gray-750">•</span>
                <span className="capitalize">{profile.fitnessGoal.replace("_", " ")} Target</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
              Ask your custom dietitian about tailored meal options, healthy replacements, recipes, or target macro balances optimized for your <strong>{profile.dietPreference === "none" ? "Balanced" : profile.dietPreference}</strong> style.
            </p>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 max-w-full ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender === "ai" && (
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 border border-emerald-500/10">
                  AI
                </div>
              )}
              <div className={`space-y-1 max-w-[80%] ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                <div
                  className={`rounded-2xl px-4 py-3.5 text-xs leading-relaxed text-left whitespace-pre-wrap shadow-sm ${
                    msg.sender === "user"
                      ? "bg-emerald-600 text-white font-medium rounded-tr-none"
                      : "bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-800"
                  }`}
                >
                  {msg.text}
                </div>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 font-medium px-1">
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-4 max-w-[80%] justify-start items-start">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 border border-emerald-500/10">
                AI
              </div>
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl rounded-tl-none p-4 text-xs text-gray-500 flex items-center gap-2.5 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                Analyzing metabolic parameters & dietary databases...
              </div>
            </div>
          )}
        </div>
        <div ref={chatEndRef} />
      </div>

      {/* Suggested chips & Floating Form input footer */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-805 px-6 py-4 space-y-4 shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
        {/* Prompt chips suggestions */}
        <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt.text)}
              className="bg-gray-50 dark:bg-gray-850 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-800/60 border border-gray-200/60 dark:border-gray-800 text-gray-600 dark:text-gray-300 font-bold px-3.5 py-2 rounded-full text-[10px] whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>{prompt.icon}</span>
              <span>{prompt.text}</span>
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputMessage);
          }}
          className="max-w-3xl mx-auto flex gap-2.5 items-center"
        >
          <input
            type="text"
            placeholder="Ask anything (e.g. Can I eat bananas on Keto?)"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={loading}
            className="flex-1 bg-gray-50 dark:bg-gray-850 border border-gray-200/60 dark:border-gray-800 text-gray-800 dark:text-white rounded-2xl px-4 py-3.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-900 transition-all font-medium"
          />
          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="p-3.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 shrink-0 cursor-pointer flex items-center justify-center"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
