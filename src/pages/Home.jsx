import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import api                     from '../services/api';
import { useWindowSize } from '../hooks/useWindowSize';

export default function Home() {
  const [animes,    setAnimes]    = useState([]);
  const [destaque,  setDestaque]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const { isMobile } = useWindowSize();
  const navigate = useNavigate();

  useEffect(() => {
    async function carregar() {
      try {
        const { data } = await api.get('/animes?pagina=1');
        setAnimes(data.animes);
        // O primeiro anime vira o destaque do hero
        if (data.animes.length > 0) setDestaque(data.animes[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  if (loading) return <div style={s.loading}>Carregando...</div>;

  return (
    <div style={s.page}>

      {/* ── HERO ── */}
      {destaque && (
        <div style={s.hero}>
          <div style={s.heroOverlay} />
          <div style={s.heroContent}>
            <span style={s.heroBadge}>Em Destaque</span>
            <h1 style={s.heroTitulo}>{destaque.titulo}</h1>
            <div style={s.heroMeta}>
              <span style={s.heroNota}>★ {destaque.nota.toFixed(1)}</span>
              <span style={s.heroDot}>•</span>
              <span>{destaque.generos.join(', ')}</span>
              <span style={s.heroDot}>•</span>
              <span>{destaque.ano}</span>
            </div>
            <div style={s.heroAcoes}>
              <button style={s.btnPrimario} onClick={() => navigate(`/anime/${destaque.id}`)}>
                ▶ Assistir Agora
              </button>
              <button style={s.btnSecundario} onClick={() => navigate(`/anime/${destaque.id}`)}>
                + Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SEÇÃO DE ANIMES ── */}
      <section style={s.section}>
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitulo}>Todos os Animes</h2>
          <button style={s.verTodos} onClick={() => navigate('/catalogo')}>
            Ver todos →
          </button>
        </div>

        {animes.length === 0 ? (
          <div style={s.vazio}>
            <p>Nenhum anime cadastrado ainda.</p>
            <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '8px' }}>
              Use a API para adicionar animes pelo Insomnia.
            </p>
          </div>
        ) : (
          <div style={s.grid}>
            {animes.map(anime => (
              <AnimeCard key={anime.id} anime={anime} onClick={() => navigate(`/anime/${anime.id}`)} />
            ))}
          </div>
        )}
      </section>

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
      {/* Capa ou placeholder */}
      <div style={s.cardThumb}>
        {anime.capa ? (
          <img src={anime.capa} alt={anime.titulo} style={s.cardImg} />
        ) : (
          <div style={s.cardPlaceholder}>🎌</div>
        )}

        {/* Overlay de play ao hover */}
        {hover && (
          <div style={s.cardOverlay}>
            <div style={s.playIcon}>▶</div>
          </div>
        )}

        {/* Badge de episódios */}
        <span style={s.cardEp}>
          {anime._count?.episodios ?? 0} EPS
        </span>
      </div>

      {/* Info do card */}
      <div style={s.cardInfo}>
        <div style={s.cardTitulo}>{anime.titulo}</div>
        <div style={s.cardSub}>
          <span>{anime.generos[0] ?? 'Anime'}</span>
          <span style={s.cardNota}>★ {anime.nota.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}

// ── ESTILOS ────────────────────────────────────────────
const s = {
  page:    { paddingTop: '64px' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#888' },

  // Hero
  hero: {
  position:   'relative',
  height:     isMobile ? '60vh' : '75vh',
  display:    'flex',
  alignItems: 'flex-end',
  padding:    isMobile ? '0 20px 40px' : '0 60px 60px',
  background: 'linear-gradient(135deg, #0d0d14 0%, #1a0520 50%, #0d0d14 100%)',
  overflow:   'hidden',
},
  heroOverlay: {
    position:   'absolute',
    bottom: 0, left: 0, right: 0,
    height:     '60%',
    background: 'linear-gradient(to top, #0d0d14 0%, transparent 100%)',
  },
  heroContent: {
    position:  'relative',
    zIndex:    2,
    maxWidth:  '600px',
  },
  heroBadge: {
    display:       'inline-block',
    background:    '#e63946',
    color:         '#fff',
    fontSize:      '0.7rem',
    fontWeight:    900,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    padding:       '4px 12px',
    borderRadius:  '3px',
    marginBottom:  '14px',
  },
  heroTitulo: {
    fontFamily:    '"Bebas Neue", sans-serif',
    fontSize:      'clamp(2.5rem, 6vw, 5rem)',
    letterSpacing: '3px',
    lineHeight:    1,
    marginBottom:  '12px',
  },
  heroMeta: {
    display:     'flex',
    alignItems:  'center',
    gap:         '12px',
    fontSize:    '0.85rem',
    color:       '#888',
    marginBottom: '24px',
  },
  heroNota:  { color: '#f4a261', fontWeight: 900 },
  heroDot:   { color: '#e63946' },
  heroAcoes: { display: 'flex', gap: '12px' },

  btnPrimario: {
    background:   '#e63946',
    color:        '#fff',
    border:       'none',
    padding:      '13px 28px',
    borderRadius: '8px',
    fontWeight:   800,
    fontSize:     '0.95rem',
  },
  btnSecundario: {
    background:   'rgba(255,255,255,0.08)',
    color:        '#f0f0f0',
    border:       '1px solid rgba(255,255,255,0.15)',
    padding:      '13px 28px',
    borderRadius: '8px',
    fontWeight:   700,
    fontSize:     '0.95rem',
  },

  // Seção
  section: { padding: isMobile ? '32px 20px' : '48px 40px' },
grid: {
  display:             'grid',
  gridTemplateColumns: isMobile
    ? 'repeat(2, 1fr)'
    : 'repeat(auto-fill, minmax(170px, 1fr))',
  gap: isMobile ? '12px' : '20px',
},
  sectionTitulo: {
    fontFamily:    '"Bebas Neue", sans-serif',
    fontSize:      '1.6rem',
    letterSpacing: '2px',
  },
  verTodos: {
    background:  'transparent',
    border:      'none',
    color:       '#e63946',
    fontWeight:  700,
    fontSize:    '0.85rem',
  },

  vazio: {
    textAlign:  'center',
    padding:    '60px 20px',
    color:      '#f0f0f0',
    background: '#13131f',
    borderRadius: '12px',
    border:     '1px solid #1e1e32',
  },

  // Grid
  grid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
    gap:                 '20px',
  },

  // Card
  card: {
    background:   '#13131f',
    borderRadius: '10px',
    overflow:     'hidden',
    border:       '1px solid #1e1e32',
    cursor:       'pointer',
    transition:   'transform 0.25s, border-color 0.25s, box-shadow 0.25s',
    position:     'relative',
  },
  cardHover: {
    transform:    'translateY(-6px) scale(1.02)',
    borderColor:  '#e63946',
    boxShadow:    '0 12px 40px rgba(230,57,70,0.2)',
  },
  cardThumb: {
    position:    'relative',
    aspectRatio: '3/4',
    overflow:    'hidden',
  },
  cardImg: {
    width: '100%', height: '100%',
    objectFit: 'cover',
  },
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
    position:      'absolute',
    top:           '8px',
    right:         '8px',
    background:    'rgba(0,0,0,0.75)',
    color:         '#f4a261',
    fontSize:      '0.65rem',
    fontWeight:    800,
    padding:       '3px 7px',
    borderRadius:  '4px',
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
  },
  cardNota: { color: '#f4a261', fontWeight: 700 },
  link: {
  color:          '#888',
  fontWeight:     700,
  fontSize:       '0.9rem',
  transition:     'color 0.2s',
  display:        'block',  //← adicione essa linha
},
};