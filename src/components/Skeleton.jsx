// Componente base de skeleton — um bloco cinza com animação de pulso
export function Skeleton({ width = '100%', height = '16px', radius = '6px', style = {} }) {
  return (
    <div
      className="skeleton-pulse"
      style={{
        width, height, borderRadius: radius,
        background: 'linear-gradient(90deg, #13131f 25%, #1c1c2e 50%, #13131f 75%)',
        backgroundSize: '200% 100%',
        ...style,
      }}
    />
  );
}

// ── SKELETON: Card de anime (grid da Home/Catálogo) ────
export function SkeletonAnimeCard() {
  return (
    <div>
      <Skeleton height="0" style={{ paddingBottom: '150%', borderRadius: '8px' }} />
      <div style={{ padding: '8px 2px 0' }}>
        <Skeleton height="12px" width="90%" style={{ marginBottom: '6px' }} />
        <Skeleton height="10px" width="60%" />
      </div>
    </div>
  );
}

// ── SKELETON: Grid de cards (várias colunas) ───────────
export function SkeletonGrid({ colunas = 6, linhas = 2, gap = '18px' }) {
  const total = colunas * linhas;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${colunas}, 1fr)`, gap }}>
      {Array.from({ length: total }).map((_, i) => <SkeletonAnimeCard key={i} />)}
    </div>
  );
}

// ── SKELETON: Hero da Home ──────────────────────────────
export function SkeletonHero({ isMobile }) {
  return (
    <div style={{
      height: isMobile ? '56vh' : '82vh',
      background: '#0d0d14',
      display: 'flex',
      alignItems: 'flex-end',
      padding: isMobile ? '0 20px 36px' : '0 60px 56px',
    }}>
      <div style={{ maxWidth: '680px', width: '100%' }}>
        <Skeleton width="140px" height="22px" radius="999px" style={{ marginBottom: '16px' }} />
        <Skeleton width="70%" height={isMobile ? '2.4rem' : '4rem'} style={{ marginBottom: '16px' }} />
        <Skeleton width="50%" height="24px" style={{ marginBottom: '20px' }} />
        {!isMobile && (
          <>
            <Skeleton width="90%" height="14px" style={{ marginBottom: '8px' }} />
            <Skeleton width="70%" height="14px" style={{ marginBottom: '26px' }} />
          </>
        )}
        <div style={{ display: 'flex', gap: '12px' }}>
          <Skeleton width="140px" height="48px" radius="8px" />
          <Skeleton width="180px" height="48px" radius="8px" />
        </div>
      </div>
    </div>
  );
}

// ── SKELETON: Página do Anime (hero + episódios) ───────
export function SkeletonAnimePage({ isMobile }) {
  return (
    <div style={{ paddingTop: '64px' }}>
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '18px' : '32px',
        padding: isMobile ? '24px 20px' : '48px 56px',
        background: '#0d0d14',
      }}>
        <Skeleton width={isMobile ? '128px' : '190px'} height="0" style={{ paddingBottom: isMobile ? '192px' : '285px', borderRadius: '10px', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
            <Skeleton width="60px" height="22px" radius="999px" />
            <Skeleton width="80px" height="22px" radius="999px" />
          </div>
          <Skeleton width="80%" height={isMobile ? '1.8rem' : '2.8rem'} style={{ marginBottom: '14px' }} />
          <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
            <Skeleton width="60px" height="24px" radius="6px" />
            <Skeleton width="50px" height="24px" radius="6px" />
            <Skeleton width="90px" height="24px" radius="6px" />
          </div>
          {!isMobile && <Skeleton width="90%" height="60px" style={{ marginBottom: '20px' }} />}
          <div style={{ display: 'flex', gap: '10px' }}>
            <Skeleton width="150px" height="46px" radius="8px" />
            <Skeleton width="130px" height="46px" radius="8px" />
          </div>
        </div>
      </div>

      <div style={{ padding: isMobile ? '20px' : '22px 56px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', background: '#13131f', borderRadius: '10px', padding: '0', overflow: 'hidden' }}>
              <Skeleton width="110px" height="0" style={{ paddingBottom: '62px', borderRadius: 0, flexShrink: 0 }} />
              <div style={{ padding: '10px 10px 10px 0', flex: 1 }}>
                <Skeleton width="80%" height="12px" style={{ marginBottom: '8px' }} />
                <Skeleton width="40%" height="10px" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SKELETON: Player (barra + info) ────────────────────
export function SkeletonPlayer({ isMobile }) {
  return (
    <div style={{ paddingTop: '64px' }}>
      <Skeleton height="0" style={{ paddingBottom: '56.25%', borderRadius: 0 }} />
      <div style={{ padding: isMobile ? '20px' : '28px 40px' }}>
        <Skeleton width="200px" height="12px" style={{ marginBottom: '14px' }} />
        <Skeleton width="60%" height="1.8rem" style={{ marginBottom: '12px' }} />
        <Skeleton width="30%" height="14px" />
      </div>
    </div>
  );
}

// ── SKELETON: Lista de comentários ─────────────────────
export function SkeletonComentarios() {
  return (
    <div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <Skeleton width="36px" height="36px" radius="50%" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <Skeleton width="120px" height="12px" style={{ marginBottom: '8px' }} />
            <Skeleton width="90%" height="12px" style={{ marginBottom: '4px' }} />
            <Skeleton width="60%" height="12px" />
          </div>
        </div>
      ))}
    </div>
  );
}