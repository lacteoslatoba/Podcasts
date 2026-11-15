import type { Podcast } from '../types';
import { searchPodcasts } from './itunes';

/**
 * Catálogo de Comediantes: busca podcasts de stand-up / chistes en español
 * y los clasifica POR COMEDIANTE (autor), para navegar a humoristas concretos.
 */

/** Términos de búsqueda que devuelven podcasts de chistes/stand-up mexicanos. */
const COMEDY_TERMS = [
  'comedia mexicana',
  'stand up mexico',
  'chistes mexicanos',
  'humor mexicano',
  'comedia podcast mexico',
  'chistes',
  'standup mexicano',
  'comedia en español',
  'monologos comedia',
  'humor latino',
  'stand up comedy',
  'radio de chistes',
  'comedia mexicana podcast',
  'risa mexicana',
];

/** Comediantes mexicanos/latinos conocidos (se busca su podcast en el catálogo). */
const KNOWN_COMEDIANS = [
  'franco escamilla',
  'ricardo o\'farrill',
  'sofia nino de rivera',
  'pepe y teo',
  'el standupero',
  'platanito',
  'escorpion dorado',
  'werevertumorro',
  'yordi rosado',
  'consuelo duval',
  'guerra de chistes',
  'teo gonzalez',
  'jorge ferguson',
  'adrian marcelo',
  'adam ray',
  'juan verduzco',
  'jose ordonez',
  'alex montiel',
  'el borras',
  'marianna sierra',
  'pablogh',
  'carlos mena',
  'el gallito english',
  'humor mexicano podcast',
];

/** País del catálogo de iTunes a consultar (México). */
const COUNTRY = 'mx';

/**
 * Top 10 curado de comediantes mexicanos (por popularidad/especiales en
 * streaming/presencia actual — no existe un ranking oficial). Verificado
 * uno por uno contra el catálogo real de Apple Podcasts México: solo 6 de
 * los 10 tienen podcast propio indexado ahí. A los otros 4 (Sofía Niño de
 * Rivera, Ricardo O'Farrill, Adal Ramones, Consuelo Duval) no se les
 * encontró un show propio real — se omiten en vez de mostrar algo que no es.
 */
export const TOP10_MX_COMEDIANS: Podcast[] = [
  {
    id: '1573138867',
    title: 'Franco Escamilla Tirando Bola',
    author: 'Franco Escamilla',
    description: 'De los standuperos más vistos en Netflix ("Bienvenido al mundo" y otros especiales).',
    feedUrl: 'https://anchor.fm/s/6046f7d4/podcast/rss',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts125/v4/7d/4e/ec/7d4eec04-45c0-545d-2630-d9c03874b682/mza_14756561140119264989.jpg/600x600bb.jpg',
  },
  {
    id: '1441251497',
    title: 'El Podcast de Alex Fernández',
    author: 'Alex Fernández',
    description: 'Conocido por "El mejor comediante del mundo" y su estilo autocrítico.',
    feedUrl: 'https://rss.libsyn.com/shows/137555/destinations/854750.xml',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/7d/04/14/7d041447-409b-5d74-cf0a-f787e1e2c537/mza_4145526341908913973.jpg/600x600bb.jpg',
  },
  {
    id: '1479254427',
    title: 'Seguimos Continuando Daniel Sosa - Podcast',
    author: 'Daniel Sosa',
    description: 'Especial "Sosafado" en Netflix, muy popular en giras.',
    feedUrl: 'https://rss.libsyn.com/shows/208991/destinations/1504856.xml',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts123/v4/94/1d/00/941d0060-a302-987f-1b02-f7d2a4c8ab6b/mza_6476003334258973590.jpg/600x600bb.jpg',
  },
  {
    id: '1586835622',
    title: 'Cero Serotonina',
    author: 'Carlos Ballarta',
    description: 'Comedia más oscura/irreverente ("Furia Ñera").',
    feedUrl: 'https://anchor.fm/s/56eaa08c/podcast/rss',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts125/v4/4e/ed/55/4eed55f6-c8df-d1b7-6a1e-d6e209026992/mza_6932317009711286566.jpg/600x600bb.jpg',
  },
  {
    id: '1608074125',
    title: 'El Pulso de la República',
    author: 'Chumel Torres',
    description: 'Mezcla comedia con sátira política, muy fuerte en YouTube y redes.',
    feedUrl: 'https://media.rss.com/elpulso/feed.xml',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts122/v4/b7/94/7a/b7947af7-5324-9d0b-b43f-0710f6ec77db/mza_10101813381018202615.jpg/600x600bb.jpg',
  },
  {
    id: '1766018364',
    title: 'Platanito World & Shiky',
    author: 'Platanito (Édgar Alan Ovando)',
    description: 'Masivo en TV abierta y redes, comedia más popular/mainstream.',
    feedUrl: 'https://feeds.simplecast.com/9E9cxNeF',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/8c/57/f4/8c57f44f-7aca-bebc-da1d-c9471f8f360a/mza_18065237259902138301.jpg/600x600bb.jpg',
  },
  {
    id: '1504019123',
    title: 'Guerra de Chistes',
    author: 'Carlos Salgado',
    description: 'El clásico formato de duelo de chistes en radio, en podcast.',
    feedUrl: 'https://anchor.fm/s/16e0269c/podcast/rss',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts115/v4/9d/9b/9f/9d9b9f39-e253-b17b-2d5a-1ba462d9e152/mza_3190506789642940581.jpg/600x600bb.jpg',
  },
];

/** Normaliza el nombre de un comediante para agrupar sin distinguir mayúsculas. */
function normalize(name: string): string {
  return name.toLowerCase().replace(/'/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Reúne podcasts de comedia en español y los separa en filas POR COMEDIANTE.
 * Prioriza el catálogo curado con portada real y añade búsquedas que tengan
 * imagen, para que las tarjetas se vean con portada (como los audiolibros).
 */
export async function fetchComedians(): Promise<Podcast[]> {
  const seen = new Set<string>();
  const all: Podcast[] = [];

  // 1) Catálogo curado con portadas reales siempre incluidas
  for (const p of TOP10_MX_COMEDIANS) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    all.push(p);
  }

  // 2) Búsquedas en el catálogo de iTunes, solo las que traen portada
  const terms = [...COMEDY_TERMS, ...KNOWN_COMEDIANS];
  const results = await Promise.allSettled(terms.map((t) => searchPodcasts(t, COUNTRY)));
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const p of r.value) {
      if (seen.has(p.id)) continue;
      if (!p.artworkUrl) continue; // solo con imagen, como audiolibros
      seen.add(p.id);
      all.push(p);
    }
  }
  return all;
}

/**
 * Agrupa una lista de podcasts de comedia por comediante (autor).
 * Devuelve un mapa { comediante: shows[] } ordenado por cantidad de shows.
 */
export function groupByComedian(shows: Podcast[]): { comedian: string; shows: Podcast[] }[] {
  const buckets = new Map<string, Podcast[]>();
  for (const s of shows) {
    const key = normalize(s.author) || 'Comediante';
    const list = buckets.get(key) ?? [];
    list.push(s);
    buckets.set(key, list);
  }
  const rows = [];
  for (const [comedian, list] of buckets.entries()) {
    rows.push({ comedian, shows: list });
  }
  rows.sort((a, b) => b.shows.length - a.shows.length);
  return rows;
}

/** Etiquetas de "género/categoría" de humor según el contenido del show. */
export interface ComedianCategory {
  id: string;
  name: string;
}

/**
 * Clasifica un podcast de comedia en una categoría de humor (género), según
 * palabras clave del título/autor. Orden estable para la navegación.
 */
export function categorizeComedian(p: Podcast): ComedianCategory {
  const hay = `${p.title} ${p.author} ${p.description}`.toLowerCase();
  if (/(stand.?up|monologo|especial|comedia en vivo)/.test(hay)) {
    return { id: 'standup', name: 'Stand-up y Monólogos' };
  }
  if (/(chiste|guerra|albures|humor verde)/.test(hay)) {
    return { id: 'chistes', name: 'Chistes' };
  }
  if (/(sátira|satira|politica|noticias|actualidad|pulso)/.test(hay)) {
    return { id: 'satira', name: 'Sátira y Actualidad' };
  }
  if (/(entrevista|platica|conversacion)/.test(hay)) {
    return { id: 'entrevistas', name: 'Entrevistas y Charlas' };
  }
  return { id: 'variado', name: 'Más Comedia' };
}

/** Orden de presentación de las categorías. */
const CATEGORY_ORDER = ['standup', 'chistes', 'satira', 'entrevistas', 'variado'];

/** Agrupa los shows de comedia por categoría de humor (género). */
export function groupByCategory(shows: Podcast[]): { category: ComedianCategory; shows: Podcast[] }[] {
  const buckets = new Map<string, Podcast[]>();
  for (const s of shows) {
    const cat = categorizeComedian(s);
    const list = buckets.get(cat.id) ?? [];
    list.push(s);
    buckets.set(cat.id, list);
  }
  const rows = [];
  for (const [id, list] of buckets.entries()) {
    const cat = categorizeComedian(list[0]);
    rows.push({ category: cat, shows: list });
  }
  rows.sort(
    (a, b) =>
      CATEGORY_ORDER.indexOf(a.category.id) - CATEGORY_ORDER.indexOf(b.category.id) ||
      b.shows.length - a.shows.length,
  );
  return rows;
}

// Re-exportamos para usar en la pantalla de búsqueda directa por comediante
export { searchPodcasts };
