import { useState, useEffect }  from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth }               from '../context/AuthContext';
import api                       from '../services/api';

const GENEROS_OPCOES = ['Ação', 'Aventura', 'Romance', 'Comédia', 'Terror', 'Fantasia', 'Esportes', 'Sci-Fi', 'Mistério', 'Slice of Life', 'Sobrenatural', 'Drama', 'Musical'];

export default function AdminAnimeForm() {
  const { isAdmin }  = useAuth();
  const navigate     = useNavigate();
  const { id }       = useParams();
  const editando     = Boolean(id);

  const [form, setForm] = useState({
    titulo:  '',
    sinopse: '',
    capa:    '',
    ano:     new Date().getFullYear(),
    status:  'em_exibicao',
    generos: [],
  });

  const [episodios, setEpisodios] = useState([{
    numero: 1, titulo: '', urlVideo: '', urlVideoAlt: '', fontePrincipal: 'youtube', duracao: ''
  }]);
  const [episodiosExist,  setEpisodiosExist]  = useState([]);
  const [salvando,        setSalvando]        = useState(false);
  const [carregando,      setCarregando]      = useState(editando);
  const [erro,            setErro]            = useState('');
  const [sucesso,         setSucesso]         = useState('');
  const [buscaJikan,      setBuscaJikan]      = useState('');
  const [resultadosJikan, setResultadosJikan] = useState([]);
  const [buscando,        setBuscando]        = useState(false);

 useEffect(() => {
  if (!isAdmin) navigate('/');
}, [isAdmin]);
  useEffect(() => {
    if (!editando) return;
    async function carregarAnime() {
      try {
        const { data } = await api.get(`/animes/${id}`);
        setForm({
          titulo:  data.titulo,
          sinopse: data.sinopse,
          capa:    data.capa ?? '',
          ano:     data.ano,
          status:  data.status,
          generos: data.generos,
        });
        setEpisodiosExist(data.episodios ?? []);
      } catch (err) {
        setErro('Erro ao carregar anime.');
      } finally {
        setCarregando(false);
      }
    }
    carregarAnime();
  }, [id]);

  function handleForm(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
  }

  function toggleGenero(genero) {
    setForm(prev => ({
      ...prev,
      generos: prev.generos.includes(genero)
        ? prev.generos.filter(g => g !== genero)
        : [...prev.generos, genero],
    }));
  }

  function addEpisodio() {
    const proximoNum = editando
      ? (episodiosExist.length + episodios.length + 1)
      : (episodios.length + 1);
    setEpisodios(prev => [...prev, {
      numero: proximoNum, titulo: '', urlVideo: '', urlVideoAlt: '', fontePrincipal: 'youtube', duracao: ''
    }]);
  }

  function removeEpisodio(index) {
    setEpisodios(prev => prev.filter((_, i) => i !== index));
  }

  function handleEpisodio(index, campo, valor) {
    setEpisodios(prev => prev.map((ep, i) => {
      if (i !== index) return ep;
      const atualizado = { ...ep, [campo]: valor };
      // Se removeu a URL alternativa enquanto Dailymotion estava selecionado, volta pro YouTube
      if (campo === 'urlVideoAlt' && !valor && atualizado.fontePrincipal === 'dailymotion') {
        atualizado.fontePrincipal = 'youtube';
      }
      return atualizado;
    }));
  }

  async function deletarEpisodioExist(epId) {
    if (!confirm('Remover este episódio?')) return;
    try {
      await api.delete(`/animes/${id}/episodios/${epId}`);
      setEpisodiosExist(prev => prev.filter(ep => ep.id !== epId));
    } catch (err) {
      setErro('Erro ao remover episódio.');
    }
  }

  async function buscarNoJikan() {
    if (!buscaJikan.trim()) return;
    setBuscando(true);
    setResultadosJikan([]);
    try {
      const res  = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(buscaJikan)}&limit=6`);
      const data = await res.json();
      setResultadosJikan(data.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setBuscando(false);
    }
  }

  function preencherDoJikan(anime) {
    const mapaGeneros = {
      'Action': 'Ação', 'Adventure': 'Aventura', 'Romance': 'Romance',
      'Comedy': 'Comédia', 'Horror': 'Terror', 'Fantasy': 'Fantasia',
      'Sports': 'Esportes', 'Sci-Fi': 'Sci-Fi', 'Mystery': 'Mistério',
      'Slice of Life': 'Slice of Life', 'Supernatural': 'Sobrenatural',
      'Drama': 'Drama', 'Music': 'Musical',
    };
    const generosMapeados = (anime.genres ?? [])
      .map(g => mapaGeneros[g.name])
      .filter(g => g && GENEROS_OPCOES.includes(g));
    setForm({
      titulo:  anime.title_portuguese ?? anime.title,
      sinopse: anime.synopsis ?? '',
      capa:    anime.images?.jpg?.large_image_url ?? '',
      ano:     anime.year ?? new Date().getFullYear(),
      status:  anime.status === 'Currently Airing' ? 'em_exibicao' : 'finalizado',
      generos: generosMapeados,
    });
    setResultadosJikan([]);
    setBuscaJikan('');
  }

  async function salvar() {
    setErro('');
    setSucesso('');

    if (!form.titulo.trim())       { setErro('Título é obrigatório.'); return; }
    if (!form.sinopse.trim())      { setErro('Sinopse é obrigatória.'); return; }
    if (form.generos.length === 0) { setErro('Selecione ao menos um gênero.'); return; }

    const epParaSalvar = episodios.filter(ep => ep.titulo.trim() || ep.urlVideo.trim());
    const epInvalido   = epParaSalvar.find(ep => !ep.titulo.trim() || !ep.urlVideo.trim());
    if (epInvalido) { setErro('Episódios incompletos: preencha título e URL ou remova-os.'); return; }

    setSalvando(true);
    try {
      if (editando) {
        await api.put(`/animes/${id}`, {
          titulo:  form.titulo,
          sinopse: form.sinopse,
          capa:    form.capa || null,
          ano:     Number(form.ano),
          status:  form.status,
          generos: form.generos,
        });
        for (const ep of epParaSalvar) {
          await api.post(`/animes/${id}/episodios`, {
            numero:         Number(ep.numero),
            titulo:         ep.titulo,
            urlVideo:       ep.urlVideo,
            urlVideoAlt:    ep.urlVideoAlt || null,
            fontePrincipal: ep.fontePrincipal || 'youtube',
            duracao:        ep.duracao ? Number(ep.duracao) : null,
          });
        }
        setSucesso('Anime atualizado com sucesso!');
        const { data } = await api.get(`/animes/${id}`);
        setEpisodiosExist(data.episodios ?? []);
        setEpisodios([]);
      } else {
        if (episodios.length === 0) { setErro('Adicione ao menos um episódio.'); setSalvando(false); return; }
        const { data: anime } = await api.post('/animes', {
          titulo:  form.titulo,
          sinopse: form.sinopse,
          capa:    form.capa || null,
          ano:     Number(form.ano),
          status:  form.status,
          generos: form.generos,
        });
        for (const ep of episodios) {
          await api.post(`/animes/${anime.id}/episodios`, {
            numero:         Number(ep.numero),
            titulo:         ep.titulo,
            urlVideo:       ep.urlVideo,
            urlVideoAlt:    ep.urlVideoAlt || null,
            fontePrincipal: ep.fontePrincipal || 'youtube',
            duracao:        ep.duracao ? Number(ep.duracao) : null,
          });
        }
        navigate('/admin');
      }
    } catch (err) {
      setErro(err.response?.data?.error ?? 'Erro ao salvar anime.');
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <div style={s.loading}>Carregando anime...</div>;

  return (
    <div style={s.page}>

      <div style={s.header}>
        <button style={s.btnVoltar} onClick={() => navigate('/admin')}>← Voltar</button>
        <div>
          <h1 style={s.titulo}>{editando ? 'Editar Anime' : 'Novo Anime'}</h1>
          <p style={s.subtitulo}>{editando ? `Editando: ${form.titulo}` : 'Preencha os dados e adicione os episódios'}</p>
        </div>
      </div>

      {erro    && <div style={s.erro}>{erro}</div>}
      {sucesso && <div style={s.sucesso}>{sucesso}</div>}

      <div style={s.layout}>
        <div style={s.colPrincipal}>

          {/* Busca Jikan */}
          <div style={s.card}>
            <div style={s.cardTitulo}>🔍 Preencher automaticamente (MyAnimeList)</div>
            <div style={s.cardBody}>
              <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '14px' }}>
                Busque pelo nome para preencher os campos automaticamente.
              </p>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <input
                  style={{ ...s.input, flex: 1 }}
                  placeholder="Ex: Demon Slayer"
                  value={buscaJikan}
                  onChange={e => setBuscaJikan(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && buscarNoJikan()}
                />
                <button
                  style={{ ...s.btnSalvar, width: 'auto', padding: '10px 20px', marginBottom: 0, opacity: buscando ? 0.6 : 1 }}
                  onClick={buscarNoJikan}
                  disabled={buscando}
                >
                  {buscando ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
              {resultadosJikan.length > 0 && (
                <div style={s.jikanResultados}>
                  {resultadosJikan.map(anime => (
                    <div key={anime.mal_id} style={s.jikanItem} onClick={() => preencherDoJikan(anime)}>
                      <img src={anime.images?.jpg?.image_url} alt={anime.title} style={s.jikanCapa} />
                      <div style={s.jikanInfo}>
                        <div style={s.jikanTitulo}>{anime.title_portuguese ?? anime.title}</div>
                        <div style={s.jikanMeta}>{anime.year ?? '?'} • {anime.genres?.slice(0,2).map(g => g.name).join(', ')}</div>
                        <div style={{ ...s.jikanMeta, color: '#52b788', marginTop: '2px' }}>★ {anime.score ?? 'N/A'} no MAL</div>
                      </div>
                      <div style={s.jikanUsar}>Usar →</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dados básicos */}
          <div style={s.card}>
            <div style={s.cardTitulo}>📋 Dados do anime</div>
            <div style={s.cardBody}>
              <Campo label="Título *">
                <input style={s.input} value={form.titulo} onChange={e => handleForm('titulo', e.target.value)} placeholder="Ex: Attack on Titan" />
              </Campo>
              <Campo label="Sinopse *">
                <textarea style={{ ...s.input, resize: 'vertical' }} rows={4} value={form.sinopse} onChange={e => handleForm('sinopse', e.target.value)} placeholder="Descrição do anime..." />
              </Campo>
              <Campo label="URL da capa">
                <input style={s.input} value={form.capa} onChange={e => handleForm('capa', e.target.value)} placeholder="https://..." />
                {form.capa && (
                  <img src={form.capa} alt="preview" style={s.capaPreview} onError={e => e.target.style.display = 'none'} />
                )}
              </Campo>
              <div style={s.gridDois}>
                <Campo label="Ano *">
                  <input style={s.input} type="number" value={form.ano} onChange={e => handleForm('ano', e.target.value)} />
                </Campo>
                <Campo label="Status">
                  <select style={s.input} value={form.status} onChange={e => handleForm('status', e.target.value)}>
                    <option value="em_exibicao">Em exibição</option>
                    <option value="finalizado">Finalizado</option>
                  </select>
                </Campo>
              </div>
            </div>
          </div>

          {/* Gêneros */}
          <div style={s.card}>
            <div style={s.cardTitulo}>🏷 Gêneros *</div>
            <div style={{ ...s.cardBody, display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {GENEROS_OPCOES.map(g => (
                <button
                  key={g}
                  style={{ ...s.generoPill, ...(form.generos.includes(g) ? s.generoPillAtivo : {}) }}
                  onClick={() => toggleGenero(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Episódios existentes */}
          {editando && episodiosExist.length > 0 && (
            <div style={s.card}>
              <div style={s.cardTitulo}>📺 Episódios cadastrados ({episodiosExist.length})</div>
              <div style={s.cardBody}>
                {episodiosExist.map(ep => (
                  <div key={ep.id} style={s.epExistItem}>
                    <span style={s.epNumLabel}>EP {ep.numero}</span>
                    <span style={s.epExistTitulo}>{ep.titulo}</span>
                    <span style={s.epExistFonte}>
                      {ep.fontePrincipal === 'dailymotion' ? '🔵 Dailymotion' : '🔴 YouTube'}
                      {ep.urlVideoAlt && ' + backup'}
                    </span>
                    <button style={s.btnRemoveEp} onClick={() => deletarEpisodioExist(ep.id)}>✕ Remover</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Novos episódios */}
          <div style={s.card}>
            <div style={s.cardTitulo}>{editando ? '➕ Adicionar novos episódios' : '📺 Episódios'}</div>
            <div style={s.cardBody}>
              {episodios.map((ep, i) => (
                <div key={i} style={s.epBlock}>
                  <div style={s.epHeader}>
                    <span style={s.epNumLabel}>EP {ep.numero}</span>
                    {episodios.length > (editando ? 0 : 1) && (
                      <button style={s.btnRemoveEp} onClick={() => removeEpisodio(i)}>✕</button>
                    )}
                  </div>
                  <div style={s.gridDois}>
                    <Campo label="Título *">
                      <input style={s.input} value={ep.titulo} onChange={e => handleEpisodio(i, 'titulo', e.target.value)} placeholder="Ex: Para a Batalha" />
                    </Campo>
                    <Campo label="Duração (min)">
                      <input style={s.input} type="number" value={ep.duracao} onChange={e => handleEpisodio(i, 'duracao', e.target.value)} placeholder="24" />
                    </Campo>
                  </div>

                  <Campo label="URL do vídeo (YouTube) *">
                    <input style={s.input} value={ep.urlVideo} onChange={e => handleEpisodio(i, 'urlVideo', e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                  </Campo>

                  <Campo label="URL alternativa (Dailymotion) — opcional">
                    <input style={s.input} value={ep.urlVideoAlt} onChange={e => handleEpisodio(i, 'urlVideoAlt', e.target.value)} placeholder="https://dailymotion.com/video/..." />
                  </Campo>

                  <Campo label="Fonte principal ao abrir o player">
                    <select
                      style={s.input}
                      value={ep.fontePrincipal}
                      onChange={e => handleEpisodio(i, 'fontePrincipal', e.target.value)}
                    >
                      <option value="youtube">YouTube</option>
                      <option value="dailymotion" disabled={!ep.urlVideoAlt}>
                        Dailymotion {!ep.urlVideoAlt && '(preencha a URL alternativa)'}
                      </option>
                    </select>
                  </Campo>
                </div>
              ))}
              <button style={s.btnAddEp} onClick={addEpisodio}>+ Adicionar episódio</button>
            </div>
          </div>

        </div>

        {/* Coluna lateral */}
        <div style={s.colLateral}>
          <div style={s.card}>
            <div style={s.cardTitulo}>{editando ? '💾 Salvar alterações' : '🚀 Publicar'}</div>
            <div style={s.cardBody}>
              <div style={s.resumo}>
                <div style={s.resumoItem}>
                  <span style={s.resumoLabel}>Título</span>
                  <span style={s.resumoValor}>{form.titulo || '—'}</span>
                </div>
                <div style={s.resumoItem}>
                  <span style={s.resumoLabel}>Gêneros</span>
                  <span style={s.resumoValor}>{form.generos.length > 0 ? form.generos.join(', ') : '—'}</span>
                </div>
                {editando && (
                  <div style={s.resumoItem}>
                    <span style={s.resumoLabel}>Episódios salvos</span>
                    <span style={s.resumoValor}>{episodiosExist.length}</span>
                  </div>
                )}
                <div style={s.resumoItem}>
                  <span style={s.resumoLabel}>{editando ? 'Novos episódios' : 'Episódios'}</span>
                  <span style={s.resumoValor}>{episodios.filter(ep => ep.titulo).length}</span>
                </div>
              </div>

              <button style={{ ...s.btnSalvar, opacity: salvando ? 0.6 : 1 }} onClick={salvar} disabled={salvando}>
                {salvando ? 'Salvando...' : editando ? '💾 Salvar alterações' : '✓ Publicar anime'}
              </button>

              {editando && (
                <button style={s.btnVerAnime} onClick={() => navigate(`/anime/${id}`)}>
                  👁 Ver página do anime
                </button>
              )}

              <button style={s.btnCancelar} onClick={() => navigate('/admin')}>Cancelar</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function Campo({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#888', letterSpacing: '0.5px' }}>{label}</label>
      {children}
    </div>
  );
}

const s = {
  page:      { paddingTop: '84px', minHeight: '100vh', padding: '84px 40px 48px' },
  loading:   { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#888' },
  header:    { display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '28px' },
  titulo:    { fontFamily: '"Bebas Neue", sans-serif', fontSize: '2rem', letterSpacing: '2px', marginBottom: '4px' },
  subtitulo: { color: '#888', fontSize: '0.88rem' },
  btnVoltar: {
    background: 'transparent', border: '1px solid #1e1e32', color: '#888',
    padding: '10px 16px', borderRadius: '8px', fontFamily: 'inherit',
    fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', marginTop: '6px', flexShrink: 0,
  },
  erro: {
    background: 'rgba(230,57,70,0.12)', border: '1px solid rgba(230,57,70,0.3)',
    color: '#e63946', padding: '12px 16px', borderRadius: '8px', fontSize: '0.88rem', marginBottom: '24px',
  },
  sucesso: {
    background: 'rgba(82,183,136,0.12)', border: '1px solid rgba(82,183,136,0.3)',
    color: '#52b788', padding: '12px 16px', borderRadius: '8px', fontSize: '0.88rem', marginBottom: '24px',
  },
  layout:      { display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', alignItems: 'start' },
  colPrincipal: {},
  colLateral:  {},
  card:        { background: '#13131f', border: '1px solid #1e1e32', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' },
  cardTitulo:  { fontWeight: 900, fontSize: '0.9rem', padding: '14px 20px', borderBottom: '1px solid #1e1e32' },
  cardBody:    { padding: '20px' },
  input: {
    width: '100%', background: '#0d0d14', border: '1px solid #1e1e32',
    borderRadius: '8px', color: '#f0f0f0', padding: '10px 14px',
    fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none',
  },
  capaPreview: { width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', marginTop: '8px', border: '1px solid #1e1e32' },
  gridDois:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  generoPill:  { padding: '7px 16px', borderRadius: '999px', border: '1px solid #1e1e32', background: '#0d0d14', color: '#888', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' },
  generoPillAtivo: { background: '#e63946', borderColor: '#e63946', color: '#fff' },
  epExistItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#0d0d14', border: '1px solid #1e1e32', borderRadius: '8px', marginBottom: '8px', flexWrap: 'wrap' },
  epExistTitulo: { flex: 1, fontSize: '0.85rem', color: '#bbb' },
  epExistFonte: { fontSize: '0.72rem', color: '#888', fontWeight: 700, whiteSpace: 'nowrap' },
  epBlock:     { background: '#0d0d14', border: '1px solid #1e1e32', borderRadius: '10px', padding: '16px', marginBottom: '12px' },
  epHeader:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' },
  epNumLabel:  { fontFamily: '"Bebas Neue", sans-serif', fontSize: '1.1rem', color: '#e63946', letterSpacing: '1px' },
  btnRemoveEp: { background: 'transparent', border: '1px solid rgba(230,57,70,0.3)', color: '#e63946', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit', fontWeight: 700, padding: '3px 10px', borderRadius: '6px' },
  btnAddEp:    { width: '100%', background: 'transparent', border: '1px dashed #1e1e32', color: '#888', padding: '12px', borderRadius: '8px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' },
  resumo:      { marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' },
  resumoItem:  { display: 'flex', flexDirection: 'column', gap: '2px' },
  resumoLabel: { fontSize: '0.7rem', fontWeight: 900, color: '#888', letterSpacing: '1px', textTransform: 'uppercase' },
  resumoValor: { fontSize: '0.85rem', color: '#f0f0f0', fontWeight: 700 },
  btnSalvar:   { width: '100%', background: '#e63946', color: '#fff', border: 'none', padding: '13px', borderRadius: '8px', fontFamily: 'inherit', fontWeight: 800, fontSize: '0.92rem', cursor: 'pointer', marginBottom: '10px' },
  btnVerAnime: { width: '100%', background: 'rgba(76,201,240,0.1)', border: '1px solid rgba(76,201,240,0.3)', color: '#4cc9f0', padding: '11px', borderRadius: '8px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', marginBottom: '10px' },
  btnCancelar: { width: '100%', background: 'transparent', border: '1px solid #1e1e32', color: '#888', padding: '11px', borderRadius: '8px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' },
  jikanResultados: { display: 'flex', flexDirection: 'column', gap: '8px' },
  jikanItem:   { display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', background: '#0d0d14', border: '1px solid #1e1e32', borderRadius: '10px', cursor: 'pointer' },
  jikanCapa:   { width: '48px', height: '64px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 },
  jikanInfo:   { flex: 1 },
  jikanTitulo: { fontWeight: 800, fontSize: '0.88rem', marginBottom: '4px' },
  jikanMeta:   { fontSize: '0.75rem', color: '#888' },
  jikanUsar:   { color: '#e63946', fontWeight: 800, fontSize: '0.82rem', flexShrink: 0 },
};