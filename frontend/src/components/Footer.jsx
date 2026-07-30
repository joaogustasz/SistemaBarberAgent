import React from "react";
import { Scissors, MapPin, Phone } from "lucide-react";
import { BRAND } from "../brand";

export default function Footer() {
  return (
    <footer className="border-t border-stone-800 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center sm:px-6">
        <div className="flex items-center gap-2">
          <Scissors className="h-4 w-4 text-amber-500" />
          <span className="font-serif font-bold text-stone-200">{BRAND.name}</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-stone-500">
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {BRAND.city}</span>
          <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {BRAND.phone}</span>
        </div>
        <p className="text-xs text-stone-600">Pagamento realizado na barbearia.</p>
      </div>
    </footer>
  );
}
