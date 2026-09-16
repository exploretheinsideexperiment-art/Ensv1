export type DeviceCategory = 
  | 'all'
  | 'routers'
  | 'switches'
  | 'firewalls'
  | 'hosts'
  | 'servers'
  | 'cloud'
  | 'appliances';

export type DeviceType = 
  | 'router'
  | 'switch'
  | 'firewall'
  | 'host'
  | 'server'
  | 'cloud'
  | 'hub';

export type DeviceStatus = 'running' | 'stopped' | 'starting' | 'paused';

export type InterfaceStatus = 'up' | 'down' | 'admin_down';

export type CableType = 'ethernet' | 'gigabit' | 'serial' | 'fiber' | 'management';

export interface NetworkInterface {
  id: string;
  name: string; // e.g. "Gi0/0", "eth0", "e0"
  status: InterfaceStatus;
  ipAddress?: string;
  subnetMask?: string;
  macAddress: string;
  vlan?: number;
  mtu: number;
  speed: string; // "100 Mbps", "1 Gbps", "10 Gbps"
  duplex: 'auto' | 'full' | 'half';
  connectedTo?: {
    deviceId: string;
    interfaceId: string;
    interfaceName: string;
    linkId: string;
  };
}

export interface DeviceConfig {
  hostname: string;
  osType: 'cisco_ios' | 'linux_quagga' | 'vyos' | 'pfsense' | 'generic_linux' | 'palo_alto' | 'fortigate' | 'windows';
  interfaces: NetworkInterface[];
  routingProtocols: {
    ospf?: {
      processId: number;
      routerId: string;
      areas: { areaId: string; network: string; wildcard: string }[];
    };
    bgp?: {
      asn: number;
      routerId: string;
      neighbors: { ip: string; remoteAs: number }[];
    };
    staticRoutes: { network: string; mask: string; nextHop: string }[];
  };
  vlans?: { id: number; name: string }[];
  natEnabled?: boolean;
}

export interface NetworkDevice {
  id: string;
  name: string;
  type: DeviceType;
  vendor: string;
  model: string;
  image: string;
  status: DeviceStatus;
  x: number;
  y: number;
  cpuCores: number;
  ramMb: number;
  diskGb: number;
  consoleType: 'telnet' | 'vnc' | 'serial' | 'web';
  config: DeviceConfig;
  notes?: string;
}

export interface NetworkLink {
  id: string;
  name: string;
  sourceDeviceId: string;
  sourceInterfaceId: string;
  sourceInterfaceName: string;
  targetDeviceId: string;
  targetInterfaceId: string;
  targetInterfaceName: string;
  type: CableType;
  status: 'up' | 'down';
  bandwidthMbps: number;
  currentTrafficMbps: number;
}

export interface SimulatedPacket {
  id: string;
  linkId: string;
  sourceDeviceId: string;
  targetDeviceId: string;
  protocol: 'ICMP' | 'ARP' | 'OSPF' | 'BGP' | 'TCP' | 'UDP' | 'HTTP' | 'DNS';
  sourceIp: string;
  destinationIp: string;
  sourceMac: string;
  destinationMac: string;
  vlan?: number;
  ttl: number;
  sizeBytes: number;
  timestamp: string;
  progress: number; // 0 to 1 along link
  payloadSummary: string;
}

export interface LabAnnotation {
  id: string;
  type: 'text' | 'rectangle' | 'ellipse';
  text?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
}

export interface ENSProject {
  id: string;
  name: string;
  description: string;
  version: string;
  createdAt: string;
  modifiedAt: string;
  devices: NetworkDevice[];
  links: NetworkLink[];
  annotations: LabAnnotation[];
  settings: {
    gridSnap: boolean;
    showInterfaceLabels: boolean;
    packetAnimation: boolean;
    theme: 'dark' | 'light';
  };
}

export interface DeviceTemplate {
  id: string;
  name: string;
  type: DeviceType;
  category: DeviceCategory;
  vendor: string;
  model: string;
  defaultRamMb: number;
  defaultCpuCores: number;
  defaultDiskGb: number;
  defaultInterfaces: string[];
  osType: DeviceConfig['osType'];
  imageFormat: 'qcow2' | 'docker' | 'raw' | 'iso' | 'vmdk';
  recommendedImage: string;
  description: string;
}

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  source: string;
  message: string;
}

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
}
