import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWindowSize }               from '../hooks/useWindowSize';
import { useAuth }                     from '../context/AuthContext';
import api                             from '../services/api';
import { useSEO }                      from '../hooks/useSEO';
import { SkeletonPlayer } from '../components/Skeleton';

function extrairVideoIdYoutube(url) {
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

function extrairVideoIdDailymotion(url) {
  if (!url) return null;
  const regexes = [
    /dailymotion\.com\/video\/([^_?]+)/,
    /dai\.ly\/([^_?]+)/,
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

function formatarData(data) {
  return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
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
  const [fonteAtiva,       setFonteAtiva]       = useState('youtube');
  const [trocaAutomatica,  setTrocaAutomatica]  = useState(false);

  // Comentários
  const [comentarios,    setComentarios]    = useState([]);
  const [textoComent,    setTextoComent]    = useState('');
  const [enviandoComent, setEnviandoComent] = useState(false);
  const [respostaAberta, setRespostaAberta] = useState(null); // id do comentário sendo respondido
  const [textoResposta,  setTextoResposta]  = useState('');

  const playerRef    = useRef(null);
  const intervaloRef = useRef(null);
  const segundosRef  = useRef(0);
  const episodioRef  = useRef(null);

  useSEO({ titulo: episodio ? `EP ${episodio.numero} — ${episodio.titulo}` : 'Player' });

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        const { data: ep } = await api.get(`/animes/0/episodios/${id}`);
        setEpisodio(ep);
        episodioRef.current = ep;
        setFonteAtiva(ep.fontePrincipal === 'dailymotion' ? 'dailymotion' : 'youtube');

        const { data: todos } = await api.get(`/animes/${ep.animeId}/episodios`);
        const index = todos.findIndex(e => e.id === ep.id);
        setAnteriorEp(index > 0              ? todos[index - 1] : null);
        setProximoEp( index < todos.length-1 ? todos[index + 1] : null);

        if (user) {
          try {
            const { data: prog } = await api.get(`/progresso/episodio/${ep.id}`);
            segundosRef.current = prog.segundos ?? 0;
            setSegundosExibidos(prog.segundos ?? 0);
            setConcluido(prog.concluido ?? false);
          } catch { segundosRef.current = 0; }
        }

        // Carrega comentários
        const { data: comentsData } = await api.get(`/episodios/${ep.id}/comentarios`);
        setComentarios(comentsData);

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

  useEffect(() => {
    if (!episodio || fonteAtiva !== 'youtube') return;

    const videoId = extrairVideoIdYoutube(episodio.urlVideo);
    if (!videoId) {
      if (episodio.urlVideoAlt) { setFonteAtiva('dailymotion'); setTrocaAutomatica(true); }
      return;
    }

    let player;

    function criarPlayer(tentativas = 0) {
      if (!document.getElementById('yt-player')) {
        if (tentativas < 10) setTimeout(() => criarPlayer(tentativas + 1), 200);
        return;
      }
      player = new window.YT.Player('yt-player', {
        videoId, width: '100%', height: '100%',
        playerVars: { rel: 0, modestbranding: 1, start: segundosRef.current > 10 ? Math.floor(segundosRef.current) : 0 },
        events: {
          onReady: () => { playerRef.current = player; setPlayerPronto(true); },
          onError: () => { if (episodio.urlVideoAlt) { setFonteAtiva('dailymotion'); setTrocaAutomatica(true); } },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setRodando(true);
              if (intervaloRef.current) clearInterval(intervaloRef.current);
              intervaloRef.current = setInterval(async () => {
                segundosRef.current += 1;
                setSegundosExibidos(prev => prev + 1);
                if (segundosRef.current % 30 === 0 && user && episodioRef.current) {
                  try {
                    await api.post('/progresso', { episodioId: episodioRef.current.id, animeId: episodioRef.current.animeId, segundos: segundosRef.current, concluido: false });
                  } catch (err) { console.error(err); }
                }
              }, 1000);
            } else {
              setRodando(false);
              if (intervaloRef.current) { clearInterval(intervaloRef.current); intervaloRef.current = null; }
              if (event.data === window.YT.PlayerState.ENDED && user && episodioRef.current) salvarProgresso(segundosRef.current, true);
            }
          },
        },
      });
    }

    if (window.YT && window.YT.Player) { criarPlayer(); }
    else {
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement('script'); tag.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = criarPlayer;
    }

    return () => {
      if (intervaloRef.current) { clearInterval(intervaloRef.current); intervaloRef.current = null; }
      if (playerRef.current) { playerRef.current.destroy?.(); playerRef.current = null; }
    };
  }, [episodio, fonteAtiva]);

  async function salvarProgresso(segundos, concluidoVal = false) {
    if (!user || !episodioRef.current) return;
    setSalvando(true);
    try {
      await api.post('/progresso', { episodioId: episodioRef.current.id, animeId: episodioRef.current.animeId, segundos, concluido: concluidoVal });
      if (concluidoVal) setConcluido(true);
    } catch (err) { console.error(err); }
    finally { setSalvando(false); }
  }

  async function marcarConcluido() {
    if (intervaloRef.current) { clearInterval(intervaloRef.current); intervaloRef.current = null; }
    await salvarProgresso(segundosRef.current, true);
    if (proximoEp) navigate(`/assistir/${proximoEp.id}`);
  }

  function trocarFonte(fonte) {
    if (fonte === fonteAtiva) return;
    if (intervaloRef.current) { clearInterval(intervaloRef.current); intervaloRef.current = null; }
    if (playerRef.current) { playerRef.current.destroy?.(); playerRef.current = null; }
    setTrocaAutomatica(false); setPlayerPronto(false); setRodando(false); setFonteAtiva(fonte);
  }

  // ── COMENTÁRIOS ──────────────────────────────────────
  async function enviarComentario() {
    if (!textoComent.trim() || !user) return;
    setEnviandoComent(true);
    try {
      const { data } = await api.post(`/episodios/${episodio.id}/comentarios`, { texto: textoComent });
      setComentarios(prev => [{ ...data, respostas: [] }, ...prev]);
      setTextoComent('');
    } catch (err) { console.error(err); }
    finally { setEnviandoComent(false); }
  }

  async function enviarResposta(comentarioPaiId) {
    if (!textoResposta.trim() || !user) return;
    setEnviandoComent(true);
    try {
      const { data } = await api.post(`/episodios/${episodio.id}/comentarios`, { texto: textoResposta, respostaDeId: comentarioPaiId });
      setComentarios(prev => prev.map(c =>
        c.id === comentarioPaiId ? { ...c, respostas: [...(c.respostas ?? []), data] } : c
      ));
      setTextoResposta('');
      setRespostaAberta(null);
    } catch (err) { console.error(err); }
    finally { setEnviandoComent(false); }
  }

  async function deletarComentario(comentarioId, paiId = null) {
    if (!confirm('Remover este comentário?')) return;
    try {
      await api.delete(`/episodios/${episodio.id}/comentarios/${comentarioId}`);
      if (paiId) {
        setComentarios(prev => prev.map(c =>
          c.id === paiId ? { ...c, respostas: c.respostas.filter(r => r.id !== comentarioId) } : c
        ));
      } else {
        setComentarios(prev => prev.filter(c => c.id !== comentarioId));
      }
    } catch (err) { console.error(err); }
  }

  if (loading)   return <SkeletonPlayer isMobile={isMobile} />;
  if (!episodio) return <div style={s.loading}>Episódio não encontrado.</div>;

  const duracaoTotal  = (episodio.duracao ?? 24) * 60;
  const porcentagem   = Math.min((segundosExibidos / duracaoTotal) * 100, 100);
  const dailymotionId = extrairVideoIdDailymotion(episodio.urlVideoAlt);
  const temFonteAlt   = Boolean(episodio.urlVideoAlt);

  return (
    <div style={s.page}>

      {/* ── PLAYER ── */}
      <div style={s.playerWrap}>
        {fonteAtiva === 'youtube'
          ? <div id="yt-player" style={s.ytPlayer} />
          : dailymotionId
            ? <iframe style={s.iframe} src={`https://www.dailymotion.com/embed/video/${dailymotionId}`} title={episodio.titulo} allowFullScreen allow="autoplay" frameBorder="0" />
            : <div style={s.semVideo}><span style={{ fontSize: '3rem' }}>📺</span><p>Vídeo não disponível.</p></div>
        }
      </div>

      {/* ── SELETOR DE FONTE ── */}
      {temFonteAlt && (
        <div style={s.fonteWrap}>
          {trocaAutomatica && <span style={s.fonteAviso}>⚠ Trocado automaticamente — fonte principal falhou</span>}
          <div style={s.fonteBotoes}>
            <button style={{ ...s.fonteBtn, ...(fonteAtiva === 'youtube'     ? s.fonteBtnAtivo : {}) }} onClick={() => trocarFonte('youtube')}>▶ YouTube</button>
            <button style={{ ...s.fonteBtn, ...(fonteAtiva === 'dailymotion' ? s.fonteBtnAtivo : {}) }} onClick={() => trocarFonte('dailymotion')}>▶ Dailymotion</button>
          </div>
        </div>
      )}

      {/* ── BARRA DE PROGRESSO ── */}
      {user && (
        <div style={s.progressoWrap}>
          <div style={s.progressoBar}><div style={{ ...s.progressoFill, width: `${porcentagem}%` }} /></div>
          <div style={s.progressoInfo}>
            <span style={s.progressoTexto}>
              {concluido ? '✓ Episódio concluído' : salvando ? '💾 Salvando...' : fonteAtiva === 'dailymotion' ? 'Marque manualmente ao terminar' : rodando ? `⏱ ${formatarTempo(segundosExibidos)} assistidos` : segundosExibidos > 0 ? `⏸ ${formatarTempo(segundosExibidos)} (pausado)` : playerPronto ? '▶ Dê play para salvar o progresso' : 'Carregando...'}
            </span>
            <div style={s.progressoAcoes}>
              {!concluido && (segundosExibidos > 0 || fonteAtiva === 'dailymotion') && (
                <button style={s.btnConcluir} onClick={marcarConcluido}>{proximoEp ? '✓ Concluído → Próximo EP' : '✓ Marcar como concluído'}</button>
              )}
              {concluido && proximoEp && (
                <button style={s.btnProximo} onClick={() => navigate(`/assistir/${proximoEp.id}`)}>Próximo EP →</button>
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
            <Link to={`/anime/${episodio.animeId}`} style={s.breadLink}>{episodio.anime.titulo}</Link>
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
              <span>Faça login para salvar seu progresso e comentar.</span>
              <button style={s.btnLogin} onClick={() => navigate('/login')}>Entrar</button>
            </div>
          )}
        </div>

        {/* ── NAVEGAÇÃO ── */}
        <div style={{ ...s.navEps, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
          {anteriorEp ? (
            <button style={s.navBtn} onClick={() => navigate(`/assistir/${anteriorEp.id}`)}>
              <span style={s.navSeta}>←</span>
              <div style={s.navInfo}><span style={s.navLabel}>Episódio anterior</span><span style={s.navNome}>EP {anteriorEp.numero} — {anteriorEp.titulo}</span></div>
            </button>
          ) : <div />}
          {proximoEp && (
            <button style={{ ...s.navBtn, ...s.navBtnProximo }} onClick={() => navigate(`/assistir/${proximoEp.id}`)}>
              <div style={s.navInfo}><span style={s.navLabel}>Próximo episódio</span><span style={s.navNome}>EP {proximoEp.numero} — {proximoEp.titulo}</span></div>
              <span style={s.navSeta}>→</span>
            </button>
          )}
        </div>

        <div style={{ marginBottom: '32px' }}>
          <button style={s.btnVoltar} onClick={() => navigate(`/anime/${episodio.animeId}`)}>
            ← Voltar para {episodio.anime.titulo}
          </button>
        </div>

        {/* ══════════ COMENTÁRIOS ══════════ */}
        <div style={s.comentariosWrap}>
          <div style={s.comentariosHeader}>
            <span style={s.secaoBarra} />
            <h2 style={s.comentariosTitulo}>Comentários</h2>
            <span style={s.comentariosCount}>{comentarios.length}</span>
          </div>

          {/* Caixa de novo comentário */}
          {user ? (
            <div style={s.novoComentBox}>
              <div style={s.novoComentAvatar}>{user.nome[0].toUpperCase()}</div>
              <div style={s.novoComentRight}>
                <textarea
                  style={s.novoComentInput}
                  placeholder="Escreva um comentário sobre este episódio..."
                  value={textoComent}
                  onChange={e => setTextoComent(e.target.value)}
                  rows={3}
                />
                <div style={s.novoComentAcoes}>
                  <span style={s.novoComentDica}>Seja respeitoso com outros usuários</span>
                  <button
                    style={{ ...s.btnEnviarComent, opacity: !textoComent.trim() || enviandoComent ? 0.5 : 1 }}
                    onClick={enviarComentario}
                    disabled={!textoComent.trim() || enviandoComent}
                  >
                    {enviandoComent ? 'Enviando...' : 'Comentar'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={s.loginParaComent}>
              <span>Faça login para deixar um comentário.</span>
              <button style={s.btnLoginPeq} onClick={() => navigate('/login')}>Entrar</button>
            </div>
          )}

          {/* Lista de comentários */}
          {comentarios.length === 0 ? (
            <div style={s.comentariosVazio}>
              Nenhum comentário ainda. Seja o primeiro a comentar!
            </div>
          ) : (
            <div style={s.comentariosList}>
              {comentarios.map(coment => (
                <div key={coment.id} style={s.comentarioItem}>

                  {/* Comentário principal */}
                  <div style={s.comentarioMain}>
                    <div style={s.comentAvatar}>{coment.user.nome[0].toUpperCase()}</div>
                    <div style={s.comentBody}>
                      <div style={s.comentHeader}>
                        <span style={s.comentNome}>{coment.user.nome}</span>
                        <span style={s.comentData}>{formatarData(coment.criadoEm)}</span>
                      </div>
                      <p style={s.comentTexto}>{coment.texto}</p>
                      <div style={s.comentAcoes}>
                        {user && (
                          <button style={s.btnResponder} onClick={() => setRespostaAberta(respostaAberta === coment.id ? null : coment.id)}>
                            {respostaAberta === coment.id ? 'Cancelar' : '↩ Responder'}
                          </button>
                        )}
                        {user && (user.id === coment.user.id || user.isAdmin) && (
                          <button style={s.btnDeletarComent} onClick={() => deletarComentario(coment.id)}>✕</button>
                        )}
                      </div>

                      {/* Caixa de resposta */}
                      {respostaAberta === coment.id && user && (
                        <div style={s.respostaBox}>
                          <div style={s.novoComentAvatar}>{user.nome[0].toUpperCase()}</div>
                          <div style={s.novoComentRight}>
                            <textarea
                              style={{ ...s.novoComentInput, minHeight: '70px' }}
                              placeholder={`Respondendo a ${coment.user.nome}...`}
                              value={textoResposta}
                              onChange={e => setTextoResposta(e.target.value)}
                              rows={2}
                              autoFocus
                            />
                            <div style={s.novoComentAcoes}>
                              <span />
                              <button
                                style={{ ...s.btnEnviarComent, opacity: !textoResposta.trim() || enviandoComent ? 0.5 : 1 }}
                                onClick={() => enviarResposta(coment.id)}
                                disabled={!textoResposta.trim() || enviandoComent}
                              >
                                {enviandoComent ? 'Enviando...' : 'Responder'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Respostas */}
                  {coment.respostas?.length > 0 && (
                    <div style={s.respostasList}>
                      {coment.respostas.map(resp => (
                        <div key={resp.id} style={s.respostaItem}>
                          <div style={s.comentAvatarSm}>{resp.user.nome[0].toUpperCase()}</div>
                          <div style={s.comentBody}>
                            <div style={s.comentHeader}>
                              <span style={s.comentNome}>{resp.user.nome}</span>
                              <span style={s.comentData}>{formatarData(resp.criadoEm)}</span>
                            </div>
                            <p style={s.comentTexto}>{resp.texto}</p>
                            {user && (user.id === resp.user.id || user.isAdmin) && (
                              <button style={s.btnDeletarComent} onClick={() => deletarComentario(resp.id, coment.id)}>✕ Remover</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ height: '56px' }} />
      </div>
    </div>
  );
}

const s = {
  page:    { paddingTop: '64px', minHeight: '100vh', background: '#0a0a0f' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#888' },

  playerWrap: { width: '100%', background: '#000', aspectRatio: '16/9', maxHeight: 'calc(100vh - 64px - 80px)' },
  ytPlayer:   { width: '100%', height: '100%' },
  iframe:     { width: '100%', height: '100%', border: 'none', display: 'block' },
  semVideo:   { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#888', background: '#0a0a0f' },

  fonteWrap:    { background: '#0d0d14', borderBottom: '1px solid #1e1e32', padding: '10px 40px', display: 'flex', flexDirection: 'column', gap: '6px' },
  fonteAviso:   { fontSize: '0.75rem', color: '#f4a261', fontWeight: 700 },
  fonteBotoes:  { display: 'flex', gap: '8px' },
  fonteBtn:     { background: '#13131f', border: '1px solid #1e1e32', color: '#888', padding: '6px 14px', borderRadius: '6px', fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' },
  fonteBtnAtivo:{ background: 'rgba(230,57,70,0.15)', borderColor: '#e63946', color: '#e63946' },

  progressoWrap: { background: '#0d0d14', borderBottom: '1px solid #1e1e32', padding: '12px 40px' },
  progressoBar:  { height: '4px', background: '#1e1e32', borderRadius: '2px', marginBottom: '10px', overflow: 'hidden' },
  progressoFill: { height: '100%', background: '#e63946', borderRadius: '2px', transition: 'width 0.5s' },
  progressoInfo: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' },
  progressoTexto:{ fontSize: '0.82rem', color: '#888', fontWeight: 700 },
  progressoAcoes:{ display: 'flex', gap: '10px' },
  btnConcluir:   { background: '#52b788', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: '6px', fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' },
  btnProximo:    { background: '#e63946', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: '6px', fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' },

  content:  { maxWidth: '900px' },
  infoWrap: { marginBottom: '24px' },

  breadcrumb: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', fontSize: '0.82rem', flexWrap: 'wrap' },
  breadLink:  { color: '#888', fontWeight: 700 },
  breadSep:   { color: '#1e1e32' },
  breadAtual: { color: '#f0f0f0', fontWeight: 700 },

  epTitulo: { fontFamily: '"Bebas Neue", sans-serif', fontSize: '2rem', letterSpacing: '2px', marginBottom: '10px', display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap', color: '#f0f0f0' },
  epNumero: { color: '#e63946', fontSize: '1rem', fontFamily: 'Nunito, sans-serif', fontWeight: 900 },
  epDesc:   { fontSize: '0.9rem', color: '#bbb', lineHeight: 1.65, marginBottom: '12px' },
  epDuracao:{ display: 'inline-block', fontSize: '0.82rem', color: '#888', background: '#13131f', border: '1px solid #1e1e32', padding: '4px 12px', borderRadius: '999px' },

  loginAviso: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.2)', borderRadius: '8px', padding: '12px 16px', marginTop: '16px', fontSize: '0.85rem', color: '#bbb' },
  btnLogin:   { background: '#e63946', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '6px', fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', marginLeft: 'auto' },

  navEps:       { display: 'grid', gap: '12px', marginBottom: '24px' },
  navBtn:       { display: 'flex', alignItems: 'center', gap: '12px', background: '#13131f', border: '1px solid #1e1e32', borderRadius: '10px', padding: '14px 18px', cursor: 'pointer', textAlign: 'left', fontFamily: 'Nunito, sans-serif' },
  navBtnProximo:{ justifyContent: 'flex-end', textAlign: 'right' },
  navSeta:      { fontSize: '1.2rem', color: '#e63946', flexShrink: 0 },
  navInfo:      { display: 'flex', flexDirection: 'column', gap: '3px' },
  navLabel:     { fontSize: '0.7rem', color: '#888', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' },
  navNome:      { fontSize: '0.85rem', color: '#f0f0f0', fontWeight: 800 },
  btnVoltar:    { background: 'transparent', border: '1px solid #1e1e32', color: '#888', padding: '10px 20px', borderRadius: '8px', fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' },

  // ── COMENTÁRIOS ──
  comentariosWrap:   { borderTop: '1px solid #1e1e32', paddingTop: '28px' },
  comentariosHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' },
  secaoBarra:        { width: '4px', height: '20px', background: '#e63946', borderRadius: '2px', display: 'inline-block' },
  comentariosTitulo: { fontFamily: '"Bebas Neue", sans-serif', fontSize: '1.4rem', letterSpacing: '1.5px', color: '#fff' },
  comentariosCount:  { background: '#1e1e32', color: '#aaa', fontSize: '0.75rem', fontWeight: 800, padding: '2px 9px', borderRadius: '999px' },

  novoComentBox:   { display: 'flex', gap: '12px', marginBottom: '28px' },
  novoComentAvatar:{ width: '36px', height: '36px', borderRadius: '50%', background: '#e63946', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.88rem', color: '#fff', flexShrink: 0, marginTop: '2px' },
  novoComentRight: { flex: 1, minWidth: 0 },
  novoComentInput: { width: '100%', background: '#13131f', border: '1px solid #1e1e32', borderRadius: '10px', color: '#f0f0f0', padding: '12px 14px', fontFamily: 'Nunito, sans-serif', fontSize: '0.88rem', resize: 'vertical', outline: 'none', marginBottom: '8px' },
  novoComentAcoes: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  novoComentDica:  { fontSize: '0.72rem', color: '#555' },
  btnEnviarComent: { background: '#e63946', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '7px', fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' },

  loginParaComent: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: '#13131f', border: '1px solid #1e1e32', borderRadius: '10px', padding: '14px 18px', marginBottom: '24px', color: '#888', fontSize: '0.85rem' },
  btnLoginPeq:     { background: '#e63946', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: '6px', fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' },

  comentariosVazio: { color: '#888', textAlign: 'center', padding: '32px 0', background: '#13131f', borderRadius: '10px', border: '1px solid #1e1e32' },
  comentariosList:  { display: 'flex', flexDirection: 'column', gap: '0' },

  comentarioItem: { borderBottom: '1px solid #1e1e32', paddingBottom: '20px', marginBottom: '20px' },
  comentarioMain: { display: 'flex', gap: '12px' },
  comentAvatar:   { width: '36px', height: '36px', borderRadius: '50%', background: '#e63946', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.88rem', color: '#fff', flexShrink: 0 },
  comentAvatarSm: { width: '30px', height: '30px', borderRadius: '50%', background: '#4cc9f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.75rem', color: '#0a0a0f', flexShrink: 0 },
  comentBody:     { flex: 1, minWidth: 0 },
  comentHeader:   { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' },
  comentNome:     { fontWeight: 800, fontSize: '0.85rem', color: '#eee' },
  comentData:     { fontSize: '0.72rem', color: '#666' },
  comentTexto:    { fontSize: '0.88rem', color: '#bbb', lineHeight: 1.6, marginBottom: '8px' },
  comentAcoes:    { display: 'flex', gap: '10px', alignItems: 'center' },
  btnResponder:   { background: 'transparent', border: 'none', color: '#888', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' },
  btnDeletarComent:{ background: 'transparent', border: 'none', color: '#e63946', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' },

  respostaBox:   { display: 'flex', gap: '10px', marginTop: '12px', paddingLeft: '4px' },
  respostasList: { marginLeft: '48px', marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '2px solid #1e1e32', paddingLeft: '16px' },
  respostaItem:  { display: 'flex', gap: '10px' },
};