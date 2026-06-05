import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import { useAuth }             from '../context/AuthContext';
import api                     from '../services/api';

const STATUS_LABEL = {
  assistindo: 'Assistindo',
  quero_ver:  'Quero ver',
  concluido:  'Concluído',
};

const STATUS_COR = {
  assistindo: '#4cc9f0',
  quero_ver:  '#888',
  concluido:  '#52b788',
};

export default function Perfil() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const [lista,      setLista]      = useState([]);
  const [abaAtiva,   setAbaAtiva]   = useState('todos');
  const [loading,    setLoading]    = useState(true);
  const [continuando, setContinuando] = useState([]);

  // Redireciona para login se não estiver logado
  useEffect(() => {
    if (!user) { navigate('/login'); return; }

    async function carregarLista() {
      try {
        const { data } = await api.get('/users/lista');
        setLista(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    carregarLista();
  }, [user]);

const prog = await api.get('/progresso/continuar');
setContinuando(prog.data);

  async function removerDaLista(itemId) {
    try {
      await api.delete(`/users/lista/${itemId}`);
      setLista(prev => prev.filter(i => i.id !== itemId));
    } catch (err) {
      console.error(err);
    }
  }

  async function mudarStatus(itemId, novoStatus) {
    try {
      await api.put(`/users/lista/${itemId}`, { status: novoStatus });
      setLista(prev => prev.map(i => i.id === itemId ? { ...i, status: novoStatus } : i));
    } catch (err) {
      console.error(err);
    }
  }

  // Filtra a lista conforme a aba ativa
  const listaFiltrada = abaAtiva === 'todos'
    ? lista
    : abaAtiva === 'favoritos'
    ? lista.filter(i => i.favoritado)
    : lista.filter(i => i.status === abaAtiva);

  if (!user) return null;

  return (
    <div style={s.page}>

      {/* ── HEADER DO PERFIL ── */}
      <div style={s.header}>
        <div style={s.avatarGrande}>
          {user.nome[0].toUpperCase()}
        </div>
        <div style={s.headerInfo}>
          <h1 style={s.nome}>{user.nome}</h1>
          <p style={s.email}>{user.email}</p>
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
        </div>
        <button style={s.btnLogout} onClick={() => { logout(); navigate('/'); }}>
          Sair
        </button>
      </div>

      {/* ── ABAS ── */}
      <div style={s.abas}>
        {['todos', 'assistindo', 'quero_ver', 'concluido', 'favoritos', 'continuando'].map(aba => (
          <button
            key={aba}
            style={{ ...s.aba, ...(abaAtiva === aba ? s.abaAtiva : {}) }}
            onClick={() => setAbaAtiva(aba)}
          >
            {aba === 'todos'      && `Todos (${lista.length})`}
            {aba === 'assistindo' && `Assistindo (${lista.filter(i => i.status === 'assistindo').length})`}
            {aba === 'quero_ver'  && `Quero ver (${lista.filter(i => i.status === 'quero_ver').length})`}
            {aba === 'concluido'  && `Concluídos (${lista.filter(i => i.status === 'concluido').length})`}
            {aba === 'favoritos'  && `★ Favoritos (${lista.filter(i => i.favoritado).length})`}
            {aba === 'continuando' && `▶ Continuando (${continuando.length})`}
          </button>
        ))}
      </div>

      {/* ── LISTA ── */}
      <div style={s.listaWrap}>
        {loading ? (
          <div style={s.vazio}>Carregando...</div>
        ) : listaFiltrada.length === 0 ? (
          <div style={s.vazio}>
            <p style={{ fontSize: '2rem', marginBottom: '12px' }}>🎌</p>
            <p>Nenhum anime aqui ainda.</p>
            <button style={s.btnCatalogo} onClick={() => navigate('/catalogo')}>
              Explorar catálogo
            </button>
          </div>
        ) : (
          <div style={s.grid}>
            {listaFiltrada.map(item => (
              <div key={item.id} style={s.card}>

                {/* Capa */}
                <div
                  style={s.cardThumb}
                  onClick={() => navigate(`/anime/${item.anime.id}`)}
                >
                  {item.anime.capa
                    ? <img src={item.anime.capa} alt={item.anime.titulo} style={s.cardImg} />
                    : <div style={s.cardPlaceholder}>🎌</div>
                  }
                  {item.favoritado && <span style={s.cardFav}>★</span>}
                </div>

                {/* Info */}
                <div style={s.cardInfo}>
                  <div style={s.cardTitulo}>{item.anime.titulo}</div>
                  <div style={s.cardAno}>{item.anime.ano}</div>

                  {/* Dropdown de status */}
                  <select
                    style={{ ...s.statusSelect, color: STATUS_COR[item.status] }}
                    value={item.status}
                    onChange={e => mudarStatus(item.id, e.target.value)}
                  >
                    <option value="quero_ver">Quero ver</option>
                    <option value="assistindo">Assistindo</option>
                    <option value="concluido">Concluído</option>
                  </select>

                  {/* Ações */}
                  <div style={s.cardAcoes}>
                    <button
                      style={s.btnAssistir}
                      onClick={() => navigate(`/anime/${item.anime.id}`)}
                    >
                      Ver
                    </button>
                    <button
                      style={s.btnRemover}
                      onClick={() => removerDaLista(item.id)}
                    >
                      ✕
                    </button>
                    {abaAtiva === 'continuando' && (
  <div style={s.grid}>
    {continuando.length === 0 ? (
      <div style={s.vazio}>
        <p style={{ fontSize: '2rem', marginBottom: '12px' }}>▶</p>
        <p>Nenhum episódio em andamento.</p>
      </div>
    ) : (
      continuando.map(prog => (
        <div
          key={prog.id}
          style={s.card}
          onClick={() => navigate(`/assistir/${prog.episodio.id}`)}
        >
          <div style={s.cardThumb}>
            {prog.anime.capa
              ? <img src={prog.anime.capa} alt={prog.anime.titulo} style={s.cardImg} />
              : <div style={s.cardPlaceholder}>🎌</div>
            }
            {/* Barra de progresso */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: '#1e1e32' }}>
              <div style={{ height: '100%', background: '#e63946', width: `${Math.min(((prog.segundos / ((prog.episodio.duracao ?? 24) * 60)) * 100), 100)}%` }} />
            </div>
          </div>
          <div style={s.cardInfo}>
            <div style={s.cardTitulo}>{prog.anime.titulo}</div>
            <div style={s.cardAno}>EP {prog.episodio.numero} — {prog.episodio.titulo}</div>
          </div>
        </div>
      ))
    )}
  </div>
)}
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

// ── ESTILOS ────────────────────────────────────────────
const s = {
  page:    { paddingTop: '64px', minHeight: '100vh' },

  // Header
  header: {
    display:      'flex',
    alignItems:   'center',
    gap:          '28px',
    padding:      '48px 40px',
    borderBottom: '1px solid #1e1e32',
    flexWrap:     'wrap',
  },
  avatarGrande: {
    width:          '80px',
    height:         '80px',
    borderRadius:   '50%',
    background:     '#e63946',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       '2rem',
    fontWeight:     900,
    flexShrink:     0,
  },
  headerInfo: { flex: 1 },
  nome: {
    fontFamily:    '"Bebas Neue", sans-serif',
    fontSize:      '2rem',
    letterSpacing: '2px',
    marginBottom:  '4px',
  },
  email: { color: '#888', fontSize: '0.88rem', marginBottom: '16px' },
  stats: { display: 'flex', alignItems: 'center', gap: '20px' },
  stat:  { display: 'flex', flexDirection: 'column', gap: '2px' },
  statNum: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize:   '1.5rem',
    color:      '#f0f0f0',
    lineHeight: 1,
  },
  statLabel: { fontSize: '0.72rem', color: '#888', fontWeight: 700 },
  statDiv:   { width: '1px', height: '32px', background: '#1e1e32' },

  btnLogout: {
    background:   'transparent',
    border:       '1px solid #1e1e32',
    color:        '#888',
    padding:      '10px 20px',
    borderRadius: '8px',
    fontFamily:   'inherit',
    fontWeight:   700,
    fontSize:     '0.85rem',
    cursor:       'pointer',
    marginLeft:   'auto',
  },

  // Abas
  abas: {
    display:      'flex',
    gap:          '4px',
    padding:      '0 40px',
    borderBottom: '1px solid #1e1e32',
    overflowX:    'auto',
    scrollbarWidth: 'none',
  },
  aba: {
    background:   'transparent',
    border:       'none',
    borderBottom: '2px solid transparent',
    color:        '#888',
    padding:      '16px 16px',
    fontFamily:   'inherit',
    fontWeight:   700,
    fontSize:     '0.85rem',
    cursor:       'pointer',
    whiteSpace:   'nowrap',
    marginBottom: '-1px',
  },
  abaAtiva: { color: '#f0f0f0', borderColor: '#e63946' },

  // Lista
  listaWrap: { padding: '32px 40px 48px' },
  vazio: {
    textAlign:    'center',
    padding:      '60px 20px',
    color:        '#f0f0f0',
    background:   '#13131f',
    borderRadius: '12px',
    border:       '1px solid #1e1e32',
  },
  btnCatalogo: {
    marginTop:    '16px',
    background:   '#e63946',
    color:        '#fff',
    border:       'none',
    padding:      '10px 24px',
    borderRadius: '8px',
    fontFamily:   'inherit',
    fontWeight:   800,
    fontSize:     '0.88rem',
    cursor:       'pointer',
  },

  // Grid
  grid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap:                 '20px',
  },

  // Card
  card: {
    background:   '#13131f',
    borderRadius: '10px',
    overflow:     'hidden',
    border:       '1px solid #1e1e32',
  },
  cardThumb: {
    position:    'relative',
    aspectRatio: '3/4',
    overflow:    'hidden',
    cursor:      'pointer',
  },
  cardImg:         { width: '100%', height: '100%', objectFit: 'cover' },
  cardPlaceholder: {
    width: '100%', height: '100%',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       '3rem',
    background:     'linear-gradient(135deg, #1a1a2e, #0d0d14)',
  },
  cardFav: {
    position:     'absolute',
    top:          '8px',
    left:         '8px',
    background:   '#f4a261',
    color:        '#fff',
    fontSize:     '0.75rem',
    fontWeight:   900,
    padding:      '3px 7px',
    borderRadius: '4px',
  },
  cardInfo:   { padding: '12px' },
  cardTitulo: {
    fontWeight:   800,
    fontSize:     '0.85rem',
    marginBottom: '2px',
    whiteSpace:   'nowrap',
    overflow:     'hidden',
    textOverflow: 'ellipsis',
  },
  cardAno: { fontSize: '0.72rem', color: '#555', marginBottom: '10px' },

  statusSelect: {
    width:        '100%',
    background:   '#0d0d14',
    border:       '1px solid #1e1e32',
    borderRadius: '6px',
    padding:      '6px 10px',
    fontFamily:   'inherit',
    fontWeight:   700,
    fontSize:     '0.78rem',
    marginBottom: '10px',
    cursor:       'pointer',
    outline:      'none',
  },

  cardAcoes: { display: 'flex', gap: '8px' },
  btnAssistir: {
    flex:         1,
    background:   '#e63946',
    color:        '#fff',
    border:       'none',
    padding:      '7px',
    borderRadius: '6px',
    fontFamily:   'inherit',
    fontWeight:   800,
    fontSize:     '0.8rem',
    cursor:       'pointer',
  },
  btnRemover: {
    background:   'transparent',
    border:       '1px solid #1e1e32',
    color:        '#888',
    padding:      '7px 10px',
    borderRadius: '6px',
    fontFamily:   'inherit',
    fontWeight:   700,
    fontSize:     '0.8rem',
    cursor:       'pointer',
  },
};