import { AppLayout } from "@/components/app-layout";

export default function ConsolidadorXLSXPage() {
  return (
    <AppLayout>
      <div className="w-full max-w-4xl">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            Consolidador XLSX
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            Ferramenta para consolidar arquivos Excel (.xlsx) em um único arquivo.
          </p>
          
          <div className="mt-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600 text-center">
              Funcionalidade em desenvolvimento...
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

