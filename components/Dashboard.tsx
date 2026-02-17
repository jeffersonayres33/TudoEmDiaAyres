
import React, { useMemo } from 'react';
import { MaintenanceRecord, CategoryDefinition } from '../types';
import { Icons, ICON_MAP } from '../constants';
import { getDaysRemaining, getStatusColor, formatDate, loadCategories } from '../utils/helpers';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';

interface DashboardProps {
  records: MaintenanceRecord[];
  onComplete: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ records, onComplete }) => {
  const categories = useMemo(() => loadCategories(), []);
  
  // Apenas registros NÃO concluídos interessam para o Dashboard estatístico
  const activeRecords = useMemo(() => records.filter(r => r.status !== 'completed'), [records]);

  const stats = useMemo(() => {
    const now = new Date();
    const overdue = activeRecords.filter(r => new Date(r.nextDate) < now).length;
    const upcoming = activeRecords.filter(r => {
      const days = getDaysRemaining(r.nextDate);
      return days >= 0 && days <= 7;
    }).length;
    const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);

    return { total: activeRecords.length, upcoming, overdue, totalCost };
  }, [activeRecords, records]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    activeRecords.forEach(r => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [activeRecords]);

  const costData = useMemo(() => {
    return records
      .filter(r => (r.cost || 0) > 0)
      .sort((a, b) => new Date(a.lastDate).getTime() - new Date(b.lastDate).getTime())
      .slice(-5)
      .map(r => ({ name: r.name, cost: r.cost || 0 }));
  }, [records]);

  const criticalRecords = activeRecords
    .filter(r => getDaysRemaining(r.nextDate) <= 7)
    .sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime());

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
        <p className="text-slate-500">Status atual do seu plano de manutenção.</p>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ativas', value: stats.total, icon: <Icons.FileText />, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Próximas', value: stats.upcoming, icon: <Icons.Clock />, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Atrasadas', value: stats.overdue, icon: <Icons.AlertCircle />, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Investimento', value: `R$ ${stats.totalCost.toLocaleString()}`, icon: <Icons.DollarSign />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02]">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-lg font-black text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Icons.AlertCircle className="w-5 h-5 text-amber-500" />
              Alertas de Atenção
            </h3>
            {criticalRecords.length > 0 ? (
              <div className="space-y-3">
                {criticalRecords.map(record => {
                  const days = getDaysRemaining(record.nextDate);
                  const catDef = categories.find(c => c.name === record.category);
                  const IconComp = ICON_MAP[catDef?.icon || 'Tag'] || Icons.Tag;

                  return (
                    <div key={record.id} className={`flex items-center justify-between p-4 rounded-xl border-2 border-transparent bg-slate-50 hover:bg-white hover:border-slate-200 transition-all`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${catDef?.color || 'bg-white'}`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{record.name}</p>
                          <p className={`text-[10px] font-bold uppercase tracking-tighter ${days < 0 ? 'text-red-500' : 'text-amber-500'}`}>
                            {days < 0 ? `Atrasado: ${Math.abs(days)}d` : days === 0 ? 'Vence Hoje!' : `Em ${days} dias`} • {formatDate(record.nextDate)}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => onComplete(record.id)}
                        className="bg-white text-slate-800 px-4 py-2 rounded-xl text-[10px] font-black shadow-sm border border-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-95 uppercase tracking-widest"
                      >
                        Concluir
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-block p-4 bg-emerald-50 rounded-full mb-3">
                  <Icons.CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="text-slate-500 font-medium">Parabéns! Tudo está em dia.</p>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-80">
            <h3 className="font-bold text-slate-800 mb-6">Investimento Recente (R$)</h3>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={costData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}}
                />
                <Bar dataKey="cost" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Tarefas por Categoria</h3>
          <div className="h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#64748b'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {categoryData.length > 0 ? categoryData.map((cat, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#64748b'][i % 5] }}></span>
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-widest">{cat.name}</span>
                </div>
                <span className="font-black text-slate-800 text-sm">{cat.value}</span>
              </div>
            )) : (
              <p className="text-center text-slate-400 text-xs py-4">Nenhum dado ativo.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
