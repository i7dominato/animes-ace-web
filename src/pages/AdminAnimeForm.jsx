import { useState }          from 'react';
import { useNavigate }       from 'react-router-dom';
import { useAuth }           from '../context/AuthContext';
import api                   from '../services/api';

const GENEROS_OPCOES = ['Ação', 'Aventura', 'Romance', 'Comédia', 'Terror', 'Fantasia', 'Esportes', 'Sci-Fi', 'Mistério', 'Slice of Life', 'Sobrenatural', 'Drama', 'Musical'];

export default function AdminAnimeForm() {
  const { isAdmin } = useAuth();
  const navigate    = useNavigate();

  const [form, setForm] = useState({
    titulo:  '',
    sinopse: '',
    capa:    '',
    ano:     new Date().getFullYear(),
    status:  'em_exibicao',
    generos: [],
  });

  const [episodios, setEpisodios] = useState([
    { numero: 1, titulo: '', urlVideo: '', duracao: '' }
  ]);

  const [salvando, setSalvando] = useState(false);
  const [erro,     setErro]     = useState('');

  if (!isAdmin) { navigate('/'); return null; }

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
    setEpisodios(prev => [
      ...prev,
      { numero: prev.length + 1, titulo: '', urlVideo: '', duracao: '' }
    ]);
  }

  function removeEpisodio(index) {
    setEpisodios(prev => prev.filter((_, i) => i !== index));
  }

  function handleEpisodio(index, campo, valor) {
    setEpisodios(prev => prev.map((ep, i) => i === index ? { ...ep, [campo]: valor } : ep));
  }

  async function salvar() {
    setErro('');

    // Validação básica
    if (!form.titulo.trim()) { setErro('Título é obrigatório.'); return; }
    if (!form.sinopse.trim()) { setErro('Sinopse é obrigatória.'); return; }
    if (form.generos.length === 0) { setErro('Selecione ao menos um gênero.'); return; }

    const epInvalido = episodios.find(ep => !ep.titulo.trim() || !ep.urlVideo.trim());
    if (epInvalido) { setErro('Todos os episódios precisam de título e URL do vídeo.'); return; }

    setSalvando(true);
    try {
      // 1. Cria o anime
      const { data: anime } = await api.post('/animes', {
        titulo:  form.titulo,
        sinopse: form.sinopse,
        capa:    form.capa || null,
        ano:     Number(form.ano),
        status:  form.status,
        generos: form.generos,
      });

      // 2. Cria os episódios um por um
      for (const ep of episodios) {
        await api.post(`/animes/${anime.id}/episodios`, {
          numero:   Number(ep.numero),
          titulo:   ep.titulo,
          urlVideo: ep.urlVideo,
          duracao:  ep.duracao ? Number(ep.duracao) : null,
        });
      }

      navigate('/admin');
    } catch (err) {
      setErro(err.response?.data?.error ?? 'Erro ao salvar anime.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div style={s.page}>

      {/* ── HEADER ── */}
      <div style={s.header}>
        <button style={s.btnVoltar} onClick={() => navigate('/admin')}>← Voltar</button>
        <div>
          <h1 style={s.titulo}>Novo Anime</h1>
          <p style={s.subtitulo}>Preencha os dados e adicione os episódios</p>
        </div>
      </div>

      {erro && <div style={s.erro}>{erro}</div>}

      <div style={s.layout}>

        {/* ── COLUNA PRINCIPAL ── */}
        <div style={s.colPrincipal}>

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
                  <img src={form.capa} alt="preview" style={s.capaPreview} onError={e => e.target.style.display='none'} />
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

          {/* Episódios */}
          <div style={s.card}>
            <div style={s.cardTitulo}>📺 Episódios</div>
            <div style={s.cardBody}>
              {episodios.map((ep, i) => (
                <div key={i} style={s.epBlock}>
                  <div style={s.epHeader}>
                    <span style={s.epNumLabel}>EP {ep.numero}</span>
                    {episodios.length > 1 && (
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
                  <Campo label="URL do vídeo * (YouTube ou embed)">
                    <input style={s.input} value={ep.urlVideo} onChange={e => handleEpisodio(i, 'urlVideo', e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                  </Campo>
                </div>
              ))}

              <button style={s.btnAddEp} onClick={addEpisodio}>
                + Adicionar episódio
              </button>
            </div>
          </div>

        </div>

        {/* ── COLUNA LATERAL ── */}
        <div style={s.colLateral}>
          <div style={s.card}>
            <div style={s.cardTitulo}>🚀 Publicar</div>
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
                <div style={s.resumoItem}>
                  <span style={s.resumoLabel}>Episódios</span>
                  <span style={s.resumoValor}>{episodios.length}</span>
                </div>
              </div>

              <button
                style={{ ...s.btnSalvar, opacity: salvando ? 0.6 : 1 }}
                onClick={salvar}
                disabled={salvando}
              >
                {salvando ? 'Salvando...' : '✓ Salvar anime'}
              </button>

              <button style={s.btnCancelar} onClick={() => navigate('/admin')}>
                Cancelar
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── COMPONENTE AUXILIAR ────────────────────────────────
function Campo({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#888', letterSpacing: '0.5px' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── ESTILOS ────────────────────────────────────────────
const s = {
  page:    { paddingTop: '84px', minHeight: '100vh', padding: '84px 40px 48px' },
  header:  { display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '28px' },
  titulo:  { fontFamily: '"Bebas Neue", sans-serif', fontSize: '2rem', letterSpacing: '2px', marginBottom: '4px' },
  subtitulo: { color: '#888', fontSize: '0.88rem' },

  btnVoltar: {
    background:   'transparent',
    border:       '1px solid #1e1e32',
    color:        '#888',
    padding:      '10px 16px',
    borderRadius: '8px',
    fontFamily:   'inherit',
    fontWeight:   700,
    fontSize:     '0.85rem',
    cursor:       'pointer',
    marginTop:    '6px',
    flexShrink:   0,
  },

  erro: {
    background:   'rgba(230,57,70,0.12)',
    border:       '1px solid rgba(230,57,70,0.3)',
    color:        '#e63946',
    padding:      '12px 16px',
    borderRadius: '8px',
    fontSize:     '0.88rem',
    marginBottom: '24px',
  },

  layout:      { display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', alignItems: 'start' },
  colPrincipal: {},
  colLateral:  {},

  card: {
    background:   '#13131f',
    border:       '1px solid #1e1e32',
    borderRadius: '12px',
    overflow:     'hidden',
    marginBottom: '20px',
  },
  cardTitulo: {
    fontWeight:   900,
    fontSize:     '0.9rem',
    padding:      '14px 20px',
    borderBottom: '1px solid #1e1e32',
  },
  cardBody: { padding: '20px' },

  input: {
    width:        '100%',
    background:   '#0d0d14',
    border:       '1px solid #1e1e32',
    borderRadius: '8px',
    color:        '#f0f0f0',
    padding:      '10px 14px',
    fontSize:     '0.88rem',
    fontFamily:   'inherit',
    outline:      'none',
  },

  capaPreview: {
    width:        '100%',
    maxHeight:    '200px',
    objectFit:    'cover',
    borderRadius: '8px',
    marginTop:    '8px',
    border:       '1px solid #1e1e32',
  },

  gridDois: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },

  generoPill: {
    padding:      '7px 16px',
    borderRadius: '999px',
    border:       '1px solid #1e1e32',
    background:   '#0d0d14',
    color:        '#888',
    fontFamily:   'inherit',
    fontWeight:   700,
    fontSize:     '0.8rem',
    cursor:       'pointer',
    transition:   'all 0.15s',
  },
  generoPillAtivo: { background: '#e63946', borderColor: '#e63946', color: '#fff' },

  epBlock: {
    background:   '#0d0d14',
    border:       '1px solid #1e1e32',
    borderRadius: '10px',
    padding:      '16px',
    marginBottom: '12px',
  },
  epHeader: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   '12px',
  },
  epNumLabel: { fontFamily: '"Bebas Neue", sans-serif', fontSize: '1.1rem', color: '#e63946', letterSpacing: '1px' },
  btnRemoveEp: {
    background: 'transparent', border: 'none',
    color: '#888', cursor: 'pointer', fontSize: '0.9rem',
  },
  btnAddEp: {
    width:        '100%',
    background:   'transparent',
    border:       '1px dashed #1e1e32',
    color:        '#888',
    padding:      '12px',
    borderRadius: '8px',
    fontFamily:   'inherit',
    fontWeight:   700,
    fontSize:     '0.85rem',
    cursor:       'pointer',
    transition:   'all 0.2s',
  },

  resumo: { marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' },
  resumoItem: { display: 'flex', flexDirection: 'column', gap: '2px' },
  resumoLabel: { fontSize: '0.7rem', fontWeight: 900, color: '#888', letterSpacing: '1px', textTransform: 'uppercase' },
  resumoValor: { fontSize: '0.85rem', color: '#f0f0f0', fontWeight: 700 },

  btnSalvar: {
    width:        '100%',
    background:   '#e63946',
    color:        '#fff',
    border:       'none',
    padding:      '13px',
    borderRadius: '8px',
    fontFamily:   'inherit',
    fontWeight:   800,
    fontSize:     '0.92rem',
    cursor:       'pointer',
    marginBottom: '10px',
  },
  btnCancelar: {
    width:        '100%',
    background:   'transparent',
    border:       '1px solid #1e1e32',
    color:        '#888',
    padding:      '11px',
    borderRadius: '8px',
    fontFamily:   'inherit',
    fontWeight:   700,
    fontSize:     '0.88rem',
    cursor:       'pointer',
  },
};