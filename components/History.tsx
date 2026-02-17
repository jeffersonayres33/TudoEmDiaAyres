
import React, { useState, useMemo } from 'react';
import { MaintenanceRecord, CategoryDefinition } from '../types';
import { formatDate } from '../utils/helpers';
import { Icons, CATEGORY_ICONS } from '../constants';

interface HistoryProps {
  records: MaintenanceRecord[];
  categories: CategoryDefinition[];
  onDelete: (id: string) => void;
}

const History: React.FC<HistoryProps> = ({ records, categories, onDelete }) => {
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDatePrevStart, setFilterDatePrevStart] = useState('');
  const [filterDatePrevEnd, setFilterDatePrevEnd] = useState('');
  const [filterDateDoneStart, setFilterDateDoneStart] = useState('');
  const [filterDateDoneEnd, setFilterDateDoneEnd] = useState('');
  const [minCost, setMinCost] = useState('');
  const [maxCost, setMaxCost] = useState('');

  const history = useMemo(() => {
    return records
      .filter(r => r.status === 'completed')
      .filter(r => {
        if (filterCategory && r.category !== filterCategory) return false;
        if (r.nextDate) {
          if (filterDatePrevStart && new Date(r.nextDate) < new Date(filterDatePrevStart)) return false;
          if (filterDatePrevEnd && new Date(r.nextDate) > new Date(filterDatePrevEnd)) return false;
        }
        const doneDate = r.completedAt || r.lastDate;
        if (filterDateDoneStart && new Date(doneDate) < new Date(filterDateDoneStart)) return false;
        if (filterDateDoneEnd && new Date(doneDate) > new Date(filterDateDoneEnd)) return false;
        const cost = r.cost || 0;
        if (minCost && cost < parseFloat(minCost)) return false;
        if (maxCost && cost > parseFloat(maxCost)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.completedAt || '').getTime() - new Date(a.completedAt || '').getTime());
  }, [records, filterCategory, filterDatePrevStart, filterDatePrevEnd, filterDateDoneStart, filterDateDoneEnd, minCost, maxCost]);

  const clearFilters = () => {
    setFilterCategory('');
    setFilterDatePrevStart('');
    setFilterDatePrevEnd('');
    setFilterDateDoneStart('');
    setFilterDateDoneEnd('');
    setMinCost('');
    setMaxCost('');
  };

  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    window.print();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(id);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Histórico de Atividades</h2>
          <p className="text-slate-500">Relatório detalhado de manutenções finalizadas.</p>
        </div>
        <div className="flex gap-2 no-print">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Icons.Download className="w-4 h-4" />
            Imprimir Relatório
          </button>
        </div>
      </header>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 no-print">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Filtros</h3>
          <button onClick={clearFilters} className="text-xs font-bold text-blue-600 hover:underline">Limpar</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none">
            <option value="">Categorias</option>
            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
          </select>
          <div className="flex gap-1">
            <input type="date" value={filterDateDoneStart} onChange={e => setFilterDateDoneStart(e.target.value)} className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px]" title="Início Finalizado" />
            <input type="date" value={filterDateDoneEnd} onChange={e => setFilterDateDoneEnd(e.target.value)} className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px]" title="Fim Finalizado" />
          </div>
          <div className="flex gap-1">
            <input type="number" placeholder="Min R$" value={minCost} onChange={e => setMinCost(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" />
            <input type="number" placeholder="Max R$" value={maxCost} onChange={e => setMaxCost(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" />
          </div>
        </div>
      </div>

      {history.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Serviço</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Categoria</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Previsto</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Finalizado</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Custo</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase no-print">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map(record => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 text-sm">{record.name}</p>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{record.description}</p>
                    </td>
                    <td className="px-6 py-4 text-xs">{record.category}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{formatDate(record.nextDate)}</td>
                    <td className="px-6 py-4 text-xs text-emerald-600 font-bold">{formatDate(record.completedAt || record.lastDate)}</td>
                    <td className="px-6 py-4 text-sm font-black text-slate-800">R$ {record.cost?.toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4 no-print">
                      <button onClick={(e) => handleDelete(e, record.id)} className="p-2 text-slate-300 hover:text-red-600 transition-colors"><Icons.Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50 p-4 border-t border-slate-100 text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Total Filtrado</p>
            <p className="text-lg font-black text-slate-800">R$ {history.reduce((sum, r) => sum + (r.cost || 0), 0).toLocaleString('pt-BR')}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-20 text-center border border-slate-200"><p className="text-slate-500 font-medium">Nenhum registro encontrado.</p></div>
      )}
    </div>
  );
};

export default History;
