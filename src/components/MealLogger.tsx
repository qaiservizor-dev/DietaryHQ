/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { FoodItem, MealType, MealLog, UserProfile, LoggedFood } from "../types";
import { Search, Plus, Sparkles, Image, Check, AlertCircle, Bookmark, Trash2, Heart, PlusCircle, Camera, QrCode } from "lucide-react";

interface MealLoggerProps {
  profile: UserProfile;
  mealLogs: MealLog[];
  onAddMealLog: (mealType: MealType, food: FoodItem, servings: number) => void;
  onRemoveMealLog: (logId: string, loggedFoodId: string) => void;
}

export default function MealLogger({ profile, mealLogs, onAddMealLog, onRemoveMealLog }: MealLoggerProps) {
  const [activeTab, setActiveTab] = useState<MealType>("breakfast");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [servings, setServings] = useState<number>(1);
  const [favorites, setFavorites] = useState<FoodItem[]>([]);
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([]);
  
  // Custom Food Form
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customServing, setCustomServing] = useState("100g");
  const [customCalories, setCustomCalories] = useState<number | "">("");
  const [customProtein, setCustomProtein] = useState<number | "">("");
  const [customCarbs, setCustomCarbs] = useState<number | "">("");
  const [customFat, setCustomFat] = useState<number | "">("");

  // AI Scanner state
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<Partial<FoodItem> & { ingredients?: string } | null>(null);
  const [scanError, setScanError] = useState("");

  // Barcode Scanner Simulation state
  const [barcodeScanning, setBarcodeScanning] = useState(false);
  const [showBarcodeDialog, setShowBarcodeDialog] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [barcodeResult, setBarcodeResult] = useState<FoodItem | null>(null);

  const BARCODE_ITEMS = [
    { name: "Organic Peanut Butter Bar", brand: "Clif Bar", servingSize: "1 bar (68g)", calories: 250, protein: 9, carbs: 44, fat: 7 },
    { name: "Premium Greek Yogurt - Strawberries", brand: "Chobani Fruit On Bottom", servingSize: "1 cup (150g)", calories: 120, protein: 12, carbs: 15, fat: 0 },
    { name: "Whole Grain Rolled Oats Cup", brand: "Bob's Red Mill", servingSize: "1 cup (51g)", calories: 190, protein: 7, carbs: 32, fat: 3 },
    { name: "Salted Almond Butter Blend", brand: "Justin's Squeeze Pack", servingSize: "1 pack (32g)", calories: 190, protein: 6, carbs: 6, fat: 18 },
    { name: "Dark Chocolate Mint Protein Crisp", brand: "Think! Keto Bar", servingSize: "1 bar (40g)", calories: 150, protein: 10, carbs: 13, fat: 8 }
  ];

  const handleStartBarcodeScan = () => {
    setShowBarcodeDialog(true);
    setBarcodeScanning(true);
    setScannedBarcode("");
    setBarcodeResult(null);

    setTimeout(() => {
      // Simulate successful scan after 2 seconds
      setBarcodeScanning(false);
      const barcodeNum = Math.floor(100000000000 + Math.random() * 900000000000).toString();
      setScannedBarcode(barcodeNum);
      
      const randomItem = BARCODE_ITEMS[Math.floor(Math.random() * BARCODE_ITEMS.length)];
      setBarcodeResult({
        id: `barcode_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
        name: randomItem.name,
        brand: randomItem.brand,
        servingSize: randomItem.servingSize,
        calories: randomItem.calories,
        protein: randomItem.protein,
        carbs: randomItem.carbs,
        fat: randomItem.fat,
      });
    }, 2000);
  };

  // Search foods on mount and query updates
  useEffect(() => {
    const fetchSearch = async () => {
      try {
        const res = await fetch(`/api/foods/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.error("Error searching foods:", err);
      }
    };
    const debounceTimer = setTimeout(fetchSearch, searchQuery ? 200 : 0);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Load standard seed foods into search as default on first render
  useEffect(() => {
    const fetchDefault = async () => {
      const res = await fetch("/api/foods/search");
      const data = await res.json();
      setSearchResults(data.slice(0, 8));
      // Populate defaults for recents
      setRecentFoods(data.slice(2, 6));
      setFavorites(data.slice(0, 3));
    };
    fetchDefault();
  }, []);

  const handleLogFood = (food: FoodItem) => {
    onAddMealLog(activeTab, food, servings);
    
    // Add to recents
    if (!recentFoods.some(f => f.id === food.id)) {
      setRecentFoods(prev => [food, ...prev.slice(0, 9)]);
    }
    
    // Reset inputs
    setSearchQuery("");
  };

  const handleCreateCustomFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customServing || customCalories === "") return;

    const payload = {
      name: customName,
      servingSize: customServing,
      calories: Number(customCalories),
      protein: Number(customProtein || 0),
      carbs: Number(customCarbs || 0),
      fat: Number(customFat || 0),
    };

    try {
      const res = await fetch("/api/foods/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const newFood = await res.json();
      handleLogFood(newFood);
      
      // Reset form
      setShowCustomForm(false);
      setCustomName("");
      setCustomServing("100g");
      setCustomCalories("");
      setCustomProtein("");
      setCustomCarbs("");
      setCustomFat("");
    } catch (err) {
      console.error("Error creating custom food:", err);
    }
  };

  const toggleFavorite = (food: FoodItem) => {
    if (favorites.some(f => f.id === food.id)) {
      setFavorites(prev => prev.filter(f => f.id !== food.id));
    } else {
      setFavorites(prev => [...prev, food]);
    }
  };

  // Process manual image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(",")[1];
      await requestAIScan(base64String);
    };
    reader.readAsDataURL(file);
  };

  // Helper trigger for instant demo scans using curated sample base64 strings or simulated ones
  const triggerDemoScan = async (sampleFoodName: string) => {
    setScanning(true);
    setScanError("");
    setScanResult(null);
    try {
      // Direct call to endpoint with clean simulation fallback
      const res = await fetch("/api/ai/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: "DEMO_KEY_" + sampleFoodName }),
      });
      const data = await res.json();
      setScanResult(data);
    } catch (err: any) {
      setScanError("Unable to compute meal scan. Using manual entry.");
    } finally {
      setScanning(false);
    }
  };

  const requestAIScan = async (base64: string) => {
    setScanning(true);
    setScanError("");
    setScanResult(null);
    try {
      const res = await fetch("/api/ai/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      if (!res.ok) throw new Error("Failed to scan.");
      const data = await res.json();
      setScanResult(data);
    } catch (err: any) {
      setScanError("Gemini Vision failed or API key not connected. Using local food identifier.");
      triggerDemoScan("Generic Dish");
    } finally {
      setScanning(false);
    }
  };

  const logScannedFood = () => {
    if (!scanResult) return;
    const foodItem: FoodItem = {
      id: `ai_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
      name: scanResult.name || "AI Analyzed Dish",
      brand: "AI Estimator",
      servingSize: scanResult.servingSize || "1 portion",
      calories: scanResult.calories || 0,
      protein: scanResult.protein || 0,
      carbs: scanResult.carbs || 0,
      fat: scanResult.fat || 0,
    };
    handleLogFood(foodItem);
    setScanResult(null);
  };

  // Extract logged items for current tab
  const activeLogs = mealLogs.find(log => log.mealType === activeTab)?.foods || [];
  const currentMealLog = mealLogs.find(log => log.mealType === activeTab);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="meal-logger-section">
      
      {/* Search and Logging section */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-50 dark:border-gray-800 pb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <PlusCircle className="w-5.5 h-5.5 text-emerald-500" />
              Add Food to Diary
            </h2>
            <div className="flex p-0.5 bg-gray-100 dark:bg-gray-800 rounded-xl w-full sm:w-auto overflow-x-auto scrollbar-none">
              {(["breakfast", "lunch", "dinner", "snacks"] as MealType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 sm:flex-none px-2.5 py-1.5 text-[10px] sm:text-xs font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer text-center ${
                    activeTab === tab
                      ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Search box & Scanner toggle */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search food database (e.g. Avocado, Chicken...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-900 outline-none"
              />
            </div>
            <button
              onClick={() => setShowCustomForm(!showCustomForm)}
              className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Custom
            </button>
          </div>

          {/* Custom food drawer form */}
          {showCustomForm && (
            <form onSubmit={handleCreateCustomFood} className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/30 space-y-4 animate-fade-in">
              <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Create & Log Custom Food</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="col-span-2 md:col-span-1">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-gray-500 block mb-1">Name</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Protein Pancake"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-gray-500 block mb-1">Serving Size</label>
                  <input
                    type="text"
                    required
                    value={customServing}
                    onChange={(e) => setCustomServing(e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-gray-500 block mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    required
                    value={customCalories}
                    onChange={(e) => setCustomCalories(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-gray-500 block mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={customProtein}
                    onChange={(e) => setCustomProtein(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-gray-500 block mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={customCarbs}
                    onChange={(e) => setCustomCarbs(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-gray-500 block mb-1">Fat (g)</label>
                  <input
                    type="number"
                    value={customFat}
                    onChange={(e) => setCustomFat(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 text-xs font-bold pt-1">
                <button
                  type="button"
                  onClick={() => setShowCustomForm(false)}
                  className="px-3.5 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg cursor-pointer"
                >
                  Log Food Item
                </button>
              </div>
            </form>
          )}

          {/* Quick servings multiplier */}
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-950/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Servings Log Multiplier:</span>
            <input
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              value={servings}
              onChange={(e) => setServings(Number(e.target.value))}
              className="w-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center rounded-lg py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 outline-none"
            />
            <span className="text-xs text-gray-400 dark:text-gray-500">x Serving size</span>
          </div>

          {/* Search Result Food items */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-extrabold">Search Results</p>
            <div className="divide-y divide-gray-50 dark:divide-gray-850 max-h-[350px] overflow-y-auto pr-1 text-left">
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400 italic">No matching ingredients found.</div>
              ) : (
                searchResults.map((food) => (
                  <div key={food.id} className="flex justify-between items-center py-2 group">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-800 dark:text-white text-sm">{food.name}</span>
                        {food.brand && <span className="text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded font-medium">{food.brand}</span>}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 text-left">
                        {food.servingSize} • <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{food.calories} kcal</span> • P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleFavorite(food)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          favorites.some(f => f.id === food.id)
                            ? "border-rose-100 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/40 text-rose-500"
                            : "border-gray-100 dark:border-gray-800 text-gray-400 hover:text-rose-500"
                        }`}
                      >
                        <Heart className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button
                        onClick={() => handleLogFood(food)}
                        className="p-1.5 bg-emerald-50 dark:bg-emerald-950/55 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 rounded-lg transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Smart Barcode Scanner Simulation Block */}
        <div className="bg-gradient-to-r from-emerald-600/90 via-teal-600/95 to-emerald-700/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-white flex flex-col md:flex-row justify-between items-center gap-4 shadow-[0_12px_40px_rgba(16,185,129,0.15)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-extrabold text-white">Smart Barcode Scanner</h4>
              <p className="text-[11px] text-emerald-100">Simulate opening your device's camera to 'scan' product barcodes instantly</p>
            </div>
          </div>
          <button
            onClick={handleStartBarcodeScan}
            className="bg-white hover:bg-emerald-50 text-emerald-700 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-emerald-600 animate-pulse" />
            Scan Barcode
          </button>
        </div>

        {/* Vision AI Section */}
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-gray-100/70 dark:border-slate-800/60 p-6 rounded-3xl space-y-4 text-left shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_12px_40px_rgb(0,0,0,0.15)]">
          <div className="flex justify-between items-start">
            <div>
              <span className="bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 text-[10px] uppercase font-black px-2.5 py-1 rounded-full">
                AI Vision Recognition
              </span>
              <h3 className="text-lg font-extrabold text-teal-900 dark:text-white mt-1.5 flex items-center gap-1">
                <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
                Analyze Food Photo
              </h3>
              <p className="text-xs text-teal-700/80 dark:text-gray-300 mt-1 leading-relaxed">
                Upload a real dish image or snap a picture. Gemini instantly estimates calories, portions, ingredients, and full macro distributions.
              </p>
            </div>
          </div>

          {/* Vision Trigger options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Upload form */}
            <div className="border border-dashed border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-gray-900 rounded-2xl p-4 flex flex-col justify-center items-center text-center relative group hover:border-emerald-500 transition-all cursor-pointer">
              <Image className="w-8 h-8 text-emerald-500 mb-2 group-hover:scale-110 transition-all" />
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Upload Food Photo</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">JPEG or PNG format</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            {/* Simulated Demo Quick Buttons for instant UI validation */}
            <div className="space-y-2">
              <p className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-800 dark:text-emerald-400">Or Demo AI Recognition instantly:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => triggerDemoScan("Avocado Toast")}
                  className="bg-white/80 dark:bg-gray-900 hover:bg-white dark:hover:bg-gray-800 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-100 dark:border-emerald-900/30 rounded-xl px-3 py-2 text-xs transition-all text-left truncate flex items-center gap-1 cursor-pointer"
                >
                  🥑 Avocado Toast
                </button>
                <button
                  onClick={() => triggerDemoScan("Chicken Caesar Salad")}
                  className="bg-white/80 dark:bg-gray-900 hover:bg-white dark:hover:bg-gray-800 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-100 dark:border-emerald-900/30 rounded-xl px-3 py-2 text-xs transition-all text-left truncate flex items-center gap-1 cursor-pointer"
                >
                  🥗 Caesar Salad
                </button>
                <button
                  onClick={() => triggerDemoScan("Acai Granola Bowl")}
                  className="bg-white/80 dark:bg-gray-900 hover:bg-white dark:hover:bg-gray-800 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-100 dark:border-emerald-900/30 rounded-xl px-3 py-2 text-xs transition-all text-left truncate flex items-center gap-1 cursor-pointer"
                >
                  🍇 Acai Berry Bowl
                </button>
                <button
                  onClick={() => triggerDemoScan("Salmon Teriyaki")}
                  className="bg-white/80 dark:bg-gray-900 hover:bg-white dark:hover:bg-gray-800 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-100 dark:border-emerald-900/30 rounded-xl px-3 py-2 text-xs transition-all text-left truncate flex items-center gap-1 cursor-pointer"
                >
                  🐟 Grilled Salmon
                </button>
              </div>
            </div>
          </div>

          {/* AI scan result dialog */}
          {scanning && (
            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center gap-3 shadow-md animate-pulse">
              <Sparkles className="w-6 h-6 text-emerald-500 animate-spin" />
              <div className="text-left">
                <p className="text-xs font-bold text-gray-850 dark:text-gray-150">Gemini is analyzing food pixels...</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">Projecting ingredients, density, and caloric weights</p>
              </div>
            </div>
          )}

          {scanResult && (
            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 space-y-4 shadow-md animate-fade-in text-left">
              <div className="flex justify-between items-start border-b border-gray-50 dark:border-gray-800 pb-2">
                <div>
                  <h4 className="font-extrabold text-emerald-800 dark:text-emerald-400 text-sm">{scanResult.name}</h4>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">Serving Est: {scanResult.servingSize}</p>
                </div>
                <span className="bg-emerald-500 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg">
                  {scanResult.calories} kcal
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded-xl">
                  <p className="text-[9px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-bold">Protein</p>
                  <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">{scanResult.protein}g</p>
                </div>
                <div className="bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded-xl">
                  <p className="text-[9px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-bold">Carbs</p>
                  <p className="text-xs font-black text-amber-700 dark:text-amber-400">{scanResult.carbs}g</p>
                </div>
                <div className="bg-rose-50/50 dark:bg-rose-950/20 p-2 rounded-xl">
                  <p className="text-[9px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-bold">Fat</p>
                  <p className="text-xs font-black text-rose-700 dark:text-rose-400">{scanResult.fat}g</p>
                </div>
              </div>

              {scanResult.ingredients && (
                <div className="text-[11px] text-gray-550 dark:text-gray-350 leading-relaxed border-t border-gray-50 dark:border-gray-805 pt-2.5">
                  <span className="font-bold text-emerald-800 dark:text-emerald-400 block mb-0.5">Estimated Ingredients:</span>
                  {scanResult.ingredients}
                </div>
              )}

              <div className="flex justify-end gap-2 text-xs font-bold border-t border-gray-50 dark:border-gray-805 pt-3">
                <button
                  onClick={() => setScanResult(null)}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-850 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg transition-all cursor-pointer"
                >
                  Discard
                </button>
                <button
                  onClick={logScannedFood}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Log to {activeTab}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Today's Logged Meals Review */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h3 className="text-lg font-black text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 pb-3 flex items-center justify-between">
            <span>Diary: {activeTab.toUpperCase()}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Today
            </span>
          </h3>

          <div className="space-y-4 text-left">
            {activeLogs.length === 0 ? (
              <div className="py-12 text-center text-gray-400 space-y-2">
                <Bookmark className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto" />
                <p className="text-sm font-semibold">No food logged for {activeTab}</p>
                <p className="text-xs max-w-[200px] mx-auto text-gray-450 leading-normal">
                  Search ingredients above or use the AI visual scanner to add items.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                {activeLogs.map((loggedFood) => {
                  const f = loggedFood.food;
                  const mult = loggedFood.servings;
                  return (
                    <div key={loggedFood.id} className="bg-gray-50 dark:bg-gray-850 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 flex justify-between items-center group">
                      <div className="space-y-0.5 text-left">
                        <p className="font-bold text-gray-805 dark:text-white text-sm">{f.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {mult} x {f.servingSize} • <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{Math.round(f.calories * mult)} kcal</span>
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                          P: {Math.round(f.protein * mult)}g | C: {Math.round(f.carbs * mult)}g | F: {Math.round(f.fat * mult)}g
                        </p>
                      </div>
                      <button
                        onClick={() => currentMealLog && onRemoveMealLog(currentMealLog.id, loggedFood.id)}
                        className="p-1.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick presets & favorites */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide border-b border-gray-50 dark:border-gray-800 pb-2 text-left">
            Favorites & Quick Presets
          </h4>
          <div className="space-y-2">
            {favorites.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">No custom favorites marked. Press heart next to any food.</p>
            ) : (
              favorites.map(food => (
                <div key={`fav_${food.id}`} className="flex justify-between items-center text-xs py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0 text-left">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{food.name} ({food.calories} kcal)</span>
                  <button
                    onClick={() => handleLogFood(food)}
                    className="p-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-500 hover:text-white rounded text-emerald-600 dark:text-emerald-400 transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 📸 BARCODE SCANNER MODAL VIEW */}
      {showBarcodeDialog && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl text-center relative p-6 space-y-6">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400 animate-pulse" />
                <h3 className="text-sm font-extrabold text-white">Device Camera Viewfinder</h3>
              </div>
              <button 
                onClick={() => {
                  setShowBarcodeDialog(false);
                  setBarcodeScanning(false);
                }}
                className="text-gray-400 hover:text-white text-lg font-black"
              >
                &times;
              </button>
            </div>

            {barcodeScanning ? (
              <div className="relative w-full h-56 bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800">
                {/* Simulated live camera blur */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-950/20 via-black to-black opacity-80"></div>
                
                {/* Retro scanning line */}
                <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] top-1/2 animate-bounce"></div>
                
                {/* Scanner Target Box Corners */}
                <div className="absolute w-44 h-24 border-2 border-emerald-500/40 rounded-xl flex items-center justify-center">
                  {/* barcode graphic lines */}
                  <div className="flex gap-1 items-center opacity-60">
                    <span className="w-1.5 h-12 bg-white rounded-sm"></span>
                    <span className="w-0.5 h-12 bg-white rounded-sm"></span>
                    <span className="w-2.5 h-12 bg-white rounded-sm"></span>
                    <span className="w-1 h-12 bg-white rounded-sm"></span>
                    <span className="w-0.5 h-12 bg-white rounded-sm"></span>
                    <span className="w-1.5 h-12 bg-white rounded-sm"></span>
                    <span className="w-2 h-12 bg-white rounded-sm"></span>
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-extrabold animate-pulse">Align barcode with scanner laser</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Result Block */}
                <div className="bg-emerald-950/30 border border-emerald-500/20 p-5 rounded-2xl text-left space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] uppercase font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                        Simulated UPC: {scannedBarcode}
                      </span>
                      <h4 className="text-base font-extrabold text-white mt-1.5">{barcodeResult?.name}</h4>
                      <p className="text-xs text-gray-400">{barcodeResult?.brand} • {barcodeResult?.servingSize}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-emerald-400">{barcodeResult?.calories}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Calories</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-slate-800 pt-3">
                    <div className="bg-slate-850 p-2 rounded-xl">
                      <p className="font-extrabold text-white">{barcodeResult?.protein}g</p>
                      <p className="text-[9px] text-gray-500 uppercase font-black">Protein</p>
                    </div>
                    <div className="bg-slate-850 p-2 rounded-xl">
                      <p className="font-extrabold text-white">{barcodeResult?.carbs}g</p>
                      <p className="text-[9px] text-gray-500 uppercase font-black">Carbs</p>
                    </div>
                    <div className="bg-slate-850 p-2 rounded-xl">
                      <p className="font-extrabold text-white">{barcodeResult?.fat}g</p>
                      <p className="text-[9px] text-gray-500 uppercase font-black">Fat</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleStartBarcodeScan}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Scan Another
                  </button>
                  <button
                    onClick={() => {
                      if (barcodeResult) {
                        handleLogFood(barcodeResult);
                        setShowBarcodeDialog(false);
                        const t = document.createElement("div");
                        t.className = "fixed bottom-5 right-5 bg-emerald-600 text-white text-xs px-4 py-2.5 rounded-xl z-50 shadow-lg border border-emerald-500 font-bold flex items-center gap-1 animate-bounce";
                        t.innerHTML = `🛒 Logged ${barcodeResult.name}!`;
                        document.body.appendChild(t);
                        setTimeout(() => t.remove(), 2500);
                      }
                    }}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
                  >
                    Log Scanned Food
                  </button>
                </div>
              </div>
            )}
            
            <div className="text-[10px] text-gray-500 italic">
              AI camera simulation replicates standard optical hardware inputs using dynamic mock state.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
