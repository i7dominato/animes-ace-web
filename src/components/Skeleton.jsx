// Componente base — bloco cinza animado que simula o conteúdo carregando
export function Skeleton({ width = '100%', height = '16px', borderRadius = '6px', style = {} }) {
  return (
    <div style={{
      width,
      height,
      borderRadius,
      background:  'linear-gradient(90deg, #13131f 25%, #1a1a2e 50%, #13131f 75%)',
      backgroundSize: '200% 100%',
      animation:   'shimmer 1.4s infinite',
      ...style,
    }} />
  );
}

// Injeta a animação CSS globalmente uma vez
if (typeof document !== 'undefined') {
  const id = 'skeleton-style';
  if (!document.getElementById(id)) {
    const style = document.createElement('style');
    style.id    = id;
    style.textContent = `
      @keyframes shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    document.head.appendChild(style);
  }
}

// ── Skeleton de card de anime (proporção 2:3) ──────────
export function SkeletonCard() {
  return (
    <div style={{ cursor: 'default' }}>
      <div style={{ aspectRatio: '2/3', borderRadius: '8px', overflow: 'hidden', border: '1px solid #1e1e32' }}>
        <Skeleton height="100%" borderRadius="0" />
      </div>
      <div style={{ padding: '8px 2px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <Skeleton height="12px" width="85%" />
        <Skeleton height="10px" width="55%" />
      </div>
    </div>
  );
}

// ── Skeleton de hero ───────────────────────────────────
export function SkeletonHero({ isMobile }) {
  return (
    <div style={{
      height:     isMobile ? '56vh' : '82vh',
      background: '#0d0d14',
      display:    'flex',
      alignItems: 'flex-end',
      padding:    isMobile ? '0 20px 36px' : '0 60px 56px',
    }}>
      <div style={{ maxWidth: '520px', width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Skeleton height="20px" width="140px" borderRadius="999px" />
        <Skeleton height={isMobile ? '48px' : '72px'} width="90%" />
        <div style={{ display: 'flex', gap: '8px' }}>
          <Skeleton height="28px" width="64px" borderRadius="6px" />
          <Skeleton height="28px" width="48px" borderRadius="6px" />
          <Skeleton height="28px" width="80px" borderRadius="6px" />
        </div>
        <Skeleton height="14px" width="100%" />
        <Skeleton height="14px" width="80%" />
        <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
          <Skeleton height="48px" width="140px" borderRadius="8px" />
          <Skeleton height="48px" width="160px" borderRadius="8px" />
        </div>
      </div>
    </div>
  );
}

// ── Skeleton de página de anime (hero com capa lateral) ─
export function SkeletonAnimeHero({ isMobile }) {
  return (
    <div style={{
      minHeight:  isMobile ? 'auto' : '64vh',
      background: '#0d0d14',
      display:    'flex',
      alignItems: 'flex-end',
      padding:    isMobile ? '24px 20px' : '0 56px 44px',
    }}>
      <div style={{
        display:       'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap:           isMobile ? '18px' : '32px',
        maxWidth:      '900px',
        width:         '100%',
      }}>
        <Skeleton
          width={isMobile ? '128px' : '190px'}
          height={isMobile ? '192px' : '285px'}
          borderRadius="10px"
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: isMobile ? '0' : '40px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Skeleton height="24px" width="60px" borderRadius="999px" />
            <Skeleton height="24px" width="72px" borderRadius="999px" />
          </div>
          <Skeleton height="52px" width="75%" />
          <div style={{ display: 'flex', gap: '8px' }}>
            <Skeleton height="26px" width="52px" borderRadius="6px" />
            <Skeleton height="26px" width="44px" borderRadius="6px" />
            <Skeleton height="26px" width="90px" borderRadius="6px" />
          </div>
          <Skeleton height="14px" width="100%" />
          <Skeleton height="14px" width="90%" />
          <Skeleton height="14px" width="70%" />
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <Skeleton height="44px" width="140px" borderRadius="8px" />
            <Skeleton height="44px" width="130px" borderRadius="8px" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton de item de episódio ───────────────────────
export function SkeletonEpisodio() {
  return (
    <div style={{ display: 'flex', gap: '12px', background: '#13131f', border: '1px solid #1e1e32', borderRadius: '10px', overflow: 'hidden' }}>
      <Skeleton width="110px" height="62px" borderRadius="0" />
      <div style={{ flex: 1, padding: '10px 10px 10px 0', display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
        <Skeleton height="13px" width="70%" />
        <Skeleton height="11px" width="40%" />
      </div>
    </div>
  );
}

// ── Skeleton de comentário ─────────────────────────────
export function SkeletonComentario() {
  return (
    <div style={{ display: 'flex', gap: '12px', paddingBottom: '20px', marginBottom: '20px', borderBottom: '1px solid #1e1e32' }}>
      <Skeleton width="36px" height="36px" borderRadius="50%" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Skeleton height="13px" width="100px" />
          <Skeleton height="11px" width="70px" />
        </div>
        <Skeleton height="13px" width="100%" />
        <Skeleton height="13px" width="80%" />
      </div>
    </div>
  );
}