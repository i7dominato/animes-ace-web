import { useEffect, useState }        from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWindowSize }               from '../hooks/useWindowSize';
import api                             from '../services/api';

function getYoutubeEmbed(url) {
  if (!url) return null;
  const regexes = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
  ];
  for (const regex of regexes) {
    const match = url.match(regex);
    if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`;
  }
  return url;
}

export default function Player() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { isMobile } = useWindowSize();

  const [episodio,   setEpisodio]   = useState(null);
  const [proximoEp,  setProximoEp]  = useState(null);
  const [anteriorEp, setAnteriorEp] = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        const { data: ep } = await api.get(`/animes/0/episodios/${id}`);
        setEpisodio(ep);
        const { data: todos } = await api.get(`/animes/${ep.animeId}/episodios`);
        const index = todos.findIndex(e => e.id === ep.id);
        setAnteriorEp(index > 0              ? todos[index - 1] : null);
        setProximoEp( index < todos.length-1 ? todos[index + 1] : null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [id]);

  if (loading)   return <div style={s.loading}>Carregando player...</div>;
  if (!episodio) return <div style={s.loading}>Episódio não encontrado.</div>;

  const embedUrl = getYoutubeEmbed(episodio.urlVideo);

  return (
    <div style={s.page}>

      {/* ── PLAYER ── */}
      <div style={s.playerWrap}>
        {embedUrl ? (
          <iframe
            style={s.iframe}
            src={embedUrl}
            title={episodio.titulo}
            allowFullScreen
            allow="autoplay; encrypted-media"
            frameBorder="0"
          />
        ) : (
          <div style={s.semVideo}>
            <span style={{ fontSize: '3rem' }}>📺</span>
            <p>Vídeo não disponível.</p>
          </div>
        )}
      </div>

      {/* ── INFO ── */}
      <div style={{ ...s.content, padding: isMobile ? '20px 20px 0' : '28px 40px 0' }}>

        <div style={s.infoWrap}>
          <div style={s.breadcrumb}>
            <Link to="/" style={s.breadLink}>Início</Link>
            <span style={s.breadSep}>›</span>
            <Link to={`/anime/${episodio.animeId}`} style={s.breadLink}>
              {episodio.anime.titulo}
            </Link>
            <span style={s.breadSep}>›</span>
            <span style={s.breadAtual}>Ep. {episodio.numero}</span>
          </div>

          <h1 style={s.epTitulo}>
            <span style={s.epNumero}>EP {episodio.numero}</span>
            {episodio.titulo}
          </h1>

          {episodio.descricao && <p style={s.epDesc}>{episodio.descricao}</p>}
          {episodio.duracao   && <span style={s.epDuracao}>⏱ {episodio.duracao} minutos</span>}
        </div>

        {/* ── NAVEGAÇÃO ── */}
        <div style={{
          ...s.navEps,
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        }}>
          {anteriorEp ? (
            <button style={s.navBtn} onClick={() => navigate(`/assistir/${anteriorEp.id}`)}>
              <span style={s.navSeta}>←</span>
              <div style={s.navInfo}>
                <span style={s.navLabel}>Episódio anterior</span>
                <span style={s.navNome}>EP {anteriorEp.numero} — {anteriorEp.titulo}</span>
              </div>
            </button>
          ) : <div />}

          {proximoEp && (
            <button style={{ ...s.navBtn, ...s.navBtnProximo }} onClick={() => navigate(`/assistir/${proximoEp.id}`)}>
              <div style={s.navInfo}>
                <span style={s.navLabel}>Próximo episódio</span>
                <span style={s.navNome}>EP {proximoEp.numero} — {proximoEp.titulo}</span>
              </div>
              <span style={s.navSeta}>→</span>
            </button>
          )}
        </div>

        <div style={{ padding: '0 0 48px' }}>
          <button style={s.btnVoltar} onClick={() => navigate(`/anime/${episodio.animeId}`)}>
            ← Voltar para {episodio.anime.titulo}
          </button>
        </div>

      </div>
    </div>
  );
}

const s = {
  page:    { paddingTop: '64px', minHeight: '100vh', background: '#0a0a0f' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#888' },

  playerWrap: {
    width:       '100%',
    background:  '#000',
    aspectRatio: '16/9',
    maxHeight:   'calc(100vh - 64px - 120px)',
  },
  iframe: { width: '100%', height: '100%', border: 'none', display: 'block' },
  semVideo: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: '12px', color: '#888', background: '#0a0a0f',
  },

  content:  { maxWidth: '900px' },
  infoWrap: { marginBottom: '28px' },

  breadcrumb: {
    display:      'flex',
    alignItems:   'center',
    gap:          '8px',
    marginBottom: '14px',
    fontSize:     '0.82rem',
    flexWrap:     'wrap',
  },
  breadLink:  { color: '#888', fontWeight: 700 },
  breadSep:   { color: '#1e1e32' },
  breadAtual: { color: '#f0f0f0', fontWeight: 700 },

  epTitulo: {
    fontFamily:    '"Bebas Neue", sans-serif',
    fontSize:      '2rem',
    letterSpacing: '2px',
    marginBottom:  '10px',
    display:       'flex',
    alignItems:    'baseline',
    gap:           '12px',
    flexWrap:      'wrap',
  },
  epNumero: { color: '#e63946', fontSize: '1rem', fontFamily: 'Nunito, sans-serif', fontWeight: 900 },
  epDesc:   { fontSize: '0.9rem', color: '#bbb', lineHeight: 1.65, marginBottom: '12px' },
  epDuracao: {
    display: 'inline-block', fontSize: '0.82rem', color: '#888',
    background: '#13131f', border: '1px solid #1e1e32',
    padding: '4px 12px', borderRadius: '999px',
  },

  navEps: {
    display:      'grid',
    gap:          '12px',
    marginBottom: '24px',
  },
  navBtn: {
    display:      'flex',
    alignItems:   'center',
    gap:          '12px',
    background:   '#13131f',
    border:       '1px solid #1e1e32',
    borderRadius: '10px',
    padding:      '14px 18px',
    cursor:       'pointer',
    textAlign:    'left',
    fontFamily:   'inherit',
    transition:   'border-color 0.2s',
  },
  navBtnProximo: { justifyContent: 'flex-end', textAlign: 'right' },
  navSeta: { fontSize: '1.2rem', color: '#e63946', flexShrink: 0 },
  navInfo: { display: 'flex', flexDirection: 'column', gap: '3px' },
  navLabel:{ fontSize: '0.7rem', color: '#888', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' },
  navNome: { fontSize: '0.85rem', color: '#f0f0f0', fontWeight: 800 },

  btnVoltar: {
    background:   'transparent',
    border:       '1px solid #1e1e32',
    color:        '#888',
    padding:      '10px 20px',
    borderRadius: '8px',
    fontFamily:   'inherit',
    fontWeight:   700,
    fontSize:     '0.85rem',
    cursor:       'pointer',
  },
};
