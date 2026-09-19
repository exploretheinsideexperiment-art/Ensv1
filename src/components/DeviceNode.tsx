import React from 'react';
import { NetworkDevice, InterfaceStatus } from '../types/network';

interface DeviceNodeProps {
  device: NetworkDevice;
  isSelected: boolean;
  isConnectingCable: boolean;
  isCableSource: boolean;
  showInterfaceLabels: boolean;
  onSelect: (e: React.MouseEvent, device: NetworkDevice) => void;
  onContextMenu: (e: React.MouseEvent, device: NetworkDevice) => void;
  onDoubleClick: (e: React.MouseEvent, device: NetworkDevice) => void;
  onInterfaceClick?: (device: NetworkDevice, ifaceId: string) => void;
}

export const DeviceNode: React.FC<DeviceNodeProps> = ({
  device,
  isSelected,
  isConnectingCable,
  isCableSource,
  showInterfaceLabels,
  onSelect,
  onContextMenu,
  onDoubleClick,
  onInterfaceClick,
}) => {
  // Render SVG graphics for different device types
  const renderDeviceGraphic = () => {
    switch (device.type) {
      case 'router':
        return (
          <g>
            {/* 3D-styled Router Cylinder */}
            <ellipse cx="40" cy="46" rx="34" ry="16" fill="#0d9488" stroke="#115e59" strokeWidth="2" />
            <path d="M 6,32 L 6,46 A 34,16 0 0,0 74,46 L 74,32 Z" fill="#0f766e" />
            <ellipse cx="40" cy="30" rx="34" ry="16" fill="#14b8a6" stroke="#2dd4bf" strokeWidth="1.5" />
            
            {/* 4 Cross Routing Arrows */}
            <g stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
              {/* In-Out Arrows */}
              <line x1="26" y1="25" x2="34" y2="29" />
              <polyline points="30,24 34,29 35,25" fill="#ffffff" />

              <line x1="54" y1="25" x2="46" y2="29" />
              <polyline points="50,24 46,29 45,25" fill="#ffffff" />

              <line x1="26" y1="35" x2="34" y2="31" />
              <polyline points="30,36 34,31 35,35" fill="#ffffff" />

              <line x1="54" y1="35" x2="46" y2="31" />
              <polyline points="50,36 46,31 45,35" fill="#ffffff" />
            </g>
          </g>
        );

      case 'switch':
        return (
          <g>
            {/* 3D Managed Switch Box */}
            <polygon points="12,18 68,18 80,32 24,32" fill="#3b82f6" stroke="#60a5fa" strokeWidth="1.5" />
            <polygon points="24,32 80,32 80,50 24,50" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.5" />
            <polygon points="12,18 24,32 24,50 12,36" fill="#1d4ed8" />

            {/* Switch arrows on top plate */}
            <g stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M 32,24 L 60,24" />
              <polyline points="36,21 32,24 36,27" />
              <path d="M 36,28 L 64,28" />
              <polyline points="60,25 64,28 60,31" />
            </g>

            {/* Port indicator LEDs on front plate */}
            <circle cx="32" cy="41" r="2.5" fill="#4ade80" />
            <circle cx="42" cy="41" r="2.5" fill="#4ade80" />
            <circle cx="52" cy="41" r="2.5" fill="#4ade80" />
            <circle cx="62" cy="41" r="2.5" fill="#ef4444" />
            <circle cx="72" cy="41" r="2.5" fill="#4ade80" />
          </g>
        );

      case 'firewall': {
        const isPaloAlto =
          device.vendor.toLowerCase().includes('palo') ||
          device.name.toLowerCase().includes('palo') ||
          device.model.toLowerCase().includes('pa-');
        const isFortigate =
          device.vendor.toLowerCase().includes('fortinet') ||
          device.name.toLowerCase().includes('forti') ||
          device.model.toLowerCase().includes('forti');

        if (isPaloAlto) {
          return (
            <g>
              {/* Palo Alto Networks Next-Gen Firewall Shield */}
              <path
                d="M 40,10 L 68,20 C 68,48 40,64 40,64 C 40,64 12,48 12,20 Z"
                fill="#ea580c"
                stroke="#fed7aa"
                strokeWidth="2"
              />
              {/* Inner Dark Core */}
              <path
                d="M 40,16 L 62,24 C 62,44 40,57 40,57 C 40,57 18,44 18,24 Z"
                fill="#7c2d12"
              />
              {/* PA Badge */}
              <text
                x="40"
                y="38"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="12"
                fontWeight="900"
                fontFamily="sans-serif"
                letterSpacing="1"
              >
                PA
              </text>
              <rect x="25" y="42" width="30" height="9" rx="3" fill="#ea580c" />
              <text
                x="40"
                y="49"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="6"
                fontWeight="bold"
                fontFamily="monospace"
              >
                NGFW
              </text>
            </g>
          );
        }

        if (isFortigate) {
          return (
            <g>
              {/* Fortinet FortiGate Red Fortress Shield */}
              <path
                d="M 40,10 L 68,20 C 68,48 40,64 40,64 C 40,64 12,48 12,20 Z"
                fill="#dc2626"
                stroke="#fca5a5"
                strokeWidth="2"
              />
              {/* Fortinet Grid Pattern */}
              <rect x="26" y="24" width="28" height="20" rx="3" fill="#450a0a" stroke="#ef4444" strokeWidth="1" />
              <rect x="29" y="27" width="5" height="6" fill="#f87171" />
              <rect x="37" y="27" width="6" height="6" fill="#f87171" />
              <rect x="46" y="27" width="5" height="6" fill="#f87171" />
              <rect x="29" y="35" width="5" height="6" fill="#f87171" />
              <rect x="37" y="35" width="6" height="6" fill="#ffffff" />
              <rect x="46" y="35" width="5" height="6" fill="#f87171" />
              <text
                x="40"
                y="53"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="6.5"
                fontWeight="bold"
                fontFamily="monospace"
              >
                FORTIGATE
              </text>
            </g>
          );
        }

        return (
          <g>
            {/* Generic Firewall Shield with Brick Pattern */}
            <path
              d="M 40,12 L 68,22 C 68,48 40,62 40,62 C 40,62 12,48 12,22 Z"
              fill="#b91c1c"
              stroke="#f87171"
              strokeWidth="2"
            />
            {/* Brick Lines */}
            <line x1="22" y1="28" x2="58" y2="28" stroke="#fca5a5" strokeWidth="1.5" />
            <line x1="18" y1="38" x2="62" y2="38" stroke="#fca5a5" strokeWidth="1.5" />
            <line x1="26" y1="48" x2="54" y2="48" stroke="#fca5a5" strokeWidth="1.5" />
            <line x1="38" y1="28" x2="38" y2="38" stroke="#fca5a5" strokeWidth="1.5" />
            <line x1="28" y1="38" x2="28" y2="48" stroke="#fca5a5" strokeWidth="1.5" />
            <line x1="50" y1="38" x2="50" y2="48" stroke="#fca5a5" strokeWidth="1.5" />
          </g>
        );
      }

      case 'host': {
        const isWindows =
          device.model.toLowerCase().includes('windows') ||
          device.name.toLowerCase().includes('win');

        return (
          <g>
            {/* Workstation PC Monitor */}
            <rect x="15" y="12" width="50" height="36" rx="4" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
            {/* CRT / LCD Glass */}
            <rect x="19" y="16" width="42" height="28" rx="2" fill={isWindows ? '#0369a1' : '#0284c7'} />

            {isWindows ? (
              /* Windows 4-Square Logo on screen */
              <g transform="translate(32, 22)">
                <rect x="0" y="0" width="7" height="7" fill="#38bdf8" />
                <rect x="9" y="0" width="7" height="7" fill="#38bdf8" />
                <rect x="0" y="9" width="7" height="7" fill="#38bdf8" />
                <rect x="9" y="9" width="7" height="7" fill="#38bdf8" />
              </g>
            ) : (
              /* Waveform / Net activity graph on screen */
              <polyline
                points="22,30 28,30 32,22 36,36 40,24 45,34 50,30 57,30"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Monitor Stand Base */}
            <polygon points="35,48 45,48 47,56 33,56" fill="#64748b" stroke="#334155" strokeWidth="1" />
            <rect x="25" y="56" width="30" height="4" rx="2" fill="#94a3b8" />
          </g>
        );
      }

      case 'server':
        return (
          <g>
            {/* Rack Server Unit */}
            <rect x="14" y="16" width="52" height="42" rx="4" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
            {/* Drives slots */}
            <rect x="18" y="22" width="34" height="6" rx="1" fill="#334155" />
            <rect x="18" y="32" width="34" height="6" rx="1" fill="#334155" />
            <rect x="18" y="42" width="34" height="6" rx="1" fill="#334155" />
            {/* LED cluster */}
            <circle cx="58" cy="25" r="2" fill="#22c55e" />
            <circle cx="58" cy="35" r="2" fill="#38bdf8" />
            <circle cx="58" cy="45" r="2" fill="#22c55e" />
          </g>
        );

      case 'network':
      case 'cloud': {
        const netType = device.config.networkConfig?.networkType;
        const isBridge =
          netType === 'bridge' ||
          device.name.toLowerCase().includes('bridge') ||
          device.model.toLowerCase().includes('bridge');
        const isMgmt =
          netType === 'management' ||
          device.name.toLowerCase().includes('mgmt') ||
          device.name.toLowerCase().includes('management') ||
          device.model.toLowerCase().includes('management');

        if (isBridge) {
          return (
            <g>
              {/* Linux Network Bridge Graphics */}
              <rect x="14" y="24" width="52" height="26" rx="6" fill="#312e81" stroke="#6366f1" strokeWidth="2" />
              {/* Bridge Arch */}
              <path d="M 22,50 Q 40,32 58,50 Z" fill="#0f172a" stroke="#818cf8" strokeWidth="1.5" />
              {/* Bridge Roadway / Rails */}
              <line x1="16" y1="28" x2="64" y2="28" stroke="#a5b4fc" strokeWidth="2" strokeDasharray="3,2" />
              {/* Bridge Badge */}
              <rect x="25" y="14" width="30" height="12" rx="3" fill="#4f46e5" stroke="#c7d2fe" strokeWidth="1" />
              <text
                x="40"
                y="23"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="7.5"
                fontWeight="bold"
                fontFamily="monospace"
              >
                BRIDGE
              </text>
              {/* Segment ports */}
              <circle cx="20" cy="38" r="2.5" fill="#38bdf8" />
              <circle cx="60" cy="38" r="2.5" fill="#38bdf8" />
            </g>
          );
        }

        if (isMgmt) {
          return (
            <g>
              {/* Management Cloud (Cloud0 / pnet0) */}
              <path
                d="M 22,46 A 13,13 0 0,1 22,25 A 17,17 0 0,1 55,22 A 15,15 0 0,1 66,46 Z"
                fill="#b45309"
                stroke="#fbbf24"
                strokeWidth="2"
              />
              {/* Inner core */}
              <path
                d="M 26,44 A 10,10 0 0,1 26,28 A 14,14 0 0,1 52,26 A 12,12 0 0,1 62,44 Z"
                fill="#78350f"
              />
              <text
                x="40"
                y="36"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="8"
                fontWeight="900"
                fontFamily="monospace"
                letterSpacing="0.5"
              >
                MGMT
              </text>
              <rect x="27" y="39" width="26" height="8" rx="2" fill="#d97706" />
              <text
                x="40"
                y="45.5"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="5.5"
                fontWeight="bold"
                fontFamily="monospace"
              >
                pnet0
              </text>
            </g>
          );
        }

        // Internet NAT Cloud / External WAN
        return (
          <g>
            {/* Cloud Shape */}
            <path
              d="M 20,46 A 14,14 0 0,1 21,24 A 18,18 0 0,1 56,21 A 16,16 0 0,1 68,46 Z"
              fill="#0369a1"
              stroke="#38bdf8"
              strokeWidth="2"
            />
            {/* Inner cloud contour */}
            <path
              d="M 24,44 A 11,11 0 0,1 25,27 A 15,15 0 0,1 53,25 A 13,13 0 0,1 64,44 Z"
              fill="#082f49"
            />
            {/* Globe Lat/Long rings inside cloud */}
            <ellipse cx="40" cy="34" rx="12" ry="7" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2,2" />
            <text
              x="40"
              y="37"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="8.5"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              CLOUD
            </text>
          </g>
        );
      }

      default:
        return (
          <rect x="15" y="15" width="50" height="50" rx="8" fill="#475569" stroke="#94a3b8" strokeWidth="2" />
        );
    }
  };

  // Power LED state color
  const getPowerColor = () => {
    switch (device.status) {
      case 'running':
        return '#22c55e'; // Green (Start)
      case 'stopped':
        return '#ef4444'; // Red (Stop)
      case 'starting':
      case 'paused':
        return '#f59e0b'; // Amber / Orange (Hold)
    }
  };

  // Check if any interface has an IP address assigned to display near node
  const primaryIp = device.config?.interfaces?.find((i) => i.ipAddress)?.ipAddress;
  const nameWidth = Math.max(74, device.name.length * 8.5 + 24);
  const halfWidth = nameWidth / 2;
  const badgeHeight = primaryIp ? 32 : 22;

  return (
    <g
      transform={`translate(${device.x}, ${device.y})`}
      onClick={(e) => onSelect(e, device)}
      onContextMenu={(e) => onContextMenu(e, device)}
      onDoubleClick={(e) => onDoubleClick(e, device)}
      className="cursor-pointer select-none group"
      id={`device-node-${device.id}`}
    >
      {/* Selection Glow / Cable Tool Target Glow */}
      {isSelected && (
        <rect
          x={-Math.max(10, halfWidth - 36)}
          y="-8"
          width={Math.max(100, nameWidth + 16)}
          height={primaryIp ? 128 : 118}
          rx="14"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeDasharray="4 3"
          className="animate-pulse"
        />
      )}

      {isCableSource && (
        <rect
          x="-8"
          y="-8"
          width="96"
          height="92"
          rx="16"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="3"
          className="animate-ping"
        />
      )}

      {/* Main Hardware Body Graphic */}
      <g className="transition-transform group-hover:scale-105 transform-gpu origin-center">
        {renderDeviceGraphic()}
      </g>

      {/* Power status LED indicator */}
      <circle
        cx="14"
        cy="14"
        r={device.status === 'running' ? 5.5 : 5}
        fill={getPowerColor()}
        stroke="#0f172a"
        strokeWidth="1.5"
        className={device.status === 'running' ? 'animate-pulse' : ''}
      />

      {/* HOLD status badge */}
      {device.status === 'paused' && (
        <g transform="translate(40, -4)">
          <rect
            x="-16"
            y="-7"
            width="32"
            height="14"
            rx="4"
            fill="#78350f"
            stroke="#f59e0b"
            strokeWidth="1"
          />
          <text
            x="0"
            y="3.5"
            textAnchor="middle"
            fill="#fef08a"
            fontSize="8"
            fontWeight="bold"
            fontFamily="monospace"
          >
            HOLD
          </text>
        </g>
      )}

      {/* Device Name Label - Prominent, high-contrast, always visible right near the node */}
      <g transform="translate(40, 82)">
        {/* Nameplate pill shadow & border */}
        <rect
          x={-halfWidth}
          y="0"
          width={nameWidth}
          height={badgeHeight}
          rx="6"
          fill="#060c18"
          fillOpacity="0.96"
          stroke={isSelected ? '#38bdf8' : '#334155'}
          strokeWidth={isSelected ? '1.8' : '1.2'}
          className="filter drop-shadow-md"
        />
        {/* Status LED inside nameplate */}
        <circle
          cx={-halfWidth + 9}
          cy={primaryIp ? 11 : 11}
          r="3"
          fill={getPowerColor()}
          stroke="#020617"
          strokeWidth="1"
        />
        {/* Device Name Text */}
        <text
          x={primaryIp ? 3 : 2}
          y={primaryIp ? 14 : 15}
          textAnchor="middle"
          fill={isSelected ? '#38bdf8' : '#f8fafc'}
          fontSize="11"
          fontWeight="bold"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="0.3px"
        >
          {device.name}
        </text>
        {/* Primary IP subtitle if configured */}
        {primaryIp && (
          <text
            x="0"
            y="26"
            textAnchor="middle"
            fill="#38bdf8"
            fontSize="8.5"
            fontWeight="600"
            fontFamily="monospace"
          >
            {primaryIp}
          </text>
        )}
      </g>

      {/* Interface Port Indicators (Green when running, Orange when on hold, Red when stopped) */}
      {(device.config?.interfaces || []).map((iface, idx) => {
        // Distribute interface dots along device perimeter
        const total = (device.config?.interfaces || []).length;
        const angle = (idx / Math.max(1, total)) * Math.PI * 2 - Math.PI / 2;
        const radius = 34;
        const dotX = 40 + Math.cos(angle) * radius;
        const dotY = 32 + Math.sin(angle) * radius;

        const isConnected = !!iface.connectedTo;
        let ledFill = '#ef4444'; // Red default
        if (isConnected) {
          if (device.status === 'running') {
            ledFill = '#22c55e'; // Green
          } else if (device.status === 'paused') {
            ledFill = '#f59e0b'; // Amber / Orange (Hold)
          }
        }

        // Avoid collision between downward interface labels and the nameplate
        const isFacingDown = Math.sin(angle) > 0.55;
        const labelOffsetX = isFacingDown ? (Math.cos(angle) >= 0 ? 14 : -14) : Math.cos(angle) * 12;
        const labelOffsetY = isFacingDown ? -7 : Math.sin(angle) * 12;

        return (
          <g
            key={iface.id}
            transform={`translate(${dotX}, ${dotY})`}
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onInterfaceClick?.(device, iface.id);
            }}
          >
            {/* Link light dot */}
            <circle
              cx="0"
              cy="0"
              r="4.5"
              fill={ledFill}
              stroke="#0f172a"
              strokeWidth="1.2"
              className="hover:r-6 transition-all"
            />

            {/* Interface label tooltip/badge if enabled */}
            {showInterfaceLabels && (
              <g transform={`translate(${labelOffsetX}, ${labelOffsetY})`}>
                <rect
                  x="-14"
                  y="-8"
                  width="28"
                  height="13"
                  rx="3"
                  fill="#020617"
                  fillOpacity="0.85"
                  stroke="#475569"
                  strokeWidth="0.8"
                />
                <text
                  x="0"
                  y="2"
                  textAnchor="middle"
                  fill="#cbd5e1"
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  {iface.name}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};
