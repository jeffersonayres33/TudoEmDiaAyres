
import React, { useState } from 'react';
import { Icons } from '../constants';
import { MaintenanceNotification } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewMaintenance: () => void;
  notifications: MaintenanceNotification[];
  canInstall?: boolean;
  onInstall?: () => void;
  onBackup: () => void;
  onImport: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  onNewMaintenance, 
  notifications,
  canInstall,
  onInstall,
  onBackup,
  onImport
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Icons.TrendingUp className="w-5 h-5" /> },
    { id: 'list', label: 'Minhas Manutenções', icon: <Icons.FileText className="w-5 h-5" /> },
    { id: 'categories', label: 'Categorias', icon: <Icons.Tag className="w-5 h-5" /> },
    { id: 'history', label: 'Histórico', icon: <Icons.History className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen no-print">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <Icons.CheckCircle2 className="w-6 h-6" />
            TudoEmDia
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Menu Principal</p>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
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
              onClick={onBackup}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Icons.Save className="w-5 h-5 text-emerald-500" />
              Backup de Dados
            </button>
            <button
              onClick={onImport}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Icons.Upload className="w-5 h-5 text-blue-500" />
              Restaurar Backup
            </button>
          </div>
        </nav>

        <div className="p-4 space-y-3">
          {canInstall && (
            <button 
              onClick={onInstall}
              className="install-button w-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-emerald-100 active:scale-95 text-xs"
            >
              <Icons.Download className="w-4 h-4" />
              Instalar Aplicativo
            </button>
          )}
          <button 
            onClick={onNewMaintenance}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Icons.Plus className="w-5 h-5" />
            Nova Manutenção
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-30 flex items-center justify-between no-print">
          <div className="md:hidden">
            <h1 className="text-lg font-bold text-blue-600 flex items-center gap-2">
              <Icons.CheckCircle2 className="w-6 h-6" />
              TudoEmDia
            </h1>
          </div>
          <div className="hidden md:block"></div>

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

            <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <Icons.X /> : <Icons.Menu />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-2 animate-in slide-in-from-top duration-300 no-print">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                  activeTab === item.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            <div className="pt-4 border-t border-slate-100">
               <button onClick={onBackup} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600">
                 <Icons.Save className="w-5 h-5 text-emerald-500" /> Backup
               </button>
               <button onClick={onImport} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600">
                 <Icons.Upload className="w-5 h-5 text-blue-500" /> Restaurar
               </button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>

      <button 
        onClick={onNewMaintenance}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform no-print"
      >
        <Icons.Plus className="w-8 h-8" />
      </button>
    </div>
  );
};

export default Layout;