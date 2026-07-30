require("dotenv").config();
const bcrypt = require("bcryptjs");
const { withRLS, pool } = require("./db");

const SUPER = { id: null, role: "admin" }; // seed roda com privilégio de admin (ainda passa pelas policies)

async function seed() {
  await withRLS(SUPER, async (c) => {
    console.log("Limpando dados existentes...");
    await c.query("delete from appointments");
    await c.query("delete from blocked_slots");
    await c.query("delete from working_hours");
    await c.query("delete from services");
    await c.query("delete from barbers");
    await c.query("delete from users");

    console.log("Criando usuário admin...");
    const adminHash = await bcrypt.hash("admin123", 10);
    await c.query(
      "insert into users (name, email, password_hash, role) values ($1,$2,$3,'admin')",
      ["Administrador", "admin@barbearia.com", adminHash]
    );

    const clientHash = await bcrypt.hash("cliente123", 10);
    const clientRes = await c.query(
      "insert into users (name, email, password_hash, role) values ($1,$2,$3,'client') returning id",
      ["Cliente Demonstração", "cliente@teste.com", clientHash]
    );
    const clientId = clientRes.rows[0].id;

    console.log("Criando barbeiros...");
    const barbersData = [
      { name: "Rafael Souza", role_title: "Barbeiro sênior", color: "amber" },
      { name: "Bruno Lima", role_title: "Barbeiro", color: "stone" },
      { name: "Diego Martins", role_title: "Barbeiro", color: "red" },
    ];
    const barberIds = {};
    for (const b of barbersData) {
      const initials = b.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
      const r = await c.query(
        "insert into barbers (name, role_title, initials, color) values ($1,$2,$3,$4) returning id",
        [b.name, b.role_title, initials, b.color]
      );
      barberIds[b.name] = r.rows[0].id;
    }

    console.log("Criando serviços...");
    const services = [
      ["Rafael Souza", "Corte Degradê", 4500, 40],
      ["Rafael Souza", "Corte Social", 3500, 30],
      ["Rafael Souza", "Barba Completa", 3000, 25],
      ["Rafael Souza", "Corte + Barba", 6500, 60],
      ["Bruno Lima", "Corte Degradê", 4500, 40],
      ["Bruno Lima", "Corte + Barba", 6500, 60],
      ["Bruno Lima", "Sobrancelha", 1500, 15],
      ["Diego Martins", "Corte Navalhado", 5000, 45],
      ["Diego Martins", "Barba Completa", 3000, 25],
      ["Diego Martins", "Pigmentação", 4000, 35],
    ];
    for (const [barberName, name, price, duration] of services) {
      await c.query(
        "insert into services (barber_id, name, price_cents, duration_min) values ($1,$2,$3,$4)",
        [barberIds[barberName], name, price, duration]
      );
    }

  });

  await withRLS(SUPER, async (c) => {
    const b = await c.query("select id, name from barbers");
    const byName = Object.fromEntries(b.rows.map((r) => [r.name, r.id]));

    const insertWH = (barberId, weekday, start, end) =>
      c.query("insert into working_hours (barber_id, weekday, start_time, end_time) values ($1,$2,$3,$4)", [barberId, weekday, start, end]);

    // Rafael Souza: trabalha em período integral de segunda a sábado
    for (const weekday of [1, 2, 3, 4, 5, 6]) await insertWH(byName["Rafael Souza"], weekday, "09:00", "19:00");

    // Bruno Lima: só de tarde (exemplo pedido pelo cliente) de terça a sábado
    for (const weekday of [2, 3, 4, 5, 6]) await insertWH(byName["Bruno Lima"], weekday, "13:00", "19:00");

    // Diego Martins: só de manhã de segunda a sexta, e período integral no sábado
    for (const weekday of [1, 2, 3, 4, 5]) await insertWH(byName["Diego Martins"], weekday, "09:00", "12:00");
    await insertWH(byName["Diego Martins"], 6, "09:00", "17:00");

    console.log("Criando alguns agendamentos de exemplo...");
    const clientRes = await c.query("select id from users where email = 'cliente@teste.com'");
    const clientId = clientRes.rows[0].id;
    const svc = await c.query("select id, barber_id, duration_min, name from services");
    const todayISO = new Date().toISOString().slice(0, 10);

    const degradeRafael = svc.rows.find((s) => s.name === "Corte Degradê" && s.barber_id === byName["Rafael Souza"]);
    if (degradeRafael) {
      await c.query(
        `insert into appointments (client_id, barber_id, service_id, date, time, duration_min, status)
         values ($1,$2,$3,$4,'10:00',$5,'confirmado')`,
        [clientId, byName["Rafael Souza"], degradeRafael.id, todayISO, degradeRafael.duration_min]
      );
    }
  });

  console.log("Seed concluído.");
  console.log("Admin -> admin@barbearia.com / admin123");
  console.log("Cliente demo -> cliente@teste.com / cliente123");
  await pool.end();
}

seed().catch((err) => {
  console.error("Erro no seed:", err);
  process.exit(1);
});
