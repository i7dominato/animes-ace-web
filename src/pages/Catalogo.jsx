import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import api                     from '../services/api';

const GENEROS = ['Todos', 'Ação', 'Aventura', 'Romance', 'Comédia', 'Terror', 'Fantasia', 'Esportes', 'Sci-Fi', 'Mistério'];

export default function Catalogo() {
  const [animes,       setAnimes]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [busca,        setBusca]        = useState('');
  const [generoAtivo,  setGeneroAtivo]  = useState('Todos');
  const [pagina,       setPagina]       = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const navigate = useNavigate();

  // Busca os animes sempre que mudar busca, gênero ou página
  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ pagina });
        if (busca)                        params.append('busca',  busca);
        if (generoAtivo !== 'Todos')      params.append('genero', generoAtivo);

        const { data } = await api.get(`/animes?${params}`);
        setAnimes(data.animes);
        setTotalPaginas(data.paginas);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [busca, generoAtivo, pagina]);

  // Ao trocar filtro, volta para a página 1
  function trocarGenero(genero) {
    setGeneroAtivo(genero);
    setPagina(1);
  }

  function handleBusca(e) {
    setBusca(e.target.value);
    setPagina(1);
  }

  return (
    <div style={s.page}>

      {/* ── CABEÇALHO ── */}
      <div style={s.header}>
        <h1 style={s.titulo}>Catálogo</h1>
        <p style={s.subtitulo}>Explore todos os animes disponíveis</p>
      </div>

      {/* ── BARRA DE BUSCA ── */}
      <div style={s.buscaWrap}>
        <span style={s.buscaIcon}>🔍</span>
        <input
          style={s.buscaInput}
          type="text"
          placeholder="Buscar anime..."
          value={busca}
          onChange={handleBusca}
        />
        {busca && (
          <button style={s.buscaLimpar} onClick={() => setBusca('')}>✕</button>
        )}
      </div>

      {/* ── FILTRO DE GÊNEROS ── */}
      <div style={s.generoBar}>
        {GENEROS.map(g => (
          <button
            key={g}
            style={{ ...s.generoPill, ...(generoAtivo === g ? s.generoPillAtivo : {}) }}
            onClick={() => trocarGenero(g)}
          >
            {g}
          </button>
        ))}
      </div>

      {/* ── RESULTADO ── */}
      <div style={s.resultadoWrap}>
        <span style={s.resultadoTexto}>
          {loading ? 'Buscando...' : `${animes.length} anime${animes.length !== 1 ? 's' : ''} encontrado${animes.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* ── GRID ── */}
      {loading ? (
        <div style={s.loading}>Carregando...</div>
      ) : animes.length === 0 ? (
        <div style={s.vazio}>
          <p style={{ fontSize: '2rem' }}>🎌</p>
          <p style={{ marginTop: '12px' }}>Nenhum anime encontrado.</p>
          <button style={s.limparFiltros} onClick={() => { setBusca(''); setGeneroAtivo('Todos'); }}>
            Limpar filtros
          </button>
        </div>
      ) : (
        <div style={s.grid}>
          {animes.map(anime => (
            <AnimeCard key={anime.id} anime={anime} onClick={() => navigate(`/anime/${anime.id}`)} />
          ))}
        </div>
      )}

      {/* ── PAGINAÇÃO ── */}
      {totalPaginas > 1 && (
        <div style={s.paginacao}>
          <button
            style={{ ...s.pagBtn, ...(pagina === 1 ? s.pagBtnDisabled : {}) }}
            onClick={() => setPagina(p => p - 1)}
            disabled={pagina === 1}
          >
            ← Anterior
          </button>

          <span style={s.pagInfo}>{pagina} / {totalPaginas}</span>

          <button
            style={{ ...s.pagBtn, ...(pagina === totalPaginas ? s.pagBtnDisabled : {}) }}
            onClick={() => setPagina(p => p + 1)}
            disabled={pagina === totalPaginas}
          >
            Próxima →
          </button>
        </div>
      )}

    </div>
  );
}

// ── CARD DE ANIME ──────────────────────────────────────
function AnimeCard({ anime, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      style={{ ...s.card, ...(hover ? s.cardHover : {}) }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={s.cardThumb}>
        {anime.capa ? (
          <img src={anime.capa} alt={anime.titulo} style={s.cardImg} />
        ) : (
          <div style={s.cardPlaceholder}>🎌</div>
        )}
        {hover && (
          <div style={s.cardOverlay}>
            <div style={s.playIcon}>▶</div>
          </div>
        )}
        <span style={s.cardEp}>{anime._count?.episodios ?? 0} EPS</span>
        {anime.status === 'em_exibicao' && (
          <span style={s.cardBadge}>Em exibição</span>
        )}
      </div>
      <div style={s.cardInfo}>
        <div style={s.cardTitulo}>{anime.titulo}</div>
        <div style={s.cardSub}>
          <span>{anime.generos[0] ?? 'Anime'}</span>
          <span style={s.cardNota}>★ {anime.nota.toFixed(1)}</span>
        </div>
        <div style={s.cardAno}>{anime.ano}</div>
      </div>
    </div>
  );
}

// ── ESTILOS ────────────────────────────────────────────
const s = {
  page:    { paddingTop: '64px', minHeight: '100vh' },
  loading: { textAlign: 'center', padding: '80px', color: '#888' },

  header: {
    padding:      '48px 40px 24px',
    borderBottom: '1px solid #1e1e32',
  },
  titulo: {
    fontFamily:    '"Bebas Neue", sans-serif',
    fontSize:      '2.5rem',
    letterSpacing: '3px',
    marginBottom:  '6px',
  },
  subtitulo: { color: '#888', fontSize: '0.9rem' },

  // Busca
  buscaWrap: {
    position:     'relative',
    margin:       '28px 40px 0',
  },
  buscaIcon: {
    position:  'absolute',
    left:      '16px',
    top:       '50%',
    transform: 'translateY(-50%)',
    fontSize:  '1rem',
  },
  buscaInput: {
    width:        '100%',
    padding:      '14px 48px',
    background:   '#13131f',
    border:       '1px solid #1e1e32',
    borderRadius: '10px',
    color:        '#f0f0f0',
    fontSize:     '0.95rem',
    fontFamily:   'inherit',
    outline:      'none',
  },
  buscaLimpar: {
    position:   'absolute',
    right:      '16px',
    top:        '50%',
    transform:  'translateY(-50%)',
    background: 'transparent',
    border:     'none',
    color:      '#888',
    fontSize:   '1rem',
  },

  // Gêneros
  generoBar: {
    display:    'flex',
    gap:        '10px',
    padding:    '20px 40px',
    overflowX:  'auto',
    scrollbarWidth: 'none',
  },
  generoPill: {
    flexShrink:   0,
    padding:      '8px 20px',
    borderRadius: '999px',
    border:       '1px solid #1e1e32',
    background:   '#13131f',
    color:        '#888',
    fontSize:     '0.82rem',
    fontWeight:   700,
    fontFamily:   'inherit',
    whiteSpace:   'nowrap',
    transition:   'all 0.2s',
  },
  generoPillAtivo: {
    background:  '#e63946',
    borderColor: '#e63946',
    color:       '#fff',
  },

  // Resultado
  resultadoWrap: { padding: '0 40px 16px' },
  resultadoTexto: { fontSize: '0.82rem', color: '#888' },

  // Vazio
  vazio: {
    textAlign:    'center',
    padding:      '60px 20px',
    color:        '#f0f0f0',
    margin:       '0 40px',
    background:   '#13131f',
    borderRadius: '12px',
    border:       '1px solid #1e1e32',
  },
  limparFiltros: {
    marginTop:    '16px',
    background:   'transparent',
    border:       '1px solid #e63946',
    color:        '#e63946',
    padding:      '8px 20px',
    borderRadius: '6px',
    fontFamily:   'inherit',
    fontWeight:   700,
    fontSize:     '0.85rem',
  },

  // Grid
  grid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
    gap:                 '20px',
    padding:             '0 40px 48px',
  },

  // Card
  card: {
    background:   '#13131f',
    borderRadius: '10px',
    overflow:     'hidden',
    border:       '1px solid #1e1e32',
    cursor:       'pointer',
    transition:   'transform 0.25s, border-color 0.25s, box-shadow 0.25s',
  },
  cardHover: {
    transform:   'translateY(-6px) scale(1.02)',
    borderColor: '#e63946',
    boxShadow:   '0 12px 40px rgba(230,57,70,0.2)',
  },
  cardThumb: {
    position:    'relative',
    aspectRatio: '3/4',
    overflow:    'hidden',
  },
  cardImg: { width: '100%', height: '100%', objectFit: 'cover' },
  cardPlaceholder: {
    width: '100%', height: '100%',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       '3rem',
    background:     'linear-gradient(135deg, #1a1a2e, #0d0d14)',
  },
  cardOverlay: {
    position:       'absolute',
    inset:          0,
    background:     'rgba(0,0,0,0.5)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
  },
  playIcon: {
    width:          '48px',
    height:         '48px',
    background:     '#e63946',
    borderRadius:   '50%',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       '1.1rem',
    color:          '#fff',
  },
  cardEp: {
    position:     'absolute',
    top:          '8px',
    right:        '8px',
    background:   'rgba(0,0,0,0.75)',
    color:        '#f4a261',
    fontSize:     '0.65rem',
    fontWeight:   800,
    padding:      '3px 7px',
    borderRadius: '4px',
  },
  cardBadge: {
    position:     'absolute',
    top:          '8px',
    left:         '8px',
    background:   '#52b788',
    color:        '#fff',
    fontSize:     '0.6rem',
    fontWeight:   900,
    padding:      '3px 7px',
    borderRadius: '4px',
  },
  cardInfo:   { padding: '12px' },
  cardTitulo: {
    fontWeight:   800,
    fontSize:     '0.88rem',
    marginBottom: '4px',
    whiteSpace:   'nowrap',
    overflow:     'hidden',
    textOverflow: 'ellipsis',
  },
  cardSub: {
    display:        'flex',
    justifyContent: 'space-between',
    fontSize:       '0.75rem',
    color:          '#888',
    marginBottom:   '2px',
  },
  cardNota: { color: '#f4a261', fontWeight: 700 },
  cardAno:  { fontSize: '0.72rem', color: '#555' },

  // Paginação
  paginacao: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '20px',
    padding:        '32px 40px 48px',
  },
  pagBtn: {
    background:   '#13131f',
    border:       '1px solid #1e1e32',
    color:        '#f0f0f0',
    padding:      '10px 24px',
    borderRadius: '8px',
    fontFamily:   'inherit',
    fontWeight:   700,
    fontSize:     '0.88rem',
  },
  pagBtnDisabled: { opacity: 0.3, cursor: 'not-allowed' },
  pagInfo: { color: '#888', fontSize: '0.88rem' },
};