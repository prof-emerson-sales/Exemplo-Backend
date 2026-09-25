import { Link, Navigate, Route, Routes } from "react-router-dom";
import { useMemo, useState } from "react";
import CadastroUsuario from "./Componentes/CadastroUsuario/CadastroUsuario";
import EditarUsuario from "./Componentes/EditarUsuario/EditarUsuario";
import ListaUsuarios from "./Componentes/ListaUsuarios/ListaUsuarios";
import CadastroProduto from "./Componentes/CadastroProduto/CadastroProduto";
import ListaProdutos from "./Componentes/ListaProdutos/ListaProdutos";
import EditarProduto from "./Componentes/EditarProduto/EditarProduto";
import Login from "./Componentes/Login/Login";
import "./App.css";

function getUsuarioSessao() {
  try {
    const usuario = localStorage.getItem("usuarioLogado");
    return usuario ? JSON.parse(usuario) : null;
  } catch {
    return null;
  }
}

function ProtectedRoute({ children, adminOnly = false }) {
  const usuario = getUsuarioSessao();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !usuario.admin) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(() => getUsuarioSessao());

  const usuarioAtual = useMemo(() => usuarioLogado, [usuarioLogado]);

  function handleLogin({ usuario, token }) {
    localStorage.setItem("authToken", token);
    localStorage.setItem("usuarioLogado", JSON.stringify(usuario));
    setUsuarioLogado(usuario);
  }

  function handleLogout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("usuarioLogado");
    setUsuarioLogado(null);
  }

  return (
    <>
      <nav className="app-nav">
        <Link to="/Produtos">Produtos</Link>
        <Link to="/CadastroProduto">Cadastrar produto</Link>
        {usuarioAtual?.admin && <Link to="/CadastroUsuario">Cadastrar usuário</Link>}
        {usuarioAtual ? (
          <>
            <span>Olá, {usuarioAtual.nomeUsuario}</span>
            <button type="button" onClick={handleLogout}>Sair</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </nav>

      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />

        <Route path="/CadastroUsuario" element={<ProtectedRoute adminOnly><CadastroUsuario /></ProtectedRoute>} />
        <Route path="/Usuarios" element={<ProtectedRoute adminOnly><ListaUsuarios /></ProtectedRoute>} />
        <Route path="/Usuarios/:cpf/editar" element={<ProtectedRoute adminOnly><EditarUsuario /></ProtectedRoute>} />

        <Route path="/CadastroProduto" element={<ProtectedRoute><CadastroProduto /></ProtectedRoute>} />
        <Route path="/Produtos" element={<ProtectedRoute><ListaProdutos /></ProtectedRoute>} />
        <Route path="/Produtos/:idProdutos/editar" element={<ProtectedRoute><EditarProduto /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/Produtos" replace />} />
      </Routes>
    </>
  );
}

export default App;
