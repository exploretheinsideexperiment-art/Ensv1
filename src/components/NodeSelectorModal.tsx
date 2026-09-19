import React, { useState } from 'react';
import {
  X,
  Search,
  Server,
  Layers,
  Shield,
  Monitor,
  HardDrive,
  Plus,
  Boxes,
  Cpu,
  Check,
  Zap,
  Cloud,
  Network,
} from 'lucide-react';
import { DeviceTemplate, DeviceCategory } from '../types/network';

interface NodeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: DeviceTemplate[];
  onSelectNode: (template: DeviceTemplate) => void;
}

export const NodeSelectorModal: React.FC<NodeSelectorModalProps> = ({
  isOpen,
  onClose,
  templates,
  onSelectNode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DeviceCategory | 'all' | 'palo_forti'>('all');
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter templates
  const filteredTemplates = templates.filter((tpl) => {
    let matchesCategory = true;
    if (selectedCategory === 'palo_forti') {
      matchesCategory =
        tpl.category === 'firewalls' &&
        (tpl.vendor.toLowerCase().includes('palo') ||
          tpl.vendor.toLowerCase().includes('fortinet') ||
          tpl.name.toLowerCase().includes('palo') ||
          tpl.name.toLowerCase().includes('forti'));
    } else if (selectedCategory !== 'all') {
      matchesCategory = tpl.category === selectedCategory;
    }

    const matchesSearch =
      tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const handleAdd = (tpl: DeviceTemplate) => {
    onSelectNode(tpl);
    setRecentlyAddedId(tpl.id);
    setTimeout(() => setRecentlyAddedId(null), 1200);
  };

  const getDeviceIcon = (tpl: DeviceTemplate) => {
    const isPalo = tpl.vendor.toLowerCase().includes('palo') || tpl.name.toLowerCase().includes('palo');
    const isForti = tpl.vendor.toLowerCase().includes('fortinet') || tpl.name.toLowerCase().includes('forti');

    if (isPalo) {
      return (
        <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs">
          PA
        </div>
      );
    }
    if (isForti) {
      return (
        <div className="h-10 w-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold text-xs">
          FGT
        </div>
      );
    }

    if (tpl.category === 'networks' || tpl.category === 'cloud' || tpl.type === 'network' || tpl.type === 'cloud') {
      const isBridge = tpl.name.toLowerCase().includes('bridge');
      const isMgmt = tpl.name.toLowerCase().includes('mgmt') || tpl.name.toLowerCase().includes('management');
      if (isBridge) {
        return (
          <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Network className="h-5 w-5" />
          </div>
        );
      }
      if (isMgmt) {
        return (
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs">
            pnet0
          </div>
        );
      }
      return (
        <div className="h-10 w-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
          <Cloud className="h-5 w-5" />
        </div>
      );
    }

    switch (tpl.category) {
      case 'routers':
        return (
          <div className="h-10 w-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
            <Server className="h-5 w-5" />
          </div>
        );
      case 'switches':
        return (
          <div className="h-10 w-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Layers className="h-5 w-5" />
          </div>
        );
      case 'firewalls':
        return (
          <div className="h-10 w-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
            <Shield className="h-5 w-5" />
          </div>
        );
      case 'hosts':
        return (
          <div className="h-10 w-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
            <Monitor className="h-5 w-5" />
          </div>
        );
      case 'servers':
        return (
          <div className="h-10 w-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Server className="h-5 w-5" />
          </div>
        );
      default:
        return (
          <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <Boxes className="h-5 w-5" />
          </div>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={onClose}
      id="node-selector-modal"
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-700 bg-[#0d1527] shadow-2xl flex flex-col overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Select Network Node</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-normal">
                  Router • Switch • Palo Alto • FortiGate • PC
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Choose any network appliance or virtual endpoint to add to your active topology canvas.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar & Quick Categories */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, vendor, model (e.g., 'Router', 'Switch', 'Palo Alto', 'FortiGate', 'PC')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Category Filter Pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedCategory === 'all'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-950 font-bold'
                  : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
              }`}
            >
              All Nodes ({templates.length})
            </button>

            <button
              onClick={() => setSelectedCategory('routers')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedCategory === 'routers'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-950 font-bold'
                  : 'bg-slate-800/70 text-teal-300 hover:bg-slate-800'
              }`}
            >
              <Server className="h-3.5 w-3.5 text-teal-400" />
              <span>Routers</span>
            </button>

            <button
              onClick={() => setSelectedCategory('switches')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedCategory === 'switches'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-950 font-bold'
                  : 'bg-slate-800/70 text-blue-300 hover:bg-slate-800'
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-blue-400" />
              <span>Switches</span>
            </button>

            <button
              onClick={() => setSelectedCategory('palo_forti')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedCategory === 'palo_forti'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-950 font-bold'
                  : 'bg-slate-800/70 text-amber-300 hover:bg-slate-800'
              }`}
            >
              <Shield className="h-3.5 w-3.5 text-amber-400" />
              <span>Palo Alto & FortiGate</span>
            </button>

            <button
              onClick={() => setSelectedCategory('firewalls')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedCategory === 'firewalls'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950 font-bold'
                  : 'bg-slate-800/70 text-rose-300 hover:bg-slate-800'
              }`}
            >
              <Shield className="h-3.5 w-3.5 text-rose-400" />
              <span>All Firewalls</span>
            </button>

            <button
              onClick={() => setSelectedCategory('networks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedCategory === 'networks'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-950 font-bold'
                  : 'bg-slate-800/70 text-amber-300 hover:bg-slate-800'
              }`}
            >
              <Cloud className="h-3.5 w-3.5 text-amber-400" />
              <span>Networks & Cloud</span>
            </button>

            <button
              onClick={() => setSelectedCategory('hosts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedCategory === 'hosts'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-950 font-bold'
                  : 'bg-slate-800/70 text-sky-300 hover:bg-slate-800'
              }`}
            >
              <Monitor className="h-3.5 w-3.5 text-sky-400" />
              <span>PCs & Workstations</span>
            </button>
          </div>
        </div>

        {/* Nodes Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[55vh]">
          {filteredTemplates.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500">
              <Boxes className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">No nodes found matching &ldquo;{searchQuery}&rdquo;</p>
              <p className="text-xs text-slate-400 mt-1">Try searching for &apos;router&apos;, &apos;switch&apos;, &apos;palo&apos;, &apos;forti&apos;, or &apos;pc&apos;.</p>
            </div>
          ) : (
            filteredTemplates.map((tpl) => {
              const isPalo = tpl.vendor.toLowerCase().includes('palo') || tpl.name.toLowerCase().includes('palo');
              const isForti = tpl.vendor.toLowerCase().includes('fortinet') || tpl.name.toLowerCase().includes('forti');
              const isRecentlyAdded = recentlyAddedId === tpl.id;

              return (
                <div
                  key={tpl.id}
                  className={`group relative rounded-xl border p-4 transition flex flex-col justify-between select-none ${
                    isPalo
                      ? 'border-amber-500/40 bg-amber-950/20 hover:border-amber-400 hover:bg-amber-950/30'
                      : isForti
                      ? 'border-rose-500/40 bg-rose-950/20 hover:border-rose-400 hover:bg-rose-950/30'
                      : 'border-slate-800 bg-slate-900/50 hover:border-sky-500/50 hover:bg-slate-900/90'
                  }`}
                >
                  <div>
                    {/* Top Row: Icon + Title + Add Button */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {getDeviceIcon(tpl)}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-white group-hover:text-sky-200">
                              {tpl.name}
                            </h3>
                            {isPalo && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                                NGFW
                              </span>
                            )}
                            {isForti && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                                FortiOS
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            {tpl.vendor} • {tpl.model}
                          </p>
                        </div>
                      </div>

                      {/* Add Button */}
                      <button
                        onClick={() => handleAdd(tpl)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                          isRecentlyAdded
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-950'
                        }`}
                        title={`Add ${tpl.name} to canvas`}
                      >
                        {isRecentlyAdded ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Added!</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            <span>Select & Add</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                      {tpl.description}
                    </p>
                  </div>

                  {/* Hardware Specs Footprint */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <div className="flex items-center gap-3">
                      <span>{tpl.defaultRamMb} MB RAM</span>
                      <span>•</span>
                      <span>{tpl.defaultCpuCores} vCPU</span>
                      <span>•</span>
                      <span>{tpl.defaultInterfaces.length} Ports</span>
                    </div>
                    <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/50">
                      {tpl.imageFormat}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Click &ldquo;Select & Add&rdquo; to place the node directly onto the canvas.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
