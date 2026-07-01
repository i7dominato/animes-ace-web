import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import { useWindowSize }       from '../hooks/useWindowSize';
import { useSEO } from '../hooks/useSEO';
import { useAuth }             from '../context/AuthContext';
import api                     from '../services/api';
import { SkeletonHero, SkeletonAnimeCard } from '../components/Skeleton';

export default function Home() {
  const [animes,      setAnimes]      = useState([]);
  const [destaque,    setDestaque]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [continuando, setContinuando] = useState([]);
  const navigate     = useNavigate();
  const { isMobile } = useWindowSize();
  const { user }     = useAuth();

  useSEO({});

  useEffect(() => {
    async function carregar() {
      try {
        const { data } = await api.get('/animes?pagina=1');
        setAnimes(data.animes);
        if (data.animes.length > 0) setDestaque(data.animes[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  useEffect(() => {
    if (!user) return;
    async function carregarContinuando() {
      try {
        const { data } = await api.get('/progresso/continuar');
        setContinuando(data);
      } catch (err) {
        console.error(err);
      }
    }
    carregarContinuando();
  }, [user]);

  if (loading) return (
  <div style={s.page}>
    <SkeletonHero isMobile={isMobile} />
    <section style={{ padding: isMobile ? '32px 20px' : '40px 56px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{ width: '4px', height: '22px', background: '#1e1e32', borderRadius: '2px' }} />
        <div style={{ width: '160px', height: '22px', background: '#13131f', borderRadius: '6px' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fill, minmax(150px, 1fr))', gap: isMobile ? '10px' : '18px' }}>
        {Array.from({ length: 6 }).map((_, i) => <SkeletonAnimeCard key={i} isMobile={isMobile} />)}
      </div>
    </section>
  </div>
);

  return (
    <div style={s.page}>

      {/* ══════════ HERO ══════════ */}
      {destaque && (
        <div style={{ ...s.hero, height: isMobile ? '56vh' : '82vh' }}>
          <div style={s.heroBgImg}>
            {destaque.capa && <img src={destaque.capa} alt="" style={s.heroBgImgTag} />}
          </div>
          <div style={s.heroGradientBottom} />
          <div style={s.heroGradientSide} />

          <div style={{ ...s.heroContent, padding: isMobile ? '0 20px 36px' : '0 60px 56px' }}>
            <div style={s.heroTopRow}>
              <span style={s.heroRankBadge}>#1 EM ALTA HOJE</span>
            </div>

            <h1 style={{ ...s.heroTitulo, fontSize: isMobile ? '2.1rem' : 'clamp(2.4rem, 5.5vw, 4.2rem)' }}>
              {destaque.titulo}
            </h1>

            <div style={s.heroMetaRow}>
              <span style={s.heroNotaBadge}>★ {destaque.nota.toFixed(1)}</span>
              <span style={s.heroAnoBadge}>{destaque.ano}</span>
              <span style={s.heroStatusBadge}>
                {destaque.status === 'em_exibicao' ? 'EM EXIBIÇÃO' : 'COMPLETO'}
              </span>
              {!isMobile && (
                <span style={s.heroGeneros}>{destaque.generos.slice(0, 3).join(' • ')}</span>
              )}
            </div>

            {!isMobile && (
              <p style={s.heroSinopse}>
                {destaque.sinopse?.length > 160 ? destaque.sinopse.slice(0, 160) + '...' : destaque.sinopse}
              </p>
            )}

            <div style={s.heroAcoes}>
              <button style={s.btnPlay} onClick={() => navigate(`/anime/${destaque.id}`)}>
                <span style={s.btnPlayIcon}>▶</span> Assistir
              </button>
              <button style={s.btnInfo} onClick={() => navigate(`/anime/${destaque.id}`)}>
                ⓘ Mais informações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ CONTINUAR ASSISTINDO ══════════ */}
      {user && continuando.length > 0 && (
        <Secao titulo="Continue Assistindo" isMobile={isMobile}>
          <div style={s.fileiraScroll}>
            {continuando.map(prog => {
              const duracaoTotal = (prog.episodio.duracao ?? 24) * 60;
              const porcentagem  = Math.min((prog.segundos / duracaoTotal) * 100, 100);
              return (
                <div
                  key={prog.id}
                  style={s.continuandoCard}
                  onClick={() => navigate(`/assistir/${prog.episodio.id}`)}
                >
                  <div style={s.continuandoThumb}>
                    {prog.anime.capa
                      ? <img src={prog.anime.capa} alt={prog.anime.titulo} style={s.continuandoImg} />
                      : <div style={s.cardPlaceholder}>🎬</div>
                    }
                    <div style={s.continuandoOverlay}>
                      <div style={s.playCircle}>▶</div>
                    </div>
                    <div style={s.continuandoBarWrap}>
                      <div style={{ ...s.continuandoBar, width: `${porcentagem}%` }} />
                    </div>
                  </div>
                  <div style={s.continuandoInfo}>
                    <div style={s.continuandoAnime}>{prog.anime.titulo}</div>
                    <div style={s.continuandoEp}>EP {prog.episodio.numero} · {prog.episodio.titulo}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Secao>
      )}

      {/* ══════════ TODOS OS ANIMES ══════════ */}
      <Secao
        titulo="Catálogo Completo"
        isMobile={isMobile}
        acao={<button style={s.verTodos} onClick={() => navigate('/catalogo')}>Ver tudo →</button>}
      >
        {animes.length === 0 ? (
          <div style={s.vazio}>
            <p>Nenhum anime cadastrado ainda.</p>
          </div>
        ) : (
          <div style={{
            display:             'grid',
            gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fill, minmax(150px, 1fr))',
            gap:                 isMobile ? '10px' : '18px',
          }}>
            {animes.map(anime => (
              <AnimeCard key={anime.id} anime={anime} onClick={() => navigate(`/anime/${anime.id}`)} />
            ))}
          </div>
        )}
      </Secao>

    </div>
  );
}

// ── COMPONENTE: Wrapper de seção ───────────────────────
function Secao({ titulo, acao, children, isMobile }) {
  return (
    <section style={{ padding: isMobile ? '28px 20px' : '40px 56px' }}>
      <div style={s.secaoHeader}>
        <div style={s.secaoTituloWrap}>
          <span style={s.secaoBarra} />
          <h2 style={s.secaoTitulo}>{titulo}</h2>
        </div>
        {acao}
      </div>
      {children}
    </section>
  );
}

// ── COMPONENTE: Card de anime (catálogo style) ─────────
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

        {/* Top badges */}
        <div style={s.cardTopRow}>
          {anime.status === 'em_exibicao' && <span style={s.cardBadgeLive}>ON</span>}
          <span style={s.cardBadgeEp}>EP {anime._count?.episodios ?? 0}</span>
        </div>

        {/* Hover overlay com play */}
        {hover && (
          <div style={s.cardOverlay}>
            <div style={s.playCircleSmall}>▶</div>
          </div>
        )}

        {/* Bottom gradient + info */}
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
  page:    { paddingTop: '64px', background: '#0a0a0f' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#888' },

  // ── HERO ──
  hero: {
    position:   'relative',
    display:    'flex',
    alignItems: 'flex-end',
    overflow:   'hidden',
    background: '#0a0a0f',
  },
  heroBgImg: { position: 'absolute', inset: 0, zIndex: 0 },
  heroBgImgTag: { width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 },
  heroGradientBottom: {
    position:   'absolute',
    bottom: 0, left: 0, right: 0,
    height:     '70%',
    background: 'linear-gradient(to top, #0a0a0f 5%, rgba(10,10,15,0.4) 60%, transparent 100%)',
    zIndex:     1,
  },
  heroGradientSide: {
    position:   'absolute',
    inset: 0,
    background: 'linear-gradient(90deg, #0a0a0f 0%, rgba(10,10,15,0.3) 35%, transparent 65%)',
    zIndex:     1,
  },
  heroContent: { position: 'relative', zIndex: 2, maxWidth: '680px' },

  heroTopRow: { marginBottom: '14px' },
  heroRankBadge: {
    display:       'inline-flex',
    alignItems:    'center',
    gap:           '6px',
    background:    'rgba(230,57,70,0.15)',
    border:        '1px solid rgba(230,57,70,0.4)',
    color:         '#ff5c66',
    fontSize:      '0.72rem',
    fontWeight:    900,
    letterSpacing: '1.5px',
    padding:       '5px 12px',
    borderRadius:  '999px',
  },

  heroTitulo: {
    fontFamily:    '"Bebas Neue", sans-serif',
    letterSpacing: '2px',
    lineHeight:    1.05,
    marginBottom:  '16px',
    color:         '#fff',
    textShadow:    '0 4px 24px rgba(0,0,0,0.5)',
  },

  heroMetaRow: {
    display:      'flex',
    alignItems:   'center',
    gap:          '10px',
    flexWrap:     'wrap',
    marginBottom: '18px',
  },
  heroNotaBadge: {
    background:   '#f4a261',
    color:        '#0a0a0f',
    fontWeight:   900,
    fontSize:     '0.8rem',
    padding:      '4px 10px',
    borderRadius: '6px',
  },
  heroAnoBadge: {
    background:   'rgba(255,255,255,0.1)',
    color:        '#ddd',
    fontWeight:   700,
    fontSize:     '0.8rem',
    padding:      '4px 10px',
    borderRadius: '6px',
  },
  heroStatusBadge: {
    background:    'rgba(82,183,136,0.18)',
    border:        '1px solid rgba(82,183,136,0.4)',
    color:         '#6fdba0',
    fontWeight:    800,
    fontSize:      '0.7rem',
    letterSpacing: '0.5px',
    padding:       '4px 10px',
    borderRadius:  '6px',
  },
  heroGeneros: { color: '#999', fontSize: '0.85rem', fontWeight: 600 },

  heroSinopse: {
    fontSize:     '0.95rem',
    lineHeight:   1.6,
    color:        '#cacaca',
    marginBottom: '26px',
    maxWidth:     '560px',
  },

  heroAcoes: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  btnPlay: {
    display:      'flex',
    alignItems:   'center',
    gap:          '10px',
    background:   '#fff',
    color:        '#0a0a0f',
    border:       'none',
    padding:      '14px 30px',
    borderRadius: '8px',
    fontWeight:   800,
    fontSize:     '1rem',
    cursor:       'pointer',
    fontFamily:   'Nunito, sans-serif',
    transition:   'transform 0.15s, opacity 0.15s',
  },
  btnPlayIcon: { fontSize: '0.85rem' },
  btnInfo: {
    display:      'flex',
    alignItems:   'center',
    gap:          '8px',
    background:   'rgba(120,120,128,0.35)',
    backdropFilter: 'blur(8px)',
    color:        '#fff',
    border:       '1px solid rgba(255,255,255,0.15)',
    padding:      '14px 26px',
    borderRadius: '8px',
    fontWeight:   700,
    fontSize:     '1rem',
    cursor:       'pointer',
    fontFamily:   'Nunito, sans-serif',
  },

  // ── SEÇÃO ──
  secaoHeader: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   '20px',
  },
  secaoTituloWrap: { display: 'flex', alignItems: 'center', gap: '10px' },
  secaoBarra: { width: '4px', height: '22px', background: '#e63946', borderRadius: '2px', display: 'inline-block' },
  secaoTitulo: {
    fontFamily:    '"Bebas Neue", sans-serif',
    fontSize:      '1.5rem',
    letterSpacing: '1.5px',
    color:         '#fff',
  },
  verTodos: {
    background:  'transparent',
    border:      'none',
    color:       '#e63946',
    fontWeight:  700,
    fontSize:    '0.85rem',
    cursor:      'pointer',
    fontFamily:  'Nunito, sans-serif',
  },

  fileiraScroll: {
    display:        'flex',
    gap:            '16px',
    overflowX:      'auto',
    paddingBottom:  '4px',
    scrollbarWidth: 'thin',
  },

  vazio: {
    textAlign:    'center',
    padding:      '50px 20px',
    color:        '#888',
    background:   '#13131f',
    borderRadius: '12px',
    border:       '1px solid #1e1e32',
  },

  // ── CONTINUAR ASSISTINDO ──
  continuandoCard: {
    flexShrink:   0,
    width:        '260px',
    background:   '#13131f',
    borderRadius: '10px',
    overflow:     'hidden',
    border:       '1px solid #1e1e32',
    cursor:       'pointer',
    transition:   'transform 0.2s, border-color 0.2s',
  },
  continuandoThumb: { position: 'relative', aspectRatio: '16/9', overflow: 'hidden' },
  continuandoImg:   { width: '100%', height: '100%', objectFit: 'cover' },
  continuandoOverlay: {
    position: 'absolute', inset: 0,
    background: 'rgba(0,0,0,0.35)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  playCircle: {
    width: '42px', height: '42px', borderRadius: '50%',
    background: 'rgba(230,57,70,0.9)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: '1rem', color: '#fff',
  },
  continuandoBarWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'rgba(255,255,255,0.2)' },
  continuandoBar:     { height: '100%', background: '#e63946' },
  continuandoInfo:    { padding: '10px 12px' },
  continuandoAnime:   { fontWeight: 800, fontSize: '0.85rem', color: '#fff', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  continuandoEp:      { fontSize: '0.75rem', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },

  // ── CARD DE ANIME ──
  card: {
    cursor:     'pointer',
    transition: 'transform 0.2s',
  },
  cardHover: { transform: 'translateY(-4px)' },
  cardThumb: {
    position:     'relative',
    aspectRatio:  '2/3',
    borderRadius: '8px',
    overflow:     'hidden',
    border:       '1px solid #1e1e32',
    background:   '#13131f',
  },
  cardImg: { width: '100%', height: '100%', objectFit: 'cover' },
  cardPlaceholder: {
    width: '100%', height: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '2.2rem', background: 'linear-gradient(135deg, #1a1a2e, #0d0d14)',
  },
  cardTopRow: {
    position: 'absolute', top: '6px', left: '6px', right: '6px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 2,
  },
  cardBadgeLive: {
    background: '#52b788', color: '#fff', fontSize: '0.58rem', fontWeight: 900,
    padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.5px',
  },
  cardBadgeEp: {
    background: 'rgba(0,0,0,0.7)', color: '#f4a261', fontSize: '0.6rem', fontWeight: 800,
    padding: '2px 6px', borderRadius: '4px',
  },
  cardOverlay: {
    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },
  playCircleSmall: {
    width: '34px', height: '34px', borderRadius: '50%',
    background: '#e63946', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '0.85rem', color: '#fff',
  },
  cardBottomGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: '20px 8px 6px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
  },
  cardNotaRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardNota: { color: '#f4a261', fontWeight: 800, fontSize: '0.72rem' },
  cardAno:  { color: '#aaa', fontSize: '0.68rem', fontWeight: 600 },

  cardInfo: { padding: '8px 2px 0' },
  cardTitulo: {
    fontWeight: 800, fontSize: '0.78rem', color: '#eee',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    marginBottom: '2px',
  },
  cardGenero: {
    fontSize: '0.68rem', color: '#777',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
};