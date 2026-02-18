
import React, { useState, useEffect } from 'react';
import { MaintenanceRecord, Periodicity, CategoryDefinition } from '../types';
import { Icons } from '../constants';
import { loadCategories } from '../utils/helpers';

interface MaintenanceFormProps {
  onSave: (record: Partial<MaintenanceRecord>) => void;
  onCancel: () => void;
  initialData?: MaintenanceRecord | null;
}

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({ onSave, onCancel, initialData }) => {
  const [categories, setCategories] = useState<CategoryDefinition[]>([]);
  const [formData, setFormData] = useState<Partial<MaintenanceRecord>>(
    initialData || {
      name: '',
      category: '',
      lastDate: new Date().toISOString().split('T')[0],
      nextDate: '',
      periodicity: Periodicity.NONE,
      description: '',
      cost: 0,
      notificationsEnabled: true,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
  );

  useEffect(() => {
    const cats = loadCategories();
    setCategories(cats);
    if (!formData.category && cats.length > 0) {
      setFormData(prev => ({ ...prev, category: cats[0].name }));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.lastDate || !formData.category) {
      alert("Campos obrigatórios: Nome, Categoria e Data da Manutenção.");
      return;
    }
    onSave(formData);
  };

  const handlePeriodicityChange = (period: Periodicity) => {
    let next = new Date(formData.lastDate || new Date());
    switch (period) {
      case Periodicity.DAYS_30: next.setDate(next.getDate() + 30); break;
      case Periodicity.MONTHS_3: next.setMonth(next.getMonth() + 3); break;
      case Periodicity.MONTHS_6: next.setMonth(next.getMonth() + 6); break;
      case Periodicity.YEAR_1: next.setFullYear(next.getFullYear() + 1); break;
    }
    setFormData({ 
      ...formData, 
      periodicity: period,
      nextDate: period !== Periodicity.NONE && period !== Periodicity.CUSTOM ? next.toISOString().split('T')[0] : formData.nextDate
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{initialData ? 'Editar Manutenção' : 'Nova Manutenção'}</h2>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Preencha os dados técnicos abaixo</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-lg transition-colors"><Icons.X className="w-6 h-6 text-slate-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Nome da Manutenção *</label>
              <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: Pintura da Fachada" required />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Categoria *</label>
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none">
                {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Data da Manutenção *</label>
              <input type="date" value={formData.lastDate} onChange={e => setFormData({ ...formData, lastDate: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Próxima Manutenção</label>
              <input type="date" value={formData.nextDate} onChange={e => setFormData({ ...formData, nextDate: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Periodicidade</label>
              <select value={formData.periodicity} onChange={e => handlePeriodicityChange(e.target.value as Periodicity)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none">
                {Object.values(Periodicity).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Investimento (R$)</label>
              <input type="number" value={formData.cost} onChange={e => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, notificationsEnabled: !formData.notificationsEnabled })}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${formData.notificationsEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <span className={`w-4 h-4 bg-white rounded-full absolute transition-transform ${formData.notificationsEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
            <div>
              <p className="text-sm font-bold text-slate-800">Ativar Notificações Inteligentes</p>
              <p className="text-xs text-slate-500">Alertar em 7, 3, 1 e no dia do vencimento.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Descrição / Observações</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Detalhes técnicos relevantes..." />
          </div>

          <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3">
            <button type="button" onClick={onCancel} className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
            <button type="submit" className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg transition-all active:scale-95">Salvar Manutenção</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceForm;
