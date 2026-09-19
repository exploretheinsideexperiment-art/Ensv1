import React, { useState, useEffect, useRef, memo } from 'react';
import {
  Terminal as TerminalIcon,
  X,
  Maximize2,
  Minimize2,
  Send,
  Trash2,
  Copy,
  Check,
} from 'lucide-react';
import { NetworkDevice, SimulatedPacket } from '../types/network';
import { NetworkCLI, CliSessionState } from '../utils/cliParser';

const MAX_LOG_LINES = 350;

// Memoized logs list so typing into input doesn't re-render hundreds of log DOM nodes
const TerminalLogsList = memo(({ logs }: { logs: string[] }) => {
  return (
    <div className="space-y-0.5 select-text">
      {logs.map((line, idx) => (
        <div key={idx} className="whitespace-pre-wrap break-all">
          {line}
        </div>
      ))}
    </div>
  );
});
TerminalLogsList.displayName = 'TerminalLogsList';

interface TerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  openDeviceIds: string[];
  activeDeviceId: string | null;
  onSelectTab: (deviceId: string) => void;
  onCloseTab: (deviceId: string) => void;
  allDevices: NetworkDevice[];
  onUpdateDevice: (updated: NetworkDevice) => void;
  onTriggerPacket: (packet: Omit<SimulatedPacket, 'id' | 'timestamp' | 'progress'>) => void;
}

export const TerminalModal: React.FC<TerminalModalProps> = ({
  isOpen,
  onClose,
  openDeviceIds,
  activeDeviceId,
  onSelectTab,
  onCloseTab,
  allDevices,
  onUpdateDevice,
  onTriggerPacket,
}) => {
  const [sessions, setSessions] = useState<{ [deviceId: string]: CliSessionState }>({});
  const [terminalLogs, setTerminalLogs] = useState<{ [deviceId: string]: string[] }>({});
  const [currentInput, setCurrentInput] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Active Device
  const activeDevice = allDevices.find((d) => d.id === activeDeviceId);

  // Initialize session for device when opened
  useEffect(() => {
    openDeviceIds.forEach((id) => {
      const dev = allDevices.find((d) => d.id === id);
      if (dev && !sessions[id]) {
        const initialSession: CliSessionState = {
          deviceId: id,
          mode: 'user',
          history: [],
          historyIndex: -1,
        };
        setSessions((prev) => ({ ...prev, [id]: initialSession }));

        let initialBanner: string[] = [];
        if (dev.config.osType === 'palo_alto') {
          initialBanner = [
            `==================================================================`,
            `Palo Alto Networks PA-VM Virtual Appliance (PAN-OS 11.1.0)`,
            `Device Hostname: ${dev.name} | Vendor: Palo Alto Networks, Inc.`,
            `Type "show interface all", "show system info", "configure", or "ping <ip>".`,
            `==================================================================`,
            ``,
          ];
        } else if (dev.config.osType === 'fortigate') {
          initialBanner = [
            `==================================================================`,
            `Fortinet FortiGate-VM64-KVM (FortiOS 7.4.2)`,
            `Device Hostname: ${dev.name} | Security Fabric Subsystem Active`,
            `Type "get system status", "show system interface", or "execute ping <ip>".`,
            `==================================================================`,
            ``,
          ];
        } else if (dev.config.osType === 'windows') {
          initialBanner = [
            `Microsoft Windows [Version 10.0.26100.1]`,
            `(c) Microsoft Corporation. All rights reserved.`,
            `Lab Client: ${dev.name}`,
            `Type "ipconfig", "ping <ip>", "tracert <ip>", or "help".`,
            ``,
          ];
        } else if (dev.config.osType === 'generic_linux') {
          initialBanner = [
            `ENSv1 Virtual Workstation Linux Terminal [Device: ${dev.name}]`,
            `Type "help" for network diagnosis commands (ping, ip a, traceroute, curl).`,
            ``,
          ];
        } else {
          initialBanner = [
            `ENSv1 Interactive Console Subsystem [Device: ${dev.name}]`,
            `Operating System: Cisco IOS / Quagga Virtual Machine Engine`,
            `Type "enable" for privileged commands, "show ip int br" for interfaces, "help" for command list.`,
            ``,
          ];
        }

        setTerminalLogs((prev) => ({
          ...prev,
          [id]: initialBanner,
        }));
      }
    });
  }, [openDeviceIds, allDevices]);

  // Instant smooth auto-scroll to bottom on log updates without blocking UI
  useEffect(() => {
    if (scrollContainerRef.current) {
      const el = scrollContainerRef.current;
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [terminalLogs, activeDeviceId]);

  // Focus input when tab changes or opens
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeDeviceId, isOpen]);

  if (!isOpen || !activeDevice || openDeviceIds.length === 0) return null;

  const currentSession = sessions[activeDevice.id] || {
    deviceId: activeDevice.id,
    mode: 'user',
    history: [],
    historyIndex: -1,
  };

  const currentPrompt = NetworkCLI.getPrompt(activeDevice, currentSession);
  const currentLogs = terminalLogs[activeDevice.id] || [];

  const handleSendCommand = (cmdToRun?: string) => {
    const command = (cmdToRun !== undefined ? cmdToRun : currentInput).trim();
    if (!command && cmdToRun === undefined) return;

    // Add command with prompt to log
    const cmdLine = `${currentPrompt}${command}`;

    // Execute through CLI Parser
    const result = NetworkCLI.execute(command, activeDevice, currentSession, allDevices);

    // Update history
    const updatedHistory = [...currentSession.history, command];
    currentSession.history = updatedHistory;
    currentSession.historyIndex = updatedHistory.length;

    // Handle clear screen or append logs with strict buffer capping
    if (result.output.length === 1 && result.output[0] === '__CLEAR__') {
      setTerminalLogs((prev) => ({
        ...prev,
        [activeDevice.id]: [],
      }));
    } else {
      setTerminalLogs((prev) => {
        const existing = prev[activeDevice.id] || [];
        const combined = [...existing, cmdLine, ...result.output];
        const capped = combined.length > MAX_LOG_LINES ? combined.slice(-MAX_LOG_LINES) : combined;
        return {
          ...prev,
          [activeDevice.id]: capped,
        };
      });
    }

    // Apply any device state updates (e.g., hostname change, IP configuration, no shutdown)
    if (result.updatedDevice) {
      onUpdateDevice({ ...activeDevice, ...result.updatedDevice });
    }

    // Trigger visual packet animation if ping packet was emitted
    if (result.newPacket) {
      onTriggerPacket(result.newPacket);
    }

    setCurrentInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const hist = currentSession.history;
      if (hist.length > 0 && currentSession.historyIndex > 0) {
        currentSession.historyIndex -= 1;
        setCurrentInput(hist[currentSession.historyIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const hist = currentSession.history;
      if (currentSession.historyIndex < hist.length - 1) {
        currentSession.historyIndex += 1;
        setCurrentInput(hist[currentSession.historyIndex] || '');
      } else {
        currentSession.historyIndex = hist.length;
        setCurrentInput('');
      }
    }
  };

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(currentLogs.join('\n'));
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 1500);
  };

  const handleClearLogs = () => {
    setTerminalLogs((prev) => ({ ...prev, [activeDevice.id]: [] }));
    inputRef.current?.focus();
  };

  // Quick command suggestions
  const quickCommands =
    activeDevice.config.osType === 'generic_linux'
      ? ['ip a', 'ip route', 'ifconfig', 'ping 192.168.1.1', 'curl 192.168.1.1', 'clear']
      : ['en', 'conf t', 'int e0', 'no shut', 'sh ip int br', 'sh ip ro', 'ping 10.0.0.2', 'clear'];

  return (
    <div
      className={`fixed z-40 flex flex-col bg-slate-950 border border-slate-700/80 shadow-2xl overflow-hidden transition-all duration-150 ${
        isMaximized
          ? 'inset-3 rounded-2xl h-[calc(100vh-1.5rem)] max-h-[calc(100vh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)]'
          : 'bottom-4 left-4 right-4 md:left-auto md:right-4 w-[calc(100vw-2rem)] md:w-[760px] max-w-[760px] h-[420px] min-h-[420px] max-h-[420px] rounded-2xl'
      }`}
      id="ensv1-interactive-terminal"
      style={{ boxSizing: 'border-box' }}
    >
      {/* Tab bar header (Strict fixed height 40px - NEVER GROWS) */}
      <div className="shrink-0 flex items-center justify-between bg-slate-900 border-b border-slate-800 px-3 py-1 select-none h-10 min-h-[40px] max-h-[40px]">
        {/* Device tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[70%] sm:max-w-[78%]">
          {openDeviceIds.map((devId) => {
            const dev = allDevices.find((d) => d.id === devId);
            if (!dev) return null;
            const isActive = dev.id === activeDeviceId;

            return (
              <div
                key={dev.id}
                onClick={() => onSelectTab(dev.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition shrink-0 max-w-[140px] ${
                  isActive
                    ? 'bg-slate-950 text-sky-400 border border-slate-700 shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <TerminalIcon className="h-3 w-3 shrink-0" />
                <span className="truncate">{dev.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(dev.id);
                  }}
                  className="p-0.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-200 shrink-0"
                  title="Close Tab"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Window controls */}
        <div className="flex items-center gap-1 text-slate-400 shrink-0">
          <button
            type="button"
            onClick={handleCopyLogs}
            title="Copy Terminal Logs"
            className="p-1 rounded hover:bg-slate-800 hover:text-white relative transition"
          >
            {copiedToast ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleClearLogs}
            title="Clear Console"
            className="p-1 rounded hover:bg-slate-800 hover:text-white transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? 'Restore' : 'Maximize'}
            className="p-1 rounded hover:bg-slate-800 hover:text-white transition"
          >
            {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close Terminal Window"
            className="p-1 rounded hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Quick Action Chips Bar (Strict fixed height 32px) */}
      <div className="shrink-0 flex items-center gap-1.5 px-3 bg-slate-900/70 border-b border-slate-800/80 overflow-x-auto text-[11px] font-mono select-none h-8 min-h-[32px] max-h-[32px] no-scrollbar">
        <span className="text-slate-500 text-[10px] uppercase font-sans font-semibold shrink-0">Quick:</span>
        {quickCommands.map((qCmd) => (
          <button
            key={qCmd}
            type="button"
            onClick={() => handleSendCommand(qCmd)}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-sky-600/30 hover:text-sky-300 text-slate-300 transition whitespace-nowrap shrink-0 text-[11px]"
          >
            {qCmd}
          </button>
        ))}
      </div>

      {/* Terminal Screen (Strict flex-1 min-h-0 h-0 overflow-y-auto overscroll-contain - NEVER GROWS WINDOW HEIGHT) */}
      <div
        ref={scrollContainerRef}
        onClick={() => inputRef.current?.focus()}
        className="flex-1 min-h-0 h-0 overflow-y-auto overscroll-contain p-3.5 font-mono text-xs text-emerald-400 bg-[#050911] leading-relaxed cursor-text select-text"
      >
        <TerminalLogsList logs={currentLogs} />

        {/* Current active prompt indicator at bottom of buffer */}
        <div className="flex items-center gap-1.5 mt-1 select-none text-xs font-mono">
          <span className="text-sky-400 font-bold">{currentPrompt}</span>
          <span className="w-2 h-3.5 bg-emerald-400 inline-block animate-pulse align-middle" />
        </div>
      </div>

      {/* Terminal Input Bar at Bottom (Strict fixed height 48px - NEVER GROWS) */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 bg-slate-900 border-t border-slate-800 h-12 min-h-[48px] max-h-[48px]">
        <span className="text-xs text-sky-400 font-bold font-mono pl-1 hidden sm:inline shrink-0 select-none">
          {currentPrompt}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Enter command (e.g. no shut, sh ip int br, ping)...`}
          className="flex-1 rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500 placeholder:text-slate-600"
          autoFocus
          spellCheck={false}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => handleSendCommand()}
          className="shrink-0 flex items-center gap-1 rounded-lg bg-sky-600 hover:bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white transition active:scale-95 shadow-sm"
        >
          <Send className="h-3 w-3" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
    </div>
  );
};
