import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWindowSize }               from '../hooks/useWindowSize';
import { useAuth }                     from '../context/AuthContext';
import api                             from '../services/api';

function extrairVideoId(url) {
  if (!url) return null;
  const regexes = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ];
  for (const regex of regexes) {
    const match = url.match(regex);
    if (match) return match[1];
  }
  return null;
}

function formatarTempo(segundos) {
  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Player() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();
  const { isMobile } = useWindowSize();

  const [episodio,         setEpisodio]         = useState(null);
  const [proximoEp,        setProximoEp]        = useState(null);
  const [anteriorEp,       setAnteriorEp]       = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [segundosExibidos, setSegundosExibidos] = useState(0);
  const [concluido,        setConcluido]        = useState(false);
  const [salvando,         setSalvando]         = useState(false);
  const [playerPronto,     setPlayerPronto]     = useState(false);
  const [rodando,          setRodando]          = useState(false);

  const playerRef    = useRef(null); // Instância do YT.Player
  const intervaloRef = useRef(null);
  const segundosRef  = useRef(0);
  const episodioRef  = useRef(null); // Ref para usar dentro dos callbacks do YT

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        const { data: ep } = await api.get(`/animes/0/episodios/${id}`);
        setEpisodio(ep);
        episodioRef.current = ep;

        const { data: todos } = await api.get(`/animes/${ep.animeId}/episodios`);
        const index = todos.findIndex(e => e.id === ep.id);
        setAnteriorEp(index > 0              ? todos[index - 1] : null);
        setProximoEp( index < todos.length-1 ? todos[index + 1] : null);

        if (user) {
          const { data: prog } = await api.get(`/progresso/episodio/${ep.id}`);
          segundosRef.current = prog.segundos ?? 0;
          setSegundosExibidos(prog.segundos ?? 0);
          setConcluido(prog.concluido ?? false);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    carregar();

    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
      if (playerRef.current)    playerRef.current.destroy?.();
    };
  }, [id, user]);

  // Carrega a YouTube IFrame API e cria o player
  useEffect(() => {
  if (!episodio) return;

  const videoId = extrairVideoId(episodio.urlVideo);
  if (!videoId) return;

  let player;

  function criarPlayer() {
    // Garante que o elemento existe antes de criar o player
    if (!document.getElementById('yt-player')) return;

    player = new window.YT.Player('yt-player', {
      videoId,
      width:  '100%',
      height: '100%',
      playerVars: {
        rel:            0,
        modestbranding: 1,
        start: segundosRef.current > 10 ? Math.floor(segundosRef.current) : 0,
      },
      events: {
        onReady: () => {
          playerRef.current = player;
          setPlayerPronto(true);
        },
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            setRodando(true);
            // Evita criar múltiplos intervalos
            if (intervaloRef.current) clearInterval(intervaloRef.current);
            intervaloRef.current = setInterval(async () => {
              segundosRef.current += 1;
              setSegundosExibidos(prev => prev + 1);

              if (segundosRef.current % 30 === 0 && user && episodioRef.current) {
                try {
                  await api.post('/progresso', {
                    episodioId: episodioRef.current.id,
                    animeId:    episodioRef.current.animeId,
                    segundos:   segundosRef.current,
                    concluido:  false,
                  });
                } catch (err) {
                  console.error('Erro ao salvar progresso:', err);
                }
              }
            }, 1000);

          } else {
            setRodando(false);
            if (intervaloRef.current) {
              clearInterval(intervaloRef.current);
              intervaloRef.current = null;
            }

            if (event.data === window.YT.PlayerState.ENDED && user && episodioRef.current) {
              salvarProgresso(segundosRef.current, true);
            }
          }
        },
      },
    });
  }

  // Se a API já está carregada, cria o player direto
  if (window.YT && window.YT.Player) {
    criarPlayer();
  } else {
    // Carrega o script apenas se ainda não foi carregado
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src   = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
    window.onYouTubeIframeAPIReady = criarPlayer;
  }

  // Cleanup ao sair da página
  return () => {
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
  };
}, [episodio]);

  async function salvarProgresso(segundos, concluidoVal = false) {
    if (!user || !episodioRef.current) return;
    setSalvando(true);
    try {
      await api.post('/progresso', {
        episodioId: episodioRef.current.id,
        animeId:    episodioRef.current.animeId,
        segundos,
        concluido:  concluidoVal,
      });
      if (concluidoVal) setConcluido(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSalvando(false);
    }
  }

  async function marcarConcluido() {
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }
    await salvarProgresso(segundosRef.current, true);
    if (proximoEp) navigate(`/assistir/${proximoEp.id}`);
  }

  if (loading)   return <div style={s.loading}>Carregando player...</div>;
  if (!episodio) return <div style={s.loading}>Episódio não encontrado.</div>;

  const duracaoTotal = (episodio.duracao ?? 24) * 60;
  const porcentagem  = Math.min((segundosExibidos / duracaoTotal) * 100, 100);

  return (
    <div style={s.page}>

      {/* ── PLAYER ── */}
      <div style={s.playerWrap}>
        {/* Div onde o YT.Player vai ser injetado */}
        <div id="yt-player" style={s.ytPlayer} />
      </div>

      {/* ── BARRA DE PROGRESSO ── */}
      {user && (
        <div style={s.progressoWrap}>
          <div style={s.progressoBar}>
            <div style={{ ...s.progressoFill, width: `${porcentagem}%` }} />
          </div>
          <div style={s.progressoInfo}>
            <span style={s.progressoTexto}>
              {concluido
                ? '✓ Episódio concluído'
                : salvando
                ? '💾 Salvando...'
                : rodando
                ? `⏱ ${formatarTempo(segundosExibidos)} assistidos`
                : segundosExibidos > 0
                ? `⏸ ${formatarTempo(segundosExibidos)} assistidos (pausado)`
                : playerPronto
                ? '▶ Dê play para começar a salvar o progresso'
                : 'Carregando player...'
              }
            </span>
            <div style={s.progressoAcoes}>
              {!concluido && segundosExibidos > 0 && (
                <button style={s.btnConcluir} onClick={marcarConcluido}>
                  {proximoEp ? '✓ Concluído → Próximo EP' : '✓ Marcar como concluído'}
                </button>
              )}
              {concluido && proximoEp && (
                <button style={s.btnProximo} onClick={() => navigate(`/assistir/${proximoEp.id}`)}>
                  Próximo EP →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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

          {!user && (
            <div style={s.loginAviso}>
              <span>Faça login para salvar seu progresso automaticamente.</span>
              <button style={s.btnLogin} onClick={() => navigate('/login')}>Entrar</button>
            </div>
          )}
        </div>

        {/* ── NAVEGAÇÃO ── */}
        <div style={{ ...s.navEps, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
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

  playerWrap: { width: '100%', background: '#000', aspectRatio: '16/9', maxHeight: 'calc(100vh - 64px - 80px)' },
  ytPlayer:   { width: '100%', height: '100%' },

  progressoWrap: { background: '#0d0d14', borderBottom: '1px solid #1e1e32', padding: '12px 40px' },
  progressoBar:  { height: '4px', background: '#1e1e32', borderRadius: '2px', marginBottom: '10px', overflow: 'hidden' },
  progressoFill: { height: '100%', background: '#e63946', borderRadius: '2px', transition: 'width 0.5s' },
  progressoInfo: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' },
  progressoTexto:{ fontSize: '0.82rem', color: '#888', fontWeight: 700 },
  progressoAcoes:{ display: 'flex', gap: '10px' },

  btnConcluir: {
    background: '#52b788', color: '#fff', border: 'none',
    padding: '7px 16px', borderRadius: '6px', fontFamily: 'Nunito, sans-serif',
    fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer',
  },
  btnProximo: {
    background: '#e63946', color: '#fff', border: 'none',
    padding: '7px 16px', borderRadius: '6px', fontFamily: 'Nunito, sans-serif',
    fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer',
  },

  content:  { maxWidth: '900px' },
  infoWrap: { marginBottom: '28px' },

  breadcrumb: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', fontSize: '0.82rem', flexWrap: 'wrap' },
  breadLink:  { color: '#888', fontWeight: 700 },
  breadSep:   { color: '#1e1e32' },
  breadAtual: { color: '#f0f0f0', fontWeight: 700 },

  epTitulo: {
    fontFamily: '"Bebas Neue", sans-serif', fontSize: '2rem', letterSpacing: '2px',
    marginBottom: '10px', display: 'flex', alignItems: 'baseline',
    gap: '12px', flexWrap: 'wrap', color: '#f0f0f0',
  },
  epNumero:  { color: '#e63946', fontSize: '1rem', fontFamily: 'Nunito, sans-serif', fontWeight: 900 },
  epDesc:    { fontSize: '0.9rem', color: '#bbb', lineHeight: 1.65, marginBottom: '12px' },
  epDuracao: {
    display: 'inline-block', fontSize: '0.82rem', color: '#888',
    background: '#13131f', border: '1px solid #1e1e32',
    padding: '4px 12px', borderRadius: '999px',
  },

  loginAviso: {
    display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
    background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.2)',
    borderRadius: '8px', padding: '12px 16px', marginTop: '16px',
    fontSize: '0.85rem', color: '#bbb',
  },
  btnLogin: {
    background: '#e63946', color: '#fff', border: 'none',
    padding: '6px 16px', borderRadius: '6px', fontFamily: 'Nunito, sans-serif',
    fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', marginLeft: 'auto',
  },

  navEps:        { display: 'grid', gap: '12px', marginBottom: '24px' },
  navBtn:        { display: 'flex', alignItems: 'center', gap: '12px', background: '#13131f', border: '1px solid #1e1e32', borderRadius: '10px', padding: '14px 18px', cursor: 'pointer', textAlign: 'left', fontFamily: 'Nunito, sans-serif' },
  navBtnProximo: { justifyContent: 'flex-end', textAlign: 'right' },
  navSeta:       { fontSize: '1.2rem', color: '#e63946', flexShrink: 0 },
  navInfo:       { display: 'flex', flexDirection: 'column', gap: '3px' },
  navLabel:      { fontSize: '0.7rem', color: '#888', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' },
  navNome:       { fontSize: '0.85rem', color: '#f0f0f0', fontWeight: 800 },

  btnVoltar: {
    background: 'transparent', border: '1px solid #1e1e32', color: '#888',
    padding: '10px 20px', borderRadius: '8px', fontFamily: 'Nunito, sans-serif',
    fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
  },
};