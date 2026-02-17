
import React, { useState, useMemo } from 'react';
import { MaintenanceRecord, CategoryDefinition } from '../types';
import { Icons, ICON_MAP } from '../constants';
import { formatDate, getDaysRemaining, getStatusColor } from '../utils/helpers';
import { getMaintenanceTips } from '../services/geminiService';

interface MaintenanceListProps {
  records: MaintenanceRecord[];
  categories: CategoryDefinition[];
  onEdit: (record: MaintenanceRecord) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
}

const MaintenanceList: React.FC<MaintenanceListProps> = ({ records, categories, onEdit, onDelete, onComplete }) => {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedTip, setSelectedTip] = useState<{id: string, text: string} | null>(null);
  const [isLoadingTip, setIsLoadingTip] = useState(false);

  const filteredRecords = useMemo(() => {
    return records
      .filter(r => {
        const isNotCompleted = r.status !== 'completed';
        const matchesCategory = filter === 'all' || r.category === filter;
        const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
        return isNotCompleted && matchesCategory && matchesSearch;
      })
      .sort((a, b) => new Date(a.nextDate || '').getTime() - new Date(b.nextDate || '').getTime());
  }, [records, filter, search]);

  const handleShowTip = async (record: MaintenanceRecord) => {
    if (isLoadingTip) return;
    setIsLoadingTip(true);
    const tip = await getMaintenanceTips(record);
    setSelectedTip({ id: record.id, text: tip });
    setIsLoadingTip(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(id);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <header className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Minhas Manutenções</h2>
          <p className="text-slate-500">Tarefas ativas e preventivas.</p>
        </div>
        <div className="flex gap-3">
          <select value={filter} onChange={e => setFilter(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none">
            <option value="all">Todas Categorias</option>
            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
          </select>
          <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none w-full sm:w-64" />
        </div>
      </header>

      {filteredRecords.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRecords.map(record => {
            const days = getDaysRemaining(record.nextDate);
            const statusClass = getStatusColor(record.status, days);
            const catDef = categories.find(c => c.name === record.category);
            const IconComp = ICON_MAP[catDef?.icon || 'Tag'] || Icons.Tag;

            return (
              <div key={record.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col hover:shadow-md transition-shadow relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${catDef?.color || 'bg-slate-100'} shadow-sm`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{record.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{record.category}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${statusClass}`}>
                    {days < 0 ? 'Atrasado' : 'Pendente'}
                  </div>
                </div>

                <div className="space-y-2 mb-6 flex-1">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Icons.Calendar className="w-4 h-4" /> <span>Vencimento: <b className="text-slate-800">{formatDate(record.nextDate)}</b></span>
                  </div>
                  {!record.notificationsEnabled && <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase"><Icons.BellOff className="w-3 h-3" /> Notificações Desativadas</p>}
                </div>

                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex gap-1">
                    <button onClick={() => handleShowTip(record)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Icons.CheckCircle2 className={`w-5 h-5 ${isLoadingTip && selectedTip?.id === record.id ? 'animate-spin' : ''}`} /></button>
                    <button onClick={() => onEdit(record)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Icons.FileText className="w-5 h-5" /></button>
                    <button onClick={(e) => handleDelete(e, record.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Icons.Trash2 className="w-5 h-5" /></button>
                  </div>
                  <button onClick={() => onComplete(record.id)} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors">Concluir</button>
                </div>

                {selectedTip?.id === record.id && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 text-[11px] text-blue-700 italic">" {selectedTip.text} "</div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center text-slate-400 font-medium">Nenhuma manutenção ativa no momento.</div>
      )}
    </div>
  );
};

export default MaintenanceList;
