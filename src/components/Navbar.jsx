import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav style={s.nav}>
      {/* Logo */}
      <Link to="/" style={s.logo}>
        Animes <span style={s.logoSpan}>Ace</span>
      </Link>

      {/* Links centrais */}
      <ul style={s.links}>
        <li><Link to="/"         style={s.link}>Início</Link></li>
        <li><Link to="/catalogo" style={s.link}>Catálogo</Link></li>
      </ul>

      {/* Área do usuário */}
      <div style={s.userArea}>
        {user ? (
          <div style={s.userMenu}>
            {/* Avatar com inicial do nome */}
            <div style={s.avatar} onClick={() => setMenuAberto(!menuAberto)}>
              {user.nome[0].toUpperCase()}
            </div>

            {/* Dropdown */}
            {menuAberto && (
              <div style={s.dropdown}>
                <span style={s.dropdownNome}>{user.nome}</span>
                {user?.isAdmin && (
                <Link to="/admin" style={{ ...s.dropdownItem, color: '#f4a261' }} onClick={() => setMenuAberto(false)}>
                  ⚙ Painel Admin
                </Link>
                )}
                <Link to="/perfil" style={s.dropdownItem} onClick={() => setMenuAberto(false)}>
                  Meu Perfil
                </Link>
                <button style={s.dropdownLogout} onClick={handleLogout}>
                  Sair
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/login"    style={s.btnSecundario}>Entrar</Link>
            <Link to="/registro" style={s.btnPrimario}>Cadastrar</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

// Estilos inline — mais simples para componentes pequenos
const s = {
  nav: {
    position:       'fixed',
    top: 0, left: 0, right: 0,
    zIndex:         100,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '0 40px',
    height:         '64px',
    background:     'rgba(13,13,20,0.95)',
    backdropFilter: 'blur(12px)',
    borderBottom:   '1px solid #1e1e32',
  },
  logo: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize:   '1.8rem',
    letterSpacing: '2px',
    color:      '#f0f0f0',
  },
  logoSpan: { color: '#e63946' },
  links: {
    display:    'flex',
    gap:        '28px',
    listStyle:  'none',
  },
  link: {
    color:          '#888',
    fontWeight:     700,
    fontSize:       '0.9rem',
    transition:     'color 0.2s',
  },
  userArea: {
    display:    'flex',
    alignItems: 'center',
    gap:        '12px',
  },
  userMenu: {
    position: 'relative',
  },
  avatar: {
    width:          '38px',
    height:         '38px',
    borderRadius:   '50%',
    background:     '#e63946',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontWeight:     900,
    fontSize:       '1rem',
    cursor:         'pointer',
    userSelect:     'none',
  },
  dropdown: {
    position:     'absolute',
    top:          '48px',
    right:        0,
    background:   '#13131f',
    border:       '1px solid #1e1e32',
    borderRadius: '10px',
    padding:      '8px',
    minWidth:     '160px',
    display:      'flex',
    flexDirection: 'column',
    gap:          '4px',
  },
  dropdownNome: {
    padding:    '8px 10px 4px',
    fontWeight: 900,
    fontSize:   '0.85rem',
    color:      '#f0f0f0',
    borderBottom: '1px solid #1e1e32',
    marginBottom: '4px',
  },
  dropdownItem: {
    padding:      '8px 10px',
    borderRadius: '6px',
    fontWeight:   700,
    fontSize:     '0.85rem',
    color:        '#888',
    display:      'block',
  },
  dropdownLogout: {
    padding:      '8px 10px',
    borderRadius: '6px',
    fontWeight:   700,
    fontSize:     '0.85rem',
    color:        '#e63946',
    background:   'transparent',
    border:       'none',
    textAlign:    'left',
    width:        '100%',
  },
  btnPrimario: {
    background:   '#e63946',
    color:        '#fff',
    padding:      '8px 20px',
    borderRadius: '6px',
    fontWeight:   800,
    fontSize:     '0.88rem',
  },
  btnSecundario: {
    color:        '#888',
    fontWeight:   700,
    fontSize:     '0.88rem',
    padding:      '8px 12px',
  },
};