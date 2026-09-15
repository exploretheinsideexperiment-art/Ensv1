import React, { useState } from 'react';
import { NetworkLink, NetworkDevice, SimulatedPacket } from '../types/network';
import { Activity, X, Download, Play, Square, Filter, ChevronRight, ChevronDown } from 'lucide-react';

interface PacketInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  links: NetworkLink[];
  devices: NetworkDevice[];
  capturedPackets: SimulatedPacket[];
  onClearCapture: () => void;
}

export const PacketInspectorModal: React.FC<PacketInspectorModalProps> = ({
  isOpen,
  onClose,
  links,
  devices,
  capturedPackets,
  onClearCapture,
}) => {
  const [selectedPktIndex, setSelectedPktIndex] = useState<number>(0);
  const [protocolFilter, setProtocolFilter] = useState<string>('all');
  const [expandedLayer, setExpandedLayer] = useState<{ [key: string]: boolean }>({
    eth: true,
    ip: true,
    proto: true,
  });

  if (!isOpen) return null;

  const filteredPackets = capturedPackets.filter((p) => {
    if (protocolFilter === 'all') return true;
    return p.protocol.toLowerCase() === protocolFilter.toLowerCase();
  });

  const activePacket = filteredPackets[selectedPktIndex] || filteredPackets[0];

  const toggleLayer = (layer: string) => {
    setExpandedLayer((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const exportCaptureText = () => {
    const jsonStr = JSON.stringify(capturedPackets, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ensv1-packet-capture-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3 bg-[#0a101d]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                ENSv1 Packet Sniffer & Protocol Analyzer
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Live Buffer: {capturedPackets.length} Packets
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Deep packet inspection across virtual links and interfaces</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCaptureText}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export PCAP Data</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-950/70 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-400 text-[11px]">Display Filter:</span>
            {['all', 'icmp', 'ospf', 'bgp', 'arp', 'tcp'].map((proto) => (
              <button
                key={proto}
                onClick={() => {
                  setProtocolFilter(proto);
                  setSelectedPktIndex(0);
                }}
                className={`px-2.5 py-0.5 rounded font-mono uppercase text-[10px] transition ${
                  protocolFilter === proto
                    ? 'bg-sky-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {proto}
              </button>
            ))}
          </div>

          <button
            onClick={onClearCapture}
            className="text-[11px] text-slate-400 hover:text-red-400 transition"
          >
            Clear Buffer
          </button>
        </div>

        {/* 1. Packet List Table (Top Half) */}
        <div className="h-1/2 overflow-y-auto border-b border-slate-800 bg-[#060a12]">
          <table className="w-full text-left font-mono text-[11px]">
            <thead className="sticky top-0 bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2 px-3 w-12">No.</th>
                <th className="py-2 px-3 w-28">Source IP</th>
                <th className="py-2 px-3 w-28">Destination IP</th>
                <th className="py-2 px-3 w-20">Protocol</th>
                <th className="py-2 px-3 w-16">Length</th>
                <th className="py-2 px-3">Information Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPackets.map((pkt, idx) => {
                const isSelected = (filteredPackets[selectedPktIndex] || activePacket)?.id === pkt.id;
                const protoColor =
                  pkt.protocol === 'ICMP'
                    ? 'text-sky-400'
                    : pkt.protocol === 'OSPF'
                    ? 'text-emerald-400'
                    : pkt.protocol === 'BGP'
                    ? 'text-purple-400'
                    : 'text-amber-400';

                return (
                  <tr
                    key={pkt.id}
                    onClick={() => setSelectedPktIndex(idx)}
                    className={`cursor-pointer transition ${
                      isSelected
                        ? 'bg-sky-950/70 text-white font-bold border-l-4 border-sky-400'
                        : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <td className="py-1.5 px-3 text-slate-500">{idx + 1}</td>
                    <td className="py-1.5 px-3">{pkt.sourceIp}</td>
                    <td className="py-1.5 px-3">{pkt.destinationIp}</td>
                    <td className={`py-1.5 px-3 font-bold ${protoColor}`}>{pkt.protocol}</td>
                    <td className="py-1.5 px-3 text-slate-400">{pkt.sizeBytes} B</td>
                    <td className="py-1.5 px-3 truncate text-slate-200">{pkt.payloadSummary}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 2. Packet Dissection & Hex Tree (Bottom Half) */}
        <div className="h-1/2 p-4 overflow-y-auto bg-slate-950 text-xs font-mono space-y-2">
          {activePacket ? (
            <>
              {/* Frame Layer */}
              <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden">
                <button
                  onClick={() => toggleLayer('eth')}
                  className="w-full flex items-center justify-between p-2 text-slate-300 hover:text-white bg-slate-900 font-semibold"
                >
                  <span className="flex items-center gap-1">
                    {expandedLayer.eth ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    Ethernet II, Src: {activePacket.sourceMac}, Dst: {activePacket.destinationMac}
                  </span>
                  <span className="text-[10px] text-slate-500">Layer 2 Data Link</span>
                </button>
                {expandedLayer.eth && (
                  <div className="p-2.5 pt-0 text-[11px] text-slate-400 space-y-0.5 border-t border-slate-800/60 pl-6">
                    <p>Destination: {activePacket.destinationMac}</p>
                    <p>Source: {activePacket.sourceMac}</p>
                    <p>Type: IPv4 (0x0800)</p>
                  </div>
                )}
              </div>

              {/* IP Layer */}
              <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden">
                <button
                  onClick={() => toggleLayer('ip')}
                  className="w-full flex items-center justify-between p-2 text-slate-300 hover:text-white bg-slate-900 font-semibold"
                >
                  <span className="flex items-center gap-1">
                    {expandedLayer.ip ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    Internet Protocol Version 4, Src: {activePacket.sourceIp}, Dst: {activePacket.destinationIp}
                  </span>
                  <span className="text-[10px] text-slate-500">Layer 3 Network</span>
                </button>
                {expandedLayer.ip && (
                  <div className="p-2.5 pt-0 text-[11px] text-slate-400 space-y-0.5 border-t border-slate-800/60 pl-6">
                    <p>Header Length: 20 bytes (5)</p>
                    <p>Total Length: {activePacket.sizeBytes}</p>
                    <p>Time to Live (TTL): {activePacket.ttl}</p>
                    <p>Protocol: {activePacket.protocol} ({activePacket.protocol === 'ICMP' ? 1 : activePacket.protocol === 'OSPF' ? 89 : 6})</p>
                    <p>Source Address: {activePacket.sourceIp}</p>
                    <p>Destination Address: {activePacket.destinationIp}</p>
                  </div>
                )}
              </div>

              {/* Protocol / Application Layer */}
              <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden">
                <button
                  onClick={() => toggleLayer('proto')}
                  className="w-full flex items-center justify-between p-2 text-slate-300 hover:text-white bg-slate-900 font-semibold"
                >
                  <span className="flex items-center gap-1">
                    {expandedLayer.proto ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    {activePacket.protocol} Protocol Payload Data
                  </span>
                  <span className="text-[10px] text-sky-400">Layer 4/7 Payload</span>
                </button>
                {expandedLayer.proto && (
                  <div className="p-2.5 pt-0 text-[11px] text-slate-400 space-y-0.5 border-t border-slate-800/60 pl-6">
                    <p className="text-emerald-400">{activePacket.payloadSummary}</p>
                    <p className="text-slate-500">Payload Hex Stream: 45 00 00 54 28 a1 40 00 40 01 bd 3f c0 a8 01 01 c0 a8 01 02</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center text-slate-500 py-10">
              No packet selected or buffer is currently empty. Start devices and execute "ping" in console to capture live packets!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
