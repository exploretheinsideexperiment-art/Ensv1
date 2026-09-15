import React, { useState } from 'react';
import { HardDrive, Upload, AlertTriangle, ShieldCheck, Check, Plus, Cpu, Layers, Server, X } from 'lucide-react';
import { DeviceTemplate, DeviceType } from '../types/network';

interface ImageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTemplate: (tpl: DeviceTemplate) => void;
  existingTemplates: DeviceTemplate[];
}

export const ImageManagerModal: React.FC<ImageManagerModalProps> = ({
  isOpen,
  onClose,
  onAddTemplate,
  existingTemplates,
}) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'upload' | 'wizard'>('templates');

  // Wizard state
  const [vendor, setVendor] = useState('Cisco Systems');
  const [deviceType, setDeviceType] = useState<DeviceType>('router');
  const [name, setName] = useState('Cisco-7200-Custom');
  const [imageName, setImageName] = useState('c7200-advipservicesk9-mz.152.qcow2');
  const [imageFormat, setImageFormat] = useState<'qcow2' | 'docker' | 'raw' | 'iso' | 'vmdk'>('qcow2');
  const [ramMb, setRamMb] = useState(1024);
  const [cpuCores, setCpuCores] = useState(1);
  const [diskGb, setDiskGb] = useState(2);
  const [interfaceCount, setInterfaceCount] = useState(4);
  const [consoleType, setConsoleType] = useState<'telnet' | 'vnc' | 'serial' | 'web'>('web');
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSaveCustomTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalAccepted) {
      alert('Please acknowledge and accept the legal licensing requirement before adding a device image template.');
      return;
    }

    const ifacePrefix = deviceType === 'router' ? 'Gi0/' : deviceType === 'switch' ? 'port' : 'eth';
    const defaultInterfaces = Array.from({ length: interfaceCount }, (_, idx) => `${ifacePrefix}${idx}`);

    const newTemplate: DeviceTemplate = {
      id: `tpl-custom-${Date.now()}`,
      name,
      type: deviceType,
      category: deviceType === 'router' ? 'routers' : deviceType === 'switch' ? 'switches' : deviceType === 'firewall' ? 'firewalls' : 'hosts',
      vendor,
      model: `${vendor} ${name}`,
      defaultRamMb: ramMb,
      defaultCpuCores: cpuCores,
      defaultDiskGb: diskGb,
      defaultInterfaces,
      osType: vendor.toLowerCase().includes('cisco') ? 'cisco_ios' : 'generic_linux',
      imageFormat,
      recommendedImage: imageName,
      description: `Custom ${vendor} appliance template configured for ENSv1 laboratory.`,
    };

    onAddTemplate(newTemplate);
    setSuccessMsg(`Template "${name}" created and registered in ENSv1 Device Library!`);
    setTimeout(() => {
      setSuccessMsg('');
      setActiveTab('templates');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">ENSv1 Image & Template Manager</h2>
              <p className="text-xs text-slate-400">Manage QCOW2, ISO, VMDK, RAW & Docker appliance images</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Legal Warning Banner */}
        <div className="bg-amber-950/40 border-b border-amber-700/30 px-6 py-3 flex items-start gap-3 text-xs text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <p>
            <strong className="font-semibold text-amber-100">Legal Compliance Policy:</strong> ENSv1 provides the laboratory simulation environment. Users are responsible for obtaining and using device images according to applicable vendor licenses. ENSv1 does not distribute proprietary copyrighted firmware.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('templates')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'templates'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Registered Templates ({existingTemplates.length})
          </button>
          <button
            onClick={() => setActiveTab('wizard')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'wizard'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            New Image Template Wizard
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="h-4 w-4" />
              {successMsg}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2.5">
                {existingTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{tpl.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase font-mono">
                          {tpl.imageFormat}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800">
                          {tpl.vendor}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">{tpl.recommendedImage}</p>
                      <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                        <span>RAM: {tpl.defaultRamMb} MB</span>
                        <span>CPU: {tpl.defaultCpuCores} Core</span>
                        <span>Disk: {tpl.defaultDiskGb} GB</span>
                        <span>Ports: {tpl.defaultInterfaces.length}</span>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Ready
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'wizard' && (
            <form onSubmit={handleSaveCustomTemplate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">1. Hardware Vendor</label>
                  <select
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-slate-100"
                  >
                    <option value="Cisco Systems">Cisco Systems</option>
                    <option value="Juniper Networks">Juniper Networks</option>
                    <option value="MikroTik">MikroTik</option>
                    <option value="VyOS">VyOS Project</option>
                    <option value="Netgate / pfSense">Netgate / pfSense</option>
                    <option value="Fortinet">Fortinet Lab</option>
                    <option value="Generic Linux">Generic Linux / FRR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">2. Device Category</label>
                  <select
                    value={deviceType}
                    onChange={(e) => setDeviceType(e.target.value as DeviceType)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-slate-100"
                  >
                    <option value="router">Router</option>
                    <option value="switch">Switch</option>
                    <option value="firewall">Firewall / Security Appliance</option>
                    <option value="host">Host / Workstation</option>
                    <option value="server">Server</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">3. Template Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">4. Image Format</label>
                  <select
                    value={imageFormat}
                    onChange={(e) => setImageFormat(e.target.value as any)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-slate-100"
                  >
                    <option value="qcow2">QCOW2 (QEMU Emulation)</option>
                    <option value="docker">Docker Container Image</option>
                    <option value="raw">RAW / Disk IMG</option>
                    <option value="vmdk">VMDK (VMware)</option>
                    <option value="iso">ISO Bootable Installer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">5. Device Image File Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageName}
                    onChange={(e) => setImageName(e.target.value)}
                    required
                    placeholder="e.g. c7200-adventerprisek9.qcow2"
                    className="flex-1 rounded-lg bg-slate-950 border border-slate-700 p-2 text-slate-100 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const sampleName = `${vendor.toLowerCase().replace(/\s+/g, '-')}-${deviceType}-v1.${imageFormat}`;
                      setImageName(sampleName);
                    }}
                    className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Auto-Fill
                  </button>
                </div>
              </div>

              {/* Resource Allocation */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <p className="font-semibold text-slate-200">Hardware Resource Allocation</p>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">RAM (MB)</label>
                    <input
                      type="number"
                      value={ramMb}
                      onChange={(e) => setRamMb(Number(e.target.value))}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 p-1.5 text-center text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">CPU Cores</label>
                    <input
                      type="number"
                      value={cpuCores}
                      onChange={(e) => setCpuCores(Number(e.target.value))}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 p-1.5 text-center text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Disk (GB)</label>
                    <input
                      type="number"
                      value={diskGb}
                      onChange={(e) => setDiskGb(Number(e.target.value))}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 p-1.5 text-center text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Ethernet Adapters</label>
                    <input
                      type="number"
                      value={interfaceCount}
                      min={1}
                      max={16}
                      onChange={(e) => setInterfaceCount(Number(e.target.value))}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 p-1.5 text-center text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Console type */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Console Connection Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['web', 'telnet', 'serial'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setConsoleType(mode)}
                      className={`p-2 rounded-lg border text-center font-medium capitalize transition ${
                        consoleType === mode
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {mode} Terminal
                    </button>
                  ))}
                </div>
              </div>

              {/* Legal checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={legalAccepted}
                  onChange={(e) => setLegalAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-[11px] text-slate-300 leading-snug">
                  I confirm that I legally own or have authorization to use the specified operating system firmware image, and I agree that ENSv1 provides the simulation platform only.
                </span>
              </label>

              <button
                type="submit"
                disabled={!legalAccepted}
                className="w-full rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 text-xs shadow-lg transition"
              >
                Save Template to Device Library
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
