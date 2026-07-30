const express = require("express");
const { body, query, validationResult } = require("express-validator");
const { withRLS } = require("../db");
const { optionalAuth, requireAuth, requireRole } = require("../middleware/auth");
const { computeAvailableSlots } = require("../utils/slots");

const router = express.Router();

// GET /api/appointments/available-slots?barberId=&serviceId=&date=
router.get(
  "/available-slots",
  optionalAuth,
  query("barberId").isUUID(),
  query("serviceId").isUUID(),
  query("date").isISO8601(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: "Parâmetros inválidos." });
    const { barberId, serviceId, date } = req.query;

    try {
      const result = await withRLS(req.auth, async (c) => {
        const svc = await c.query("select duration_min from services where id = $1", [serviceId]);
        if (!svc.rows[0]) throw new Error("SERVICE_NOT_FOUND");
        const durationMin = svc.rows[0].duration_min;

        const wh = await c.query("select * from working_hours where barber_id = $1", [barberId]);
        const bs = await c.query(
          "select * from blocked_slots where barber_id = $1 and date = $2",
          [barberId, date]
        );
        const appts = await c.query(
          "select time, duration_min from appointments where barber_id = $1 and date = $2 and status != 'cancelado'",
          [barberId, date]
        );

        return computeAvailableSlots({
          date,
          durationMin,
          workingHours: wh.rows,
          blockedSlots: bs.rows,
          busyAppointments: appts.rows,
        });
      });
      res.json({ slots: result });
    } catch (err) {
      if (err.message === "SERVICE_NOT_FOUND") return res.status(404).json({ error: "Serviço não encontrado." });
      console.error(err);
      res.status(500).json({ error: "Erro ao calcular horários disponíveis." });
    }
  }
);

// POST /api/appointments  (cliente autenticado agenda para si mesmo)
router.post(
  "/",
  requireAuth,
  requireRole("client", "admin"),
  body("barber_id").isUUID(),
  body("service_id").isUUID(),
  body("date").isISO8601(),
  body("time").matches(/^\d{2}:\d{2}$/),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: "Dados do agendamento inválidos." });
    const { barber_id, service_id, date, time, note } = req.body;

    try {
      const result = await withRLS(req.auth, async (c) => {
        const svc = await c.query("select duration_min from services where id = $1", [service_id]);
        if (!svc.rows[0]) throw new Error("SERVICE_NOT_FOUND");
        const durationMin = svc.rows[0].duration_min;

        // revalida disponibilidade no momento da escrita (evita corrida entre 2 clientes)
        const wh = await c.query("select * from working_hours where barber_id = $1", [barber_id]);
        const bs = await c.query("select * from blocked_slots where barber_id = $1 and date = $2", [barber_id, date]);
        const appts = await c.query(
          "select time, duration_min from appointments where barber_id = $1 and date = $2 and status != 'cancelado'",
          [barber_id, date]
        );
        const { computeAvailableSlots } = require("../utils/slots");
        const freeSlots = computeAvailableSlots({
          date, durationMin, workingHours: wh.rows, blockedSlots: bs.rows, busyAppointments: appts.rows,
        });
        if (!freeSlots.includes(time)) throw new Error("SLOT_TAKEN");

        const clientId = req.auth.role === "admin" && req.body.client_id ? req.body.client_id : req.auth.id;

        const inserted = await c.query(
          `insert into appointments (client_id, barber_id, service_id, date, time, duration_min, note, status)
           values ($1,$2,$3,$4,$5,$6,$7,'confirmado') returning *`,
          [clientId, barber_id, service_id, date, time, durationMin, note || null]
        );
        return inserted.rows[0];
      });
      res.status(201).json({ appointment: result });
    } catch (err) {
      if (err.message === "SERVICE_NOT_FOUND") return res.status(404).json({ error: "Serviço não encontrado." });
      if (err.message === "SLOT_TAKEN") return res.status(409).json({ error: "Esse horário acabou de ser reservado. Escolha outro." });
      console.error(err);
      res.status(500).json({ error: "Não foi possível confirmar o agendamento." });
    }
  }
);

// GET /api/appointments  -> cliente vê os seus (RLS filtra); admin pode filtrar por data/barbeiro
router.get("/", requireAuth, async (req, res) => {
  const { date, barberId } = req.query;
  const conditions = [];
  const params = [];
  if (date) { params.push(date); conditions.push(`date = $${params.length}`); }
  if (barberId) { params.push(barberId); conditions.push(`barber_id = $${params.length}`); }
  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";

  const result = await withRLS(req.auth, (c) =>
    c.query(
      `select a.*, u.name as client_name, u.email as client_email,
              s.name as service_name, s.price_cents as service_price_cents,
              b.name as barber_name
       from appointments a
       join users u on u.id = a.client_id
       join services s on s.id = a.service_id
       join barbers b on b.id = a.barber_id
       ${where}
       order by a.date asc, a.time asc`,
      params
    )
  );
  res.json({ appointments: result.rows });
});

// PATCH /api/appointments/:id/cancel -> cliente cancela o próprio (RLS garante) ou admin cancela qualquer
router.patch("/:id/cancel", requireAuth, async (req, res) => {
  const result = await withRLS(req.auth, (c) =>
    c.query("update appointments set status = 'cancelado' where id = $1 returning *", [req.params.id])
  );
  if (!result.rows[0]) return res.status(404).json({ error: "Agendamento não encontrado ou sem permissão." });
  res.json({ appointment: result.rows[0] });
});

// PATCH /api/appointments/:id/status -> só admin marca como concluído
router.patch("/:id/status", requireAuth, requireRole("admin"), body("status").isIn(["confirmado", "concluido", "cancelado"]), async (req, res) => {
  const result = await withRLS(req.auth, (c) =>
    c.query("update appointments set status = $1 where id = $2 returning *", [req.body.status, req.params.id])
  );
  if (!result.rows[0]) return res.status(404).json({ error: "Agendamento não encontrado." });
  res.json({ appointment: result.rows[0] });
});

module.exports = router;
