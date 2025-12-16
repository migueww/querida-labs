import { AppLayout } from "@/components/app-layout";

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Bem-vinda, Ana Clara!
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Você fez login com sucesso usando as credenciais padrão.
        </p>
      </div>
    </AppLayout>
  );
}


