import { useState }          from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth }           from '../context/AuthContext';
import api                   from '../services/api';

export default function Login() {
  const [email,  setEmail]  = useState('');
  const [senha,  setSenha]  = useState('');
  const [erro,   setErro]   = useState('');
  const [loading, setLoading] = useState(false);

  const { salvarSessao } = useAuth();
  const navigate         = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, senha });
      salvarSessao(data.user, data.token);
      navigate('/');
    } catch (err) {
      setErro(err.response?.data?.error ?? 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.box}>

        {/* Logo */}
        <div style={s.logo}>
          Animes <span style={s.logoSpan}>Ace</span>
        </div>
        <p style={s.subtitulo}>Entre na sua conta</p>

        {/* Mensagem de erro */}
        {erro && <div style={s.erro}>{erro}</div>}

        {/* Formulário */}
        <div style={s.form}>
          <div style={s.campo}>
            <label style={s.label}>Email</label>
            <input
              style={s.input}
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div style={s.campo}>
            <label style={s.label}>Senha</label>
            <input
              style={s.input}
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={e => setSenha(e.target.value)}
            />
          </div>

          <button
            style={{ ...s.btnPrimario, opacity: loading ? 0.6 : 1 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>

        {/* Link para cadastro */}
        <p style={s.rodape}>
          Não tem conta?{' '}
          <Link to="/registro" style={s.rodapeLink}>Cadastre-se</Link>
        </p>

      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight:      '100vh',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        '80px 20px',
    background:     'radial-gradient(ellipse at 50% 0%, #1a0520 0%, #0d0d14 60%)',
  },
  box: {
    width:        '100%',
    maxWidth:     '420px',
    background:   '#13131f',
    border:       '1px solid #1e1e32',
    borderRadius: '16px',
    padding:      '40px',
  },
  logo: {
    fontFamily:    '"Bebas Neue", sans-serif',
    fontSize:      '2rem',
    letterSpacing: '2px',
    textAlign:     'center',
    marginBottom:  '6px',
  },
  logoSpan:  { color: '#e63946' },
  subtitulo: { color: '#888', fontSize: '0.9rem', textAlign: 'center', marginBottom: '28px' },

  erro: {
    background:   'rgba(230,57,70,0.12)',
    border:       '1px solid rgba(230,57,70,0.3)',
    color:        '#e63946',
    padding:      '12px 16px',
    borderRadius: '8px',
    fontSize:     '0.85rem',
    marginBottom: '20px',
  },

  form:  { display: 'flex', flexDirection: 'column', gap: '18px' },
  campo: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.82rem', fontWeight: 800, color: '#888', letterSpacing: '0.5px' },
  input: {
    background:   '#0d0d14',
    border:       '1px solid #1e1e32',
    borderRadius: '8px',
    color:        '#f0f0f0',
    padding:      '12px 16px',
    fontSize:     '0.92rem',
    fontFamily:   'inherit',
    outline:      'none',
    transition:   'border-color 0.2s',
  },
  btnPrimario: {
    background:   '#e63946',
    color:        '#fff',
    border:       'none',
    padding:      '14px',
    borderRadius: '8px',
    fontFamily:   'inherit',
    fontWeight:   800,
    fontSize:     '0.95rem',
    cursor:       'pointer',
    marginTop:    '4px',
  },
  rodape:     { textAlign: 'center', color: '#888', fontSize: '0.85rem', marginTop: '24px' },
  rodapeLink: { color: '#e63946', fontWeight: 800 },
};