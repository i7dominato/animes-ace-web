import { useState, useEffect } from 'react';

// Hook que retorna o tamanho atual da janela
// e atualiza automaticamente quando o usuário redimensiona
export function useWindowSize() {
  const [size, setSize] = useState({
    width:  window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    function handle() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  // Atalhos úteis
  return {
    ...size,
    isMobile: size.width < 768,
    isTablet: size.width >= 768 && size.width < 1024,
  };
}