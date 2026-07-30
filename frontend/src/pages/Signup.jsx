import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Scissors, User, Mail, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button, Field, ErrorText } from "../components/ui";

export default function Signup() {
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await signup(name, email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitGoogle() {
    setError(""); setLoading(true);
    try {
      const demoName = prompt("Simulação do cadastro Google — digite seu nome:") || "Cliente Google";
      const demoEmail = prompt("Digite o e-mail da conta Google:") || `cliente${Date.now()}@gmail.com`;
      await loginWithGoogle(demoName, demoEmail);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Scissors className="mx-auto h-6 w-6 text-amber-500" />
          <h1 className="mt-3 font-serif text-2xl font-bold text-stone-50">Criar conta</h1>
          <p className="mt-1 text-sm text-stone-500">Leva menos de um minuto</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field label="Nome completo" icon={User} placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required />
          <Field label="E-mail" icon={Mail} type="email" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Field label="Senha" icon={Lock} type="password" placeholder="Mínimo 6 caracteres" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
          <ErrorText>{error}</ErrorText>
          <Button type="submit" disabled={loading} className="w-full">{loading ? "Criando..." : "Criar conta"}</Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-stone-600">
          <div className="h-px flex-1 bg-stone-800" /> ou <div className="h-px flex-1 bg-stone-800" />
        </div>
        <button
          type="button"
          onClick={submitGoogle}
          className="flex w-full items-center justify-center gap-2 border border-stone-700 bg-stone-100 py-2.5 text-sm font-semibold text-stone-900 hover:bg-white"
        >
          Continuar com Google
        </button>

        <p className="mt-6 text-center text-sm text-stone-500">
          Já tem conta? <Link to="/entrar" state={location.state} className="font-semibold text-amber-500 hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
