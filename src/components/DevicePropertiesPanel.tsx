import React, { useState } from 'react';
import {
  Server,
  Play,
  Square,
  RotateCcw,
  Terminal,
  Trash2,
  Copy,
  Plus,
  Network,
  Cpu,
  HardDrive,
  Sliders,
  Check,
  X,
  Link,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  NetworkDevice,
  NetworkLink,
  NetworkInterface,
  ENSProject,
} from '../types/network';

interface DevicePropertiesPanelProps {
  selectedDevice: NetworkDevice | null;
  selectedLink: NetworkLink | null;
  project: ENSProject;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onUpdateDevice: (updated: NetworkDevice) => void;
  onStartDevice: (deviceId: string) => void;
  onStopDevice: (deviceId: string) => void;
  onRestartDevice: (deviceId: string) => void;
  onDeleteDevice: (deviceId: string) => void;
  onDuplicateDevice: (deviceId: string) => void;
  onOpenConsole: (device: NetworkDevice) => void;
  onUpdateLink: (updated: NetworkLink) => void;
  onDeleteLink: (linkId: string) => void;
}

export const DevicePropertiesPanel: React.FC<DevicePropertiesPanelProps> = ({
  selectedDevice,
  selectedLink,
  project,
  isCollapsed,
  onToggleCollapse,
  onUpdateDevice,
  onStartDevice,
  onStopDevice,
  onRestartDevice,
  onDeleteDevice,
  onDuplicateDevice,
  onOpenConsole,
  onUpdateLink,
  onDeleteLink,
}) => {
  const [activeTab, setActiveTab] = useState<'interfaces' | 'hardware' | 'routing'>('interfaces');

  if (isCollapsed) {
    return (
      <aside className="hidden md:flex w-12 border-l border-slate-800 bg-[#090e17] flex-col items-center py-3 select-none z-20">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition mb-4"
          title="Expand Properties Panel"
        >
          <Sliders className="h-4 w-4" />
        </button>
      </aside>
    );
  }

  // LINK SELECTED VIEW
  if (selectedLink) {
    const srcDevice = project.devices.find((d) => d.id === selectedLink.sourceDeviceId);
    const tgtDevice = project.devices.find((d) => d.id === selectedLink.targetDeviceId);

    return (
      <aside className="w-80 max-w-[90vw] border-l border-slate-800 bg-[#0b111e] flex flex-col h-full select-none z-30 text-slate-200 absolute md:relative inset-y-0 right-0 shadow-2xl md:shadow-none" id="ensv1-link-properties">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link className="h-4 w-4 text-amber-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Cable Properties</h2>
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
          >
            ▶
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Link Overview */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span>Link ID:</span>
              <span className="font-mono text-[11px] text-slate-300">{selectedLink.id}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Status:</span>
              <span className={`font-semibold capitalize ${selectedLink.status === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                {selectedLink.status}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Type:</span>
              <span className="font-mono text-sky-400 uppercase">{selectedLink.type}</span>
            </div>
          </div>

          {/* Endpoints */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-3">
            <p className="font-semibold text-slate-200">Connected Interfaces</p>
            <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
              <span className="text-[11px] text-slate-500">Source Node:</span>
              <div className="flex justify-between font-mono text-slate-200 font-bold">
                <span>{srcDevice?.name || 'Unknown'}</span>
                <span className="text-sky-400">{selectedLink.sourceInterfaceName}</span>
              </div>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
              <span className="text-[11px] text-slate-500">Target Node:</span>
              <div className="flex justify-between font-mono text-slate-200 font-bold">
                <span>{tgtDevice?.name || 'Unknown'}</span>
                <span className="text-sky-400">{selectedLink.targetInterfaceName}</span>
              </div>
            </div>
          </div>

          {/* Cable Type Changer */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Cable Medium</label>
            <select
              value={selectedLink.type}
              onChange={(e) => onUpdateLink({ ...selectedLink, type: e.target.value as any })}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-slate-200"
            >
              <option value="gigabit">Gigabit Ethernet (1 Gbps Copper)</option>
              <option value="fiber">Fiber Optic (10 Gbps Single-Mode)</option>
              <option value="serial">Serial WAN Cable (V.35 / RS-232)</option>
              <option value="management">Management Out-Of-Band</option>
            </select>
          </div>

          {/* Link Power Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => onUpdateLink({ ...selectedLink, status: selectedLink.status === 'up' ? 'down' : 'up' })}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition ${
                selectedLink.status === 'up'
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30'
                  : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30'
              }`}
            >
              {selectedLink.status === 'up' ? 'Disconnect Cable' : 'Connect Cable'}
            </button>
            <button
              onClick={() => onDeleteLink(selectedLink.id)}
              className="py-2 px-3 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30"
              title="Delete Cable Link"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // NO DEVICE SELECTED (PROJECT SUMMARY)
  if (!selectedDevice) {
    const totalDevices = project.devices.length;
    const runningCount = project.devices.filter((d) => d.status === 'running').length;
    const totalRam = project.devices.reduce((acc, d) => acc + d.ramMb, 0);

    return (
      <aside className="w-80 max-w-[90vw] border-l border-slate-800 bg-[#0b111e] flex flex-col h-full select-none z-30 text-slate-200 absolute md:relative inset-y-0 right-0 shadow-2xl md:shadow-none">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-sky-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Topology Summary</h2>
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
          >
            ▶
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-3">
            <h3 className="font-bold text-white text-sm">{project.name}</h3>
            <p className="text-slate-400 text-[11px] leading-relaxed">{project.description}</p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Total Devices</span>
              <p className="text-lg font-bold text-white">{totalDevices}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Running Nodes</span>
              <p className="text-lg font-bold text-emerald-400">
                {runningCount} / {totalDevices}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Virtual Cables</span>
              <p className="text-lg font-bold text-sky-400">{project.links.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Allocated RAM</span>
              <p className="text-lg font-bold text-amber-400">{(totalRam / 1024).toFixed(1)} GB</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-800/40 text-[11px] text-sky-300">
            💡 <strong>Tip:</strong> Click any router, switch or host on the canvas to inspect interfaces, configure IP addresses, or launch interactive CLI terminals.
          </div>
        </div>
      </aside>
    );
  }

  // DEVICE SELECTED VIEW
  const handleInterfaceChange = (ifaceId: string, updates: Partial<NetworkInterface>) => {
    const updatedInterfaces = (selectedDevice.config?.interfaces || []).map((i) =>
      i.id === ifaceId ? { ...i, ...updates } : i
    );
    onUpdateDevice({
      ...selectedDevice,
      config: {
        ...selectedDevice.config,
        interfaces: updatedInterfaces,
      },
    });
  };

  const handleAddNewInterface = () => {
    const count = (selectedDevice.config?.interfaces || []).length;
    const prefix = selectedDevice.type === 'router' ? 'Gi0/' : selectedDevice.type === 'switch' ? 'port' : 'eth';
    const newIface: NetworkInterface = {
      id: `if-${Date.now()}`,
      name: `${prefix}${count}`,
      status: 'down',
      macAddress: `00:50:79:66:68:${(count + 1).toString(16).padStart(2, '0')}`,
      mtu: 1500,
      duplex: 'auto',
      speed: 'auto',
    };
    onUpdateDevice({
      ...selectedDevice,
      config: {
        ...selectedDevice.config,
        interfaces: [...(selectedDevice.config?.interfaces || []), newIface],
      },
    });
  };

  return (
    <aside className="w-80 max-w-[90vw] border-l border-slate-800 bg-[#0b111e] flex flex-col h-full select-none z-30 text-slate-200 absolute md:relative inset-y-0 right-0 shadow-2xl md:shadow-none" id="ensv1-device-properties">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-sky-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">Device Config</h2>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
        >
          ▶
        </button>
      </div>

      {/* Device Info & Power Toolbar */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-950/60 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-white">{selectedDevice.name}</h3>
            <p className="text-[10px] text-slate-400 font-mono">
              {selectedDevice.vendor} • {selectedDevice.model}
            </p>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
              selectedDevice.status === 'running'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-red-950 text-red-300 border border-red-800'
            }`}
          >
            ● {selectedDevice.status}
          </span>
        </div>

        {/* Node Power Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onStartDevice(selectedDevice.id)}
            disabled={selectedDevice.status === 'running'}
            title="Power On Device"
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 font-semibold text-xs disabled:opacity-40"
          >
            <Play className="h-3 w-3 fill-emerald-400" />
            <span>Start</span>
          </button>
          <button
            onClick={() => onStopDevice(selectedDevice.id)}
            disabled={selectedDevice.status === 'stopped'}
            title="Power Off Device"
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 font-semibold text-xs disabled:opacity-40"
          >
            <Square className="h-3 w-3 fill-red-400" />
            <span>Stop</span>
          </button>
          <button
            onClick={() => onRestartDevice(selectedDevice.id)}
            title="Reboot Node"
            className="p-1.5 rounded-lg text-sky-400 hover:bg-slate-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onOpenConsole(selectedDevice)}
            title="Launch Terminal CLI"
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition"
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Console</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/50 p-1 gap-1 text-xs">
        <button
          onClick={() => setActiveTab('interfaces')}
          className={`flex-1 py-1.5 rounded font-medium transition ${
            activeTab === 'interfaces' ? 'bg-slate-800 text-sky-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Interfaces ({(selectedDevice.config?.interfaces || []).length})
        </button>
        <button
          onClick={() => setActiveTab('hardware')}
          className={`flex-1 py-1.5 rounded font-medium transition ${
            activeTab === 'hardware' ? 'bg-slate-800 text-sky-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Hardware
        </button>
        <button
          onClick={() => setActiveTab('routing')}
          className={`flex-1 py-1.5 rounded font-medium transition ${
            activeTab === 'routing' ? 'bg-slate-800 text-sky-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Routing
        </button>
      </div>

      {/* Tab Panels */}
      <div className="p-3 overflow-y-auto flex-1 text-xs space-y-3">
        {/* INTERFACES TAB */}
        {activeTab === 'interfaces' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">Port Adapters</span>
              <button
                onClick={handleAddNewInterface}
                className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium"
              >
                <Plus className="h-3 w-3" /> Add Port
              </button>
            </div>

            <div className="space-y-2">
              {(selectedDevice.config?.interfaces || []).map((iface) => {
                const isConnected = !!iface.connectedTo;
                return (
                  <div
                    key={iface.id}
                    className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            iface.status === 'up' && selectedDevice.status === 'running'
                              ? 'bg-emerald-400'
                              : 'bg-red-500'
                          }`}
                        />
                        <span className="font-bold text-white font-mono">{iface.name}</span>
                      </div>
                      <button
                        onClick={() =>
                          handleInterfaceChange(iface.id, {
                            status: iface.status === 'up' ? 'down' : 'up',
                          })
                        }
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          iface.status === 'up'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-900 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {iface.status}
                      </button>
                    </div>

                    {/* IP and Subnet Config */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <label className="text-slate-500 text-[10px] block">IP Address</label>
                        <input
                          type="text"
                          value={iface.ipAddress || ''}
                          placeholder="e.g. 192.168.1.1"
                          onChange={(e) => handleInterfaceChange(iface.id, { ipAddress: e.target.value })}
                          className="w-full rounded bg-slate-900 border border-slate-800 px-2 py-1 text-slate-200 font-mono text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 text-[10px] block">Subnet Mask</label>
                        <input
                          type="text"
                          value={iface.subnetMask || ''}
                          placeholder="255.255.255.0"
                          onChange={(e) => handleInterfaceChange(iface.id, { subnetMask: e.target.value })}
                          className="w-full rounded bg-slate-900 border border-slate-800 px-2 py-1 text-slate-200 font-mono text-[11px]"
                        />
                      </div>
                    </div>

                    {/* MAC and Connection Status */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-900">
                      <span>MAC: {iface.macAddress}</span>
                      <span className={isConnected ? 'text-sky-400' : 'text-slate-600'}>
                        {isConnected ? 'Linked' : 'Unconnected'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* HARDWARE TAB */}
        {activeTab === 'hardware' && (
          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Node Name</label>
              <input
                type="text"
                value={selectedDevice.name}
                onChange={(e) => onUpdateDevice({ ...selectedDevice, name: e.target.value })}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-slate-200 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">RAM (MB)</label>
                <input
                  type="number"
                  value={selectedDevice.ramMb}
                  onChange={(e) => onUpdateDevice({ ...selectedDevice, ramMb: Number(e.target.value) })}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">vCPU Cores</label>
                <input
                  type="number"
                  value={selectedDevice.cpuCores}
                  onChange={(e) => onUpdateDevice({ ...selectedDevice, cpuCores: Number(e.target.value) })}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-slate-200 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">QEMU Virtual Disk Image</label>
              <p className="rounded-lg bg-slate-950 border border-slate-800 p-2 text-slate-300 font-mono text-[11px] truncate">
                {selectedDevice.image}
              </p>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Console Protocol</label>
              <select
                value={selectedDevice.consoleType}
                onChange={(e) => onUpdateDevice({ ...selectedDevice, consoleType: e.target.value as any })}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-slate-200 uppercase font-mono"
              >
                <option value="web">Web Browser Terminal</option>
                <option value="telnet">Telnet (Port 5000+)</option>
                <option value="vnc">VNC Graphical Console</option>
                <option value="serial">Serial ttyS0</option>
              </select>
            </div>
          </div>
        )}

        {/* ROUTING TAB */}
        {activeTab === 'routing' && (
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
              <span className="font-semibold text-slate-200 block">Static Routing Entries</span>
              {selectedDevice.config.routingProtocols.staticRoutes.length === 0 ? (
                <p className="text-slate-500 text-[11px]">No static routes configured.</p>
              ) : (
                selectedDevice.config.routingProtocols.staticRoutes.map((r, idx) => (
                  <div key={idx} className="p-1.5 rounded bg-slate-900 font-mono text-[11px] text-sky-300">
                    {r.network}/{r.mask} via {r.nextHop}
                  </div>
                ))
              )}
            </div>

            {selectedDevice.config.routingProtocols.ospf && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1 font-mono text-[11px]">
                <span className="font-semibold text-emerald-400 block font-sans">OSPF Area Configuration</span>
                <p className="text-slate-300">Process: {selectedDevice.config.routingProtocols.ospf.processId}</p>
                <p className="text-slate-300">Router-ID: {selectedDevice.config.routingProtocols.ospf.routerId}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Danger Zone (Duplicate / Delete) */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/70 flex gap-2">
        <button
          onClick={() => onDuplicateDevice(selectedDevice.id)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
        >
          <Copy className="h-3.5 w-3.5" />
          <span>Duplicate</span>
        </button>
        <button
          onClick={() => onDeleteDevice(selectedDevice.id)}
          className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-medium transition"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete</span>
        </button>
      </div>
    </aside>
  );
};
