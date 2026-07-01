import { useEffect, useState }        from 'react';
import { useParams, useNavigate }     from 'react-router-dom';
import { useAuth }                    from '../context/AuthContext';
import { useWindowSize }              from '../hooks/useWindowSize';
import { useSEO } from '../hooks/useSEO';
import api                            from '../services/api';
import { SkeletonAnimeHero, SkeletonEpisodio } from '../components/Skeleton';

export default function Anime() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const { isMobile } = useWindowSize();

  const [anime,      setAnime]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [naLista,    setNaLista]    = useState(false);
  const [nota,       setNota]       = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando,   setEnviando]   = useState(false);
  const [abaAtiva,   setAbaAtiva]   = useState('episodios');

  useEffect(() => {
    async function carregar() {
      try {
        const { data } = await api.get(`/animes/${id}`);
        setAnime(data);
        if (user) {
          const lista = await api.get('/users/lista');
          const item  = lista.data.find(i => i.animeId === data.id);
          if (item) setNaLista(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [id, user]);

     // dentro do componente (após o loading):
  useSEO({
  titulo:    anime?.titulo,
  descricao: anime?.sinopse?.slice(0, 160),
  imagem:    anime?.capa,
});
  async function toggleLista() {
    if (!user) { navigate('/login'); return; }
    try {
      if (naLista) {
        const lista = await api.get('/users/lista');
        const item  = lista.data.find(i => i.animeId === anime.id);
        if (item) await api.delete(`/users/lista/${item.id}`);
        setNaLista(false);
      } else {
        await api.post('/users/lista', { animeId: anime.id, status: 'quero_ver' });
        setNaLista(true);
      }
    } catch (err) { console.error(err); }
  }

  async function enviarAvaliacao() {
    if (!user) { navigate('/login'); return; }
    if (nota === 0) return;
    setEnviando(true);
    try {
      await api.post(`/animes/${id}/avaliacoes`, { nota, comentario });
      const { data } = await api.get(`/animes/${id}`);
      setAnime(data);
      setComentario('');
    } catch (err) { console.error(err); }
    finally { setEnviando(false); }
  }

  if (loading) return (
  <div style={s.page}>
    <SkeletonAnimeHero isMobile={isMobile} />
    <div style={{ padding: isMobile ? '16px 20px 48px' : '22px 56px 56px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
        {Array.from({ length: 4 }).map((_, i) => <SkeletonEpisodio key={i} />)}
      </div>
    </div>
  </div>
);
  if (!anime)  return <div style={s.loading}>Anime não encontrado.</div>;

  return (
    <div style={s.page}>

      {/* ══════════ HERO ══════════ */}
      <div style={{ ...s.hero, height: isMobile ? 'auto' : '64vh', minHeight: isMobile ? 'auto' : '480px' }}>
        <div style={s.heroBgImg}>
          {anime.capa && <img src={anime.capa} alt="" style={s.heroBgImgTag} />}
        </div>
        <div style={s.heroGradientBottom} />
        <div style={s.heroGradientSide} />

        <div style={{
          ...s.heroContent,
          flexDirection: isMobile ? 'column' : 'row',
          padding:       isMobile ? '24px 20px 24px' : '0 56px 44px',
          gap:           isMobile ? '18px' : '32px',
        }}>

          {/* Capa lateral */}
          <div style={{ ...s.capa, width: isMobile ? '128px' : '190px' }}>
            {anime.capa
              ? <img src={anime.capa} alt={anime.titulo} style={s.capaImg} />
              : <div style={s.capaPlaceholder}>🎬</div>
            }
          </div>

          {/* Info */}
          <div style={s.info}>
            <div style={s.generosTags}>
              {anime.generos.map(g => (
                <span key={g} style={s.generoTag}>{g}</span>
              ))}
            </div>

            <h1 style={{ ...s.titulo, fontSize: isMobile ? '1.9rem' : 'clamp(2rem, 4vw, 3.2rem)' }}>
              {anime.titulo}
            </h1>

            <div style={s.metaRow}>
              <span style={s.metaNotaBadge}>★ {anime.nota.toFixed(1)}</span>
              <span style={s.metaAnoBadge}>{anime.ano}</span>
              <span style={s.metaStatusBadge}>
                {anime.status === 'em_exibicao' ? 'EM EXIBIÇÃO' : 'COMPLETO'}
              </span>
              <span style={s.metaEpsBadge}>{anime._count.episodios} EPISÓDIOS</span>
            </div>

            {!isMobile && <p style={s.sinopse}>{anime.sinopse}</p>}

            <div style={s.acoes}>
              {anime.episodios.length > 0 && (
                <button style={s.btnPlay} onClick={() => navigate(`/assistir/${anime.episodios[0].id}`)}>
                  <span style={s.btnPlayIcon}>▶</span> Assistir EP 1
                </button>
              )}
              <button
                style={{ ...s.btnInfo, ...(naLista ? s.btnInfoAtivo : {}) }}
                onClick={toggleLista}
              >
                {naLista ? '✓ Na Lista' : '+ Minha Lista'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isMobile && (
        <div style={s.sinopseMobile}>
          <p style={s.sinopse}>{anime.sinopse}</p>
        </div>
      )}

      {/* ══════════ ABAS ══════════ */}
      <div style={{ ...s.abas, padding: isMobile ? '0 20px' : '0 56px' }}>
        <button
          style={{ ...s.aba, ...(abaAtiva === 'episodios' ? s.abaAtiva : {}) }}
          onClick={() => setAbaAtiva('episodios')}
        >
          Episódios <span style={s.abaContador}>{anime._count.episodios}</span>
        </button>
        <button
          style={{ ...s.aba, ...(abaAtiva === 'avaliacoes' ? s.abaAtiva : {}) }}
          onClick={() => setAbaAtiva('avaliacoes')}
        >
          Avaliações <span style={s.abaContador}>{anime._count.avaliacoes}</span>
        </button>
      </div>

      {/* ══════════ EPISÓDIOS ══════════ */}
      {abaAtiva === 'episodios' && (
        <div style={{ ...s.listaWrap, padding: isMobile ? '16px 20px 48px' : '22px 56px 56px' }}>
          {anime.episodios.length === 0 ? (
            <div style={s.vazio}>Nenhum episódio cadastrado ainda.</div>
          ) : (
            <div style={s.epGrid}>
              {anime.episodios.map(ep => (
                <div key={ep.id} style={s.epCard} onClick={() => navigate(`/assistir/${ep.id}`)}>
                  <div style={s.epThumb}>
                    {anime.capa
                      ? <img src={anime.capa} alt="" style={s.epThumbImg} />
                      : <div style={s.epThumbPlaceholder}>📺</div>
                    }
                    <div style={s.epPlayOverlay}>
                      <div style={s.playCircleSmall}>▶</div>
                    </div>
                    <span style={s.epNumBadge}>EP {ep.numero}</span>
                  </div>
                  <div style={s.epInfo}>
                    <div style={s.epTitulo}>{ep.titulo}</div>
                    {ep.duracao && <div style={s.epDuracao}>{ep.duracao} min</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════ AVALIAÇÕES ══════════ */}
      {abaAtiva === 'avaliacoes' && (
        <div style={{ ...s.listaWrap, padding: isMobile ? '16px 20px 48px' : '22px 56px 56px', maxWidth: '760px' }}>
          {user && (
            <div style={s.avaliacaoForm}>
              <div style={s.avaliacaoFormTitulo}>Sua avaliação</div>
              <div style={s.estrelas}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button
                    key={n}
                    style={{ ...s.estrela, ...(n <= nota ? s.estrelaAtiva : {}) }}
                    onClick={() => setNota(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <textarea
                style={s.textarea}
                placeholder="Comentário (opcional)..."
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                rows={3}
              />
              <button
                style={{ ...s.btnEnviar, opacity: nota === 0 || enviando ? 0.5 : 1 }}
                onClick={enviarAvaliacao}
                disabled={nota === 0 || enviando}
              >
                {enviando ? 'Enviando...' : 'Enviar avaliação'}
              </button>
            </div>
          )}

          {anime.avaliacoes.length === 0 ? (
            <div style={s.vazio}>Nenhuma avaliação ainda. Seja o primeiro!</div>
          ) : (
            anime.avaliacoes.map(av => (
              <div key={av.id} style={s.avaliacaoItem}>
                <div style={s.avAvatar}>{av.user.nome[0].toUpperCase()}</div>
                <div style={s.avInfo}>
                  <div style={s.avHeader}>
                    <span style={s.avNome}>{av.user.nome}</span>
                    <span style={s.avNota}>★ {av.nota.toFixed(1)}</span>
                  </div>
                  {av.comentario && <p style={s.avComentario}>{av.comentario}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}

const s = {
  page:    { paddingTop: '64px', minHeight: '100vh', background: '#0a0a0f' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#888' },

  // ── HERO ──
  hero: { position: 'relative', display: 'flex', alignItems: 'flex-end', overflow: 'hidden', background: '#0a0a0f' },
  heroBgImg: { position: 'absolute', inset: 0, zIndex: 0 },
  heroBgImgTag: { width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4, filter: 'blur(2px)' },
  heroGradientBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '75%',
    background: 'linear-gradient(to top, #0a0a0f 10%, rgba(10,10,15,0.5) 60%, transparent 100%)', zIndex: 1,
  },
  heroGradientSide: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(90deg, #0a0a0f 0%, rgba(10,10,15,0.4) 40%, transparent 70%)', zIndex: 1,
  },
  heroContent: { position: 'relative', zIndex: 2, display: 'flex', maxWidth: '900px', width: '100%' },

  capa: {
    flexShrink:   0,
    aspectRatio:  '2/3',
    borderRadius: '10px',
    overflow:     'hidden',
    border:       '2px solid rgba(255,255,255,0.1)',
    boxShadow:    '0 12px 32px rgba(0,0,0,0.5)',
  },
  capaImg: { width: '100%', height: '100%', objectFit: 'cover' },
  capaPlaceholder: {
    width: '100%', height: '100%', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '2.5rem', background: 'linear-gradient(135deg, #1a1a2e, #0d0d14)',
  },

  info: { flex: 1, minWidth: 0 },
  generosTags: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' },
  generoTag: {
    background:   'rgba(255,255,255,0.08)',
    color:        '#ddd',
    border:       '1px solid rgba(255,255,255,0.12)',
    padding:      '3px 11px',
    borderRadius: '999px',
    fontSize:     '0.7rem',
    fontWeight:   700,
  },
  titulo: {
    fontFamily:    '"Bebas Neue", sans-serif',
    letterSpacing: '1.5px',
    marginBottom:  '12px',
    lineHeight:    1.05,
    color:         '#fff',
    textShadow:    '0 4px 20px rgba(0,0,0,0.5)',
  },
  metaRow: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' },
  metaNotaBadge:  { background: '#f4a261', color: '#0a0a0f', fontWeight: 900, fontSize: '0.74rem', padding: '4px 10px', borderRadius: '6px' },
  metaAnoBadge:   { background: 'rgba(255,255,255,0.1)', color: '#ddd', fontWeight: 700, fontSize: '0.74rem', padding: '4px 10px', borderRadius: '6px' },
  metaStatusBadge:{
    background: 'rgba(82,183,136,0.18)', border: '1px solid rgba(82,183,136,0.4)',
    color: '#6fdba0', fontWeight: 800, fontSize: '0.66rem', letterSpacing: '0.5px', padding: '4px 10px', borderRadius: '6px',
  },
  metaEpsBadge: { color: '#999', fontWeight: 700, fontSize: '0.74rem' },

  sinopse: { fontSize: '0.92rem', color: '#c5c5c5', lineHeight: 1.65, maxWidth: '600px' },
  sinopseMobile: { padding: '0 20px 8px' },

  acoes: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '18px' },
  btnPlay: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: '#fff', color: '#0a0a0f', border: 'none',
    padding: '12px 26px', borderRadius: '8px', fontWeight: 800, fontSize: '0.92rem',
    cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
  },
  btnPlayIcon: { fontSize: '0.8rem' },
  btnInfo: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'rgba(120,120,128,0.3)', backdropFilter: 'blur(8px)', color: '#fff',
    border: '1px solid rgba(255,255,255,0.15)', padding: '12px 22px', borderRadius: '8px',
    fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
  },
  btnInfoAtivo: { background: 'rgba(82,183,136,0.18)', borderColor: 'rgba(82,183,136,0.4)', color: '#6fdba0' },

  // ── ABAS ──
  abas: { display: 'flex', gap: '6px', borderBottom: '1px solid #1e1e32', overflowX: 'auto' },
  aba: {
    background:   'transparent',
    border:       'none',
    borderBottom: '2px solid transparent',
    color:        '#888',
    padding:      '15px 18px',
    fontFamily:   'Nunito, sans-serif',
    fontWeight:   700,
    fontSize:     '0.88rem',
    cursor:       'pointer',
    marginBottom: '-1px',
    whiteSpace:   'nowrap',
    display:      'flex', alignItems: 'center', gap: '6px',
  },
  abaAtiva: { color: '#fff', borderColor: '#e63946' },
  abaContador: { background: '#1e1e32', color: '#aaa', fontSize: '0.7rem', padding: '1px 7px', borderRadius: '999px', fontWeight: 800 },

  listaWrap: {},
  vazio: { color: '#888', padding: '30px 0', textAlign: 'center' },

  // ── EPISÓDIOS GRID ──
  epGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap:                 '14px',
  },
  epCard: {
    display:      'flex',
    gap:          '12px',
    background:   '#13131f',
    border:       '1px solid #1e1e32',
    borderRadius: '10px',
    overflow:     'hidden',
    cursor:       'pointer',
    transition:   'border-color 0.2s',
  },
  epThumb: { position: 'relative', width: '110px', flexShrink: 0, aspectRatio: '16/9', overflow: 'hidden' },
  epThumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  epThumbPlaceholder: {
    width: '100%', height: '100%', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '1.3rem', background: '#0d0d14',
  },
  epPlayOverlay: {
    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  playCircleSmall: {
    width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(230,57,70,0.9)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#fff',
  },
  epNumBadge: {
    position: 'absolute', bottom: '4px', left: '4px',
    background: 'rgba(0,0,0,0.75)', color: '#f4a261', fontSize: '0.62rem', fontWeight: 800,
    padding: '2px 6px', borderRadius: '4px',
  },
  epInfo: { padding: '10px 10px 10px 0', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  epTitulo: { fontWeight: 800, fontSize: '0.85rem', color: '#eee', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
  epDuracao: { fontSize: '0.72rem', color: '#888' },

  // ── AVALIAÇÕES ──
  avaliacaoForm: { background: '#13131f', border: '1px solid #1e1e32', borderRadius: '12px', padding: '20px', marginBottom: '24px' },
  avaliacaoFormTitulo: { fontWeight: 900, marginBottom: '14px', color: '#eee' },
  estrelas: { display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' },
  estrela: {
    width: '34px', height: '34px', background: '#1e1e32', border: '1px solid #2a2a40',
    borderRadius: '6px', color: '#888', fontWeight: 800, fontSize: '0.82rem', fontFamily: 'inherit', cursor: 'pointer',
  },
  estrelaAtiva: { background: '#f4a261', borderColor: '#f4a261', color: '#0a0a0f' },
  textarea: {
    width: '100%', background: '#0d0d14', border: '1px solid #1e1e32', borderRadius: '8px',
    color: '#f0f0f0', padding: '12px', fontFamily: 'inherit', fontSize: '0.86rem',
    resize: 'vertical', marginBottom: '14px', outline: 'none',
  },
  btnEnviar: {
    background: '#e63946', color: '#fff', border: 'none', padding: '11px 22px',
    borderRadius: '8px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit',
  },
  avaliacaoItem: { display: 'flex', gap: '14px', padding: '16px', background: '#13131f', border: '1px solid #1e1e32', borderRadius: '10px', marginBottom: '10px' },
  avAvatar: {
    width: '38px', height: '38px', borderRadius: '50%', background: '#e63946',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0, color: '#fff',
  },
  avInfo: { flex: 1 },
  avHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' },
  avNome: { fontWeight: 800, fontSize: '0.88rem', color: '#eee' },
  avNota: { color: '#f4a261', fontWeight: 700, fontSize: '0.82rem' },
  avComentario: { fontSize: '0.86rem', color: '#bbb', lineHeight: 1.6 },
};