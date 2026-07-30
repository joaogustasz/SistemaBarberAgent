import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { Button, Badge, Spinner, EmptyState } from "../components/ui";
import { formatDateShort, centsToBRL } from "../utils/format";

export default function ClientHome() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState(null);

  function load() {
    setLoading(true);
    api.getAppointments().then((d) => setAppointments(d.appointments)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function cancel(id) {
    setCancelingId(id);
    try {
      await api.cancelAppointment(id);
      load();
    } finally {
      setCancelingId(null);
    }
  }

  const upcoming = appointments.filter((a) => a.status === "confirmado").sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const past = appointments.filter((a) => a.status !== "confirmado");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-2xl font-bold text-stone-50">Meus agendamentos</h1>
      <p className="text-sm text-stone-500">Olá, {user.name.split(" ")[0]}.</p>

      {loading ? <div className="mt-8"><Spinner /></div> : (
        <>
          <div className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">Próximos</h2>
            {upcoming.length === 0 ? (
              <div className="mt-3">
                <EmptyState>
                  Nenhum agendamento por enquanto.
                  <div className="mt-3"><Link to="/agendar"><Button>Agendar horário</Button></Link></div>
                </EmptyState>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {upcoming.map((a) => (
                  <div key={a.id} className="flex items-center justify-between border border-stone-800 bg-stone-900 p-4">
                    <div>
                      <p className="font-medium text-stone-100">{a.service_name} · {a.barber_name}</p>
                      <p className="text-xs text-stone-500">{formatDateShort(a.date)} às {a.time.slice(0, 5)} · R$ {centsToBRL(a.service_price_cents)}</p>
                      {a.note && <p className="mt-1 text-xs italic text-stone-600">"{a.note}"</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone="green">Confirmado</Badge>
                      <button disabled={cancelingId === a.id} onClick={() => cancel(a.id)} className="text-xs text-red-500 hover:underline disabled:opacity-50">
                        {cancelingId === a.id ? "Cancelando..." : "Cancelar"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {past.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">Histórico</h2>
              <div className="mt-3 space-y-3">
                {past.map((a) => (
                  <div key={a.id} className="flex items-center justify-between border border-stone-800 bg-stone-900/60 p-4 opacity-70">
                    <div>
                      <p className="font-medium text-stone-200">{a.service_name} · {a.barber_name}</p>
                      <p className="text-xs text-stone-500">{formatDateShort(a.date)}</p>
                    </div>
                    <Badge tone={a.status === "cancelado" ? "red" : "stone"}>{a.status === "cancelado" ? "Cancelado" : "Concluído"}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
