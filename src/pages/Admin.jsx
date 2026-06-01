import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import { useAuth }             from '../context/AuthContext';
import api                     from '../services/api';

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const navigate          = useNavigate();

  const [abaAtiva,   setAbaAtiva]   = useState('dashboard');
  const [dashboard,  setDashboard]  = useState(null);
  const [animes,     setAnimes]     = useState([]);
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);

  // Redireciona se não for admin
  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!isAdmin) { navigate('/'); return; }
    carregarDados();
  }, [user, isAdmin]);

  async function carregarDados() {
    setLoading(true);
    try {
      const [dash, animesRes, usersRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/animes'),
        api.get('/admin/users'),
      ]);
      setDashboard(dash.data);
      setAnimes(animesRes.data.animes);
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function deletarAnime(id, titulo) {
    if (!confirm(`Deletar "${titulo}" e todos os episódios?`)) return;
    try {
      await api.delete(`/admin/animes/${id}`);
      setAnimes(prev => prev.filter(a => a.id !== id));
      setDashboard(prev => ({ ...prev, totalAnimes: prev.totalAnimes - 1 }));
    } catch (err) {
      alert(err.response?.data?.error ?? 'Erro ao deletar anime.');
    }
  }

  async function deletarUser(id, nome) {
    if (!confirm(`Deletar usuário "${nome}"? Isso remove todos os dados dele.`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
      setDashboard(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
    } catch (err) {
      alert(err.response?.data?.error ?? 'Erro ao deletar usuário.');
    }
  }

  if (loading) return <div style={s.loading}>Carregando painel...</div>;

  return (
    <div style={s.page}>

      {/* ── SIDEBAR ── */}
      <aside style={s.sidebar}>
        <div style={s.sidebarLogo}>
          Animes <span style={{ color: '#e63946' }}>Ace</span>
          <div style={s.sidebarBadge}>Admin</div>
        </div>

        {[
          { id: 'dashboard', icon: '📊', label: 'Dashboard' },
          { id: 'animes',    icon: '🎌', label: 'Animes' },
          { id: 'users',     icon: '👥', label: 'Usuários' },
        ].map(item => (
          <button
            key={item.id}
            style={{ ...s.sidebarItem, ...(abaAtiva === item.id ? s.sidebarItemAtivo : {}) }}
            onClick={() => setAbaAtiva(item.id)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}

        <button style={s.sidebarVoltar} onClick={() => navigate('/')}>
          ← Voltar ao site
        </button>
      </aside>

      {/* ── CONTEÚDO ── */}
      <main style={s.main}>

        {/* ── DASHBOARD ── */}
        {abaAtiva === 'dashboard' && dashboard && (
          <div>
            <h1 style={s.titulo}>Dashboard</h1>
            <p style={s.subtitulo}>Visão geral do Animes Ace</p>

            {/* Cards de estatísticas */}
            <div style={s.statsGrid}>
              <StatCard icon="🎌" label="Animes"     valor={dashboard.totalAnimes}    cor="#e63946" />
              <StatCard icon="📺" label="Episódios"  valor={dashboard.totalEpisodios} cor="#4cc9f0" />
              <StatCard icon="👥" label="Usuários"   valor={dashboard.totalUsers}     cor="#52b788" />
              <StatCard icon="⭐" label="Avaliações" valor={dashboard.totalAvaliacoes} cor="#f4a261" />
            </div>

            {/* Últimos usuários */}
            <div style={s.card}>
              <div style={s.cardTitulo}>👤 Últimos cadastros</div>
              {dashboard.ultimosUsers.map(u => (
                <div key={u.id} style={s.userRow}>
                  <div style={s.userAvatar}>{u.nome[0].toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{u.nome}</div>
                    <div style={{ color: '#888', fontSize: '0.78rem' }}>{u.email}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', color: '#888', fontSize: '0.75rem' }}>
                    {new Date(u.criadoEm).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ANIMES ── */}
        {abaAtiva === 'animes' && (
          <div>
            <div style={s.abaHeader}>
              <div>
                <h1 style={s.titulo}>Animes</h1>
                <p style={s.subtitulo}>{animes.length} anime{animes.length !== 1 ? 's' : ''} cadastrado{animes.length !== 1 ? 's' : ''}</p>
              </div>
              <button style={s.btnNovo} onClick={() => navigate('/admin/anime/novo')}>
                + Novo anime
              </button>
            </div>

            <div style={s.card}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Título</th>
                    <th style={s.th}>Gêneros</th>
                    <th style={s.th}>Ano</th>
                    <th style={s.th}>Eps</th>
                    <th style={s.th}>Nota</th>
                    <th style={s.th}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {animes.map(anime => (
                    <tr key={anime.id} style={s.tr}>
                      <td style={s.td}>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{anime.titulo}</div>
                      </td>
                      <td style={s.td}>
                        <div style={{ color: '#888', fontSize: '0.78rem' }}>
                          {anime.generos.join(', ')}
                        </div>
                      </td>
                      <td style={s.td}><span style={s.badge}>{anime.ano}</span></td>
                      <td style={s.td}><span style={s.badge}>{anime._count?.episodios ?? 0}</span></td>
                      <td style={s.td}>
                        <span style={{ color: '#f4a261', fontWeight: 800 }}>
                          ★ {anime.nota.toFixed(1)}
                        </span>
                      </td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            style={s.btnEditar}
                            onClick={() => navigate(`/anime/${anime.id}`)}
                          >
                            Ver
                          </button>
                          <button
                            style={s.btnDeletar}
                            onClick={() => deletarAnime(anime.id, anime.titulo)}
                          >
                            Deletar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── USUÁRIOS ── */}
        {abaAtiva === 'users' && (
          <div>
            <h1 style={s.titulo}>Usuários</h1>
            <p style={s.subtitulo}>{users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}</p>

            <div style={s.card}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Usuário</th>
                    <th style={s.th}>Email</th>
                    <th style={s.th}>Na lista</th>
                    <th style={s.th}>Avaliações</th>
                    <th style={s.th}>Cadastro</th>
                    <th style={s.th}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={s.tr}>
                      <td style={s.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={s.userAvatar}>{u.nome[0].toUpperCase()}</div>
                          <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>{u.nome}</span>
                        </div>
                      </td>
                      <td style={s.td}><span style={{ color: '#888', fontSize: '0.82rem' }}>{u.email}</span></td>
                      <td style={s.td}><span style={s.badge}>{u._count.lista}</span></td>
                      <td style={s.td}><span style={s.badge}>{u._count.avaliacoes}</span></td>
                      <td style={s.td}>
                        <span style={{ color: '#888', fontSize: '0.78rem' }}>
                          {new Date(u.criadoEm).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td style={s.td}>
                        {u.email !== user.email ? (
                          <button
                            style={s.btnDeletar}
                            onClick={() => deletarUser(u.id, u.nome)}
                          >
                            Deletar
                          </button>
                        ) : (
                          <span style={{ color: '#888', fontSize: '0.75rem' }}>Você</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// ── COMPONENTE STAT CARD ───────────────────────────────
function StatCard({ icon, label, valor, cor }) {
  return (
    <div style={{ ...s.statCard, borderColor: cor }}>
      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '2.5rem', color: cor, lineHeight: 1 }}>
        {valor}
      </div>
      <div style={{ color: '#888', fontSize: '0.82rem', fontWeight: 700, marginTop: '4px' }}>
        {label}
      </div>
    </div>
  );
}

// ── ESTILOS ────────────────────────────────────────────
const s = {
  page:    { display: 'flex', minHeight: '100vh', paddingTop: '64px' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#888' },

  // Sidebar
  sidebar: {
    width:         '220px',
    flexShrink:    0,
    background:    '#0d0d14',
    borderRight:   '1px solid #1e1e32',
    padding:       '28px 16px',
    display:       'flex',
    flexDirection: 'column',
    gap:           '4px',
    position:      'sticky',
    top:           '64px',
    height:        'calc(100vh - 64px)',
  },
  sidebarLogo: {
    fontFamily:    '"Bebas Neue", sans-serif',
    fontSize:      '1.3rem',
    letterSpacing: '2px',
    marginBottom:  '24px',
    paddingBottom: '20px',
    borderBottom:  '1px solid #1e1e32',
    display:       'flex',
    alignItems:    'center',
    gap:           '8px',
  },
  sidebarBadge: {
    background:   '#f4a261',
    color:        '#0d0d14',
    fontSize:     '0.6rem',
    fontWeight:   900,
    padding:      '2px 6px',
    borderRadius: '4px',
    letterSpacing: '1px',
  },
  sidebarItem: {
    display:      'flex',
    alignItems:   'center',
    gap:          '10px',
    padding:      '10px 12px',
    borderRadius: '8px',
    border:       'none',
    background:   'transparent',
    color:        '#888',
    fontFamily:   'inherit',
    fontWeight:   700,
    fontSize:     '0.88rem',
    cursor:       'pointer',
    textAlign:    'left',
    transition:   'all 0.2s',
  },
  sidebarItemAtivo: {
    background: 'rgba(230,57,70,0.12)',
    color:      '#e63946',
  },
  sidebarVoltar: {
    marginTop:    'auto',
    padding:      '10px 12px',
    borderRadius: '8px',
    border:       '1px solid #1e1e32',
    background:   'transparent',
    color:        '#888',
    fontFamily:   'inherit',
    fontWeight:   700,
    fontSize:     '0.82rem',
    cursor:       'pointer',
    textAlign:    'left',
  },

  // Main
  main: { flex: 1, padding: '40px', overflowY: 'auto' },

  titulo:    { fontFamily: '"Bebas Neue", sans-serif', fontSize: '2rem', letterSpacing: '2px', marginBottom: '4px' },
  subtitulo: { color: '#888', fontSize: '0.88rem', marginBottom: '28px' },

  abaHeader: {
    display:        'flex',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    marginBottom:   '0',
  },
  btnNovo: {
    background:   '#e63946',
    color:        '#fff',
    border:       'none',
    padding:      '10px 20px',
    borderRadius: '8px',
    fontFamily:   'inherit',
    fontWeight:   800,
    fontSize:     '0.88rem',
    cursor:       'pointer',
  },

  // Stats
  statsGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap:                 '16px',
    marginBottom:        '28px',
  },
  statCard: {
    background:   '#13131f',
    border:       '1px solid',
    borderRadius: '12px',
    padding:      '24px',
    textAlign:    'center',
  },

  // Card genérico
  card: {
    background:   '#13131f',
    border:       '1px solid #1e1e32',
    borderRadius: '12px',
    overflow:     'hidden',
    marginBottom: '24px',
  },
  cardTitulo: {
    fontWeight:   900,
    fontSize:     '0.92rem',
    padding:      '16px 20px',
    borderBottom: '1px solid #1e1e32',
  },

  // User row no dashboard
  userRow: {
    display:     'flex',
    alignItems:  'center',
    gap:         '12px',
    padding:     '12px 20px',
    borderBottom: '1px solid #1e1e32',
  },
  userAvatar: {
    width:          '32px',
    height:         '32px',
    borderRadius:   '50%',
    background:     '#e63946',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontWeight:     900,
    fontSize:       '0.82rem',
    flexShrink:     0,
  },

  // Tabela
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign:     'left',
    padding:       '12px 16px',
    fontSize:      '0.7rem',
    fontWeight:    900,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    color:         '#888',
    borderBottom:  '1px solid #1e1e32',
  },
  tr: { borderBottom: '1px solid rgba(30,30,50,0.5)' },
  td: { padding: '14px 16px', fontSize: '0.88rem', verticalAlign: 'middle' },

  badge: {
    background:   '#1e1e32',
    color:        '#888',
    padding:      '2px 8px',
    borderRadius: '4px',
    fontSize:     '0.75rem',
    fontWeight:   700,
  },

  btnEditar: {
    background:   'rgba(76,201,240,0.1)',
    border:       '1px solid rgba(76,201,240,0.3)',
    color:        '#4cc9f0',
    padding:      '5px 12px',
    borderRadius: '6px',
    fontFamily:   'inherit',
    fontWeight:   700,
    fontSize:     '0.78rem',
    cursor:       'pointer',
  },
  btnDeletar: {
    background:   'rgba(230,57,70,0.1)',
    border:       '1px solid rgba(230,57,70,0.3)',
    color:        '#e63946',
    padding:      '5px 12px',
    borderRadius: '6px',
    fontFamily:   'inherit',
    fontWeight:   700,
    fontSize:     '0.78rem',
    cursor:       'pointer',
  },
};