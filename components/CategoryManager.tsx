
import React, { useState, useMemo } from 'react';
import { CategoryDefinition, MaintenanceRecord } from '../types';
import { Icons, ICON_MAP } from '../constants';

interface CategoryManagerProps {
  categories: CategoryDefinition[];
  records: MaintenanceRecord[];
  onSave: (category: CategoryDefinition) => void;
  onDelete: (id: string) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, records, onSave, onDelete }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDefinition | null>(null);
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Tag');

  const availableIcons = Object.keys(ICON_MAP);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: editingCategory?.id || Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      name: name.trim(),
      icon: selectedIcon,
      color: editingCategory?.color || 'bg-slate-100 text-slate-700'
    });

    closeForm();
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
    setName('');
    setSelectedIcon('Tag');
  };

  const handleEdit = (cat: CategoryDefinition) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSelectedIcon(cat.icon);
    setIsFormOpen(true);
  };

  const usedCategoryNames = useMemo(() => {
    const names = new Set<string>();
    records.forEach(r => names.add(r.category.trim().toLowerCase()));
    return names;
  }, [records]);

  const checkInUse = (categoryName: string) => {
    return usedCategoryNames.has(categoryName.trim().toLowerCase());
  };

  const handleDeleteClick = (cat: CategoryDefinition) => {
    if (checkInUse(cat.name)) {
      alert(`Não é possível excluir a categoria "${cat.name}" porque existem manutenções vinculadas a ela.`);
      return;
    }
    onDelete(cat.id);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Categorias</h2>
          <p className="text-slate-500 text-sm">Organize seus ativos por tipo.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all text-sm active:scale-95"
        >
          <Icons.Plus className="w-4 h-4" />
          Nova Categoria
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => {
          const IconComp = ICON_MAP[cat.icon] || Icons.Tag;
          const inUse = checkInUse(cat.name);

          return (
            <div key={cat.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group transition-all hover:border-blue-200">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${cat.color} shadow-sm transition-transform group-hover:scale-110`}>
                  <IconComp className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">{cat.name}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${inUse ? 'text-amber-600' : 'text-slate-400'}`}>
                    {inUse ? 'Em Uso' : 'Disponível'}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => handleEdit(cat)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  title="Editar"
                >
                  <Icons.FileText className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteClick(cat)}
                  className={`p-2 rounded-lg transition-all ${inUse ? 'text-slate-200 cursor-not-allowed opacity-50' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                  title={inUse ? "Categoria em uso" : "Excluir"}
                >
                  <Icons.Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</h3>
              <button onClick={closeForm} className="p-1 hover:bg-slate-200 rounded-md">
                <Icons.X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Nome</label>
                <input 
                  autoFocus
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Piscina"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Ícone</label>
                <div className="grid grid-cols-5 gap-3 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                  {availableIcons.map(iconName => {
                    const IconOption = ICON_MAP[iconName];
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setSelectedIcon(iconName)}
                        className={`aspect-square rounded-xl border flex items-center justify-center transition-all ${
                          selectedIcon === iconName 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                            : 'border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-200'
                        }`}
                      >
                        <IconOption className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeForm} className="flex-1 px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
