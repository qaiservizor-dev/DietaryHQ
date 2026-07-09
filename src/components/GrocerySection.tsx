/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { GroceryItem } from "../types";
import { ShoppingCart, Plus, Check, Trash2, Printer, Download, Tag, Search, RefreshCw } from "lucide-react";

interface GrocerySectionProps {
  groceryList: GroceryItem[];
  setGroceryList: React.Dispatch<React.SetStateAction<GroceryItem[]>>;
}

export default function GrocerySection({ groceryList, setGroceryList }: GrocerySectionProps) {
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<GroceryItem["category"]>("Pantry");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: GroceryItem = {
      id: `g_item_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
      name: newItemName.trim(),
      category: newItemCategory,
      checked: false,
      amount: newItemAmount.trim() || undefined,
    };

    setGroceryList((prev) => [newItem, ...prev]);
    setNewItemName("");
    setNewItemAmount("");
  };

  const handleToggleCheck = (id: string) => {
    setGroceryList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleDeleteItem = (id: string) => {
    setGroceryList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCompleted = () => {
    setGroceryList((prev) => prev.filter((item) => !item.checked));
  };

  // Export List as CSV file downloads
  const handleExportCSV = () => {
    const headers = "Category,Item,Amount,Status\n";
    const rows = groceryList
      .map((item) => `${item.category},"${item.name}",${item.amount || "N/A"},${item.checked ? "Completed" : "Needed"}`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diet_grocery_list.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  // Group items by category for bento rendering
  const categories: GroceryItem["category"][] = [
    "Proteins",
    "Produce",
    "Dairy",
    "Pantry",
    "Grains",
    "Frozen",
    "Spices",
    "Beverages",
    "Other",
  ];

  // Filter list based on search query
  const filteredList = groceryList.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in" id="grocery-section">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 dark:border-gray-900 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-8 h-8 text-emerald-500" />
            Smart Grocery List
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Categorized shopping list synchronized automatically based on your active recipe selections and dietary preferences.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print List
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Add quick item card */}
        <div className="space-y-6">
          <form onSubmit={handleAddItem} className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-850 shadow-sm space-y-4 text-left">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 pb-2 uppercase tracking-wide">
              Add Shopping Item
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Almond Milk, Ribeye steak"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as any)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-1">Amount / Size</label>
                  <input
                    type="text"
                    placeholder="E.g. 1 liter, 200g"
                    value={newItemAmount}
                    onChange={(e) => setNewItemAmount(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add to List
              </button>
            </div>
          </form>

          {/* Statistics summary */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-100 dark:border-emerald-900/40 p-5 rounded-3xl text-left space-y-3">
            <h4 className="text-xs font-extrabold text-teal-950 dark:text-teal-300 uppercase tracking-wide">Basket Projections</h4>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-white dark:bg-gray-900 p-3 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/30">
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">Needed Items</p>
                <p className="text-xl font-black text-gray-850 dark:text-white">
                  {groceryList.filter((i) => !i.checked).length}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-3 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/30">
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">Basket Complete</p>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {Math.round(
                    (groceryList.filter((i) => i.checked).length / (groceryList.length || 1)) * 100
                  )}
                  %
                </p>
              </div>
            </div>
            {groceryList.some((i) => i.checked) && (
              <button
                onClick={handleClearCompleted}
                className="w-full text-center text-xs font-extrabold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-all pt-1 block cursor-pointer"
              >
                Clear completed items
              </button>
            )}
          </div>
        </div>

        {/* Center / Right column: Bento Grid categories list */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search bar inside list view */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search shopping list items or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 text-gray-800 dark:text-white rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {categories.map((cat) => {
              const catItems = filteredList.filter((item) => item.category === cat);
              if (catItems.length === 0) return null;

              return (
                <div key={cat} className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800/80 shadow-sm space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-xs text-gray-400 dark:text-gray-550 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-50 dark:border-gray-800 pb-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-500" />
                      {cat}
                    </h4>

                    <div className="space-y-2.5 mt-3.5">
                      {catItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center group">
                          <button
                            onClick={() => handleToggleCheck(item.id)}
                            className="flex items-center gap-2.5 text-xs text-left text-gray-700 dark:text-gray-350 font-semibold cursor-pointer"
                          >
                            <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                              item.checked
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "border-gray-300 dark:border-gray-700"
                            }`}>
                              {item.checked && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                            <span className={item.checked ? "line-through text-gray-400 dark:text-gray-650" : "text-gray-800 dark:text-gray-200"}>
                              {item.name}
                            </span>
                            {item.amount && (
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal">({item.amount})</span>
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredList.length === 0 && (
              <div className="col-span-full border border-dashed border-gray-100 dark:border-gray-800 rounded-3xl p-12 text-center text-gray-400 dark:text-gray-500 text-xs">
                No items found matching your filter or list is empty.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
