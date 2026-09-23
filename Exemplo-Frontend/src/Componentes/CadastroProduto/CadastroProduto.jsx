import React, { useEffect, useState } from "react";
import "./CadastroProduto.css";

const API_URL = "http://localhost:3000/Produtos";
const USUARIOS_URL = "http://localhost:3000/Usuarios";

function CadastroProduto() {
  const [form, setForm] = useState({
    tipoProduto: "",
    descricaoProduto: "",
    precoProduto: "",
    usuarioCpf: "",
  });
  const [usuarios, setUsuarios] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(true);

  useEffect(() => {
    async function carregarUsuarios() {
      try {
        const response = await fetch(USUARIOS_URL);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Não foi possível carregar os usuários.");
        }

        setUsuarios(data);
        if (data.length > 0) {
          setForm((prev) => ({ ...prev, usuarioCpf: data[0].cpf }));
        }
      } catch (error) {
        setErro(error.message);
      } finally {
        setCarregandoUsuarios(false);
      }
    }

    carregarUsuarios();
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
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao cadastrar produto.");
      }

      setMensagem("Produto cadastrado com sucesso!");
      setForm({
        tipoProduto: "",
        descricaoProduto: "",
        precoProduto: "",
        usuarioCpf: usuarios[0]?.cpf || "",
      });
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
        <p>Preencha os dados do produto e escolha o usuário responsável.</p>

        {carregandoUsuarios ? (
          <p className="status-message">Carregando usuários...</p>
        ) : usuarios.length === 0 ? (
          <p className="erro">Cadastre um usuário antes de criar um produto.</p>
        ) : null}

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
            Usuário
            <select
              name="usuarioCpf"
              value={form.usuarioCpf}
              onChange={handleChange}
              required
              disabled={usuarios.length === 0}
            >
              {usuarios.map((usuario) => (
                <option key={usuario.cpf} value={usuario.cpf}>
                  {usuario.nomeUsuario} - {usuario.cpf}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" disabled={carregando || usuarios.length === 0}>
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
