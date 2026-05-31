import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

// Contexto global de autenticação
// Qualquer componente pode acessar os dados do usuário logado
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // Evita flash de tela antes de verificar o token

  // Ao carregar o app, verifica se já tem token salvo e busca os dados do usuário
  useEffect(() => {
    async function verificarToken() {
      const token = localStorage.getItem('token');
      if (!token) { setLoading(false); return; }

      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
      } catch {
        // Token inválido ou expirado — limpa o storage
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    }
    verificarToken();
  }, []);

  // Salva o token e os dados do usuário após login ou registro
  function salvarSessao(userData, token) {
    localStorage.setItem('token', token);
    setUser(userData);
  }

  // Limpa tudo ao fazer logout
  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, salvarSessao, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar o contexto facilmente
export function useAuth() {
  return useContext(AuthContext);
}