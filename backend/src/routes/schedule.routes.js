const express = require("express");
const { body, validationResult } = require("express-validator");
const { withRLS } = require("../db");
const { optionalAuth, requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

/* ---------------- WORKING HOURS (expediente por dia da semana) ---------------- */
// Cada barbeiro define, por dia da semana (0=domingo..6=sábado), uma ou mais
// janelas de trabalho. Ex.: só à tarde -> uma única linha 13:00-19:00.
// Sem nenhuma linha para o dia = barbeiro não atende naquele dia da semana.

router.get("/working-hours", optionalAuth, async (req, res) => {
  const { barberId } = req.query;
  if (!barberId) return res.status(400).json({ error: "Informe barberId." });
  const result = await withRLS(req.auth, (c) =>
    c.query(
      "select * from working_hours where barber_id = $1 order by weekday asc, start_time asc",
      [barberId]
    )
  );
  res.json({ workingHours: result.rows });
});

router.post(
  "/working-hours",
  requireAuth,
  requireRole("admin"),
  body("barber_id").isUUID(),
  body("weekday").isInt({ min: 0, max: 6 }),
  body("start_time").matches(/^\d{2}:\d{2}$/),
  body("end_time").matches(/^\d{2}:\d{2}$/),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: "Dados de horário inválidos." });
    const { barber_id, weekday, start_time, end_time } = req.body;
    if (start_time >= end_time) return res.status(400).json({ error: "Horário final deve ser depois do inicial." });

    const result = await withRLS(req.auth, (c) =>
      c.query(
        "insert into working_hours (barber_id, weekday, start_time, end_time) values ($1,$2,$3,$4) returning *",
        [barber_id, weekday, start_time, end_time]
      )
    );
    res.status(201).json({ workingHour: result.rows[0] });
  }
);

router.delete("/working-hours/:id", requireAuth, requireRole("admin"), async (req, res) => {
  await withRLS(req.auth, (c) => c.query("delete from working_hours where id = $1", [req.params.id]));
  res.status(204).end();
});

/* ---------------- BLOCKED SLOTS (bloqueio pontual, por barbeiro) ---------------- */
// date + start/end nulos      -> bloqueia o dia inteiro só para ESTE barbeiro
// date + start/end preenchidos -> bloqueia apenas aquele intervalo (ex.: dentista às 15h)

router.get("/blocked-slots", optionalAuth, async (req, res) => {
  const { barberId, from, to } = req.query;
  if (!barberId) return res.status(400).json({ error: "Informe barberId." });
  const result = await withRLS(req.auth, (c) =>
    c.query(
      `select * from blocked_slots
       where barber_id = $1 and ($2::date is null or date >= $2) and ($3::date is null or date <= $3)
       order by date asc`,
      [barberId, from || null, to || null]
    )
  );
  res.json({ blockedSlots: result.rows });
});

router.post(
  "/blocked-slots",
  requireAuth,
  requireRole("admin"),
  body("barber_id").isUUID(),
  body("date").isISO8601(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: "Data inválida." });
    const { barber_id, date, start_time, end_time, reason } = req.body;

    const result = await withRLS(req.auth, (c) =>
      c.query(
        "insert into blocked_slots (barber_id, date, start_time, end_time, reason) values ($1,$2,$3,$4,$5) returning *",
        [barber_id, date, start_time || null, end_time || null, reason || null]
      )
    );
    res.status(201).json({ blockedSlot: result.rows[0] });
  }
);

router.delete("/blocked-slots/:id", requireAuth, requireRole("admin"), async (req, res) => {
  await withRLS(req.auth, (c) => c.query("delete from blocked_slots where id = $1", [req.params.id]));
  res.status(204).end();
});

module.exports = router;
