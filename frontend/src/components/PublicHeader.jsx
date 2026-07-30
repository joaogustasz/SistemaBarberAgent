import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Scissors, Menu, X, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button, Avatar } from "./ui";
import { BRAND } from "../brand";

export default function PublicHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function goBook() {
    setOpen(false);
    if (!user) { navigate("/entrar", { state: { from: "/agendar" } }); return; }
    navigate("/agendar");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-stone-800 bg-stone-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Scissors className="h-5 w-5 text-amber-500" />
          <span className="font-serif text-lg font-bold tracking-wide text-stone-50">{BRAND.name}</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/" className="text-sm text-stone-400 hover:text-stone-100">Início</Link>
          <Link to="/#servicos" className="text-sm text-stone-400 hover:text-stone-100">Serviços</Link>
          <Link to="/#barbeiros" className="text-sm text-stone-400 hover:text-stone-100">Barbeiros</Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link to="/minha-conta" className="flex items-center gap-2 text-sm text-stone-300 hover:text-stone-100">
                <Avatar name={user.name} size="sm" /> {user.name.split(" ")[0]}
              </Link>
              <Button variant="ghost" onClick={() => { logout(); navigate("/"); }}><LogOut className="h-4 w-4" /> Sair</Button>
            </>
          ) : (
            <>
              <Link to="/painel/entrar" className="text-xs text-stone-600 hover:text-stone-300">Área do profissional</Link>
              <Link to="/entrar"><Button variant="outline">Entrar</Button></Link>
            </>
          )}
          <Button onClick={goBook}>Agendar horário</Button>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6 text-stone-200" /> : <Menu className="h-6 w-6 text-stone-200" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-stone-800 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link to="/" onClick={() => setOpen(false)} className="py-1 text-sm text-stone-300">Início</Link>
            <Link to="/#servicos" onClick={() => setOpen(false)} className="py-1 text-sm text-stone-300">Serviços</Link>
            <Link to="/#barbeiros" onClick={() => setOpen(false)} className="py-1 text-sm text-stone-300">Barbeiros</Link>
            {user ? (
              <>
                <Link to="/minha-conta" onClick={() => setOpen(false)} className="py-1 text-sm text-stone-300">Meus agendamentos</Link>
                <Button variant="ghost" className="justify-start px-0" onClick={() => { logout(); setOpen(false); navigate("/"); }}>
                  <LogOut className="h-4 w-4" /> Sair
                </Button>
              </>
            ) : (
              <>
                <Link to="/painel/entrar" onClick={() => setOpen(false)} className="py-1 text-xs text-stone-500">Área do profissional</Link>
                <Link to="/entrar" onClick={() => setOpen(false)}><Button variant="outline" className="w-full">Entrar</Button></Link>
              </>
            )}
            <Button onClick={goBook}>Agendar horário</Button>
          </div>
        </div>
      )}
    </header>
  );
}
