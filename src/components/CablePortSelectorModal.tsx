import React, { useState } from 'react';
import { NetworkDevice, CableType } from '../types/network';
import { Link as LinkIcon, X, Check, ArrowRight } from 'lucide-react';

interface CablePortSelectorModalProps {
  isOpen: boolean;
  sourceDevice: NetworkDevice;
  targetDevice: NetworkDevice;
  onClose: () => void;
  onConfirm: (
    sourceInterfaceId: string,
    targetInterfaceId: string,
    cableType: CableType
  ) => void;
}

export const CablePortSelectorModal: React.FC<CablePortSelectorModalProps> = ({
  isOpen,
  sourceDevice,
  targetDevice,
  onClose,
  onConfirm,
}) => {
  // Filter available (or prefer free) interfaces
  const [selectedSourceIfId, setSelectedSourceIfId] = useState<string>(() => {
    const free = sourceDevice.config.interfaces.find((i) => !i.connectedTo);
    return free ? free.id : sourceDevice.config.interfaces[0]?.id || '';
  });

  const [selectedTargetIfId, setSelectedTargetIfId] = useState<string>(() => {
    const free = targetDevice.config.interfaces.find((i) => !i.connectedTo);
    return free ? free.id : targetDevice.config.interfaces[0]?.id || '';
  });

  const [cableType, setCableType] = useState<CableType>('gigabit');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedSourceIfId || !selectedTargetIfId) return;
    onConfirm(selectedSourceIfId, selectedTargetIfId, cableType);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <LinkIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Connect Virtual Cable</h2>
              <p className="text-[11px] text-slate-400">Select port interfaces for each device endpoint</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Node representation preview */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Source Device</span>
              <p className="font-bold text-sky-400 text-sm">{sourceDevice.name}</p>
              <p className="text-[10px] text-slate-400">{sourceDevice.model}</p>
            </div>

            <div className="flex flex-col items-center px-4 text-slate-500">
              <ArrowRight className="h-5 w-5 text-amber-400 animate-pulse" />
              <span className="text-[9px] uppercase font-mono mt-1 font-bold text-amber-300">{cableType}</span>
            </div>

            <div className="space-y-1 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500">Destination Device</span>
              <p className="font-bold text-emerald-400 text-sm">{targetDevice.name}</p>
              <p className="text-[10px] text-slate-400">{targetDevice.model}</p>
            </div>
          </div>

          {/* Port Pickers */}
          <div className="grid grid-cols-2 gap-4">
            {/* Source Interfaces */}
            <div className="space-y-2">
              <label className="block text-slate-300 font-semibold">{sourceDevice.name} Interface:</label>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {sourceDevice.config.interfaces.map((iface) => {
                  const isSelected = selectedSourceIfId === iface.id;
                  const isOccupied = !!iface.connectedTo;

                  return (
                    <button
                      key={iface.id}
                      type="button"
                      onClick={() => setSelectedSourceIfId(iface.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition font-mono ${
                        isSelected
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-bold text-xs">{iface.name}</span>
                      <span className="text-[10px] text-slate-500">
                        {isOccupied ? '(in use)' : '(free)'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Interfaces */}
            <div className="space-y-2">
              <label className="block text-slate-300 font-semibold">{targetDevice.name} Interface:</label>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {targetDevice.config.interfaces.map((iface) => {
                  const isSelected = selectedTargetIfId === iface.id;
                  const isOccupied = !!iface.connectedTo;

                  return (
                    <button
                      key={iface.id}
                      type="button"
                      onClick={() => setSelectedTargetIfId(iface.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition font-mono ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-bold text-xs">{iface.name}</span>
                      <span className="text-[10px] text-slate-500">
                        {isOccupied ? '(in use)' : '(free)'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cable Medium Selector */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Cable Medium Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'gigabit', label: 'Gigabit 1G' },
                { id: 'fiber', label: 'Fiber 10G' },
                { id: 'serial', label: 'Serial V.35' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setCableType(m.id as CableType)}
                  className={`p-2 rounded-lg border text-center font-medium capitalize transition ${
                    cableType === m.id
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-800 bg-slate-950 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-lg transition"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Establish Connection</span>
          </button>
        </div>
      </div>
    </div>
  );
};
