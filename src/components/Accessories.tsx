import React, { useState, useMemo } from 'react';
import { AccessoryItem, AccessorySale, Member, Payment } from '../types';
import { MaskedAmount } from './MaskedAmount';
import { CashIcon, BankIcon, PhonePayIcon, AccessoriesIcon, TrashIcon, CloseIcon } from './icons';
import { getLocalDateString } from '../lib/dateUtils';

interface AccessoriesProps {
  accessories: AccessoryItem[];
  accessorySales: AccessorySale[];
  members: Member[];
  onAddAccessoryItem: (item: Omit<AccessoryItem, 'id'>) => void;
  onUpdateAccessoryItem: (item: AccessoryItem) => void;
  onDeleteAccessoryItem: (id: string) => void;
  onSellAccessoryItem: (
    accessoryId: string,
    quantity: number,
    buyerName: string,
    method: Payment['method'],
    dateStr?: string,
    memberId?: string
  ) => { success: boolean; message: string };
  onDeleteAccessorySale: (saleId: string) => void;
  isUnlocked: boolean;
  onUnlockRequest: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const Accessories: React.FC<AccessoriesProps> = ({
  accessories,
  accessorySales,
  members,
  onAddAccessoryItem,
  onUpdateAccessoryItem,
  onDeleteAccessoryItem,
  onSellAccessoryItem,
  onDeleteAccessorySale,
  isUnlocked,
  onUnlockRequest,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'sales'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals state
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AccessoryItem | null>(null);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedItemForSell, setSelectedItemForSell] = useState<AccessoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<AccessoryItem | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<AccessorySale | null>(null);

  // Form states - Item
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Supplements');
  const [itemCostPrice, setItemCostPrice] = useState<number | ''>('');
  const [itemSellingPrice, setItemSellingPrice] = useState<number | ''>('');
  const [itemStock, setItemStock] = useState<number | ''>('');
  const [itemDescription, setItemDescription] = useState('');

  // Form states - Sell
  const [sellQuantity, setSellQuantity] = useState<number>(1);
  const [sellBuyerName, setSellBuyerName] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [sellPaymentMethod, setSellPaymentMethod] = useState<Payment['method']>('Cash');
  const [sellDate, setSellDate] = useState(getLocalDateString());

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(['Supplements', 'Gear', 'Bottles', 'Apparel', 'Other']);
    accessories.forEach(a => set.add(a.category));
    return Array.from(set);
  }, [accessories]);

  // Total Summary Stats
  const totalStockCount = useMemo(() => accessories.reduce((sum, a) => sum + a.stock, 0), [accessories]);
  const lowStockItems = useMemo(() => accessories.filter(a => a.stock <= 3), [accessories]);
  const totalRevenue = useMemo(() => accessorySales.reduce((sum, s) => sum + s.totalAmount, 0), [accessorySales]);
  const totalProfit = useMemo(() => accessorySales.reduce((sum, s) => sum + s.totalProfit, 0), [accessorySales]);

  // Payment method breakdown for accessory sales
  const salesByMethod = useMemo(() => {
    let cash = 0;
    let easyPaisa = 0;
    let jazzCash = 0;
    let bankTransfer = 0;

    accessorySales.forEach(s => {
      const methodLower = (s.paymentMethod || '').toLowerCase().replace(/\s+/g, '');
      if (methodLower === 'cash') cash += s.totalAmount;
      else if (methodLower === 'easypaisa') easyPaisa += s.totalAmount;
      else if (methodLower === 'jazzcash') jazzCash += s.totalAmount;
      else if (methodLower === 'banktransfer') bankTransfer += s.totalAmount;
      else cash += s.totalAmount;
    });

    return { cash, easyPaisa, jazzCash, bankTransfer };
  }, [accessorySales]);

  // Filtered inventory
  const filteredInventory = useMemo(() => {
    return accessories.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [accessories, searchQuery, categoryFilter]);

  // Filtered sales history
  const filteredSales = useMemo(() => {
    return accessorySales.filter(sale => {
      return sale.accessoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
             sale.buyerName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [accessorySales, searchQuery]);

  // Handlers
  const handleOpenAddItemModal = (item?: AccessoryItem) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.name);
      setItemCategory(item.category);
      setItemCostPrice(item.costPrice);
      setItemSellingPrice(item.sellingPrice);
      setItemStock(item.stock);
      setItemDescription(item.description || '');
    } else {
      setEditingItem(null);
      setItemName('');
      setItemCategory('Supplements');
      setItemCostPrice('');
      setItemSellingPrice('');
      setItemStock('');
      setItemDescription('');
    }
    setIsAddItemModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      onNotify('Please enter item name', 'error');
      return;
    }
    if (itemCostPrice === '' || Number(itemCostPrice) < 0) {
      onNotify('Please enter a valid purchase cost price', 'error');
      return;
    }
    if (itemSellingPrice === '' || Number(itemSellingPrice) < 0) {
      onNotify('Please enter a valid selling price', 'error');
      return;
    }
    if (itemStock === '' || Number(itemStock) < 0) {
      onNotify('Please enter stock quantity', 'error');
      return;
    }

    if (editingItem) {
      onUpdateAccessoryItem({
        ...editingItem,
        name: itemName.trim(),
        category: itemCategory,
        costPrice: Number(itemCostPrice),
        sellingPrice: Number(itemSellingPrice),
        stock: Number(itemStock),
        description: itemDescription.trim(),
      });
      onNotify(`Updated ${itemName} successfully!`, 'success');
    } else {
      onAddAccessoryItem({
        name: itemName.trim(),
        category: itemCategory,
        costPrice: Number(itemCostPrice),
        sellingPrice: Number(itemSellingPrice),
        stock: Number(itemStock),
        description: itemDescription.trim(),
      });
      onNotify(`Added ${itemName} to inventory!`, 'success');
    }

    setIsAddItemModalOpen(false);
  };

  const handleOpenSellModal = (item?: AccessoryItem) => {
    const target = item || accessories[0];
    if (!target) {
      onNotify('Please add items to inventory first', 'error');
      return;
    }
    setSelectedItemForSell(target);
    setSellQuantity(1);
    setSellBuyerName('');
    setSelectedMemberId('');
    setSellPaymentMethod('Cash');
    setSellDate(getLocalDateString());
    setIsSellModalOpen(true);
  };

  const handleExecuteSell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForSell) return;

    let finalBuyer = sellBuyerName.trim();
    if (selectedMemberId) {
      const m = members.find(mem => mem.id === selectedMemberId);
      if (m) finalBuyer = `${m.name} (#${m.registrationNo})`;
    }
    if (!finalBuyer) finalBuyer = 'Walk-in Customer';

    const result = onSellAccessoryItem(
      selectedItemForSell.id,
      Number(sellQuantity),
      finalBuyer,
      sellPaymentMethod,
      sellDate,
      selectedMemberId || undefined
    );

    if (result.success) {
      onNotify(result.message, 'success');
      setIsSellModalOpen(false);
    } else {
      onNotify(result.message, 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full">
      {/* Title Bar & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400">
              <AccessoriesIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-text-primary tracking-tight">Accessories & Inventory</h1>
              <p className="text-xs text-text-secondary">Manage gym shop products, sell items, and track profit & ledger</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleOpenSellModal()}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Sell Accessory</span>
          </button>

          <button
            onClick={() => handleOpenAddItemModal()}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-secondary hover:bg-gray-700 text-text-primary border border-gray-700 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Inventory Item</span>
          </button>
        </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-xl shadow-lg border border-gray-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Total Inventory Stock</p>
            <p className="text-2xl font-black text-text-primary">{totalStockCount} <span className="text-xs text-text-secondary font-normal">units</span></p>
            <p className="text-[11px] text-text-secondary mt-1">{accessories.length} product types listed</p>
          </div>
          <div className="p-3 bg-indigo-500/15 border border-indigo-500/30 rounded-full text-indigo-400">
            <AccessoriesIcon className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-surface p-5 rounded-xl shadow-lg border border-gray-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Total Sales Revenue</p>
            <div className="text-2xl font-black text-emerald-400">
              <MaskedAmount amount={totalRevenue} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
            </div>
            <p className="text-[11px] text-text-secondary mt-1">{accessorySales.length} total transaction(s)</p>
          </div>
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-emerald-400">
            <CashIcon className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-surface p-5 rounded-xl shadow-lg border border-gray-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Total Profit Earned</p>
            <div className="text-2xl font-black text-teal-400">
              <MaskedAmount amount={totalProfit} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
            </div>
            <p className="text-[11px] text-teal-400 font-semibold mt-1">Margin: {totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0}% net profit</p>
          </div>
          <div className="p-3 bg-teal-500/15 border border-teal-500/30 rounded-full text-teal-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-xl shadow-lg border border-gray-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Low Stock Alerts</p>
            <p className={`text-2xl font-black ${lowStockItems.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {lowStockItems.length} <span className="text-xs font-normal text-text-secondary">items low</span>
            </p>
            <p className="text-[11px] text-text-secondary mt-1">
              {lowStockItems.length > 0 ? 'Reorder needed soon' : 'All items well stocked'}
            </p>
          </div>
          <div className={`p-3 rounded-full border ${lowStockItems.length > 0 ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown Box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/10 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1">Cash Sales</p>
            <div className="text-xl font-bold text-emerald-400">
              <MaskedAmount amount={salesByMethod.cash} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
            </div>
          </div>
          <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-400">
            <CashIcon className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/10 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-1">Easy Paisa Sales</p>
            <div className="text-xl font-bold text-cyan-400">
              <MaskedAmount amount={salesByMethod.easyPaisa} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
            </div>
          </div>
          <div className="p-2.5 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-cyan-400">
            <PhonePayIcon className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-orange-500/30 bg-orange-950/10 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-orange-300 uppercase tracking-wider mb-1">Jazz Cash Sales</p>
            <div className="text-xl font-bold text-orange-400">
              <MaskedAmount amount={salesByMethod.jazzCash} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
            </div>
          </div>
          <div className="p-2.5 bg-orange-500/20 border border-orange-500/40 rounded-full text-orange-400">
            <PhonePayIcon className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-purple-500/30 bg-purple-950/10 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1">Bank Transfer Sales</p>
            <div className="text-xl font-bold text-purple-400">
              <MaskedAmount amount={salesByMethod.bankTransfer} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
            </div>
          </div>
          <div className="p-2.5 bg-purple-500/20 border border-purple-500/40 rounded-full text-purple-400">
            <BankIcon className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Controls */}
      <div className="bg-surface p-4 rounded-xl shadow-lg border border-gray-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div className="flex items-center space-x-2 bg-secondary p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex-1 sm:flex-none px-5 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Inventory Items ({accessories.length})
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`flex-1 sm:flex-none px-5 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                activeTab === 'sales'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Sales History ({accessorySales.length})
            </button>
          </div>

          {/* Search & Category filter */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder={activeTab === 'inventory' ? "Search item name or category..." : "Search buyer or product..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-secondary py-2 px-3 rounded-lg text-xs font-semibold text-text-primary border border-gray-700 focus:outline-none focus:border-emerald-500"
            />
            {activeTab === 'inventory' && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-secondary py-2 px-3 rounded-lg text-xs font-semibold text-text-primary border border-gray-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="All">All Categories</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* TAB 1: INVENTORY ITEMS */}
        {activeTab === 'inventory' && (
          <div>
            {filteredInventory.length === 0 ? (
              <div className="text-center py-12 text-text-secondary">
                <AccessoriesIcon className="h-12 w-12 mx-auto mb-3 opacity-30 text-emerald-500" />
                <p className="text-base font-bold">No inventory items found</p>
                <p className="text-xs mt-1">Try adjusting your search query or click "Add Inventory Item" above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredInventory.map(item => {
                  const profitMargin = item.sellingPrice > item.costPrice ? item.sellingPrice - item.costPrice : 0;
                  const isLow = item.stock <= 3;
                  const isOut = item.stock === 0;

                  return (
                    <div
                      key={item.id}
                      className="bg-secondary/60 hover:bg-secondary/90 transition-all rounded-xl p-4 border border-gray-800 flex flex-col justify-between space-y-4 shadow-sm group hover:border-gray-700"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1.5">
                              {item.category}
                            </span>
                            <h3 className="text-base font-bold text-text-primary group-hover:text-emerald-400 transition-colors">
                              {item.name}
                            </h3>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                              isOut
                                ? 'bg-red-500/15 border-red-500/30 text-red-400 animate-pulse'
                                : isLow
                                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            }`}
                          >
                            {isOut ? 'Out of Stock' : `${item.stock} in stock`}
                          </span>
                        </div>

                        {item.description && (
                          <p className="text-xs text-text-secondary mt-2 line-clamp-2">{item.description}</p>
                        )}

                        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-800/80 text-center">
                          <div className="bg-background/50 p-2 rounded-lg border border-gray-800">
                            <p className="text-[10px] font-bold text-text-secondary uppercase">Cost Price</p>
                            <p className="text-xs font-black text-text-primary mt-0.5">Rs {item.costPrice.toLocaleString()}</p>
                          </div>
                          <div className="bg-background/50 p-2 rounded-lg border border-gray-800">
                            <p className="text-[10px] font-bold text-text-secondary uppercase">Sell Price</p>
                            <p className="text-xs font-black text-emerald-400 mt-0.5">Rs {item.sellingPrice.toLocaleString()}</p>
                          </div>
                          <div className="bg-background/50 p-2 rounded-lg border border-gray-800">
                            <p className="text-[10px] font-bold text-text-secondary uppercase">Profit/Unit</p>
                            <p className="text-xs font-black text-teal-400 mt-0.5">+Rs {profitMargin.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => handleOpenSellModal(item)}
                          disabled={isOut}
                          className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isOut
                              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md'
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                          </svg>
                          <span>{isOut ? 'Unavailable' : 'Sell Now'}</span>
                        </button>

                        <button
                          onClick={() => handleOpenAddItemModal(item)}
                          className="p-2 bg-gray-800 hover:bg-gray-700 text-text-secondary hover:text-text-primary rounded-lg border border-gray-700 transition-colors cursor-pointer"
                          title="Edit Item"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        <button
                          onClick={() => setItemToDelete(item)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors cursor-pointer"
                          title="Delete Item"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SALES HISTORY & LEDGER */}
        {activeTab === 'sales' && (
          <div className="overflow-x-auto">
            {filteredSales.length === 0 ? (
              <div className="text-center py-12 text-text-secondary">
                <CashIcon className="h-12 w-12 mx-auto mb-3 opacity-30 text-emerald-500" />
                <p className="text-base font-bold">No sales records found</p>
                <p className="text-xs mt-1">When you sell accessories, sales transactions will automatically appear here and in Daily Ledger & Fees!</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-[11px] font-extrabold text-text-secondary uppercase tracking-wider bg-secondary/40">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Accessory Item</th>
                    <th className="py-3 px-4">Buyer</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Profit</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-xs">
                  {filteredSales.map(sale => {
                    const methodLower = (sale.paymentMethod || '').toLowerCase().replace(/\s+/g, '');
                    let badgeClass = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
                    if (methodLower === 'easypaisa') badgeClass = 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400';
                    else if (methodLower === 'jazzcash') badgeClass = 'bg-orange-500/15 border-orange-500/30 text-orange-400';
                    else if (methodLower === 'banktransfer') badgeClass = 'bg-purple-500/15 border-purple-500/30 text-purple-400';

                    return (
                      <tr key={sale.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-text-secondary whitespace-nowrap">{sale.date}</td>
                        <td className="py-3 px-4 font-bold text-text-primary whitespace-nowrap">{sale.accessoryName}</td>
                        <td className="py-3 px-4 text-text-secondary whitespace-nowrap">{sale.buyerName}</td>
                        <td className="py-3 px-4 text-center font-extrabold text-text-primary whitespace-nowrap">{sale.quantity}</td>
                        <td className="py-3 px-4 font-extrabold text-emerald-400 whitespace-nowrap">
                          <MaskedAmount amount={sale.totalAmount} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
                        </td>
                        <td className="py-3 px-4 font-bold text-teal-400 whitespace-nowrap">
                          +<MaskedAmount amount={sale.totalProfit} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${badgeClass}`}>
                            {sale.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSaleToDelete(sale)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                            title="Refund & Remove Sale"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: ADD / EDIT INVENTORY ITEM */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-surface border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsAddItemModalOpen(false)}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-secondary cursor-pointer"
            >
              <CloseIcon className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-black text-text-primary mb-1">
              {editingItem ? 'Edit Accessory Item' : 'Add New Inventory Item'}
            </h2>
            <p className="text-xs text-text-secondary mb-5">Enter product details for gym inventory stock</p>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-text-secondary uppercase mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Whey Protein Isolate 1kg"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-secondary py-2 px-3 rounded-lg text-sm font-semibold text-text-primary border border-gray-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-text-secondary uppercase mb-1">Category</label>
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  className="w-full bg-secondary py-2 px-3 rounded-lg text-sm font-semibold text-text-primary border border-gray-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Supplements">Supplements</option>
                  <option value="Gear">Gear & Accessories</option>
                  <option value="Bottles">Bottles & Shakers</option>
                  <option value="Apparel">Apparel & Gymwear</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-text-secondary uppercase mb-1">Cost Price (Rs) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 5000"
                    value={itemCostPrice}
                    onChange={(e) => setItemCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-secondary py-2 px-3 rounded-lg text-sm font-semibold text-text-primary border border-gray-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-text-secondary uppercase mb-1">Selling Price (Rs) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 6500"
                    value={itemSellingPrice}
                    onChange={(e) => setItemSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-secondary py-2 px-3 rounded-lg text-sm font-semibold text-text-primary border border-gray-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-text-secondary uppercase mb-1">Initial Stock Quantity *</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 10"
                  value={itemStock}
                  onChange={(e) => setItemStock(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-secondary py-2 px-3 rounded-lg text-sm font-semibold text-text-primary border border-gray-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-text-secondary uppercase mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Product specs, flavor, size or details..."
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full bg-secondary py-2 px-3 rounded-lg text-xs font-semibold text-text-primary border border-gray-700 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="flex-1 py-2.5 bg-secondary hover:bg-gray-700 text-text-secondary font-bold text-xs rounded-xl border border-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
                >
                  {editingItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SELL ACCESSORY ITEM */}
      {isSellModalOpen && selectedItemForSell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-surface border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsSellModalOpen(false)}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-secondary cursor-pointer"
            >
              <CloseIcon className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-black text-text-primary mb-1">Sell Accessory</h2>
            <p className="text-xs text-text-secondary mb-4">Record sale transaction into daily ledger & inventory</p>

            <form onSubmit={handleExecuteSell} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-text-secondary uppercase mb-1">Select Item *</label>
                <select
                  value={selectedItemForSell.id}
                  onChange={(e) => {
                    const found = accessories.find(a => a.id === e.target.value);
                    if (found) setSelectedItemForSell(found);
                  }}
                  className="w-full bg-secondary py-2.5 px-3 rounded-lg text-sm font-bold text-text-primary border border-gray-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {accessories.map(item => (
                    <option key={item.id} value={item.id} disabled={item.stock === 0}>
                      {item.name} — Rs {item.sellingPrice.toLocaleString()} ({item.stock} in stock)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-text-secondary uppercase mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={selectedItemForSell.stock}
                    value={sellQuantity}
                    onChange={(e) => setSellQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-secondary py-2 px-3 rounded-lg text-sm font-semibold text-text-primary border border-gray-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-text-secondary uppercase mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={sellDate}
                    onChange={(e) => setSellDate(e.target.value)}
                    className="w-full bg-secondary py-2 px-3 rounded-lg text-sm font-semibold text-text-primary border border-gray-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-text-secondary uppercase mb-1">Buyer (Member or Custom Name)</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => {
                    setSelectedMemberId(e.target.value);
                    if (e.target.value) {
                      const m = members.find(mem => mem.id === e.target.value);
                      if (m) setSellBuyerName(m.name);
                    }
                  }}
                  className="w-full bg-secondary py-2 px-3 rounded-lg text-xs font-semibold text-text-primary border border-gray-700 focus:outline-none focus:border-emerald-500 cursor-pointer mb-2"
                >
                  <option value="">-- Select Registered Member (Optional) --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} (#{m.registrationNo})</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Or enter buyer name (e.g. Walk-in / John Doe)"
                  value={sellBuyerName}
                  onChange={(e) => setSellBuyerName(e.target.value)}
                  className="w-full bg-secondary py-2 px-3 rounded-lg text-xs font-semibold text-text-primary border border-gray-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-text-secondary uppercase mb-1">Payment Method *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Cash', 'Easypaisa', 'Jazz Cash', 'Bank Transfer'] as Payment['method'][]).map(method => (
                    <button
                      type="button"
                      key={method}
                      onClick={() => setSellPaymentMethod(method)}
                      className={`py-2 px-3 rounded-lg font-bold text-xs border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        sellPaymentMethod === method
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-md'
                          : 'bg-secondary text-text-secondary border-gray-700 hover:bg-gray-700'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Calculation Summary Box */}
              <div className="bg-secondary/80 p-3.5 rounded-xl border border-gray-700 space-y-1 text-xs">
                <div className="flex justify-between font-semibold text-text-secondary">
                  <span>Unit Price:</span>
                  <span>Rs {selectedItemForSell.sellingPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-extrabold text-emerald-400 text-sm pt-1 border-t border-gray-700">
                  <span>Total Sale Amount:</span>
                  <span>Rs {(selectedItemForSell.sellingPrice * sellQuantity).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-teal-400 text-[11px]">
                  <span>Estimated Profit:</span>
                  <span>+Rs {((selectedItemForSell.sellingPrice - selectedItemForSell.costPrice) * sellQuantity).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSellModalOpen(false)}
                  className="flex-1 py-2.5 bg-secondary hover:bg-gray-700 text-text-secondary font-bold text-xs rounded-xl border border-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
                >
                  Complete Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRM DELETE INVENTORY ITEM */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface border border-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-full">
                <TrashIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">Delete Inventory Item?</h3>
                <p className="text-xs text-text-secondary">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-text-secondary bg-secondary/50 p-3 rounded-xl border border-gray-800">
              Are you sure you want to permanently delete <strong className="text-text-primary">{itemToDelete.name}</strong> from gym inventory?
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 bg-secondary hover:bg-gray-700 text-text-secondary font-bold text-xs rounded-xl border border-gray-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteAccessoryItem(itemToDelete.id);
                  onNotify(`Deleted ${itemToDelete.name}`, 'info');
                  setItemToDelete(null);
                }}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
              >
                Delete Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CONFIRM REFUND / DELETE SALE */}
      {saleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface border border-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-full">
                <TrashIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">Refund & Remove Sale?</h3>
                <p className="text-xs text-text-secondary">Stock will be restored automatically.</p>
              </div>
            </div>

            <p className="text-sm text-text-secondary bg-secondary/50 p-3 rounded-xl border border-gray-800">
              Delete sale record of <strong className="text-text-primary">{saleToDelete.quantity}x {saleToDelete.accessoryName}</strong> ({saleToDelete.buyerName})?
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSaleToDelete(null)}
                className="flex-1 py-2.5 bg-secondary hover:bg-gray-700 text-text-secondary font-bold text-xs rounded-xl border border-gray-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteAccessorySale(saleToDelete.id);
                  onNotify(`Sale record refunded & stock restored`, 'info');
                  setSaleToDelete(null);
                }}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
              >
                Refund & Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
