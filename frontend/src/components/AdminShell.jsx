import React, { useState } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { Scissors, LayoutGrid, CalendarDays, Users, BarChart3, Menu, X, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui";
import { BRAND } from "../brand";

const ITEMS = [
  { to: "/painel", end: true, label: "Painel", icon: LayoutGrid },
  { to: "/painel/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/painel/servicos", label: "Serviços", icon: Scissors },
  { to: "/painel/barbeiros", label: "Barbeiros", icon: Users },
  { to: "/painel/relatorios", label: "Relatórios", icon: BarChart3 },
];

export default function AdminShell() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mobileNav, setMobileNav] = useState(false);

  function doLogout() {
    logout();
    navigate("/");
  }

  const linkClass = ({ isActive }) =>
    `flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive ? "bg-amber-600 text-stone-950" : "text-stone-400 hover:bg-stone-900 hover:text-stone-100"
    }`;

  return (
    <div className="flex min-h-screen bg-stone-950">
      <aside className="hidden w-60 shrink-0 border-r border-stone-800 md:flex md:flex-col">
        <div className="flex items-center gap-2 border-b border-stone-800 px-6 py-5">
          <Scissors className="h-5 w-5 text-amber-500" />
          <span className="font-serif font-bold text-stone-50">{BRAND.name}</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {ITEMS.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end} className={linkClass}>
              <it.icon className="h-4 w-4" /> {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-stone-800 p-3">
          <Button variant="ghost" className="w-full justify-start px-3" onClick={() => navigate("/")}>← Ver site</Button>
          <Button variant="ghost" className="w-full justify-start px-3" onClick={doLogout}><LogOut className="h-4 w-4" /> Sair</Button>
        </div>
      </aside>

      <div className="flex-1">
        <div className="flex items-center justify-between border-b border-stone-800 px-4 py-4 md:hidden">
          <span className="font-serif font-bold text-stone-50">{BRAND.name}</span>
          <button onClick={() => setMobileNav(!mobileNav)}>{mobileNav ? <X className="h-6 w-6 text-stone-200" /> : <Menu className="h-6 w-6 text-stone-200" />}</button>
        </div>
        {mobileNav && (
          <div className="border-b border-stone-800 p-3 md:hidden">
            {ITEMS.map((it) => (
              <NavLink key={it.to} to={it.to} end={it.end} onClick={() => setMobileNav(false)} className={linkClass}>
                <it.icon className="h-4 w-4" /> {it.label}
              </NavLink>
            ))}
            <Button variant="ghost" className="w-full justify-start px-3" onClick={() => navigate("/")}>← Ver site</Button>
            <Button variant="ghost" className="w-full justify-start px-3" onClick={doLogout}><LogOut className="h-4 w-4" /> Sair</Button>
          </div>
        )}
        <main className="p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
