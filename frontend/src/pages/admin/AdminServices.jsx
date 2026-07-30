import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import { api } from "../../api/client";
import { Button, Field, Avatar, Spinner, EmptyState, ErrorText } from "../../components/ui";
import { centsToBRL } from "../../utils/format";

const emptyForm = { name: "", price: "", duration: "" };

export default function AdminServices() {
  const [barbers, setBarbers] = useState([]);
  const [barberId, setBarberId] = useState(null);
  const [services, setServices] = useState([]);
  const [loadingBarbers, setLoadingBarbers] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getBarbers().then((d) => {
      setBarbers(d.barbers);
      if (d.barbers[0]) setBarberId(d.barbers[0].id);
    }).finally(() => setLoadingBarbers(false));
  }, []);

  function loadServices(id) {
    setLoadingServices(true);
    api.getServices(id).then((d) => setServices(d.services)).finally(() => setLoadingServices(false));
  }

  useEffect(() => { if (barberId) loadServices(barberId); }, [barberId]);

  function resetForm() { setForm(emptyForm); setEditingId(null); setError(""); }

  async function submit(e) {
    e.preventDefault();
    setError(""); setSaving(true);
    const price_cents = Math.round(Number(form.price.toString().replace(",", ".")) * 100);
    const duration_min = Number(form.duration);
    try {
      if (!form.name.trim()) throw new Error("Informe o nome do serviço.");
      if (!price_cents || price_cents < 0) throw new Error("Informe um preço válido.");
      if (!duration_min || duration_min < 5) throw new Error("A duração mínima é de 5 minutos.");

      if (editingId) {
        await api.updateService(editingId, { name: form.name, price_cents, duration_min });
      } else {
        await api.createService({ barber_id: barberId, name: form.name, price_cents, duration_min });
      }
      resetForm();
      loadServices(barberId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function editService(s) {
    setForm({ name: s.name, price: (s.price_cents / 100).toString(), duration: s.duration_min.toString() });
    setEditingId(s.id);
  }

  async function deleteService(id) {
    if (!confirm("Excluir este serviço?")) return;
    await api.deleteService(id);
    loadServices(barberId);
  }

  if (loadingBarbers) return <Spinner />;

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-stone-50">Serviços</h1>
      <p className="text-sm text-stone-500">Cada barbeiro tem sua própria lista de serviços, preços e durações.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {barbers.map((b) => (
          <button
            key={b.id}
            onClick={() => { setBarberId(b.id); resetForm(); }}
            className={`flex items-center gap-2 border px-3 py-2 text-sm font-medium ${barberId === b.id ? "border-amber-600 bg-amber-600 text-stone-950" : "border-stone-800 text-stone-300 hover:border-stone-600"}`}
          >
            <Avatar name={b.name} color={b.color} size="sm" /> {b.name}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-2">
          {loadingServices ? <Spinner /> : services.length === 0 ? (
            <EmptyState>Nenhum serviço cadastrado para este barbeiro ainda.</EmptyState>
          ) : (
            services.map((s) => (
              <div key={s.id} className="flex items-center justify-between border border-stone-800 bg-stone-900 p-4">
                <div>
                  <p className="font-medium text-stone-100">{s.name}</p>
                  <p className="flex items-center gap-1 text-xs text-stone-500"><Clock className="h-3.5 w-3.5" /> {s.duration_min} min · R$ {centsToBRL(s.price_cents)}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => editService(s)} className="text-stone-400 hover:text-amber-500"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => deleteService(s.id)} className="text-stone-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={submit} className="h-fit space-y-4 border border-stone-800 bg-stone-900 p-5">
          <p className="text-sm font-semibold text-stone-200">{editingId ? "Editar serviço" : "Novo serviço"}</p>
          <Field label="Nome" placeholder="Ex: Degradê" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Field label="Preço (R$)" type="number" min="0" step="0.01" placeholder="45.00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <Field label="Duração (min)" type="number" min="5" step="5" placeholder="40" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          <ErrorText>{error}</ErrorText>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "Salvando..." : editingId ? "Salvar alterações" : <><Plus className="h-4 w-4" /> Adicionar</>}
            </Button>
            {editingId && <Button type="button" variant="ghost" onClick={resetForm}>Cancelar</Button>}
          </div>
        </form>
      </div>
    </div>
  );
}
