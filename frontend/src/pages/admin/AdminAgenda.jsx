import React, { useEffect, useState } from "react";
import { Ban, Plus, Trash2, CalendarDays } from "lucide-react";
import { api } from "../../api/client";
import { Button, Field, Badge, Spinner, EmptyState, Avatar, ErrorText } from "../../components/ui";
import { todayISO, centsToBRL, WEEKDAY_LABELS } from "../../utils/format";

export default function AdminAgenda() {
  const [barbers, setBarbers] = useState([]);
  const [barberId, setBarberId] = useState(null);
  const [loadingBarbers, setLoadingBarbers] = useState(true);

  useEffect(() => {
    api.getBarbers().then((d) => {
      setBarbers(d.barbers);
      if (d.barbers[0]) setBarberId(d.barbers[0].id);
    }).finally(() => setLoadingBarbers(false));
  }, []);

  if (loadingBarbers) return <Spinner />;

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-stone-50">Agenda</h1>
      <p className="text-sm text-stone-500">Cada barbeiro tem expediente, bloqueios e agendamentos próprios.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {barbers.map((b) => (
          <button
            key={b.id}
            onClick={() => setBarberId(b.id)}
            className={`flex items-center gap-2 border px-3 py-2 text-sm font-medium ${barberId === b.id ? "border-amber-600 bg-amber-600 text-stone-950" : "border-stone-800 text-stone-300 hover:border-stone-600"}`}
          >
            <Avatar name={b.name} color={b.color} size="sm" /> {b.name}
          </button>
        ))}
      </div>

      {barberId && (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <WorkingHoursEditor barberId={barberId} />
          <BlockedSlotsEditor barberId={barberId} />
        </div>
      )}

      {barberId && <div className="mt-8"><DayAppointments barberId={barberId} /></div>}
    </div>
  );
}

/* ---------------- EXPEDIENTE SEMANAL ---------------- */

function WorkingHoursEditor({ barberId }) {
  const [hours, setHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDay, setOpenDay] = useState(null);
  const [form, setForm] = useState({ start_time: "09:00", end_time: "19:00" });
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    api.getWorkingHours(barberId).then((d) => setHours(d.workingHours)).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [barberId]);

  async function addRange(weekday) {
    setError("");
    try {
      await api.addWorkingHour({ barber_id: barberId, weekday, start_time: form.start_time, end_time: form.end_time });
      setOpenDay(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeRange(id) {
    await api.deleteWorkingHour(id);
    load();
  }

  return (
    <div className="border border-stone-800 bg-stone-900 p-5">
      <p className="text-sm font-semibold text-stone-200">Expediente semanal</p>
      <p className="mt-1 text-xs text-stone-500">
        Defina os horários em que este barbeiro atende. Sem nenhum horário num dia = ele não trabalha naquele dia da semana.
        Para atender só de tarde, cadastre apenas um intervalo da tarde, por exemplo.
      </p>

      {loading ? <div className="mt-4"><Spinner /></div> : (
        <div className="mt-4 space-y-2">
          {WEEKDAY_LABELS.map((label, weekday) => {
            const ranges = hours.filter((h) => h.weekday === weekday);
            return (
              <div key={weekday} className="border border-stone-800 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-stone-200">{label}</p>
                  <button onClick={() => { setOpenDay(openDay === weekday ? null : weekday); setError(""); }} className="flex items-center gap-1 text-xs text-amber-500 hover:underline">
                    <Plus className="h-3.5 w-3.5" /> Adicionar horário
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ranges.length === 0 && <span className="text-xs text-stone-600">Não atende</span>}
                  {ranges.map((r) => (
                    <span key={r.id} className="flex items-center gap-2 border border-stone-700 bg-stone-950 px-2 py-1 text-xs text-stone-300">
                      {r.start_time.slice(0, 5)} – {r.end_time.slice(0, 5)}
                      <button onClick={() => removeRange(r.id)} className="text-stone-500 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
                {openDay === weekday && (
                  <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-stone-800 pt-3">
                    <Field label="Início" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="w-32" />
                    <Field label="Fim" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="w-32" />
                    <Button onClick={() => addRange(weekday)}>Salvar</Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

/* ---------------- BLOQUEIOS PONTUAIS ---------------- */

function BlockedSlotsEditor({ barberId }) {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayISO());
  const [partial, setPartial] = useState(false);
  const [start, setStart] = useState("12:00");
  const [end, setEnd] = useState("13:00");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api.getBlockedSlots(barberId, todayISO()).then((d) => setBlocks(d.blockedSlots)).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [barberId]);

  async function addBlock() {
    setError(""); setSaving(true);
    try {
      await api.addBlockedSlot({
        barber_id: barberId,
        date,
        start_time: partial ? start : null,
        end_time: partial ? end : null,
        reason: reason || null,
      });
      setReason("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeBlock(id) {
    await api.deleteBlockedSlot(id);
    load();
  }

  return (
    <div className="border border-stone-800 bg-stone-900 p-5">
      <p className="text-sm font-semibold text-stone-200">Bloqueios pontuais</p>
      <p className="mt-1 text-xs text-stone-500">
        Bloqueie um dia inteiro (folga) ou só um intervalo (ex.: compromisso às 15h) — vale só para este barbeiro.
      </p>

      <div className="mt-4 space-y-3">
        <Field label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2 text-stone-300">
            <input type="radio" checked={!partial} onChange={() => setPartial(false)} /> Dia inteiro
          </label>
          <label className="flex items-center gap-2 text-stone-300">
            <input type="radio" checked={partial} onChange={() => setPartial(true)} /> Apenas um horário
          </label>
        </div>

        {partial && (
          <div className="flex gap-2">
            <Field label="Início" type="time" value={start} onChange={(e) => setStart(e.target.value)} className="flex-1" />
            <Field label="Fim" type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="flex-1" />
          </div>
        )}

        <Field label="Motivo (opcional)" placeholder="Ex: Folga, dentista..." value={reason} onChange={(e) => setReason(e.target.value)} />
        <ErrorText>{error}</ErrorText>
        <Button onClick={addBlock} disabled={saving} className="w-full">
          <Ban className="h-4 w-4" /> {saving ? "Bloqueando..." : "Bloquear"}
        </Button>
      </div>

      <div className="mt-5 border-t border-stone-800 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Próximos bloqueios</p>
        {loading ? <div className="mt-2"><Spinner /></div> : blocks.length === 0 ? (
          <p className="mt-2 text-xs text-stone-600">Nenhum bloqueio agendado.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {blocks.map((b) => (
              <div key={b.id} className="flex items-center justify-between border border-stone-800 px-3 py-2 text-xs">
                <span className="text-stone-300">
                  {new Date(b.date).toLocaleDateString("pt-BR")} — {b.start_time ? `${b.start_time.slice(0, 5)} às ${b.end_time.slice(0, 5)}` : "dia inteiro"}
                  {b.reason && <span className="text-stone-600"> · {b.reason}</span>}
                </span>
                <button onClick={() => removeBlock(b.id)} className="text-stone-500 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- AGENDAMENTOS DO DIA (para o barbeiro selecionado) ---------------- */

function DayAppointments({ barberId }) {
  const [date, setDate] = useState(todayISO());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.getAppointments({ date, barberId }).then((d) => setAppointments(d.appointments)).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [barberId, date]);

  async function cancel(id) {
    await api.cancelAppointment(id);
    load();
  }
  async function complete(id) {
    await api.setAppointmentStatus(id, "concluido");
    load();
  }

  const sorted = [...appointments].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="border border-stone-800 bg-stone-900 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-stone-200"><CalendarDays className="h-4 w-4 text-amber-500" /> Agendamentos do dia</p>
        <Field type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {loading ? <div className="mt-4"><Spinner /></div> : sorted.length === 0 ? (
        <div className="mt-4"><EmptyState>Nenhum horário neste dia para este barbeiro.</EmptyState></div>
      ) : (
        <div className="mt-4 space-y-2">
          {sorted.map((a) => (
            <div key={a.id} className="flex flex-col justify-between gap-3 border border-stone-800 p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <span className="w-14 font-serif text-lg font-bold text-amber-500">{a.time.slice(0, 5)}</span>
                <div>
                  <p className="text-sm font-medium text-stone-100">{a.client_name}</p>
                  <p className="text-xs text-stone-500">
                    {a.service_name} · R$ {centsToBRL(a.service_price_cents)} {a.note && `· "${a.note}"`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={a.status === "cancelado" ? "red" : a.status === "concluido" ? "stone" : "green"}>
                  {a.status === "cancelado" ? "Cancelado" : a.status === "concluido" ? "Concluído" : "Confirmado"}
                </Badge>
                {a.status === "confirmado" && (
                  <>
                    <button onClick={() => complete(a.id)} className="text-xs text-emerald-500 hover:underline">Concluir</button>
                    <button onClick={() => cancel(a.id)} className="text-xs text-red-500 hover:underline">Cancelar</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
