const express = require("express");
const { body, validationResult } = require("express-validator");
const { withRLS } = require("../db");
const { optionalAuth, requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /api/services?barberId=... -> lista pública de serviços (filtra por barbeiro se informado)
router.get("/", optionalAuth, async (req, res) => {
  const { barberId } = req.query;
  const result = await withRLS(req.auth, (c) =>
    barberId
      ? c.query(
          "select * from services where barber_id = $1 and active = true order by created_at asc",
          [barberId]
        )
      : c.query("select * from services where active = true order by created_at asc")
  );
  res.json({ services: result.rows });
});

router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  body("barber_id").isUUID(),
  body("name").trim().notEmpty(),
  body("price_cents").isInt({ min: 0 }),
  body("duration_min").isInt({ min: 5 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: "Verifique nome, preço e duração do serviço." });

    const { barber_id, name, price_cents, duration_min } = req.body;
    try {
      const result = await withRLS(req.auth, (c) =>
        c.query(
          "insert into services (barber_id, name, price_cents, duration_min) values ($1,$2,$3,$4) returning *",
          [barber_id, name, price_cents, duration_min]
        )
      );
      res.status(201).json({ service: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Não foi possível criar o serviço." });
    }
  }
);

router.put("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const { name, price_cents, duration_min, active } = req.body;
  const result = await withRLS(req.auth, (c) =>
    c.query(
      `update services set
        name = coalesce($1, name),
        price_cents = coalesce($2, price_cents),
        duration_min = coalesce($3, duration_min),
        active = coalesce($4, active)
       where id = $5 returning *`,
      [name, price_cents, duration_min, active, req.params.id]
    )
  );
  if (!result.rows[0]) return res.status(404).json({ error: "Serviço não encontrado." });
  res.json({ service: result.rows[0] });
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  await withRLS(req.auth, (c) => c.query("delete from services where id = $1", [req.params.id]));
  res.status(204).end();
});

module.exports = router;
