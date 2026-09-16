import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./ListaUsuarios.css";

const API_URL = "http://localhost:3000/Usuarios";

function ListaUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [excluindoCpf, setExcluindoCpf] = useState("");

  useEffect(() => {
    async function carregarUsuarios() {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Não foi possível carregar os usuários.");
        }

        setUsuarios(data);
      } catch (error) {
        setErro(error.message);
      } finally {
        setCarregando(false);
      }
    }

    carregarUsuarios();
  }, []);

  async function handleDelete(cpf) {
    if (!window.confirm("Deseja realmente excluir este usuário?")) {
      return;
    }

    setExcluindoCpf(cpf);
    setErro("");

    try {
      const response = await fetch(`${API_URL}/${encodeURIComponent(cpf)}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível excluir o usuário.");
      }

      setUsuarios((usuariosAtuais) =>
        usuariosAtuais.filter((usuario) => usuario.cpf !== cpf),
      );
    } catch (error) {
      setErro(error.message);
    } finally {
      setExcluindoCpf("");
    }
  }

  return (
    <main className="usuarios-page">
      <section className="usuarios-header">
        <div>
          <p className="eyebrow">Administração</p>
          <h1>Usuários</h1>
          <p>Consulte os usuários cadastrados e atualize seus dados.</p>
        </div>
        <Link className="secondary-button" to="/CadastroUsuario">
          Novo usuário
        </Link>
      </section>

      {carregando && <p className="status-message">Carregando usuários...</p>}
      {erro && <p className="status-message erro">{erro}</p>}

      {!carregando && !erro && (
        <section className="usuarios-table-wrapper">
          {usuarios.length === 0 ? (
            <p className="empty-message">Nenhum usuário cadastrado.</p>
          ) : (
            <table className="usuarios-table">
              <thead>
                <tr>
                  <th>CPF</th>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.cpf}>
                    <td>{usuario.cpf}</td>
                    <td>{usuario.nomeUsuario}</td>
                    <td>{usuario.emailUsuario}</td>
                    <td className="action-cell">
                      <Link className="edit-button" to={`/Usuarios/${usuario.cpf}/editar`}>
                        Editar
                      </Link>
                      <button
                        className="delete-button"
                        type="button"
                        onClick={() => handleDelete(usuario.cpf)}
                        disabled={excluindoCpf === usuario.cpf}
                      >
                        {excluindoCpf === usuario.cpf ? "Excluindo..." : "Excluir"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </main>
  );
}

export default ListaUsuarios;
