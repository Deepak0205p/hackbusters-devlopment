'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useDeliverableStore } from '@/store/useDeliverableStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, FileSpreadsheet, Presentation, Code2, Download, Eye } from 'lucide-react';

const typeIconMap = {
  docx: <FileText className="h-5 w-5 text-[#0070f3]" />,
  xlsx: <FileSpreadsheet className="h-5 w-5 text-[#00e599]" />,
  pptx: <Presentation className="h-5 w-5 text-[#f5a623]" />,
  py: <Code2 className="h-5 w-5 text-[#0070f3]" />,
};

export function DeliverableCardGrid() {
  const { deliverables, filterType, searchQuery, selectDeliverable, downloadDeliverable } = useDeliverableStore();

  const filtered = deliverables.filter((d) => {
    const matchesType = filterType === 'ALL' || d.type === filterType;
    const matchesSearch = 
      d.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.source_scenario.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.generating_model.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (filtered.length === 0) {
    return (
      <Card className="border-[#262626] bg-[#111111] p-12 text-center text-xs text-[#666666] min-h-[180px] flex items-center justify-center">
        No deliverables matching current filters.
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {filtered.map((item, idx) => (
        <motion.div
          key={item.id}
          /* Staggered entrance animation per emil-design-eng & ui-ux-pro-max */
          initial={{ opacity: 0, transform: "scale(0.97) translateY(8px)" }}
          animate={{ opacity: 1, transform: "scale(1) translateY(0px)" }}
          transition={{ type: "spring", stiffness: 120, damping: 20, delay: idx * 0.05 }}
        >
          <Card className="border-[#262626] bg-[#111111] hover:border-[#333333] transition-colors flex flex-col justify-between h-full min-h-[260px]">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded bg-[#171717] border border-[#262626]">
                    {typeIconMap[item.type]}
                  </div>
                  <div>
                    <CardTitle className="text-xs font-semibold text-[#ededed] line-clamp-1">
                      {item.filename}
                    </CardTitle>
                    <span className="text-[11px] font-mono text-[#888888]">
                      {item.size_formatted} &bull; {item.generated_timestamp}
                    </span>
                  </div>
                </div>

                <Badge variant="outline" className="text-[10px] uppercase font-mono shrink-0">
                  {item.type}
                </Badge>
              </div>

              <div className="pt-2 flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-[10px]">
                  {item.source_scenario}
                </Badge>
                <Badge variant="outline" className="text-[10px] text-[#888888]">
                  {item.source_requirement}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="py-2 text-xs space-y-2">
              <CardDescription className="text-xs text-[#888888] line-clamp-2 min-h-[32px]">
                {item.summary}
              </CardDescription>

              <div className="p-2 rounded bg-[#0a0a0a] border border-[#262626] text-[11px] font-mono space-y-1">
                <div className="flex items-center justify-between text-[#666666]">
                  <span>Model:</span>
                  <span className="text-[#ededed]">{item.generating_model}</span>
                </div>
                <div className="flex items-center justify-between text-[#666666]">
                  <span>SHA-256:</span>
                  <span className="text-[#888888]" title={item.sha256_hash}>
                    {item.sha256_hash.substring(0, 10)}...
                  </span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-2 border-t border-[#262626]/60 flex items-center justify-between mt-2 min-h-[52px]">
              {/* 44px touch targets */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => selectDeliverable(item.id)}
                className="min-h-[44px] h-9 px-3 text-xs text-[#888888] hover:text-[#ededed] active:scale-[0.97] transition-transform"
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                <span>Preview</span>
              </Button>

              <Button
                size="sm"
                variant="primary"
                onClick={() => downloadDeliverable(item.id)}
                className="min-h-[44px] h-9 px-3.5 text-xs flex items-center space-x-1.5 active:scale-[0.97] transition-transform"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                <span>Download</span>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
