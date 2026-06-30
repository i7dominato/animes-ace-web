// Hook personalizado para gerenciar título e meta tags de SEO
// Uso: useSEO({ titulo: 'Attack on Titan', descricao: '...', imagem: '...' })

export function useSEO({ titulo, descricao, imagem } = {}) {
  const siteName    = 'Animes Ace';
  const defaultDesc = 'Assista animes online gratuitamente. Catálogo completo, progresso automático e muito mais.';
  const defaultImg  = 'https://animes-ace-web.vercel.app/og-image.png';

  const tituloFinal    = titulo ? `${titulo} — ${siteName}` : siteName;
  const descricaoFinal = descricao ?? defaultDesc;
  const imagemFinal    = imagem ?? defaultImg;

  // Atualiza o <title>
  document.title = tituloFinal;

  // Função auxiliar pra setar meta tags
  function setMeta(name, content, property = false) {
    const attr     = property ? 'property' : 'name';
    let el         = document.querySelector(`meta[${attr}="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  // Meta tags padrão
  setMeta('description', descricaoFinal);

  // Open Graph (Facebook, WhatsApp, Discord)
  setMeta('og:title',       tituloFinal,    true);
  setMeta('og:description', descricaoFinal, true);
  setMeta('og:image',       imagemFinal,    true);
  setMeta('og:type',        'website',      true);
  setMeta('og:site_name',   siteName,       true);

  // Twitter Card
  setMeta('twitter:card',        'summary_large_image');
  setMeta('twitter:title',       tituloFinal);
  setMeta('twitter:description', descricaoFinal);
  setMeta('twitter:image',       imagemFinal);
}
