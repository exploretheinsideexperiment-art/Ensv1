import React, { useState } from 'react';
import {
  Search,
  Server,
  Layers,
  Shield,
  Monitor,
  HardDrive,
  Plus,
  Cpu,
  Boxes,
  ChevronRight,
  Filter,
  Cloud,
  Network,
} from 'lucide-react';
import { DeviceTemplate, DeviceCategory } from '../types/network';

interface DeviceLibraryPanelProps {
  templates: DeviceTemplate[];
  onAddDevice: (template: DeviceTemplate) => void;
  onOpenImageManager: () => void;
  onOpenNodeSelector?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const DeviceLibraryPanel: React.FC<DeviceLibraryPanelProps> = ({
  templates,
  onAddDevice,
  onOpenImageManager,
  onOpenNodeSelector,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DeviceCategory | 'all'>('all');

  const categories: { id: DeviceCategory | 'all'; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All', icon: <Boxes className="h-3.5 w-3.5" /> },
    { id: 'routers', label: 'Routers', icon: <Server className="h-3.5 w-3.5 text-emerald-400" /> },
    { id: 'switches', label: 'Switches', icon: <Layers className="h-3.5 w-3.5 text-sky-400" /> },
    { id: 'firewalls', label: 'Firewalls', icon: <Shield className="h-3.5 w-3.5 text-rose-400" /> },
    { id: 'sdwan', label: 'SD-WAN', icon: <Network className="h-3.5 w-3.5 text-orange-400" /> },
    { id: 'networks', label: 'Network & Cloud', icon: <Cloud className="h-3.5 w-3.5 text-amber-400" /> },
    { id: 'hosts', label: 'PCs (Win/Linux)', icon: <Monitor className="h-3.5 w-3.5 text-cyan-400" /> },
    { id: 'servers', label: 'Servers', icon: <Server className="h-3.5 w-3.5 text-purple-400" /> },
  ];

  const filteredTemplates = templates.filter((tpl) => {
    const matchesCategory = selectedCategory === 'all' || tpl.category === selectedCategory;
    const matchesSearch =
      tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.model.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDragStart = (e: React.DragEvent, tpl: DeviceTemplate) => {
    e.dataTransfer.setData('application/ensv1-template-id', tpl.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  if (isCollapsed) {
    return (
      <aside className="hidden md:flex w-12 border-r border-slate-800 bg-[#090e17] flex-col items-center py-3 select-none z-20">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition mb-4"
          title="Expand Device Library"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <div className="flex flex-col gap-3 text-slate-500">
          <span title="Routers"><Server className="h-5 w-5" /></span>
          <span title="Switches"><Layers className="h-5 w-5" /></span>
          <span title="Firewalls"><Shield className="h-5 w-5" /></span>
          <span title="Hosts"><Monitor className="h-5 w-5" /></span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-72 max-w-[85vw] border-r border-slate-800 bg-[#0b111e] flex flex-col h-full select-none z-30 text-slate-200 absolute md:relative inset-y-0 left-0 shadow-2xl md:shadow-none">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Boxes className="h-4 w-4 text-sky-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">Device Library</h2>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
          title="Collapse Panel"
        >
          ◀
        </button>
      </div>

      {/* Search Input & Select Node Dialog Button */}
      <div className="p-2.5 border-b border-slate-800/80 space-y-2">
        {onOpenNodeSelector && (
          <button
            onClick={onOpenNodeSelector}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-950 transition active:scale-95"
            title="Open Select Node Dialog"
          >
            <Boxes className="h-3.5 w-3.5" />
            <span>Select Node</span>
          </button>
        )}

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search appliances, firewalls, PCs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg bg-slate-950 border border-slate-800 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="p-2 border-b border-slate-800/80 overflow-x-auto flex gap-1.5 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition ${
              selectedCategory === cat.id
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Device List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredTemplates.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 space-y-2">
            <p>No appliances found matching query.</p>
            <button
              onClick={onOpenImageManager}
              className="text-sky-400 underline hover:text-sky-300 text-[11px]"
            >
              Add custom image in Image Manager
            </button>
          </div>
        ) : (
          filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              draggable
              onDragStart={(e) => handleDragStart(e, tpl)}
              className="group relative rounded-xl border border-slate-800/90 bg-slate-900/40 p-2.5 hover:border-sky-500/50 hover:bg-slate-900/80 transition cursor-grab active:cursor-grabbing shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800/80 text-slate-300 group-hover:text-sky-400 border border-slate-700/50">
                    {tpl.category === 'routers' && <Server className="h-4 w-4 text-emerald-400" />}
                    {tpl.category === 'switches' && <Layers className="h-4 w-4 text-sky-400" />}
                    {tpl.category === 'firewalls' && <Shield className="h-4 w-4 text-rose-400" />}
                    {tpl.category === 'sdwan' && <Network className="h-4 w-4 text-orange-400" />}
                    {tpl.category === 'hosts' && <Monitor className="h-4 w-4 text-amber-400" />}
                    {tpl.category === 'servers' && <Server className="h-4 w-4 text-purple-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-xs font-bold text-slate-100 group-hover:text-white">
                        {tpl.name}
                      </h3>
                      {tpl.vendor.toLowerCase().includes('palo') && (
                        <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          PA
                        </span>
                      )}
                      {tpl.vendor.toLowerCase().includes('fortinet') && (
                        <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          FortiOS
                        </span>
                      )}
                      {tpl.name.toLowerCase().includes('windows') && (
                        <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">
                          Win11
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">{tpl.vendor}</p>
                  </div>
                </div>

                <button
                  onClick={() => onAddDevice(tpl)}
                  title={`Add ${tpl.name} to Topology`}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-sky-500 hover:text-white transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Hardware Spec Tags */}
              <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800/50 font-mono">
                <span>{tpl.defaultRamMb} MB</span>
                <span>•</span>
                <span>{tpl.defaultCpuCores} vCPU</span>
                <span>•</span>
                <span>{tpl.defaultInterfaces.length} Ports</span>
                <span className="ml-auto uppercase text-[9px] px-1 rounded bg-slate-800 text-slate-300">
                  {tpl.imageFormat}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Appliance Import Bar */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950/60">
        <button
          onClick={onOpenImageManager}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 py-2 px-3 text-xs font-semibold text-slate-200 transition"
        >
          <HardDrive className="h-3.5 w-3.5 text-amber-400" />
          <span>Image Manager Wizard</span>
        </button>
      </div>
    </aside>
  );
};
