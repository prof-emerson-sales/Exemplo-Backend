import React, { useEffect, useState } from "react";
import "./CadastroProduto.css";

const API_URL = "http://localhost:3000/Produtos";

function CadastroProduto() {
  const [form, setForm] = useState({
    tipoProduto: "",
    descricaoProduto: "",
    precoProduto: "",
    usuarioCpf: "",
  });
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado") || "null");
    if (usuarioLogado?.cpf) {
      setForm((prev) => ({ ...prev, usuarioCpf: usuarioLogado.cpf }));
    }
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setCarregando(true);
    setMensagem("");
    setErro("");

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao cadastrar produto.");
      }

      setMensagem("Produto cadastrado com sucesso!");
      setForm((prev) => ({
        ...prev,
        tipoProduto: "",
        descricaoProduto: "",
        precoProduto: "",
        usuarioCpf: JSON.parse(localStorage.getItem("usuarioLogado") || "null")?.cpf || "",
      }));
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="cadastro-page produto-page">
      <div className="cadastro-card produto-card">
        <h1>Criar produto</h1>
        <p>Preencha os dados do produto para o usuário logado.</p>

        <form onSubmit={handleSubmit} className="cadastro-form produto-form">
          <label>
            Tipo do produto
            <input
              type="text"
              name="tipoProduto"
              value={form.tipoProduto}
              onChange={handleChange}
              placeholder="Ex.: Camiseta, Livro, Caneca"
              required
            />
          </label>

          <label>
            Descrição
            <textarea
              name="descricaoProduto"
              value={form.descricaoProduto}
              onChange={handleChange}
              placeholder="Descreva o produto"
              rows="4"
              required
            />
          </label>

          <label>
            Preço
            <input
              type="number"
              step="0.01"
              min="0"
              name="precoProduto"
              value={form.precoProduto}
              onChange={handleChange}
              placeholder="0.00"
              required
            />
          </label>

          <label>
            Usuário responsável
            <input
              type="text"
              value={form.usuarioCpf || "Usuário não identificado"}
              readOnly
            />
          </label>

          <button type="submit" disabled={carregando || !form.usuarioCpf}>
            {carregando ? "Cadastrando..." : "Cadastrar produto"}
          </button>
        </form>

        {mensagem && <p className="sucesso">{mensagem}</p>}
        {erro && <p className="erro">{erro}</p>}
      </div>
    </div>
  );
}

export default CadastroProduto;
