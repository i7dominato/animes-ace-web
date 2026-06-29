import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate }           from 'react-router-dom';
import { useAuth }                     from '../context/AuthContext';
import { useWindowSize }               from '../hooks/useWindowSize';
import api                             from '../services/api';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate                  = useNavigate();
  const { isMobile }              = useWindowSize();

  const [menuAberto,      setMenuAberto]      = useState(false);
  const [userMenuAberto,  setUserMenuAberto]  = useState(false);

  // ── Busca ──
  const [buscaAberta,   setBuscaAberta]   = useState(false);
  const [buscaTexto,    setBuscaTexto]    = useState('');
  const [resultados,    setResultados]    = useState([]);
  const [buscando,      setBuscando]      = useState(false);
  const buscaInputRef = useRef(null);
  const buscaWrapRef  = useRef(null);
  const debounceRef   = useRef(null);

  // Abre o input e foca automaticamente
  function abrirBusca() {
    setBuscaAberta(true);
    setTimeout(() => buscaInputRef.current?.focus(), 50);
  }

  function fecharBusca() {
    setBuscaAberta(false);
    setBuscaTexto('');
    setResultados([]);
  }

  // Busca com debounce — espera 350ms após parar de digitar
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!buscaTexto.trim()) {
      setResultados([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const { data } = await api.get(`/animes?busca=${encodeURIComponent(buscaTexto)}&pagina=1`);
        setResultados(data.animes.slice(0, 6));
      } catch (err) {
        console.error(err);
      } finally {
        setBuscando(false);
      }
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [buscaTexto]);

  // Fecha a busca ao clicar fora dela
  useEffect(() => {
    function handleClickFora(e) {
      if (buscaWrapRef.current && !buscaWrapRef.current.contains(e.target)) {
        fecharBusca();
      }
    }
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  function irParaAnime(id) {
    fecharBusca();
    navigate(`/anime/${id}`);
  }

  function handleSubmitBusca(e) {
    e.preventDefault();
    if (!buscaTexto.trim()) return;
    fecharBusca();
    navigate(`/catalogo?busca=${encodeURIComponent(buscaTexto)}`);
  }

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

        {/* Links — desktop */}
        {!isMobile && (
          <ul style={s.links}>
            <li><Link to="/"         style={s.link}>Início</Link></li>
            <li><Link to="/catalogo" style={s.link}>Catálogo</Link></li>
          </ul>
        )}

        {/* Área direita */}
        <div style={s.userArea}>

          {/* ── BUSCA ── */}
          <div ref={buscaWrapRef} style={s.buscaWrap}>
            {buscaAberta ? (
              <form onSubmit={handleSubmitBusca} style={{
                ...s.buscaForm,
                width: isMobile ? '160px' : '280px',
              }}>
                <span style={s.buscaIconInline}>🔍</span>
                <input
                  ref={buscaInputRef}
                  style={s.buscaInput}
                  type="text"
                  placeholder="Buscar anime..."
                  value={buscaTexto}
                  onChange={e => setBuscaTexto(e.target.value)}
                  onKeyDown={e => e.key === 'Escape' && fecharBusca()}
                />
                <button type="button" style={s.buscaFechar} onClick={fecharBusca}>✕</button>

                {/* ── DROPDOWN DE RESULTADOS ── */}
                {buscaTexto.trim() && (
                  <div style={s.dropdown}>
                    {buscando ? (
                      <div style={s.dropdownVazio}>Buscando...</div>
                    ) : resultados.length === 0 ? (
                      <div style={s.dropdownVazio}>Nenhum resultado para "{buscaTexto}"</div>
                    ) : (
                      <>
                        {resultados.map(anime => (
                          <div
                            key={anime.id}
                            style={s.dropdownItem}
                            onMouseDown={() => irParaAnime(anime.id)}
                          >
                            <div style={s.dropdownCapa}>
                              {anime.capa
                                ? <img src={anime.capa} alt={anime.titulo} style={s.dropdownCapaImg} />
                                : <div style={s.dropdownCapaPlaceholder}>🎬</div>
                              }
                            </div>
                            <div style={s.dropdownInfo}>
                              <div style={s.dropdownTitulo}>{anime.titulo}</div>
                              <div style={s.dropdownMeta}>
                                {anime.ano} · ★ {anime.nota.toFixed(1)} · {anime.generos[0] ?? ''}
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          style={s.dropdownVerTodos}
                          onMouseDown={() => { fecharBusca(); navigate(`/catalogo?busca=${encodeURIComponent(buscaTexto)}`); }}
                        >
                          Ver todos os resultados →
                        </button>
                      </>
                    )}
                  </div>
                )}
              </form>
            ) : (
              <button style={s.buscaIconBtn} onClick={abrirBusca}>🔍</button>
            )}
          </div>

          {/* ── USUÁRIO ── */}
          {user ? (
            <div style={s.userMenu}>
              <div style={s.avatar} onClick={() => setUserMenuAberto(!userMenuAberto)}>
                {user.nome[0].toUpperCase()}
              </div>

              {userMenuAberto && (
                <div style={s.dropdownUser}>
                  <span style={s.dropdownNome}>{user.nome}</span>
                  {isAdmin && (
                    <Link to="/admin" style={{ ...s.dropdownItemLink, color: '#f4a261' }}
                      onClick={() => setUserMenuAberto(false)}>
                      ⚙ Painel Admin
                    </Link>
                  )}
                  <Link to="/perfil" style={s.dropdownItemLink}
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

          {/* Hamburguer mobile */}
          {isMobile && (
            <button style={s.hamburger} onClick={() => setMenuAberto(!menuAberto)}>
              {menuAberto ? '✕' : '☰'}
            </button>
          )}
        </div>
      </nav>

      {/* Menu mobile */}
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
  logo: { fontFamily: '"Bebas Neue", sans-serif', fontSize: '1.8rem', letterSpacing: '2px', color: '#f0f0f0' },
  logoSpan: { color: '#e63946' },
  links: { display: 'flex', gap: '28px', listStyle: 'none' },
  link:  { color: '#888', fontWeight: 700, fontSize: '0.9rem', display: 'block' },

  userArea: { display: 'flex', alignItems: 'center', gap: '10px' },

  // ── Busca ──
  buscaWrap: { position: 'relative' },
  buscaIconBtn: {
    background: 'transparent', border: 'none', color: '#888',
    fontSize: '1.05rem', cursor: 'pointer', padding: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  buscaForm: {
    display:      'flex',
    alignItems:   'center',
    gap:          '6px',
    background:   '#13131f',
    border:       '1px solid #e63946',
    borderRadius: '8px',
    padding:      '6px 10px',
    position:     'relative',
  },
  buscaIconInline: { fontSize: '0.85rem', flexShrink: 0 },
  buscaInput: {
    flex: 1, background: 'transparent', border: 'none', color: '#f0f0f0',
    fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', minWidth: 0,
  },
  buscaFechar: { background: 'transparent', border: 'none', color: '#888', fontSize: '0.85rem', cursor: 'pointer', flexShrink: 0 },

  // Dropdown
  dropdown: {
    position:     'absolute',
    top:          '46px',
    right:        0,
    width:        '320px',
    maxWidth:     '90vw',
    background:   '#13131f',
    border:       '1px solid #1e1e32',
    borderRadius: '10px',
    boxShadow:    '0 12px 32px rgba(0,0,0,0.5)',
    overflow:     'hidden',
    zIndex:       200,
  },
  dropdownVazio: { padding: '16px', color: '#888', fontSize: '0.82rem', textAlign: 'center' },
  dropdownItem: {
    display:      'flex',
    gap:          '10px',
    padding:      '10px 12px',
    cursor:       'pointer',
    borderBottom: '1px solid #1e1e32',
    transition:   'background 0.15s',
  },
  dropdownCapa: { width: '40px', height: '56px', borderRadius: '5px', overflow: 'hidden', flexShrink: 0, background: '#0d0d14' },
  dropdownCapaImg: { width: '100%', height: '100%', objectFit: 'cover' },
  dropdownCapaPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' },
  dropdownInfo: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  dropdownTitulo: { fontWeight: 800, fontSize: '0.82rem', color: '#eee', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  dropdownMeta:   { fontSize: '0.7rem', color: '#888', marginTop: '2px' },
  dropdownVerTodos: {
    width: '100%', background: 'rgba(230,57,70,0.08)', border: 'none', color: '#e63946',
    padding: '10px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
  },

  // Usuário
  userMenu: { position: 'relative' },
  avatar: {
    width: '38px', height: '38px', borderRadius: '50%', background: '#e63946',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 900, fontSize: '1rem', cursor: 'pointer', userSelect: 'none', color: '#fff',
  },
  dropdownUser: {
    position: 'absolute', top: '48px', right: 0, background: '#13131f', border: '1px solid #1e1e32',
    borderRadius: '10px', padding: '8px', minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 200,
  },
  dropdownNome: { padding: '8px 10px 4px', fontWeight: 900, fontSize: '0.85rem', color: '#f0f0f0', borderBottom: '1px solid #1e1e32', marginBottom: '4px' },
  dropdownItemLink: { padding: '8px 10px', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', color: '#888', display: 'block' },
  dropdownLogout: {
    padding: '8px 10px', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', color: '#e63946',
    background: 'transparent', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer', fontFamily: 'inherit',
  },

  btnPrimario:   { background: '#e63946', color: '#fff', padding: '8px 20px', borderRadius: '6px', fontWeight: 800, fontSize: '0.88rem' },
  btnSecundario: { color: '#888', fontWeight: 700, fontSize: '0.88rem', padding: '8px 12px' },

  hamburger: {
    background: 'transparent', border: '1px solid #1e1e32', color: '#f0f0f0',
    width: '38px', height: '38px', borderRadius: '8px', fontSize: '1.1rem',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
  },

  mobileMenu: {
    position: 'fixed', top: '64px', left: 0, right: 0, zIndex: 99,
    background: '#0d0d14', borderBottom: '1px solid #1e1e32', padding: '20px',
    display: 'flex', flexDirection: 'column', gap: '4px',
  },
  mobileLink: { padding: '14px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', color: '#888', display: 'block', borderBottom: '1px solid #1e1e32' },
  mobileBtnLogout: {
    marginTop: '8px', background: 'transparent', border: 'none', color: '#e63946',
    fontWeight: 800, fontSize: '1rem', padding: '14px 16px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', width: '100%',
  },
  mobileBtnPrimario:   { background: '#e63946', color: '#fff', padding: '14px', borderRadius: '8px', fontWeight: 800, fontSize: '0.95rem', textAlign: 'center', display: 'block' },
  mobileBtnSecundario: { background: 'transparent', border: '1px solid #1e1e32', color: '#888', padding: '14px', borderRadius: '8px', fontWeight: 700, fontSize: '0.95rem', textAlign: 'center', display: 'block' },
};