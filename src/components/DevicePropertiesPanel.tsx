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
  Cloud,
  Globe,
  Radio,
} from 'lucide-react';
import {
  NetworkDevice,
  NetworkLink,
  NetworkInterface,
  NetworkObjectConfig,
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
  const [activeTab, setActiveTab] = useState<'interfaces' | 'hardware' | 'routing' | 'network'>('interfaces');

  // Auto-switch to 'network' tab if a Network or Cloud device is selected
  React.useEffect(() => {
    if (selectedDevice && (selectedDevice.type === 'network' || selectedDevice.type === 'cloud')) {
      setActiveTab('network');
    }
  }, [selectedDevice?.id, selectedDevice?.type]);

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
        {(selectedDevice.type === 'network' || selectedDevice.type === 'cloud') && (
          <button
            onClick={() => setActiveTab('network')}
            className={`flex-1 py-1.5 rounded font-medium transition flex items-center justify-center gap-1 ${
              activeTab === 'network' ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cloud className="h-3.5 w-3.5" />
            <span>Network Options</span>
          </button>
        )}
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
        {/* NETWORK & CLOUD CONFIGURATION TAB */}
        {activeTab === 'network' && (() => {
          const netConfig: NetworkObjectConfig = selectedDevice.config?.networkConfig || {
            networkType: selectedDevice.name.toLowerCase().includes('bridge')
              ? 'bridge'
              : selectedDevice.name.toLowerCase().includes('mgmt')
              ? 'management'
              : 'cloud',
            cloudSubtype: 'nat',
            bridgeName: 'br0',
            adapterName: selectedDevice.name.toLowerCase().includes('mgmt') ? 'pnet0 (Management)' : 'pnet1 (NAT Cloud)',
            gatewayIp: '192.168.1.1',
            subnetMask: '255.255.255.0',
            dhcpEnabled: true,
            dhcpRange: '192.168.1.100 - 192.168.1.200',
            internetAccess: true,
            bandwidthMbps: 1000,
          };

          const updateNetConfig = (patch: Partial<NetworkObjectConfig>) => {
            onUpdateDevice({
              ...selectedDevice,
              config: {
                ...selectedDevice.config,
                networkConfig: {
                  ...netConfig,
                  ...patch,
                },
              },
            });
          };

          return (
            <div className="space-y-3.5">
              {/* Network Object Type Selector */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 space-y-2">
                <label className="block text-slate-300 font-bold text-xs uppercase tracking-wider">
                  Network Node Type
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateNetConfig({ networkType: 'bridge' })}
                    className={`py-2 px-1 rounded-lg text-center font-medium transition border text-[11px] ${
                      netConfig.networkType === 'bridge'
                        ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Bridge
                  </button>
                  <button
                    type="button"
                    onClick={() => updateNetConfig({ networkType: 'management' })}
                    className={`py-2 px-1 rounded-lg text-center font-medium transition border text-[11px] ${
                      netConfig.networkType === 'management'
                        ? 'bg-amber-600/30 text-amber-300 border-amber-500/50 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Management (Cloud)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateNetConfig({ networkType: 'cloud' })}
                    className={`py-2 px-1 rounded-lg text-center font-medium transition border text-[11px] ${
                      netConfig.networkType === 'cloud'
                        ? 'bg-sky-600/30 text-sky-300 border-sky-500/50 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Cloud (WAN)
                  </button>
                </div>
              </div>

              {/* SPECIFIC CONFIG: BRIDGE */}
              {netConfig.networkType === 'bridge' && (
                <div className="rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-3 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold">
                    <Network className="h-4 w-4" />
                    <span>Layer-2 Software Bridge</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Transparent Layer-2 software bridge forwarding Ethernet frames without routing. Connects multiple device segments into a single broadcast domain.
                  </p>
                  <div>
                    <label className="block text-slate-400 mb-1">Bridge Name</label>
                    <input
                      type="text"
                      value={netConfig.bridgeName || 'br0'}
                      onChange={(e) => updateNetConfig({ bridgeName: e.target.value })}
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-slate-200 font-mono text-xs"
                      placeholder="br0"
                    />
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-300 block">Spanning Tree Protocol (STP)</span>
                      <span className="text-[10px] text-slate-500">Prevents Layer-2 loops between connected switches</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                      ACTIVE
                    </span>
                  </div>
                </div>
              )}

              {/* SPECIFIC CONFIG: MANAGEMENT CLOUD */}
              {netConfig.networkType === 'management' && (
                <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-3 space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <Radio className="h-4 w-4" />
                    <span>Management Network (Cloud0 / pnet0)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Direct Out-of-Band (OOB) management connection. Connects firewall management ports (Palo Alto MGT, FortiGate mgmt1) and router console/SSH directly to your host browser.
                  </p>
                  <div>
                    <label className="block text-slate-400 mb-1">Host Management Interface</label>
                    <select
                      value={netConfig.adapterName || 'pnet0 (Management)'}
                      onChange={(e) => updateNetConfig({ adapterName: e.target.value })}
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-slate-200 font-mono text-xs"
                    >
                      <option value="pnet0 (Management)">pnet0 (Primary Host Management Cloud)</option>
                      <option value="pnet9 (Out-of-band)">pnet9 (Isolated Out-of-band Management)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1">Gateway IP</label>
                      <input
                        type="text"
                        value={netConfig.gatewayIp || '192.168.1.1'}
                        onChange={(e) => updateNetConfig({ gatewayIp: e.target.value })}
                        className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-slate-200 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Subnet Mask</label>
                      <input
                        type="text"
                        value={netConfig.subnetMask || '255.255.255.0'}
                        onChange={(e) => updateNetConfig({ subnetMask: e.target.value })}
                        className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-slate-200 font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-amber-200/90 flex items-center gap-2">
                    <span>✨ Supported Management Protocols: HTTPS (Web GUI 443), SSH (22), Telnet (23)</span>
                  </div>
                </div>
              )}

              {/* SPECIFIC CONFIG: CLOUD (NAT / BRIDGED / HOST-ONLY) */}
              {netConfig.networkType === 'cloud' && (
                <div className="rounded-xl border border-sky-900/40 bg-sky-950/20 p-3 space-y-3">
                  <div className="flex items-center gap-2 text-sky-300 font-bold">
                    <Cloud className="h-4 w-4" />
                    <span>Cloud & External Connectivity Options</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Connect lab devices to external networks, Internet WAN, or isolated host networks.
                  </p>

                  {/* Cloud Subtype Options */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Cloud Subtype</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateNetConfig({ cloudSubtype: 'nat', adapterName: 'pnet1 (NAT)' })}
                        className={`p-2 rounded-lg text-left transition border ${
                          netConfig.cloudSubtype === 'nat'
                            ? 'bg-sky-600/30 text-sky-300 border-sky-500/60 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="block text-xs font-semibold">NAT Mode (Cloud1 / pnet1)</span>
                        <span className="text-[10px] text-slate-500 block">Outbound Internet access with NAT translation</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateNetConfig({ cloudSubtype: 'bridged', adapterName: 'eth0 (Physical NIC)' })}
                        className={`p-2 rounded-lg text-left transition border ${
                          netConfig.cloudSubtype === 'bridged'
                            ? 'bg-sky-600/30 text-sky-300 border-sky-500/60 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="block text-xs font-semibold">Bridged (Physical NIC)</span>
                        <span className="text-[10px] text-slate-500 block">Direct Layer-2 bridge to physical network</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateNetConfig({ cloudSubtype: 'host_only', adapterName: 'pnet2 (Host-Only)' })}
                        className={`p-2 rounded-lg text-left transition border ${
                          netConfig.cloudSubtype === 'host_only'
                            ? 'bg-sky-600/30 text-sky-300 border-sky-500/60 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="block text-xs font-semibold">Host-Only (Cloud2 / pnet2)</span>
                        <span className="text-[10px] text-slate-500 block">Isolated communication with Host only</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateNetConfig({ cloudSubtype: 'custom_adapter', adapterName: 'tap0 (Custom TAP)' })}
                        className={`p-2 rounded-lg text-left transition border ${
                          netConfig.cloudSubtype === 'custom_adapter'
                            ? 'bg-sky-600/30 text-sky-300 border-sky-500/60 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="block text-xs font-semibold">Custom Virtual TAP</span>
                        <span className="text-[10px] text-slate-500 block">Custom host interface / veth pair</span>
                      </button>
                    </div>
                  </div>

                  {/* Cloud Gateway & IP Settings */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1">Gateway IP Address</label>
                      <input
                        type="text"
                        value={netConfig.gatewayIp || '10.0.0.1'}
                        onChange={(e) => updateNetConfig({ gatewayIp: e.target.value })}
                        className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-slate-200 font-mono text-xs"
                        placeholder="10.0.0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Subnet Mask</label>
                      <input
                        type="text"
                        value={netConfig.subnetMask || '255.255.255.0'}
                        onChange={(e) => updateNetConfig({ subnetMask: e.target.value })}
                        className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-slate-200 font-mono text-xs"
                        placeholder="255.255.255.0"
                      />
                    </div>
                  </div>

                  {/* Internet NAT Toggle */}
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-300 block">Outbound Internet NAT</span>
                      <span className="text-[10px] text-slate-500">Allow nodes to ping 8.8.8.8 and access Internet</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateNetConfig({ internetAccess: !netConfig.internetAccess })}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                        netConfig.internetAccess !== false
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {netConfig.internetAccess !== false ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>

                  {/* DHCP Server Toggle & Range */}
                  <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-300 block">Integrated DHCP Server</span>
                        <span className="text-[10px] text-slate-500">Automatically lease IP addresses to connected nodes</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateNetConfig({ dhcpEnabled: !netConfig.dhcpEnabled })}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                          netConfig.dhcpEnabled !== false
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {netConfig.dhcpEnabled !== false ? 'ACTIVE' : 'OFF'}
                      </button>
                    </div>
                    {netConfig.dhcpEnabled !== false && (
                      <div>
                        <label className="block text-slate-400 mb-1 text-[10px]">DHCP Address Pool Range</label>
                        <input
                          type="text"
                          value={netConfig.dhcpRange || '10.0.0.100 - 10.0.0.250'}
                          onChange={(e) => updateNetConfig({ dhcpRange: e.target.value })}
                          className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1 text-slate-200 font-mono text-xs"
                          placeholder="10.0.0.100 - 10.0.0.250"
                        />
                      </div>
                    )}
                  </div>

                  {/* Virtual Bandwidth */}
                  <div>
                    <label className="block text-slate-400 mb-1">Simulated Link Bandwidth</label>
                    <select
                      value={netConfig.bandwidthMbps || 1000}
                      onChange={(e) => updateNetConfig({ bandwidthMbps: Number(e.target.value) })}
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-slate-200 font-mono text-xs"
                    >
                      <option value={100}>100 Mbps (FastEthernet)</option>
                      <option value={1000}>1 Gbps (GigabitEthernet - Recommended)</option>
                      <option value={10000}>10 Gbps (10-Gigabit Fiber)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

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

            {selectedDevice.type === 'router' && (
              <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300/90 leading-relaxed">
                <span className="font-bold text-amber-200">ℹ️ Router Port Behavior:</span> By default, router interfaces are administratively <span className="text-red-400 font-semibold">DOWN (Red)</span>. Enable them using <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-200 font-mono">no shutdown</code> in CLI or click the status toggle below.
              </div>
            )}

            <div className="space-y-2">
              {(selectedDevice.config?.interfaces || []).map((iface) => {
                const isConnected = !!iface.connectedTo;
                const isPortActive = iface.status === 'up' && selectedDevice.status === 'running';

                return (
                  <div
                    key={iface.id}
                    className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full transition-colors ${
                            isPortActive
                              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                              : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                          }`}
                        />
                        <span className="font-bold text-white font-mono">{iface.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                          iface.status === 'up' ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {iface.status === 'up' ? 'UP' : 'ADMIN DOWN'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleInterfaceChange(iface.id, {
                            status: iface.status === 'up' ? 'down' : 'up',
                          })
                        }
                        title={
                          iface.status === 'up'
                            ? 'Interface is UP. Click to shutdown (bring DOWN)'
                            : 'Interface is DOWN. Click to enable (no shutdown)'
                        }
                        className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase transition flex items-center gap-1.5 ${
                          iface.status === 'up'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900/60'
                            : 'bg-red-950/70 text-red-300 border border-red-800 hover:bg-red-900/50'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${iface.status === 'up' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        {iface.status === 'up' ? 'UP (no shut)' : 'DOWN (shut)'}
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
