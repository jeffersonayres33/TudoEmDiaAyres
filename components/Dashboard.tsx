import React, { useMemo, useState, useEffect } from 'react';
import { MaintenanceRecord } from '../types';
import { Icons, ICON_MAP } from '../constants';
import { getDaysRemaining, formatDate, loadCategories } from '../utils/helpers';
import { generateMaintenanceReportSummary } from '../services/geminiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';

interface DashboardProps {
  records: MaintenanceRecord[];
  onComplete: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ records, onComplete }) => {
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const categories = useMemo(() => loadCategories(), []);
  
  const activeRecords = useMemo(() => records.filter(r => r.status !== 'completed'), [records]);

  const stats = useMemo(() => {
    const now = new Date();
    const overdue = activeRecords.filter(r => new Date(r.nextDate!) < now).length;
    const upcoming = activeRecords.filter(r => {
      const days = getDaysRemaining(r.nextDate);
      return days >= 0 && days <= 7;
    }).length;
    const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);

    return { total: activeRecords.length, upcoming, overdue, totalCost };
  }, [activeRecords, records]);

  useEffect(() => {
    const fetchAiSummary = async () => {
      if (records.length === 0 || aiSummary) return;
      setIsAiLoading(true);
      const summary = await generateMaintenanceReportSummary(records);
      setAiSummary(summary);
      setIsAiLoading(false);
    };
    fetchAiSummary();
  }, [records]);

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
    .sort((a, b) => new Date(a.nextDate!).getTime() - new Date(b.nextDate!).getTime());

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Painel de Controle</h2>
          <p className="text-slate-500 font-medium">Análise em tempo real do seu patrimônio.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Sistema Online</span>
        </div>
      </header>

      {/* AI Summary Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
          <Icons.Zap className="w-32 h-32" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
              <Icons.ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg">Resumo Inteligente (IA)</h3>
          </div>
          {isAiLoading ? (
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <p className="text-blue-100 text-sm italic">Analisando dados financeiros e técnicos...</p>
            </div>
          ) : (
            <p className="text-blue-50 leading-relaxed text-sm font-medium max-w-2xl">
              {aiSummary || "Adicione registros para receber uma análise estratégica da sua saúde de manutenção."}
            </p>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Ativas', value: stats.total, icon: <Icons.FileText />, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Próximos 7 Dias', value: stats.upcoming, icon: <Icons.Clock />, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Em Atraso', value: stats.overdue, icon: <Icons.AlertCircle />, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Investimento Total', value: `R$ ${stats.totalCost.toLocaleString('pt-BR')}`, icon: <Icons.DollarSign />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-0.5">{stat.label}</p>
              <p className="text-xl font-black text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Icons.AlertCircle className="w-5 h-5 text-amber-500" />
              Prioridades da Semana
            </h3>
            {criticalRecords.length > 0 ? (
              <div className="space-y-3">
                {criticalRecords.map(record => {
                  const days = getDaysRemaining(record.nextDate);
                  const catDef = categories.find(c => c.name === record.category);
                  const IconComp = ICON_MAP[catDef?.icon || 'Tag'] || Icons.Tag;

                  return (
                    <div key={record.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${catDef?.color || 'bg-white shadow-sm'}`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{record.name}</p>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${days < 0 ? 'text-red-500' : 'text-amber-500'}`}>
                            {days < 0 ? `Vencido há ${Math.abs(days)}d` : days === 0 ? 'Expira hoje' : `Em ${days} dias`} • {formatDate(record.nextDate)}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => onComplete(record.id)}
                        className="bg-white text-slate-900 px-5 py-2 rounded-xl text-[10px] font-black shadow-sm border border-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-95 uppercase tracking-tighter"
                      >
                        Concluir
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 bg-emerald-50/30 rounded-2xl border border-dashed border-emerald-100">
                <Icons.CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <p className="text-emerald-700 font-semibold text-sm">Parabéns! Nenhuma pendência crítica.</p>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-80">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Icons.TrendingUp className="w-5 h-5 text-blue-500" />
              Evolução de Custos
            </h3>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={costData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)'}}
                />
                <Bar dataKey="cost" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Mix de Categorias</h3>
          <div className="h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={10}
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
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#64748b'][i % 5] }}></span>
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{cat.name}</span>
                </div>
                <span className="font-black text-slate-900 text-sm">{cat.value}</span>
              </div>
            )) : (
              <p className="text-center text-slate-400 text-xs py-4 italic">Nenhum dado para exibir.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;