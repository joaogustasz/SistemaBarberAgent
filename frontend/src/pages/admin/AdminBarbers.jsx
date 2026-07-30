import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../../api/client";
import { Button, Field, Avatar, Spinner, ErrorText } from "../../components/ui";

const COLORS = ["amber", "stone", "red", "emerald", "blue"];

export default function AdminBarbers() {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", role_title: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api.getBarbers().then((d) => setBarbers(d.barbers)).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function addBarber(e) {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      if (!form.name.trim()) throw new Error("Informe o nome do barbeiro.");
      const color = COLORS[barbers.length % COLORS.length];
      await api.createBarber({ name: form.name, role_title: form.role_title || "Barbeiro", color });
      setForm({ name: "", role_title: "" });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeBarber(id) {
    if (!confirm("Remover este barbeiro? Os serviços e horários associados também serão removidos.")) return;
    await api.deleteBarber(id);
    load();
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-stone-50">Barbeiros</h1>
      <p className="text-sm text-stone-500">Cada barbeiro tem agenda e serviços próprios, gerenciados neste mesmo painel.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {barbers.map((b) => (
            <div key={b.id} className="flex items-center justify-between border border-stone-800 bg-stone-900 p-4">
              <div className="flex items-center gap-4">
                <Avatar name={b.name} color={b.color} />
                <div>
                  <p className="font-medium text-stone-100">{b.name}</p>
                  <p className="text-xs text-stone-500">{b.role_title}</p>
                </div>
              </div>
              <button onClick={() => removeBarber(b.id)} className="text-stone-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>

        <form onSubmit={addBarber} className="h-fit space-y-4 border border-stone-800 bg-stone-900 p-5">
          <p className="text-sm font-semibold text-stone-200">Novo barbeiro</p>
          <Field label="Nome" placeholder="Nome completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Field label="Função" placeholder="Ex: Barbeiro sênior" value={form.role_title} onChange={(e) => setForm({ ...form, role_title: e.target.value })} />
          <ErrorText>{error}</ErrorText>
          <Button type="submit" disabled={saving} className="w-full"><Plus className="h-4 w-4" /> {saving ? "Adicionando..." : "Adicionar barbeiro"}</Button>
        </form>
      </div>
    </div>
  );
}
