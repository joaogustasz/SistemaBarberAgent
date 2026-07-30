const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { withRLS } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function sign(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role };
}

router.post(
  "/signup",
  body("name").trim().notEmpty().withMessage("Informe seu nome."),
  body("email").isEmail().withMessage("E-mail inválido."),
  body("password").isLength({ min: 6 }).withMessage("A senha precisa ter ao menos 6 caracteres."),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { name, email, password } = req.body;
    try {
      const existing = await withRLS({ id: null, role: "anon" }, (c) =>
        c.query("select * from auth_lookup_user($1)", [email.toLowerCase()])
      );
      if (existing.rows.length) return res.status(409).json({ error: "Já existe uma conta com este e-mail." });

      const hash = await bcrypt.hash(password, 10);
      const result = await withRLS({ id: null, role: "anon" }, (c) =>
        c.query(
          "insert into users (name, email, password_hash, role) values ($1,$2,$3,'client') returning *",
          [name, email.toLowerCase(), hash]
        )
      );
      const user = result.rows[0];
      res.status(201).json({ token: sign(user), user: publicUser(user) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Não foi possível criar a conta." });
    }
  }
);

router.post(
  "/login",
  body("email").isEmail(),
  body("password").notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: "Informe e-mail e senha válidos." });

    const { email, password } = req.body;
    try {
      const result = await withRLS({ id: null, role: "anon" }, (c) =>
        c.query("select * from auth_lookup_user($1)", [email.toLowerCase()])
      );
      const user = result.rows[0];
      if (!user) return res.status(401).json({ error: "E-mail ou senha incorretos." });

      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: "E-mail ou senha incorretos." });

      res.json({ token: sign(user), user: publicUser(user) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao entrar." });
    }
  }
);

// Login social simplificado (o front chama isto após o popup do Google já ter
// devolvido nome/e-mail). Cria a conta na primeira vez, entra nas seguintes.
router.post(
  "/google",
  body("name").notEmpty(),
  body("email").isEmail(),
  async (req, res) => {
    const { name, email } = req.body;
    try {
      const existing = await withRLS({ id: null, role: "anon" }, (c) =>
        c.query("select * from auth_lookup_user($1)", [email.toLowerCase()])
      );
      let user = existing.rows[0];
      if (!user) {
        const randomPass = await bcrypt.hash(email + Date.now(), 10);
        const created = await withRLS({ id: null, role: "anon" }, (c) =>
          c.query(
            "insert into users (name, email, password_hash, role) values ($1,$2,$3,'client') returning *",
            [name, email.toLowerCase(), randomPass]
          )
        );
        user = created.rows[0];
      }
      res.json({ token: sign(user), user: publicUser(user) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao entrar com Google." });
    }
  }
);

router.get("/me", requireAuth, async (req, res) => {
  const result = await withRLS(req.auth, (c) => c.query("select * from users where id = $1", [req.auth.id]));
  if (!result.rows[0]) return res.status(404).json({ error: "Usuário não encontrado." });
  res.json({ user: publicUser(result.rows[0]) });
});

module.exports = router;
