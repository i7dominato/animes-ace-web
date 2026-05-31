import axios from 'axios';

// Base URL da API — em produção troca pela URL do Render
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// Interceptor — adiciona o token JWT em todas as requisições automaticamente
// Assim não precisa passar o token manualmente em cada chamada
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;