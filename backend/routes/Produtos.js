const express = require("express");
const router = express.Router();

const prisma = require("../prisma/client");
const { authMiddleware } = require("../auth");

router.use(authMiddleware);

function normalizarProduto(produto) {
  if (!produto) return null;

  return {
    ...produto,
    precoProduto: produto.precoProduto ? produto.precoProduto.toString() : null,
  };
}

// LISTAR TODOS OS PRODUTOS
// GET /Produtos
router.get("/", async function (req, res) {
  try {
    const produtos = await prisma.produtos.findMany({
      include: {
        usuario: true,
      },
    });

    return res.status(200).json(produtos.map(normalizarProduto));
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    return res.status(500).json({ error: "Falha ao listar produtos" });
  }
});

// BUSCAR UM PRODUTO POR ID
// GET /Produtos/:idProdutos
router.get("/:idProdutos", async function (req, res) {
  try {
    const idProdutos = Number(req.params.idProdutos);

    if (!Number.isInteger(idProdutos)) {
      return res.status(400).json({ error: "ID do produto inválido." });
    }

    const produto = await prisma.produtos.findUnique({
      where: { idProdutos },
      include: {
        usuario: true,
      },
    });

    if (!produto) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    return res.status(200).json(normalizarProduto(produto));
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    return res.status(500).json({ error: "Falha ao buscar produto" });
  }
});

// CRIAR UM NOVO PRODUTO
// POST /Produtos
router.post("/", async function (req, res) {
  try {
    const { tipoProduto, descricaoProduto, precoProduto, usuarioCpf } = req.body;

    if (!tipoProduto || !descricaoProduto || !precoProduto || !usuarioCpf) {
      return res.status(400).json({
        error: "Tipo, descrição, preço e usuário são obrigatórios.",
      });
    }

    const numeroPreco = Number(precoProduto);

    if (Number.isNaN(numeroPreco) || numeroPreco < 0) {
      return res.status(400).json({ error: "Preço inválido." });
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { cpf: usuarioCpf },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuário informado não existe." });
    }

    const produto = await prisma.produtos.create({
      data: {
        tipoProduto,
        descricaoProduto,
        precoProduto: numeroPreco,
        usuarioCpf,
      },
      include: {
        usuario: true,
      },
    });

    return res.status(201).json(normalizarProduto(produto));
  } catch (error) {
    console.error("Erro ao criar produto:", error?.message || error);

    return res.status(500).json({
      error: "Falha ao criar produto",
      detail: error?.message || "Erro interno do banco de dados",
    });
  }
});

// ATUALIZAR UM PRODUTO
// PUT /Produtos/:idProdutos
router.put("/:idProdutos", async function (req, res) {
  try {
    const idProdutos = Number(req.params.idProdutos);

    if (!Number.isInteger(idProdutos)) {
      return res.status(400).json({ error: "ID do produto inválido." });
    }

    const { tipoProduto, descricaoProduto, precoProduto, usuarioCpf } = req.body;

    if (!tipoProduto || !descricaoProduto || !precoProduto || !usuarioCpf) {
      return res.status(400).json({
        error: "Tipo, descrição, preço e usuário são obrigatórios.",
      });
    }

    const numeroPreco = Number(precoProduto);

    if (Number.isNaN(numeroPreco) || numeroPreco < 0) {
      return res.status(400).json({ error: "Preço inválido." });
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { cpf: usuarioCpf },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuário informado não existe." });
    }

    const produtoAtualizado = await prisma.produtos.update({
      where: { idProdutos },
      data: {
        tipoProduto,
        descricaoProduto,
        precoProduto: numeroPreco,
        usuarioCpf,
      },
      include: {
        usuario: true,
      },
    });

    return res.status(200).json(normalizarProduto(produtoAtualizado));
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Produto não encontrado para atualizar" });
    }

    return res.status(500).json({ error: "Falha ao atualizar produto" });
  }
});

// EXCLUIR UM PRODUTO
// DELETE /Produtos/:idProdutos
router.delete("/:idProdutos", async function (req, res) {
  try {
    const idProdutos = Number(req.params.idProdutos);

    if (!Number.isInteger(idProdutos)) {
      return res.status(400).json({ error: "ID do produto inválido." });
    }

    await prisma.produtos.delete({
      where: { idProdutos },
    });

    return res.status(200).json({ message: "Produto deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir produto:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Produto não encontrado para deletar" });
    }

    return res.status(500).json({ error: "Falha ao deletar produto" });
  }
});

module.exports = router;
