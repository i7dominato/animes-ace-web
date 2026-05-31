import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Anime() {
  const { id }     = useParams();   // Pega o :id da URL
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const [anime,      setAnime]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [naLista,    setNaLista]    = useState(false);
  const [nota,       setNota]       = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando,   setEnviando]   = useState(false);
  const [abaAtiva,   setAbaAtiva]   = useState('episodios'); // episodios | avaliacoes

  useEffect(() => {
    async function carregar() {
      try {
        const { data } = await api.get(`/animes/${id}`);
        setAnime(data);

        // Se estiver logado, verifica se o anime está na lista do usuário
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

  async function toggleLista() {
    if (!user) { navigate('/login'); return; }
    try {
      if (naLista) {
        // Busca o item da lista para pegar o id
        const lista = await api.get('/users/lista');
        const item  = lista.data.find(i => i.animeId === anime.id);
        if (item) await api.delete(`/users/lista/${item.id}`);
        setNaLista(false);
      } else {
        await api.post('/users/lista', { animeId: anime.id, status: 'quero_ver' });
        setNaLista(true);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function enviarAvaliacao() {
    if (!user) { navigate('/login'); return; }
    if (nota === 0) return;
    setEnviando(true);
    try {
      await api.post(`/animes/${id}/avaliacoes`, { nota, comentario });
      // Recarrega o anime para mostrar a nova avaliação e nota atualizada
      const { data } = await api.get(`/animes/${id}`);
      setAnime(data);
      setComentario('');
    } catch (err) {
      console.error(err);
    } finally {
      setEnviando(false);
    }
  }

  if (loading) return <div style={s.loading}>Carregando...</div>;
  if (!anime)  return <div style={s.loading}>Anime não encontrado.</div>;

  return (
    <div style={s.page}>

      {/* ── HERO DO ANIME ── */}
      <div style={s.hero}>
        <div style={s.heroOverlay} />
        <div style={s.heroContent}>

          {/* Capa */}
          <div style={s.capa}>
            {anime.capa
              ? <img src={anime.capa} alt={anime.titulo} style={s.capaImg} />
              : <div style={s.capaPlaceholder}>🎌</div>
            }
          </div>

          {/* Info principal */}
          <div style={s.info}>
            <div style={s.generosTags}>
              {anime.generos.map(g => (
                <span key={g} style={s.generoTag}>{g}</span>
              ))}
            </div>

            <h1 style={s.titulo}>{anime.titulo}</h1>

            <div style={s.meta}>
              <span style={s.metaNota}>★ {anime.nota.toFixed(1)}</span>
              <span style={s.metaDot}>•</span>
              <span>{anime.ano}</span>
              <span style={s.metaDot}>•</span>
              <span style={{ color: anime.status === 'em_exibicao' ? '#52b788' : '#888' }}>
                {anime.status === 'em_exibicao' ? 'Em exibição' : 'Finalizado'}
              </span>
              <span style={s.metaDot}>•</span>
              <span>{anime._count.episodios} episódios</span>
            </div>

            <p style={s.sinopse}>{anime.sinopse}</p>

            {/* Botões de ação */}
            <div style={s.acoes}>
              {anime.episodios.length > 0 && (
                <button
                  style={s.btnPrimario}
                  onClick={() => navigate(`/assistir/${anime.episodios[0].id}`)}
                >
                  ▶ Assistir EP 1
                </button>
              )}
              <button
                style={{ ...s.btnSecundario, ...(naLista ? s.btnNaLista : {}) }}
                onClick={toggleLista}
              >
                {naLista ? '✓ Na minha lista' : '+ Minha lista'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── ABAS ── */}
      <div style={s.abas}>
        <button
          style={{ ...s.aba, ...(abaAtiva === 'episodios' ? s.abaAtiva : {}) }}
          onClick={() => setAbaAtiva('episodios')}
        >
          Episódios ({anime._count.episodios})
        </button>
        <button
          style={{ ...s.aba, ...(abaAtiva === 'avaliacoes' ? s.abaAtiva : {}) }}
          onClick={() => setAbaAtiva('avaliacoes')}
        >
          Avaliações ({anime._count.avaliacoes})
        </button>
      </div>

      {/* ── ABA EPISÓDIOS ── */}
      {abaAtiva === 'episodios' && (
        <div style={s.listaWrap}>
          {anime.episodios.length === 0 ? (
            <div style={s.vazio}>Nenhum episódio cadastrado ainda.</div>
          ) : (
            anime.episodios.map(ep => (
              <div
                key={ep.id}
                style={s.epItem}
                onClick={() => navigate(`/assistir/${ep.id}`)}
              >
                <div style={s.epNumero}>{String(ep.numero).padStart(2, '0')}</div>
                <div style={s.epInfo}>
                  <div style={s.epTitulo}>{ep.titulo}</div>
                  {ep.descricao && <div style={s.epDesc}>{ep.descricao}</div>}
                </div>
                {ep.duracao && (
                  <div style={s.epDuracao}>{ep.duracao} min</div>
                )}
                <div style={s.epPlay}>▶</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── ABA AVALIAÇÕES ── */}
      {abaAtiva === 'avaliacoes' && (
        <div style={s.listaWrap}>

          {/* Formulário de avaliação */}
          {user && (
            <div style={s.avaliacaoForm}>
              <div style={s.avaliacaoFormTitulo}>Sua avaliação</div>

              {/* Estrelas clicáveis */}
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
                style={{ ...s.btnPrimario, opacity: nota === 0 || enviando ? 0.5 : 1 }}
                onClick={enviarAvaliacao}
                disabled={nota === 0 || enviando}
              >
                {enviando ? 'Enviando...' : 'Enviar avaliação'}
              </button>
            </div>
          )}

          {/* Lista de avaliações */}
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

// ── ESTILOS ────────────────────────────────────────────
const s = {
  page:    { paddingTop: '64px', minHeight: '100vh' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#888' },

  // Hero
  hero: {
    position:   'relative',
    padding:    '48px 40px',
    background: 'linear-gradient(135deg, #0d0d14 0%, #1a0520 60%, #0d0d14 100%)',
    borderBottom: '1px solid #1e1e32',
  },
  heroOverlay: {
    position: 'absolute',
    inset:    0,
    background: 'rgba(13,13,20,0.4)',
  },
  heroContent: {
    position:  'relative',
    zIndex:    2,
    display:   'flex',
    gap:       '40px',
    maxWidth:  '900px',
  },

  // Capa
  capa: {
    flexShrink:   0,
    width:        '200px',
    aspectRatio:  '3/4',
    borderRadius: '12px',
    overflow:     'hidden',
    border:       '1px solid #1e1e32',
  },
  capaImg:         { width: '100%', height: '100%', objectFit: 'cover' },
  capaPlaceholder: {
    width: '100%', height: '100%',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       '4rem',
    background:     'linear-gradient(135deg, #1a1a2e, #0d0d14)',
  },

  // Info
  info:        { flex: 1 },
  generosTags: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' },
  generoTag: {
    background:   'rgba(230,57,70,0.15)',
    color:        '#e63946',
    border:       '1px solid rgba(230,57,70,0.3)',
    padding:      '3px 10px',
    borderRadius: '4px',
    fontSize:     '0.75rem',
    fontWeight:   800,
  },
  titulo: {
    fontFamily:    '"Bebas Neue", sans-serif',
    fontSize:      'clamp(2rem, 5vw, 3.5rem)',
    letterSpacing: '2px',
    marginBottom:  '10px',
    lineHeight:    1,
  },
  meta: {
    display:      'flex',
    alignItems:   'center',
    gap:          '10px',
    fontSize:     '0.88rem',
    color:        '#888',
    marginBottom: '16px',
    flexWrap:     'wrap',
  },
  metaNota: { color: '#f4a261', fontWeight: 900 },
  metaDot:  { color: '#e63946' },
  sinopse: {
    fontSize:     '0.92rem',
    color:        '#bbb',
    lineHeight:   1.7,
    marginBottom: '24px',
    maxWidth:     '560px',
  },
  acoes: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  btnPrimario: {
    background:   '#e63946',
    color:        '#fff',
    border:       'none',
    padding:      '12px 24px',
    borderRadius: '8px',
    fontWeight:   800,
    fontSize:     '0.92rem',
    fontFamily:   'inherit',
    cursor:       'pointer',
  },
  btnSecundario: {
    background:   'rgba(255,255,255,0.07)',
    color:        '#f0f0f0',
    border:       '1px solid rgba(255,255,255,0.15)',
    padding:      '12px 24px',
    borderRadius: '8px',
    fontWeight:   700,
    fontSize:     '0.92rem',
    fontFamily:   'inherit',
    cursor:       'pointer',
  },
  btnNaLista: {
    background:  'rgba(82,183,136,0.15)',
    borderColor: '#52b788',
    color:       '#52b788',
  },

  // Abas
  abas: {
    display:      'flex',
    gap:          '4px',
    padding:      '0 40px',
    borderBottom: '1px solid #1e1e32',
    marginTop:    '8px',
  },
  aba: {
    background:    'transparent',
    border:        'none',
    borderBottom:  '2px solid transparent',
    color:         '#888',
    padding:       '16px 20px',
    fontFamily:    'inherit',
    fontWeight:    700,
    fontSize:      '0.9rem',
    cursor:        'pointer',
    transition:    'all 0.2s',
    marginBottom:  '-1px',
  },
  abaAtiva: {
    color:        '#f0f0f0',
    borderColor:  '#e63946',
  },

  // Lista
  listaWrap: { padding: '24px 40px 48px', maxWidth: '800px' },
  vazio:     { color: '#888', padding: '32px 0', textAlign: 'center' },

  // Episódios
  epItem: {
    display:      'flex',
    alignItems:   'center',
    gap:          '16px',
    padding:      '16px',
    background:   '#13131f',
    border:       '1px solid #1e1e32',
    borderRadius: '10px',
    marginBottom: '10px',
    cursor:       'pointer',
    transition:   'border-color 0.2s, background 0.2s',
  },
  epNumero: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize:   '1.5rem',
    color:      '#1e1e32',
    minWidth:   '36px',
  },
  epInfo:   { flex: 1 },
  epTitulo: { fontWeight: 800, fontSize: '0.9rem', marginBottom: '3px' },
  epDesc:   { fontSize: '0.78rem', color: '#888' },
  epDuracao:{ fontSize: '0.75rem', color: '#888' },
  epPlay: {
    width:          '36px',
    height:         '36px',
    background:     '#e63946',
    borderRadius:   '50%',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       '0.85rem',
    color:          '#fff',
    flexShrink:     0,
  },

  // Avaliações
  avaliacaoForm: {
    background:   '#13131f',
    border:       '1px solid #1e1e32',
    borderRadius: '12px',
    padding:      '20px',
    marginBottom: '24px',
  },
  avaliacaoFormTitulo: { fontWeight: 900, marginBottom: '14px' },
  estrelas: { display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' },
  estrela: {
    width:        '36px',
    height:       '36px',
    background:   '#1e1e32',
    border:       '1px solid #2a2a40',
    borderRadius: '6px',
    color:        '#888',
    fontWeight:   800,
    fontSize:     '0.85rem',
    fontFamily:   'inherit',
    cursor:       'pointer',
    transition:   'all 0.15s',
  },
  estrelaAtiva: { background: '#f4a261', borderColor: '#f4a261', color: '#fff' },
  textarea: {
    width:        '100%',
    background:   '#0d0d14',
    border:       '1px solid #1e1e32',
    borderRadius: '8px',
    color:        '#f0f0f0',
    padding:      '12px',
    fontFamily:   'inherit',
    fontSize:     '0.88rem',
    resize:       'vertical',
    marginBottom: '14px',
    outline:      'none',
  },
  avaliacaoItem: {
    display:      'flex',
    gap:          '14px',
    padding:      '16px',
    background:   '#13131f',
    border:       '1px solid #1e1e32',
    borderRadius: '10px',
    marginBottom: '10px',
  },
  avAvatar: {
    width:          '40px',
    height:         '40px',
    borderRadius:   '50%',
    background:     '#e63946',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontWeight:     900,
    flexShrink:     0,
  },
  avInfo:   { flex: 1 },
  avHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' },
  avNome:   { fontWeight: 800, fontSize: '0.9rem' },
  avNota:   { color: '#f4a261', fontWeight: 700, fontSize: '0.85rem' },
  avComentario: { fontSize: '0.88rem', color: '#bbb', lineHeight: 1.6 },
};