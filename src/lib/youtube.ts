/**
 * Utilidades para procesar URLs de YouTube en la Videoteca Táctica.
 */

/**
 * Extrae el ID del video de una URL de YouTube en múltiples formatos sostenidos:
 * - https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * - https://youtu.be/dQw4w9WgXcQ
 * - https://www.youtube.com/embed/dQw4w9WgXcQ
 * - https://www.youtube.com/shorts/dQw4w9WgXcQ
 */
export function getYoutubeId(url: string): string | null {
  if (!url) return null;
  
  try {
    // Limpiar espacios en blanco
    const cleanUrl = url.trim();
    
    // Regex para capturar el ID de YouTube
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = cleanUrl.match(regExp);
    
    if (match && match[2].length === 11) {
      return match[2];
    }
  } catch (error) {
    console.error("Error parsing YouTube URL:", error);
  }
  
  return null;
}

/**
 * Genera la URL para cargar en el iframe (Modo Teatro) con autoplay
 */
export function getYoutubeEmbedUrl(url: string): string {
  const videoId = getYoutubeId(url);
  if (!videoId) return url;
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`;
}

/**
 * Genera la URL de la miniatura de alta resolución del video
 */
export function getYoutubeThumbnailUrl(url: string): string {
  const videoId = getYoutubeId(url);
  if (!videoId) {
    // Si no es una URL válida, devolver una imagen de marcador de posición deportiva premium
    return 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=85';
  }
  // mqdefault o hqdefault son confiables en YouTube
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Valida si una URL es un enlace de YouTube válido
 */
export function isValidYoutubeUrl(url: string): boolean {
  return getYoutubeId(url) !== null;
}
