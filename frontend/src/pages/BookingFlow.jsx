import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, Clock, Wallet } from "lucide-react";
import { api } from "../api/client";
import { Button, Avatar, Spinner, ErrorText, EmptyState } from "../components/ui";
import { addDaysISO, todayISO, centsToBRL, formatWeekday } from "../utils/format";

const STEPS = ["Barbeiro", "Serviço", "Data e hora", "Confirmar"];

function Stepper({ current }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((label, i) => (
        <React.Fragment key={label}>
          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${
                i < current ? "border-amber-600 bg-amber-600 text-stone-950" :
                i === current ? "border-amber-600 text-amber-500" : "border-stone-700 text-stone-600"
              }`}
            >
              {i < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={`hidden text-xs font-medium sm:block ${i === current ? "text-stone-100" : "text-stone-600"}`}>{label}</span>
          </div>
          {i < STEPS.length - 1 && <div className={`h-px w-4 sm:w-8 ${i < current ? "bg-amber-600" : "bg-stone-800"}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function BookingFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loadingBarbers, setLoadingBarbers] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [barberId, setBarberId] = useState(null);
  const [serviceId, setServiceId] = useState(null);
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState(null);
  const [note, setNote] = useState("");

  const nextDays = useMemo(() => Array.from({ length: 14 }, (_, i) => addDaysISO(i)), []);
  const selectedBarber = barbers.find((b) => b.id === barberId);
  const selectedService = services.find((s) => s.id === serviceId);

  useEffect(() => {
    api.getBarbers().then((d) => setBarbers(d.barbers)).finally(() => setLoadingBarbers(false));
  }, []);

  useEffect(() => {
    if (!barberId) return;
    setLoadingServices(true);
    setServiceId(null);
    api.getServices(barberId).then((d) => setServices(d.services)).finally(() => setLoadingServices(false));
  }, [barberId]);

  useEffect(() => {
    if (!barberId || !serviceId || !date) { setSlots([]); return; }
    setLoadingSlots(true);
    setTime(null);
    api.getAvailableSlots(barberId, serviceId, date)
      .then((d) => setSlots(d.slots))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [barberId, serviceId, date]);

  async function confirm() {
    setSubmitting(true);
    setError("");
    try {
      await api.createAppointment({ barber_id: barberId, service_id: serviceId, date, time, note });
      navigate("/agendar/sucesso");
    } catch (err) {
      setError(err.message);
      if (err.status === 409) {
        // horário foi tomado por outra pessoa: recarrega os slots
        const d = await api.getAvailableSlots(barberId, serviceId, date);
        setSlots(d.slots);
        setTime(null);
        setStep(2);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-300">
          <ChevronLeft className="h-4 w-4" /> Cancelar
        </button>
        <Stepper current={step} />
      </div>

      {step === 0 && (
        <div>
          <h2 className="font-serif text-xl font-bold text-stone-50">Escolha o barbeiro</h2>
          {loadingBarbers ? <div className="mt-6"><Spinner /></div> : (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {barbers.map((b) => (
                <button
                  key={b.id}
                  onClick={() => { setBarberId(b.id); setStep(1); }}
                  className={`border p-5 text-left transition-colors ${barberId === b.id ? "border-amber-600 bg-stone-900" : "border-stone-800 bg-stone-900 hover:border-stone-600"}`}
                >
                  <Avatar name={b.name} color={b.color} />
                  <p className="mt-3 font-semibold text-stone-100">{b.name}</p>
                  <p className="text-xs text-stone-500">{b.role_title}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 1 && selectedBarber && (
        <div>
          <h2 className="font-serif text-xl font-bold text-stone-50">Escolha o serviço</h2>
          <p className="text-sm text-stone-500">com {selectedBarber.name}</p>
          {loadingServices ? <div className="mt-6"><Spinner /></div> : services.length === 0 ? (
            <div className="mt-6"><EmptyState>Este barbeiro ainda não tem serviços cadastrados.</EmptyState></div>
          ) : (
            <div className="mt-6 space-y-3">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setServiceId(s.id); setStep(2); }}
                  className={`flex w-full items-center justify-between border p-4 text-left transition-colors ${serviceId === s.id ? "border-amber-600 bg-stone-900" : "border-stone-800 bg-stone-900 hover:border-stone-600"}`}
                >
                  <div>
                    <p className="font-medium text-stone-100">{s.name}</p>
                    <p className="flex items-center gap-1 text-xs text-stone-500"><Clock className="h-3.5 w-3.5" /> {s.duration_min} min</p>
                  </div>
                  <p className="font-serif font-bold text-amber-500">R$ {centsToBRL(s.price_cents)}</p>
                </button>
              ))}
            </div>
          )}
          <Button variant="ghost" className="mt-4 px-0" onClick={() => setStep(0)}><ChevronLeft className="h-4 w-4" /> Trocar barbeiro</Button>
        </div>
      )}

      {step === 2 && selectedService && (
        <div>
          <h2 className="font-serif text-xl font-bold text-stone-50">Escolha data e horário</h2>
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
            {nextDays.map((d) => {
              const dt = new Date(d + "T12:00:00");
              return (
                <button
                  key={d}
                  onClick={() => setDate(d)}
                  className={`flex min-w-[64px] flex-col items-center border px-3 py-2 ${date === d ? "border-amber-600 bg-stone-900" : "border-stone-800 bg-stone-900"}`}
                >
                  <span className="text-[10px] uppercase text-stone-500">{formatWeekday(d, "short")}</span>
                  <span className="text-sm font-semibold text-stone-100">{dt.getDate()}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm text-stone-400">Horários disponíveis</p>
            {loadingSlots ? <Spinner /> : slots.length === 0 ? (
              <EmptyState>Sem horários livres nesta data. Escolha outro dia.</EmptyState>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {slots.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTime(t)}
                    className={`border py-2 text-sm ${time === t ? "border-amber-600 bg-amber-600 font-semibold text-stone-950" : "border-stone-800 bg-stone-900 text-stone-300 hover:border-stone-600"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-between">
            <Button variant="ghost" className="px-0" onClick={() => setStep(1)}><ChevronLeft className="h-4 w-4" /> Voltar</Button>
            <Button disabled={!time} onClick={() => setStep(3)}>Continuar <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {step === 3 && selectedBarber && selectedService && (
        <div>
          <h2 className="font-serif text-xl font-bold text-stone-50">Confirmar agendamento</h2>
          <div className="mt-6 space-y-3 border border-stone-800 bg-stone-900 p-5">
            <Row label="Barbeiro" value={selectedBarber.name} />
            <Row label="Serviço" value={selectedService.name} />
            <Row label="Data" value={new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })} />
            <Row label="Horário" value={time} />
            <div className="flex justify-between border-t border-stone-800 pt-3 text-sm font-semibold">
              <span className="text-stone-300">Valor</span>
              <span className="text-amber-500">R$ {centsToBRL(selectedService.price_cents)}</span>
            </div>
          </div>

          <label className="mt-5 block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone-500">Observação (opcional)</span>
            <textarea
              rows={3}
              placeholder="Ex: prefiro a máquina mais baixa nas laterais"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-stone-700 bg-stone-900 p-3 text-sm text-stone-100 outline-none placeholder:text-stone-600 focus:border-amber-600"
            />
          </label>

          <div className="mt-3 flex items-center gap-2 border border-stone-800 bg-stone-900/60 p-3 text-xs text-stone-500">
            <Wallet className="h-4 w-4 shrink-0 text-amber-500" /> Pagamento realizado na barbearia.
          </div>

          <ErrorText>{error}</ErrorText>

          <div className="mt-6 flex justify-between">
            <Button variant="ghost" className="px-0" onClick={() => setStep(2)}><ChevronLeft className="h-4 w-4" /> Voltar</Button>
            <Button disabled={submitting} onClick={confirm}>{submitting ? "Confirmando..." : <>Confirmar agendamento <Check className="h-4 w-4" /></>}</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-stone-500">{label}</span>
      <span className="text-stone-100">{value}</span>
    </div>
  );
}
