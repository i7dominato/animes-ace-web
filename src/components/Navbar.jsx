import { useState }          from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth }           from '../context/AuthContext';
import { useWindowSize }     from '../hooks/useWindowSize';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate                  = useNavigate();
  const { isMobile }              = useWindowSize();
  const [menuAberto,  setMenuAberto]  = useState(false);
  const [userMenuAberto, setUserMenuAberto] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
    setMenuAberto(false);
  }

  return (
    <>
      <nav style={s.nav}>
        {/* Logo */}
        <Link to="/" style={s.logo} onClick={() => setMenuAberto(false)}>
          Animes <span style={s.logoSpan}>Ace</span>
        </Link>

        {/* Links — só aparece no desktop */}
        {!isMobile && (
          <ul style={s.links}>
            <li><Link to="/"         style={s.link}>Início</Link></li>
            <li><Link to="/catalogo" style={s.link}>Catálogo</Link></li>
          </ul>
        )}

        {/* Área direita */}
        <div style={s.userArea}>
          {user ? (
            <div style={s.userMenu}>
              <div style={s.avatar} onClick={() => setUserMenuAberto(!userMenuAberto)}>
                {user.nome[0].toUpperCase()}
              </div>

              {userMenuAberto && (
                <div style={s.dropdown}>
                  <span style={s.dropdownNome}>{user.nome}</span>
                  {isAdmin && (
                    <Link to="/admin" style={{ ...s.dropdownItem, color: '#f4a261' }}
                      onClick={() => setUserMenuAberto(false)}>
                      ⚙ Painel Admin
                    </Link>
                  )}
                  <Link to="/perfil" style={s.dropdownItem}
                    onClick={() => setUserMenuAberto(false)}>
                    Meu Perfil
                  </Link>
                  <button style={s.dropdownLogout} onClick={handleLogout}>
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            !isMobile && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link to="/login"    style={s.btnSecundario}>Entrar</Link>
                <Link to="/registro" style={s.btnPrimario}>Cadastrar</Link>
              </div>
            )
          )}

          {/* Botão hamburguer — só no mobile */}
          {isMobile && (
            <button style={s.hamburger} onClick={() => setMenuAberto(!menuAberto)}>
              {menuAberto ? '✕' : '☰'}
            </button>
          )}
        </div>
      </nav>

      {/* Menu mobile — drawer que aparece por baixo da navbar */}
      {isMobile && menuAberto && (
        <div style={s.mobileMenu}>
          <Link to="/"         style={s.mobileLink} onClick={() => setMenuAberto(false)}>Início</Link>
          <Link to="/catalogo" style={s.mobileLink} onClick={() => setMenuAberto(false)}>Catálogo</Link>

          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin" style={{ ...s.mobileLink, color: '#f4a261' }}
                  onClick={() => setMenuAberto(false)}>
                  ⚙ Painel Admin
                </Link>
              )}
              <Link to="/perfil" style={s.mobileLink} onClick={() => setMenuAberto(false)}>
                Meu Perfil
              </Link>
              <button style={s.mobileBtnLogout} onClick={handleLogout}>Sair</button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
              <Link to="/login"    style={s.mobileBtnSecundario} onClick={() => setMenuAberto(false)}>Entrar</Link>
              <Link to="/registro" style={s.mobileBtnPrimario}   onClick={() => setMenuAberto(false)}>Cadastrar</Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}

const s = {
  nav: {
    position:       'fixed',
    top: 0, left: 0, right: 0,
    zIndex:         100,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '0 20px',
    height:         '64px',
    background:     'rgba(13,13,20,0.97)',
    backdropFilter: 'blur(12px)',
    borderBottom:   '1px solid #1e1e32',
  },
  logo: {
    fontFamily:    '"Bebas Neue", sans-serif',
    fontSize:      '1.8rem',
    letterSpacing: '2px',
    color:         '#f0f0f0',
  },
  logoSpan: { color: '#e63946' },
  links: {
    display:   'flex',
    gap:       '28px',
    listStyle: 'none',
  },
  link: {
    color:      '#888',
    fontWeight: 700,
    fontSize:   '0.9rem',
    display:    'block',
  },
  userArea: { display: 'flex', alignItems: 'center', gap: '12px' },
  userMenu: { position: 'relative' },
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
    position:      'absolute',
    top:           '48px',
    right:         0,
    background:    '#13131f',
    border:        '1px solid #1e1e32',
    borderRadius:  '10px',
    padding:       '8px',
    minWidth:      '160px',
    display:       'flex',
    flexDirection: 'column',
    gap:           '4px',
    zIndex:        200,
  },
  dropdownNome: {
    padding:      '8px 10px 4px',
    fontWeight:   900,
    fontSize:     '0.85rem',
    color:        '#f0f0f0',
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
    cursor:       'pointer',
    fontFamily:   'inherit',
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
    color:      '#888',
    fontWeight: 700,
    fontSize:   '0.88rem',
    padding:    '8px 12px',
  },

  // Hamburguer
  hamburger: {
    background:   'transparent',
    border:       '1px solid #1e1e32',
    color:        '#f0f0f0',
    width:        '38px',
    height:       '38px',
    borderRadius: '8px',
    fontSize:     '1.1rem',
    cursor:       'pointer',
    display:      'flex',
    alignItems:   'center',
    justifyContent: 'center',
    fontFamily:   'inherit',
  },

  // Menu mobile
  mobileMenu: {
    position:      'fixed',
    top:           '64px',
    left: 0, right: 0,
    zIndex:        99,
    background:    '#0d0d14',
    borderBottom:  '1px solid #1e1e32',
    padding:       '20px',
    display:       'flex',
    flexDirection: 'column',
    gap:           '4px',
  },
  mobileLink: {
    padding:      '14px 16px',
    borderRadius: '8px',
    fontWeight:   700,
    fontSize:     '1rem',
    color:        '#888',
    display:      'block',
    borderBottom: '1px solid #1e1e32',
  },
  mobileBtnLogout: {
    marginTop:    '8px',
    background:   'transparent',
    border:       'none',
    color:        '#e63946',
    fontWeight:   800,
    fontSize:     '1rem',
    padding:      '14px 16px',
    textAlign:    'left',
    cursor:       'pointer',
    fontFamily:   'inherit',
    width:        '100%',
  },
  mobileBtnPrimario: {
    background:   '#e63946',
    color:        '#fff',
    padding:      '14px',
    borderRadius: '8px',
    fontWeight:   800,
    fontSize:     '0.95rem',
    textAlign:    'center',
    display:      'block',
  },
  mobileBtnSecundario: {
    background:   'transparent',
    border:       '1px solid #1e1e32',
    color:        '#888',
    padding:      '14px',
    borderRadius: '8px',
    fontWeight:   700,
    fontSize:     '0.95rem',
    textAlign:    'center',
    display:      'block',
  },
};