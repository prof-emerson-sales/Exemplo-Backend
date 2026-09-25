import { useState } from "react";

function Login({ onLogin }) {
  const [form, setForm] = useState({
    emailUsuario: "",
    senhaUsuario: "",
  });
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setCarregando(true);
    setErro("");

    try {
      const response = await fetch("http://localhost:3000/Usuarios/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer login.");
      }

      onLogin?.({ usuario: data.usuario, token: data.token });
      window.location.href = "/Produtos";
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="cadastro-page">
      <div className="cadastro-card">
        <h1>Login</h1>
        <p>Entre com seus dados para acessar o sistema.</p>

        <form onSubmit={handleSubmit} className="cadastro-form">
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

          <button type="submit" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {erro && <p className="erro">{erro}</p>}
      </div>
    </div>
  );
}

export default Login;
