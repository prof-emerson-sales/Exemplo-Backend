const express = require("express");
const router = express.Router();

const prisma = require("../prisma/client");

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

    await new Promise((resolve, reject) => {
      req.session.regenerate((error) => error ? reject(error) : resolve());
    });

    req.session.usuario = {
      cpf: usuario.cpf,
      emailUsuario: usuario.emailUsuario,
      nomeUsuario: usuario.nomeUsuario,
      admin: Boolean(usuario.admin),
    };

    await new Promise((resolve, reject) => {
      req.session.save((error) => error ? reject(error) : resolve());
    });

    return res.status(200).json({ usuario: req.session.usuario });
  } catch (error) {
    console.error("Erro ao iniciar sessão:", error);
    return res.status(500).json({ error: "Falha ao iniciar sessão." });
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