import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  NetworkDevice,
  NetworkLink,
  DeviceTemplate,
  ENSProject,
  SimulatedPacket,
  CableType,
} from './types/network';
import { DEVICE_TEMPLATES } from './data/defaultTemplates';
import { DEFAULT_PRESET_LAB, PRESET_LABS } from './data/presetLabs';
import { TopMenuBar } from './components/TopMenuBar';
import { DeviceLibraryPanel } from './components/DeviceLibraryPanel';
import { DevicePropertiesPanel } from './components/DevicePropertiesPanel';
import { TopologyCanvas } from './components/TopologyCanvas';
import { TerminalModal } from './components/TerminalModal';
import { CablePortSelectorModal } from './components/CablePortSelectorModal';
import { ImageManagerModal } from './components/ImageManagerModal';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { PacketInspectorModal } from './components/PacketInspectorModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { HelpAboutModal } from './components/HelpAboutModal';
import { CanvasContextMenu } from './components/CanvasContextMenu';
import { NodeSelectorModal } from './components/NodeSelectorModal';
import { Terminal, HardDrive, Smartphone, Activity, Play, Pause, Square, Link as LinkIcon, Plus } from 'lucide-react';

const STORAGE_KEY_SAVED_PROJECTS = 'ensv1_saved_topologies';
const STORAGE_KEY_TEMPLATES = 'ensv1_device_templates';

export default function App() {
  // 1. Projects & Topology State
  const [currentProject, setCurrentProject] = useState<ENSProject>(() => {
    return JSON.parse(JSON.stringify(DEFAULT_PRESET_LAB));
  });

  const [savedProjects, setSavedProjects] = useState<ENSProject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAVED_PROJECTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [JSON.parse(JSON.stringify(DEFAULT_PRESET_LAB))];
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 2. Device Templates
  const [templates, setTemplates] = useState<DeviceTemplate[]>(() => {
    try {
      const savedTpls = localStorage.getItem(STORAGE_KEY_TEMPLATES);
      if (savedTpls) {
        const parsed = JSON.parse(savedTpls);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEVICE_TEMPLATES;
  });

  // 3. Selection & Tools State
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(() => {
    return DEFAULT_PRESET_LAB?.devices?.[0]?.id || null;
  });
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);

  const [isCableToolActive, setIsCableToolActive] = useState(false);
  const [cableSourceDevice, setCableSourceDevice] = useState<NetworkDevice | null>(null);
  const [cablePendingTarget, setCablePendingTarget] = useState<NetworkDevice | null>(null);

  const [showInterfaceLabels, setShowInterfaceLabels] = useState(true);
  const [packetAnimationActive, setPacketAnimationActive] = useState(true);
  const [gridSnap, setGridSnap] = useState(true);

  // 4. Packet Simulation & Traffic
  const [simulatedPackets, setSimulatedPackets] = useState<SimulatedPacket[]>([]);
  const [capturedPackets, setCapturedPackets] = useState<SimulatedPacket[]>([]);
  const [simulationToast, setSimulationToast] = useState<{
    message: string;
    type: 'start' | 'hold' | 'stop';
  } | null>(null);

  // 5. Consoles / Terminals
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [openConsoleDeviceIds, setOpenConsoleDeviceIds] = useState<string[]>(() => {
    return DEFAULT_PRESET_LAB?.devices?.[0]?.id ? [DEFAULT_PRESET_LAB.devices[0].id] : [];
  });
  const [activeConsoleDeviceId, setActiveConsoleDeviceId] = useState<string | null>(() => {
    return DEFAULT_PRESET_LAB?.devices?.[0]?.id || null;
  });

  // 6. UI Panels Collapsing (Collapsible for smaller screens & tablet mode)
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
  });

  // 7. Modals
  const [isNodeSelectorOpen, setIsNodeSelectorOpen] = useState(false);
  const [isPWAInstallOpen, setIsPWAInstallOpen] = useState(false);
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [isPacketInspectorOpen, setIsPacketInspectorOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; device: NetworkDevice } | null>(null);

  // Auto-close context menu on window click
  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Keyboard shortcut listener (e.g. 'c' for cable tool, Ctrl+S for save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }
      if (e.key === 'c' || e.key === 'C') {
        setIsCableToolActive((prev) => {
          if (prev) setCableSourceDevice(null);
          return !prev;
        });
      }
      if (e.key === 'Escape') {
        setIsCableToolActive(false);
        setCableSourceDevice(null);
        setContextMenu(null);
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSaveProject();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentProject]);

  // Periodic packet animation runner (Running active, Hold frozen, Stop cleared)
  useEffect(() => {
    if (!packetAnimationActive) return;

    const isAnyRunning = currentProject.devices.some((d) => d.status === 'running');
    const isAnyPaused = currentProject.devices.some((d) => d.status === 'paused');

    // If completely stopped (no devices running and none paused), clear packets
    if (!isAnyRunning && !isAnyPaused) {
      setSimulatedPackets([]);
      return;
    }

    // If on Hold (no devices running, but devices are paused), freeze packets in place!
    if (isAnyPaused && !isAnyRunning) {
      return;
    }

    const interval = setInterval(() => {
      setSimulatedPackets((prev) => {
        if (prev.length === 0) {
          // Generate realistic background keepalive packet (OSPF hello or ARP) along active links
          const upLinks = currentProject.links.filter((l) => l.status === 'up');
          if (upLinks.length > 0 && Math.random() > 0.4) {
            const randomLink = upLinks[Math.floor(Math.random() * upLinks.length)];
            const srcDev = currentProject.devices.find((d) => d.id === randomLink.sourceDeviceId);
            const tgtDev = currentProject.devices.find((d) => d.id === randomLink.targetDeviceId);

            if (srcDev && tgtDev && srcDev.status === 'running' && tgtDev.status === 'running') {
              const newPkt: SimulatedPacket = {
                id: `pkt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                linkId: randomLink.id,
                sourceDeviceId: srcDev.id,
                targetDeviceId: tgtDev.id,
                protocol: Math.random() > 0.5 ? 'OSPF' : 'ARP',
                sourceIp: srcDev.config.interfaces[0]?.ipAddress || '192.168.1.1',
                destinationIp: tgtDev.config.interfaces[0]?.ipAddress || '224.0.0.5',
                sourceMac: srcDev.config.interfaces[0]?.macAddress || '00:00:00:00:00:01',
                destinationMac: tgtDev.config.interfaces[0]?.macAddress || '01:00:5e:00:00:05',
                ttl: 1,
                sizeBytes: 64,
                payloadSummary: 'OSPF v2 Hello Packet (Area 0.0.0.0, Router-Dead-Interval 40s)',
                progress: 0,
                timestamp: new Date().toISOString(),
              };

              setCapturedPackets((cp) => [newPkt, ...cp.slice(0, 199)]);
              return [newPkt];
            }
          }
          return [];
        }

        // Advance packet progress
        const updated = prev
          .map((p) => ({
            ...p,
            progress: p.progress + 0.08,
          }))
          .filter((p) => p.progress <= 1.0);

        return updated;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [packetAnimationActive, currentProject.links, currentProject.devices]);

  // TRIGGER ICMP PACKET FROM CLI TERMINAL (e.g. ping 192.168.1.1)
  const handleTriggerSimulatedPacket = useCallback(
    (packetData: Omit<SimulatedPacket, 'id' | 'timestamp' | 'progress'>) => {
      const newPkt: SimulatedPacket = {
        ...packetData,
        id: `pkt-cli-${Date.now()}`,
        progress: 0,
        timestamp: new Date().toISOString(),
      };
      setSimulatedPackets((prev) => [...prev, newPkt]);
      setCapturedPackets((prev) => [newPkt, ...prev.slice(0, 199)]);
    },
    []
  );

  // PROJECT MANAGEMENT
  const handleSaveProject = () => {
    const updated: ENSProject = {
      ...currentProject,
      modifiedAt: new Date().toISOString(),
    };
    setCurrentProject(updated);
    setSavedProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === updated.id);
      let nextList = [];
      if (idx >= 0) {
        nextList = [...prev];
        nextList[idx] = updated;
      } else {
        nextList = [updated, ...prev];
      }
      try {
        localStorage.setItem(STORAGE_KEY_SAVED_PROJECTS, JSON.stringify(nextList));
      } catch {
        // ignore
      }
      return nextList;
    });
    setHasUnsavedChanges(false);
  };

  const handleCreateNewProject = (name: string, description: string) => {
    const newProj: ENSProject = {
      id: `proj-${Date.now()}`,
      name,
      description,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      settings: {
        gridSnap: true,
        showInterfaceLabels: true,
        packetAnimation: true,
        theme: 'dark',
      },
      devices: [],
      links: [],
      annotations: [
        {
          id: 'anno-welcome',
          type: 'text',
          text: 'Drag routers, switches or hosts from the left panel onto the canvas to begin.',
          x: 60,
          y: 60,
          color: '#38bdf8',
        },
      ],
    };
    setCurrentProject(newProj);
    setSelectedDeviceId(null);
    setSelectedLinkId(null);
    setOpenConsoleDeviceIds([]);
    setActiveConsoleDeviceId(null);
    setHasUnsavedChanges(false);
  };

  const handleLoadProject = (project: ENSProject) => {
    const cloned = JSON.parse(JSON.stringify(project));
    setCurrentProject(cloned);
    setSelectedDeviceId(cloned.devices[0]?.id || null);
    setSelectedLinkId(null);
    setOpenConsoleDeviceIds(cloned.devices.slice(0, 2).map((d: NetworkDevice) => d.id));
    setActiveConsoleDeviceId(cloned.devices[0]?.id || null);
    setHasUnsavedChanges(false);
  };

  const handleDeleteSavedProject = (projectId: string) => {
    const filtered = savedProjects.filter((p) => p.id !== projectId);
    setSavedProjects(filtered);
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_PROJECTS, JSON.stringify(filtered));
    } catch {
      // ignore
    }
  };

  const handleExportProject = () => {
    const dataStr = JSON.stringify(currentProject, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name.toLowerCase().replace(/\s+/g, '_')}.ensv1`;
    a.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.devices) && Array.isArray(parsed.links)) {
          handleLoadProject(parsed);
        } else {
          alert('Invalid ENSv1 project file format.');
        }
      } catch {
        alert('Failed to parse the project file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // DEVICE ADDITION
  const handleAddDeviceFromTemplate = (template: DeviceTemplate, dropX?: number, dropY?: number) => {
    const count = currentProject.devices.filter((d) => d.type === template.type).length + 1;
    let prefix = 'Host';
    if (template.name.toLowerCase().includes('palo') || template.vendor.toLowerCase().includes('palo')) {
      prefix = 'PA-FW';
    } else if (template.name.toLowerCase().includes('forti') || template.vendor.toLowerCase().includes('fortinet')) {
      prefix = 'FGT-FW';
    } else if (template.type === 'router') {
      prefix = 'R';
    } else if (template.type === 'switch') {
      prefix = 'SW';
    } else if (template.type === 'firewall') {
      prefix = 'FW';
    } else if (template.name.toLowerCase().includes('windows')) {
      prefix = 'PC-Win';
    } else {
      prefix = 'PC';
    }
    const newName = `${prefix}${count}`;

    const newDevice: NetworkDevice = {
      id: `dev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newName,
      type: template.type,
      vendor: template.vendor,
      model: template.model,
      image: template.recommendedImage,
      status: 'stopped',
      x: dropX !== undefined ? dropX : 120 + (count * 40) % 300,
      y: dropY !== undefined ? dropY : 100 + (count * 30) % 250,
      ramMb: template.defaultRamMb,
      cpuCores: template.defaultCpuCores,
      diskGb: template.defaultDiskGb,
      consoleType: 'web',
      config: {
        hostname: newName,
        osType: template.osType,
        interfaces: template.defaultInterfaces.map((ifName, idx) => ({
          id: `if-${Date.now()}-${idx}`,
          name: ifName,
          status: 'down',
          macAddress: `00:50:79:66:68:${(idx + 1).toString(16).padStart(2, '0')}`,
          mtu: 1500,
          duplex: 'auto',
          speed: 'auto',
        })),
        routingProtocols: {
          staticRoutes: [],
        },
      },
    };

    setCurrentProject((prev) => ({
      ...prev,
      devices: [...prev.devices, newDevice],
    }));
    setSelectedDeviceId(newDevice.id);
    setSelectedLinkId(null);
    setHasUnsavedChanges(true);
  };

  // DEVICE LIFECYCLE CONTROLS
  const handleStartDevice = (deviceId: string) => {
    setCurrentProject((prev) => ({
      ...prev,
      devices: prev.devices.map((d) =>
        d.id === deviceId
          ? {
              ...d,
              status: 'running',
              config: {
                ...d.config,
                interfaces: d.config.interfaces.map((i) => ({
                  ...i,
                  status: i.connectedTo ? 'up' : i.status,
                })),
              },
            }
          : d
      ),
    }));
    setHasUnsavedChanges(true);
  };

  const handleStopDevice = (deviceId: string) => {
    setCurrentProject((prev) => ({
      ...prev,
      devices: prev.devices.map((d) => (d.id === deviceId ? { ...d, status: 'stopped' } : d)),
    }));
    setHasUnsavedChanges(true);
  };

  const handleRestartDevice = (deviceId: string) => {
    handleStopDevice(deviceId);
    setTimeout(() => handleStartDevice(deviceId), 500);
  };

  const handleStartAll = () => {
    setCurrentProject((prev) => ({
      ...prev,
      devices: prev.devices.map((d) => ({
        ...d,
        status: 'running',
        config: {
          ...d.config,
          interfaces: d.config.interfaces.map((i) => ({
            ...i,
            status: i.connectedTo ? 'up' : i.status,
          })),
        },
      })),
      links: prev.links.map((l) => ({
        ...l,
        status: 'up',
        currentTrafficMbps:
          l.currentTrafficMbps && l.currentTrafficMbps > 0
            ? l.currentTrafficMbps
            : Number((Math.random() * 8 + 3).toFixed(1)),
      })),
    }));
    setSimulationToast({ message: 'Topology Started — All Devices Running', type: 'start' });
    setTimeout(() => setSimulationToast(null), 2500);
    setHasUnsavedChanges(true);
  };

  const handleStopAll = () => {
    setCurrentProject((prev) => ({
      ...prev,
      devices: prev.devices.map((d) => ({
        ...d,
        status: 'stopped',
        config: {
          ...d.config,
          interfaces: d.config.interfaces.map((i) => ({
            ...i,
            status: 'down',
          })),
        },
      })),
      links: prev.links.map((l) => ({
        ...l,
        status: 'down',
        currentTrafficMbps: 0,
      })),
    }));
    setSimulatedPackets([]);
    setSimulationToast({ message: 'Topology Stopped — All Devices Powered Off', type: 'stop' });
    setTimeout(() => setSimulationToast(null), 2500);
    setHasUnsavedChanges(true);
  };

  const handlePauseAll = () => {
    setCurrentProject((prev) => ({
      ...prev,
      devices: prev.devices.map((d) => ({ ...d, status: 'paused' })),
    }));
    setSimulationToast({ message: 'Topology on Hold — Devices & Packets Paused', type: 'hold' });
    setTimeout(() => setSimulationToast(null), 2500);
    setHasUnsavedChanges(true);
  };

  const handleRestartAll = () => {
    handleStopAll();
    setTimeout(() => handleStartAll(), 600);
  };

  const handleMoveDevice = (deviceId: string, x: number, y: number) => {
    setCurrentProject((prev) => ({
      ...prev,
      devices: prev.devices.map((d) => (d.id === deviceId ? { ...d, x, y } : d)),
    }));
    setHasUnsavedChanges(true);
  };

  const handleUpdateDevice = (updated: NetworkDevice) => {
    setCurrentProject((prev) => ({
      ...prev,
      devices: prev.devices.map((d) => (d.id === updated.id ? updated : d)),
    }));
    setHasUnsavedChanges(true);
  };

  const handleDeleteDevice = (deviceId: string) => {
    setCurrentProject((prev) => ({
      ...prev,
      devices: prev.devices.filter((d) => d.id !== deviceId),
      links: prev.links.filter((l) => l.sourceDeviceId !== deviceId && l.targetDeviceId !== deviceId),
    }));
    if (selectedDeviceId === deviceId) setSelectedDeviceId(null);
    setOpenConsoleDeviceIds((prev) => prev.filter((id) => id !== deviceId));
    setHasUnsavedChanges(true);
  };

  const handleDuplicateDevice = (deviceId: string) => {
    const existing = currentProject.devices.find((d) => d.id === deviceId);
    if (!existing) return;

    const copy: NetworkDevice = {
      ...JSON.parse(JSON.stringify(existing)),
      id: `dev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${existing.name}-copy`,
      x: existing.x + 50,
      y: existing.y + 50,
      config: {
        ...existing.config,
        hostname: `${existing.name}-copy`,
        interfaces: existing.config.interfaces.map((i: any, idx: number) => ({
          ...i,
          id: `if-${Date.now()}-${idx}`,
          connectedTo: undefined,
          status: 'down',
        })),
      },
    };

    setCurrentProject((prev) => ({
      ...prev,
      devices: [...prev.devices, copy],
    }));
    setSelectedDeviceId(copy.id);
    setHasUnsavedChanges(true);
  };

  // CABLE CONNECTING WORKFLOW
  const handleCableEndpointSelect = (device: NetworkDevice) => {
    if (!cableSourceDevice) {
      setCableSourceDevice(device);
    } else {
      if (cableSourceDevice.id === device.id) {
        setCableSourceDevice(null);
        return;
      }
      setCablePendingTarget(device);
    }
  };

  const handleConfirmCableConnection = (
    sourceInterfaceId: string,
    targetInterfaceId: string,
    cableType: CableType
  ) => {
    if (!cableSourceDevice || !cablePendingTarget) return;

    const srcDev = cableSourceDevice;
    const tgtDev = cablePendingTarget;

    const srcIface = srcDev.config.interfaces.find((i) => i.id === sourceInterfaceId);
    const tgtIface = tgtDev.config.interfaces.find((i) => i.id === targetInterfaceId);

    const newLink: NetworkLink = {
      id: `link-${Date.now()}`,
      name: `${srcDev.name}_${srcIface?.name || 'port'}<->${tgtDev.name}_${tgtIface?.name || 'port'}`,
      sourceDeviceId: srcDev.id,
      sourceInterfaceId,
      sourceInterfaceName: srcIface?.name || 'eth0',
      targetDeviceId: tgtDev.id,
      targetInterfaceId,
      targetInterfaceName: tgtIface?.name || 'eth0',
      type: cableType,
      status: srcDev.status === 'running' && tgtDev.status === 'running' ? 'up' : 'down',
      bandwidthMbps: cableType === 'fiber' ? 10000 : cableType === 'serial' ? 2 : 1000,
      currentTrafficMbps: 0.1,
    };

    // Update interfaces with connectedTo references
    setCurrentProject((prev) => ({
      ...prev,
      links: [...prev.links, newLink],
      devices: prev.devices.map((d) => {
        if (d.id === srcDev.id) {
          return {
            ...d,
            config: {
              ...d.config,
              interfaces: d.config.interfaces.map((i) =>
                i.id === sourceInterfaceId
                  ? {
                      ...i,
                      connectedTo: {
                        deviceId: tgtDev.id,
                        interfaceId: targetInterfaceId,
                        interfaceName: tgtIface?.name || 'eth0',
                        linkId: newLink.id,
                      },
                      status: 'up' as const,
                    }
                  : i
              ),
            },
          };
        }
        if (d.id === tgtDev.id) {
          return {
            ...d,
            config: {
              ...d.config,
              interfaces: d.config.interfaces.map((i) =>
                i.id === targetInterfaceId
                  ? {
                      ...i,
                      connectedTo: {
                        deviceId: srcDev.id,
                        interfaceId: sourceInterfaceId,
                        interfaceName: srcIface?.name || 'eth0',
                        linkId: newLink.id,
                      },
                      status: 'up' as const,
                    }
                  : i
              ),
            },
          };
        }
        return d;
      }),
    }));

    setIsCableToolActive(false);
    setCableSourceDevice(null);
    setCablePendingTarget(null);
    setSelectedLinkId(newLink.id);
    setHasUnsavedChanges(true);
  };

  const handleDeleteLink = (linkId: string) => {
    const link = currentProject.links.find((l) => l.id === linkId);
    if (!link) return;

    setCurrentProject((prev) => ({
      ...prev,
      links: prev.links.filter((l) => l.id !== linkId),
      devices: prev.devices.map((d) => ({
        ...d,
        config: {
          ...d.config,
          interfaces: d.config.interfaces.map((i) =>
            i.id === link.sourceInterfaceId || i.id === link.targetInterfaceId
              ? { ...i, connectedTo: undefined, status: 'down' }
              : i
          ),
        },
      })),
    }));
    if (selectedLinkId === linkId) setSelectedLinkId(null);
    setHasUnsavedChanges(true);
  };

  const handleUpdateLink = (updated: NetworkLink) => {
    setCurrentProject((prev) => ({
      ...prev,
      links: prev.links.map((l) => (l.id === updated.id ? updated : l)),
    }));
    setHasUnsavedChanges(true);
  };

  // CONSOLE TERMINALS
  const handleOpenConsole = (device: NetworkDevice) => {
    if (!openConsoleDeviceIds.includes(device.id)) {
      setOpenConsoleDeviceIds((prev) => [...prev, device.id]);
    }
    setActiveConsoleDeviceId(device.id);
    setIsConsoleOpen(true);
  };

  const handleOpenConsoleAll = () => {
    const runningIds = currentProject.devices.filter((d) => d.status === 'running').map((d) => d.id);
    if (runningIds.length > 0) {
      setOpenConsoleDeviceIds(runningIds);
      setActiveConsoleDeviceId(runningIds[0]);
      setIsConsoleOpen(true);
    } else if (currentProject.devices.length > 0) {
      setOpenConsoleDeviceIds([currentProject.devices[0].id]);
      setActiveConsoleDeviceId(currentProject.devices[0].id);
      setIsConsoleOpen(true);
    }
  };

  const handleCloseConsoleTab = (deviceId: string) => {
    const nextTabs = openConsoleDeviceIds.filter((id) => id !== deviceId);
    setOpenConsoleDeviceIds(nextTabs);
    if (activeConsoleDeviceId === deviceId) {
      setActiveConsoleDeviceId(nextTabs[0] || null);
    }
    if (nextTabs.length === 0) {
      setIsConsoleOpen(false);
    }
  };

  // CUSTOM TEMPLATE ADDITION
  const handleAddTemplate = (newTpl: DeviceTemplate) => {
    const updated = [newTpl, ...templates];
    setTemplates(updated);
    try {
      localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // SELECTED ITEMS
  const selectedDevice = currentProject.devices.find((d) => d.id === selectedDeviceId) || null;
  const selectedLink = currentProject.links.find((l) => l.id === selectedLinkId) || null;
  const isRunningAny = currentProject.devices.some((d) => d.status === 'running');

  // Overall topology lifecycle status
  const topologyStatus: 'running' | 'paused' | 'stopped' = useMemo(() => {
    if (currentProject.devices.length === 0) return 'stopped';
    const runningCount = currentProject.devices.filter((d) => d.status === 'running').length;
    const pausedCount = currentProject.devices.filter((d) => d.status === 'paused').length;

    if (runningCount > 0) return 'running';
    if (pausedCount > 0) return 'paused';
    return 'stopped';
  }, [currentProject.devices]);

  return (
    <div className="flex h-screen h-[100dvh] w-full max-w-full flex-col bg-[#080d17] text-slate-100 overflow-hidden font-sans select-none antialiased">
      {/* 1. Header & Primary Toolbars */}
      <TopMenuBar
        currentProject={currentProject}
        isRunningAny={isRunningAny}
        topologyStatus={topologyStatus}
        isCableToolActive={isCableToolActive}
        showInterfaceLabels={showInterfaceLabels}
        packetAnimationActive={packetAnimationActive}
        gridSnap={gridSnap}
        hasUnsavedChanges={hasUnsavedChanges}
        onNewProject={() => setIsProjectManagerOpen(true)}
        onOpenProjectModal={() => setIsProjectManagerOpen(true)}
        onSaveProject={handleSaveProject}
        onExportProject={handleExportProject}
        onImportProject={() => setIsProjectManagerOpen(true)}
        onStartAll={handleStartAll}
        onStopAll={handleStopAll}
        onRestartAll={handleRestartAll}
        onPauseAll={handlePauseAll}
        onToggleCableTool={() => {
          setIsCableToolActive((prev) => !prev);
          setCableSourceDevice(null);
        }}
        onToggleInterfaceLabels={() => setShowInterfaceLabels((prev) => !prev)}
        onTogglePacketAnimation={() => setPacketAnimationActive((prev) => !prev)}
        onToggleGridSnap={() => setGridSnap((prev) => !prev)}
        onOpenConsoleAll={handleOpenConsoleAll}
        onOpenImageManager={() => setIsImageManagerOpen(true)}
        onOpenNodeSelector={() => setIsNodeSelectorOpen(true)}
        onOpenPWAInstall={() => setIsPWAInstallOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onSelectPresetLab={(labId) => {
          const lab = PRESET_LABS.find((l) => l.id === labId);
          if (lab) handleLoadProject(lab);
        }}
      />

      {/* 2. Main Laboratory Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile backdrop overlay when side panels are open */}
        {(!leftPanelCollapsed || !rightPanelCollapsed) && (
          <div
            className="md:hidden absolute inset-0 z-20 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => {
              setLeftPanelCollapsed(true);
              setRightPanelCollapsed(true);
            }}
          />
        )}

        {/* Left: Device Library Panel */}
        <DeviceLibraryPanel
          templates={templates}
          onAddDevice={(tpl) => handleAddDeviceFromTemplate(tpl)}
          onOpenImageManager={() => setIsImageManagerOpen(true)}
          onOpenNodeSelector={() => setIsNodeSelectorOpen(true)}
          isCollapsed={leftPanelCollapsed}
          onToggleCollapse={() => setLeftPanelCollapsed((prev) => !prev)}
        />

        {/* Center: Interactive Topology Canvas */}
        <main className="flex-1 h-full relative overflow-hidden">
          {/* Floating Simulation State Feedback Toast */}
          {simulationToast && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none transition-all duration-300">
              <div
                className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold shadow-2xl backdrop-blur-md border ${
                  simulationToast.type === 'start'
                    ? 'bg-emerald-950/95 text-emerald-300 border-emerald-500/60 shadow-emerald-950/60'
                    : simulationToast.type === 'hold'
                    ? 'bg-amber-950/95 text-amber-300 border-amber-500/60 shadow-amber-950/60'
                    : 'bg-rose-950/95 text-rose-300 border-rose-500/60 shadow-rose-950/60'
                }`}
              >
                {simulationToast.type === 'start' && <Play className="h-4 w-4 fill-emerald-400 text-emerald-400 animate-pulse" />}
                {simulationToast.type === 'hold' && <Pause className="h-4 w-4 fill-amber-400 text-amber-400" />}
                {simulationToast.type === 'stop' && <Square className="h-4 w-4 fill-rose-400 text-rose-400" />}
                <span>{simulationToast.message}</span>
              </div>
            </div>
          )}

          <TopologyCanvas
            devices={currentProject.devices}
            links={currentProject.links}
            annotations={currentProject.annotations}
            selectedDeviceId={selectedDeviceId}
            selectedLinkId={selectedLinkId}
            isCableToolActive={isCableToolActive}
            cableSourceDevice={cableSourceDevice}
            showInterfaceLabels={showInterfaceLabels}
            packetAnimationActive={packetAnimationActive}
            simulatedPackets={simulatedPackets}
            gridSnap={gridSnap}
            onSelectDevice={(device) => {
              setSelectedDeviceId(device ? device.id : null);
              setSelectedLinkId(null);
            }}
            onSelectLink={(link) => {
              setSelectedLinkId(link ? link.id : null);
              setSelectedDeviceId(null);
            }}
            onMoveDevice={handleMoveDevice}
            onDeviceContextMenu={(e, device) => {
              e.preventDefault();
              setContextMenu({ x: e.clientX, y: e.clientY, device });
            }}
            onDeviceDoubleClick={(device) => handleOpenConsole(device)}
            onCableEndpointSelect={handleCableEndpointSelect}
            onDeleteLink={handleDeleteLink}
            onAddDeviceFromDrop={(tplId, x, y) => {
              const tpl = templates.find((t) => t.id === tplId);
              if (tpl) handleAddDeviceFromTemplate(tpl, x, y);
            }}
          />

          {/* Quick Floating Status Bar & Mobile Panel Toggles */}
          <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 py-1.5 px-3 shadow-xl backdrop-blur-md text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>{currentProject.devices.filter((d) => d.status === 'running').length} running</span>
              </span>
              <span className="text-slate-600">•</span>
              <span>{currentProject.links.length} virtual links</span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <button
                onClick={() => setIsPacketInspectorOpen(true)}
                className="hidden sm:flex items-center gap-1 text-sky-400 hover:text-sky-300 font-semibold"
              >
                <Activity className="h-3.5 w-3.5" />
                <span>Packets ({capturedPackets.length})</span>
              </button>
            </div>

            {/* Mobile / Quick Action Dock */}
            <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-xl backdrop-blur-md text-xs">
              <button
                onClick={() => setLeftPanelCollapsed((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  !leftPanelCollapsed ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
                title="Toggle Device Library"
              >
                + Devices
              </button>
              <button
                onClick={() => setRightPanelCollapsed((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  !rightPanelCollapsed ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
                title="Toggle Properties Panel"
              >
                Config
              </button>
              <button
                onClick={handleOpenConsoleAll}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  isConsoleOpen ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
                title="Open Terminal"
              >
                CLI
              </button>
            </div>
          </div>
        </main>

        {/* Right: Device & Cable Properties Panel */}
        <DevicePropertiesPanel
          selectedDevice={selectedDevice}
          selectedLink={selectedLink}
          project={currentProject}
          isCollapsed={rightPanelCollapsed}
          onToggleCollapse={() => setRightPanelCollapsed((prev) => !prev)}
          onUpdateDevice={handleUpdateDevice}
          onStartDevice={handleStartDevice}
          onStopDevice={handleStopDevice}
          onRestartDevice={handleRestartDevice}
          onDeleteDevice={handleDeleteDevice}
          onDuplicateDevice={handleDuplicateDevice}
          onOpenConsole={handleOpenConsole}
          onUpdateLink={handleUpdateLink}
          onDeleteLink={handleDeleteLink}
        />
      </div>

      {/* 3. Interactive CLI Terminal Dock */}
      <TerminalModal
        isOpen={isConsoleOpen}
        onClose={() => setIsConsoleOpen(false)}
        openDeviceIds={openConsoleDeviceIds}
        activeDeviceId={activeConsoleDeviceId}
        onSelectTab={(id) => setActiveConsoleDeviceId(id)}
        onCloseTab={handleCloseConsoleTab}
        allDevices={currentProject.devices}
        onUpdateDevice={handleUpdateDevice}
        onTriggerPacket={handleTriggerSimulatedPacket}
      />

      {/* 4. Cable Interface Port Selector Dialog */}
      {cableSourceDevice && cablePendingTarget && (
        <CablePortSelectorModal
          isOpen={true}
          sourceDevice={cableSourceDevice}
          targetDevice={cablePendingTarget}
          onClose={() => {
            setCablePendingTarget(null);
            setCableSourceDevice(null);
            setIsCableToolActive(false);
          }}
          onConfirm={handleConfirmCableConnection}
        />
      )}

      {/* 5. Device Image Manager Modal */}
      <ImageManagerModal
        isOpen={isImageManagerOpen}
        onClose={() => setIsImageManagerOpen(false)}
        onAddTemplate={handleAddTemplate}
        existingTemplates={templates}
      />

      {/* 6. Project & Lab Manager Modal */}
      <ProjectManagerModal
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        currentProjectId={currentProject.id}
        savedProjects={savedProjects}
        onLoadProject={handleLoadProject}
        onCreateProject={handleCreateNewProject}
        onDeleteProject={handleDeleteSavedProject}
        onExportProject={handleExportProject}
        onImportFile={handleImportFile}
      />

      {/* 7. Wireshark / Packet Inspector Modal */}
      <PacketInspectorModal
        isOpen={isPacketInspectorOpen}
        onClose={() => setIsPacketInspectorOpen(false)}
        links={currentProject.links}
        devices={currentProject.devices}
        capturedPackets={capturedPackets}
        onClearCapture={() => setCapturedPackets([])}
      />

      {/* 8. PWA & Mobile App Installation Modal */}
      <PWAInstallModal
        isOpen={isPWAInstallOpen}
        onClose={() => setIsPWAInstallOpen(false)}
      />

      {/* 9. Help & About Modal */}
      <HelpAboutModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onOpenPWAInstall={() => setIsPWAInstallOpen(true)}
      />

      {/* 10. Node Selector Modal (Router, Switch, Palo Alto, FortiGate, PC) */}
      <NodeSelectorModal
        isOpen={isNodeSelectorOpen}
        onClose={() => setIsNodeSelectorOpen(false)}
        templates={templates}
        onSelectNode={(tpl) => handleAddDeviceFromTemplate(tpl)}
      />

      {/* 11. Canvas Right-Click Context Menu */}
      {contextMenu && (
        <CanvasContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          device={contextMenu.device}
          onClose={() => setContextMenu(null)}
          onStart={handleStartDevice}
          onStop={handleStopDevice}
          onRestart={handleRestartDevice}
          onOpenConsole={handleOpenConsole}
          onStartCable={(dev) => {
            setIsCableToolActive(true);
            setCableSourceDevice(dev);
          }}
          onDuplicate={handleDuplicateDevice}
          onDelete={handleDeleteDevice}
        />
      )}
    </div>
  );
}
