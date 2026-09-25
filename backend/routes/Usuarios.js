const express = require("express");
const router = express.Router();

const prisma = require("../prisma/client");
const { signUserToken, authMiddleware, requireAdmin } = require("../auth");

function sanitizeUsuario(usuario) {
  if (!usuario) return null;

  const { senhaUsuario, ...usuarioSemSenha } = usuario;
  return usuarioSemSenha;
}

// POST /Usuarios/login
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

    const token = signUserToken(usuario);

    return res.status(200).json({
      token,
      usuario: sanitizeUsuario(usuario),
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return res.status(500).json({ error: "Falha ao fazer login." });
  }
});

// GET /Usuarios/me
router.get("/me", authMiddleware, async function (req, res) {
  try {
    const usuario = await prisma.usuarios.findUnique({
      where: { cpf: req.user.cpf },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    return res.status(200).json({ usuario: sanitizeUsuario(usuario) });
  } catch (error) {
    console.error("Erro ao buscar usuário autenticado:", error);
    return res.status(500).json({ error: "Falha ao buscar usuário autenticado." });
  }
});

// LISTAR TODOS OS USUÁRIOS
// GET /Usuarios
router.get("/", authMiddleware, requireAdmin, async function (req, res) {
  try {
    const usuarios = await prisma.usuarios.findMany();
    res.status(200).json(usuarios.map(sanitizeUsuario));
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    res.status(500).json({ error: "Falha ao listar usuários" });
  }
});

// BUSCAR UM USUÁRIO POR CPF
// GET /Usuarios/:cpf
router.get("/:cpf", authMiddleware, async function (req, res) {
  try {
    const { cpf } = req.params;
    const isAdmin = Boolean(req.user?.admin);
    const isSameUser = req.user?.cpf === cpf;

    if (!isAdmin && !isSameUser) {
      return res.status(403).json({ error: "Você não tem permissão para ver este usuário." });
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { cpf },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    return res.status(200).json(sanitizeUsuario(usuario));
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return res.status(500).json({ error: "Falha ao buscar usuário" });
  }
});

// CRIAR UM NOVO USUÁRIO
// POST /Usuarios
router.post("/", authMiddleware, requireAdmin, async function (req, res) {
  try {
    const { cpf, nomeUsuario, emailUsuario, senhaUsuario, admin = false } = req.body;

    if (!cpf || !nomeUsuario || !emailUsuario || !senhaUsuario) {
      return res.status(400).json({
        error: "CPF, nome, e-mail e senha são obrigatórios."
      });
    }

    const usuario = await prisma.usuarios.create({
      data: {
        cpf,
        nomeUsuario,
        emailUsuario,
        senhaUsuario,
        admin: Boolean(admin),
      }
    });

    res.status(201).json(sanitizeUsuario(usuario));
  } catch (error) {
    console.error("Erro ao criar usuário:", error?.message || error);

    if (error.code === "P2002") {
      return res.status(409).json({ error: "Já existe um usuário com esse CPF ou e-mail." });
    }

    return res.status(500).json({
      error: "Falha ao criar usuário",
      detail: error?.message || "Erro interno do banco de dados"
    });
  }
});

// ATUALIZAR UM USUÁRIO
// PUT /Usuarios/:cpf
router.put("/:cpf", authMiddleware, async function (req, res) {
  try {
    const { cpf } = req.params;
    const isAdmin = Boolean(req.user?.admin);
    const isSameUser = req.user?.cpf === cpf;

    if (!isAdmin && !isSameUser) {
      return res.status(403).json({ error: "Você não tem permissão para atualizar este usuário." });
    }

    const { nomeUsuario, emailUsuario, senhaUsuario, admin } = req.body;
    const dadosAtualizados = {
      ...(nomeUsuario !== undefined && { nomeUsuario }),
      ...(emailUsuario !== undefined && { emailUsuario }),
      ...(senhaUsuario !== undefined && { senhaUsuario }),
      ...(isAdmin && admin !== undefined && { admin: Boolean(admin) }),
    };

    const usuarioAtualizado = await prisma.usuarios.update({
      where: { cpf },
      data: dadosAtualizados,
    });

    res.status(200).json(sanitizeUsuario(usuarioAtualizado));
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Usuário não encontrado para atualizar" });
    }

    return res.status(500).json({ error: "Falha ao atualizar usuário" });
  }
});

// EXCLUIR UM USUÁRIO
// DELETE /Usuarios/:cpf
router.delete("/:cpf", authMiddleware, requireAdmin, async function (req, res) {
  try {
    const { cpf } = req.params;

    await prisma.usuarios.delete({
      where: { cpf }
    });

    res.status(200).json({ message: "Usuário deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Usuário não encontrado para deletar" });
    }

    return res.status(500).json({ error: "Falha ao deletar usuário" });
  }
});

module.exports = router;