const crypto = require("crypto");

const JWT_SECRET = process.env.JWT_SECRET || "exemplo-backend-secret";

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, "base64").toString("utf8");
}

function signUserToken(usuario) {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      cpf: usuario.cpf,
      emailUsuario: usuario.emailUsuario,
      nomeUsuario: usuario.nomeUsuario,
      admin: Boolean(usuario.admin),
      iat: Math.floor(Date.now() / 1000),
    })
  );

  const signatureSource = `${header}.${payload}`;
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(signatureSource)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${header}.${payload}.${signature}`;
}

function verifyToken(token) {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const decodedPayload = JSON.parse(base64UrlDecode(payload));
    return decodedPayload;
  } catch (error) {
    return null;
  }
}

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "Token não informado." });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: "Token inválido ou expirado." });
    }

    req.user = decoded;
    return next();
  } catch (error) {
    console.error("Erro no middleware de autenticação:", error);
    return res.status(500).json({ error: "Falha na autenticação." });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || !req.user.admin) {
    return res.status(403).json({ error: "Acesso restrito a administradores." });
  }

  return next();
}

module.exports = {
  signUserToken,
  verifyToken,
  authMiddleware,
  requireAdmin,
};
