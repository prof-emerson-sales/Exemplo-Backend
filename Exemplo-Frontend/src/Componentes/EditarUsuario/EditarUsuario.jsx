import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./EditarUsuario.css";

const API_URL = "http://localhost:3000/Usuarios";

function EditarUsuario() {
  const { cpf } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nomeUsuario: "",
    emailUsuario: "",
    senhaUsuario: "",
  });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarUsuario() {
      try {
        const response = await fetch(`${API_URL}/${encodeURIComponent(cpf)}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Não foi possível carregar o usuário.");
        }

        setForm({
          nomeUsuario: data.nomeUsuario || "",
          emailUsuario: data.emailUsuario || "",
          senhaUsuario: data.senhaUsuario || "",
        });
      } catch (error) {
        setErro(error.message);
      } finally {
        setCarregando(false);
      }
    }

    carregarUsuario();
  }, [cpf]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSalvando(true);
    setErro("");

    try {
      const response = await fetch(`${API_URL}/${encodeURIComponent(cpf)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível atualizar o usuário.");
      }

      navigate("/Usuarios");
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <main className="editar-page"><p>Carregando usuário...</p></main>;
  }

  return (
    <main className="editar-page">
      <section className="editar-card">
        <Link className="back-link" to="/Usuarios">Voltar para usuários</Link>
        <p className="eyebrow">Editar cadastro</p>
        <h1>Atualizar usuário</h1>
        <p className="cpf-label">CPF: {cpf}</p>

        {erro && <p className="status-message erro">{erro}</p>}

        {!erro && (
          <form onSubmit={handleSubmit} className="editar-form">
            <label>
              Nome
              <input name="nomeUsuario" value={form.nomeUsuario} onChange={handleChange} required />
            </label>
            <label>
              E-mail
              <input type="email" name="emailUsuario" value={form.emailUsuario} onChange={handleChange} required />
            </label>
            <label>
              Senha
              <input type="password" name="senhaUsuario" value={form.senhaUsuario} onChange={handleChange} required />
            </label>
            <button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar alterações"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export default EditarUsuario;
