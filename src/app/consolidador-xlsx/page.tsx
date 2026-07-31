"use client";

import { AppLayout } from "@/components/app-layout";
import { ExcelConsolidator } from "@/components/modules/excel/excel-consolidator";

export default function ConsolidadorXLSXPage() {
  return (
    <AppLayout>
      <div className="w-full flex justify-center py-4">
        <ExcelConsolidator />
      </div>
    </AppLayout>
  );
}
