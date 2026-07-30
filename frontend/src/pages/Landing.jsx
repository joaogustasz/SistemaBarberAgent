import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Star, Clock } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Button, Avatar, Spinner, EmptyState } from "../components/ui";
import { centsToBRL } from "../utils/format";

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getBarbers(), api.getServices()])
      .then(([b, s]) => { setBarbers(b.barbers); setServices(s.services); })
      .finally(() => setLoading(false));
  }, []);

  function goBook() {
    if (!user) { navigate("/entrar", { state: { from: "/agendar" } }); return; }
    navigate("/agendar");
  }

  // serviços únicos por nome, só para dar uma ideia de preço na landing (não por barbeiro)
  const uniqueServices = Object.values(
    services.reduce((acc, s) => {
      if (!acc[s.name]) acc[s.name] = s;
      return acc;
    }, {})
  ).slice(0, 6);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-stone-800">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-center">
            <span className="w-fit border border-amber-800 bg-amber-950 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-amber-400">
              Agendamento online
            </span>
            <h1 className="mt-4 font-serif text-4xl font-bold leading-[1.05] text-stone-50 sm:text-5xl">
              Seu horário na cadeira,<br />sem ligar, sem esperar.
            </h1>
            <p className="mt-5 max-w-md text-stone-400">
              Escolha o barbeiro, o serviço e o horário que encaixam na sua semana. Confirmação na hora, sem burocracia.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={goBook}>Agendar horário <ChevronRight className="h-4 w-4" /></Button>
              <Button variant="outline" onClick={() => document.getElementById("barbeiros")?.scrollIntoView({ behavior: "smooth" })}>
                Ver barbeiros
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center">
            {loading ? <Spinner /> : (
              <div className="grid w-full max-w-sm grid-cols-2 gap-3">
                {barbers.slice(0, 3).map((b) => (
                  <div key={b.id} className="border border-stone-800 bg-stone-900 p-4 text-center">
                    <Avatar name={b.name} color={b.color} className="mx-auto" />
                    <p className="mt-2 text-sm font-semibold text-stone-100">{b.name}</p>
                    <p className="text-xs text-stone-500">{b.role_title}</p>
                  </div>
                ))}
                <div className="flex flex-col items-center justify-center border border-dashed border-stone-800 p-4 text-center">
                  <Star className="h-5 w-5 text-amber-500" />
                  <p className="mt-1 text-xs text-stone-500">Avaliação 4.9/5</p>
                </div>
              </div>
            )}
          </div>
        </div>
        <div
          className="h-1 w-full"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-45deg, #d97706 0px, #d97706 10px, #f5f5f4 10px, #f5f5f4 20px, #7f1d1d 20px, #7f1d1d 30px)",
          }}
        />
      </section>

      <section id="servicos" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-serif text-2xl font-bold text-stone-50">Serviços</h2>
        <p className="mt-1 text-sm text-stone-500">Preços de referência — o valor final depende do barbeiro escolhido.</p>
        {loading ? <div className="mt-8"><Spinner /></div> : uniqueServices.length === 0 ? (
          <div className="mt-8"><EmptyState>Nenhum serviço cadastrado ainda.</EmptyState></div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {uniqueServices.map((s) => (
              <div key={s.name} className="flex items-center justify-between border border-stone-800 bg-stone-900 p-5">
                <div>
                  <p className="font-medium text-stone-100">{s.name}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-stone-500"><Clock className="h-3.5 w-3.5" /> {s.duration_min} min</p>
                </div>
                <p className="font-serif text-lg font-bold text-amber-500">R$ {centsToBRL(s.price_cents)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="barbeiros" className="border-t border-stone-800 bg-stone-950">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-serif text-2xl font-bold text-stone-50">Nossos barbeiros</h2>
          {loading ? <div className="mt-8"><Spinner /></div> : (
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {barbers.map((b) => (
                <div key={b.id} className="border border-stone-800 bg-stone-900 p-6">
                  <Avatar name={b.name} color={b.color} size="lg" />
                  <p className="mt-4 font-serif text-lg font-bold text-stone-100">{b.name}</p>
                  <p className="text-xs uppercase tracking-wider text-stone-500">{b.role_title}</p>
                  <Button variant="outline" className="mt-5 w-full" onClick={goBook}>
                    Agendar com {b.name.split(" ")[0]}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
