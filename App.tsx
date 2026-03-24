
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import MaintenanceList from './components/MaintenanceList';
import MaintenanceForm from './components/MaintenanceForm';
import CategoryManager from './components/CategoryManager';
import History from './components/History';
import { MaintenanceRecord, Periodicity, CategoryDefinition, MaintenanceNotification } from './types';
import { getDaysRemaining } from './utils/helpers';
import { Icons } from './constants';
import { auth, db, loginWithGoogle, logout } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [categories, setCategories] = useState<CategoryDefinition[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string, type: 'maintenance' | 'category', title: string } | null>(null);
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [backupConfirm, setBackupConfirm] = useState<{ content: any } | null>(null);

  // Estado para instalação PWA/APK
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setRecords([]);
      setCategories([]);
      return;
    }

    const recordsQuery = query(collection(db, 'records'), where('userId', '==', user.uid));
    const unsubscribeRecords = onSnapshot(recordsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaintenanceRecord));
      setRecords(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'records');
    });

    const categoriesQuery = query(collection(db, 'categories'), where('userId', '==', user.uid));
    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryDefinition));
      if (data.length === 0) {
        // Seed default categories
        const defaultCategories: CategoryDefinition[] = [
          { id: doc(collection(db, 'categories')).id, userId: user.uid, name: 'Veículo', icon: 'Car', color: 'bg-blue-100 text-blue-700' },
          { id: doc(collection(db, 'categories')).id, userId: user.uid, name: 'Gerador', icon: 'Zap', color: 'bg-amber-100 text-amber-700' },
          { id: doc(collection(db, 'categories')).id, userId: user.uid, name: 'Casa', icon: 'Home', color: 'bg-emerald-100 text-emerald-700' },
          { id: doc(collection(db, 'categories')).id, userId: user.uid, name: 'Quadro Elétrico', icon: 'Layout', color: 'bg-purple-100 text-purple-700' },
          { id: doc(collection(db, 'categories')).id, userId: user.uid, name: 'Outro', icon: 'Settings', color: 'bg-slate-100 text-slate-700' },
        ];
        defaultCategories.forEach(cat => {
          setDoc(doc(db, 'categories', cat.id), cat).catch(err => handleFirestoreError(err, OperationType.CREATE, 'categories'));
        });
      } else {
        setCategories(data);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    });

    return () => {
      unsubscribeRecords();
      unsubscribeCategories();
    };
  }, [user]);

  useEffect(() => {
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
    try {
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
      setBackupMessage({ type: 'success', text: 'Backup realizado com sucesso!' });
    } catch (err) {
      setBackupMessage({ type: 'error', text: 'Erro ao realizar o backup.' });
    }
  }, [records, categories]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (!file || !user) return;

      const reader = new FileReader();
      reader.onload = async (e: any) => {
        try {
          const content = JSON.parse(e.target.result);
          if (content.records && content.categories) {
            setBackupConfirm({ content });
          } else {
            setBackupMessage({ type: 'error', text: 'Arquivo de backup inválido.' });
          }
        } catch (err) {
          setBackupMessage({ type: 'error', text: 'Erro ao ler o arquivo de backup.' });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [user]);

  const handlePerformImport = useCallback(async () => {
    if (!backupConfirm || !user) return;
    try {
      const content = backupConfirm.content;
      const batch = writeBatch(db);
      
      // Delete existing records
      records.forEach(r => batch.delete(doc(db, 'records', r.id)));
      // Delete existing categories
      categories.forEach(c => batch.delete(doc(db, 'categories', c.id)));

      // Add new records
      content.records.forEach((r: MaintenanceRecord) => {
        const recToSave = { ...r, userId: user.uid };
        if (!recToSave.nextDate) delete recToSave.nextDate;
        if (recToSave.notificationsEnabled === undefined) recToSave.notificationsEnabled = true;
        batch.set(doc(db, 'records', r.id), recToSave);
      });
      // Add new categories
      content.categories.forEach((c: CategoryDefinition) => {
        batch.set(doc(db, 'categories', c.id), { ...c, userId: user.uid });
      });

      await batch.commit();
      setBackupConfirm(null);
      setBackupMessage({ type: 'success', text: 'Backup restaurado com sucesso!' });
    } catch (err) {
      setBackupConfirm(null);
      setBackupMessage({ type: 'error', text: 'Erro ao restaurar o backup.' });
      handleFirestoreError(err, OperationType.WRITE, 'batch_import');
    }
  }, [backupConfirm, user, records, categories]);

  const handlePerformDelete = useCallback(async () => {
    if (!confirmDelete || !user) return;
    try {
      if (confirmDelete.type === 'maintenance') {
        await deleteDoc(doc(db, 'records', confirmDelete.id));
      } else if (confirmDelete.type === 'category') {
        await deleteDoc(doc(db, 'categories', confirmDelete.id));
      }
      setConfirmDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, confirmDelete.type === 'maintenance' ? 'records' : 'categories');
    }
  }, [confirmDelete, user]);

  const handleSaveCategory = useCallback(async (category: CategoryDefinition) => {
    if (!user) return;
    try {
      const catToSave = { ...category, userId: user.uid };
      await setDoc(doc(db, 'categories', catToSave.id), catToSave);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'categories');
    }
  }, [user]);

  const executeCompletion = useCallback(async (id: string, allRecords: MaintenanceRecord[]) => {
    if (!user) return;
    try {
      const now = new Date().toISOString();
      const targetRecord = allRecords.find(r => r.id === id);
      if (!targetRecord) return;

      const batch = writeBatch(db);

      const completedRecord: MaintenanceRecord = { ...targetRecord, status: 'completed', completedAt: now };
      batch.set(doc(db, 'records', id), completedRecord);

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
          const newId = Math.random().toString(36).substring(2, 15);
          const newRecord: MaintenanceRecord = { 
            ...targetRecord, 
            id: newId, 
            createdAt: now, 
            lastDate: targetRecord.nextDate || targetRecord.lastDate, 
            nextDate: nextDate.toISOString().split('T')[0], 
            status: 'pending'
          };
          delete newRecord.completedAt;
          batch.set(doc(db, 'records', newId), newRecord);
        }
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'records');
    }
  }, [user]);

  const handleSaveMaintenance = useCallback(async (formData: Partial<MaintenanceRecord>) => {
    if (!user) return;
    try {
      const now = new Date().toISOString();
      if (editingRecord) {
        if (formData.status === 'completed' && editingRecord.status !== 'completed') {
          const updatedRecord = { ...editingRecord, ...formData } as MaintenanceRecord;
          if (!updatedRecord.nextDate) delete updatedRecord.nextDate;
          // Temporarily update local array for executeCompletion to find it
          const tempRecords = records.map(r => r.id === editingRecord.id ? updatedRecord : r);
          await executeCompletion(editingRecord.id, tempRecords);
        } else {
          const updatedRecord = { ...editingRecord, ...formData } as MaintenanceRecord;
          if (!updatedRecord.nextDate) delete updatedRecord.nextDate;
          await setDoc(doc(db, 'records', editingRecord.id), updatedRecord);
        }
      } else {
        const newId = Math.random().toString(36).substring(2, 15);
        const newRecord: MaintenanceRecord = { 
          id: newId, 
          userId: user.uid,
          createdAt: now, 
          status: 'pending', 
          notificationsEnabled: formData.notificationsEnabled ?? true, 
          ...formData as MaintenanceRecord 
        };
        
        if (!newRecord.nextDate) {
          delete newRecord.nextDate;
        }

        if (formData.status === 'completed') {
          newRecord.status = 'pending';
          await setDoc(doc(db, 'records', newId), newRecord);
          await executeCompletion(newId, [...records, newRecord]);
        } else {
          await setDoc(doc(db, 'records', newId), newRecord);
        }
      }
      setIsFormOpen(false);
      setEditingRecord(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'records');
    }
  }, [editingRecord, executeCompletion, records, user]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Icons.CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Bem-vindo ao TudoEmDia</h1>
          <p className="text-slate-500 mb-8">Faça login para gerenciar suas manutenções com segurança na nuvem e acessar de qualquer dispositivo.</p>
          
          <button 
            onClick={loginWithGoogle}
            className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Entrar com Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      notifications={notifications}
      canInstall={!!deferredPrompt}
      onInstall={handleInstallClick}
      onBackup={handleBackup}
      onImport={handleImport}
      onLogout={logout}
    >
      {activeTab === 'dashboard' && <Dashboard records={records} categories={categories} onComplete={(id) => executeCompletion(id, records)} />}
      {activeTab === 'list' && (
        <MaintenanceList 
          records={records} 
          categories={categories}
          onEdit={(r) => { setEditingRecord(r); setIsFormOpen(true); }} 
          onDelete={(id) => setConfirmDelete({ id, type: 'maintenance', title: 'Excluir Manutenção?' })}
          onComplete={(id) => executeCompletion(id, records)}
          onNewMaintenance={() => { setEditingRecord(null); setIsFormOpen(true); }}
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

      {backupConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.Upload className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Restaurar Backup?</h3>
              <p className="text-sm text-slate-500 mb-6">Deseja substituir seus dados atuais pelos dados do backup? Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setBackupConfirm(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handlePerformImport}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95 text-sm"
                >
                  Restaurar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {backupMessage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${backupMessage.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {backupMessage.type === 'success' ? <Icons.CheckCircle2 className="w-6 h-6" /> : <Icons.AlertCircle className="w-6 h-6" />}
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{backupMessage.type === 'success' ? 'Sucesso' : 'Erro'}</h3>
              <p className="text-sm text-slate-500 mb-6">{backupMessage.text}</p>
              <button 
                onClick={() => setBackupMessage(null)}
                className="w-full px-4 py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 shadow-lg shadow-slate-200 transition-all active:scale-95 text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <MaintenanceForm 
          onSave={handleSaveMaintenance} 
          onCancel={() => { setIsFormOpen(false); setEditingRecord(null); }} 
          initialData={editingRecord}
          categories={categories}
        />
      )}
    </Layout>
  );
};

export default App;