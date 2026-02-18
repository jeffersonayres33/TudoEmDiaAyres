
import React, { useState, useMemo, useCallback } from 'react';
import { MaintenanceRecord, CategoryDefinition } from '../types';
import { formatDate, formatDateTime, exportHistoryToCSV, exportHistoryToPDF } from '../utils/helpers';
import { Icons } from '../constants';

interface HistoryProps {
  records: MaintenanceRecord[];
  categories: CategoryDefinition[];
  onDelete: (id: string) => void;
}

const History: React.FC<HistoryProps> = ({ records, categories, onDelete }) => {
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateDoneStart, setFilterDateDoneStart] = useState('');
  const [filterDateDoneEnd, setFilterDateDoneEnd] = useState('');
  const [minCost, setMinCost] = useState('');
  const [maxCost, setMaxCost] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const history = useMemo(() => {
    return records
      .filter(r => r.status === 'completed')
      .filter(r => {
        if (filterCategory && r.category !== filterCategory) return false;
        
        const doneDate = r.completedAt || r.lastDate;
        if (filterDateDoneStart && new Date(doneDate) < new Date(filterDateDoneStart)) return false;
        if (filterDateDoneEnd && new Date(doneDate) > new Date(filterDateDoneEnd)) return false;
        
        const cost = r.cost || 0;
        if (minCost && cost < parseFloat(minCost)) return false;
        if (maxCost && cost > parseFloat(maxCost)) return false;
        
        return true;
      })
      .sort((a, b) => new Date(b.completedAt || '').getTime() - new Date(a.completedAt || '').getTime());
  }, [records, filterCategory, filterDateDoneStart, filterDateDoneEnd, minCost, maxCost]);

  const clearFilters = () => {
    setFilterCategory('');
    setFilterDateDoneStart('');
    setFilterDateDoneEnd('');
    setMinCost('');
    setMaxCost('');
  };

  const handleExcluir = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(id);
  }, [onDelete]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleGeneratePDF = async () => {
    if (history.length === 0) return;
    setIsGenerating(true);
    try {
      // Simula um delay para o usuário ver o feedback visual
      await new Promise(resolve => setTimeout(resolve, 800));
      exportHistoryToPDF(history);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportCSV = () => {
    exportHistoryToCSV(history);
  };

  const totalFilteredCost = useMemo(() => 
    history.reduce((sum, r) => sum + (r.cost || 0), 0), 
  [history]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Histórico de Atividades</h2>
          <p className="text-slate-500">Relatório de todas as manutenções finalizadas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95"
          >
            <Icons.Download className="w-4 h-4" />
            Excel / CSV
          </button>
          <button 
            onClick={handleGeneratePDF}
            disabled={isGenerating || history.length === 0}
            className={`flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 ${isGenerating || history.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <Icons.FileText className="w-4 h-4" />
                Gerar Relatório PDF
              </>
            )}
          </button>
        </div>
      </header>

      {/* Painel de Filtros */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
             Filtros de Pesquisa
          </h3>
          <button onClick={clearFilters} className="text-xs font-bold text-blue-600 hover:underline">Limpar Filtros</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <select 
            value={filterCategory} 
            onChange={e => setFilterCategory(e.target.value)} 
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas Categorias</option>
            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
          </select>
          <div className="flex gap-1">
            <input type="date" value={filterDateDoneStart} onChange={e => setFilterDateDoneStart(e.target.value)} className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px]" title="De" />
            <input type="date" value={filterDateDoneEnd} onChange={e => setFilterDateDoneEnd(e.target.value)} className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px]" title="Até" />
          </div>
          <div className="flex gap-1">
            <input type="number" placeholder="Mín R$" value={minCost} onChange={e => setMinCost(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" />
            <input type="number" placeholder="Máx R$" value={maxCost} onChange={e => setMaxCost(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" />
          </div>
        </div>
      </div>

      {history.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Serviço</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Criação / Manutenção</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Custo</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map(record => (
                  <React.Fragment key={record.id}>
                    <tr 
                      onClick={() => toggleExpand(record.id)}
                      className={`hover:bg-slate-50 transition-colors group cursor-pointer ${expandedId === record.id ? 'bg-blue-50/30' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 text-sm">{record.name}</p>
                        {!expandedId && record.description && (
                          <p className="text-[10px] text-slate-400 italic line-clamp-1">
                            {record.description}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Icons.Clock className="w-3 h-3" /> {formatDateTime(record.createdAt)}
                          </p>
                          <p className="text-xs text-emerald-600 font-bold">
                            {formatDate(record.completedAt || record.lastDate)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">{record.category}</td>
                      <td className="px-6 py-4 text-sm font-black text-slate-800">
                        R$ {record.cost?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={(e) => handleExcluir(e, record.id)} 
                          className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Remover permanentemente"
                        >
                          <Icons.Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    {expandedId === record.id && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={5} className="px-6 py-4 text-sm text-slate-600 leading-relaxed border-l-4 border-blue-500 animate-in slide-in-from-top-2">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Descrição Completa:</span>
                            <span className="whitespace-pre-wrap">{record.description || 'Nenhuma observação registrada para este serviço.'}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50 p-6 border-t border-slate-100 text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Filtrado</p>
            <p className="text-2xl font-black text-blue-600">
              R$ {totalFilteredCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-20 text-center border border-slate-200">
          <Icons.History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Histórico vazio para os filtros aplicados.</p>
        </div>
      )}
    </div>
  );
};

export default History;
