
import { MaintenanceRecord, CategoryDefinition } from '../types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return '---';
  return new Date(dateStr).toLocaleDateString('pt-BR');
};

export const formatDateTime = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const calculateStatus = (nextDateStr?: string): 'pending' | 'overdue' | 'completed' => {
  if (!nextDateStr) return 'pending';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextDate = new Date(nextDateStr);
  nextDate.setHours(0, 0, 0, 0);

  if (nextDate < today) return 'overdue';
  return 'pending';
};

export const getDaysRemaining = (dateStr?: string) => {
  if (!dateStr) return 999; 
  const today = new Date();
  const target = new Date(dateStr);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Persistence
export const saveRecords = (records: MaintenanceRecord[]) => {
  localStorage.setItem('mainttrack_records', JSON.stringify(records));
};

export const loadRecords = (): MaintenanceRecord[] => {
  const data = localStorage.getItem('mainttrack_records');
  return data ? JSON.parse(data) : [];
};

export const saveCategories = (categories: CategoryDefinition[]) => {
  localStorage.setItem('mainttrack_categories', JSON.stringify(categories));
};

export const loadCategories = (): CategoryDefinition[] => {
  const data = localStorage.getItem('mainttrack_categories');
  const defaultCategories: CategoryDefinition[] = [
    { id: '1', name: 'Veículo', icon: 'Car', color: 'bg-blue-100 text-blue-700' },
    { id: '2', name: 'Gerador', icon: 'Zap', color: 'bg-amber-100 text-amber-700' },
    { id: '3', name: 'Casa', icon: 'Home', color: 'bg-emerald-100 text-emerald-700' },
    { id: '4', name: 'Quadro Elétrico', icon: 'Layout', color: 'bg-purple-100 text-purple-700' },
    { id: '5', name: 'Outro', icon: 'Settings', color: 'bg-slate-100 text-slate-700' },
  ];
  return data ? JSON.parse(data) : defaultCategories;
};

export const getStatusColor = (status: string, daysRemaining: number) => {
  if (status === 'completed') return 'text-emerald-600 bg-emerald-50 border-emerald-100';
  if (status === 'overdue' || daysRemaining < 0) return 'text-red-600 bg-red-50 border-red-100';
  if (daysRemaining <= 7) return 'text-amber-600 bg-amber-50 border-amber-100';
  return 'text-slate-600 bg-slate-50 border-slate-100';
};

// CSV Export
export const exportHistoryToCSV = (records: MaintenanceRecord[]) => {
  const headers = ['Serviço', 'Categoria', 'Data Criação', 'Data da Manutenção', 'Custo (R$)', 'Descrição'];
  const rows = records.map(r => [
    r.name,
    r.category,
    formatDateTime(r.createdAt),
    formatDate(r.completedAt || r.lastDate),
    (r.cost || 0).toFixed(2).replace('.', ','),
    (r.description || '').replace(/[\n\r;]/g, ' ')
  ]);
  const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `relatorio_manutencoes_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// MÉTODO: Geração de PDF Profissional em Modo Paisagem com Descrição
export const exportHistoryToPDF = (records: MaintenanceRecord[]) => {
  const doc = new jsPDF('l', 'mm', 'a4') as any;
  const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);
  
  // Cabeçalho
  doc.setFontSize(22);
  doc.setTextColor(37, 99, 235); // Blue-600
  doc.text('TudoEmDia - Relatório Detalhado de Manutenções', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Extraído em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);
  
  // Caixa de Resumo (Ajustada para Landscape)
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.rect(14, 35, 269, 18, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(51);
  doc.text('Total de Registros:', 20, 46);
  doc.setFont('helvetica', 'bold');
  doc.text(`${records.length}`, 55, 46);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Investimento Acumulado:', 90, 46);
  doc.setTextColor(37, 99, 235);
  doc.setFont('helvetica', 'bold');
  doc.text(`R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 135, 46);

  // Mapeamento dos dados incluindo Descrição
  const tableData = records.map(r => [
    r.name,
    r.category,
    formatDate(r.completedAt || r.lastDate),
    `R$ ${(r.cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    r.description || '---'
  ]);

  doc.autoTable({
    startY: 58,
    head: [['Serviço', 'Categoria', 'Execução', 'Custo', 'Descrição Detalhada']],
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [37, 99, 235], 
      fontSize: 10,
      halign: 'center'
    },
    bodyStyles: { 
      fontSize: 9,
      cellPadding: 4,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45 },
      1: { cellWidth: 35 },
      2: { halign: 'center', cellWidth: 30 },
      3: { halign: 'right', cellWidth: 35, fontStyle: 'bold' },
      4: { cellWidth: 'auto' }
    },
    styles: {
      valign: 'middle'
    },
    didDrawPage: (data: any) => {
      const str = `Página ${doc.internal.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(str, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
      doc.text('TudoEmDia - Sistema de Gestão Profissional', 14, doc.internal.pageSize.height - 10);
    }
  });

  doc.save(`relatorio_completo_manutencoes_${new Date().toISOString().split('T')[0]}.pdf`);
};
