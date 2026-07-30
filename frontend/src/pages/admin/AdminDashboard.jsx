import React, { useEffect, useState } from "react";
import { Calendar, Clock, Wallet } from "lucide-react";
import { api } from "../../api/client";
import { Badge, Spinner, EmptyState } from "../../components/ui";
import { todayISO, centsToBRL } from "../../utils/format";

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAppointments({ date: todayISO() }).then((d) => setAppointments(d.appointments)).finally(() => setLoading(false));
  }, []);

  const todays = appointments.filter((a) => a.status !== "cancelado").sort((a, b) => a.time.localeCompare(b.time));
  const nowHHMM = new Date().toTimeString().slice(0, 5);
  const next = todays.find((a) => a.time.slice(0, 5) >= nowHHMM);
  const revenueToday = todays.reduce((sum, a) => sum + a.service_price_cents, 0);

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-stone-50">Painel</h1>
      <p className="text-sm text-stone-500">
        Visão geral de hoje, {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="border border-stone-800 bg-stone-900 p-5">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-stone-500"><Calendar className="h-4 w-4 text-amber-500" /> Agendamentos hoje</p>
          <p className="mt-2 font-serif text-3xl font-bold text-stone-50">{todays.length}</p>
        </div>
        <div className="border border-stone-800 bg-stone-900 p-5">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-stone-500"><Clock className="h-4 w-4 text-amber-500" /> Próximo atendimento</p>
          <p className="mt-2 font-serif text-3xl font-bold text-stone-50">{next ? next.time.slice(0, 5) : "—"}</p>
        </div>
        <div className="border border-stone-800 bg-stone-900 p-5">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-stone-500"><Wallet className="h-4 w-4 text-amber-500" /> Faturamento previsto hoje</p>
          <p className="mt-2 font-serif text-3xl font-bold text-stone-50">R$ {centsToBRL(revenueToday)}</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-stone-200">Agenda de hoje</h2>
        <div className="mt-3 space-y-2">
          {todays.length === 0 && <EmptyState>Sem agendamentos para hoje.</EmptyState>}
          {todays.map((a) => (
            <div key={a.id} className="flex items-center justify-between border border-stone-800 bg-stone-900 p-4">
              <div className="flex items-center gap-4">
                <span className="w-14 font-serif text-lg font-bold text-amber-500">{a.time.slice(0, 5)}</span>
                <div>
                  <p className="text-sm font-medium text-stone-100">{a.client_name}</p>
                  <p className="text-xs text-stone-500">{a.service_name} · {a.barber_name}</p>
                </div>
              </div>
              <Badge tone="green">Confirmado</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
