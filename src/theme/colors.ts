// Sistema de diseño y paleta de colores Amazon Music

export const Colors = {
  // Fondos estilo Amazon Music (Navy Slate & Dark Teal)
  background: '#0B131F',
  surface: '#152238',
  surfaceElevated: '#1D2D47',
  surfaceGlass: 'rgba(21, 34, 56, 0.88)',
  surfaceHighlight: 'rgba(0, 168, 225, 0.08)',

  // Bordes y separadores
  border: '#223450',
  borderLight: '#2C4366',
  borderGlow: 'rgba(0, 168, 225, 0.4)',

  // Colores primarios (Amazon Cyan / Electric Aqua)
  primary: '#00A8E1',
  primaryDark: '#0077A3',
  primaryLight: '#00D8F6',
  primaryGlow: 'rgba(0, 168, 225, 0.35)',

  // Acentos estilo Amazon Music
  accent: '#00D8F6',      // Cian Brilla Amazon
  accentBlue: '#2563EB',  // Azul Real Amazon
  accentGreen: '#00E676', // Verde Amazon
  accentRose: '#FF4757',  // Rosa/Coral

  // Textos
  text: '#FFFFFF',
  textSecondary: '#A0AEC0',
  textMuted: '#64748B',

  // Estados
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#00E676',

  // Gradiente característico de Amazon Music
  gradientAmazon: ['#00A8E1', '#7B2CBF'],

  // Categorías de género estilo Amazon Music (alimentan las filas dinámicas
  // de Inicio y la grilla de "Explorar géneros" en Buscar — cuantas más haya,
  // más amplia se ve la base de podcasts sin necesitar una lista fija).
  categories: [
    { id: 'tech', name: 'Tecnología', icon: 'hardware-chip-outline', colors: ['#00A8E1', '#2563EB'] },
    { id: 'business', name: 'Negocios', icon: 'briefcase-outline', colors: ['#00D8F6', '#0077A3'] },
    { id: 'stories', name: 'Historias', icon: 'book-outline', colors: ['#7B2CBF', '#00A8E1'] },
    { id: 'comedy', name: 'Comedia', icon: 'happy-outline', colors: ['#FF4757', '#F59E0B'] },
    { id: 'science', name: 'Ciencia', icon: 'planet-outline', colors: ['#00E676', '#00A8E1'] },
    { id: 'health', name: 'Salud y Mente', icon: 'fitness-outline', colors: ['#2563EB', '#7B2CBF'] },
    { id: 'truecrime', name: 'True Crime', icon: 'skull-outline', colors: ['#EF4444', '#7B2CBF'] },
    { id: 'sports', name: 'Deportes', icon: 'football-outline', colors: ['#00E676', '#0077A3'] },
    { id: 'film-tv', name: 'Cine y TV', icon: 'film-outline', colors: ['#F59E0B', '#EF4444'] },
    { id: 'news', name: 'Noticias', icon: 'newspaper-outline', colors: ['#2563EB', '#00A8E1'] },
    { id: 'education', name: 'Educación', icon: 'school-outline', colors: ['#00D8F6', '#7B2CBF'] },
    { id: 'music', name: 'Música', icon: 'musical-notes-outline', colors: ['#EC4899', '#7B2CBF'] },
    { id: 'travel', name: 'Viajes', icon: 'airplane-outline', colors: ['#00A8E1', '#00E676'] },
    { id: 'money', name: 'Finanzas Personales', icon: 'cash-outline', colors: ['#F59E0B', '#00D8F6'] },
    { id: 'gaming', name: 'Videojuegos', icon: 'game-controller-outline', colors: ['#7B2CBF', '#00D8F6'] },
    { id: 'culture', name: 'Arte y Cultura', icon: 'color-palette-outline', colors: ['#FF4757', '#00A8E1'] },
  ],
};
