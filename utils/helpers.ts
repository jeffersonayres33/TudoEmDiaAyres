
import { MaintenanceRecord, CategoryDefinition } from '../types';

export const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return '---';
  return new Date(dateStr).toLocaleDateString('pt-BR');
};

export const formatDateTime = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const calculateStatus = (nextDateStr?: string): 'pending' | 'overdue' | 'completed' => {
  if (!nextDateStr) return 'pending';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextDate = new Date(nextDateStr);
  nextDate.setHours(0, 0, 0, 0);

  if (nextDate < today) return 'overdue';
  return 'pending';
};

export const getDaysRemaining = (dateStr?: string) => {
  if (!dateStr) return 999; // Sem data, não expira
  const today = new Date();
  const target = new Date(dateStr);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Persistence
export const saveRecords = (records: MaintenanceRecord[]) => {
  localStorage.setItem('mainttrack_records', JSON.stringify(records));
};

export const loadRecords = (): MaintenanceRecord[] => {
  const data = localStorage.getItem('mainttrack_records');
  return data ? JSON.parse(data) : [];
};

export const saveCategories = (categories: CategoryDefinition[]) => {
  localStorage.setItem('mainttrack_categories', JSON.stringify(categories));
};

export const loadCategories = (): CategoryDefinition[] => {
  const data = localStorage.getItem('mainttrack_categories');
  const defaultCategories: CategoryDefinition[] = [
    { id: '1', name: 'Veículo', icon: 'Car', color: 'bg-blue-100 text-blue-700' },
    { id: '2', name: 'Gerador', icon: 'Zap', color: 'bg-amber-100 text-amber-700' },
    { id: '3', name: 'Casa', icon: 'Home', color: 'bg-emerald-100 text-emerald-700' },
    { id: '4', name: 'Quadro Elétrico', icon: 'Layout', color: 'bg-purple-100 text-purple-700' },
    { id: '5', name: 'Outro', icon: 'Settings', color: 'bg-slate-100 text-slate-700' },
  ];
  return data ? JSON.parse(data) : defaultCategories;
};

export const getStatusColor = (status: string, daysRemaining: number) => {
  if (status === 'completed') return 'text-emerald-600 bg-emerald-50 border-emerald-100';
  if (status === 'overdue' || daysRemaining < 0) return 'text-red-600 bg-red-50 border-red-100';
  if (daysRemaining <= 7) return 'text-amber-600 bg-amber-50 border-amber-100';
  return 'text-slate-600 bg-slate-50 border-slate-100';
};

// Backup System
export const exportData = () => {
  const data = {
    records: loadRecords(),
    categories: loadCategories(),
    exportDate: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_manutencao_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
