import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./ListaProdutos.css";

const API_URL = "http://localhost:3000/Produtos";

function ListaProdutos() {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [excluindoId, setExcluindoId] = useState("");

  useEffect(() => {
    async function carregarProdutos() {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Não foi possível carregar os produtos.");
        }

        setProdutos(data);
      } catch (error) {
        setErro(error.message);
      } finally {
        setCarregando(false);
      }
    }

    carregarProdutos();
  }, []);

  async function handleDelete(idProdutos) {
    if (!window.confirm("Deseja realmente excluir este produto?")) {
      return;
    }

    setExcluindoId(idProdutos);
    setErro("");

    try {
      const response = await fetch(`${API_URL}/${encodeURIComponent(idProdutos)}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível excluir o produto.");
      }

      setProdutos((produtosAtuais) =>
        produtosAtuais.filter((produto) => produto.idProdutos !== idProdutos),
      );
    } catch (error) {
      setErro(error.message);
    } finally {
      setExcluindoId("");
    }
  }

  return (
    <main className="usuarios-page produtos-page">
      <section className="usuarios-header produtos-header">
        <div>
          <p className="eyebrow">Catálogo</p>
          <h1>Produtos</h1>
          <p>Consulte os produtos cadastrados e mantenha os dados do catálogo atualizados.</p>
        </div>
        <Link className="secondary-button" to="/CadastroProduto">
          Novo produto
        </Link>
      </section>

      {carregando && <p className="status-message">Carregando produtos...</p>}
      {erro && <p className="status-message erro">{erro}</p>}

      {!carregando && !erro && (
        <section className="usuarios-table-wrapper">
          {produtos.length === 0 ? (
            <p className="empty-message">Nenhum produto cadastrado.</p>
          ) : (
            <table className="usuarios-table produtos-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th>Preço</th>
                  <th>Usuário</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {produtos.map((produto) => (
                  <tr key={produto.idProdutos}>
                    <td>{produto.idProdutos}</td>
                    <td>{produto.tipoProduto}</td>
                    <td>{produto.descricaoProduto}</td>
                    <td>R$ {produto.precoProduto}</td>
                    <td>{produto.usuario?.nomeUsuario || produto.usuarioCpf}</td>
                    <td className="action-cell">
                      <Link className="edit-button" to={`/Produtos/${produto.idProdutos}/editar`}>
                        Editar
                      </Link>
                      <button
                        className="delete-button"
                        type="button"
                        onClick={() => handleDelete(produto.idProdutos)}
                        disabled={excluindoId === produto.idProdutos}
                      >
                        {excluindoId === produto.idProdutos ? "Excluindo..." : "Excluir"}
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

export default ListaProdutos;
