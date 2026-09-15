import React, { useState } from 'react';
import { Folder, FolderOpen, Plus, Trash2, Download, Upload, X, Check, BookOpen } from 'lucide-react';
import { ENSProject } from '../types/network';
import { PRESET_LABS } from '../data/presetLabs';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProjectId: string;
  savedProjects: ENSProject[];
  onLoadProject: (project: ENSProject) => void;
  onCreateProject: (name: string, description: string) => void;
  onDeleteProject: (projectId: string) => void;
  onExportProject: () => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  currentProjectId,
  savedProjects,
  onLoadProject,
  onCreateProject,
  onDeleteProject,
  onExportProject,
  onImportFile,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'saved' | 'new'>('presets');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreateProject(newName.trim(), newDesc.trim() || 'Custom Network Laboratory');
    setNewName('');
    setNewDesc('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">ENSv1 Project & Lab Manager</h2>
              <p className="text-xs text-slate-400">Load preset topologies, switch saved labs or create new environments</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('presets')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'presets'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Preset Network Labs ({PRESET_LABS.length})
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'saved'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Folder className="h-3.5 w-3.5" />
            My Saved Topologies ({savedProjects.length})
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'new'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            New Blank Project
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* 1. Preset Labs Tab */}
          {activeTab === 'presets' && (
            <div className="grid grid-cols-1 gap-3">
              {PRESET_LABS.map((preset) => {
                const isCurrent = preset.id === currentProjectId;
                return (
                  <div
                    key={preset.id}
                    className={`flex items-start justify-between p-4 rounded-xl border transition ${
                      isCurrent
                        ? 'bg-sky-950/40 border-sky-500/50 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1.5 max-w-[75%]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{preset.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-900 text-sky-300 font-semibold">
                            Active Lab
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{preset.description}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono pt-1">
                        <span>{preset.devices.length} Devices</span>
                        <span>•</span>
                        <span>{preset.links.length} Virtual Links</span>
                        <span>•</span>
                        <span>Ver: {preset.version}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onLoadProject(preset);
                        onClose();
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        isCurrent
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isCurrent ? 'Current' : 'Load Lab'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. My Saved Projects Tab */}
          {activeTab === 'saved' && (
            <div className="space-y-3">
              {savedProjects.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No custom saved topologies found in local storage yet.
                </div>
              ) : (
                savedProjects.map((p) => {
                  const isCurrent = p.id === currentProjectId;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/60"
                    >
                      <div>
                        <h4 className="font-bold text-white text-xs">{p.name}</h4>
                        <p className="text-[11px] text-slate-400">{p.description}</p>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Last modified: {new Date(p.modifiedAt || p.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onLoadProject(p);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
                        >
                          {isCurrent ? 'Reload' : 'Load'}
                        </button>
                        <button
                          onClick={() => onDeleteProject(p.id)}
                          className="p-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30"
                          title="Delete Project"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 3. New Project Tab */}
          {activeTab === 'new' && (
            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OSPF Multi-Area Core Network"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2.5 text-slate-100 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Lab Description</label>
                <textarea
                  rows={3}
                  placeholder="Notes about topology goals, addressing schemes, or exam prep..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2.5 text-slate-100"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-lg transition"
              >
                Create Blank Workspace
              </button>
            </form>
          )}
        </div>

        {/* Footer Import / Export Operations */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-6 py-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={onExportProject}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export .ensv1</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer">
              <Upload className="h-3.5 w-3.5" />
              <span>Import .ensv1</span>
              <input
                type="file"
                accept=".ensv1,.json"
                onChange={onImportFile}
                className="hidden"
              />
            </label>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
