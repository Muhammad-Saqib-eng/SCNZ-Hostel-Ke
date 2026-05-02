import React from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  ArrowRightLeft, 
  Settings, 
  LogOut,
  ChevronRight,
  User as UserIcon,
  Wallet
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: any) => void;
  user: any;
}

export function Sidebar({ activeView, onViewChange, user }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Vibe Analytics', icon: LayoutDashboard },
    { id: 'parser', label: 'AI Khata Parser', icon: Sparkles },
    { id: 'debts', label: 'Debt Settler', icon: ArrowRightLeft },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-72 bg-[#0A0C10] text-slate-400 h-screen fixed left-0 top-0 flex flex-col border-r border-white/5 z-50">
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 text-black">
          <Wallet className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-white font-black tracking-tighter leading-none text-sm uppercase">SCNZ Hostel Ke</h2>
          <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Expense Tracker</p>
        </div>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "w-full flex items-center justify-between p-4 rounded-2xl transition-all group",
              activeView === item.id 
                ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/10" 
                : "hover:bg-white/5 hover:text-white"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className={cn("w-5 h-5", activeView === item.id ? "text-black" : "text-slate-500 group-hover:text-emerald-500")} />
              <span className="text-sm font-bold tracking-tight">{item.label}</span>
            </div>
            {activeView === item.id && <ChevronRight className="w-4 h-4" />}
          </button>
        ))}
      </nav>

      <div className="p-6">
        <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20">
              <UserIcon className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold truncate leading-none mb-1">
                {user?.displayName || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Hostel Resident</p>
            </div>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-500 transition-all text-xs font-bold"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
