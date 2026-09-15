import React from 'react';
import { HelpCircle, X, ShieldCheck, Keyboard, Smartphone, Globe, ExternalLink } from 'lucide-react';

interface HelpAboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPWAInstall: () => void;
}

export const HelpAboutModal: React.FC<HelpAboutModalProps> = ({
  isOpen,
  onClose,
  onOpenPWAInstall,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">ENSv1 Documentation & About</h2>
              <p className="text-xs text-slate-400">Explore Network Simulator Version 1 • Build • Connect • Configure • Explore</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Product Identity */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base">ENSv1</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800 font-mono">
                Version 1.0.0
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              <strong>Full Form:</strong> Explore Network Simulator Version 1. A professional browser-based networking laboratory inspired by modern network emulation workflows.
            </p>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Keyboard className="h-4 w-4 text-sky-400" />
              Keyboard Shortcuts & Controls
            </h3>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div className="flex justify-between p-1.5 rounded bg-slate-900">
                <span className="text-slate-400">Add Virtual Cable:</span>
                <kbd className="font-mono bg-slate-800 px-1.5 rounded text-sky-300">C</kbd>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-slate-900">
                <span className="text-slate-400">Open Terminal:</span>
                <span className="text-sky-300">Double Click Node</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-slate-900">
                <span className="text-slate-400">Node Actions:</span>
                <span className="text-sky-300">Right Click Node</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-slate-900">
                <span className="text-slate-400">Pan Canvas:</span>
                <span className="text-sky-300">Drag Background</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-slate-900">
                <span className="text-slate-400">Zoom Canvas:</span>
                <span className="text-sky-300">Mouse Wheel</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-slate-900">
                <span className="text-slate-400">Save Topology:</span>
                <kbd className="font-mono bg-slate-800 px-1.5 rounded text-sky-300">Ctrl + S</kbd>
              </div>
            </div>
          </div>

          {/* Mobile & PWA Options */}
          <div className="rounded-xl border border-sky-800/40 bg-sky-950/30 p-4 space-y-2">
            <h3 className="font-bold text-sky-300 flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Mobile App Options (Android & Apple iOS)
            </h3>
            <p className="text-slate-300 leading-relaxed">
              ENSv1 supports installation as a Progressive Web Application (PWA) on <strong>Android tablets and phones</strong>, <strong>Apple iPad & iPhone</strong> (via Safari Share → "Add to Home Screen"), and <strong>Windows/Mac Desktops</strong>.
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenPWAInstall();
              }}
              className="mt-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition"
            >
              Open Mobile App Installation Guide →
            </button>
          </div>

          {/* Legal and Compliance */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-1.5 text-[11px] text-slate-400">
            <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Legal & Security Compliance
            </h4>
            <p>
              ENSv1 provides the laboratory environment. Users are responsible for obtaining and using device images according to the applicable vendor licenses. ENSv1 does not download or redistribute proprietary vendor firmware.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-800 bg-slate-950 px-6 py-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 font-semibold text-slate-200 text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
