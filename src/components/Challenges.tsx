/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Award, Zap, Users, ShieldAlert, Sparkles, CheckCircle2, Flame, RefreshCw, Calendar, Star, HelpCircle } from "lucide-react";
import { UserProfile, MealLog, WaterLog, ExerciseLog } from "../types";

interface ChallengesProps {
  profile: UserProfile;
  mealLogs: MealLog[];
  waterLogs: WaterLog[];
  exerciseLogs: ExerciseLog[];
  onTriggerNotification?: (title: string, body: string, type: string) => void;
}

interface Challenge {
  id: string;
  title: string;
  desc: string;
  type: "water" | "protein" | "workout" | "streak" | "fasting";
  target: number;
  current: number;
  unit: string;
  xpReward: number;
  claimed: boolean;
  badge: string;
}

interface LeaderboardUser {
  rank: number;
  name: string;
  xp: number;
  isCurrentUser?: boolean;
  avatar: string;
  status?: string;
}

export default function Challenges({
  profile,
  mealLogs,
  waterLogs,
  exerciseLogs,
  onTriggerNotification
}: ChallengesProps) {
  // Load or initialize challenges state
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [totalXp, setTotalXp] = useState<number>(() => {
    return Number(localStorage.getItem("diet_total_xp") || "350");
  });
  const [activeLeaderboard, setActiveLeaderboard] = useState<"global" | "friends">("friends");
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>(() => {
    const saved = localStorage.getItem("diet_unlocked_badges");
    return saved ? JSON.parse(saved) : ["Early Bird", "First Steps"];
  });
  const [showCelebration, setShowCelebration] = useState(false);
  const [latestBadge, setLatestBadge] = useState<string | null>(null);

  // Challenge history
  const [history, setHistory] = useState([
    { title: "Keto Week Warrior", date: "June 28, 2026", status: "Completed", xp: 150 },
    { title: "Hydration Surge", date: "June 21, 2026", status: "Completed", xp: 100 },
    { title: "Active Burner Pro", date: "June 14, 2026", status: "Expired", xp: 0 },
  ]);

  // Sync total XP
  useEffect(() => {
    localStorage.setItem("diet_total_xp", totalXp.toString());
  }, [totalXp]);

  // Sync Badges
  useEffect(() => {
    localStorage.setItem("diet_unlocked_badges", JSON.stringify(unlockedBadges));
  }, [unlockedBadges]);

  // Dynamically compute progress based on user logs for the week
  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    
    // 1. Water this week
    const thisWeekWaterLogs = waterLogs.filter(log => {
      // simplified "last 7 days"
      const diffTime = Math.abs(new Date(todayStr).getTime() - new Date(log.timestamp).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    });
    const totalWaterMl = thisWeekWaterLogs.reduce((sum, curr) => sum + curr.amountMl, 0);
    const waterLitres = Number((totalWaterMl / 1000).toFixed(1));

    // 2. Workouts logged this week
    const thisWeekWorkouts = exerciseLogs.filter(log => {
      const diffTime = Math.abs(new Date(todayStr).getTime() - new Date(log.timestamp).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    });
    const workoutCount = thisWeekWorkouts.length;

    // 3. Protein logged today/this week
    let totalProteinG = 0;
    const thisWeekMealLogs = mealLogs.filter(log => {
      const diffTime = Math.abs(new Date(todayStr).getTime() - new Date(log.timestamp).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    });
    thisWeekMealLogs.forEach(log => {
      (log.foods || []).forEach(lf => {
        totalProteinG += (lf.food.protein || 0) * lf.servings;
      });
    });
    const avgProtein = thisWeekMealLogs.length > 0 ? Math.round(totalProteinG / 7) : 0;

    // Set initial active challenges for the week
    const weekChallenges: Challenge[] = [
      {
        id: "c1",
        title: "Weekly Hydration Champion",
        desc: "Consume a total of 15 Liters of water throughout this week.",
        type: "water",
        target: 15,
        current: Math.min(15, waterLitres),
        unit: "L",
        xpReward: 150,
        claimed: localStorage.getItem("diet_claimed_c1") === "true",
        badge: "Hydration Lord"
      },
      {
        id: "c2",
        title: "Workout Streak Spark",
        desc: "Log 4 workouts of any type to supercharge cardiac output.",
        type: "workout",
        target: 4,
        current: Math.min(4, workoutCount),
        unit: "sessions",
        xpReward: 200,
        claimed: localStorage.getItem("diet_claimed_c2") === "true",
        badge: "Cardio King"
      },
      {
        id: "c3",
        title: "Protein Satiety Shield",
        desc: "Maintain an average daily protein intake of 120g.",
        type: "protein",
        target: 120,
        current: Math.min(120, avgProtein),
        unit: "g/day average",
        xpReward: 250,
        claimed: localStorage.getItem("diet_claimed_c3") === "true",
        badge: "Anabolic Elite"
      },
      {
        id: "c4",
        title: "Mindful Food Logger",
        desc: "Record at least 3 meals a day for 5 consecutive days.",
        type: "streak",
        target: 5,
        current: mealLogs.length >= 3 ? 5 : 4, // Simulated streak based on meals logged
        unit: "days",
        xpReward: 180,
        claimed: localStorage.getItem("diet_claimed_c4") === "true",
        badge: "Journal Master"
      }
    ];

    setChallenges(weekChallenges);
  }, [mealLogs, waterLogs, exerciseLogs]);

  const handleClaimReward = (challenge: Challenge) => {
    if (challenge.current < challenge.target || challenge.claimed) return;

    // Reward XP
    setTotalXp(prev => prev + challenge.xpReward);
    localStorage.setItem(`diet_claimed_${challenge.id}`, "true");

    // Unlock Badge
    if (!unlockedBadges.includes(challenge.badge)) {
      setUnlockedBadges(prev => [...prev, challenge.badge]);
      setLatestBadge(challenge.badge);
    }

    // Trigger celebration overlay
    setShowCelebration(true);
    if (onTriggerNotification) {
      onTriggerNotification(
        "Reward Claimed! 🎉",
        `You gained +${challenge.xpReward} XP and unlocked the "${challenge.badge}" badge!`,
        "success"
      );
    }

    // Update state to claimed
    setChallenges(prev =>
      prev.map(c => (c.id === challenge.id ? { ...c, claimed: true } : c))
    );
  };

  // Mock friends and global ranking
  const friendsLeaderboard: LeaderboardUser[] = [
    { rank: 1, name: "Marcus Thorne", xp: 1240, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80", status: "On a 7-day streak! 🔥" },
    { rank: 2, name: "Sarah Jenkins", xp: 980, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80", status: "Ate 120g protein today" },
    { rank: 3, name: `${profile.name} (You)`, xp: totalXp, isCurrentUser: true, avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80", status: "Active in 4 challenges" },
    { rank: 4, name: "David Chen", xp: 420, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80", status: "Fasted for 16h yesterday" },
  ].sort((a, b) => b.xp - a.xp).map((u, idx) => ({ ...u, rank: idx + 1 }));

  const globalLeaderboard: LeaderboardUser[] = [
    { rank: 1, name: "Jessica Alba", xp: 4890, avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80", status: "Global Hydration Leader 💧" },
    { rank: 2, name: "Ryan Reynolds", xp: 4120, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80" },
    { rank: 3, name: "Marcus Thorne", xp: 1240, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" },
    { rank: 4, name: `${profile.name} (You)`, xp: totalXp, isCurrentUser: true, avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80" },
  ].sort((a, b) => b.xp - a.xp).map((u, idx) => ({ ...u, rank: idx + 1 }));

  const currentLeaderboard = activeLeaderboard === "friends" ? friendsLeaderboard : globalLeaderboard;

  // Badge library mapping
  const badgeIcons: Record<string, string> = {
    "Early Bird": "🌅",
    "First Steps": "🦶",
    "Hydration Lord": "💧",
    "Cardio King": "⚡",
    "Anabolic Elite": "🥩",
    "Journal Master": "✍️",
  };

  return (
    <div className="space-y-8 relative" id="challenges-section">
      {/* Confetti & Reward Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-emerald-500/30 text-white rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/20 to-transparent pointer-events-none" />
              
              <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-400 rounded-full flex items-center justify-center mx-auto text-4xl animate-bounce">
                🎉
              </div>

              <div className="space-y-2">
                <p className="text-emerald-400 font-extrabold uppercase tracking-widest text-[10px]">Claim Succeeded</p>
                <h3 className="text-xl font-black">XP Claimed Successfully!</h3>
                <p className="text-xs text-slate-300 leading-normal">
                  Your hard work paid off. You collected massive XP and unlocked another elite wellness level. Keep hitting those goals!
                </p>
              </div>

              {latestBadge && (
                <div className="bg-slate-800/80 border border-emerald-500/10 rounded-2xl p-4 flex items-center gap-3 text-left">
                  <span className="text-3xl">{badgeIcons[latestBadge] || "🎖️"}</span>
                  <div>
                    <p className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Badge Unlocked</p>
                    <p className="text-sm font-extrabold text-white">{latestBadge}</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setShowCelebration(false);
                  setLatestBadge(null);
                }}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Let's Keep Crusading
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Title Greeting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-150 dark:border-gray-900 pb-5 text-left">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Trophy className="w-8 h-8 text-amber-500" />
            Weekly Challenges
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Complete high-yielding nutrition and activity quests. Level up your health and compete with peers!
          </p>
        </div>

        {/* User Level Indicator */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200/30 dark:border-amber-900/30 px-4 py-3 rounded-2xl shadow-sm">
          <Zap className="w-6 h-6 text-amber-500 animate-pulse fill-current" />
          <div className="text-left">
            <p className="text-[10px] uppercase font-bold tracking-wider text-amber-800 dark:text-amber-400">Your Wellness Level</p>
            <p className="text-sm font-black text-gray-900 dark:text-white">Level {Math.floor(totalXp / 500) + 1} • <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{totalXp} XP</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Active Challenges List Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 pb-2.5 text-left flex items-center justify-between">
              <span>Active Weekly Quests</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full uppercase">Week 27 Active</span>
            </h3>

            <div className="space-y-4 divide-y divide-gray-100 dark:divide-gray-800/60">
              {challenges.map((challenge, idx) => {
                const progressPct = Math.min(100, (challenge.current / challenge.target) * 100);
                const isCompleted = challenge.current >= challenge.target;

                return (
                  <div
                    key={challenge.id}
                    className={`text-left transition-all ${idx > 0 ? "pt-5" : ""} ${
                      challenge.claimed ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      
                      {/* Left: Icon, Title & Description */}
                      <div className="flex gap-4 items-start flex-1 min-w-0">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 mt-0.5 shadow-sm border ${
                          isCompleted 
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-200/20 dark:border-emerald-900/20" 
                            : "bg-amber-500/10 text-amber-500 border-amber-200/20 dark:border-amber-900/20"
                        }`}>
                          {challenge.type === "water" ? "💧" : challenge.type === "workout" ? "⚡" : challenge.type === "protein" ? "🥩" : "🔥"}
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h4 className="font-extrabold text-gray-900 dark:text-white text-base">
                              {challenge.title}
                            </h4>
                            <span className="bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                              +{challenge.xpReward} XP
                            </span>
                            <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-450 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shrink-0">
                              Badge: {challenge.badge}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-xl">
                            {challenge.desc}
                          </p>
                        </div>
                      </div>

                      {/* Middle: Progress Bar & Info (Takes full width on mobile, nicely sized on desktop) */}
                      <div className="w-full md:w-64 shrink-0 space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold text-gray-600 dark:text-gray-300">
                          <span>Weekly Progress</span>
                          <span className="text-gray-900 dark:text-white">
                            {challenge.current} / {challenge.target} <span className="text-gray-400 font-normal">{challenge.unit}</span>
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-700 ease-out ${
                              challenge.claimed
                                ? "bg-gray-400 dark:bg-gray-600"
                                : isCompleted
                                ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                                : "bg-gradient-to-r from-emerald-500 to-sky-400"
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-450 dark:text-gray-500 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>Expires in 5 days</span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center justify-between md:justify-end shrink-0 md:pl-4 border-t md:border-t-0 pt-3 md:pt-0 border-gray-50 dark:border-gray-850">
                        {challenge.claimed ? (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-black bg-emerald-50 dark:bg-emerald-950/20 px-3.5 py-1.5 rounded-xl uppercase tracking-wider">
                            Claimed
                          </span>
                        ) : isCompleted ? (
                          <button
                            onClick={() => handleClaimReward(challenge)}
                            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer animate-pulse shrink-0"
                          >
                            <Award className="w-4 h-4" /> Claim Reward!
                          </button>
                        ) : (
                          <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-3.5 py-1.5 rounded-xl font-black uppercase tracking-wider">
                            In Progress
                          </span>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 pb-2 text-left">
              Achievements & Unlocked Badges
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5 pt-2">
              {[
                { title: "Early Bird", desc: "First onboarding check", badge: "Early Bird" },
                { title: "First Steps", desc: "Logged 1 weight entry", badge: "First Steps" },
                { title: "Anabolic Elite", desc: "Average 120g+ protein", badge: "Anabolic Elite" },
                { title: "Hydration Lord", desc: "15L water weekly", badge: "Hydration Lord" },
                { title: "Cardio King", desc: "Log 4 workouts", badge: "Cardio King" },
                { title: "Journal Master", desc: "Log 5 consecutive days", badge: "Journal Master" }
              ].map((b, idx) => {
                const isUnlocked = unlockedBadges.includes(b.badge);
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl text-center flex flex-col justify-between items-center transition-all relative ${
                      isUnlocked
                        ? "bg-amber-500/10 dark:bg-amber-500/20 text-amber-950 dark:text-amber-300"
                        : "bg-gray-50 dark:bg-gray-800/40 opacity-45 text-gray-400"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm mb-2.5 transition-transform duration-300 ${
                      isUnlocked 
                        ? 'bg-amber-400/20 hover:scale-110' 
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      {badgeIcons[b.badge] || "🎖️"}
                    </div>
                    <p className="text-[10px] font-extrabold leading-tight truncate w-full">{b.title}</p>
                    <p className="text-[8px] text-amber-600 dark:text-amber-400 mt-1 uppercase font-black tracking-wider">
                      {isUnlocked ? "Unlocked" : "Locked"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Leaderboards Column */}
        <div className="space-y-6">
          {/* Real-time Leaderboard list card */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-gray-50 dark:border-gray-800 pb-3">
              <h4 className="font-extrabold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                <Users className="w-4.5 h-4.5 text-emerald-500" />
                Leaderboards
              </h4>
              
              <div className="flex bg-gray-50 dark:bg-gray-800 p-0.5 rounded-lg border border-gray-100 dark:border-gray-850">
                <button
                  onClick={() => setActiveLeaderboard("friends")}
                  className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider transition-all cursor-pointer ${
                    activeLeaderboard === "friends"
                      ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "text-gray-400 hover:text-gray-700"
                  }`}
                >
                  Friends
                </button>
                <button
                  onClick={() => setActiveLeaderboard("global")}
                  className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider transition-all cursor-pointer ${
                    activeLeaderboard === "global"
                      ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "text-gray-400 hover:text-gray-700"
                  }`}
                >
                  Global
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-1 text-left">
              {currentLeaderboard.map((user) => (
                <div
                  key={user.rank}
                  className={`py-2 px-3 flex justify-between items-center transition-all rounded-xl ${
                    user.isCurrentUser
                      ? "bg-emerald-500/10 text-emerald-900 dark:text-emerald-300"
                      : "hover:bg-gray-50 dark:hover:bg-gray-850/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank indicator badge */}
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                      user.rank === 1
                        ? "bg-amber-100 text-amber-700 border border-amber-300 animate-pulse"
                        : user.rank === 2
                        ? "bg-slate-100 text-slate-700 border border-slate-300"
                        : user.rank === 3
                        ? "bg-orange-100 text-orange-700 border border-orange-300"
                        : "bg-gray-50 dark:bg-gray-800 text-gray-400"
                    }`}>
                      {user.rank}
                    </span>

                    {/* Avatar */}
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-gray-150 shrink-0"
                    />

                    <div className="min-w-0">
                      <p className={`text-xs font-extrabold truncate max-w-[110px] ${user.isCurrentUser ? "text-emerald-700 dark:text-emerald-400" : "text-gray-800 dark:text-white"}`}>
                        {user.name}
                      </p>
                      {user.status && <p className="text-[9px] text-gray-450 dark:text-gray-500 mt-0.5 truncate max-w-[120px]">{user.status}</p>}
                    </div>
                  </div>

                  <span className="font-mono text-xs font-black text-gray-800 dark:text-white shrink-0 pl-2">
                    {user.xp} XP
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Challenge history panel */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide border-b border-gray-50 dark:border-gray-800 pb-2 text-left">
              Challenge History
            </h4>
            <div className="space-y-3 pt-1 text-left">
              {history.map((h, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs py-1.5 last:border-0 border-b border-gray-50 dark:border-gray-850">
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-gray-700 dark:text-gray-300">{h.title}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-550 font-medium">{h.date}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${
                      h.status === "Completed"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                    }`}>
                      {h.status}
                    </span>
                    {h.xp > 0 && <p className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold mt-0.5 font-mono">+{h.xp} XP</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
