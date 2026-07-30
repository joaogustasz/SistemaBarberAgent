import React, { useEffect, useState } from "react";
import { TrendingUp, Users, Calendar } from "lucide-react";
import { api } from "../../api/client";
import { Spinner } from "../../components/ui";
import { addDaysISO, todayISO, centsToBRL } from "../../utils/format";

export default function AdminReports() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getReports(addDaysISO(-6), todayISO()).then(setData);
  }, []);

  if (!data) return <Spinner />;

  const maxCount = Math.max(1, ...data.byDay.map((d) => d.total));
  const maxService = data.topServices[0]?.total || 1;

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-stone-50">Relatórios</h1>
      <p className="text-sm text-stone-500">Últimos 7 dias.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat icon={TrendingUp} label="Faturamento estimado" value={`R$ ${centsToBRL(data.revenueCents)}`} />
        <Stat icon={Users} label="Clientes atendidos" value={data.clientsAttended} />
        <Stat icon={Calendar} label="Total de agendamentos" value={data.totalAppointments} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="border border-stone-800 bg-stone-900 p-5">
          <p className="mb-4 text-sm font-semibold text-stone-200">Agendamentos por dia</p>
          <div className="flex h-40 items-end gap-2">
            {data.byDay.length === 0 ? (
              <p className="text-sm text-stone-500">Sem dados no período.</p>
            ) : data.byDay.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full bg-amber-600" style={{ height: `${(d.total / maxCount) * 100}%`, minHeight: "6px" }} />
                <span className="text-[10px] text-stone-500">{new Date(d.date).toLocaleDateString("pt-BR", { weekday: "narrow" })}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-stone-800 bg-stone-900 p-5">
          <p className="mb-4 text-sm font-semibold text-stone-200">Serviços mais usados</p>
          <div className="space-y-3">
            {data.topServices.length === 0 ? (
              <p className="text-sm text-stone-500">Sem dados suficientes.</p>
            ) : data.topServices.map((s) => (
              <div key={s.name}>
                <div className="flex justify-between text-xs text-stone-400"><span>{s.name}</span><span>{s.total}</span></div>
                <div className="mt-1 h-1.5 w-full bg-stone-800"><div className="h-1.5 bg-amber-600" style={{ width: `${(s.total / maxService) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="border border-stone-800 bg-stone-900 p-5">
      <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-stone-500"><Icon className="h-4 w-4 text-amber-500" /> {label}</p>
      <p className="mt-2 font-serif text-3xl font-bold text-stone-50">{value}</p>
    </div>
  );
}
