import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Páginas (vamos criar em seguida)
import Home     from './pages/Home';
import Catalogo from './pages/Catalogo';
import Anime    from './pages/Anime';
import Player   from './pages/Player';
import Login    from './pages/Login';
import Registro from './pages/Registro';
import Perfil   from './pages/Perfil';

// Componente de layout (Navbar)
import Navbar from './components/Navbar';

import Admin from './pages/Admin';
import AdminAnimeForm from './pages/AdminAnimeForm';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"              element={<Home />}     />
          <Route path="/catalogo"      element={<Catalogo />} />
          <Route path="/anime/:id"     element={<Anime />}    />
          <Route path="/assistir/:id"  element={<Player />}   />
          <Route path="/login"         element={<Login />}    />
          <Route path="/registro"      element={<Registro />} />
          <Route path="/perfil"        element={<Perfil />}   />
          <Route path="/admin"         element={<Admin />}    />
          <Route path="/admin/anime/novo" element={<AdminAnimeForm />} />
          <Route path="/admin/anime/:id/editar" element={<AdminAnimeForm />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}