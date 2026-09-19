import React, { useState } from 'react';
import {
  X,
  Shield,
  Globe,
  Lock,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Sliders,
  Activity,
  Layers,
  FileText,
  AlertTriangle,
  Server,
  Zap,
} from 'lucide-react';
import { NetworkDevice, FirewallPolicyRule, FirewallNatRule, NetworkInterface } from '../types/network';

interface FirewallWebGuiModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: NetworkDevice;
  onUpdateDevice: (updated: NetworkDevice) => void;
}

const DEFAULT_FIREWALL_RULES: FirewallPolicyRule[] = [
  {
    id: 'rule-1',
    name: 'Allow-LAN-to-Internet',
    action: 'allow',
    sourceZone: 'trust',
    destZone: 'untrust',
    sourceIp: '192.168.1.0/24',
    destIp: 'any',
    service: 'any',
    logging: true,
    enabled: true,
  },
  {
    id: 'rule-2',
    name: 'Allow-DNS-Outbound',
    action: 'allow',
    sourceZone: 'trust',
    destZone: 'untrust',
    sourceIp: 'any',
    destIp: '8.8.8.8',
    service: 'dns',
    logging: true,
    enabled: true,
  },
  {
    id: 'rule-3',
    name: 'Block-Inbound-SSH-Perimeter',
    action: 'deny',
    sourceZone: 'untrust',
    destZone: 'trust',
    sourceIp: 'any',
    destIp: 'any',
    service: 'ssh',
    logging: true,
    enabled: true,
  },
  {
    id: 'rule-4',
    name: 'Default-Deny-All',
    action: 'drop',
    sourceZone: 'any',
    destZone: 'any',
    sourceIp: 'any',
    destIp: 'any',
    service: 'any',
    logging: true,
    enabled: true,
  },
];

const DEFAULT_NAT_RULES: FirewallNatRule[] = [
  {
    id: 'nat-1',
    name: 'Source-NAT-Outbound',
    type: 'snat',
    origSource: '192.168.1.0/24',
    transSource: 'Interface-IP (Dynamic IP/Port)',
    interfaceName: 'ethernet1/1',
    enabled: true,
  },
  {
    id: 'nat-2',
    name: 'DMZ-Web-Server-VIP',
    type: 'dnat',
    origSource: '203.0.113.10',
    transSource: '192.168.2.80',
    interfaceName: 'ethernet1/2',
    enabled: false,
  },
];

export const FirewallWebGuiModal: React.FC<FirewallWebGuiModalProps> = ({
  isOpen,
  onClose,
  device,
  onUpdateDevice,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'policies' | 'nat' | 'interfaces' | 'monitor'>('dashboard');
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);

  // New Rule Form State
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleAction, setNewRuleAction] = useState<'allow' | 'deny' | 'drop'>('allow');
  const [newRuleSrcZone, setNewRuleSrcZone] = useState('trust');
  const [newRuleDstZone, setNewRuleDstZone] = useState('untrust');
  const [newRuleSrcIp, setNewRuleSrcIp] = useState('any');
  const [newRuleDstIp, setNewRuleDstIp] = useState('any');
  const [newRuleService, setNewRuleService] = useState<'any' | 'http' | 'https' | 'ssh' | 'dns' | 'icmp'>('any');

  if (!isOpen) return null;

  const isPalo =
    device.vendor.toLowerCase().includes('palo') ||
    device.name.toLowerCase().includes('palo') ||
    device.model.toLowerCase().includes('pa-');
  const isForti =
    device.vendor.toLowerCase().includes('fortinet') ||
    device.name.toLowerCase().includes('forti') ||
    device.model.toLowerCase().includes('forti');

  const brandTitle = isPalo
    ? 'Palo Alto Networks • PAN-OS Web Management'
    : isForti
    ? 'Fortinet FortiOS 7.4 • Security Appliance Web Portal'
    : `${device.name} • Firewall Web GUI Portal`;

  const brandAccent = isPalo
    ? 'bg-amber-600 hover:bg-amber-500 text-white'
    : isForti
    ? 'bg-rose-600 hover:bg-rose-500 text-white'
    : 'bg-red-600 hover:bg-red-500 text-white';

  const brandBadge = isPalo
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    : isForti
    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    : 'bg-red-500/20 text-red-300 border-red-500/30';

  const currentRules: FirewallPolicyRule[] =
    device.config?.firewallRules && device.config.firewallRules.length > 0
      ? device.config.firewallRules
      : DEFAULT_FIREWALL_RULES;

  const currentNatRules: FirewallNatRule[] =
    device.config?.firewallNatRules && device.config.firewallNatRules.length > 0
      ? device.config.firewallNatRules
      : DEFAULT_NAT_RULES;

  const handleToggleRule = (ruleId: string) => {
    const updated = currentRules.map((r) =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    );
    onUpdateDevice({
      ...device,
      config: {
        ...device.config,
        firewallRules: updated,
      },
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    const updated = currentRules.filter((r) => r.id !== ruleId);
    onUpdateDevice({
      ...device,
      config: {
        ...device.config,
        firewallRules: updated,
      },
    });
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    const newRule: FirewallPolicyRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName.trim(),
      action: newRuleAction,
      sourceZone: newRuleSrcZone.trim() || 'any',
      destZone: newRuleDstZone.trim() || 'any',
      sourceIp: newRuleSrcIp.trim() || 'any',
      destIp: newRuleDstIp.trim() || 'any',
      service: newRuleService,
      logging: true,
      enabled: true,
    };

    onUpdateDevice({
      ...device,
      config: {
        ...device.config,
        firewallRules: [newRule, ...currentRules],
      },
    });

    setNewRuleName('');
    setIsAddingRule(false);
    triggerCommitNotice();
  };

  const handleToggleNatRule = (natId: string) => {
    const updated = currentNatRules.map((n) =>
      n.id === natId ? { ...n, enabled: !n.enabled } : n
    );
    onUpdateDevice({
      ...device,
      config: {
        ...device.config,
        firewallNatRules: updated,
      },
    });
    triggerCommitNotice();
  };

  const triggerCommitNotice = () => {
    setSaveSuccessToast(true);
    setTimeout(() => setSaveSuccessToast(false), 2200);
  };

  const interfaces: NetworkInterface[] = device.config?.interfaces || [];
  const mgmtIp = interfaces.find((i) => i.ipAddress)?.ipAddress || '192.168.1.1';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 md:p-6 animate-in fade-in"
      onClick={onClose}
      id="firewall-webgui-modal"
    >
      <div
        className="relative w-full max-w-5xl h-[90vh] max-h-[850px] rounded-2xl border border-slate-700 bg-[#0a0f1d] shadow-2xl flex flex-col overflow-hidden text-slate-200"
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
            <span className="text-white font-semibold">{mgmtIp}</span>
            <span className="text-slate-500">:443/php/login.php#portal</span>
            <span className="ml-auto text-[10px] text-slate-500 hidden sm:inline">SSL TLSv1.3 • Secured</span>
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
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-[#0d1627]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-wide">{brandTitle}</h1>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${brandBadge}`}>
                  {device.name}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                  ● ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Next-Generation Security Policies, NAT, Zone Inspection &amp; Real-Time Traffic Monitor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saveSuccessToast && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-600/40 animate-pulse">
                <CheckCircle2 className="h-3.5 w-3.5" /> Commit Applied!
              </span>
            )}
            <button
              onClick={triggerCommitNotice}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-md ${brandAccent}`}
              title="Commit & Push Candidate Configuration"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Commit Config</span>
            </button>
          </div>
        </div>

        {/* Portal Nav Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 gap-2 text-xs select-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'border-sky-500 text-sky-400 bg-sky-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'policies'
                ? 'border-sky-500 text-sky-400 bg-sky-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Security Policies ({currentRules.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('nat')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'nat'
                ? 'border-sky-500 text-sky-400 bg-sky-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>NAT Rules ({currentNatRules.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('interfaces')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'interfaces'
                ? 'border-sky-500 text-sky-400 bg-sky-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Network Zones &amp; Interfaces ({interfaces.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('monitor')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'monitor'
                ? 'border-sky-500 text-sky-400 bg-sky-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Traffic Logs &amp; Threat Monitor</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 1. DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Device Uptime</div>
                  <div className="text-xl font-bold text-white">4 days, 12:44:10</div>
                  <div className="text-[10px] text-emerald-400">System Kernel: Normal</div>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Management CPU</div>
                  <div className="text-xl font-bold text-sky-400">14% Load</div>
                  <div className="text-[10px] text-slate-500">Data Plane Core: 8%</div>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Active Sessions</div>
                  <div className="text-xl font-bold text-amber-400">142 Flows</div>
                  <div className="text-[10px] text-slate-500">Peak Capacity: 10,000</div>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Security Threat Blocked</div>
                  <div className="text-xl font-bold text-rose-400">0 High / 3 Dropped</div>
                  <div className="text-[10px] text-emerald-400">IPS Engine: Active</div>
                </div>
              </div>

              {/* System Details Card */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Server className="h-4 w-4 text-sky-400" />
                  <span>Hardware &amp; Firmware Profile</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Appliance Model</span>
                    <span className="font-semibold text-white">{device.model}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Firmware OS</span>
                    <span className="font-semibold text-emerald-400 font-mono">
                      {isPalo ? 'PAN-OS 11.1.0' : isForti ? 'FortiOS 7.4.2-GA' : 'Enterprise v9.2'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Virtual Memory</span>
                    <span className="font-semibold text-white">{device.ramMb} MB RAM</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Web Management IP</span>
                    <span className="font-mono text-sky-400 font-bold">{mgmtIp}</span>
                  </div>
                </div>
              </div>

              {/* Quick Security Status */}
              <div className="p-4 rounded-xl border border-sky-900/40 bg-sky-950/20 text-xs space-y-2">
                <h4 className="font-bold text-sky-300 flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-sky-400" />
                  <span>Interactive Web Portal Capabilities</span>
                </h4>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Aap is GUI portal ke through <strong>Security Policies</strong> (Allow/Deny/Drop rules) add kar sakte hain, <strong>NAT Masquerade &amp; Port Forwarding</strong> enable kar sakte hain, aur interfaces ke IP address inspect kar sakte hain. Saari updates real-time simulated packet engine aur CLI ke saath synchronized rahengi.
                </p>
              </div>
            </div>
          )}

          {/* 2. SECURITY POLICIES */}
          {activeTab === 'policies' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Stateful Security Rules</h3>
                  <p className="text-xs text-slate-400">
                    Define ingress and egress traffic control between security zones (Trust, Untrust, DMZ).
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingRule(!isAddingRule)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Security Policy</span>
                </button>
              </div>

              {/* Add Rule Form */}
              {isAddingRule && (
                <form
                  onSubmit={handleAddRule}
                  className="p-4 rounded-xl border border-sky-600/40 bg-slate-900/90 space-y-3 animate-in fade-in"
                >
                  <div className="font-bold text-xs text-sky-300">Create New Security Policy Rule</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Rule Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Allow-Web-Outbound"
                        value={newRuleName}
                        onChange={(e) => setNewRuleName(e.target.value)}
                        className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Action</label>
                      <select
                        value={newRuleAction}
                        onChange={(e) => setNewRuleAction(e.target.value as any)}
                        className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-white"
                      >
                        <option value="allow">ALLOW (Permit)</option>
                        <option value="deny">DENY (Send TCP Reset)</option>
                        <option value="drop">DROP (Silently Discard)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Service / Application</label>
                      <select
                        value={newRuleService}
                        onChange={(e) => setNewRuleService(e.target.value as any)}
                        className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-white"
                      >
                        <option value="any">any</option>
                        <option value="http">http (Port 80)</option>
                        <option value="https">https (Port 443)</option>
                        <option value="dns">dns (Port 53)</option>
                        <option value="ssh">ssh (Port 22)</option>
                        <option value="icmp">icmp (Ping)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Source Zone</label>
                      <input
                        type="text"
                        value={newRuleSrcZone}
                        onChange={(e) => setNewRuleSrcZone(e.target.value)}
                        className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-white font-mono"
                        placeholder="trust"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Destination Zone</label>
                      <input
                        type="text"
                        value={newRuleDstZone}
                        onChange={(e) => setNewRuleDstZone(e.target.value)}
                        className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-white font-mono"
                        placeholder="untrust"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Source IP / Subnet</label>
                      <input
                        type="text"
                        value={newRuleSrcIp}
                        onChange={(e) => setNewRuleSrcIp(e.target.value)}
                        className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-white font-mono"
                        placeholder="192.168.1.0/24 or any"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Destination IP</label>
                      <input
                        type="text"
                        value={newRuleDstIp}
                        onChange={(e) => setNewRuleDstIp(e.target.value)}
                        className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-white font-mono"
                        placeholder="any or 8.8.8.8"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingRule(false)}
                      className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      Save &amp; Apply Rule
                    </button>
                  </div>
                </form>
              )}

              {/* Rules Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold">
                      <th className="p-3">Status</th>
                      <th className="p-3">Rule Name</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Source Zone</th>
                      <th className="p-3">Source IP</th>
                      <th className="p-3">Dest Zone</th>
                      <th className="p-3">Dest IP</th>
                      <th className="p-3">Service</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {currentRules.map((rule) => (
                      <tr
                        key={rule.id}
                        className={`hover:bg-slate-900/50 transition ${
                          !rule.enabled ? 'opacity-40 line-through' : ''
                        }`}
                      >
                        <td className="p-3">
                          <button
                            onClick={() => handleToggleRule(rule.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rule.enabled
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {rule.enabled ? 'ENABLED' : 'DISABLED'}
                          </button>
                        </td>
                        <td className="p-3 font-semibold text-white">{rule.name}</td>
                        <td className="p-3 font-bold uppercase">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              rule.action === 'allow'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : rule.action === 'deny'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {rule.action}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-300">{rule.sourceZone}</td>
                        <td className="p-3 font-mono text-slate-300">{rule.sourceIp}</td>
                        <td className="p-3 font-mono text-slate-300">{rule.destZone}</td>
                        <td className="p-3 font-mono text-slate-300">{rule.destIp}</td>
                        <td className="p-3 font-mono text-sky-400 uppercase">{rule.service}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-1 rounded text-red-400 hover:bg-slate-800"
                            title="Delete Rule"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. NAT RULES */}
          {activeTab === 'nat' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Network Address Translation (NAT)</h3>
                <p className="text-xs text-slate-400">
                  Configure Source NAT (Hide/Masquerade) for Internet access and Destination NAT (VIP) for internal servers.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold">
                      <th className="p-3">State</th>
                      <th className="p-3">NAT Rule Name</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Original Source</th>
                      <th className="p-3">Translated Source/Target</th>
                      <th className="p-3">Outbound Interface</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {currentNatRules.map((nat) => (
                      <tr key={nat.id} className="hover:bg-slate-900/50 transition">
                        <td className="p-3">
                          <button
                            onClick={() => handleToggleNatRule(nat.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              nat.enabled
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {nat.enabled ? 'ACTIVE' : 'DISABLED'}
                          </button>
                        </td>
                        <td className="p-3 font-semibold text-white">{nat.name}</td>
                        <td className="p-3 font-bold font-mono uppercase text-sky-400">{nat.type}</td>
                        <td className="p-3 font-mono text-slate-300">{nat.origSource}</td>
                        <td className="p-3 font-mono text-emerald-300">{nat.transSource}</td>
                        <td className="p-3 font-mono text-slate-400">{nat.interfaceName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. INTERFACES & ZONES */}
          {activeTab === 'interfaces' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Physical &amp; Virtual Security Interfaces</h3>
                <p className="text-xs text-slate-400">
                  Inspect hardware ports, link states, assigned IP addresses, and bound security zones.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {interfaces.map((iface, idx) => (
                  <div
                    key={iface.id}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">{iface.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          Zone: {idx === 0 ? 'management' : idx === 1 ? 'untrust (WAN)' : 'trust (LAN)'}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          iface.status === 'up'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-red-950 text-red-400 border border-red-800'
                        }`}
                      >
                        ● {iface.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-400 text-[11px]">
                      <div>
                        <span>IP Address: </span>
                        <span className="font-mono text-sky-400 font-semibold">
                          {iface.ipAddress || 'Not Assigned (DHCP)'}
                        </span>
                      </div>
                      <div>
                        <span>MAC: </span>
                        <span className="font-mono text-slate-300">{iface.macAddress}</span>
                      </div>
                      <div>
                        <span>MTU: </span>
                        <span className="font-mono text-slate-300">{iface.mtu} bytes</span>
                      </div>
                      <div>
                        <span>Speed: </span>
                        <span className="font-mono text-slate-300">{iface.speed}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. MONITOR & LOGS */}
          {activeTab === 'monitor' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Live Traffic &amp; Threat Audit Log</h3>
                  <p className="text-xs text-slate-400">Real-time deep packet inspection log stream.</p>
                </div>
                <button
                  onClick={triggerCommitNotice}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </button>
              </div>

              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950 font-mono text-[11px] space-y-1.5 select-text text-slate-300">
                <div className="text-emerald-400 font-semibold">[TRAFFIC-ALLOW] 192.168.1.10:51432 -&gt; 8.8.8.8:53 UDP (Rule: Allow-DNS-Outbound) • 64 bytes</div>
                <div className="text-emerald-400 font-semibold">[TRAFFIC-ALLOW] 192.168.1.10:54210 -&gt; 104.26.10.12:443 TCP (Rule: Allow-LAN-to-Internet) • App: web-browsing</div>
                <div className="text-amber-400 font-semibold">[NAT-TRANSLATE] 192.168.1.10 -&gt; 203.0.113.5 (SNAT Overload via ethernet1/1)</div>
                <div className="text-rose-400 font-semibold">[SECURITY-DENY] 198.51.100.42:22 -&gt; 192.168.1.1:22 TCP (Rule: Block-Inbound-SSH-Perimeter) • DROPPED</div>
                <div className="text-slate-500">[SYSTEM-AUDIT] Session admin logged into Web GUI from internal console</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
