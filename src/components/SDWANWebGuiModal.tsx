import React, { useState } from 'react';
import {
  X,
  Network,
  Globe,
  Lock,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Activity,
  Layers,
  FileText,
  Server,
  Zap,
  Cpu,
  Share2,
  Check,
  Shield,
  Sliders,
} from 'lucide-react';
import { NetworkDevice, SDWANViptelaConfig, NetworkInterface } from '../types/network';

interface SDWANWebGuiModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: NetworkDevice;
  allDevices: NetworkDevice[];
  onUpdateDevice: (updated: NetworkDevice) => void;
}

export const SDWANWebGuiModal: React.FC<SDWANWebGuiModalProps> = ({
  isOpen,
  onClose,
  device,
  allDevices,
  onUpdateDevice,
}) => {
  const isVManage =
    device.config.osType === 'viptela_vmanage' ||
    device.name.toLowerCase().includes('manage') ||
    device.model.toLowerCase().includes('vmanage');

  const isVBond =
    device.config.osType === 'viptela_vbond' ||
    device.name.toLowerCase().includes('bond') ||
    device.model.toLowerCase().includes('vbond');

  const isVEdge =
    device.config.osType === 'viptela_vedge' ||
    device.name.toLowerCase().includes('edge') ||
    device.model.toLowerCase().includes('vedge');

  const role: 'vmanage' | 'vbond' | 'vedge' = isVManage
    ? 'vmanage'
    : isVBond
    ? 'vbond'
    : 'vedge';

  const [activeTab, setActiveTab] = useState<'dashboard' | 'fabric' | 'templates' | 'vpns' | 'tlocs'>('dashboard');
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);

  // Form states for SD-WAN Config
  const sdwanConfig: SDWANViptelaConfig = device.config.sdwanConfig || {
    role,
    systemIp: role === 'vmanage' ? '10.255.255.1' : role === 'vbond' ? '10.255.255.2' : '10.255.255.11',
    siteId: role === 'vmanage' ? 100 : role === 'vbond' ? 100 : 10,
    organizationName: 'Cisco-Viptela-SDWAN-Lab',
    vBondAddress: '198.51.100.1',
    controlStatus: 'connected',
    ompPeersCount: role === 'vedge' ? 2 : 12,
    bfdSessionsCount: role === 'vedge' ? 4 : 24,
    tlocColor: 'biz-internet',
    vpnList: [
      { vpnId: 0, name: 'Transport-VPN-0', subnet: '198.51.100.0/24' },
      { vpnId: 512, name: 'Management-VPN-512', subnet: '192.168.1.0/24' },
      { vpnId: 10, name: 'Corporate-Data-VPN-10', subnet: '10.10.10.0/24' },
      { vpnId: 20, name: 'Guest-WiFi-VPN-20', subnet: '172.16.20.0/24' },
    ],
    appliedTemplate: role === 'vedge' ? 'Branch_Dual_Uplink_Template' : 'Central_Cluster_Template',
  };

  const [systemIp, setSystemIp] = useState(sdwanConfig.systemIp);
  const [siteId, setSiteId] = useState(sdwanConfig.siteId);
  const [orgName, setOrgName] = useState(sdwanConfig.organizationName);
  const [vBondIp, setVBondIp] = useState(sdwanConfig.vBondAddress || '198.51.100.1');
  const [tlocColor, setTlocColor] = useState(sdwanConfig.tlocColor || 'biz-internet');
  const [appliedTemplate, setAppliedTemplate] = useState(sdwanConfig.appliedTemplate || 'Branch_Dual_Uplink_Template');

  // VPN creation
  const [vpnList, setVpnList] = useState(sdwanConfig.vpnList || []);
  const [newVpnId, setNewVpnId] = useState(30);
  const [newVpnName, setNewVpnName] = useState('IoT-Sensors-VPN');
  const [newVpnSubnet, setNewVpnSubnet] = useState('10.30.0.0/24');

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    const updatedSDWAN: SDWANViptelaConfig = {
      ...sdwanConfig,
      systemIp,
      siteId: Number(siteId),
      organizationName: orgName,
      vBondAddress: vBondIp,
      tlocColor: tlocColor as any,
      appliedTemplate,
      vpnList,
    };

    onUpdateDevice({
      ...device,
      config: {
        ...device.config,
        sdwanConfig: updatedSDWAN,
      },
    });

    setSaveSuccessToast(true);
    setTimeout(() => setSaveSuccessToast(false), 2200);
  };

  const handleAddVpn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVpnId) return;
    const item = {
      vpnId: Number(newVpnId),
      name: newVpnName,
      subnet: newVpnSubnet,
    };
    const updated = [...vpnList, item];
    setVpnList(updated);
    setNewVpnId((prev) => prev + 10);
  };

  const handleDeleteVpn = (idToRemove: number) => {
    if (idToRemove === 0 || idToRemove === 512) return; // Protected system VPNs
    setVpnList(vpnList.filter((v) => v.vpnId !== idToRemove));
  };

  // Find other SD-WAN nodes in lab
  const otherSdwanNodes = allDevices.filter(
    (d) => d.type === 'sdwan' || d.config.osType?.startsWith('viptela_')
  );

  const getPortalTitle = () => {
    if (role === 'vmanage') return 'Cisco vManage NMS • SD-WAN Central Management Portal';
    if (role === 'vbond') return 'Cisco vBond Orchestrator • Zero-Touch Fabric Portal';
    return 'Cisco vEdge Cloud • WAN Edge Router Web Console';
  };

  const getRoleBadge = () => {
    if (role === 'vmanage') return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    if (role === 'vbond') return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 md:p-6 animate-in fade-in"
      onClick={onClose}
      id="sdwan-webgui-modal"
    >
      <div
        className="relative w-full max-w-5xl h-[90vh] max-h-[850px] rounded-2xl border border-slate-700 bg-[#09111e] shadow-2xl flex flex-col overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Browser URL Simulation Bar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 bg-slate-900/95 text-xs select-none">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <div className="flex-1 flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-slate-300 font-mono text-[11px] truncate">
            <Lock className="h-3 w-3 text-emerald-400 shrink-0" />
            <span className="text-emerald-400">https://</span>
            <span className="text-white font-semibold">{systemIp}</span>
            <span className="text-slate-500">:8443/dataservice/#/{role}</span>
            <span className="ml-auto text-[10px] text-slate-500 hidden sm:inline">Cisco Viptela SD-WAN Fabric v20.9.3</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            title="Close Portal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-[#0c182c]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Network className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-wide">{getPortalTitle()}</h1>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${getRoleBadge()}`}>
                  {role}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                  ● CONTROL UP
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Overlay Management Protocol (OMP), TLOC IPsec Tunnels, Zero-Touch Provisioning &amp; Application Routing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saveSuccessToast && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-600/40 animate-pulse">
                <CheckCircle2 className="h-3.5 w-3.5" /> Template Pushed!
              </span>
            )}
            <button
              onClick={handleSaveConfig}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-md bg-cyan-600 hover:bg-cyan-500 text-white"
              title="Push Configuration to SD-WAN Edge Fabric"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Apply &amp; Push Template</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 gap-2 text-xs select-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Fabric Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('fabric')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'fabric'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Control Connections (vBond &amp; OMP)</span>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'templates'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Device System Config</span>
          </button>
          <button
            onClick={() => setActiveTab('vpns')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'vpns'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Service VPNs ({vpnList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('tlocs')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'tlocs'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Transport Locators (TLOCs &amp; BFD)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 1. DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              {/* Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Control Status</div>
                  <div className="text-xl font-bold text-emerald-400 flex items-center gap-1.5">
                    <Check className="h-5 w-5" /> Connected
                  </div>
                  <div className="text-[10px] text-slate-400">DTLS / TLS Handshake Active</div>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">OMP Peering</div>
                  <div className="text-xl font-bold text-cyan-400">{sdwanConfig.ompPeersCount || 2} Established</div>
                  <div className="text-[10px] text-slate-400">Overlay Routes Advertised</div>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">BFD Fabric Tunnels</div>
                  <div className="text-xl font-bold text-amber-400">{sdwanConfig.bfdSessionsCount || 4} Up (100%)</div>
                  <div className="text-[10px] text-emerald-400">Avg Latency: 12ms • 0% Loss</div>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Active Site ID</div>
                  <div className="text-xl font-bold text-white">Site {siteId}</div>
                  <div className="text-[10px] text-slate-400">Org: {orgName}</div>
                </div>
              </div>

              {/* Topology Nodes in SD-WAN Fabric */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-cyan-400" />
                  <span>Discovered SD-WAN Fabric Nodes in Current Topology ({otherSdwanNodes.length})</span>
                </h3>

                {otherSdwanNodes.length === 0 ? (
                  <p className="text-xs text-slate-400">No other SD-WAN nodes on canvas.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {otherSdwanNodes.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-lg border text-xs space-y-1 ${
                          n.id === device.id
                            ? 'border-cyan-500/50 bg-cyan-950/20 text-white font-bold'
                            : 'border-slate-800 bg-slate-950/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{n.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                            {n.config.osType?.replace('viptela_', '') || 'sdwan'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          IP: {n.config.sdwanConfig?.systemIp || '10.255.255.x'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. FABRIC & VBOND CONTROL CONNECTIONS */}
          {activeTab === 'fabric' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Control Connections &amp; Discovery Plane</h3>
                <p className="text-xs text-slate-400">
                  vEdge establishes secure DTLS tunnels with vBond and OMP peering sessions with vSmart / vManage.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold">
                      <th className="p-3">Peer Role</th>
                      <th className="p-3">Peer IP</th>
                      <th className="p-3">Protocol</th>
                      <th className="p-3">State</th>
                      <th className="p-3">Site ID</th>
                      <th className="p-3">Color</th>
                      <th className="p-3">Uptime</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    <tr className="hover:bg-slate-900/50 transition">
                      <td className="p-3 font-bold text-purple-400">vBond Orchestrator</td>
                      <td className="p-3 font-mono text-white">{vBondIp}</td>
                      <td className="p-3 font-mono text-cyan-400">DTLS / UDP 12346</td>
                      <td className="p-3 text-emerald-400 font-bold">● OPERATIONAL</td>
                      <td className="p-3 font-mono">100</td>
                      <td className="p-3 font-mono text-amber-300">default</td>
                      <td className="p-3 font-mono text-slate-400">03:41:22</td>
                    </tr>
                    <tr className="hover:bg-slate-900/50 transition">
                      <td className="p-3 font-bold text-cyan-400">vManage NMS</td>
                      <td className="p-3 font-mono text-white">10.255.255.1</td>
                      <td className="p-3 font-mono text-cyan-400">TLS / TCP 23456</td>
                      <td className="p-3 text-emerald-400 font-bold">● CONNECTED</td>
                      <td className="p-3 font-mono">100</td>
                      <td className="p-3 font-mono text-amber-300">biz-internet</td>
                      <td className="p-3 font-mono text-slate-400">03:40:15</td>
                    </tr>
                    <tr className="hover:bg-slate-900/50 transition">
                      <td className="p-3 font-bold text-emerald-400">vSmart Controller</td>
                      <td className="p-3 font-mono text-white">10.255.255.3</td>
                      <td className="p-3 font-mono text-cyan-400">TLS / OMP</td>
                      <td className="p-3 text-emerald-400 font-bold">● PEERED</td>
                      <td className="p-3 font-mono">100</td>
                      <td className="p-3 font-mono text-amber-300">biz-internet</td>
                      <td className="p-3 font-mono text-slate-400">03:40:12</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. DEVICE SYSTEM CONFIG */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">SD-WAN System Template Parameters</h3>
                <p className="text-xs text-slate-400">
                  Configure System IP, Site Identifier, Organization Name, and attached feature template.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 text-xs font-semibold">System IP (Router-ID)</label>
                  <input
                    type="text"
                    value={systemIp}
                    onChange={(e) => setSystemIp(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono text-xs"
                    placeholder="10.255.255.1"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Unique 32-bit loopback identifier for this SD-WAN node.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 text-xs font-semibold">Site ID</label>
                  <input
                    type="number"
                    value={siteId}
                    onChange={(e) => setSiteId(Number(e.target.value))}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono text-xs"
                    placeholder="10"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Numeric location boundary (e.g. 100=DC, 10=Branch-1, 20=Branch-2).
                  </span>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 text-xs font-semibold">Organization Name</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono text-xs"
                    placeholder="Cisco-Viptela-Lab"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Must strictly match certificate Org Name across all fabric controllers.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 text-xs font-semibold">vBond Orchestrator IP</label>
                  <input
                    type="text"
                    value={vBondIp}
                    onChange={(e) => setVBondIp(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono text-xs"
                    placeholder="198.51.100.1"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Public or reachable IP address of the vBond discovery orchestrator.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 text-xs font-semibold">Applied Feature Template</label>
                  <select
                    value={appliedTemplate}
                    onChange={(e) => setAppliedTemplate(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white text-xs"
                  >
                    <option value="Branch_Dual_Uplink_Template">Branch_Dual_Uplink_Template (Internet + MPLS)</option>
                    <option value="Headquarters_DC_Cluster_Template">Headquarters_DC_Cluster_Template (High Capacity)</option>
                    <option value="Small_Office_Single_Uplink_Template">Small_Office_Single_Uplink_Template (LTE/4G Failover)</option>
                    <option value="Central_Cluster_Template">Central_Cluster_Template (vManage/vBond)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 text-xs font-semibold">Primary WAN TLOC Color</label>
                  <select
                    value={tlocColor}
                    onChange={(e) => setTlocColor(e.target.value as any)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white text-xs font-mono"
                  >
                    <option value="biz-internet">biz-internet (Business Broadband)</option>
                    <option value="public-internet">public-internet (Public WAN)</option>
                    <option value="mpls">mpls (Private Layer 3 MPLS)</option>
                    <option value="lte">lte (Cellular Backup)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 4. SERVICE VPNS */}
          {activeTab === 'vpns' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Segmented Virtual Private Networks (VPNs)</h3>
                  <p className="text-xs text-slate-400">
                    VPN 0 (Transport/Underlay), VPN 512 (Out-of-band Mgmt), and VPN 1-511 (User Service VRFs).
                  </p>
                </div>
              </div>

              {/* Add VPN Form */}
              <form
                onSubmit={handleAddVpn}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-wrap gap-3 items-end text-xs"
              >
                <div>
                  <label className="block text-slate-400 mb-1">VPN ID (1-511)</label>
                  <input
                    type="number"
                    min="1"
                    max="511"
                    value={newVpnId}
                    onChange={(e) => setNewVpnId(Number(e.target.value))}
                    className="w-24 rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">VPN Name / Segment</label>
                  <input
                    type="text"
                    value={newVpnName}
                    onChange={(e) => setNewVpnName(e.target.value)}
                    className="rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-white"
                    placeholder="e.g. Finance-VPN"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Subnet Prefix</label>
                  <input
                    type="text"
                    value={newVpnSubnet}
                    onChange={(e) => setNewVpnSubnet(e.target.value)}
                    className="rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-white font-mono"
                    placeholder="10.50.0.0/24"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1 shadow"
                >
                  <Plus className="h-4 w-4" /> Add Service VPN
                </button>
              </form>

              {/* VPN Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold">
                      <th className="p-3">VPN ID</th>
                      <th className="p-3">Segment Name</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Associated Subnet</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {vpnList.map((vpn) => {
                      const isSystem = vpn.vpnId === 0 || vpn.vpnId === 512;
                      return (
                        <tr key={vpn.vpnId} className="hover:bg-slate-900/50 transition">
                          <td className="p-3 font-mono font-bold text-cyan-400">{vpn.vpnId}</td>
                          <td className="p-3 font-semibold text-white">{vpn.name}</td>
                          <td className="p-3 font-mono text-[11px] text-slate-400">
                            {isSystem ? 'System (Underlay/Mgmt)' : 'Tenant Service VRF'}
                          </td>
                          <td className="p-3 font-mono text-emerald-300">{vpn.subnet}</td>
                          <td className="p-3 text-emerald-400 font-bold">● ACTIVE</td>
                          <td className="p-3 text-right">
                            {!isSystem && (
                              <button
                                onClick={() => handleDeleteVpn(vpn.vpnId)}
                                className="p-1 rounded text-red-400 hover:bg-slate-800"
                                title="Delete VPN"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. TLOCS & BFD */}
          {activeTab === 'tlocs' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Transport Locators (TLOCs) &amp; BFD Probe Health</h3>
                <p className="text-xs text-slate-400">
                  Every edge router advertises TLOC routes (System IP + Color + Encapsulation) through OMP.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300">TLOC: {systemIp} [biz-internet]</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      UP
                    </span>
                  </div>
                  <div className="text-slate-400 space-y-1 font-mono text-[11px]">
                    <div>Encapsulation: IPsec (AES-256-GCM)</div>
                    <div>Interface: ge0/0 (Public WAN)</div>
                    <div>Public IP: 198.51.100.25:12346</div>
                    <div>BFD Session State: UP (Tx/Rx 1000ms, Multiplier 7)</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300">TLOC: {systemIp} [mpls]</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      UP
                    </span>
                  </div>
                  <div className="text-slate-400 space-y-1 font-mono text-[11px]">
                    <div>Encapsulation: IPsec</div>
                    <div>Interface: ge0/1 (MPLS Circuit)</div>
                    <div>Carrier Subnet: 10.1.100.25</div>
                    <div>BFD Latency: 4ms • Jitter: 0.8ms</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
