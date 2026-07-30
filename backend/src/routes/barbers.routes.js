const express = require("express");
const { body, validationResult } = require("express-validator");
const { withRLS } = require("../db");
const { optionalAuth, requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Lista pública de barbeiros ativos (usada na landing e no fluxo de agendamento)
router.get("/", optionalAuth, async (req, res) => {
  const result = await withRLS(req.auth, (c) =>
    c.query("select * from barbers where active = true order by created_at asc")
  );
  res.json({ barbers: result.rows });
});

router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  body("name").trim().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: "Informe o nome do barbeiro." });

    const { name, role_title, color } = req.body;
    const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
    const result = await withRLS(req.auth, (c) =>
      c.query(
        "insert into barbers (name, role_title, initials, color) values ($1,$2,$3,$4) returning *",
        [name, role_title || "Barbeiro", initials, color || "amber"]
      )
    );
    res.status(201).json({ barber: result.rows[0] });
  }
);

router.put("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const { name, role_title, active } = req.body;
  const result = await withRLS(req.auth, (c) =>
    c.query(
      `update barbers set
        name = coalesce($1, name),
        role_title = coalesce($2, role_title),
        active = coalesce($3, active)
       where id = $4 returning *`,
      [name, role_title, active, req.params.id]
    )
  );
  if (!result.rows[0]) return res.status(404).json({ error: "Barbeiro não encontrado." });
  res.json({ barber: result.rows[0] });
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  await withRLS(req.auth, (c) => c.query("delete from barbers where id = $1", [req.params.id]));
  res.status(204).end();
});

module.exports = router;
