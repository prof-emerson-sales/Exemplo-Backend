import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./EditarProduto.css";

const API_URL = "http://localhost:3000/Produtos";
const USUARIOS_URL = "http://localhost:3000/Usuarios";

function EditarProduto() {
  const { idProdutos } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    tipoProduto: "",
    descricaoProduto: "",
    precoProduto: "",
    usuarioCpf: "",
  });
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDados() {
      try {
        const [produtoResponse, usuariosResponse] = await Promise.all([
          fetch(`${API_URL}/${encodeURIComponent(idProdutos)}`),
          fetch(USUARIOS_URL),
        ]);

        const produtoData = await produtoResponse.json();
        const usuariosData = await usuariosResponse.json();

        if (!produtoResponse.ok) {
          throw new Error(produtoData.error || "Não foi possível carregar o produto.");
        }

        if (!usuariosResponse.ok) {
          throw new Error(usuariosData.error || "Não foi possível carregar os usuários.");
        }

        setUsuarios(usuariosData);
        setForm({
          tipoProduto: produtoData.tipoProduto || "",
          descricaoProduto: produtoData.descricaoProduto || "",
          precoProduto: produtoData.precoProduto || "",
          usuarioCpf: produtoData.usuarioCpf || produtoData.usuario?.cpf || "",
        });
      } catch (error) {
        setErro(error.message);
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, [idProdutos]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSalvando(true);
    setErro("");

    try {
      const response = await fetch(`${API_URL}/${encodeURIComponent(idProdutos)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível atualizar o produto.");
      }

      navigate("/Produtos");
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <main className="editar-page"><p>Carregando produto...</p></main>;
  }

  return (
    <main className="editar-page produto-editar-page">
      <section className="editar-card produto-editar-card">
        <Link className="back-link" to="/Produtos">Voltar para produtos</Link>
        <p className="eyebrow">Editar catálogo</p>
        <h1>Atualizar produto</h1>
        <p className="cpf-label">ID: {idProdutos}</p>

        {erro && <p className="status-message erro">{erro}</p>}

        {!erro && (
          <form onSubmit={handleSubmit} className="editar-form produto-editar-form">
            <label>
              Tipo do produto
              <input name="tipoProduto" value={form.tipoProduto} onChange={handleChange} required />
            </label>

            <label>
              Descrição
              <textarea
                name="descricaoProduto"
                value={form.descricaoProduto}
                onChange={handleChange}
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
              >
                {usuarios.map((usuario) => (
                  <option key={usuario.cpf} value={usuario.cpf}>
                    {usuario.nomeUsuario} - {usuario.cpf}
                  </option>
                ))}
              </select>
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

export default EditarProduto;
