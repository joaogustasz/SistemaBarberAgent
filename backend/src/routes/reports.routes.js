const express = require("express");
const { withRLS } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /api/reports/summary?from=&to=
router.get("/summary", requireAuth, requireRole("admin"), async (req, res) => {
  const from = req.query.from || new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const to = req.query.to || new Date().toISOString().slice(0, 10);

  const data = await withRLS(req.auth, async (c) => {
    const byDay = await c.query(
      `select date, count(*)::int as total
       from appointments
       where date between $1 and $2 and status != 'cancelado'
       group by date order by date asc`,
      [from, to]
    );

    const topServices = await c.query(
      `select s.name, count(*)::int as total
       from appointments a join services s on s.id = a.service_id
       where a.date between $1 and $2 and a.status != 'cancelado'
       group by s.name order by total desc limit 5`,
      [from, to]
    );

    const revenue = await c.query(
      `select coalesce(sum(s.price_cents),0)::int as total_cents
       from appointments a join services s on s.id = a.service_id
       where a.date between $1 and $2 and a.status != 'cancelado'`,
      [from, to]
    );

    const clients = await c.query(
      `select count(distinct client_id)::int as total
       from appointments
       where date between $1 and $2 and status = 'concluido'`,
      [from, to]
    );

    const totalAppointments = await c.query(
      `select count(*)::int as total from appointments where date between $1 and $2 and status != 'cancelado'`,
      [from, to]
    );

    return {
      byDay: byDay.rows,
      topServices: topServices.rows,
      revenueCents: revenue.rows[0].total_cents,
      clientsAttended: clients.rows[0].total,
      totalAppointments: totalAppointments.rows[0].total,
    };
  });

  res.json(data);
});

module.exports = router;
