
export interface CategoryDefinition {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export enum Periodicity {
  NONE = 'Nenhuma',
  DAYS_30 = '30 dias',
  MONTHS_3 = '3 meses',
  MONTHS_6 = '6 meses',
  YEAR_1 = '1 ano',
  CUSTOM = 'Personalizado'
}

export interface MaintenanceNotification {
  id: string;
  maintenanceId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'danger';
  date: string;
}

export interface MaintenanceRecord {
  id: string;
  name: string;
  category: string;
  lastDate: string;
  nextDate?: string;
  periodicity: Periodicity;
  description: string;
  cost?: number;
  notificationsEnabled: boolean;
  status: 'pending' | 'completed' | 'overdue';
  createdAt: string;
  completedAt?: string;
  attachments?: string[];
}

export interface DashboardStats {
  total: number;
  upcoming: number;
  overdue: number;
  totalCost: number;
}
