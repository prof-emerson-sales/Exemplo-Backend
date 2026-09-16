import { Route, Routes } from "react-router-dom";
import CadastroUsuario from "./Componentes/CadastroUsuario/CadastroUsuario";
import EditarUsuario from "./Componentes/EditarUsuario/EditarUsuario";
import ListaUsuarios from "./Componentes/ListaUsuarios/ListaUsuarios";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/CadastroUsuario" element={<CadastroUsuario />} />
      <Route path="/Usuarios" element={<ListaUsuarios />} />
      <Route path="/Usuarios/:cpf/editar" element={<EditarUsuario />} />
    </Routes>
  )
}

export default App
