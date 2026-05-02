import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, AlertCircle, Info, AlertTriangle, 
  Receipt, Wallet, Trash2, Utensils, Bus, Users, Zap, GraduationCap, Box, RotateCcw,
  Search, Download, X, Edit2, Filter, Target
} from 'lucide-react';
import { AnalysisResult, Category, Expense } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { dbService } from '../services/dbService';
import { auth } from '../lib/firebase';

const CATEGORY_COLORS: Record<Category, string> = {
  Food: '#10B981',
  Transport: '#3B82F6',
  Social: '#F59E0B',
  Utilities: '#6366F1',
  Academic: '#EC4899',
  Misc: '#94A3B8'
};

const CATEGORY_ICONS_SMALL: Record<Category, React.ReactNode> = {
  Food: <Utensils size={12} />,
  Transport: <Bus size={12} />,
  Social: <Users size={12} />,
  Utilities: <Zap size={12} />,
  Academic: <GraduationCap size={12} />,
  Misc: <Box size={12} />
};

const CustomYAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const category = payload.value as Category;
  const color = CATEGORY_COLORS[category];

  return (
    <g transform={`translate(${x},${y})`}>
      <foreignObject x={-110} y={-12} width={100} height={24}>
        <div className="flex items-center justify-end gap-2 h-full">
          <span className="text-[9px] font-black uppercase tracking-widest text-[#94A3B8]">
            {category}
          </span>
          <div className="p-1 rounded-md" style={{ backgroundColor: color + '15', color }}>
            {CATEGORY_ICONS_SMALL[category]}
          </div>
        </div>
      </foreignObject>
    </g>
  );
};

interface DashboardProps {
  data: AnalysisResult;
}

export function Dashboard({ data }: DashboardProps) {
  const { summary, expenses, advice, debts = [] } = data;
  
  // Social Debt Calculation
  const totalReceivable = debts
    .filter(d => d.type === 'owes_me' && !d.settled)
    .reduce((acc, d) => acc + d.amount, 0);
    
  const totalPayable = debts
    .filter(d => d.type === 'i_owe' && !d.settled)
    .reduce((acc, d) => acc + d.amount, 0);

  // State for functionality
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Filtered Expenses Logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || e.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }).slice().reverse();
  }, [expenses, searchQuery, selectedCategory]);

  const handleDelete = async (id: string) => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please login again.");
      return;
    }
    
    setIsDeleting(id);
    setConfirmDeleteId(null);
    try {
      console.log(`[Khata] Attempting deletion of record: ${id} for user: ${user.uid}`);
      await dbService.deleteExpense(user.uid, id);
      console.log(`[Khata] Success deleting ${id}`);
    } catch (err) {
      console.error("[Khata] Deletion failed:", err);
      alert("Delete failed: Check your connection.");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleReset = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please login first.");
      return;
    }
    
    setShowResetConfirm(false);
    try {
      console.log(`[Khata] Initiating full reset for user: ${user.uid}`);
      await dbService.resetExpenses(user.uid);
      alert("Khata cleared successfully.");
    } catch (err) {
      console.error("[Khata] Reset failed:", err);
      alert("Reset failed: Technical issue.");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !auth.currentUser) return;

    setIsSaving(true);
    try {
      await dbService.updateExpense(auth.currentUser.uid, editingExpense.id, {
        name: editingExpense.name,
        amount: editingExpense.amount,
        category: editingExpense.category
      });
      setEditingExpense(null);
    } catch (error) {
      alert("Failed to update expense.");
    } finally {
      setIsSaving(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Name', 'Category', 'Amount'];
    const rows = expenses.map(e => [
      new Date(e.date).toLocaleDateString(),
      e.name,
      e.category,
      e.amount
    ]);

    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `khata_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const category = data.activePayload[0].payload.category as Category;
      setSelectedCategory(prev => prev === category ? null : category);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">Financial Pulse</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Real-time khata analytics</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 relative">
          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: '#F8FAFC' }}
            whileTap={{ scale: 0.98 }}
            onClick={exportToCSV}
            className="text-[10px] font-black text-gray-600 bg-white px-6 py-4 rounded-2xl flex items-center gap-2 uppercase tracking-[0.2em] shadow-sm border border-gray-100"
          >
            <Download className="w-4 h-4" /> Export CSV
          </motion.button>
          
          <div className="relative">
            {!showResetConfirm ? (
              <button 
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="text-[10px] font-black text-red-500 bg-white px-6 py-4 rounded-2xl flex items-center gap-2 uppercase tracking-[0.2em] shadow-sm active:shadow-none transition-all border border-red-100 hover:ring-2 hover:ring-red-100 hover:bg-red-50 cursor-pointer relative z-10"
              >
                <RotateCcw className="w-4 h-4" /> Reset Khata
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-red-500 p-1.5 rounded-2xl shadow-lg animate-in fade-in zoom-in-95 duration-200">
                <button 
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 bg-white text-red-600 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-red-50"
                >
                  Sure? Clear All
                </button>
                <button 
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="p-2 text-white hover:bg-white/10 rounded-xl"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
        {[
          { 
            label: 'Total Liquidity', 
            val: summary.totalBudget, 
            icon: <Wallet className="w-5 h-5" />, 
            color: 'text-blue-500', 
            bg: 'bg-blue-50',
            desc: 'Starting fuel for the month'
          },
          { 
            label: 'Total Outflow', 
            val: summary.totalSpent, 
            icon: <TrendingUp className="w-5 h-5" />, 
            color: 'text-rose-500', 
            bg: 'bg-rose-50',
            desc: 'Spent + Loaned'
          },
          { 
            label: 'Remaining Fuel', 
            val: summary.remaining, 
            icon: <Target className="w-5 h-5" />, 
            color: 'text-emerald-500', 
            bg: 'bg-emerald-50',
            desc: 'Buffer for the month'
          },
          { 
            label: 'Social Assets', 
            val: totalReceivable, 
            icon: <Users className="w-5 h-5" />, 
            color: 'text-indigo-500', 
            bg: 'bg-indigo-50',
            desc: 'Receivables from friends'
          },
          { 
            label: 'Liabilities', 
            val: totalPayable, 
            icon: <AlertTriangle className="w-5 h-5" />, 
            color: 'text-amber-500', 
            bg: 'bg-amber-50',
            desc: 'Payables to settle'
          },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-8">
              <div className={cn("p-3 rounded-2xl", stat.bg, stat.color)}>
                {stat.icon}
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-gray-200 group-hover:bg-emerald-500 transition-colors" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <h4 className={cn("text-3xl font-black tracking-tighter", stat.color)}>
                {formatCurrency(stat.val)}
              </h4>
              <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest mt-2">{stat.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column (Bar Chart) */}
        <div className="lg:col-span-7">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] h-full flex flex-col"
          >
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_10px_#10B981]" />
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">
                  Expense Distribution
                </h3>
              </div>
              {selectedCategory && (
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1 hover:underline"
                >
                  <Filter className="w-3 h-3" /> Clear Filter
                </button>
              )}
            </div>
            
            <div className="flex-1 min-h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={summary.categories} 
                  layout="vertical" 
                  margin={{ left: 30, right: 30 }}
                  onClick={handleBarClick}
                >
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="category" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false}
                    tick={<CustomYAxisTick />}
                    width={100}
                  />
                  <Tooltip 
                    cursor={{ fill: '#F8FAFC', radius: 20 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-black text-white px-5 py-3 rounded-2xl text-[11px] font-black tracking-widest shadow-2xl flex items-center gap-3">
                            <span className="text-emerald-400">{CATEGORY_ICONS_SMALL[data.category as Category]}</span>
                            {formatCurrency(Number(payload[0].value))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="amount" radius={[0, 20, 20, 0]} barSize={40} className="cursor-pointer">
                    {summary.categories.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CATEGORY_COLORS[entry.category as Category]} 
                        fillOpacity={selectedCategory && selectedCategory !== entry.category ? 0.3 : 1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-gray-300 font-bold text-center mt-4">Tip: Click a bar to filter transactions</p>
          </motion.div>
        </div>

        {/* Right Column (Vibe Advice) */}
        <div className="lg:col-span-5 flex flex-col gap-10">
          <div className="flex flex-col gap-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] px-4 text-gray-400">Vibe Check & AI Insight</h3>
            {advice.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className={cn(
                  "p-8 rounded-[40px] border transition-all relative overflow-hidden group",
                  item.severity === 'error' ? "bg-red-50/50 border-red-100" :
                  item.severity === 'warning' ? "bg-amber-50/50 border-amber-100" :
                  "bg-emerald-50/30 border-emerald-100"
                )}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={cn(
                    "p-3 rounded-2xl shadow-sm",
                    item.severity === 'error' ? "bg-red-500 text-white" :
                    item.severity === 'warning' ? "bg-amber-500 text-white" :
                    "bg-emerald-500 text-white"
                  )}>
                    {item.severity === 'error' ? <AlertCircle size={20} /> : item.severity === 'warning' ? <AlertTriangle size={20} /> : <Info size={20} />}
                  </div>
                  <h4 className="font-black text-sm uppercase tracking-tight text-gray-900">{item.title}</h4>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed font-serif italic pr-4">"{item.description}"</p>
              </motion.div>
            ))}
          </div>

          {/* Quick Metrics */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-gray-900 rounded-[56px] p-12 text-white shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] relative overflow-hidden group mt-auto"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 blur-[100px] rounded-full -mr-32 -mt-32 transition-all duration-1000" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-emerald-500 mb-12">Fuel Tank Depth</h3>
            <div className="space-y-10">
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                   <span>Remaining Depth</span>
                   <span className="text-white">{Math.max(0, Math.round((summary.remaining / summary.totalBudget) * 100))}%</span>
                 </div>
                 <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-1">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${Math.max(0, Math.round((summary.remaining / summary.totalBudget) * 100))}%` }}
                     className="h-full bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                   />
                 </div>
              </div>
              <div className="flex items-center gap-4 pt-4">
                <div className="flex-1">
                   <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Burn Efficiency</p>
                   <p className="text-xl font-black text-white">{expenses.length > 0 ? "Normal" : "Extreme"}</p>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Transaction Ledger */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-[56px] border border-gray-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)] overflow-hidden"
      >
        <div className="p-12 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50/30">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-gray-900 flex items-center gap-3">
              <Receipt className="w-6 h-6 text-emerald-500" />
              Transaction Ledger
            </h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
              Showing {filteredExpenses.length} of {expenses.length} Records
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text"
                placeholder="Search description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-gray-100 rounded-2xl pl-12 pr-6 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all w-64 shadow-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                  <X size={14} />
                </button>
              )}
            </div>
            
            {selectedCategory && (
              <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-right-4">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{selectedCategory}</span>
                <button onClick={() => setSelectedCategory(null)} className="text-emerald-400 hover:text-emerald-600">
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white">
                <th className="px-12 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-gray-300">Timestamp</th>
                <th className="px-12 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-gray-300">Description</th>
                <th className="px-12 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-gray-300">Class</th>
                <th className="px-12 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-gray-300 text-right">Value</th>
                <th className="px-12 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence mode="popLayout" initial={false}>
                {filteredExpenses.map((exp, idx) => (
                  <motion.tr 
                    key={exp.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: Math.min(idx * 0.04, 0.4) }}
                    onClick={() => setEditingExpense(exp)}
                    className="group hover:bg-gray-50/80 transition-all cursor-pointer relative"
                  >
                    <td className="px-12 py-8 text-[11px] font-black text-gray-400 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">{new Date(exp.date).toLocaleDateString()}</td>
                    <td className="px-12 py-8 font-black text-gray-800 text-sm tracking-tight group-hover:translate-x-1 transition-transform">{exp.name}</td>
                    <td className="px-12 py-8">
                       <motion.span 
                         whileHover={{ scale: 1.05 }}
                         className="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 w-fit border border-gray-100 bg-white shadow-sm transition-all group-hover:border-emerald-100" 
                         style={{ color: CATEGORY_COLORS[exp.category] }}
                       >
                         <span className="opacity-70">{CATEGORY_ICONS_SMALL[exp.category]}</span>
                         {exp.category}
                       </motion.span>
                    </td>
                    <td className="px-12 py-8 text-right font-black text-gray-900 text-2xl tracking-tighter group-hover:scale-105 transition-transform origin-right">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="px-12 py-8 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {confirmDeleteId === exp.id ? (
                          <div className="flex items-center gap-2 bg-red-500 p-1 rounded-xl animate-in slide-in-from-right-4">
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDelete(exp.id); }}
                              className="px-3 py-1.5 bg-white text-red-600 text-[8px] font-black uppercase tracking-widest rounded-lg"
                            >
                              Confirm
                            </button>
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                              className="p-1.5 text-white hover:bg-white/10 rounded-lg"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setEditingExpense(exp); }}
                              className="p-3 text-gray-400 hover:text-emerald-500 bg-white rounded-2xl transition-all shadow-sm border border-gray-100"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(exp.id); }}
                              disabled={isDeleting === exp.id}
                              className="p-3 text-gray-400 hover:text-red-500 bg-white rounded-2xl transition-all shadow-sm border border-gray-100"
                            >
                              {isDeleting === exp.id ? (
                                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {filteredExpenses.length === 0 && (
            <div className="p-20 text-center">
               <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                 <Search size={40} />
               </div>
               <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest">No matching records found</h4>
            </div>
          )}
        </div>
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[48px] w-full max-w-xl shadow-2xl overflow-hidden"
            >
              <div className="p-10 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">Modify Record</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Audit trailing system active</p>
                </div>
                <button onClick={() => setEditingExpense(null)} className="p-4 hover:bg-gray-100 rounded-2xl transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="p-10 space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 px-2">Description</label>
                  <input 
                    type="text"
                    required
                    value={editingExpense.name}
                    onChange={e => setEditingExpense({...editingExpense, name: e.target.value})}
                    className="w-full bg-gray-50 p-6 rounded-3xl text-sm font-black outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 px-2">Amount</label>
                    <input 
                      type="number"
                      required
                      value={editingExpense.amount}
                      onChange={e => setEditingExpense({...editingExpense, amount: Number(e.target.value)})}
                      className="w-full bg-gray-50 p-6 rounded-3xl text-sm font-black outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 px-2">Category</label>
                    <select 
                      value={editingExpense.category}
                      onChange={e => setEditingExpense({...editingExpense, category: e.target.value as Category})}
                      className="w-full bg-gray-50 p-6 rounded-3xl text-sm font-black outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none"
                    >
                      {Object.keys(CATEGORY_COLORS).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSaving}
                    className="flex-1 bg-emerald-500 text-white p-6 rounded-3xl font-black uppercase tracking-[0.3em] shadow-lg shadow-emerald-500/30 disabled:opacity-50"
                    type="submit"
                  >
                    {isSaving ? "Updating..." : "Update Record"}
                  </motion.button>
                  <button 
                    type="button"
                    onClick={() => setEditingExpense(null)}
                    className="px-8 py-6 bg-gray-100 text-gray-500 rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
