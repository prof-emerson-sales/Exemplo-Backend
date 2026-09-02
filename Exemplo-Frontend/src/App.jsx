import { useState } from 'react'
import { Routes, Route } from "react-router-dom";
import CadastroUsuario from './Componentes/CadastroUsuario/CadastroUsuario'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Routes>
        <Route path="/CadastroUsuario" element={<CadastroUsuario />}></Route>
      </Routes>
    </>
  )
}

export default App
