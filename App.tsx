
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import MaintenanceList from './components/MaintenanceList';
import MaintenanceForm from './components/MaintenanceForm';
import CategoryManager from './components/CategoryManager';
import History from './components/History';
import { MaintenanceRecord, Periodicity, CategoryDefinition, MaintenanceNotification } from './types';
import { loadRecords, saveRecords, loadCategories, saveCategories, getDaysRemaining } from './utils/helpers';
import { Icons } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [categories, setCategories] = useState<CategoryDefinition[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string, type: 'maintenance' | 'category', title: string } | null>(null);

  // Estado para instalação PWA/APK
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    setRecords(loadRecords());
    setCategories(loadCategories());

    // Captura o evento de instalação do navegador
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      console.log('App TudoEmDia instalado com sucesso!');
    });
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  useEffect(() => {
    saveRecords(records);
  }, [records]);

  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  const notifications = useMemo(() => {
    const alerts: MaintenanceNotification[] = [];
    records
      .filter(r => r.status === 'pending' && r.notificationsEnabled && r.nextDate)
      .forEach(r => {
        const days = getDaysRemaining(r.nextDate);
        if (days === 0) alerts.push({ id: `0-${r.id}`, maintenanceId: r.id, title: 'Vence Hoje', message: `A manutenção "${r.name}" vence hoje!`, type: 'danger', date: r.nextDate! });
        else if (days < 0) alerts.push({ id: `v-${r.id}`, maintenanceId: r.id, title: 'Vencida', message: `A manutenção "${r.name}" está atrasada há ${Math.abs(days)} dias!`, type: 'danger', date: r.nextDate! });
        else if (days > 0 && days <= 3) alerts.push({ id: `w-${r.id}`, maintenanceId: r.id, title: 'Próximo Vencimento', message: `"${r.name}" vence em ${days} dias.`, type: 'warning', date: r.nextDate! });
      });
    return alerts;
  }, [records]);

  const handleBackup = useCallback(() => {
    const data = {
      records,
      categories,
      exportDate: new Date().toISOString(),
      appName: 'TudoEmDia'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_tudoemdia_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [records, categories]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const content = JSON.parse(e.target.result);
          if (content.records && content.categories) {
            if (confirm('Deseja substituir seus dados atuais pelos dados do backup? Esta ação não pode ser desfeita.')) {
              setRecords(content.records);
              setCategories(content.categories);
              alert('Dados restaurados com sucesso!');
            }
          } else {
            alert('Arquivo de backup inválido.');
          }
        } catch (err) {
          alert('Erro ao processar o arquivo. Certifique-se de que é um JSON válido.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  const handlePerformDelete = useCallback(() => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'maintenance') {
      setRecords(prev => prev.filter(r => r.id !== confirmDelete.id));
    } else if (confirmDelete.type === 'category') {
      setCategories(prev => prev.filter(c => c.id !== confirmDelete.id));
    }
    setConfirmDelete(null);
  }, [confirmDelete]);

  const handleSaveCategory = useCallback((category: CategoryDefinition) => {
    setCategories(prev => {
      const exists = prev.some(c => c.id === category.id);
      return exists ? prev.map(c => c.id === category.id ? category : c) : [...prev, category];
    });
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
        newRecords.push({ ...targetRecord, id: Math.random().toString(36).substring(2, 15), createdAt: now, lastDate: targetRecord.nextDate || targetRecord.lastDate, nextDate: nextDate.toISOString().split('T')[0], status: 'pending', completedAt: undefined });
      }
    }
    return newRecords;
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
        const newRecord: MaintenanceRecord = { id: newId, createdAt: now, status: formData.status || 'pending', notificationsEnabled: formData.notificationsEnabled ?? true, ...formData as MaintenanceRecord };
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
      canInstall={!!deferredPrompt}
      onInstall={handleInstallClick}
      onBackup={handleBackup}
      onImport={handleImport}
    >
      {activeTab === 'dashboard' && <Dashboard records={records} onComplete={(id) => setRecords(prev => executeCompletion(id, prev))} />}
      {activeTab === 'list' && (
        <MaintenanceList 
          records={records} 
          categories={categories}
          onEdit={(r) => { setEditingRecord(r); setIsFormOpen(true); }} 
          onDelete={(id) => setConfirmDelete({ id, type: 'maintenance', title: 'Excluir Manutenção?' })}
          onComplete={(id) => setRecords(prev => executeCompletion(id, prev))}
        />
      )}
      {activeTab === 'categories' && (
        <CategoryManager 
          categories={categories}
          records={records}
          onSave={handleSaveCategory}
          onDelete={(id) => setConfirmDelete({ id, type: 'category', title: 'Excluir Categoria?' })}
        />
      )}
      {activeTab === 'history' && (
        <History 
          records={records} 
          categories={categories}
          onDelete={(id) => setConfirmDelete({ id, type: 'maintenance', title: 'Excluir Registro do Histórico?' })}
        />
      )}
      
      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{confirmDelete.title}</h3>
              <p className="text-sm text-slate-500 mb-6">Esta ação é permanente e não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handlePerformDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-100 transition-all active:scale-95 text-sm"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
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