"use client";

import { Printer } from "lucide-react";

export function PrintWorkbookButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-1.5 px-4 py-2 bg-[#2D5A3D] text-white text-sm font-medium rounded-lg hover:bg-[#245033] transition-colors"
    >
      <Printer size={14} />
      Print / Save PDF
    </button>
  );
}
