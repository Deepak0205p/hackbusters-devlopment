'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radio, Eye, EyeOff, ShieldCheck, Wifi } from 'lucide-react';

interface HotspotCredentialCardProps {
  deploymentMode: string;
}

export function HotspotCredentialCard({ deploymentMode }: HotspotCredentialCardProps) {
  const [showPassword, setShowPassword] = useState(false);

  const isHotspot = deploymentMode === 'HOTSPOT_OPTION_B';

  return (
    <Card className="border-gray-200 bg-gray-100 min-h-[220px] flex flex-col justify-between">
      <CardHeader className="py-3 px-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-xs font-semibold text-gray-900">
              Wi-Fi Connection Instructions
            </CardTitle>
          </div>
          <Badge variant={isHotspot ? "active" : "secondary"}>
            {isHotspot ? "Option B (Host Hotspot)" : "Option A (Venue LAN)"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3 text-xs">
        {/* Step-by-Step Functional Guide */}
        <div className="space-y-1.5 font-mono text-[11px] text-gray-500">
          <p className="text-gray-900 font-medium">1. Join Network:</p>
          <p className="pl-3">
            {isHotspot 
              ? "Connect your smartphone/laptop to the dedicated workstation hotspot."
              : "Ensure your device is connected to the venue local Wi-Fi."}
          </p>

          <p className="text-gray-900 font-medium pt-1">2. Access Workbench:</p>
          <p className="pl-3">Scan the QR code or navigate to the displayed host URL.</p>
        </div>

        {/* Hotspot Credentials Box (Active if in Option B) */}
        {isHotspot && (
          <div className="p-3 rounded-md bg-gray-50 border border-gray-200 space-y-2 font-mono text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">SSID (Network):</span>
              <span className="text-gray-900 font-semibold">MRPL-SOVEREIGN-AI</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Security Key:</span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-900 font-semibold">
                  {showPassword ? "MRPL2026Sovereign" : "••••••••••••••••"}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPassword(!showPassword)}
                  className="h-7 px-2 min-h-[44px] text-gray-500 hover:text-gray-900 active:scale-[0.97]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 text-[10px]">
              <span className="text-gray-400">Internet Sharing:</span>
              <span className="text-emerald-600 font-medium flex items-center">
                <ShieldCheck className="h-3 w-3 mr-1" />
                OFF (Air-Gap Enforced)
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
