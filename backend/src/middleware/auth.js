const jwt = require("jsonwebtoken");

function readToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice(7);
}

/** Preenche req.auth = { id, role } se houver um token válido; nunca bloqueia. */
function optionalAuth(req, _res, next) {
  const token = readToken(req);
  req.auth = { id: null, role: "anon" };
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.auth = { id: payload.sub, role: payload.role };
    } catch (_e) {
      // token inválido/expirado -> segue como anônimo
    }
  }
  next();
}

/** Exige um token válido. */
function requireAuth(req, res, next) {
  const token = readToken(req);
  if (!token) return res.status(401).json({ error: "Não autenticado." });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = { id: payload.sub, role: payload.role };
    next();
  } catch (_e) {
    return res.status(401).json({ error: "Sessão inválida ou expirada." });
  }
}

/** Exige que o papel do usuário esteja entre os permitidos. Usar depois de requireAuth. */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ error: "Acesso não permitido para este perfil." });
    }
    next();
  };
}

module.exports = { optionalAuth, requireAuth, requireRole };
