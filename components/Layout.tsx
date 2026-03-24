
import React, { useState } from 'react';
import { Icons } from '../constants';
import { MaintenanceNotification } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notifications: MaintenanceNotification[];
  canInstall?: boolean;
  onInstall?: () => void;
  onBackup: () => void;
  onImport: () => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  notifications,
  canInstall,
  onInstall,
  onBackup,
  onImport,
  onLogout
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Icons.TrendingUp className="w-5 h-5" /> },
    { id: 'list', label: 'Minhas Manutenções', icon: <Icons.FileText className="w-5 h-5" /> },
    { id: 'categories', label: 'Categorias', icon: <Icons.Tag className="w-5 h-5" /> },
    { id: 'history', label: 'Histórico', icon: <Icons.History className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm transition-opacity no-print"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={`fixed top-0 left-0 h-screen w-72 bg-white border-r border-slate-200 flex flex-col z-50 transition-transform duration-300 ease-in-out no-print ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <Icons.CheckCircle2 className="w-6 h-6" />
            TudoEmDia
          </h1>
          <button onClick={() => setIsMenuOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
            <Icons.X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Menu Principal</p>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dados</p>
            <button
              onClick={() => { onBackup(); setIsMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Icons.Save className="w-5 h-5 text-emerald-500" />
              Backup de Dados
            </button>
            <button
              onClick={() => { onImport(); setIsMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Icons.Upload className="w-5 h-5 text-blue-500" />
              Restaurar Backup
            </button>
            <button
              onClick={() => { onLogout(); setIsMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-2"
            >
              <Icons.LogOut className="w-5 h-5" />
              Sair da Conta
            </button>
          </div>
        </nav>

        <div className="p-4 space-y-3 border-t border-slate-100">
          {canInstall && (
            <button 
              onClick={() => { onInstall?.(); setIsMenuOpen(false); }}
              className="install-button w-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-emerald-100 active:scale-95 text-xs"
            >
              <Icons.Download className="w-4 h-4" />
              Instalar Aplicativo
            </button>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-30 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Icons.Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-blue-600 flex items-center gap-2">
              <Icons.CheckCircle2 className="w-6 h-6" />
              TudoEmDia
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative"
              >
                <Icons.Bell className="w-6 h-6" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Notificações</span>
                    <button onClick={() => setIsNotifOpen(false)} className="text-slate-400 hover:text-slate-600"><Icons.X className="w-4 h-4" /></button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <div className="flex gap-3">
                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.type === 'danger' ? 'bg-red-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                            <div>
                              <p className="text-sm font-bold text-slate-800">{n.title}</p>
                              <p className="text-xs text-slate-500">{n.message}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-400">
                        <Icons.BellOff className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-xs font-medium">Nenhuma notificação nova.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;