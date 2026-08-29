'use client';

import React, { useState } from 'react';
import { useSovereigntyStore } from '@/store/useSovereigntyStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, ShieldCheck, Search } from 'lucide-react';

export function ActiveSocketTable() {
  const { sockets, metrics } = useSovereigntyStore();
  const [filterQuery, setFilterQuery] = useState('');

  const filteredSockets = sockets.filter((s) => 
    s.process_name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    s.local_address.includes(filterQuery) ||
    s.remote_address.includes(filterQuery)
  );

  return (
    <Card className="border-[#262626] bg-[#111111]">
      <CardHeader className="py-3 px-4 border-b border-[#262626]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Network className="h-4 w-4 text-[#0070f3]" />
            <CardTitle className="text-xs font-semibold text-[#ededed]">
              Active Socket Connection Sniffer (psutil Daemon)
            </CardTitle>
            <Badge variant="outline" className="font-mono text-[10px]">
              {sockets.length} open sockets audited
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="h-3 w-3 absolute left-2.5 top-2 text-[#666666]" />
              <input
                type="text"
                placeholder="Filter sockets / IPs..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="h-7 pl-7 pr-2.5 rounded bg-[#0a0a0a] border border-[#262626] text-[11px] text-[#ededed] placeholder:text-[#666666] focus:outline-none focus:border-[#0070f3]"
              />
            </div>
            <span className="text-[11px] font-mono text-[#00e599] flex items-center">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              All Permitted
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0a0a0a] text-[#888888] text-[11px] font-mono border-b border-[#262626]">
              <tr>
                <th className="py-2.5 px-3.5">PID</th>
                <th className="py-2.5 px-3.5">Process Name</th>
                <th className="py-2.5 px-3.5">Local Binding</th>
                <th className="py-2.5 px-3.5">Remote Endpoint</th>
                <th className="py-2.5 px-3.5">Tier Classification</th>
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5 text-right">Security Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]/50 font-mono text-[11px]">
              {filteredSockets.map((sock) => (
                <tr key={sock.id} className="hover:bg-[#141414]">
                  <td className="py-2 px-3.5 text-[#666666]">{sock.pid}</td>
                  <td className="py-2 px-3.5 text-[#ededed] font-medium">{sock.process_name}</td>
                  <td className="py-2 px-3.5 text-[#888888]">{sock.local_address}</td>
                  <td className="py-2 px-3.5 text-[#ededed]">{sock.remote_address}</td>
                  <td className="py-2 px-3.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                      sock.tier === 'LOCALHOST'
                        ? 'border-[#333333] bg-[#1f1f1f] text-[#888888]'
                        : sock.tier === 'LAN_HOTSPOT'
                        ? 'border-[#0070f3]/40 bg-[#0070f3]/10 text-[#0070f3]'
                        : 'border-[#e5484d] bg-[#e5484d]/10 text-[#e5484d]'
                    }`}>
                      {sock.tier}
                    </span>
                  </td>
                  <td className="py-2 px-3.5 text-[#888888]">{sock.status}</td>
                  <td className="py-2 px-3.5 text-right">
                    <Badge variant="success" className="text-[10px] py-0">
                      {sock.security_verdict}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
