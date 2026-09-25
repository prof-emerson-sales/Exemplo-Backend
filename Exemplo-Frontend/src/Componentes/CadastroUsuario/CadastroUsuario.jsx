import React, { useState } from "react";
import "./CadastroUsuario.css";

function CadastroUsuario() {
  const [form, setForm] = useState({
    cpf: "",
    nomeUsuario: "",
    emailUsuario: "",
    senhaUsuario: "",
    admin: false,
  });

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  function handleChange(event) {
    const { name, type, checked, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setCarregando(true);
    setMensagem("");
    setErro("");

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:3000/Usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao cadastrar usuário.");
      }

      setMensagem("Usuário cadastrado com sucesso!");
      setForm({
        cpf: "",
        nomeUsuario: "",
        emailUsuario: "",
        senhaUsuario: "",
        admin: false,
      });
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="cadastro-page">
      <div className="cadastro-card">
        <h1>Criar usuário</h1>
        <p>Preencha os dados para cadastrar um novo usuário no sistema.</p>

        <form onSubmit={handleSubmit} className="cadastro-form">
          <label>
            CPF
            <input
              type="text"
              name="cpf"
              value={form.cpf}
              onChange={handleChange}
              placeholder="Digite o CPF"
              required
            />
          </label>

          <label>
            Nome
            <input
              type="text"
              name="nomeUsuario"
              value={form.nomeUsuario}
              onChange={handleChange}
              placeholder="Digite o nome"
              required
            />
          </label>

          <label>
            E-mail
            <input
              type="email"
              name="emailUsuario"
              value={form.emailUsuario}
              onChange={handleChange}
              placeholder="Digite o e-mail"
              required
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              name="senhaUsuario"
              value={form.senhaUsuario}
              onChange={handleChange}
              placeholder="Digite a senha"
              required
            />
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              name="admin"
              checked={form.admin}
              onChange={handleChange}
            />
            Usuário administrador
          </label>

          <button type="submit" disabled={carregando}>
            {carregando ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>

        {mensagem && <p className="sucesso">{mensagem}</p>}
        {erro && <p className="erro">{erro}</p>}
      </div>
    </div>
  );
}

export default CadastroUsuario;
