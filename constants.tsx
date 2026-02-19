
import React from 'react';
import { 
  Car, 
  Zap, 
  Home, 
  Layout, 
  Settings, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  FileText, 
  Plus, 
  Trash2, 
  ChevronRight,
  Menu,
  X,
  History,
  TrendingUp,
  Download,
  Bell,
  BellOff,
  Wrench,
  Droplets,
  Hammer,
  ShieldCheck,
  Tag,
  Upload,
  Database,
  Save
} from 'lucide-react';

export const ICON_MAP: Record<string, any> = {
  Car, Zap, Home, Layout, Settings, Wrench, Droplets, Hammer, ShieldCheck, Tag
};

export const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Veículo': <Car className="w-5 h-5" />,
  'Gerador': <Zap className="w-5 h-5" />,
  'Casa': <Home className="w-5 h-5" />,
  'Quadro Elétrico': <Layout className="w-5 h-5" />,
  'Outro': <Settings className="w-5 h-5" />
};

export const CATEGORY_COLORS: Record<string, string> = {
  'Veículo': 'bg-blue-100 text-blue-700',
  'Gerador': 'bg-amber-100 text-amber-700',
  'Casa': 'bg-emerald-100 text-emerald-700',
  'Quadro Elétrico': 'bg-purple-100 text-purple-700',
  'Outro': 'bg-slate-100 text-slate-700'
};

export const Icons = {
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Plus,
  Trash2,
  ChevronRight,
  Menu,
  X,
  History,
  TrendingUp,
  Download,
  Bell,
  BellOff,
  Tag,
  Zap,
  ShieldCheck,
  Upload,
  Database,
  Save
};