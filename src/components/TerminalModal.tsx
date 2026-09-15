import React, { useState, useEffect, useRef } from 'react';
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

  const terminalEndRef = useRef<HTMLDivElement>(null);
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

        const initialBanner =
          dev.config.osType === 'generic_linux'
            ? [
                `ENSv1 Virtual Workstation Linux Terminal [Device: ${dev.name}]`,
                `Type "help" for network diagnosis commands (ping, ip a, traceroute, curl).`,
                ``,
              ]
            : [
                `ENSv1 Interactive Console Subsystem [Device: ${dev.name}]`,
                `Operating System: Cisco IOS / Quagga Virtual Machine Engine`,
                `Type "enable" for privileged commands, "show ip int br" for interfaces, "help" for command list.`,
                ``,
              ];

        setTerminalLogs((prev) => ({
          ...prev,
          [id]: initialBanner,
        }));
      }
    });
  }, [openDeviceIds, allDevices]);

  // Scroll to bottom on log updates
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs, activeDeviceId]);

  // Focus input when tab changes
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

    // Handle clear screen
    if (result.output.length === 1 && result.output[0] === '__CLEAR__') {
      setTerminalLogs((prev) => ({
        ...prev,
        [activeDevice.id]: [],
      }));
    } else {
      setTerminalLogs((prev) => ({
        ...prev,
        [activeDevice.id]: [...(prev[activeDevice.id] || []), cmdLine, ...result.output],
      }));
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
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
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
  };

  // Quick command suggestions
  const quickCommands =
    activeDevice.config.osType === 'generic_linux'
      ? ['ip a', 'ip route', 'ifconfig', 'ping 192.168.1.1', 'curl 192.168.1.1', 'clear']
      : ['en', 'conf t', 'sh ip int br', 'sh ip ro', 'sh run', 'ping 192.168.1.1', 'clear'];

  return (
    <div
      className={`fixed z-40 flex flex-col bg-slate-950 border border-slate-700 shadow-2xl overflow-hidden transition-all duration-200 ${
        isMaximized
          ? 'inset-3 rounded-2xl'
          : 'bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[750px] md:h-[450px] rounded-2xl'
      }`}
      id="ensv1-interactive-terminal"
    >
      {/* Tab bar header */}
      <div className="flex items-center justify-between bg-slate-900 border-b border-slate-800 px-3 py-1.5 select-none">
        {/* Device tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[80%]">
          {openDeviceIds.map((devId) => {
            const dev = allDevices.find((d) => d.id === devId);
            if (!dev) return null;
            const isActive = dev.id === activeDeviceId;

            return (
              <div
                key={dev.id}
                onClick={() => onSelectTab(dev.id)}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition ${
                  isActive
                    ? 'bg-slate-950 text-sky-400 border border-slate-700 shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <TerminalIcon className="h-3 w-3" />
                <span>{dev.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(dev.id);
                  }}
                  className="p-0.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Window controls */}
        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={handleCopyLogs}
            title="Copy Terminal Logs"
            className="p-1 rounded hover:bg-slate-800 hover:text-white relative"
          >
            {copiedToast ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={handleClearLogs}
            title="Clear Console"
            className="p-1 rounded hover:bg-slate-800 hover:text-white"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? 'Restore' : 'Maximize'}
            className="p-1 rounded hover:bg-slate-800 hover:text-white"
          >
            {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={onClose}
            title="Close Terminal Window"
            className="p-1 rounded hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Quick Action Chips Bar */}
      <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/60 border-b border-slate-800/80 overflow-x-auto text-[11px] font-mono select-none">
        <span className="text-slate-500 text-[10px] uppercase font-sans font-semibold">Quick:</span>
        {quickCommands.map((qCmd) => (
          <button
            key={qCmd}
            onClick={() => handleSendCommand(qCmd)}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-sky-600/30 hover:text-sky-300 text-slate-300 transition whitespace-nowrap"
          >
            {qCmd}
          </button>
        ))}
      </div>

      {/* Terminal Screen (Monospace Canvas) */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="flex-1 overflow-y-auto p-4 font-mono text-xs text-emerald-400 bg-[#050911] leading-relaxed cursor-text"
      >
        {currentLogs.map((line, idx) => (
          <div key={idx} className="whitespace-pre-wrap">
            {line}
          </div>
        ))}

        {/* Active Prompt & Input Line */}
        <div className="flex items-center mt-1">
          <span className="text-sky-400 font-bold select-none shrink-0">{currentPrompt}</span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-emerald-300 font-mono text-xs pl-1 caret-white"
            autoFocus
          />
        </div>
        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Input Bar at Bottom (for touch / mobile ease) */}
      <div className="flex items-center gap-2 p-2 bg-slate-900 border-t border-slate-800">
        <span className="text-xs text-slate-500 font-mono pl-2 hidden sm:inline">{currentPrompt}</span>
        <input
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Type command or "help" for ${activeDevice.name}...`}
          className="flex-1 rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
        />
        <button
          onClick={() => handleSendCommand()}
          className="flex items-center gap-1 rounded-lg bg-sky-600 hover:bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white transition active:scale-95"
        >
          <Send className="h-3 w-3" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
    </div>
  );
};
