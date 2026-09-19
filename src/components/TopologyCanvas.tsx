import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Trash2, X, Link as LinkIcon, Server, Terminal, Play, Square } from 'lucide-react';
import {
  NetworkDevice,
  NetworkLink,
  SimulatedPacket,
  LabAnnotation,
  InterfaceStatus,
} from '../types/network';
import { DeviceNode } from './DeviceNode';

interface TopologyCanvasProps {
  devices: NetworkDevice[];
  links: NetworkLink[];
  annotations: LabAnnotation[];
  selectedDeviceId: string | null;
  selectedLinkId: string | null;
  selectedDeviceIds?: string[];
  selectedLinkIds?: string[];
  isCableToolActive: boolean;
  cableSourceDevice: NetworkDevice | null;
  showInterfaceLabels: boolean;
  packetAnimationActive: boolean;
  simulatedPackets: SimulatedPacket[];
  gridSnap: boolean;
  onSelectDevice: (device: NetworkDevice | null, multi?: boolean) => void;
  onSelectLink: (link: NetworkLink | null, multi?: boolean) => void;
  onDeleteSelected?: () => void;
  onClearSelection?: () => void;
  onMoveDevice: (deviceId: string, x: number, y: number) => void;
  onDeviceContextMenu: (e: React.MouseEvent, device: NetworkDevice) => void;
  onDeviceDoubleClick: (device: NetworkDevice) => void;
  onCableEndpointSelect: (device: NetworkDevice, interfaceId?: string) => void;
  onDeleteLink: (linkId: string) => void;
  onLinkContextMenu?: (e: React.MouseEvent, link: NetworkLink) => void;
  onAddDeviceFromDrop?: (tplId: string, x: number, y: number) => void;
  onCanvasContextMenu?: (e: React.MouseEvent, canvasCoords: { x: number; y: number }) => void;
}

export const TopologyCanvas: React.FC<TopologyCanvasProps> = ({
  devices,
  links,
  annotations,
  selectedDeviceId,
  selectedLinkId,
  selectedDeviceIds = [],
  selectedLinkIds = [],
  isCableToolActive,
  cableSourceDevice,
  showInterfaceLabels,
  packetAnimationActive,
  simulatedPackets,
  gridSnap,
  onSelectDevice,
  onSelectLink,
  onDeleteSelected,
  onClearSelection,
  onMoveDevice,
  onDeviceContextMenu,
  onDeviceDoubleClick,
  onCableEndpointSelect,
  onDeleteLink,
  onLinkContextMenu,
  onAddDeviceFromDrop,
  onCanvasContextMenu,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 30 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Dragging device state
  const [draggingDeviceId, setDraggingDeviceId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Mouse position on canvas (for drawing dynamic cable preview)
  const [mouseCanvasPos, setMouseCanvasPos] = useState({ x: 0, y: 0 });

  // Handle canvas mouse move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const curCanvasX = (e.clientX - rect.left - pan.x) / zoom;
    const curCanvasY = (e.clientY - rect.top - pan.y) / zoom;

    setMouseCanvasPos({ x: curCanvasX, y: curCanvasY });

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (draggingDeviceId) {
      let nextX = curCanvasX - dragOffset.x;
      let nextY = curCanvasY - dragOffset.y;

      if (gridSnap) {
        nextX = Math.round(nextX / 20) * 20;
        nextY = Math.round(nextY / 20) * 20;
      }

      onMoveDevice(draggingDeviceId, Math.max(20, nextX), Math.max(20, nextY));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Canvas background click (or middle click / spacebar)
    if (e.button === 1 || e.button === 0 && (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      onSelectDevice(null);
      onSelectLink(null);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingDeviceId(null);
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(0.4, zoom * zoomFactor), 2.5);
    setZoom(newZoom);
  };

  // Drag and drop from device library
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const tplId = e.dataTransfer.getData('application/ensv1-template-id');
    if (!tplId || !containerRef.current || !onAddDeviceFromDrop) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dropX = (e.clientX - rect.left - pan.x) / zoom;
    const dropY = (e.clientY - rect.top - pan.y) / zoom;

    const finalX = gridSnap ? Math.round(dropX / 20) * 20 : dropX;
    const finalY = gridSnap ? Math.round(dropY / 20) * 20 : dropY;

    onAddDeviceFromDrop(tplId, finalX - 40, finalY - 35);
  };

  // Touch handling for mobile pinch zoom & pan
  const touchState = useRef<{ lastDist: number; lastX: number; lastY: number }>({
    lastDist: 0,
    lastX: 0,
    lastY: 0,
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchState.current.lastDist = Math.hypot(dx, dy);
    } else if (e.touches.length === 1) {
      touchState.current.lastX = e.touches[0].clientX - pan.x;
      touchState.current.lastY = e.touches[0].clientY - pan.y;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (touchState.current.lastDist > 0) {
        const factor = dist / touchState.current.lastDist;
        setZoom((prev) => Math.min(Math.max(0.4, prev * factor), 2.5));
      }
      touchState.current.lastDist = dist;
    } else if (e.touches.length === 1 && !draggingDeviceId) {
      setPan({
        x: e.touches[0].clientX - touchState.current.lastX,
        y: e.touches[0].clientY - touchState.current.lastY,
      });
    }
  };

  // Device dragging init
  const handleDeviceMouseDown = (e: React.MouseEvent, device: NetworkDevice) => {
    e.stopPropagation();
    if (isCableToolActive) {
      onCableEndpointSelect(device);
      return;
    }

    if (e.button === 0) {
      const isMulti = e.shiftKey || e.ctrlKey || e.metaKey;
      onSelectDevice(device, isMulti);
      setDraggingDeviceId(device.id);
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const curCanvasX = (e.clientX - rect.left - pan.x) / zoom;
        const curCanvasY = (e.clientY - rect.top - pan.y) / zoom;
        setDragOffset({
          x: curCanvasX - device.x,
          y: curCanvasY - device.y,
        });
      }
    }
  };

  // Build device lookup map
  const deviceMap = useMemo(() => {
    const map = new Map<string, NetworkDevice>();
    (devices || []).forEach((d) => map.set(d.id, d));
    return map;
  }, [devices]);

  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement | SVGElement;
    if (target.closest && (target.closest('[id^="device-node-"]') || target.closest('.device-node-container'))) {
      return;
    }
    e.preventDefault();
    if (onCanvasContextMenu && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = (e.clientX - rect.left - pan.x) / zoom;
      const clickY = (e.clientY - rect.top - pan.y) / zoom;
      onCanvasContextMenu(e, { x: Math.round(clickX), y: Math.round(clickY) });
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onContextMenu={handleCanvasContextMenu}
      className={`relative w-full h-full overflow-hidden select-none bg-[#090e17] ${
        isPanning ? 'cursor-grab active:cursor-grabbing' : isCableToolActive ? 'cursor-crosshair' : 'cursor-default'
      }`}
      id="ensv1-topology-workspace"
    >
      {/* Background Engineering Grid (Pattern) */}
      <svg
        className="w-full h-full absolute inset-0 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="smallGrid"
            width={20 * zoom}
            height={20 * zoom}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${pan.x}, ${pan.y})`}
          >
            <path
              d={`M ${20 * zoom} 0 L 0 0 0 ${20 * zoom}`}
              fill="none"
              stroke="#1e293b"
              strokeWidth="0.5"
              strokeOpacity="0.4"
            />
          </pattern>
          <pattern
            id="largeGrid"
            width={100 * zoom}
            height={100 * zoom}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${pan.x}, ${pan.y})`}
          >
            <rect width={100 * zoom} height={100 * zoom} fill="url(#smallGrid)" />
            <path
              d={`M ${100 * zoom} 0 L 0 0 0 ${100 * zoom}`}
              fill="none"
              stroke="#334155"
              strokeWidth="0.8"
              strokeOpacity="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#largeGrid)" />
      </svg>

      {/* Main SVG Interactive Surface */}
      <svg
        className="w-full h-full absolute inset-0"
        style={{
          transformOrigin: '0 0',
        }}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* 1. Annotations Layer */}
          {(annotations || []).map((anno) => (
            <g key={anno.id} transform={`translate(${anno.x}, ${anno.y})`}>
              {anno.type === 'text' && (
                <text
                  x="0"
                  y="0"
                  fill={anno.color || '#94a3b8'}
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="monospace"
                >
                  {anno.text}
                </text>
              )}
            </g>
          ))}

          {/* 2. Virtual Cables & Links Layer */}
          {(links || []).map((link) => {
            const src = deviceMap.get(link.sourceDeviceId);
            const tgt = deviceMap.get(link.targetDeviceId);
            if (!src || !tgt) return null;

            // Center coords of source and target
            const x1 = src.x + 40;
            const y1 = src.y + 35;
            const x2 = tgt.x + 40;
            const y2 = tgt.y + 35;

            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            const isLinkSelected = selectedLinkId === link.id || selectedLinkIds.includes(link.id);

            // Find exact interface objects on both sides
            const srcIf = src.config?.interfaces?.find(
              (i) => i.id === link.sourceInterfaceId || i.name === link.sourceInterfaceName
            );
            const tgtIf = tgt.config?.interfaces?.find(
              (i) => i.id === link.targetInterfaceId || i.name === link.targetInterfaceName
            );

            // Compute port status for LED indicator:
            // - Powered off device -> Red (#ef4444)
            // - Paused device -> Amber (#f59e0b)
            // - Running device:
            //     - If interface status is 'up' -> Green (#22c55e)
            //     - If interface status is 'down' / 'admin_down' -> Red (#ef4444)
            //     - On routers, unconfigured interfaces default to down (Red)
            const getPortLed = (device: NetworkDevice, iface?: typeof srcIf) => {
              if (device.status === 'stopped') {
                return { color: '#ef4444', label: 'Device Powered Off' };
              }
              if (device.status === 'paused') {
                return { color: '#f59e0b', label: 'Device on Hold / Paused' };
              }
              if (iface) {
                if (iface.status === 'up') {
                  return { color: '#22c55e', label: `${iface.name}: UP (Active / No Shutdown)` };
                }
                return { color: '#ef4444', label: `${iface.name}: DOWN (Administratively down / Shutdown)` };
              }
              if (device.type === 'router') {
                return { color: '#ef4444', label: 'Router Port: DOWN (Default / Shutdown)' };
              }
              return { color: '#22c55e', label: 'Port UP' };
            };

            const srcLed = getPortLed(src, srcIf);
            const tgtLed = getPortLed(tgt, tgtIf);

            const isSourceUp = src.status === 'running' && srcIf?.status === 'up';
            const isTargetUp = tgt.status === 'running' && tgtIf?.status === 'up';
            const isRunning = link.status === 'up' && isSourceUp && isTargetUp;
            const isHeld = (src.status === 'paused' || tgt.status === 'paused') && isSourceUp && isTargetUp;
            const isUp = isRunning || isHeld;

            // Cable style based on link type and active state
            let strokeColor = '#334155';
            let strokeWidth = 2.5;
            let strokeDash: string | undefined = undefined;

            if (link.type === 'fiber') {
              strokeColor = isUp ? (isHeld ? '#d97706' : '#f59e0b') : '#78350f'; // Amber fiber
              strokeWidth = 3;
            } else if (link.type === 'serial') {
              strokeColor = isUp ? '#ef4444' : '#7f1d1d'; // Red serial
              strokeDash = '6 3';
            } else if (link.type === 'gigabit') {
              strokeColor = isRunning ? '#0284c7' : isHeld ? '#d97706' : '#334155'; // Sky blue / Amber / Dark slate
              strokeWidth = 2.8;
            }

            return (
              <g
                key={link.id}
                onClick={(e) => {
                  e.stopPropagation();
                  const isMulti = e.shiftKey || e.ctrlKey || e.metaKey;
                  onSelectLink(link, isMulti);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onLinkContextMenu?.(e, link);
                }}
                className="cursor-pointer group"
                id={`network-link-${link.id}`}
              >
                {/* Thick invisible click hit-area */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="transparent"
                  strokeWidth="16"
                />

                {/* Cable Selection Glow */}
                {isLinkSelected && (
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#38bdf8"
                    strokeWidth={strokeWidth + 4}
                    strokeOpacity="0.6"
                  />
                )}

                {/* The Virtual Cable Line */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDash}
                  className="transition-colors group-hover:stroke-sky-400"
                />

                {/* Interface status dots on ends (Green when UP, Red when DOWN/Shutdown) */}
                {/* Source interface LED */}
                <circle
                  cx={x1 + (x2 - x1) * 0.18}
                  cy={y1 + (y2 - y1) * 0.18}
                  r="4.5"
                  fill={srcLed.color}
                  stroke="#0f172a"
                  strokeWidth="1.2"
                  className="transition-colors duration-200"
                >
                  <title>{`${src.name} [${link.sourceInterfaceName}]: ${srcLed.label}`}</title>
                </circle>
                {/* Target interface LED */}
                <circle
                  cx={x2 - (x2 - x1) * 0.18}
                  cy={y2 - (y2 - y1) * 0.18}
                  r="4.5"
                  fill={tgtLed.color}
                  stroke="#0f172a"
                  strokeWidth="1.2"
                  className="transition-colors duration-200"
                >
                  <title>{`${tgt.name} [${link.targetInterfaceName}]: ${tgtLed.label}`}</title>
                </circle>

                {/* Interface labels along link */}
                {showInterfaceLabels && (
                  <>
                    {/* Source label badge */}
                    <g transform={`translate(${x1 + (x2 - x1) * 0.22}, ${y1 + (y2 - y1) * 0.22})`}>
                      <rect x="-14" y="-8" width="28" height="14" rx="3" fill="#020617" fillOpacity="0.85" stroke="#334155" strokeWidth="0.8" />
                      <text x="0" y="2.5" textAnchor="middle" fill="#93c5fd" fontSize="8" fontFamily="monospace" fontWeight="bold">
                        {link.sourceInterfaceName}
                      </text>
                    </g>
                    {/* Target label badge */}
                    <g transform={`translate(${x2 - (x2 - x1) * 0.22}, ${y2 - (y2 - y1) * 0.22})`}>
                      <rect x="-14" y="-8" width="28" height="14" rx="3" fill="#020617" fillOpacity="0.85" stroke="#334155" strokeWidth="0.8" />
                      <text x="0" y="2.5" textAnchor="middle" fill="#93c5fd" fontSize="8" fontFamily="monospace" fontWeight="bold">
                        {link.targetInterfaceName}
                      </text>
                    </g>
                  </>
                )}

                {/* Live Traffic Badge at cable midpoint */}
                {isUp && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-24"
                      y="-9"
                      width="48"
                      height="16"
                      rx="4"
                      fill="#090e17"
                      fillOpacity="0.9"
                      stroke={isHeld ? '#f59e0b' : '#1e293b'}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="2"
                      textAnchor="middle"
                      fill={isHeld ? '#fbbf24' : '#64748b'}
                      fontSize="8"
                      fontFamily="monospace"
                      fontWeight={isHeld ? 'bold' : 'normal'}
                    >
                      {isHeld ? 'HOLD' : `${(link.currentTrafficMbps ?? 0).toFixed(1)} Mbps`}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* 3. Dynamic Cable In-Progress Drawing Preview */}
          {isCableToolActive && cableSourceDevice && (
            <g pointerEvents="none">
              <line
                x1={cableSourceDevice.x + 40}
                y1={cableSourceDevice.y + 35}
                x2={mouseCanvasPos.x}
                y2={mouseCanvasPos.y}
                stroke="#fbbf24"
                strokeWidth="2.5"
                strokeDasharray="5 3"
              />
              <circle
                cx={mouseCanvasPos.x}
                cy={mouseCanvasPos.y}
                r="6"
                fill="#fbbf24"
                fillOpacity="0.6"
              />
            </g>
          )}

          {/* 4. Animated Simulated Packets Moving Along Links */}
          {packetAnimationActive &&
            (simulatedPackets || []).map((pkt) => {
              const src = deviceMap.get(pkt.sourceDeviceId);
              const tgt = deviceMap.get(pkt.targetDeviceId);
              if (!src || !tgt) return null;

              const x1 = src.x + 40;
              const y1 = src.y + 35;
              const x2 = tgt.x + 40;
              const y2 = tgt.y + 35;

              // Calculate current position based on progress (0 to 1)
              const curX = x1 + (x2 - x1) * pkt.progress;
              const curY = y1 + (y2 - y1) * pkt.progress;

              const pktColor =
                pkt.protocol === 'ICMP'
                  ? '#38bdf8'
                  : pkt.protocol === 'OSPF'
                  ? '#34d399'
                  : pkt.protocol === 'BGP'
                  ? '#a78bfa'
                  : pkt.protocol === 'ARP'
                  ? '#fbbf24'
                  : '#f43f5e';

              return (
                <g key={pkt.id} transform={`translate(${curX}, ${curY})`} pointerEvents="none">
                  {/* Packet Pulse Glow */}
                  <circle cx="0" cy="0" r="7" fill={pktColor} fillOpacity="0.3" className="animate-ping" />
                  <circle cx="0" cy="0" r="5" fill={pktColor} stroke="#ffffff" strokeWidth="1.5" />
                  {/* Packet Protocol Tag */}
                  <rect x="-14" y="-18" width="28" height="12" rx="3" fill="#0f172a" stroke={pktColor} strokeWidth="0.8" />
                  <text x="0" y="-9" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold" fontFamily="monospace">
                    {pkt.protocol}
                  </text>
                </g>
              );
            })}

          {/* 5. Device Hardware Nodes Layer */}
          {(devices || []).map((dev) => (
            <DeviceNode
              key={dev.id}
              device={dev}
              isSelected={selectedDeviceId === dev.id || selectedDeviceIds.includes(dev.id)}
              isConnectingCable={isCableToolActive}
              isCableSource={cableSourceDevice?.id === dev.id}
              showInterfaceLabels={showInterfaceLabels}
              onSelect={(e) => handleDeviceMouseDown(e, dev)}
              onContextMenu={(e) => onDeviceContextMenu(e, dev)}
              onDoubleClick={() => onDeviceDoubleClick(dev)}
              onInterfaceClick={(d, ifaceId) => {
                if (isCableToolActive) {
                  onCableEndpointSelect(d, ifaceId);
                }
              }}
            />
          ))}
        </g>
      </svg>

      {/* Floating Selection & Delete Action Bar (Shows count of selected nodes & cables + Quick Delete) */}
      {(() => {
        const devCount = selectedDeviceIds.length > 0 ? selectedDeviceIds.length : selectedDeviceId ? 1 : 0;
        const linkCount = selectedLinkIds.length > 0 ? selectedLinkIds.length : selectedLinkId ? 1 : 0;
        const totalCount = devCount + linkCount;

        if (totalCount === 0 || isCableToolActive) return null;

        let summaryText = '';
        if (devCount === 1 && linkCount === 0) {
          const activeDevId = selectedDeviceIds[0] || selectedDeviceId;
          const dev = devices.find((d) => d.id === activeDevId);
          summaryText = dev ? `Node: ${dev.name}` : '1 Node';
        } else if (linkCount === 1 && devCount === 0) {
          const activeLinkId = selectedLinkIds[0] || selectedLinkId;
          const lk = links.find((l) => l.id === activeLinkId);
          if (lk) {
            const sDev = devices.find((d) => d.id === lk.sourceDeviceId);
            const tDev = devices.find((d) => d.id === lk.targetDeviceId);
            summaryText = sDev && tDev ? `Cable: ${sDev.name} ↔ ${tDev.name}` : '1 Cable';
          } else {
            summaryText = '1 Cable';
          }
        } else {
          const parts: string[] = [];
          if (devCount > 0) parts.push(`${devCount} ${devCount === 1 ? 'Node' : 'Nodes'}`);
          if (linkCount > 0) parts.push(`${linkCount} ${linkCount === 1 ? 'Cable' : 'Cables'}`);
          summaryText = parts.join(', ');
        }

        return (
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-2xl border border-sky-500/50 bg-[#070e1b]/95 px-3.5 py-1.5 shadow-2xl backdrop-blur-md text-xs text-slate-200 animate-in slide-in-from-top-3 select-none"
            id="canvas-selection-action-bar"
          >
            {/* Selected Count Indicator */}
            <div className="flex items-center gap-1.5 font-bold text-sky-400">
              <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              <span>{totalCount} Selected:</span>
            </div>

            {/* Item details badge */}
            <span className="max-w-[260px] truncate font-semibold text-white px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700 text-[11px]">
              {summaryText}
            </span>

            <div className="h-4 w-px bg-slate-700 mx-0.5" />

            {/* Delete Button (Vibrant red with trash icon) */}
            <button
              onClick={onDeleteSelected}
              title="Delete Selected Items (Delete / Backspace key)"
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition shadow-md shadow-rose-950/60 active:scale-95 cursor-pointer"
              id="canvas-delete-selected-btn"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>

            {/* Clear Selection Button */}
            {onClearSelection && (
              <button
                onClick={onClearSelection}
                title="Clear Selection (Escape key)"
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      })()}

      {/* Floating Canvas Quick Controls (Zoom, Pan reset, Grid status) */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/90 p-1.5 shadow-xl backdrop-blur-md text-xs text-slate-300">
        <button
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
          title="Zoom In (Ctrl + Plus)"
          className="rounded-lg p-1.5 hover:bg-slate-800 hover:text-white"
        >
          ＋
        </button>
        <span className="px-2 font-mono text-[11px] text-slate-400">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
          title="Zoom Out (Ctrl + Minus)"
          className="rounded-lg p-1.5 hover:bg-slate-800 hover:text-white"
        >
          －
        </button>
        <div className="h-4 w-px bg-slate-800 mx-1" />
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 40, y: 30 });
          }}
          title="Reset Zoom & Pan"
          className="rounded-lg px-2 py-1 text-[11px] hover:bg-slate-800 hover:text-white"
        >
          Reset View
        </button>
      </div>

      {/* Cable Tool Helper Banner */}
      {isCableToolActive && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-950/90 px-4 py-1.5 shadow-2xl text-xs font-semibold text-amber-300 backdrop-blur-md animate-in slide-in-from-top-2">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
          {cableSourceDevice ? (
            <span>Cable connected to {cableSourceDevice.name}. Now click destination device to link.</span>
          ) : (
            <span>Cable Tool Active: Click first device to start link.</span>
          )}
        </div>
      )}
    </div>
  );
};
