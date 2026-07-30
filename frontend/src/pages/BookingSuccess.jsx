import React from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "../components/ui";

export default function BookingSuccess() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950 text-emerald-400">
        <Check className="h-7 w-7" />
      </div>
      <h2 className="mt-5 font-serif text-2xl font-bold text-stone-50">Horário confirmado!</h2>
      <p className="mt-2 text-sm text-stone-500">
        Você vai encontrar todos os detalhes em "Meus agendamentos". Pagamento na barbearia.
      </p>
      <div className="mt-6 flex gap-3">
        <Link to="/"><Button variant="outline">Voltar ao início</Button></Link>
        <Link to="/minha-conta"><Button>Meus agendamentos</Button></Link>
      </div>
    </div>
  );
}
