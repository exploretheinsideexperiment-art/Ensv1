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

    if (device.config.osType === 'generic_linux') {
      return this.executeLinux(cmd, device, session, allDevices);
    } else {
      return this.executeCisco(cmd, device, session, allDevices);
    }
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
        const ifName = parts[1];
        const iface = device.config.interfaces.find((i) => i.name.toLowerCase() === ifName?.toLowerCase());
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

      if (cmd === 'no shutdown' || cmd === 'no shut') {
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

      if (cmd === 'shutdown' || cmd === 'shut') {
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
    const targetDevice = allDevices.find((d) =>
      d.config.interfaces.some((i) => i.ipAddress === targetIp)
    );

    if (!targetDevice) return { reachable: false };
    if (targetDevice.status !== 'running' || sourceDevice.status !== 'running') {
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
}
