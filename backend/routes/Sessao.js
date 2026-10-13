const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const prisma = require("../prisma/client");

function getGoogleOAuthConfig() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return null;
  }

  return {
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL
      || "http://localhost:3000/Sessao/google/callback",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173/login/sessao",
  };
}

function redirectToFrontend(res, result) {
  const config = getGoogleOAuthConfig();
  const url = new URL(config.frontendUrl);
  url.searchParams.set("oauth", result);
  return res.redirect(url.toString());
}

function createGoogleAuthorizationUrl(config, state) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.callbackUrl,
    response_type: "code",
    scope: "openid email profile",
    state,
  }).toString();
  return url.toString();
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => error ? reject(error) : resolve());
  });
}

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => error ? reject(error) : resolve());
  });
}

async function establishSession(req, usuario) {
  await regenerateSession(req);
  req.session.usuario = {
    cpf: usuario.cpf,
    emailUsuario: usuario.emailUsuario,
    nomeUsuario: usuario.nomeUsuario,
    admin: Boolean(usuario.admin),
  };
  await saveSession(req);
}

function requireSession(req, res, next) {
  if (!req.session?.usuario) {
    return res.status(401).json({ error: "Sessão não autenticada ou expirada." });
  }

  return next();
}

router.post("/login", async function (req, res) {
  try {
    const { emailUsuario, senhaUsuario } = req.body;

    if (!emailUsuario || !senhaUsuario) {
      return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { emailUsuario },
    });

    if (!usuario || usuario.senhaUsuario !== senhaUsuario) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    await establishSession(req, usuario);

    return res.status(200).json({ usuario: req.session.usuario });
  } catch (error) {
    console.error("Erro ao iniciar sessão:", error);
    return res.status(500).json({ error: "Falha ao iniciar sessão." });
  }
});

router.get("/google", async function (req, res) {
  const config = getGoogleOAuthConfig();
  if (!config) {
    return res.status(503).json({
      error: "Login com Google não configurado. Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET.",
    });
  }

  try {
    const state = crypto.randomBytes(32).toString("hex");
    req.session.googleOAuthState = state;
    await saveSession(req);
    return res.redirect(createGoogleAuthorizationUrl(config, state));
  } catch (error) {
    console.error("Erro ao iniciar OAuth do Google:", error);
    return res.status(500).json({ error: "Falha ao iniciar login com Google." });
  }
});

router.get("/google/callback", async function (req, res) {
  const config = getGoogleOAuthConfig();
  if (!config) {
    return res.status(503).json({
      error: "Login com Google não configurado. Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET.",
    });
  }

  const expectedState = req.session?.googleOAuthState;
  const receivedState = req.query.state;
  if (
    typeof expectedState !== "string"
    || typeof receivedState !== "string"
    || expectedState.length !== receivedState.length
    || !crypto.timingSafeEqual(Buffer.from(expectedState), Buffer.from(receivedState))
  ) {
    return redirectToFrontend(res, "error");
  }

  delete req.session.googleOAuthState;

  if (req.query.error || typeof req.query.code !== "string") {
    return redirectToFrontend(res, "error");
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: req.query.code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Google recusou a troca do código OAuth:", tokenResponse.status);
      return redirectToFrontend(res, "error");
    }

    const tokens = await tokenResponse.json();
    if (typeof tokens.access_token !== "string") {
      console.error("Resposta OAuth do Google sem access_token.");
      return redirectToFrontend(res, "error");
    }

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!profileResponse.ok) {
      console.error("Falha ao consultar perfil OAuth do Google:", profileResponse.status);
      return redirectToFrontend(res, "error");
    }

    const profile = await profileResponse.json();
    if (profile.email_verified !== true || typeof profile.email !== "string") {
      return redirectToFrontend(res, "error");
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { emailUsuario: profile.email },
    });

    if (!usuario) {
      req.session.googlePending = {
        emailUsuario: profile.email,
        nomeUsuario: typeof profile.name === "string" && profile.name.trim()
          ? profile.name.trim().slice(0, 100)
          : profile.email.split("@")[0].slice(0, 100),
      };
      await saveSession(req);
      return redirectToFrontend(res, "registration-required");
    }

    await establishSession(req, usuario);
    return redirectToFrontend(res, "success");
  } catch (error) {
    console.error("Erro ao concluir OAuth do Google:", error);
    return redirectToFrontend(res, "error");
  }
});

router.get("/google/pending", function (req, res) {
  if (!req.session?.googlePending) {
    return res.status(404).json({ error: "Nenhum cadastro Google pendente." });
  }

  return res.status(200).json({ usuario: req.session.googlePending });
});

router.post("/google/register", async function (req, res) {
  const pending = req.session?.googlePending;
  const cpf = typeof req.body?.cpf === "string" ? req.body.cpf.trim() : "";

  if (!pending) {
    return res.status(401).json({ error: "O login com Google expirou. Tente novamente." });
  }

  if (!/^\d{11}$/.test(cpf)) {
    return res.status(400).json({ error: "Informe um CPF válido com 11 números." });
  }

  try {
    const usuarioExistente = await prisma.usuarios.findUnique({
      where: { emailUsuario: pending.emailUsuario },
    });

    if (usuarioExistente) {
      return res.status(409).json({
        error: "Já existe uma conta com esse e-mail. Entre novamente com o Google.",
      });
    }

    const usuario = await prisma.usuarios.create({
      data: {
        cpf,
        nomeUsuario: pending.nomeUsuario,
        emailUsuario: pending.emailUsuario,
        senhaUsuario: crypto.randomBytes(32).toString("hex"),
        admin: false,
      },
    });

    await establishSession(req, usuario);
    return res.status(201).json({ usuario: req.session.usuario });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Já existe uma conta com esse CPF." });
    }

    console.error("Erro ao concluir cadastro com Google:", error);
    return res.status(500).json({ error: "Falha ao concluir cadastro com Google." });
  }
});

router.get("/me", requireSession, function (req, res) {
  return res.status(200).json({ usuario: req.session.usuario });
});

router.post("/logout", function (req, res) {
  if (!req.session) {
    return res.sendStatus(204);
  }

  return req.session.destroy((error) => {
    if (error) {
      console.error("Erro ao encerrar sessão:", error);
      return res.status(500).json({ error: "Falha ao encerrar sessão." });
    }

    res.clearCookie("connect.sid", { path: "/" });
    return res.sendStatus(204);
  });
});

router.get("/produtos", requireSession, async function (req, res) {
  try {
    const produtos = await prisma.produtos.findMany({
      include: { usuario: true },
    });

    return res.status(200).json(produtos.map((produto) => ({
      ...produto,
      precoProduto: produto.precoProduto ? produto.precoProduto.toString() : null,
    })));
  } catch (error) {
    console.error("Erro ao listar produtos pela sessão:", error);
    return res.status(500).json({ error: "Falha ao listar produtos." });
  }
});

module.exports = router;