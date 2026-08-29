'use client';

import React from 'react';
import { useDeliverableStore, DeliverableType } from '@/store/useDeliverableStore';
import { Search } from 'lucide-react';

export function DeliverableFilterToolbar() {
  const { filterType, setFilterType, searchQuery, setSearchQuery, deliverables } = useDeliverableStore();

  const filterButtons: { id: 'ALL' | DeliverableType; label: string }[] = [
    { id: 'ALL', label: `All Files (${deliverables.length})` },
    { id: 'docx', label: 'Word (.docx)' },
    { id: 'xlsx', label: 'Excel (.xlsx)' },
    { id: 'pptx', label: 'PowerPoint (.pptx)' },
    { id: 'py', label: 'Python (.py)' },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pb-2">
      {/* Type Filter Buttons */}
      <div className="flex flex-wrap items-center gap-1.5">
        {filterButtons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilterType(btn.id)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              filterType === btn.id
                ? 'bg-[#1f1f1f] text-white border border-[#333333]'
                : 'text-[#888888] hover:text-[#ededed] hover:bg-[#141414]'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="h-3.5 w-3.5 absolute left-2.5 top-2 text-[#666666]" />
        <input
          type="text"
          placeholder="Search deliverables..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-7 pl-8 pr-3 rounded bg-[#0a0a0a] border border-[#262626] text-[11px] text-[#ededed] placeholder:text-[#666666] focus:outline-none focus:border-[#0070f3]"
        />
      </div>
    </div>
  );
}
