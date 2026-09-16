import React, { useState } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  Pause,
  Link,
  Tag,
  Activity,
  Grid,
  Terminal,
  FolderOpen,
  Save,
  Plus,
  Download,
  Upload,
  HardDrive,
  HelpCircle,
  Search,
  Smartphone,
  Check,
  ChevronDown,
} from 'lucide-react';
import { ENSProject } from '../types/network';

interface TopMenuBarProps {
  currentProject: ENSProject;
  isRunningAny: boolean;
  isCableToolActive: boolean;
  showInterfaceLabels: boolean;
  packetAnimationActive: boolean;
  gridSnap: boolean;
  hasUnsavedChanges: boolean;
  onNewProject: () => void;
  onOpenProjectModal: () => void;
  onSaveProject: () => void;
  onExportProject: () => void;
  onImportProject: () => void;
  onStartAll: () => void;
  onStopAll: () => void;
  onRestartAll: () => void;
  onPauseAll: () => void;
  onToggleCableTool: () => void;
  onToggleInterfaceLabels: () => void;
  onTogglePacketAnimation: () => void;
  onToggleGridSnap: () => void;
  onOpenConsoleAll: () => void;
  onOpenImageManager: () => void;
  onOpenPWAInstall: () => void;
  onOpenHelp: () => void;
  onSelectPresetLab: (labId: string) => void;
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  currentProject,
  isRunningAny,
  isCableToolActive,
  showInterfaceLabels,
  packetAnimationActive,
  gridSnap,
  hasUnsavedChanges,
  onNewProject,
  onOpenProjectModal,
  onSaveProject,
  onExportProject,
  onImportProject,
  onStartAll,
  onStopAll,
  onRestartAll,
  onPauseAll,
  onToggleCableTool,
  onToggleInterfaceLabels,
  onTogglePacketAnimation,
  onToggleGridSnap,
  onOpenConsoleAll,
  onOpenImageManager,
  onOpenPWAInstall,
  onOpenHelp,
  onSelectPresetLab,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState(false);

  const handleSaveWithFeedback = () => {
    onSaveProject();
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const closeMenu = () => setActiveMenu(null);

  return (
    <header className="flex flex-col border-b border-slate-800 bg-[#0b1120] text-slate-200 select-none z-30" id="ensv1-top-header">
      {/* 1. Main Application Header & Dropdown Menus */}
      <div className="flex h-11 items-center justify-between px-3 border-b border-slate-800/80 bg-slate-950/80">
        <div className="flex items-center gap-3">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold text-xs">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                <path d="m4.93 4.93 2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-sm tracking-wider text-white">ENSv1</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-800 font-mono font-bold">
                  v1.0
                </span>
              </div>
              <span className="text-[9px] text-slate-400 font-medium tracking-tight">
                Explore Network Simulator Version 1
              </span>
            </div>
          </div>

          {/* Desktop Menu Bar: File | Edit | View | Control | Device | Tools | Help */}
          <nav className="hidden md:flex items-center text-xs font-medium text-slate-300">
            {/* File Menu */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
                className={`px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition ${
                  activeMenu === 'file' ? 'bg-slate-800 text-white' : ''
                }`}
              >
                File
              </button>
              {activeMenu === 'file' && (
                <div
                  onMouseLeave={closeMenu}
                  className="absolute left-0 top-full mt-1 w-56 rounded-xl border border-slate-700 bg-slate-900 py-1.5 shadow-2xl z-50 text-xs animate-in fade-in-50"
                >
                  <button
                    onClick={() => {
                      onNewProject();
                      closeMenu();
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-slate-800 text-slate-200"
                  >
                    <span>New Project</span>
                    <span className="text-[10px] text-slate-500">Ctrl+N</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenProjectModal();
                      closeMenu();
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-slate-800 text-slate-200"
                  >
                    <span>Open Project...</span>
                    <span className="text-[10px] text-slate-500">Ctrl+O</span>
                  </button>
                  <button
                    onClick={() => {
                      handleSaveWithFeedback();
                      closeMenu();
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-slate-800 text-slate-200"
                  >
                    <span>Save Project</span>
                    <span className="text-[10px] text-slate-500">Ctrl+S</span>
                  </button>
                  <div className="my-1 border-t border-slate-800" />
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Preset Labs
                  </div>
                  <button
                    onClick={() => {
                      onSelectPresetLab('lab-linux-routers');
                      closeMenu();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-sky-400 font-medium"
                  >
                    ✦ Linux Routers (Quagga)
                  </button>
                  <button
                    onClick={() => {
                      onSelectPresetLab('lab-ccna-enterprise');
                      closeMenu();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300"
                  >
                    ✦ CCNA Enterprise Core
                  </button>
                  <button
                    onClick={() => {
                      onSelectPresetLab('lab-bgp-peering');
                      closeMenu();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300"
                  >
                    ✦ BGP Dual-Homed ISP
                  </button>
                  <div className="my-1 border-t border-slate-800" />
                  <button
                    onClick={() => {
                      onExportProject();
                      closeMenu();
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-slate-800 text-slate-200"
                  >
                    <span>Export Project (.ensv1)</span>
                    <Download className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => {
                      onImportProject();
                      closeMenu();
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-slate-800 text-slate-200"
                  >
                    <span>Import Project (.ensv1)</span>
                    <Upload className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </div>
              )}
            </div>

            {/* View Menu */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
                className={`px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition ${
                  activeMenu === 'view' ? 'bg-slate-800 text-white' : ''
                }`}
              >
                View
              </button>
              {activeMenu === 'view' && (
                <div
                  onMouseLeave={closeMenu}
                  className="absolute left-0 top-full mt-1 w-52 rounded-xl border border-slate-700 bg-slate-900 py-1.5 shadow-2xl z-50 text-xs animate-in fade-in-50"
                >
                  <button
                    onClick={() => {
                      onToggleInterfaceLabels();
                      closeMenu();
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-slate-800 text-slate-200"
                  >
                    <span>Interface Labels</span>
                    {showInterfaceLabels && <Check className="h-3.5 w-3.5 text-sky-400" />}
                  </button>
                  <button
                    onClick={() => {
                      onTogglePacketAnimation();
                      closeMenu();
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-slate-800 text-slate-200"
                  >
                    <span>Packet Flow Animation</span>
                    {packetAnimationActive && <Check className="h-3.5 w-3.5 text-sky-400" />}
                  </button>
                  <button
                    onClick={() => {
                      onToggleGridSnap();
                      closeMenu();
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-slate-800 text-slate-200"
                  >
                    <span>Snap to Grid</span>
                    {gridSnap && <Check className="h-3.5 w-3.5 text-sky-400" />}
                  </button>
                </div>
              )}
            </div>

            {/* Control Menu */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'control' ? null : 'control')}
                className={`px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition ${
                  activeMenu === 'control' ? 'bg-slate-800 text-white' : ''
                }`}
              >
                Control
              </button>
              {activeMenu === 'control' && (
                <div
                  onMouseLeave={closeMenu}
                  className="absolute left-0 top-full mt-1 w-52 rounded-xl border border-slate-700 bg-slate-900 py-1.5 shadow-2xl z-50 text-xs animate-in fade-in-50"
                >
                  <button
                    onClick={() => {
                      onStartAll();
                      closeMenu();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 text-emerald-400"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Start All Devices</span>
                  </button>
                  <button
                    onClick={() => {
                      onPauseAll();
                      closeMenu();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 text-amber-400"
                  >
                    <Pause className="h-3.5 w-3.5" />
                    <span>Pause All Devices</span>
                  </button>
                  <button
                    onClick={() => {
                      onStopAll();
                      closeMenu();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 text-red-400"
                  >
                    <Square className="h-3.5 w-3.5" />
                    <span>Stop All Devices</span>
                  </button>
                  <button
                    onClick={() => {
                      onRestartAll();
                      closeMenu();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 text-sky-400"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reload / Restart Lab</span>
                  </button>
                </div>
              )}
            </div>

            {/* Devices Menu */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'devices' ? null : 'devices')}
                className={`px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition ${
                  activeMenu === 'devices' ? 'bg-slate-800 text-white' : ''
                }`}
              >
                Devices
              </button>
              {activeMenu === 'devices' && (
                <div
                  onMouseLeave={closeMenu}
                  className="absolute left-0 top-full mt-1 w-56 rounded-xl border border-slate-700 bg-slate-900 py-1.5 shadow-2xl z-50 text-xs animate-in fade-in-50"
                >
                  <button
                    onClick={() => {
                      onOpenImageManager();
                      closeMenu();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 text-amber-300"
                  >
                    <HardDrive className="h-3.5 w-3.5" />
                    <span>Device Image Manager...</span>
                  </button>
                  <div className="my-1 border-t border-slate-800" />
                  <button
                    onClick={() => {
                      onOpenConsoleAll();
                      closeMenu();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 text-slate-200"
                  >
                    <Terminal className="h-3.5 w-3.5 text-sky-400" />
                    <span>Open Consoles to All</span>
                  </button>
                </div>
              )}
            </div>

            {/* Help Menu */}
            <button
              onClick={onOpenHelp}
              className="px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition"
            >
              Help
            </button>
          </nav>
        </div>

        {/* Right side: Project Name & Install App Button */}
        <div className="flex items-center gap-2">
          {/* Active Lab Title */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="font-semibold text-slate-200">{currentProject.name}</span>
            {hasUnsavedChanges ? (
              <span className="text-[10px] text-amber-400">● Modified</span>
            ) : (
              <span className="text-[10px] text-slate-500">Saved ✓</span>
            )}
          </div>

          {/* Install App Button (Android, iOS & Desktop PWA) */}
          <button
            onClick={onOpenPWAInstall}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-md transition active:scale-95"
            title="Install ENSv1 on Android, iOS or Desktop"
            id="pwa-install-header-btn"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Install App</span>
          </button>
        </div>
      </div>

      {/* 2. Primary Engineering Action Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0e1626] border-b border-slate-800/80 overflow-x-auto text-xs no-scrollbar">
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Project operations */}
          <button
            onClick={onNewProject}
            title="New Project (Ctrl + N)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={onOpenProjectModal}
            title="Open Project (Ctrl + O)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          >
            <FolderOpen className="h-4 w-4" />
          </button>
          <button
            onClick={handleSaveWithFeedback}
            title="Save Project (Ctrl + S)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 relative"
          >
            <Save className="h-4 w-4" />
            {saveToast && (
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap animate-in fade-in">
                Saved ✓
              </span>
            )}
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Node Power Lifecycle Controls */}
          <button
            onClick={onStartAll}
            title="Start All Devices in Lab (Green Triangle)"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 font-semibold"
          >
            <Play className="h-3.5 w-3.5 fill-emerald-400" />
            <span className="hidden sm:inline">Start All</span>
          </button>
          <button
            onClick={onPauseAll}
            title="Pause All Devices"
            className="p-1.5 rounded-lg text-amber-400 hover:bg-slate-800"
          >
            <Pause className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onStopAll}
            title="Stop All Devices (Red Square)"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 font-semibold"
          >
            <Square className="h-3.5 w-3.5 fill-red-400" />
            <span className="hidden sm:inline">Stop All</span>
          </button>
          <button
            onClick={onRestartAll}
            title="Restart / Reload Lab"
            className="p-1.5 rounded-lg text-sky-400 hover:bg-slate-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Topology Tools */}
          <button
            onClick={onToggleCableTool}
            title="Add Link / Virtual Cable (C)"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition ${
              isCableToolActive
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950 font-bold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Link className="h-3.5 w-3.5" />
            <span>Cable</span>
          </button>

          <button
            onClick={onToggleInterfaceLabels}
            title="Toggle Interface Names (e0, Gi0/0)"
            className={`p-1.5 rounded-lg transition ${
              showInterfaceLabels
                ? 'bg-slate-800 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Tag className="h-4 w-4" />
          </button>

          <button
            onClick={onTogglePacketAnimation}
            title="Toggle Animated Packet Simulation Flows"
            className={`p-1.5 rounded-lg transition ${
              packetAnimationActive
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Activity className="h-4 w-4" />
          </button>

          <button
            onClick={onToggleGridSnap}
            title="Toggle Snap to Grid"
            className={`p-1.5 rounded-lg transition ${
              gridSnap
                ? 'bg-slate-800 text-purple-400 border border-purple-500/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Grid className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <button
            onClick={onOpenConsoleAll}
            title="Open Console Terminal for Running Nodes"
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <Terminal className="h-3.5 w-3.5 text-sky-400" />
            <span className="hidden md:inline">Console</span>
          </button>

          <button
            onClick={onOpenImageManager}
            title="Open Device Image Manager & Appliance Wizard"
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <HardDrive className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden md:inline">Images</span>
          </button>
        </div>

        {/* Tagline branding on right */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-500 font-medium">
          <span>Build</span>
          <span>•</span>
          <span>Connect</span>
          <span>•</span>
          <span>Configure</span>
          <span>•</span>
          <span className="text-sky-400">Explore</span>
        </div>
      </div>
    </header>
  );
};
