import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import { useAuth }             from '../context/AuthContext';
import { useWindowSize }       from '../hooks/useWindowSize';
import api                     from '../services/api';

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const navigate          = useNavigate();
  const { isMobile }      = useWindowSize();

  const [abaAtiva,   setAbaAtiva]   = useState('dashboard');
  const [dashboard,  setDashboard]  = useState(null);
  const [animes,     setAnimes]     = useState([]);
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);

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
    <div style={{ ...s.page, flexDirection: isMobile ? 'column' : 'row' }}>

      {/* ── SIDEBAR ── */}
      {!isMobile ? (
        <aside style={s.sidebar}>
          <SidebarConteudo abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva} navigate={navigate} />
        </aside>
      ) : (
        <div style={s.tabsMobile}>
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'animes',    label: 'Animes' },
            { id: 'users',     label: 'Usuários' },
          ].map(item => (
            <button
              key={item.id}
              style={{ ...s.tabMobile, ...(abaAtiva === item.id ? s.tabMobileAtivo : {}) }}
              onClick={() => setAbaAtiva(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* ── CONTEÚDO ── */}
      <main style={{ ...s.main, padding: isMobile ? '20px' : '40px 48px' }}>

        {/* ── DASHBOARD ── */}
        {abaAtiva === 'dashboard' && dashboard && (
          <div>
            <PageHeader titulo="Dashboard" subtitulo="Visão geral da plataforma" />

            <div style={{ ...s.statsGrid, gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)' }}>
              <StatCard icon="🎬" label="Animes"     valor={dashboard.totalAnimes}     cor="#e63946" />
              <StatCard icon="📺" label="Episódios"  valor={dashboard.totalEpisodios}  cor="#4cc9f0" />
              <StatCard icon="👥" label="Usuários"   valor={dashboard.totalUsers}      cor="#52b788" />
              <StatCard icon="⭐" label="Avaliações" valor={dashboard.totalAvaliacoes} cor="#f4a261" />
            </div>

            <div style={s.card}>
              <div style={s.cardTitulo}>👤 Últimos cadastros</div>
              {dashboard.ultimosUsers.map(u => (
                <div key={u.id} style={s.userRow}>
                  <div style={s.userAvatar}>{u.nome[0].toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.userRowNome}>{u.nome}</div>
                    <div style={s.userRowEmail}>{u.email}</div>
                  </div>
                  <div style={s.userRowData}>
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
            <PageHeader
              titulo="Animes"
              subtitulo={`${animes.length} anime${animes.length !== 1 ? 's' : ''} cadastrado${animes.length !== 1 ? 's' : ''}`}
              acao={<button style={s.btnNovo} onClick={() => navigate('/admin/anime/novo')}>+ Novo anime</button>}
            />

            {isMobile ? (
              <div style={s.animesListaMobile}>
                {animes.map(anime => (
                  <div key={anime.id} style={s.animeCardMobile}>
                    <div style={s.animeCardMobileThumb}>
                      {anime.capa
                        ? <img src={anime.capa} alt="" style={s.animeCardMobileImg} />
                        : <div style={s.animeCardMobilePlaceholder}>🎬</div>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={s.animeCardMobileTitulo}>{anime.titulo}</div>
                      <div style={s.animeCardMobileMeta}>
                        {anime.ano} · ★ {anime.nota.toFixed(1)} · {anime._count?.episodios ?? 0} eps
                      </div>
                      <div style={s.animeCardMobileAcoes}>
                        <button style={s.btnEditar} onClick={() => navigate(`/admin/anime/${anime.id}/editar`)}>Editar</button>
                        <button style={s.btnDeletar} onClick={() => deletarAnime(anime.id, anime.titulo)}>Deletar</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
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
                          <div style={s.tdComCapa}>
                            <div style={s.tdCapa}>
                              {anime.capa
                                ? <img src={anime.capa} alt="" style={s.tdCapaImg} />
                                : <div style={s.tdCapaPlaceholder}>🎬</div>
                              }
                            </div>
                            <span style={s.tdTitulo}>{anime.titulo}</span>
                          </div>
                        </td>
                        <td style={s.td}><span style={s.tdGenero}>{anime.generos.join(', ')}</span></td>
                        <td style={s.td}><span style={s.badge}>{anime.ano}</span></td>
                        <td style={s.td}><span style={s.badge}>{anime._count?.episodios ?? 0}</span></td>
                        <td style={s.td}><span style={s.tdNota}>★ {anime.nota.toFixed(1)}</span></td>
                        <td style={s.td}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button style={s.btnEditar} onClick={() => navigate(`/admin/anime/${anime.id}/editar`)}>Editar</button>
                            <button style={s.btnDeletar} onClick={() => deletarAnime(anime.id, anime.titulo)}>Deletar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── USUÁRIOS ── */}
        {abaAtiva === 'users' && (
          <div>
            <PageHeader
              titulo="Usuários"
              subtitulo={`${users.length} usuário${users.length !== 1 ? 's' : ''} cadastrado${users.length !== 1 ? 's' : ''}`}
            />

            {isMobile ? (
              <div style={s.animesListaMobile}>
                {users.map(u => (
                  <div key={u.id} style={s.userCardMobile}>
                    <div style={s.userAvatar}>{u.nome[0].toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={s.userRowNome}>{u.nome}</div>
                      <div style={s.userRowEmail}>{u.email}</div>
                      <div style={s.userCardMobileStats}>
                        {u._count.lista} na lista · {u._count.avaliacoes} avaliações
                      </div>
                    </div>
                    {u.email !== user.email && (
                      <button style={s.btnDeletar} onClick={() => deletarUser(u.id, u.nome)}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
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
                            <div style={s.userAvatarSm}>{u.nome[0].toUpperCase()}</div>
                            <span style={s.tdTitulo}>{u.nome}</span>
                          </div>
                        </td>
                        <td style={s.td}><span style={s.tdGenero}>{u.email}</span></td>
                        <td style={s.td}><span style={s.badge}>{u._count.lista}</span></td>
                        <td style={s.td}><span style={s.badge}>{u._count.avaliacoes}</span></td>
                        <td style={s.td}><span style={s.tdGenero}>{new Date(u.criadoEm).toLocaleDateString('pt-BR')}</span></td>
                        <td style={s.td}>
                          {u.email !== user.email ? (
                            <button style={s.btnDeletar} onClick={() => deletarUser(u.id, u.nome)}>Deletar</button>
                          ) : (
                            <span style={s.tdVoce}>Você</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

// ── COMPONENTES AUXILIARES ─────────────────────────────
function SidebarConteudo({ abaAtiva, setAbaAtiva, navigate }) {
  return (
    <>
      <div style={s.sidebarLogo}>
        Animes <span style={{ color: '#e63946' }}>Ace</span>
        <div style={s.sidebarBadge}>ADMIN</div>
      </div>

      {[
        { id: 'dashboard', icon: '📊', label: 'Dashboard' },
        { id: 'animes',    icon: '🎬', label: 'Animes' },
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
    </>
  );
}

function PageHeader({ titulo, subtitulo, acao }) {
  return (
    <div style={s.pageHeader}>
      <div>
        <div style={s.pageHeaderTituloWrap}>
          <span style={s.secaoBarra} />
          <h1 style={s.pageHeaderTitulo}>{titulo}</h1>
        </div>
        <p style={s.pageHeaderSubtitulo}>{subtitulo}</p>
      </div>
      {acao}
    </div>
  );
}

function StatCard({ icon, label, valor, cor }) {
  return (
    <div style={{ ...s.statCard, borderColor: cor + '40' }}>
      <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '2.2rem', color: cor, lineHeight: 1 }}>
        {valor}
      </div>
      <div style={{ color: '#888', fontSize: '0.78rem', fontWeight: 700, marginTop: '4px' }}>
        {label}
      </div>
    </div>
  );
}

// ── ESTILOS ────────────────────────────────────────────
const s = {
  page:    { display: 'flex', minHeight: '100vh', paddingTop: '64px', background: '#0a0a0f' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#888' },

  // Sidebar desktop
  sidebar: {
    width: '230px', flexShrink: 0, background: '#0d0d14', borderRight: '1px solid #1e1e32',
    padding: '28px 16px', display: 'flex', flexDirection: 'column', gap: '4px',
    position: 'sticky', top: '64px', height: 'calc(100vh - 64px)',
  },
  sidebarLogo: {
    fontFamily: '"Bebas Neue", sans-serif', fontSize: '1.3rem', letterSpacing: '2px',
    marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #1e1e32',
    display: 'flex', alignItems: 'center', gap: '8px', color: '#fff',
  },
  sidebarBadge: { background: '#e63946', color: '#fff', fontSize: '0.58rem', fontWeight: 900, padding: '2px 7px', borderRadius: '4px', letterSpacing: '1px' },
  sidebarItem: {
    display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 13px', borderRadius: '8px',
    border: 'none', background: 'transparent', color: '#888', fontFamily: 'Nunito, sans-serif',
    fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
  },
  sidebarItemAtivo: { background: 'rgba(230,57,70,0.12)', color: '#e63946' },
  sidebarVoltar: {
    marginTop: 'auto', padding: '10px 13px', borderRadius: '8px', border: '1px solid #1e1e32',
    background: 'transparent', color: '#888', fontFamily: 'Nunito, sans-serif', fontWeight: 700,
    fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left',
  },

  // Tabs mobile
  tabsMobile: {
    display: 'flex', gap: '6px', padding: '14px 16px', borderBottom: '1px solid #1e1e32',
    overflowX: 'auto', background: '#0d0d14',
  },
  tabMobile: {
    flexShrink: 0, padding: '8px 16px', borderRadius: '999px', border: '1px solid #1e1e32',
    background: 'transparent', color: '#888', fontFamily: 'Nunito, sans-serif', fontWeight: 700,
    fontSize: '0.82rem', cursor: 'pointer',
  },
  tabMobileAtivo: { background: '#e63946', borderColor: '#e63946', color: '#fff' },

  // Main
  main: { flex: 1, minWidth: 0 },

  pageHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '28px' },
  pageHeaderTituloWrap: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' },
  secaoBarra: { width: '4px', height: '22px', background: '#e63946', borderRadius: '2px', display: 'inline-block' },
  pageHeaderTitulo: { fontFamily: '"Bebas Neue", sans-serif', fontSize: '1.8rem', letterSpacing: '1.5px', color: '#fff' },
  pageHeaderSubtitulo: { color: '#888', fontSize: '0.85rem', paddingLeft: '14px' },
  btnNovo: {
    background: '#e63946', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: '8px',
    fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.86rem', cursor: 'pointer',
  },

  // Stats
  statsGrid: { display: 'grid', gap: '14px', marginBottom: '28px' },
  statCard: { background: '#13131f', border: '1px solid', borderRadius: '12px', padding: '20px', textAlign: 'center' },

  // Card genérico
  card: { background: '#13131f', border: '1px solid #1e1e32', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' },
  cardTitulo: { fontWeight: 900, fontSize: '0.88rem', padding: '14px 18px', borderBottom: '1px solid #1e1e32', color: '#eee' },

  userRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', borderBottom: '1px solid #1e1e32' },
  userRowNome:  { fontWeight: 800, fontSize: '0.85rem', color: '#eee', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRowEmail: { color: '#888', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRowData:  { color: '#888', fontSize: '0.72rem', flexShrink: 0 },

  userAvatar: {
    width: '32px', height: '32px', borderRadius: '50%', background: '#e63946',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900,
    fontSize: '0.8rem', flexShrink: 0, color: '#fff',
  },
  userAvatarSm: {
    width: '28px', height: '28px', borderRadius: '50%', background: '#e63946',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900,
    fontSize: '0.72rem', flexShrink: 0, color: '#fff',
  },

  // Tabela
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left', padding: '12px 16px', fontSize: '0.68rem', fontWeight: 900,
    letterSpacing: '1.2px', textTransform: 'uppercase', color: '#888', borderBottom: '1px solid #1e1e32',
  },
  tr: { borderBottom: '1px solid rgba(30,30,50,0.5)' },
  td: { padding: '12px 16px', fontSize: '0.85rem', verticalAlign: 'middle' },
  tdComCapa: { display: 'flex', alignItems: 'center', gap: '10px' },
  tdCapa: { width: '32px', height: '44px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, background: '#0d0d14' },
  tdCapaImg: { width: '100%', height: '100%', objectFit: 'cover' },
  tdCapaPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' },
  tdTitulo: { fontWeight: 800, fontSize: '0.85rem', color: '#eee' },
  tdGenero: { color: '#888', fontSize: '0.78rem' },
  tdNota:   { color: '#f4a261', fontWeight: 800, fontSize: '0.82rem' },
  tdVoce:   { color: '#888', fontSize: '0.75rem' },

  badge: { background: '#1e1e32', color: '#aaa', padding: '2px 9px', borderRadius: '5px', fontSize: '0.75rem', fontWeight: 700 },

  btnEditar:  { background: 'rgba(76,201,240,0.1)', border: '1px solid rgba(76,201,240,0.3)', color: '#4cc9f0', padding: '5px 13px', borderRadius: '6px', fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' },
  btnDeletar: { background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)', color: '#e63946', padding: '5px 13px', borderRadius: '6px', fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' },

  // Mobile cards
  animesListaMobile: { display: 'flex', flexDirection: 'column', gap: '10px' },
  animeCardMobile: { display: 'flex', gap: '12px', background: '#13131f', border: '1px solid #1e1e32', borderRadius: '10px', padding: '12px' },
  animeCardMobileThumb: { width: '52px', height: '72px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, background: '#0d0d14' },
  animeCardMobileImg: { width: '100%', height: '100%', objectFit: 'cover' },
  animeCardMobilePlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' },
  animeCardMobileTitulo: { fontWeight: 800, fontSize: '0.85rem', color: '#eee', marginBottom: '4px' },
  animeCardMobileMeta: { fontSize: '0.74rem', color: '#888', marginBottom: '8px' },
  animeCardMobileAcoes: { display: 'flex', gap: '8px' },

  userCardMobile: { display: 'flex', alignItems: 'center', gap: '12px', background: '#13131f', border: '1px solid #1e1e32', borderRadius: '10px', padding: '12px' },
  userCardMobileStats: { fontSize: '0.72rem', color: '#666', marginTop: '2px' },
};