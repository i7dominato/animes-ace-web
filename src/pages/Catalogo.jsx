import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWindowSize }       from '../hooks/useWindowSize';
import { useSEO } from '../hooks/useSEO';
import api                     from '../services/api';
import { SkeletonAnimeCard } from '../components/Skeleton';

const GENEROS = ['Todos', 'Ação', 'Aventura', 'Romance', 'Comédia', 'Terror', 'Fantasia', 'Esportes', 'Sci-Fi', 'Mistério'];

export default function Catalogo() {
  const [searchParams] = useSearchParams();
  const [animes,       setAnimes]       = useState([]);
  const [loading,      setLoading]      = useState(true);
 const [busca, setBusca] = useState(searchParams.get('busca') ?? '');
  const [generoAtivo,  setGeneroAtivo]  = useState('Todos');
  const [pagina,       setPagina]       = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const navigate     = useNavigate();
  const { isMobile } = useWindowSize();

 useSEO({ titulo: 'Catálogo', descricao: 'Explore todo o acervo de animes disponíveis no Animes Ace.' });

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ pagina });
        if (busca)                   params.append('busca',  busca);
        if (generoAtivo !== 'Todos') params.append('genero', generoAtivo);

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

  function trocarGenero(genero) { setGeneroAtivo(genero); setPagina(1); }
  function handleBusca(e)       { setBusca(e.target.value); setPagina(1); }

  return (
    <div style={s.page}>

      {/* ── HEADER ── */}
      <div style={{ ...s.header, padding: isMobile ? '30px 20px 18px' : '44px 56px 20px' }}>
        <div style={s.headerTopRow}>
          <span style={s.secaoBarra} />
          <h1 style={s.titulo}>Catálogo</h1>
        </div>
        <p style={s.subtitulo}>Explore todo o acervo de animes disponíveis</p>
      </div>

      {/* ── BUSCA ── */}
      <div style={{ ...s.buscaWrap, margin: isMobile ? '0 20px 16px' : '0 56px 20px' }}>
        <span style={s.buscaIcon}>🔍</span>
        <input
          style={s.buscaInput}
          type="text"
          placeholder="Buscar por título..."
          value={busca}
          onChange={handleBusca}
        />
        {busca && <button style={s.buscaLimpar} onClick={() => setBusca('')}>✕</button>}
      </div>

      {/* ── GÊNEROS ── */}
      <div style={{ ...s.generoBar, padding: isMobile ? '0 20px 18px' : '0 56px 24px' }}>
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
      <div style={{ padding: isMobile ? '0 20px 10px' : '0 56px 14px' }}>
        <span style={s.resultadoTexto}>
          {loading ? 'Buscando...' : `${animes.length} resultado${animes.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* ── GRID ── */}
      {loading ? (
  <div style={{
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fill, minmax(150px, 1fr))',
    gap:     isMobile ? '10px' : '18px',
    padding: isMobile ? '0 20px 48px' : '0 56px 56px',
  }}>
    {Array.from({ length: 12 }).map((_, i) => <SkeletonAnimeCard key={i} isMobile={isMobile} />)}
    
  </div>
) : animes.length === 0 ? (
        <div style={{ ...s.vazio, margin: isMobile ? '0 20px' : '0 56px' }}>
          <p style={{ fontSize: '1.8rem' }}>🎬</p>
          <p style={{ marginTop: '10px' }}>Nenhum anime encontrado.</p>
          <button style={s.limparFiltros} onClick={() => { setBusca(''); setGeneroAtivo('Todos'); }}>
            Limpar filtros
          </button>
        </div>
      ) : (
        <div style={{
          ...s.grid,
          gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fill, minmax(150px, 1fr))',
          gap:     isMobile ? '10px' : '18px',
          padding: isMobile ? '0 20px 40px' : '0 56px 56px',
        }}>
          {animes.map(anime => (
            <AnimeCard key={anime.id} anime={anime} onClick={() => navigate(`/anime/${anime.id}`)} />
          ))}
        </div>
      )}

      {/* ── PAGINAÇÃO ── */}
      {totalPaginas > 1 && (
        <div style={s.paginacao}>
          <button style={{ ...s.pagBtn, ...(pagina === 1 ? s.pagBtnDisabled : {}) }}
            onClick={() => setPagina(p => p - 1)} disabled={pagina === 1}>
            ← Anterior
          </button>
          <span style={s.pagInfo}>{pagina} / {totalPaginas}</span>
          <button style={{ ...s.pagBtn, ...(pagina === totalPaginas ? s.pagBtnDisabled : {}) }}
            onClick={() => setPagina(p => p + 1)} disabled={pagina === totalPaginas}>
            Próxima →
          </button>
        </div>
      )}

    </div>
  );
}

// ── CARD (mesmo estilo da Home) ────────────────────────
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
        {anime.capa
          ? <img src={anime.capa} alt={anime.titulo} style={s.cardImg} />
          : <div style={s.cardPlaceholder}>🎬</div>
        }
        <div style={s.cardTopRow}>
          {anime.status === 'em_exibicao' && <span style={s.cardBadgeLive}>ON</span>}
          <span style={s.cardBadgeEp}>EP {anime._count?.episodios ?? 0}</span>
        </div>
        {hover && (
          <div style={s.cardOverlay}>
            <div style={s.playCircleSmall}>▶</div>
          </div>
        )}
        <div style={s.cardBottomGradient}>
          <div style={s.cardNotaRow}>
            <span style={s.cardNota}>★ {anime.nota.toFixed(1)}</span>
            <span style={s.cardAno}>{anime.ano}</span>
          </div>
        </div>
      </div>
      <div style={s.cardInfo}>
        <div style={s.cardTitulo}>{anime.titulo}</div>
        <div style={s.cardGenero}>{anime.generos.slice(0, 2).join(' · ')}</div>
      </div>
    </div>
  );
}

const s = {
  page:    { paddingTop: '64px', minHeight: '100vh', background: '#0a0a0f' },
  loading: { textAlign: 'center', padding: '80px', color: '#888' },

  header:  {},
  headerTopRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' },
  secaoBarra: { width: '4px', height: '24px', background: '#e63946', borderRadius: '2px', display: 'inline-block' },
  titulo:    { fontFamily: '"Bebas Neue", sans-serif', fontSize: '2.1rem', letterSpacing: '2px', color: '#fff' },
  subtitulo: { color: '#888', fontSize: '0.88rem', paddingLeft: '14px' },

  buscaWrap: { position: 'relative' },
  buscaIcon: { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.95rem' },
  buscaInput: {
    width:        '100%',
    padding:      '13px 46px',
    background:   '#13131f',
    border:       '1px solid #1e1e32',
    borderRadius: '10px',
    color:        '#f0f0f0',
    fontSize:     '0.92rem',
    fontFamily:   'inherit',
    outline:      'none',
  },
  buscaLimpar: {
    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
    background: 'transparent', border: 'none', color: '#888', fontSize: '1rem', cursor: 'pointer',
  },

  generoBar: { display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' },
  generoPill: {
    flexShrink:   0,
    padding:      '7px 18px',
    borderRadius: '999px',
    border:       '1px solid #1e1e32',
    background:   '#13131f',
    color:        '#888',
    fontSize:     '0.8rem',
    fontWeight:   700,
    fontFamily:   'inherit',
    whiteSpace:   'nowrap',
    cursor:       'pointer',
  },
  generoPillAtivo: { background: '#e63946', borderColor: '#e63946', color: '#fff' },

  resultadoTexto: { fontSize: '0.8rem', color: '#777' },

  vazio: {
    textAlign:    'center',
    padding:      '50px 20px',
    color:        '#888',
    background:   '#13131f',
    borderRadius: '12px',
    border:       '1px solid #1e1e32',
  },
  limparFiltros: {
    marginTop:    '14px',
    background:   'transparent',
    border:       '1px solid #e63946',
    color:        '#e63946',
    padding:      '7px 18px',
    borderRadius: '6px',
    fontFamily:   'inherit',
    fontWeight:   700,
    fontSize:     '0.82rem',
    cursor:       'pointer',
  },

  grid: { display: 'grid' },

  // Cards (idêntico ao da Home)
  card:      { cursor: 'pointer', transition: 'transform 0.2s' },
  cardHover: { transform: 'translateY(-4px)' },
  cardThumb: {
    position: 'relative', aspectRatio: '2/3', borderRadius: '8px',
    overflow: 'hidden', border: '1px solid #1e1e32', background: '#13131f',
  },
  cardImg: { width: '100%', height: '100%', objectFit: 'cover' },
  cardPlaceholder: {
    width: '100%', height: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '2.2rem', background: 'linear-gradient(135deg, #1a1a2e, #0d0d14)',
  },
  cardTopRow: {
    position: 'absolute', top: '6px', left: '6px', right: '6px',
    display: 'flex', justifyContent: 'space-between', zIndex: 2,
  },
  cardBadgeLive: { background: '#52b788', color: '#fff', fontSize: '0.58rem', fontWeight: 900, padding: '2px 6px', borderRadius: '4px' },
  cardBadgeEp:   { background: 'rgba(0,0,0,0.7)', color: '#f4a261', fontSize: '0.6rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' },
  cardOverlay: {
    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },
  playCircleSmall: {
    width: '34px', height: '34px', borderRadius: '50%', background: '#e63946',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: '#fff',
  },
  cardBottomGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 8px 6px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
  },
  cardNotaRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardNota: { color: '#f4a261', fontWeight: 800, fontSize: '0.72rem' },
  cardAno:  { color: '#aaa', fontSize: '0.68rem', fontWeight: 600 },
  cardInfo: { padding: '8px 2px 0' },
  cardTitulo: {
    fontWeight: 800, fontSize: '0.78rem', color: '#eee',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px',
  },
  cardGenero: { fontSize: '0.68rem', color: '#777', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },

  paginacao: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '30px 40px 50px' },
  pagBtn: {
    background: '#13131f', border: '1px solid #1e1e32', color: '#f0f0f0',
    padding: '10px 22px', borderRadius: '8px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
  },
  pagBtnDisabled: { opacity: 0.3, cursor: 'not-allowed' },
  pagInfo: { color: '#888', fontSize: '0.85rem' },
};