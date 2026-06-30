import { useNavigate } from 'react-router-dom';
import { useWindowSize } from '../hooks/useWindowSize';
import { useSEO } from '../hooks/useSEO';

export default function NotFound() {
  const navigate     = useNavigate();
  const { isMobile } = useWindowSize();

  useSEO({ titulo: '404 — Página não encontrada' });

  return (
    <div style={s.page}>
      <div style={s.bgGlow} />

      <div style={s.content}>
        <div style={s.codigo404}>404</div>

        <h1 style={{ ...s.titulo, fontSize: isMobile ? '1.6rem' : '2.2rem' }}>
          Esse episódio não existe
        </h1>

        <p style={s.descricao}>
          A página que você procura foi cancelada, movida ou nunca existiu neste universo.
        </p>

        <div style={s.acoes}>
          <button style={s.btnPrimario} onClick={() => navigate('/')}>
            ▶ Voltar ao início
          </button>
          <button style={s.btnSecundario} onClick={() => navigate('/catalogo')}>
            Explorar catálogo
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight:      '100vh',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    background:     '#0a0a0f',
    position:       'relative',
    overflow:       'hidden',
    padding:        '0 20px',
  },
  bgGlow: {
    position:   'absolute',
    top:        '50%',
    left:       '50%',
    transform:  'translate(-50%, -50%)',
    width:      '600px',
    height:     '600px',
    background: 'radial-gradient(circle, rgba(230,57,70,0.12) 0%, transparent 70%)',
    zIndex:     0,
  },
  content: {
    position:  'relative',
    zIndex:    1,
    textAlign: 'center',
    maxWidth:  '440px',
  },
  codigo404: {
    fontFamily:    '"Bebas Neue", sans-serif',
    fontSize:      'clamp(5rem, 18vw, 9rem)',
    letterSpacing: '6px',
    color:         '#e63946',
    lineHeight:    1,
    marginBottom:  '8px',
    textShadow:    '0 0 60px rgba(230,57,70,0.4)',
  },
  titulo: {
    fontFamily:    '"Bebas Neue", sans-serif',
    letterSpacing: '1.5px',
    color:         '#fff',
    marginBottom:  '12px',
  },
  descricao: {
    color:        '#888',
    fontSize:     '0.92rem',
    lineHeight:   1.6,
    marginBottom: '32px',
  },
  acoes: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '12px',
  },
  btnPrimario: {
    background:   '#e63946',
    color:        '#fff',
    border:       'none',
    padding:      '14px 28px',
    borderRadius: '8px',
    fontWeight:   800,
    fontSize:     '0.95rem',
    cursor:       'pointer',
    fontFamily:   'Nunito, sans-serif',
  },
  btnSecundario: {
    background:   'transparent',
    color:        '#888',
    border:       '1px solid #1e1e32',
    padding:      '14px 28px',
    borderRadius: '8px',
    fontWeight:   700,
    fontSize:     '0.95rem',
    cursor:       'pointer',
    fontFamily:   'Nunito, sans-serif',
  },
};