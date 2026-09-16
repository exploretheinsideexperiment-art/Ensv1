import React from 'react';
import { Play, Square, RotateCcw, Terminal, Link, Copy, Trash2, Boxes } from 'lucide-react';
import { NetworkDevice } from '../types/network';

interface CanvasContextMenuProps {
  x: number;
  y: number;
  device?: NetworkDevice | null;
  onClose: () => void;
  onStart?: (deviceId: string) => void;
  onStop?: (deviceId: string) => void;
  onRestart?: (deviceId: string) => void;
  onOpenConsole?: (device: NetworkDevice) => void;
  onStartCable?: (device: NetworkDevice) => void;
  onDuplicate?: (deviceId: string) => void;
  onDelete?: (deviceId: string) => void;
  onOpenNodeSelector?: () => void;
}

export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  x,
  y,
  device,
  onClose,
  onStart,
  onStop,
  onRestart,
  onOpenConsole,
  onStartCable,
  onDuplicate,
  onDelete,
  onOpenNodeSelector,
}) => {
  // 1. Device Context Menu (right clicked on a device)
  if (device) {
    return (
      <div
        style={{ left: `${x}px`, top: `${y}px` }}
        onClick={(e) => e.stopPropagation()}
        className="fixed z-50 w-52 rounded-xl border border-slate-700 bg-slate-900 py-1.5 shadow-2xl text-xs text-slate-200 animate-in fade-in-50 select-none"
        id="canvas-context-menu"
      >
        <div className="px-3 py-1 font-bold text-white border-b border-slate-800 flex items-center justify-between">
          <span>{device.name}</span>
          <span className="text-[10px] text-slate-400 capitalize">{device.status}</span>
        </div>

        <div className="py-1">
          {device.status !== 'running' ? (
            <button
              onClick={() => {
                onStart?.(device.id);
                onClose();
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 text-emerald-400 font-semibold"
            >
              <Play className="h-3.5 w-3.5 fill-emerald-400" />
              <span>Start Node</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onStop?.(device.id);
                onClose();
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 text-red-400 font-semibold"
            >
              <Square className="h-3.5 w-3.5 fill-red-400" />
              <span>Stop Node</span>
            </button>
          )}

          <button
            onClick={() => {
              onRestart?.(device.id);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 text-sky-400"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restart Node</span>
          </button>

          <button
            onClick={() => {
              onOpenConsole?.(device);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 text-slate-200 font-medium"
          >
            <Terminal className="h-3.5 w-3.5 text-sky-400" />
            <span>Console Terminal</span>
          </button>

          <button
            onClick={() => {
              onStartCable?.(device);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 text-amber-300"
          >
            <Link className="h-3.5 w-3.5 text-amber-400" />
            <span>Connect Cable</span>
          </button>

          <div className="my-1 border-t border-slate-800" />

          <button
            onClick={() => {
              onDuplicate?.(device.id);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 text-slate-300"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Duplicate Node</span>
          </button>

          <button
            onClick={() => {
              onDelete?.(device.id);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-red-600/20 text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Node</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Empty Canvas Context Menu (right clicked on empty space)
  return (
    <div
      style={{ left: `${x}px`, top: `${y}px` }}
      onClick={(e) => e.stopPropagation()}
      className="fixed z-50 w-52 rounded-xl border border-slate-700 bg-slate-900 py-1.5 shadow-2xl text-xs text-slate-200 animate-in fade-in-50 select-none"
      id="canvas-context-menu"
    >
      <div className="px-3 py-1 font-bold text-white border-b border-slate-800 flex items-center justify-between">
        <span className="text-slate-200">Topology Canvas</span>
        <span className="text-[10px] text-slate-400">Actions</span>
      </div>

      <div className="py-1">
        <button
          onClick={() => {
            onOpenNodeSelector?.();
            onClose();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-sky-600/20 text-sky-300 font-semibold"
        >
          <Boxes className="h-4 w-4 text-sky-400" />
          <span>Select Node...</span>
        </button>
      </div>
    </div>
  );
};

