
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import MaintenanceList from './components/MaintenanceList';
import MaintenanceForm from './components/MaintenanceForm';
import CategoryManager from './components/CategoryManager';
import History from './components/History';
import { MaintenanceRecord, Periodicity, CategoryDefinition, MaintenanceNotification } from './types';
import { loadRecords, saveRecords, loadCategories, saveCategories, exportData, getDaysRemaining } from './utils/helpers';
import { Icons } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [categories, setCategories] = useState<CategoryDefinition[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);

  useEffect(() => {
    setRecords(loadRecords());
    setCategories(loadCategories());
  }, []);

  useEffect(() => { saveRecords(records); }, [records]);
  useEffect(() => { saveCategories(categories); }, [categories]);

  // Motor de Notificações Inteligentes
  const notifications = useMemo(() => {
    const alerts: MaintenanceNotification[] = [];
    records.filter(r => r.status === 'pending' && r.notificationsEnabled && r.nextDate).forEach(r => {
      const days = getDaysRemaining(r.nextDate);
      if (days === 0) {
        alerts.push({ id: `0-${r.id}`, maintenanceId: r.id, title: 'Vence Hoje', message: `A manutenção "${r.name}" vence hoje!`, type: 'danger', date: r.nextDate! });
      } else if (days === 1) {
        alerts.push({ id: `1-${r.id}`, maintenanceId: r.id, title: 'Vence Amanhã', message: `A manutenção "${r.name}" vence em 1 dia.`, type: 'warning', date: r.nextDate! });
      } else if (days === 3) {
        alerts.push({ id: `3-${r.id}`, maintenanceId: r.id, title: 'Vence em 3 dias', message: `Lembrete: "${r.name}" vence em 3 dias.`, type: 'info', date: r.nextDate! });
      } else if (days === 7) {
        alerts.push({ id: `7-${r.id}`, maintenanceId: r.id, title: 'Vence em 7 dias', message: `Faltam 7 dias para a manutenção "${r.name}".`, type: 'info', date: r.nextDate! });
      } else if (days < 0) {
        alerts.push({ id: `v-${r.id}`, maintenanceId: r.id, title: 'Vencida', message: `A manutenção "${r.name}" está atrasada há ${Math.abs(days)} dias!`, type: 'danger', date: r.nextDate! });
      }
    });
    return alerts;
  }, [records]);

  const handleSaveCategory = useCallback((category: CategoryDefinition) => {
    setCategories(prev => {
      const exists = prev.some(c => c.id === category.id);
      return exists ? prev.map(c => c.id === category.id ? category : c) : [...prev, category];
    });
  }, []);

  const handleDeleteCategory = useCallback((id: string) => {
    if (window.confirm('Excluir esta categoria?')) {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  }, []);

  const executeCompletion = useCallback((id: string, allRecords: MaintenanceRecord[]): MaintenanceRecord[] => {
    const now = new Date().toISOString();
    const recordIndex = allRecords.findIndex(r => r.id === id);
    if (recordIndex === -1) return allRecords;

    const targetRecord = allRecords[recordIndex];
    const completedRecord: MaintenanceRecord = { ...targetRecord, status: 'completed', completedAt: now };

    let newRecords = [...allRecords];
    newRecords[recordIndex] = completedRecord;

    if (targetRecord.periodicity !== Periodicity.NONE) {
      const nextDate = new Date(targetRecord.nextDate || targetRecord.lastDate);
      switch (targetRecord.periodicity) {
        case Periodicity.DAYS_30: nextDate.setDate(nextDate.getDate() + 30); break;
        case Periodicity.MONTHS_3: nextDate.setMonth(nextDate.getMonth() + 3); break;
        case Periodicity.MONTHS_6: nextDate.setMonth(nextDate.getMonth() + 6); break;
        case Periodicity.YEAR_1: nextDate.setFullYear(nextDate.getFullYear() + 1); break;
        default: break; 
      }
      
      if (targetRecord.periodicity !== Periodicity.CUSTOM) {
        newRecords.push({
          ...targetRecord,
          id: Math.random().toString(36).substring(2, 15),
          createdAt: now,
          lastDate: targetRecord.nextDate || targetRecord.lastDate,
          nextDate: nextDate.toISOString().split('T')[0],
          status: 'pending',
          completedAt: undefined
        });
      }
    }
    return newRecords;
  }, []);

  const handleCompleteMaintenance = useCallback((id: string) => {
    setRecords(prev => executeCompletion(id, prev));
  }, [executeCompletion]);

  const handleDeleteMaintenance = useCallback((id: string) => {
    if (window.confirm('Deseja excluir este registro permanentemente?')) {
      setRecords(prev => prev.filter(r => r.id !== id));
    }
  }, []);

  const handleSaveMaintenance = useCallback((formData: Partial<MaintenanceRecord>) => {
    setRecords(prev => {
      const now = new Date().toISOString();
      if (editingRecord) {
        if (formData.status === 'completed' && editingRecord.status !== 'completed') {
          const withData = prev.map(r => r.id === editingRecord.id ? { ...r, ...formData } as MaintenanceRecord : r);
          return executeCompletion(editingRecord.id, withData);
        }
        return prev.map(r => r.id === editingRecord.id ? { ...r, ...formData } as MaintenanceRecord : r);
      } else {
        const newId = Math.random().toString(36).substring(2, 15);
        const newRecord: MaintenanceRecord = {
          id: newId,
          createdAt: now,
          status: formData.status || 'pending',
          notificationsEnabled: true,
          ...formData as MaintenanceRecord
        };
        const withNew = [...prev, newRecord];
        return newRecord.status === 'completed' ? executeCompletion(newId, withNew) : withNew;
      }
    });
    setIsFormOpen(false);
    setEditingRecord(null);
  }, [editingRecord, executeCompletion]);

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      notifications={notifications}
      onNewMaintenance={() => { setEditingRecord(null); setIsFormOpen(true); }}
    >
      {activeTab === 'dashboard' && <Dashboard records={records} onComplete={handleCompleteMaintenance} />}
      {activeTab === 'list' && (
        <MaintenanceList 
          records={records} 
          categories={categories}
          onEdit={(r) => { setEditingRecord(r); setIsFormOpen(true); }} 
          onDelete={handleDeleteMaintenance}
          onComplete={handleCompleteMaintenance}
        />
      )}
      {activeTab === 'categories' && (
        <CategoryManager 
          categories={categories}
          records={records}
          onSave={handleSaveCategory}
          onDelete={handleDeleteCategory}
        />
      )}
      {activeTab === 'history' && (
        <History 
          records={records} 
          categories={categories}
          onDelete={handleDeleteMaintenance}
        />
      )}
      {isFormOpen && (
        <MaintenanceForm 
          onSave={handleSaveMaintenance} 
          onCancel={() => { setIsFormOpen(false); setEditingRecord(null); }} 
          initialData={editingRecord}
        />
      )}
    </Layout>
  );
};

export default App;
