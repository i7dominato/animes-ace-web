import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import { useAuth }             from '../context/AuthContext';
import { useWindowSize }       from '../hooks/useWindowSize';
import api                     from '../services/api';

const STATUS_LABEL = { assistindo: 'Assistindo', quero_ver: 'Quero ver', concluido: 'Concluído' };
const STATUS_COR   = { assistindo: '#4cc9f0', quero_ver: '#888', concluido: '#52b788' };

export default function Perfil() {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const { isMobile }      = useWindowSize();

  const [lista,       setLista]       = useState([]);
  const [continuando, setContinuando] = useState([]);
  const [abaAtiva,    setAbaAtiva]    = useState('todos');
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    async function carregar() {
      try {
        const [listaRes, progRes] = await Promise.all([
          api.get('/users/lista'),
          api.get('/progresso/continuar'),
        ]);
        setLista(listaRes.data);
        setContinuando(progRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [user]);

  async function removerDaLista(itemId) {
    try {
      await api.delete(`/users/lista/${itemId}`);
      setLista(prev => prev.filter(i => i.id !== itemId));
    } catch (err) { console.error(err); }
  }

  async function mudarStatus(itemId, novoStatus) {
    try {
      await api.put(`/users/lista/${itemId}`, { status: novoStatus });
      setLista(prev => prev.map(i => i.id === itemId ? { ...i, status: novoStatus } : i));
    } catch (err) { console.error(err); }
  }

  const listaFiltrada = abaAtiva === 'todos'
    ? lista
    : abaAtiva === 'favoritos'
    ? lista.filter(i => i.favoritado)
    : abaAtiva === 'continuando'
    ? null // tratado separadamente abaixo
    : lista.filter(i => i.status === abaAtiva);

  if (!user) return null;

  return (
    <div style={s.page}>

      {/* ── HEADER ── */}
      <div style={{ ...s.header, padding: isMobile ? '28px 20px' : '40px 56px', flexDirection: isMobile ? 'column' : 'row' }}>
        <div style={s.headerLeft}>
          <div style={s.avatarGrande}>{user.nome[0].toUpperCase()}</div>
          <div>
            <h1 style={s.nome}>{user.nome}</h1>
            <p style={s.email}>{user.email}</p>
          </div>
        </div>

        <div style={s.stats}>
          <div style={s.stat}>
            <span style={s.statNum}>{lista.length}</span>
            <span style={s.statLabel}>Na lista</span>
          </div>
          <div style={s.statDiv} />
          <div style={s.stat}>
            <span style={s.statNum}>{lista.filter(i => i.status === 'concluido').length}</span>
            <span style={s.statLabel}>Concluídos</span>
          </div>
          <div style={s.statDiv} />
          <div style={s.stat}>
            <span style={s.statNum}>{lista.filter(i => i.favoritado).length}</span>
            <span style={s.statLabel}>Favoritos</span>
          </div>
        </div>

        <button style={s.btnLogout} onClick={() => { logout(); navigate('/'); }}>Sair</button>
      </div>

      {/* ── ABAS ── */}
      <div style={{ ...s.abas, padding: isMobile ? '0 20px' : '0 56px' }}>
        {[
          { id: 'continuando', label: `▶ Continuando (${continuando.length})` },
          { id: 'todos',       label: `Todos (${lista.length})` },
          { id: 'assistindo',  label: `Assistindo (${lista.filter(i => i.status === 'assistindo').length})` },
          { id: 'quero_ver',   label: `Quero ver (${lista.filter(i => i.status === 'quero_ver').length})` },
          { id: 'concluido',   label: `Concluídos (${lista.filter(i => i.status === 'concluido').length})` },
          { id: 'favoritos',   label: `★ Favoritos (${lista.filter(i => i.favoritado).length})` },
        ].map(aba => (
          <button
            key={aba.id}
            style={{ ...s.aba, ...(abaAtiva === aba.id ? s.abaAtiva : {}) }}
            onClick={() => setAbaAtiva(aba.id)}
          >
            {aba.label}
          </button>
        ))}
      </div>

      {/* ── CONTEÚDO ── */}
      <div style={{ ...s.conteudo, padding: isMobile ? '24px 20px 48px' : '28px 56px 56px' }}>

        {loading ? (
          <div style={s.vazio}>Carregando...</div>
        ) : abaAtiva === 'continuando' ? (
          continuando.length === 0 ? (
            <EstadoVazio
              icone="▶"
              texto="Nenhum episódio em andamento."
              navigate={navigate}
            />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: isMobile ? '12px' : '16px',
            }}>
              {continuando.map(prog => {
                const duracaoTotal = (prog.episodio.duracao ?? 24) * 60;
                const porcentagem  = Math.min((prog.segundos / duracaoTotal) * 100, 100);
                return (
                  <div key={prog.id} style={s.continuandoCard} onClick={() => navigate(`/assistir/${prog.episodio.id}`)}>
                    <div style={s.continuandoThumb}>
                      {prog.anime.capa
                        ? <img src={prog.anime.capa} alt={prog.anime.titulo} style={s.continuandoImg} />
                        : <div style={s.cardPlaceholder}>🎬</div>
                      }
                      <div style={s.continuandoOverlay}><div style={s.playCircle}>▶</div></div>
                      <div style={s.continuandoBarWrap}><div style={{ ...s.continuandoBar, width: `${porcentagem}%` }} /></div>
                    </div>
                    <div style={s.continuandoInfo}>
                      <div style={s.continuandoAnime}>{prog.anime.titulo}</div>
                      <div style={s.continuandoEp}>EP {prog.episodio.numero} · {prog.episodio.titulo}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : listaFiltrada.length === 0 ? (
          <EstadoVazio icone="🎬" texto="Nenhum anime aqui ainda." navigate={navigate} mostrarBotao />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: isMobile ? '10px' : '18px',
          }}>
            {listaFiltrada.map(item => (
              <div key={item.id} style={s.animeCard}>
                <div style={s.animeCardThumb} onClick={() => navigate(`/anime/${item.anime.id}`)}>
                  {item.anime.capa
                    ? <img src={item.anime.capa} alt={item.anime.titulo} style={s.animeCardImg} />
                    : <div style={s.cardPlaceholder}>🎬</div>
                  }
                  {item.favoritado && <span style={s.animeCardFav}>★</span>}
                  <div style={s.animeCardBottomGradient}>
                    <span style={s.animeCardAno}>{item.anime.ano}</span>
                  </div>
                </div>
                <div style={s.animeCardInfo}>
                  <div style={s.animeCardTitulo}>{item.anime.titulo}</div>

                  <select
                    style={{ ...s.statusSelect, color: STATUS_COR[item.status] }}
                    value={item.status}
                    onChange={e => mudarStatus(item.id, e.target.value)}
                  >
                    <option value="quero_ver">Quero ver</option>
                    <option value="assistindo">Assistindo</option>
                    <option value="concluido">Concluído</option>
                  </select>

                  <div style={s.animeCardAcoes}>
                    <button style={s.btnVer} onClick={() => navigate(`/anime/${item.anime.id}`)}>Ver</button>
                    <button style={s.btnRemover} onClick={() => removerDaLista(item.id)}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EstadoVazio({ icone, texto, navigate, mostrarBotao }) {
  return (
    <div style={s.vazio}>
      <p style={{ fontSize: '2rem', marginBottom: '10px' }}>{icone}</p>
      <p>{texto}</p>
      {mostrarBotao && (
        <button style={s.btnExplorar} onClick={() => navigate('/catalogo')}>Explorar catálogo</button>
      )}
    </div>
  );
}

const s = {
  page: { paddingTop: '64px', minHeight: '100vh', background: '#0a0a0f' },

  header: { display: 'flex', alignItems: 'center', gap: '24px', borderBottom: '1px solid #1e1e32', flexWrap: 'wrap' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '18px' },
  avatarGrande: {
    width: '72px', height: '72px', borderRadius: '50%', background: '#e63946',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.7rem',
    fontWeight: 900, flexShrink: 0, color: '#fff',
  },
  nome:  { fontFamily: '"Bebas Neue", sans-serif', fontSize: '1.7rem', letterSpacing: '1.5px', color: '#fff', marginBottom: '3px' },
  email: { color: '#888', fontSize: '0.85rem' },

  stats: { display: 'flex', alignItems: 'center', gap: '18px', marginLeft: 'auto' },
  stat:  { display: 'flex', flexDirection: 'column', gap: '2px' },
  statNum: { fontFamily: '"Bebas Neue", sans-serif', fontSize: '1.4rem', color: '#fff', lineHeight: 1 },
  statLabel: { fontSize: '0.7rem', color: '#888', fontWeight: 700 },
  statDiv: { width: '1px', height: '30px', background: '#1e1e32' },

  btnLogout: {
    background: 'transparent', border: '1px solid #1e1e32', color: '#888', padding: '9px 18px',
    borderRadius: '8px', fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
  },

  abas: { display: 'flex', gap: '4px', borderBottom: '1px solid #1e1e32', overflowX: 'auto' },
  aba: {
    background: 'transparent', border: 'none', borderBottom: '2px solid transparent', color: '#888',
    padding: '14px 14px', fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: '0.82rem',
    cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: '-1px',
  },
  abaAtiva: { color: '#fff', borderColor: '#e63946' },

  conteudo: {},
  vazio: {
    textAlign: 'center', padding: '50px 20px', color: '#888',
    background: '#13131f', borderRadius: '12px', border: '1px solid #1e1e32',
  },
  btnExplorar: {
    marginTop: '14px', background: '#e63946', color: '#fff', border: 'none', padding: '10px 22px',
    borderRadius: '8px', fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
  },

  // Continuar assistindo
  continuandoCard: { background: '#13131f', borderRadius: '10px', overflow: 'hidden', border: '1px solid #1e1e32', cursor: 'pointer' },
  continuandoThumb: { position: 'relative', aspectRatio: '16/9', overflow: 'hidden' },
  continuandoImg: { width: '100%', height: '100%', objectFit: 'cover' },
  continuandoOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  playCircle: { width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(230,57,70,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: '#fff' },
  continuandoBarWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'rgba(255,255,255,0.2)' },
  continuandoBar: { height: '100%', background: '#e63946' },
  continuandoInfo: { padding: '10px 12px' },
  continuandoAnime: { fontWeight: 800, fontSize: '0.82rem', color: '#fff', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  continuandoEp: { fontSize: '0.72rem', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },

  cardPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', background: 'linear-gradient(135deg, #1a1a2e, #0d0d14)' },

  // Card de anime na lista
  animeCard: { background: '#13131f', borderRadius: '10px', overflow: 'hidden', border: '1px solid #1e1e32' },
  animeCardThumb: { position: 'relative', aspectRatio: '2/3', overflow: 'hidden', cursor: 'pointer', background: '#0d0d14' },
  animeCardImg: { width: '100%', height: '100%', objectFit: 'cover' },
  animeCardFav: { position: 'absolute', top: '6px', left: '6px', background: '#f4a261', color: '#0a0a0f', fontSize: '0.7rem', fontWeight: 900, padding: '2px 6px', borderRadius: '4px', zIndex: 2 },
  animeCardBottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 8px 4px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' },
  animeCardAno: { color: '#aaa', fontSize: '0.68rem', fontWeight: 700 },
  animeCardInfo: { padding: '8px' },
  animeCardTitulo: { fontWeight: 800, fontSize: '0.78rem', color: '#eee', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },

  statusSelect: {
    width: '100%', background: '#0a0a10', border: '1px solid #1e1e32', borderRadius: '6px',
    padding: '5px 8px', fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: '0.72rem',
    marginBottom: '8px', cursor: 'pointer', outline: 'none',
  },

  animeCardAcoes: { display: 'flex', gap: '6px' },
  btnVer: {
    flex: 1, background: '#e63946', color: '#fff', border: 'none', padding: '6px',
    borderRadius: '6px', fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer',
  },
  btnRemover: {
    background: 'transparent', border: '1px solid #1e1e32', color: '#888', padding: '6px 9px',
    borderRadius: '6px', fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer',
  },
};