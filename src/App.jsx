import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Welcome from './pages/Welcome'
import Menu from './pages/Menu'
import Admin from './pages/Admin'
import Login from './pages/Login'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta para el bienvenida */}
        <Route path="/" element={<Welcome />} />
        
        {/* Ruta para el público */}
        <Route path="/menu" element={<Menu />} />
        
        {/* Ruta para el dueño del negocio */}
        <Route path="/admin" element={<Admin />} />
        
        {/* Ruta para el login */}
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App