'use client';

import React from 'react';
import { useSovereigntyStore } from '@/store/useSovereigntyStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Download, Link2, Loader2, CheckCircle2 } from 'lucide-react';

export function TamperEvidentLogViewer() {
  const { 
    auditLogs, 
    verifyChainIntegrity, 
    exportAuditCertificate, 
    isVerifyingChain, 
    chainVerificationStatus 
  } = useSovereigntyStore();

  return (
    <Card className="border-[#262626] bg-[#111111]">
      <CardHeader className="py-3 px-4 border-b border-[#262626]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Link2 className="h-4 w-4 text-[#00e599]" />
            <CardTitle className="text-xs font-semibold text-[#ededed]">
              Cryptographic Tamper-Evident Audit Log (SHA-256 Chained)
            </CardTitle>
            <Badge variant="outline" className="font-mono text-[10px]">
              {auditLogs.length} blocks chained
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={verifyChainIntegrity}
              disabled={isVerifyingChain}
              className="h-7 text-xs flex items-center space-x-1"
            >
              {isVerifyingChain ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-[#0070f3]" />
                  <span>Verifying Hashes...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3 text-[#00e599]" />
                  <span>Verify Chain Integrity</span>
                </>
              )}
            </Button>

            <Button
              size="sm"
              variant="sovereign"
              onClick={exportAuditCertificate}
              className="h-7 text-xs flex items-center space-x-1"
            >
              <Download className="h-3 w-3 mr-1" />
              <span>Export Audit Certificate (.json)</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0a0a0a] text-[#888888] text-[11px] font-mono border-b border-[#262626]">
              <tr>
                <th className="py-2.5 px-3.5">Block #</th>
                <th className="py-2.5 px-3.5">Timestamp</th>
                <th className="py-2.5 px-3.5">Event Type</th>
                <th className="py-2.5 px-3.5">Current SHA-256 Hash</th>
                <th className="py-2.5 px-3.5">Parent Hash</th>
                <th className="py-2.5 px-3.5 text-right">Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]/50 font-mono text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.sequence} className="hover:bg-[#141414]">
                  <td className="py-2 px-3.5 text-[#ededed] font-semibold">#{log.sequence}</td>
                  <td className="py-2 px-3.5 text-[#888888]">{log.timestamp}</td>
                  <td className="py-2 px-3.5 text-[#0070f3]">{log.event}</td>
                  <td className="py-2 px-3.5 text-[#ededed]">
                    <span title={log.block_hash}>
                      {log.block_hash.substring(0, 16)}...{log.block_hash.substring(log.block_hash.length - 8)}
                    </span>
                  </td>
                  <td className="py-2 px-3.5 text-[#666666]">
                    <span title={log.prev_hash}>
                      {log.prev_hash.substring(0, 16)}...
                    </span>
                  </td>
                  <td className="py-2 px-3.5 text-right">
                    <span className="inline-flex items-center text-[#00e599] text-[10px]">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      VALID
                    </span>
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
