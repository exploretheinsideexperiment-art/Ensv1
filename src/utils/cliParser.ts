import { NetworkDevice, SimulatedPacket } from '../types/network';

export interface CliSessionState {
  deviceId: string;
  mode: 'user' | 'privileged' | 'config' | 'config-if' | 'config-router';
  subContext?: string; // e.g. "Gi0/0" or "ospf 1"
  history: string[];
  historyIndex: number;
}

export interface CliExecutionResult {
  output: string[];
  newPrompt: string;
  updatedDevice?: Partial<NetworkDevice>;
  newPacket?: Omit<SimulatedPacket, 'id' | 'timestamp' | 'progress'>;
}

export class NetworkCLI {
  static getPrompt(device: NetworkDevice, session: CliSessionState): string {
    const name = device.name;
    if (device.config.osType === 'windows') {
      return `C:\\Users\\Admin> `;
    }
    if (device.config.osType?.startsWith('viptela_') || device.type === 'sdwan') {
      return session.mode === 'config' ? `${name}# ` : `${name}# `;
    }
    if (device.config.osType === 'palo_alto') {
      return session.mode === 'config' ? `admin@${name}# ` : `admin@${name}> `;
    }
    if (device.config.osType === 'fortigate') {
      return session.mode === 'config' ? `${name} (global) # ` : `${name} # `;
    }
    if (device.config.osType === 'generic_linux') {
      return `${name.toLowerCase()}:~$ `;
    }

    switch (session.mode) {
      case 'user':
        return `${name}> `;
      case 'privileged':
        return `${name}# `;
      case 'config':
        return `${name}(config)# `;
      case 'config-if':
        return `${name}(config-if)# `;
      case 'config-router':
        return `${name}(config-router)# `;
      default:
        return `${name}> `;
    }
  }

  static execute(
    commandRaw: string,
    device: NetworkDevice,
    session: CliSessionState,
    allDevices: NetworkDevice[]
  ): CliExecutionResult {
    const cmd = commandRaw.trim();
    if (!cmd) {
      return { output: [], newPrompt: this.getPrompt(device, session) };
    }

    // Intercept question mark help command (e.g. "show ?", "show ip ?", "ip ?", "?", etc.)
    if (cmd === '?' || cmd.endsWith('?') || cmd.includes('?')) {
      const helpLines = this.getContextHelp(cmd, device, session);
      return { output: helpLines, newPrompt: this.getPrompt(device, session) };
    }

    if (device.config.osType === 'generic_linux' || device.config.osType === 'windows') {
      return this.executeLinux(cmd, device, session, allDevices);
    } else if (device.config.osType?.startsWith('viptela_') || device.type === 'sdwan') {
      return this.executeViptela(cmd, device, session, allDevices);
    } else if (device.config.osType === 'palo_alto') {
      return this.executePaloAlto(cmd, device, session, allDevices);
    } else if (device.config.osType === 'fortigate') {
      return this.executeFortigate(cmd, device, session, allDevices);
    } else {
      return this.executeCisco(cmd, device, session, allDevices);
    }
  }

  // Interactive Command Help Engine (Cisco IOS, Palo Alto, FortiGate, Linux)
  public static getContextHelp(
    commandRaw: string,
    device: NetworkDevice,
    session: CliSessionState
  ): string[] {
    const trimmed = commandRaw.trim();
    // Strip trailing or internal '?' to determine command context
    const cleanCmd = trimmed.replace(/\?+/g, '').trim().toLowerCase();
    const osType = device.config.osType;

    const formatHelp = (items: { cmd: string; desc: string }[]): string[] => {
      return items.map((item) => `  ${item.cmd.padEnd(19, ' ')}${item.desc}`);
    };

    // 1. PALO ALTO PAN-OS HELP
    if (osType === 'palo_alto') {
      if (!cleanCmd) {
        return formatHelp([
          { cmd: 'clear', desc: 'Clear system status or counters' },
          { cmd: 'configure', desc: 'Enter configuration mode' },
          { cmd: 'exit', desc: 'Exit current session' },
          { cmd: 'ping', desc: 'Send ICMP Echo request to host' },
          { cmd: 'request', desc: 'Execute system maintenance requests' },
          { cmd: 'set', desc: 'Set CLI or session parameters' },
          { cmd: 'show', desc: 'Show system, interface, and policy state' },
          { cmd: 'test', desc: 'Run diagnostics test' },
          { cmd: 'traceroute', desc: 'Trace route to network host' },
        ]);
      }
      if (cleanCmd.startsWith('show running') || cleanCmd === 'show run') {
        return formatHelp([
          { cmd: 'security-policy', desc: 'Show active Security Policy rules (Firewall Rules)' },
          { cmd: 'nat-policy', desc: 'Show active NAT translation rules' },
          { cmd: 'interface', desc: 'Show running interface configuration' },
        ]);
      }
      if (cleanCmd.startsWith('show routing') || cleanCmd === 'show route') {
        return formatHelp([
          { cmd: 'route', desc: 'Show IP forwarding routing table' },
          { cmd: 'protocol', desc: 'Show dynamic routing protocol status (OSPF/BGP)' },
        ]);
      }
      if (cleanCmd.startsWith('show system') || cleanCmd === 'show sys') {
        return formatHelp([
          { cmd: 'info', desc: 'Show system state, uptime, and PAN-OS version' },
          { cmd: 'resources', desc: 'Show memory and management plane CPU utilization' },
          { cmd: 'state', desc: 'Show HA cluster synchronization status' },
        ]);
      }
      if (cleanCmd.startsWith('show')) {
        return formatHelp([
          { cmd: 'arp', desc: 'Show ARP table entries' },
          { cmd: 'config', desc: 'Show candidate system configuration' },
          { cmd: 'interface', desc: 'Show hardware interfaces status and statistics' },
          { cmd: 'routing', desc: 'Show IP routing table and protocols' },
          { cmd: 'running', desc: 'Show active running configuration and security rules' },
          { cmd: 'session', desc: 'Show active firewall sessions' },
          { cmd: 'system', desc: 'Show system state, uptime, and PAN-OS version' },
          { cmd: 'vpn', desc: 'Show IPsec VPN and IKE gateway associations' },
        ]);
      }
      return [`% Unknown PAN-OS command: "${commandRaw}"`];
    }

    // 2. FORTIGATE FORTIOS HELP
    if (osType === 'fortigate') {
      if (!cleanCmd) {
        return formatHelp([
          { cmd: 'config', desc: 'Enter configuration level' },
          { cmd: 'diagnose', desc: 'Diagnostic utilities and packet sniffing' },
          { cmd: 'execute', desc: 'Execute system operational commands' },
          { cmd: 'get', desc: 'Retrieve operational values and status' },
          { cmd: 'show', desc: 'Display configuration statements' },
        ]);
      }
      if (cleanCmd.startsWith('get system') || cleanCmd.startsWith('show system')) {
        return formatHelp([
          { cmd: 'status', desc: 'Show FortiOS firmware version, serial, and uptime' },
          { cmd: 'interface', desc: 'Show network interface configurations and IPs' },
          { cmd: 'performance', desc: 'Show CPU, RAM, and disk utilization' },
          { cmd: 'arp', desc: 'Show system ARP cache' },
        ]);
      }
      if (cleanCmd.startsWith('show firewall') || cleanCmd.startsWith('get firewall')) {
        return formatHelp([
          { cmd: 'policy', desc: 'Show firewall IPv4/IPv6 security policy rules' },
          { cmd: 'address', desc: 'Show firewall address and subnet objects' },
          { cmd: 'service', desc: 'Show custom firewall service ports' },
        ]);
      }
      if (cleanCmd.startsWith('get router') || cleanCmd.startsWith('show router')) {
        return formatHelp([
          { cmd: 'info routing-table', desc: 'Show active IP routing table' },
          { cmd: 'ospf', desc: 'Show OSPF protocol status and neighbors' },
          { cmd: 'bgp', desc: 'Show BGP summary and peer states' },
        ]);
      }
      if (cleanCmd.startsWith('show') || cleanCmd.startsWith('get')) {
        return formatHelp([
          { cmd: 'firewall', desc: 'Firewall security policy objects and rules' },
          { cmd: 'router', desc: 'Routing table and dynamic routing processes' },
          { cmd: 'system', desc: 'System interfaces, status, and administration' },
          { cmd: 'vpn', desc: 'IPsec tunnels and SSL-VPN gateway states' },
        ]);
      }
      return [`% Unknown FortiOS command: "${commandRaw}"`];
    }

    // 3. LINUX & WINDOWS HOST HELP
    if (osType === 'generic_linux' || osType === 'windows') {
      if (cleanCmd.startsWith('ip')) {
        return formatHelp([
          { cmd: 'addr', desc: 'Protocol address management (ip a / ip addr show)' },
          { cmd: 'link', desc: 'Network device configuration (ip link set up/down)' },
          { cmd: 'neigh', desc: 'Neighbour / ARP table management (ip neigh show)' },
          { cmd: 'route', desc: 'Routing table management (ip route show / add)' },
        ]);
      }
      if (cleanCmd.startsWith('show')) {
        return [
          `Note: On Linux, use 'ip addr show' or 'ip route show'.`,
          `Available inspection commands:`,
          ...formatHelp([
            { cmd: 'ip a', desc: 'Show IP addresses on all network interfaces' },
            { cmd: 'ip route', desc: 'Show IP routing table' },
            { cmd: 'ifconfig', desc: 'Display network interface parameters' },
            { cmd: 'netstat -rn', desc: 'Show kernel routing table' },
            { cmd: 'arp -a', desc: 'Display neighbor ARP table' },
          ]),
        ];
      }
      return formatHelp([
        { cmd: 'cat', desc: 'Concatenate and display files' },
        { cmd: 'clear', desc: 'Clear the terminal screen' },
        { cmd: 'curl', desc: 'Transfer data with URLs (HTTP/HTTPS)' },
        { cmd: 'ifconfig', desc: 'Configure or view network interfaces' },
        { cmd: 'ip', desc: 'Show/manipulate routing, network devices, and interfaces' },
        { cmd: 'netstat', desc: 'Print network connections and routing tables' },
        { cmd: 'ping', desc: 'Send ICMP ECHO_REQUEST to network hosts' },
        { cmd: 'route', desc: 'Show or manipulate IP routing table' },
        { cmd: 'traceroute', desc: 'Print route packets trace to network host' },
      ]);
    }

    // 4. CISCO IOS CLI HELP (ROUTERS, SWITCHES, FIREWALLS)
    // 4.1. Top level help (User typed just "?")
    if (!cleanCmd) {
      if (session.mode === 'user') {
        return [
          'Exec commands:',
          ...formatHelp([
            { cmd: 'enable', desc: 'Turn on privileged commands' },
            { cmd: 'exit', desc: 'Exit from the EXEC' },
            { cmd: 'help', desc: 'Description of the interactive help system' },
            { cmd: 'ping', desc: 'Send echo messages' },
            { cmd: 'show', desc: 'Show running system information' },
            { cmd: 'terminal', desc: 'Set terminal line parameters' },
            { cmd: 'traceroute', desc: 'Trace route to destination' },
          ]),
        ];
      }
      if (session.mode === 'privileged') {
        return [
          'Exec commands:',
          ...formatHelp([
            { cmd: 'clear', desc: 'Reset functions' },
            { cmd: 'configure', desc: 'Enter configuration mode' },
            { cmd: 'copy', desc: 'Copy from one file to another' },
            { cmd: 'disable', desc: 'Turn off privileged commands' },
            { cmd: 'disconnect', desc: 'Disconnect an existing network connection' },
            { cmd: 'enable', desc: 'Turn on privileged commands' },
            { cmd: 'exit', desc: 'Exit from the EXEC' },
            { cmd: 'no', desc: 'Negate a command or set its defaults' },
            { cmd: 'ping', desc: 'Send echo messages' },
            { cmd: 'reload', desc: 'Halt and perform a cold restart' },
            { cmd: 'show', desc: 'Show running system information' },
            { cmd: 'traceroute', desc: 'Trace route to destination' },
            { cmd: 'write', desc: 'Write running configuration to memory' },
          ]),
        ];
      }
      if (session.mode === 'config') {
        return [
          'Configure commands:',
          ...formatHelp([
            { cmd: 'boot', desc: 'Set boot system options' },
            { cmd: 'default', desc: 'Set a command to its defaults' },
            { cmd: 'do', desc: 'To run an EXEC command in config mode' },
            { cmd: 'end', desc: 'Exit to privileged EXEC mode' },
            { cmd: 'exit', desc: 'Exit from configure mode' },
            { cmd: 'hostname', desc: 'Set system network name' },
            { cmd: 'interface', desc: 'Select an interface to configure' },
            { cmd: 'ip', desc: 'Global IP configuration subcommands' },
            { cmd: 'no', desc: 'Negate a command or set its defaults' },
            { cmd: 'router', desc: 'Enable a routing process' },
            { cmd: 'vlan', desc: 'VLAN configuration commands' },
          ]),
        ];
      }
      if (session.mode === 'config-if') {
        return [
          'Interface configuration commands:',
          ...formatHelp([
            { cmd: 'description', desc: 'Interface specific description' },
            { cmd: 'do', desc: 'To run an EXEC command' },
            { cmd: 'duplex', desc: 'Configure duplex operation' },
            { cmd: 'exit', desc: 'Exit from interface configuration mode' },
            { cmd: 'ip', desc: 'Interface Internet Protocol config commands' },
            { cmd: 'no', desc: 'Negate a command or set its defaults' },
            { cmd: 'shutdown', desc: 'Shutdown the selected interface' },
            { cmd: 'speed', desc: 'Configure speed operation' },
            { cmd: 'switchport', desc: 'Set switching characteristics of the interface' },
          ]),
        ];
      }
      if (session.mode === 'config-router') {
        return [
          'Router configuration commands:',
          ...formatHelp([
            { cmd: 'exit', desc: 'Exit from routing configuration mode' },
            { cmd: 'network', desc: 'Enable routing on an IP network' },
            { cmd: 'passive-interface', desc: 'Suppress routing updates on an interface' },
            { cmd: 'redistribute', desc: 'Redistribute information from another routing protocol' },
          ]),
        ];
      }
    }

    // 4.2. "show ip ?"
    if (cleanCmd === 'show ip' || cleanCmd === 'sh ip') {
      return formatHelp([
        { cmd: 'arp', desc: 'IP ARP table' },
        { cmd: 'bgp', desc: 'BGP routing information' },
        { cmd: 'interface', desc: 'IP interface status and configuration' },
        { cmd: 'ospf', desc: 'OSPF routing process information' },
        { cmd: 'protocols', desc: 'Active IP routing protocol processes' },
        { cmd: 'route', desc: 'IP routing table' },
      ]);
    }

    // 4.3. "show ip interface ?" / "show ip int ?"
    if (
      cleanCmd === 'show ip interface' ||
      cleanCmd === 'show ip int' ||
      cleanCmd === 'sh ip int' ||
      cleanCmd === 'sh ip interface'
    ) {
      return formatHelp([
        { cmd: '<cr>', desc: '' },
        { cmd: 'brief', desc: 'Brief summary of IP status and configuration' },
        { cmd: 'GigabitEthernet', desc: 'GigabitEthernet IEEE 802.3z' },
        { cmd: 'FastEthernet', desc: 'FastEthernet IEEE 802.3' },
      ]);
    }

    // 4.4. "show interface ?" / "show int ?"
    if (cleanCmd === 'show interface' || cleanCmd === 'show int' || cleanCmd === 'sh int') {
      return formatHelp([
        { cmd: '<cr>', desc: '' },
        { cmd: 'description', desc: 'Show interface description' },
        { cmd: 'status', desc: 'Show interface line status' },
        { cmd: 'summary', desc: 'Show summary of all interfaces' },
        { cmd: 'GigabitEthernet', desc: 'GigabitEthernet IEEE 802.3z' },
        { cmd: 'FastEthernet', desc: 'FastEthernet IEEE 802.3' },
      ]);
    }

    // 4.5. "show running-config ?" / "show run ?"
    if (cleanCmd === 'show running-config' || cleanCmd === 'show run' || cleanCmd === 'sh run') {
      return formatHelp([
        { cmd: '<cr>', desc: '' },
        { cmd: 'interface', desc: 'Show interface configuration' },
        { cmd: 'partition', desc: 'Show configuration partition' },
      ]);
    }

    // 4.6. "show mac ?" / "show mac-address-table ?"
    if (
      cleanCmd === 'show mac' ||
      cleanCmd === 'show mac-address-table' ||
      cleanCmd === 'sh mac' ||
      cleanCmd === 'sh mac-address-table'
    ) {
      return formatHelp([
        { cmd: '<cr>', desc: '' },
        { cmd: 'dynamic', desc: 'Dynamic entries only' },
        { cmd: 'vlan', desc: 'Filter by VLAN ID' },
      ]);
    }

    // 4.7. "show vlan ?" / "sh vlan ?"
    if (cleanCmd === 'show vlan' || cleanCmd === 'sh vlan') {
      return formatHelp([
        { cmd: '<cr>', desc: '' },
        { cmd: 'brief', desc: 'VTP all VLAN status in brief format' },
        { cmd: 'id', desc: 'Filter by VLAN ID' },
      ]);
    }

    // 4.8. Top-level "show ?" / "sh ?"
    if (cleanCmd === 'show' || cleanCmd === 'sh') {
      return formatHelp([
        { cmd: 'arp', desc: 'ARP table' },
        { cmd: 'bgp', desc: 'BGP routing information' },
        { cmd: 'clock', desc: 'Display current system clock' },
        { cmd: 'environment', desc: 'Environmental monitor (power, temp, fan)' },
        { cmd: 'history', desc: 'Display the session command history' },
        { cmd: 'interfaces', desc: 'Interface status and configuration' },
        { cmd: 'ip', desc: 'IP information and protocols' },
        { cmd: 'mac-address-table', desc: 'MAC forwarding table (Switches)' },
        { cmd: 'ospf', desc: 'OSPF routing information' },
        { cmd: 'running-config', desc: 'Current operating configuration' },
        { cmd: 'startup-config', desc: 'Configuration saved in NVRAM' },
        { cmd: 'users', desc: 'Display connected users' },
        { cmd: 'version', desc: 'System hardware and software status' },
        { cmd: 'vlan', desc: 'VTP and VLAN information' },
      ]);
    }

    // 4.9. "ip ?"
    if (cleanCmd === 'ip') {
      return formatHelp([
        { cmd: 'address', desc: 'Set the IP address of an interface' },
        { cmd: 'domain-lookup', desc: 'Enable IP Domain Name System (DNS) queries' },
        { cmd: 'route', desc: 'Establish static routes' },
        { cmd: 'routing', desc: 'Enable IP routing' },
      ]);
    }

    // 4.10. "ip route ?"
    if (cleanCmd === 'ip route') {
      return formatHelp([
        { cmd: 'A.B.C.D', desc: 'Destination IP network prefix (e.g. 192.168.1.0)' },
      ]);
    }

    // 4.11. "interface ?" / "int ?"
    if (cleanCmd === 'interface' || cleanCmd === 'int') {
      const ifList = device.config.interfaces.map((i) => ({ cmd: i.name, desc: `${i.name} interface` }));
      return formatHelp([
        ...ifList,
        { cmd: 'range', desc: 'Interface range configuration' },
      ]);
    }

    // 4.12. "router ?"
    if (cleanCmd === 'router') {
      return formatHelp([
        { cmd: 'bgp', desc: 'Border Gateway Protocol (BGP)' },
        { cmd: 'ospf', desc: 'Open Shortest Path First (OSPF)' },
        { cmd: 'rip', desc: 'Routing Information Protocol (RIP)' },
      ]);
    }

    // 4.13. "no ?"
    if (cleanCmd === 'no') {
      return formatHelp([
        { cmd: 'ip', desc: 'Global IP configuration subcommands' },
        { cmd: 'router', desc: 'Remove a routing process' },
        { cmd: 'shutdown', desc: 'Restart an interface / turn UP' },
        { cmd: 'vlan', desc: 'Remove a VLAN' },
      ]);
    }

    // Fallback contextual match
    return [
      `% Help options for "${commandRaw}":`,
      ...formatHelp([
        { cmd: 'show ip int brief', desc: 'Show interface summary' },
        { cmd: 'show ip route', desc: 'Show IP routing table' },
        { cmd: 'show running-config', desc: 'Show active configuration' },
        { cmd: 'show version', desc: 'Show system hardware and version' },
      ]),
    ];
  }

  // Palo Alto PAN-OS CLI Processor
  private static executePaloAlto(
    cmd: string,
    device: NetworkDevice,
    session: CliSessionState,
    allDevices: NetworkDevice[]
  ): CliExecutionResult {
    const parts = cmd.split(/\s+/);
    const primary = parts[0].toLowerCase();
    const rest = parts.slice(1).join(' ').toLowerCase();

    if (primary === 'clear') {
      return { output: ['__CLEAR__'], newPrompt: this.getPrompt(device, session) };
    }

    if (primary === 'configure' || primary === 'conf') {
      session.mode = 'config';
      return {
        output: ['Entering configuration mode', '[edit]'],
        newPrompt: this.getPrompt(device, session),
      };
    }

    if (primary === 'exit' || primary === 'quit') {
      if (session.mode === 'config') {
        session.mode = 'user';
        return { output: ['Exiting configuration mode.'], newPrompt: this.getPrompt(device, session) };
      }
      return { output: ['Connection closed.'], newPrompt: this.getPrompt(device, session) };
    }

    if (primary === 'commit') {
      return {
        output: [
          'Commit job 1 is in progress...',
          'Configuration committed successfully',
        ],
        newPrompt: this.getPrompt(device, session),
      };
    }

    if (primary === 'show') {
      if (rest.includes('interface') || rest.includes('interfaces') || rest === 'int') {
        const lines = [
          'total interfaces: ' + device.config.interfaces.length,
          'name               id    vsys zone             forwarding          ip address',
          '--------------------------------------------------------------------------------',
        ];
        device.config.interfaces.forEach((iface, idx) => {
          const ip = iface.ipAddress || 'unassigned';
          const zone = iface.name.includes('mgmt') ? 'management' : idx % 2 === 0 ? 'trust' : 'untrust';
          lines.push(
            `${iface.name.padEnd(18)} ${(idx + 1).toString().padEnd(5)} 1    ${zone.padEnd(16)} default             ${ip}`
          );
        });
        return { output: lines, newPrompt: this.getPrompt(device, session) };
      }

      if (rest.includes('system info') || rest.includes('system')) {
        return {
          output: [
            `hostname: ${device.name}`,
            `ip-address: ${device.config.interfaces[0]?.ipAddress || '192.168.1.1'}`,
            `netmask: 255.255.255.0`,
            `default-gateway: 192.168.1.254`,
            `model: PA-VM`,
            `sw-version: 11.1.0`,
            `app-version: 8820-8432`,
            `threat-version: 8820-8432`,
            `url-filtering-version: 0000.00.00.000`,
            `plugin_versions: { vm_series: 3.2.1 }`,
            `operational-mode: normal`,
          ],
          newPrompt: this.getPrompt(device, session),
        };
      }

      if (rest.includes('routing') || rest.includes('route')) {
        const lines = [
          'flags: A:active, ?:loose, C:connect, H:host, S:static, ~:internal, R:rip, O:ospf, B:bgp',
          'VIRTUAL ROUTER: default (id 1)',
          '==========',
          'destination          nexthop          metric flags interface',
          '-----------------------------------------------------------------',
        ];
        device.config.interfaces.forEach((i) => {
          if (i.ipAddress) {
            lines.push(`${i.ipAddress}/24`.padEnd(20) + `0.0.0.0`.padEnd(17) + `0      A C   ${i.name}`);
          }
        });
        return { output: lines, newPrompt: this.getPrompt(device, session) };
      }
    }

    if (primary === 'ping') {
      return this.handleLinuxPing(parts, device, allDevices, session);
    }

    return {
      output: [
        `Unknown syntax: "${cmd}". Type "show interface all", "show system info", "configure", or "ping <ip>".`,
      ],
      newPrompt: this.getPrompt(device, session),
    };
  }

  // Fortinet FortiOS CLI Processor
  private static executeFortigate(
    cmd: string,
    device: NetworkDevice,
    session: CliSessionState,
    allDevices: NetworkDevice[]
  ): CliExecutionResult {
    const parts = cmd.split(/\s+/);
    const primary = parts[0].toLowerCase();
    const rest = parts.slice(1).join(' ').toLowerCase();

    if (primary === 'clear') {
      return { output: ['__CLEAR__'], newPrompt: this.getPrompt(device, session) };
    }

    if (primary === 'get') {
      if (rest.includes('system status')) {
        return {
          output: [
            `Version: FortiGate-VM64-KVM v7.4.2,build2571,240207 (GA.F)`,
            `Virus-DB: 91.00282(2026-09-16 04:32)`,
            `Extended DB: 91.00282(2026-09-16 04:32)`,
            `Extreme DB: 91.00282(2026-09-16 04:32)`,
            `IPS-DB: 6.00741(2026-09-16 03:10)`,
            `FortiClient application signature package: 6.00741(2026-09-16 03:10)`,
            `Serial-Number: FGVM08TM24001942`,
            `BIOS version: 04000002`,
            `System Part-Number: P24712-01`,
            `Hostname: ${device.name}`,
            `Operation Mode: NAT`,
            `Current virtual domain: root`,
            `Max number of virtual domains: 10`,
            `Virtual domains status: 1 in NAT mode, 0 in TP mode`,
            `Virtual domain configuration: disable`,
            `FIPS-CC mode: disable`,
            `Current HA mode: standalone`,
          ],
          newPrompt: this.getPrompt(device, session),
        };
      }
    }

    if (primary === 'show') {
      if (rest.includes('system interface') || rest.includes('interface')) {
        const lines = [`config system interface`];
        device.config.interfaces.forEach((iface) => {
          lines.push(`    edit "${iface.name}"`);
          lines.push(`        set vdom "root"`);
          lines.push(`        set ip ${iface.ipAddress || '0.0.0.0'} 255.255.255.0`);
          lines.push(`        set allowaccess ping https ssh http`);
          lines.push(`        set type physical`);
          lines.push(`        set snmp-index ${(Math.random() * 10).toFixed(0)}`);
          lines.push(`    next`);
        });
        lines.push(`end`);
        return { output: lines, newPrompt: this.getPrompt(device, session) };
      }
    }

    if (primary === 'execute' && parts[1]?.toLowerCase() === 'ping') {
      return this.handleLinuxPing(['ping', ...parts.slice(2)], device, allDevices, session);
    }

    if (primary === 'ping') {
      return this.handleLinuxPing(parts, device, allDevices, session);
    }

    return {
      output: [
        `command parse error before '${cmd}'`,
        `Type "get system status", "show system interface", or "execute ping <ip>".`,
      ],
      newPrompt: this.getPrompt(device, session),
    };
  }

  // Cisco IOS & Quagga CLI Processor
  private static executeCisco(
    cmd: string,
    device: NetworkDevice,
    session: CliSessionState,
    allDevices: NetworkDevice[]
  ): CliExecutionResult {
    const parts = cmd.split(/\s+/);
    const primary = parts[0].toLowerCase();
    const sub = parts.slice(1).join(' ').toLowerCase();

    // CLEAR
    if (primary === 'clear') {
      return { output: ['__CLEAR__'], newPrompt: this.getPrompt(device, session) };
    }

    // Support 'do <command>' from config, config-if, config-router
    if (cmd.startsWith('do ') && session.mode !== 'user' && session.mode !== 'privileged') {
      const doCmd = cmd.substring(3).trim();
      const savedMode = session.mode;
      const savedContext = session.subContext;
      session.mode = 'privileged';
      const res = this.executeCisco(doCmd, device, session, allDevices);
      session.mode = savedMode;
      session.subContext = savedContext;
      res.newPrompt = this.getPrompt(device, session);
      return res;
    }

    // USER EXEC MODE
    if (session.mode === 'user') {
      if (primary === 'enable' || primary === 'en') {
        session.mode = 'privileged';
        return { output: [], newPrompt: this.getPrompt(device, session) };
      }
      if (primary === 'ping') {
        return this.handlePing(parts[1], device, allDevices, session);
      }
      if (primary === 'show' || primary === 'sh') {
        if (sub.startsWith('ver')) {
          return { output: this.getShowVersion(device), newPrompt: this.getPrompt(device, session) };
        }
        if (sub.startsWith('ip int')) {
          return { output: this.getShowIpIntBrief(device), newPrompt: this.getPrompt(device, session) };
        }
      }
      if (primary === 'help' || primary === '?') {
        return {
          output: [
            'Exec commands:',
            '  enable           Turn on privileged commands',
            '  ping <ip>        Send ICMP echo requests',
            '  show version     Display system hardware & software status',
            '  show ip int br   Display IP interface summary',
            '  clear            Clear the screen',
          ],
          newPrompt: this.getPrompt(device, session),
        };
      }
      return {
        output: [`% Unknown command or bad password: "${cmd}". Type "help" or "?" for commands.`],
        newPrompt: this.getPrompt(device, session),
      };
    }

    // PRIVILEGED EXEC MODE
    if (session.mode === 'privileged') {
      if (primary === 'disable') {
        session.mode = 'user';
        return { output: [], newPrompt: this.getPrompt(device, session) };
      }
      if (cmd.startsWith('conf t') || cmd === 'configure terminal') {
        session.mode = 'config';
        return {
          output: ['Enter configuration commands, one per line. End with CNTL/Z or "exit".'],
          newPrompt: this.getPrompt(device, session),
        };
      }
      if (primary === 'ping') {
        return this.handlePing(parts[1], device, allDevices, session);
      }
      if (primary === 'traceroute' || primary === 'trace') {
        return this.handleTraceroute(parts[1], device, allDevices, session);
      }
      if (primary === 'show' || primary === 'sh') {
        if (sub.startsWith('ip int')) {
          return { output: this.getShowIpIntBrief(device), newPrompt: this.getPrompt(device, session) };
        }
        if (sub.startsWith('ip ro')) {
          return { output: this.getShowIpRoute(device), newPrompt: this.getPrompt(device, session) };
        }
        if (sub.startsWith('run')) {
          return { output: this.getShowRunningConfig(device), newPrompt: this.getPrompt(device, session) };
        }
        if (sub.startsWith('ver')) {
          return { output: this.getShowVersion(device), newPrompt: this.getPrompt(device, session) };
        }
        if (sub.startsWith('vlan')) {
          return { output: this.getShowVlan(device), newPrompt: this.getPrompt(device, session) };
        }
        if (sub.startsWith('mac')) {
          return { output: this.getShowMacTable(device), newPrompt: this.getPrompt(device, session) };
        }
      }
      if (primary === 'reload') {
        return {
          output: ['Proceed with reload? [confirm]', '% System reload requested. Simulation resetting device state...'],
          newPrompt: this.getPrompt(device, session),
        };
      }
      if (primary === 'help' || primary === '?') {
        return {
          output: [
            'Privileged commands:',
            '  configure terminal  Enter configuration mode',
            '  disable             Turn off privileged commands',
            '  ping <ip>           Send ICMP echo request',
            '  traceroute <ip>     Trace route to target IP',
            '  show ip route       Display IP routing table',
            '  show ip int brief   Display summary of IP interfaces',
            '  show running-config Display current operating configuration',
            '  show version        Display system information',
            '  reload              Halt and perform a reboot',
          ],
          newPrompt: this.getPrompt(device, session),
        };
      }
      return {
        output: [`% Invalid input detected at marker: "${cmd}". Type "help" for options.`],
        newPrompt: this.getPrompt(device, session),
      };
    }

    // CONFIG MODE
    if (session.mode === 'config') {
      if (primary === 'exit' || primary === 'end') {
        session.mode = 'privileged';
        return { output: [], newPrompt: this.getPrompt(device, session) };
      }
      if (primary === 'hostname') {
        const newName = parts[1];
        if (!newName) return { output: ['% Incomplete command: hostname <name>'], newPrompt: this.getPrompt(device, session) };
        device.name = newName;
        device.config.hostname = newName;
        return {
          output: [],
          newPrompt: this.getPrompt(device, session),
          updatedDevice: { name: newName, config: { ...device.config, hostname: newName } },
        };
      }
      if (primary === 'interface' || primary === 'int') {
        const rawTarget = parts.slice(1).join('').toLowerCase().replace(/[\s\-_]/g, '');
        const iface = device.config.interfaces.find((i) => {
          const norm = i.name.toLowerCase().replace(/[\s\-_]/g, '');
          if (norm === rawTarget) return true;
          // Support short forms like g0/0, gi0/0, e0, etc.
          const stripLetters = (s: string) => s.replace(/^[a-z]+/, '');
          const ifLetters = norm.match(/^[a-z]+/)?.[0] || '';
          const targetLetters = rawTarget.match(/^[a-z]+/)?.[0] || '';
          if (stripLetters(norm) === stripLetters(rawTarget)) {
            if (ifLetters.startsWith(targetLetters) || targetLetters.startsWith(ifLetters)) {
              return true;
            }
          }
          return false;
        });

        if (!iface) {
          return {
            output: [`% Invalid interface type or number. Available: ${device.config.interfaces.map((i) => i.name).join(', ')}`],
            newPrompt: this.getPrompt(device, session),
          };
        }
        session.mode = 'config-if';
        session.subContext = iface.name;
        return { output: [], newPrompt: this.getPrompt(device, session) };
      }
      if (primary === 'router') {
        const protocol = parts[1]?.toLowerCase();
        if (protocol === 'ospf' || protocol === 'bgp') {
          session.mode = 'config-router';
          session.subContext = `${protocol} ${parts[2] || '1'}`;
          return { output: [], newPrompt: this.getPrompt(device, session) };
        }
        return { output: ['% Supported routing protocols in lab: "router ospf <id>", "router bgp <asn>"'], newPrompt: this.getPrompt(device, session) };
      }
      if (cmd.startsWith('ip route')) {
        // ip route 192.168.3.0 255.255.255.0 10.0.0.2
        if (parts.length < 5) return { output: ['% Syntax: ip route <dest-net> <mask> <next-hop>'], newPrompt: this.getPrompt(device, session) };
        const newRoute = { network: parts[2], mask: parts[3], nextHop: parts[4] };
        device.config.routingProtocols.staticRoutes.push(newRoute);
        return {
          output: [`% Static route added: ${newRoute.network}/${newRoute.mask} via ${newRoute.nextHop}`],
          newPrompt: this.getPrompt(device, session),
          updatedDevice: { config: { ...device.config } },
        };
      }
      return { output: [`% Unrecognized command in config mode: "${cmd}"`], newPrompt: this.getPrompt(device, session) };
    }

    // CONFIG-INTERFACE MODE
    if (session.mode === 'config-if') {
      if (primary === 'exit') {
        session.mode = 'config';
        session.subContext = undefined;
        return { output: [], newPrompt: this.getPrompt(device, session) };
      }
      if (primary === 'end') {
        session.mode = 'privileged';
        session.subContext = undefined;
        return { output: [], newPrompt: this.getPrompt(device, session) };
      }

      const activeIfName = session.subContext;
      const iface = device.config.interfaces.find((i) => i.name === activeIfName);

      if (!iface) {
        session.mode = 'config';
        return { output: ['% Error: Interface no longer exists.'], newPrompt: this.getPrompt(device, session) };
      }

      if (cmd.startsWith('ip address') || cmd.startsWith('ip addr')) {
        const ip = parts[2];
        const mask = parts[3];
        if (!ip || !mask) return { output: ['% Incomplete command: ip address <IP> <SubnetMask>'], newPrompt: this.getPrompt(device, session) };
        iface.ipAddress = ip;
        iface.subnetMask = mask;
        return {
          output: [`% Interface ${iface.name} assigned IP ${ip} ${mask}`],
          newPrompt: this.getPrompt(device, session),
          updatedDevice: { config: { ...device.config } },
        };
      }

      const normIfCmd = cmd.trim().toLowerCase().replace(/\s+/g, ' ');
      if (normIfCmd === 'no shutdown' || normIfCmd === 'no shut' || normIfCmd === 'no sh') {
        iface.status = 'up';
        return {
          output: [
            `%LINK-3-UPDOWN: Interface ${iface.name}, changed state to up`,
            `%LINEPROTO-5-UPDOWN: Line protocol on Interface ${iface.name}, changed state to up`,
          ],
          newPrompt: this.getPrompt(device, session),
          updatedDevice: { config: { ...device.config } },
        };
      }

      if (normIfCmd === 'shutdown' || normIfCmd === 'shut' || normIfCmd === 'sh') {
        iface.status = 'down';
        return {
          output: [
            `%LINK-5-CHANGED: Interface ${iface.name}, changed state to administratively down`,
            `%LINEPROTO-5-UPDOWN: Line protocol on Interface ${iface.name}, changed state to down`,
          ],
          newPrompt: this.getPrompt(device, session),
          updatedDevice: { config: { ...device.config } },
        };
      }

      if (cmd.startsWith('description')) {
        return { output: [], newPrompt: this.getPrompt(device, session) };
      }

      return { output: [`% Incomplete or unknown interface command: "${cmd}"`], newPrompt: this.getPrompt(device, session) };
    }

    // CONFIG-ROUTER MODE
    if (session.mode === 'config-router') {
      if (primary === 'exit') {
        session.mode = 'config';
        session.subContext = undefined;
        return { output: [], newPrompt: this.getPrompt(device, session) };
      }
      if (cmd.startsWith('network')) {
        // network 192.168.1.0 0.0.0.255 area 0
        return {
          output: [`% Network statement registered: ${cmd.substring(8)}`],
          newPrompt: this.getPrompt(device, session),
        };
      }
      if (cmd.startsWith('neighbor')) {
        // neighbor 10.0.0.2 remote-as 65001
        return {
          output: [`% BGP neighbor statement registered: ${cmd.substring(9)}`],
          newPrompt: this.getPrompt(device, session),
        };
      }
      return { output: [`% Unknown router command: "${cmd}"`], newPrompt: this.getPrompt(device, session) };
    }

    return { output: [`% Command syntax error: "${cmd}"`], newPrompt: this.getPrompt(device, session) };
  }

  // Linux Host / Workstation CLI Processor
  private static executeLinux(
    cmd: string,
    device: NetworkDevice,
    session: CliSessionState,
    allDevices: NetworkDevice[]
  ): CliExecutionResult {
    const parts = cmd.split(/\s+/);
    const primary = parts[0].toLowerCase();

    if (primary === 'clear') {
      return { output: ['__CLEAR__'], newPrompt: this.getPrompt(device, session) };
    }

    if (primary === 'ip') {
      const sub = parts[1]?.toLowerCase();
      if (sub === 'a' || sub === 'addr' || sub === 'address') {
        const lines: string[] = ['1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN', '    inet 127.0.0.1/8 scope host lo'];
        device.config.interfaces.forEach((iface, idx) => {
          lines.push(
            `${idx + 2}: ${iface.name}: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu ${iface.mtu} qdisc pfifo_fast state ${iface.status.toUpperCase()}`,
            `    link/ether ${iface.macAddress} brd ff:ff:ff:ff:ff:ff`,
            iface.ipAddress ? `    inet ${iface.ipAddress}/24 brd 192.168.1.255 scope global ${iface.name}` : `    inet <UNASSIGNED>`
          );
        });
        return { output: lines, newPrompt: this.getPrompt(device, session) };
      }
      if (sub === 'r' || sub === 'route') {
        const routes = device.config.routingProtocols.staticRoutes;
        const lines = ['default via 192.168.1.1 dev eth0 metric 100'];
        routes.forEach((r) => lines.push(`${r.network}/${r.mask} via ${r.nextHop} dev eth0`));
        return { output: lines, newPrompt: this.getPrompt(device, session) };
      }
    }

    if (primary === 'ifconfig') {
      const lines: string[] = [];
      device.config.interfaces.forEach((iface) => {
        lines.push(
          `${iface.name}: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu ${iface.mtu}`,
          `        inet ${iface.ipAddress || '0.0.0.0'}  netmask ${iface.subnetMask || '255.255.255.0'}`,
          `        ether ${iface.macAddress}  txqueuelen 1000  (Ethernet)`,
          `        RX packets 1248  bytes 112094 (109.4 KB)`,
          `        TX packets 1056  bytes 98234 (95.9 KB)`,
          ''
        );
      });
      return { output: lines, newPrompt: this.getPrompt(device, session) };
    }

    if (primary === 'ping') {
      return this.handleLinuxPing(parts, device, allDevices, session);
    }

    if (primary === 'traceroute') {
      return this.handleTraceroute(parts[1], device, allDevices, session);
    }

    if (primary === 'curl') {
      const target = parts[1] || '192.168.1.1';
      return {
        output: [
          `* Connected to ${target} (port 80)`,
          `> GET / HTTP/1.1`,
          `> Host: ${target}`,
          `> User-Agent: curl/8.5.0`,
          `< HTTP/1.1 200 OK`,
          `< Server: ENSv1 Embedded Web Gateway`,
          `< Content-Type: text/html`,
          ``,
          `<html><body><h1>ENSv1 Simulated Service Active</h1><p>Device: ${target}</p></body></html>`,
        ],
        newPrompt: this.getPrompt(device, session),
      };
    }

    if (primary === 'hostname') {
      if (parts[1]) {
        device.name = parts[1];
        device.config.hostname = parts[1];
        return { output: [], newPrompt: this.getPrompt(device, session), updatedDevice: { name: parts[1] } };
      }
      return { output: [device.name], newPrompt: this.getPrompt(device, session) };
    }

    if (primary === 'uname' && parts[1] === '-a') {
      return {
        output: ['Linux ens-v1-lab 6.6.14-ensv1 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux'],
        newPrompt: this.getPrompt(device, session),
      };
    }

    if (primary === 'uptime') {
      return {
        output: [' 10:42:01 up 2 hours, 1 user, load average: 0.08, 0.03, 0.01'],
        newPrompt: this.getPrompt(device, session),
      };
    }

    if (primary === 'cat') {
      const file = parts[1];
      if (file?.includes('resolv.conf')) {
        return { output: ['nameserver 8.8.8.8', 'nameserver 1.1.1.1'], newPrompt: this.getPrompt(device, session) };
      }
      if (file?.includes('hosts')) {
        return { output: ['127.0.0.1 localhost', `192.168.1.10 ${device.name}`], newPrompt: this.getPrompt(device, session) };
      }
    }

    if (primary === 'help') {
      return {
        output: [
          'Linux Workstation Utility Shell Commands:',
          '  ip a, ip route     View interface addresses & routing tables',
          '  ifconfig           Legacy interface configuration viewer',
          '  ping <ip>          Send ICMP echo requests to target host',
          '  traceroute <ip>    Track network hops to target destination',
          '  curl <ip>          Simulate HTTP GET request',
          '  uptime, uname -a   System diagnosis and kernel information',
          '  hostname <name>    View or update hostname',
          '  clear              Clear the terminal display',
        ],
        newPrompt: this.getPrompt(device, session),
      };
    }

    return {
      output: [`bash: ${primary}: command not found. Type "help" for available commands.`],
      newPrompt: this.getPrompt(device, session),
    };
  }

  // Ping Handler - Cisco
  private static handlePing(
    targetIp: string,
    device: NetworkDevice,
    allDevices: NetworkDevice[],
    session: CliSessionState
  ): CliExecutionResult {
    if (!targetIp) {
      return { output: ['% Incomplete command: ping <Target-IP>'], newPrompt: this.getPrompt(device, session) };
    }

    const { targetDevice, reachable } = this.checkReachability(targetIp, device, allDevices);

    const lines = [
      `Type escape sequence to abort.`,
      `Sending 5, 100-byte ICMP Echos to ${targetIp}, timeout is 2 seconds:`,
    ];

    if (reachable && targetDevice) {
      lines.push('!!!!!');
      lines.push('Success rate is 100 percent (5/5), round-trip min/avg/max = 1/3/7 ms');
      return {
        output: lines,
        newPrompt: this.getPrompt(device, session),
        newPacket: {
          linkId: 'sim-ping',
          sourceDeviceId: device.id,
          targetDeviceId: targetDevice.id,
          protocol: 'ICMP',
          sourceIp: device.config.interfaces.find((i) => i.ipAddress)?.ipAddress || '192.168.1.1',
          destinationIp: targetIp,
          sourceMac: device.config.interfaces[0]?.macAddress || '00:00:00:00:00:01',
          destinationMac: targetDevice.config.interfaces[0]?.macAddress || '00:00:00:00:00:02',
          ttl: 64,
          sizeBytes: 100,
          payloadSummary: `Echo (ping) request/reply (5 packets, 100 bytes)`,
        },
      };
    } else {
      lines.push('.....');
      lines.push('Success rate is 0 percent (0/5)');
      return { output: lines, newPrompt: this.getPrompt(device, session) };
    }
  }

  // Ping Handler - Linux
  private static handleLinuxPing(
    parts: string[],
    device: NetworkDevice,
    allDevices: NetworkDevice[],
    session: CliSessionState
  ): CliExecutionResult {
    const targetIp = parts.find((p) => p.match(/^\d+\.\d+\.\d+\.\d+$/)) || parts[1];
    if (!targetIp) {
      return { output: ['ping: missing destination argument'], newPrompt: this.getPrompt(device, session) };
    }

    const { targetDevice, reachable } = this.checkReachability(targetIp, device, allDevices);
    const lines = [`PING ${targetIp} (${targetIp}) 56(84) bytes of data.`];

    if (reachable && targetDevice) {
      lines.push(
        `64 bytes from ${targetIp}: icmp_seq=1 ttl=64 time=0.842 ms`,
        `64 bytes from ${targetIp}: icmp_seq=2 ttl=64 time=0.915 ms`,
        `64 bytes from ${targetIp}: icmp_seq=3 ttl=64 time=0.884 ms`,
        `64 bytes from ${targetIp}: icmp_seq=4 ttl=64 time=0.931 ms`,
        `--- ${targetIp} ping statistics ---`,
        `4 packets transmitted, 4 received, 0% packet loss, time 3004ms`,
        `rtt min/avg/max/mdev = 0.842/0.893/0.931/0.034 ms`
      );

      return {
        output: lines,
        newPrompt: this.getPrompt(device, session),
        newPacket: {
          linkId: 'sim-ping',
          sourceDeviceId: device.id,
          targetDeviceId: targetDevice.id,
          protocol: 'ICMP',
          sourceIp: device.config.interfaces.find((i) => i.ipAddress)?.ipAddress || '192.168.1.10',
          destinationIp: targetIp,
          sourceMac: device.config.interfaces[0]?.macAddress || '00:50:79:66:68:01',
          destinationMac: targetDevice.config.interfaces[0]?.macAddress || '00:50:79:66:68:02',
          ttl: 64,
          sizeBytes: 84,
          payloadSummary: `ICMP Echo Request/Reply seq=1..4 ttl=64`,
        },
      };
    } else {
      lines.push(
        `From ${device.config.interfaces.find((i) => i.ipAddress)?.ipAddress || '192.168.1.10'} icmp_seq=1 Destination Host Unreachable`,
        `From ${device.config.interfaces.find((i) => i.ipAddress)?.ipAddress || '192.168.1.10'} icmp_seq=2 Destination Host Unreachable`,
        `--- ${targetIp} ping statistics ---`,
        `4 packets transmitted, 0 received, +2 errors, 100% packet loss`
      );
      return { output: lines, newPrompt: this.getPrompt(device, session) };
    }
  }

  // Traceroute Handler
  private static handleTraceroute(
    targetIp: string,
    device: NetworkDevice,
    allDevices: NetworkDevice[],
    session: CliSessionState
  ): CliExecutionResult {
    if (!targetIp) return { output: ['% Missing target IP address'], newPrompt: this.getPrompt(device, session) };

    const { targetDevice, reachable } = this.checkReachability(targetIp, device, allDevices);
    const lines = [`Tracing route to ${targetIp} over a maximum of 30 hops:`];

    if (reachable && targetDevice) {
      lines.push(
        `  1  192.168.1.1 (Gateway)  1.124 ms  1.052 ms  0.984 ms`,
        `  2  10.0.0.2 (Transit Router)  3.412 ms  3.289 ms  3.104 ms`,
        `  3  ${targetIp} (${targetDevice.name})  4.812 ms  4.521 ms  4.409 ms`,
        `Trace complete.`
      );
    } else {
      lines.push(
        `  1  192.168.1.1 (Gateway)  1.082 ms  0.994 ms  1.012 ms`,
        `  2  * * * Request timed out.`,
        `  3  * * * Request timed out.`
      );
    }

    return { output: lines, newPrompt: this.getPrompt(device, session) };
  }

  private static checkReachability(
    targetIp: string,
    sourceDevice: NetworkDevice,
    allDevices: NetworkDevice[]
  ): { targetDevice?: NetworkDevice; reachable: boolean } {
    let targetDevice = allDevices.find((d) =>
      d.config.interfaces.some((i) => i.ipAddress === targetIp)
    );

    // Support Network & Cloud node gateways or Internet DNS (8.8.8.8, 1.1.1.1)
    if (!targetDevice) {
      const cloudOrNet = allDevices.find(
        (d) =>
          (d.type === 'cloud' || d.type === 'network') &&
          d.status === 'running' &&
          (d.config.networkConfig?.gatewayIp === targetIp ||
            ((targetIp === '8.8.8.8' || targetIp === '1.1.1.1') &&
              d.config.networkConfig?.internetAccess !== false))
      );
      if (cloudOrNet) {
        targetDevice = cloudOrNet;
      }
    }

    if (!targetDevice) return { reachable: false };
    if (targetDevice.status !== 'running' || sourceDevice.status !== 'running') {
      return { targetDevice, reachable: false };
    }

    // Target interface must be UP (not shutdown) if standard interface exists
    const targetIface = targetDevice.config.interfaces.find((i) => i.ipAddress === targetIp);
    if (targetIface && targetIface.status !== 'up') {
      return { targetDevice, reachable: false };
    }

    // Source device must have at least one UP interface
    const hasSourceActiveIf = sourceDevice.config.interfaces.some((i) => i.status === 'up');
    if (!hasSourceActiveIf) {
      return { targetDevice, reachable: false };
    }

    return { targetDevice, reachable: true };
  }

  // Show Outputs
  private static getShowIpIntBrief(device: NetworkDevice): string[] {
    const header = 'Interface                  IP-Address      OK? Method Status                Protocol';
    const lines = [header];
    device.config.interfaces.forEach((iface) => {
      const nameCol = iface.name.padEnd(26, ' ');
      const ipCol = (iface.ipAddress || 'unassigned').padEnd(16, ' ');
      const okCol = 'YES '.padEnd(4, ' ');
      const methodCol = 'manual'.padEnd(7, ' ');
      const statusStr = iface.status === 'up' ? 'up' : 'administratively down';
      const statusCol = statusStr.padEnd(22, ' ');
      const protoCol = iface.status === 'up' ? 'up' : 'down';
      lines.push(`${nameCol}${ipCol}${okCol}${methodCol}${statusCol}${protoCol}`);
    });
    return lines;
  }

  private static getShowIpRoute(device: NetworkDevice): string[] {
    const lines = [
      'Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP',
      '       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area',
      '       N1 - OSPF NSSA external type 1, N2 - OSPF NSSA external type 2',
      '       E1 - OSPF external type 1, E2 - OSPF external type 2',
      'Gateway of last resort is 10.0.0.1 to network 0.0.0.0',
      '',
    ];

    device.config.interfaces.forEach((iface) => {
      if (iface.ipAddress && iface.status === 'up') {
        lines.push(`C     ${iface.ipAddress}/24 is directly connected, ${iface.name}`);
        lines.push(`L     ${iface.ipAddress}/32 is directly connected, ${iface.name}`);
      }
    });

    device.config.routingProtocols.staticRoutes.forEach((r) => {
      lines.push(`S     ${r.network}/${r.mask} [1/0] via ${r.nextHop}`);
    });

    if (device.config.routingProtocols.ospf) {
      device.config.routingProtocols.ospf.areas.forEach((a) => {
        lines.push(`O     ${a.network}/24 [110/2] via 10.0.0.2, 00:14:22, Gi0/1`);
      });
    }

    if (device.config.routingProtocols.bgp) {
      lines.push(`B     198.51.100.0/24 [20/0] via 198.51.100.1, 01:23:45`);
    }

    return lines;
  }

  private static getShowRunningConfig(device: NetworkDevice): string[] {
    const lines = [
      `! ENSv1 Running Configuration`,
      `! Device: ${device.name}`,
      `! Last configuration evaluation: 2026-03-15 08:30:00`,
      `version 15.2`,
      `service timestamps debug datetime msec`,
      `service timestamps log datetime msec`,
      `no service password-encryption`,
      `!`,
      `hostname ${device.name}`,
      `!`,
    ];

    device.config.interfaces.forEach((i) => {
      lines.push(`interface ${i.name}`);
      if (i.ipAddress && i.subnetMask) {
        lines.push(` ip address ${i.ipAddress} ${i.subnetMask}`);
      }
      lines.push(` duplex ${i.duplex}`);
      lines.push(` speed ${i.speed}`);
      if (i.status === 'down') lines.push(` shutdown`);
      else lines.push(` no shutdown`);
      lines.push(`!`);
    });

    if (device.config.routingProtocols.ospf) {
      const ospf = device.config.routingProtocols.ospf;
      lines.push(`router ospf ${ospf.processId}`);
      lines.push(` router-id ${ospf.routerId}`);
      ospf.areas.forEach((a) => {
        lines.push(` network ${a.network} ${a.wildcard} area ${a.areaId}`);
      });
      lines.push(`!`);
    }

    if (device.config.routingProtocols.bgp) {
      const bgp = device.config.routingProtocols.bgp;
      lines.push(`router bgp ${bgp.asn}`);
      lines.push(` bgp router-id ${bgp.routerId}`);
      bgp.neighbors.forEach((n) => {
        lines.push(` neighbor ${n.ip} remote-as ${n.remoteAs}`);
      });
      lines.push(`!`);
    }

    device.config.routingProtocols.staticRoutes.forEach((r) => {
      lines.push(`ip route ${r.network} ${r.mask} ${r.nextHop}`);
    });

    lines.push(`end`);
    return lines;
  }

  private static getShowVersion(device: NetworkDevice): string[] {
    return [
      `ENSv1 Network Laboratory Engine v1.0.0 (x86_64)`,
      `Compiled on Linux 6.6 with Clang 18.1.0 for ENSv1 Emulation Suite`,
      `Device Model: ${device.vendor} ${device.model}`,
      `Virtual Machine ID: ${device.id}`,
      `Processor: ${device.cpuCores} Virtual Core(s)`,
      `Memory: ${device.ramMb} MB Total Dynamic RAM`,
      `Storage: ${device.diskGb} GB Virtual Disk Image (${device.image})`,
      `Console Subsystem: ${device.consoleType.toUpperCase()} interactive terminal`,
      `Interfaces: ${device.config.interfaces.length} Virtual Ethernet interfaces installed`,
      `Uptime is 42 minutes, 18 seconds`,
      `Configuration register is 0x2102`,
    ];
  }

  private static getShowVlan(device: NetworkDevice): string[] {
    return [
      'VLAN Name                             Status    Ports',
      '---- -------------------------------- --------- -------------------------------',
      '1    default                          active    Gi0/1, Gi0/2, Gi0/3, Gi0/4',
      '10   Engineering                      active    Gi0/5, Gi0/6',
      '20   Management                       active    Gi0/7',
      '1002 fddi-default                     act/unsup',
      '1003 token-ring-default               act/unsup',
    ];
  }

  private static getShowMacTable(device: NetworkDevice): string[] {
    return [
      '          Mac Address Table',
      '-------------------------------------------',
      'Vlan    Mac Address       Type        Ports',
      '----    -----------       --------    -----',
      '   1    0050.7966.6801    DYNAMIC     Gi0/1',
      '   1    0050.7966.6802    DYNAMIC     Gi0/2',
      '   1    c201.141b.0000    DYNAMIC     Gi0/3',
      'Total Mac Addresses for this criterion: 3',
    ];
  }

  // --------------------------------------------------------------------------
  // CISCO VIPTELA SD-WAN (vManage, vBond, vEdge) CLI ENGINE
  // --------------------------------------------------------------------------
  private static executeViptela(
    cmd: string,
    device: NetworkDevice,
    session: CliSessionState,
    allDevices: NetworkDevice[]
  ): CliExecutionResult {
    const parts = cmd.split(/\s+/);
    const main = parts[0]?.toLowerCase();
    const arg1 = parts[1]?.toLowerCase();
    const arg2 = parts[2]?.toLowerCase();
    const arg3 = parts[3]?.toLowerCase();

    const output: string[] = [];
    let updatedDevice: Partial<NetworkDevice> | undefined;
    const sdConfig = device.config.sdwanConfig || {
      role: (device.config.osType?.replace('viptela_', '') as any) || 'vedge',
      systemIp: '10.255.255.1',
      siteId: 10,
      organizationName: 'Cisco-Viptela-SDWAN-Lab',
      controlStatus: 'connected',
      vBondAddress: '198.51.100.1',
      tlocColor: 'biz-internet',
      ompPeersCount: 2,
      bfdSessionsCount: 4,
    };

    // Navigation and Modes
    if (cmd === 'exit' || cmd === 'quit') {
      if (session.mode === 'config') {
        session.mode = 'privileged';
        return { output: [], newPrompt: this.getPrompt(device, session) };
      }
      return { output: ['[Connection to Viptela node closed]'], newPrompt: this.getPrompt(device, session) };
    }

    if (cmd === 'config' || cmd === 'conf' || cmd === 'conf t' || cmd === 'configure terminal') {
      session.mode = 'config';
      output.push('Entering configuration mode: terminal');
      return { output, newPrompt: this.getPrompt(device, session) };
    }

    // Config Mode Commands
    if (session.mode === 'config') {
      if (cmd.startsWith('system-ip ')) {
        const ip = parts[1];
        if (ip) {
          updatedDevice = {
            config: {
              ...device.config,
              sdwanConfig: { ...sdConfig, systemIp: ip },
            },
          };
          output.push(`system system-ip ${ip}`);
        }
        return { output, newPrompt: this.getPrompt(device, session), updatedDevice };
      }

      if (cmd.startsWith('site-id ')) {
        const sid = Number(parts[1]);
        if (sid) {
          updatedDevice = {
            config: {
              ...device.config,
              sdwanConfig: { ...sdConfig, siteId: sid },
            },
          };
          output.push(`system site-id ${sid}`);
        }
        return { output, newPrompt: this.getPrompt(device, session), updatedDevice };
      }

      if (cmd.startsWith('organization-name ') || cmd.startsWith('org-name ')) {
        const org = parts.slice(1).join(' ').replace(/['"]/g, '');
        if (org) {
          updatedDevice = {
            config: {
              ...device.config,
              sdwanConfig: { ...sdConfig, organizationName: org },
            },
          };
          output.push(`system organization-name "${org}"`);
        }
        return { output, newPrompt: this.getPrompt(device, session), updatedDevice };
      }

      if (cmd.startsWith('vbond ')) {
        const vbond = parts[1];
        if (vbond) {
          updatedDevice = {
            config: {
              ...device.config,
              sdwanConfig: { ...sdConfig, vBondAddress: vbond },
            },
          };
          output.push(`system vbond ${vbond}`);
        }
        return { output, newPrompt: this.getPrompt(device, session), updatedDevice };
      }

      if (cmd === 'commit' || cmd === 'commit and-quit') {
        output.push('Commit complete.');
        if (cmd === 'commit and-quit') {
          session.mode = 'privileged';
        }
        return { output, newPrompt: this.getPrompt(device, session), updatedDevice };
      }
    }

    // SHOW COMMANDS
    if (main === 'show') {
      if (arg1 === 'control' && arg2 === 'connections') {
        output.push('                                                        PEER                                          PEER');
        output.push('PEER    PEER TYPE   PROT  SITE ID  DOMAIN ID  PEER PRIVATE IP  PEER PUBLIC IP   PORT   ORGANIZATION      STATE');
        output.push('-------------------------------------------------------------------------------------------------------------');
        output.push(`vbond   vbond       dtls  100      0          ${sdConfig.vBondAddress || '198.51.100.1'}     ${sdConfig.vBondAddress || '198.51.100.1'}    12346  ${sdConfig.organizationName}  up`);
        output.push(`vmanage vmanage     tls   100      0          10.255.255.1     10.255.255.1     23456  ${sdConfig.organizationName}  up`);
        output.push(`vsmart  vsmart      tls   100      1          10.255.255.3     10.255.255.3     23456  ${sdConfig.organizationName}  up`);
        return { output, newPrompt: this.getPrompt(device, session) };
      }

      if (arg1 === 'control' && (arg2 === 'local-properties' || arg2 === 'valid-vsmarts')) {
        output.push(`personality          ${sdConfig.role}`);
        output.push(`organization-name    ${sdConfig.organizationName}`);
        output.push(`site-id              ${sdConfig.siteId}`);
        output.push(`system-ip            ${sdConfig.systemIp}`);
        output.push(`vbond                ${sdConfig.vBondAddress || '198.51.100.1'}`);
        output.push(`enterprise-cert-status VALID`);
        output.push(`chassis-number       VEDGE-CLOUD-${device.id.slice(0, 8).toUpperCase()}`);
        output.push(`serial-number        98A4-${device.id.slice(0, 6).toUpperCase()}`);
        return { output, newPrompt: this.getPrompt(device, session) };
      }

      if (arg1 === 'omp' && (arg2 === 'peers' || !arg2)) {
        output.push('                                                    ADDRESS                                     OVERLAY INSTANCE');
        output.push('PEER            TYPE     SITE ID  DOMAIN ID  STATE  FAMILY   TLOC STATE  COLOR            BFD STATE ID');
        output.push('-------------------------------------------------------------------------------------------------------');
        output.push(`10.255.255.3    vsmart   100      1          up     ipv4     installed   ${sdConfig.tlocColor || 'biz-internet'}     up        0`);
        output.push(`10.255.255.4    vsmart   100      1          up     ipv4     installed   ${sdConfig.tlocColor || 'biz-internet'}     up        0`);
        return { output, newPrompt: this.getPrompt(device, session) };
      }

      if (arg1 === 'omp' && (arg2 === 'routes' || arg2 === 'tlocs')) {
        output.push('-------------------------------------------------------------------------');
        output.push('VPN    PREFIX              FROM PEER       COLOR            ENCAP  STATUS');
        output.push('-------------------------------------------------------------------------');
        output.push(`0      0.0.0.0/0           10.255.255.3    ${sdConfig.tlocColor || 'biz-internet'}     ipsec  C,I,R`);
        output.push(`10     10.10.10.0/24       10.255.255.3    ${sdConfig.tlocColor || 'biz-internet'}     ipsec  C,I,R`);
        output.push(`20     172.16.20.0/24      10.255.255.3    ${sdConfig.tlocColor || 'biz-internet'}     ipsec  C,I,R`);
        return { output, newPrompt: this.getPrompt(device, session) };
      }

      if (arg1 === 'bfd' && (arg2 === 'sessions' || arg2 === 'summary')) {
        output.push('                                      SRC DATA  DST DATA  TX     RX     MULT');
        output.push('SYSTEM IP       SITE ID  STATE  COLOR COLOR     TRANS     INTVL  INTVL  IPL STATE');
        output.push('--------------------------------------------------------------------------------');
        output.push(`10.255.255.10   100      up     biz-int biz-int ipsec     1000   1000   7   up`);
        output.push(`10.255.255.20   20       up     mpls    mpls    ipsec     1000   1000   7   up`);
        output.push(`10.255.255.30   30       up     biz-int biz-int ipsec     1000   1000   7   up`);
        return { output, newPrompt: this.getPrompt(device, session) };
      }

      if (arg1 === 'ip' && arg2 === 'routes') {
        output.push('Codes: C - connected, S - static, O - OMP, B - BGP');
        output.push('Routing Table: VPN 0');
        output.push('C    198.51.100.0/24 is directly connected, ge0/0');
        output.push('Routing Table: VPN 10');
        output.push('C    10.10.10.0/24 is directly connected, ge0/1');
        output.push(`O    10.20.20.0/24 [251/0] via ${sdConfig.systemIp}, color ${sdConfig.tlocColor}`);
        return { output, newPrompt: this.getPrompt(device, session) };
      }

      if (arg1 === 'version' || arg1 === 'system' || arg1 === 'hardware') {
        output.push(`Cisco Viptela OS Version: 20.9.3`);
        output.push(`Device Role: ${sdConfig.role.toUpperCase()}`);
        output.push(`Device Model: ${device.vendor} ${device.model}`);
        output.push(`System IP: ${sdConfig.systemIp}`);
        output.push(`Site ID: ${sdConfig.siteId}`);
        output.push(`Organization: ${sdConfig.organizationName}`);
        output.push(`Uptime: 5 days, 08:14:22`);
        return { output, newPrompt: this.getPrompt(device, session) };
      }

      if (arg1 === 'run' || arg1 === 'running' || arg1 === 'running-config') {
        output.push('system');
        output.push(` host-name             ${device.name}`);
        output.push(` system-ip             ${sdConfig.systemIp}`);
        output.push(` site-id               ${sdConfig.siteId}`);
        output.push(` organization-name     "${sdConfig.organizationName}"`);
        output.push(` vbond                 ${sdConfig.vBondAddress || '198.51.100.1'}`);
        output.push('!');
        output.push('vpn 0');
        output.push(' interface ge0/0');
        output.push('  ip address 198.51.100.25/24');
        output.push(`  tunnel-interface`);
        output.push(`   encapsulation ipsec`);
        output.push(`   color ${sdConfig.tlocColor || 'biz-internet'}`);
        output.push('   no shutdown');
        output.push('!');
        output.push('vpn 512');
        output.push(' interface eth0');
        output.push('  ip address 192.168.1.10/24');
        output.push('  no shutdown');
        output.push('!');
        return { output, newPrompt: this.getPrompt(device, session) };
      }

      if (arg1 === 'interface' || arg1 === 'interfaces') {
        output.push('Interface   Admin  Oper  IPv4 Address     Mask           MTU   Encap');
        output.push('---------------------------------------------------------------------');
        device.config.interfaces.forEach((iface) => {
          output.push(`${iface.name.padEnd(11, ' ')} ${iface.status.padEnd(6, ' ')} up    ${(iface.ipAddress || 'unassigned').padEnd(16, ' ')} 255.255.255.0  1500  null`);
        });
        return { output, newPrompt: this.getPrompt(device, session) };
      }
    }

    // Ping utility
    if (main === 'ping' && parts[1]) {
      const target = parts[1];
      output.push(`Ping to ${target} (using VPN 0 transport):`);
      output.push(`Sending 5, 100-byte ICMP Echos to ${target}, timeout is 2 seconds:`);
      output.push(`!!!!!`);
      output.push(`Success rate is 100 percent (5/5), round-trip min/avg/max = 1/2/4 ms`);
      return { output, newPrompt: this.getPrompt(device, session) };
    }

    // Default Fallback
    output.push(`% Invalid Viptela command: "${cmd}". Type "?" or "show control connections" for assistance.`);
    return { output, newPrompt: this.getPrompt(device, session) };
  }
}

