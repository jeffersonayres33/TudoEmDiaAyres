
import React, { useState, useMemo } from 'react';
import { MaintenanceRecord, CategoryDefinition } from '../types';
import { Icons, ICON_MAP } from '../constants';
import { formatDate, getDaysRemaining, getStatusColor, formatDateTime } from '../utils/helpers';
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

  const handleShowTip = async (e: React.MouseEvent, record: MaintenanceRecord) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoadingTip) return;
    setIsLoadingTip(true);
    const tip = await getMaintenanceTips(record);
    setSelectedTip({ id: record.id, text: tip });
    setIsLoadingTip(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <header className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Minhas Manutenções</h2>
          <p className="text-slate-500">Controle de tarefas ativas e preventivas.</p>
        </div>
        <div className="flex gap-3">
          <select value={filter} onChange={e => setFilter(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none shadow-sm focus:ring-2 focus:ring-blue-500">
            <option value="all">Todas Categorias</option>
            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
          </select>
          <div className="relative flex-1 sm:w-64">
             <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none shadow-sm focus:ring-2 focus:ring-blue-500" />
          </div>
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
              <div key={record.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col hover:shadow-lg transition-all relative group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${catDef?.color || 'bg-slate-100'} shadow-sm group-hover:scale-110 transition-transform`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 line-clamp-1">{record.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{record.category}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${statusClass}`}>
                    {days < 0 ? 'Atrasado' : 'Pendente'}
                  </div>
                </div>

                <div className="space-y-2 mb-6 flex-1">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Icons.Calendar className="w-4 h-4 text-slate-400" /> 
                    <span>Vencimento: <b className="text-slate-800">{formatDate(record.nextDate)}</b></span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                    <Icons.Clock className="w-3 h-3" />
                    <span>Criado em: {formatDateTime(record.createdAt)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex gap-1">
                    <button 
                      onClick={(e) => handleShowTip(e, record)} 
                      className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                      title="Dicas de IA"
                    >
                      <Icons.CheckCircle2 className={`w-5 h-5 ${isLoadingTip && selectedTip?.id === record.id ? 'animate-spin' : ''}`} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEdit(record); }} 
                      className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      title="Editar"
                    >
                      <Icons.FileText className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(record.id); }} 
                      className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Excluir"
                    >
                      <Icons.Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onComplete(record.id); }} 
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-100"
                  >
                    Concluir
                  </button>
                </div>

                {selectedTip?.id === record.id && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 text-[11px] text-blue-700 animate-in zoom-in-95 leading-relaxed">
                    <span className="font-bold block mb-1 uppercase text-[9px] tracking-widest text-blue-400">Sugestão TudoEmDia:</span>
                    {selectedTip.text}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
          <Icons.Tag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Nenhuma manutenção pendente para estes filtros.</p>
        </div>
      )}
    </div>
  );
};

export default MaintenanceList;
