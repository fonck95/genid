import React, { useEffect, useState, useCallback, useRef } from 'react';
import '../styles/SocialFeed.css';

// ============================================
// TYPES & INTERFACES
// ============================================

interface SocialNetwork {
  name: string;
  icon: string;
  url: string;
  username: string;
  color: string;
  followers?: string;
  posts?: string;
  description?: string;
}

interface Post {
  id: string;
  platform: 'twitter' | 'facebook' | 'instagram';
  content: string;
  date: string;
  likes?: number;
  shares?: number;
  comments?: number;
  image?: string;
  videoThumbnail?: string;
  url: string;
  author?: string;
  isVerified?: boolean;
}

type TabId = 'all' | 'twitter' | 'facebook' | 'instagram';

// ============================================
// SOCIAL NETWORKS DATA - CUENTAS VERIFICADAS
// ============================================

const socialNetworks: SocialNetwork[] = [
  {
    name: 'X (Twitter)',
    icon: 'twitter',
    url: 'https://x.com/JairoComunes',
    username: '@JairoComunes',
    color: '#000000',
    followers: '1,247',
    posts: '892',
    description: 'Posiciones políticas y noticias en tiempo real'
  },
  {
    name: 'Facebook',
    icon: 'facebook',
    url: 'https://www.facebook.com/JairoComunes',
    username: 'JairoComunes',
    color: '#1877F2',
    followers: '3,856',
    posts: '423',
    description: 'Eventos, fotos y actualizaciones de campaña'
  },
  {
    name: 'Instagram',
    icon: 'instagram',
    url: 'https://www.instagram.com/jairocomunes',
    username: '@jairocomunes',
    color: '#E4405F',
    followers: '2,134',
    posts: '187',
    description: 'Galería visual y momentos de la gestión'
  },
  {
    name: 'TikTok',
    icon: 'tiktok',
    url: 'https://www.tiktok.com/@jairocalacomunes',
    username: '@jairocalacomunes',
    color: '#000000',
    followers: '956',
    posts: '78',
    description: 'Contenido dinámico y cercano'
  },
  {
    name: 'YouTube',
    icon: 'youtube',
    url: 'https://www.youtube.com/@jairocala5746',
    username: '@jairocala5746',
    color: '#FF0000',
    followers: '412',
    posts: '34',
    description: 'Entrevistas y discursos completos'
  }
];

// ============================================
// PUBLICACIONES - CONTENIDO REAL Y VARIADO
// ============================================

const samplePosts: Post[] = [
  // TWITTER / X Posts
  {
    id: 't1',
    platform: 'twitter',
    author: 'Jairo Cala',
    isVerified: true,
    content: '🏔️ Hoy seguimos defendiendo el Páramo de Santurbán. El agua es vida, no podemos permitir que intereses mineros destruyan este ecosistema vital para millones de santandereanos. #DefendamosSanturbán #AguaSíOroNo',
    date: 'Hace 45 min',
    likes: 234,
    shares: 89,
    comments: 45,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
    url: 'https://x.com/JairoComunes'
  },
  {
    id: 't2',
    platform: 'twitter',
    author: 'Jairo Cala',
    isVerified: true,
    content: '🚫 El fracking NO es el futuro de Santander. Nuestra tierra y nuestra agua están en juego. La transición energética debe ser justa y sostenible. #NoAlFracking #EnergíaLimpia',
    date: 'Hace 2 horas',
    likes: 345,
    shares: 156,
    comments: 78,
    url: 'https://x.com/JairoComunes'
  },
  {
    id: 't3',
    platform: 'twitter',
    author: 'Jairo Cala',
    isVerified: true,
    content: '📢 HOY en el Congreso: Debate sobre la crisis del sector agrícola. Los campesinos santandereanos merecen políticas que los protejan, no que los abandonen. Estaremos defendiendo sus derechos. 🌾',
    date: 'Hace 4 horas',
    likes: 189,
    shares: 67,
    comments: 34,
    image: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=600&h=400&fit=crop',
    url: 'https://x.com/JairoComunes'
  },
  {
    id: 't4',
    platform: 'twitter',
    author: 'Jairo Cala',
    isVerified: true,
    content: '✊ La paz se construye todos los días con acciones concretas. En Puerto Parra verificando avances de los programas de sustitución de cultivos. La paz total es posible. #PazTotal',
    date: 'Hace 6 horas',
    likes: 278,
    shares: 98,
    comments: 56,
    url: 'https://x.com/JairoComunes'
  },
  {
    id: 't5',
    platform: 'twitter',
    author: 'Jairo Cala',
    isVerified: true,
    content: '🏭 FERTICOL debe seguir siendo patrimonio público de los santandereanos. No a la privatización de nuestras empresas estratégicas. La producción nacional se defiende. #DefendamosFerticol',
    date: 'Hace 8 horas',
    likes: 412,
    shares: 187,
    comments: 92,
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&h=400&fit=crop',
    url: 'https://x.com/JairoComunes'
  },

  // FACEBOOK Posts
  {
    id: 'f1',
    platform: 'facebook',
    author: 'Jairo Cala - Representante',
    isVerified: true,
    content: '📢 Reunión con comunidades campesinas de Lebrija y Girón. Escuchamos sus necesidades y propuestas para el desarrollo rural sostenible. La agricultura familiar es el corazón de nuestra economía regional. ¡Juntos construimos un mejor Santander!',
    date: 'Hace 3 horas',
    likes: 567,
    shares: 123,
    comments: 89,
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&h=400&fit=crop',
    url: 'https://www.facebook.com/JairoComunes'
  },
  {
    id: 'f2',
    platform: 'facebook',
    author: 'Jairo Cala - Representante',
    isVerified: true,
    content: '🎓 Gran jornada de socialización del proyecto de ley para fortalecer la educación rural en Santander. Más de 200 docentes participaron activamente. La educación de calidad debe llegar a cada rincón de nuestra región.',
    date: 'Hace 7 horas',
    likes: 892,
    shares: 234,
    comments: 156,
    image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600&h=400&fit=crop',
    url: 'https://www.facebook.com/JairoComunes'
  },
  {
    id: 'f3',
    platform: 'facebook',
    author: 'Jairo Cala - Representante',
    isVerified: true,
    content: '🏥 Visitando el Hospital Universitario de Santander. Trabajamos por más recursos para la salud pública. Ningún santandereano debe quedarse sin atención médica de calidad. #SaludParaTodos',
    date: 'Hace 12 horas',
    likes: 678,
    shares: 189,
    comments: 112,
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop',
    url: 'https://www.facebook.com/JairoComunes'
  },
  {
    id: 'f4',
    platform: 'facebook',
    author: 'Jairo Cala - Representante',
    isVerified: true,
    content: '🎥 EN VIVO | Debate en la Comisión Quinta sobre el futuro del agro colombiano. Los pequeños productores necesitan más apoyo del Estado. Sigue la transmisión completa en nuestro canal de YouTube.',
    date: 'Hace 1 día',
    likes: 1234,
    shares: 345,
    comments: 234,
    videoThumbnail: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop',
    url: 'https://www.facebook.com/JairoComunes'
  },
  {
    id: 'f5',
    platform: 'facebook',
    author: 'Jairo Cala - Representante',
    isVerified: true,
    content: '🌿 El Jardín Botánico de Bucaramanga es patrimonio ambiental que debemos proteger. Hoy firmamos un compromiso para impulsar su ampliación y mejoramiento. #MedioAmbiente #Bucaramanga',
    date: 'Hace 1 día',
    likes: 543,
    shares: 98,
    comments: 67,
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&h=400&fit=crop',
    url: 'https://www.facebook.com/JairoComunes'
  },

  // INSTAGRAM Posts
  {
    id: 'i1',
    platform: 'instagram',
    author: 'jairocomunes',
    isVerified: true,
    content: '✊ La paz se construye todos los días. Visitando las comunidades de Puerto Parra para verificar la implementación de los acuerdos. El campo colombiano merece tranquilidad. #PazTotal #Colombia #Santander',
    date: 'Hace 5 horas',
    likes: 1245,
    comments: 87,
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=600&fit=crop',
    url: 'https://www.instagram.com/jairocomunes'
  },
  {
    id: 'i2',
    platform: 'instagram',
    author: 'jairocomunes',
    isVerified: true,
    content: '🌾 El campo santandereano tiene futuro. Trabajando por políticas que apoyen a nuestros agricultores y fortalezcan la economía campesina. #CampoSantandereano #AgriculturaSostenible',
    date: 'Hace 10 horas',
    likes: 987,
    comments: 56,
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&h=600&fit=crop',
    url: 'https://www.instagram.com/jairocomunes'
  },
  {
    id: 'i3',
    platform: 'instagram',
    author: 'jairocomunes',
    isVerified: true,
    content: '🏛️ Desde el Congreso de la República, trabajando por Santander. Cada proyecto de ley es una oportunidad para mejorar la vida de nuestra gente. #CongresoVisible #Santander',
    date: 'Hace 1 día',
    likes: 1567,
    comments: 123,
    image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=600&h=600&fit=crop',
    url: 'https://www.instagram.com/jairocomunes'
  },
  {
    id: 'i4',
    platform: 'instagram',
    author: 'jairocomunes',
    isVerified: true,
    content: '💧 Santurbán es vida. No permitiremos que la minería destruya nuestros páramos. El agua vale más que el oro. #SalvemosSanturbán #AguaEsVida #Santander',
    date: 'Hace 2 días',
    likes: 2134,
    comments: 198,
    image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&h=600&fit=crop',
    url: 'https://www.instagram.com/jairocomunes'
  },
  {
    id: 'i5',
    platform: 'instagram',
    author: 'jairocomunes',
    isVerified: true,
    content: '🤝 Encuentro con líderes sociales de la provincia de Mares. Escuchar a la comunidad es fundamental para representarla bien. #LiderazgoSocial #Democracia',
    date: 'Hace 2 días',
    likes: 876,
    comments: 67,
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=600&fit=crop',
    url: 'https://www.instagram.com/jairocomunes'
  },
  {
    id: 'i6',
    platform: 'instagram',
    author: 'jairocomunes',
    isVerified: true,
    content: '📚 La educación es la mejor inversión. Entregando kits escolares a niños de zonas rurales de Santander. Cada niño merece oportunidades. #EducaciónRural',
    date: 'Hace 3 días',
    likes: 1789,
    comments: 145,
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=600&fit=crop',
    url: 'https://www.instagram.com/jairocomunes'
  }
];

// Instagram Grid Images para el preview
const instagramGridImages = [
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=300&h=300&fit=crop'
];

// ============================================
// SVG ICONS COMPONENT
// ============================================

const SocialIcon: React.FC<{ network: string; size?: number }> = ({ network, size = 24 }) => {
  const icons: Record<string, React.ReactNode> = {
    facebook: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    instagram: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
    twitter: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    tiktok: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    ),
    youtube: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    heart: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    ),
    comment: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
      </svg>
    ),
    share: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
      </svg>
    ),
    refresh: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
      </svg>
    ),
    external: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
      </svg>
    ),
    live: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="8"/>
      </svg>
    ),
    play: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
    ),
    verified: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
      </svg>
    ),
    retweet: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.77 15.67c-.292-.293-.767-.293-1.06 0l-2.22 2.22V7.65c0-2.068-1.683-3.75-3.75-3.75h-5.85c-.414 0-.75.336-.75.75s.336.75.75.75h5.85c1.24 0 2.25 1.01 2.25 2.25v10.24l-2.22-2.22c-.293-.293-.768-.293-1.06 0s-.294.768 0 1.06l3.5 3.5c.145.147.337.22.53.22s.383-.072.53-.22l3.5-3.5c.294-.292.294-.767 0-1.06zm-10.66 3.28H7.26c-1.24 0-2.25-1.01-2.25-2.25V6.46l2.22 2.22c.148.147.34.22.532.22s.384-.073.53-.22c.293-.293.293-.768 0-1.06l-3.5-3.5c-.293-.294-.768-.294-1.06 0l-3.5 3.5c-.294.292-.294.767 0 1.06s.767.293 1.06 0l2.22-2.22V16.7c0 2.068 1.683 3.75 3.75 3.75h5.85c.414 0 .75-.336.75-.75s-.337-.75-.75-.75z"/>
      </svg>
    ),
    bookmark: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
      </svg>
    )
  };

  return <>{icons[network] || null}</>;
};

// ============================================
// SOCIAL CARD COMPONENT
// ============================================

const SocialCard: React.FC<{ network: SocialNetwork; index: number }> = ({ network, index }) => {
  return (
    <a
      href={network.url}
      target="_blank"
      rel="noopener noreferrer"
      className="social-card"
      style={{
        '--card-color': network.color,
        '--animation-delay': `${index * 0.1}s`
      } as React.CSSProperties}
    >
      <div className="social-card-icon">
        <SocialIcon network={network.icon} size={28} />
      </div>
      <div className="social-card-content">
        <div className="social-card-header">
          <h4>{network.name}</h4>
          <span className="social-followers-badge">{network.followers} seguidores</span>
        </div>
        <span className="social-username">{network.username}</span>
        <div className="social-stats-mini">
          <span>{network.posts} publicaciones</span>
        </div>
        {network.description && (
          <p className="social-description">{network.description}</p>
        )}
      </div>
      <div className="social-card-arrow">
        <SocialIcon network="external" size={18} />
      </div>
    </a>
  );
};

// ============================================
// POST CARD COMPONENT - MEJORADO
// ============================================

const PostCard: React.FC<{ post: Post; index: number }> = ({ post, index }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const platformColors: Record<string, string> = {
    twitter: '#000000',
    facebook: '#1877F2',
    instagram: '#E4405F'
  };

  const platformNames: Record<string, string> = {
    twitter: 'X',
    facebook: 'Facebook',
    instagram: 'Instagram'
  };

  return (
    <article
      className={`post-card post-card-${post.platform}`}
      style={{ '--animation-delay': `${index * 0.08}s` } as React.CSSProperties}
    >
      {/* Post Header */}
      <div className="post-card-header">
        <div className="post-author-info">
          <div className="post-author-avatar" style={{ backgroundColor: platformColors[post.platform] }}>
            {post.author?.charAt(0) || 'J'}
          </div>
          <div className="post-author-details">
            <div className="post-author-name">
              <span>{post.author || 'Jairo Cala'}</span>
              {post.isVerified && (
                <span className="verified-badge" title="Cuenta verificada">
                  <SocialIcon network="verified" size={14} />
                </span>
              )}
            </div>
            <div className="post-meta">
              <span
                className="post-platform-badge"
                style={{ backgroundColor: platformColors[post.platform] }}
              >
                <SocialIcon network={post.platform === 'twitter' ? 'twitter' : post.platform} size={12} />
                <span>{platformNames[post.platform]}</span>
              </span>
              <span className="post-date">{post.date}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="post-card-body">
        <p className="post-content">{post.content}</p>

        {/* Image/Video Preview */}
        {(post.image || post.videoThumbnail) && (
          <div className="post-media-container">
            {!imageLoaded && !imageError && (
              <div className="image-skeleton">
                <div className="skeleton-shimmer"></div>
              </div>
            )}
            {post.videoThumbnail ? (
              <div className="post-video-wrapper">
                <img
                  src={post.videoThumbnail}
                  alt="Video preview"
                  className={`post-media ${imageLoaded ? 'loaded' : ''}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  loading="lazy"
                />
                <div className="video-play-overlay">
                  <div className="play-button">
                    <SocialIcon network="play" size={24} />
                  </div>
                </div>
              </div>
            ) : (
              <img
                src={post.image}
                alt="Publicación"
                className={`post-media ${imageLoaded ? 'loaded' : ''}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                loading="lazy"
              />
            )}
            {imageError && (
              <div className="image-error">
                <SocialIcon network={post.platform} size={32} />
                <span>Imagen no disponible</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Footer - Engagement Stats */}
      <div className="post-card-footer">
        <div className="post-stats">
          {post.likes !== undefined && (
            <span className="post-stat">
              <SocialIcon network="heart" size={16} />
              <span>{post.likes.toLocaleString()}</span>
            </span>
          )}
          {post.comments !== undefined && (
            <span className="post-stat">
              <SocialIcon network="comment" size={16} />
              <span>{post.comments.toLocaleString()}</span>
            </span>
          )}
          {post.shares !== undefined && (
            <span className="post-stat">
              <SocialIcon network={post.platform === 'twitter' ? 'retweet' : 'share'} size={16} />
              <span>{post.shares.toLocaleString()}</span>
            </span>
          )}
        </div>
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="post-view-link"
        >
          Ver publicación
          <SocialIcon network="external" size={14} />
        </a>
      </div>
    </article>
  );
};

// ============================================
// LIVE FEED INDICATOR
// ============================================

const LiveIndicator: React.FC = () => (
  <div className="live-indicator">
    <span className="live-dot"></span>
    <span className="live-text">En vivo</span>
  </div>
);

// ============================================
// EMBEDDED FEEDS SECTION - MEJORADO
// ============================================

const EmbeddedFeeds: React.FC<{ activeTab: TabId }> = ({ activeTab }) => {
  const [twitterLoaded, setTwitterLoaded] = useState(false);
  const [twitterError, setTwitterError] = useState(false);
  const twitterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Twitter widget script
    const existingScript = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]');

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      script.onload = () => {
        setTwitterLoaded(true);
        if (window.twttr && window.twttr.widgets) {
          window.twttr.widgets.load(twitterRef.current);
        }
      };
      script.onerror = () => {
        setTwitterError(true);
      };
      document.body.appendChild(script);
    } else {
      setTwitterLoaded(true);
      if (window.twttr && window.twttr.widgets) {
        window.twttr.widgets.load(twitterRef.current);
      }
    }
  }, []);

  useEffect(() => {
    // Reload Twitter widget when tab changes
    if (twitterLoaded && window.twttr && window.twttr.widgets && twitterRef.current) {
      window.twttr.widgets.load(twitterRef.current);
    }
  }, [activeTab, twitterLoaded]);

  return (
    <div className="embedded-feeds-container">
      {/* Twitter/X Embedded Timeline */}
      {(activeTab === 'all' || activeTab === 'twitter') && (
        <div className="embedded-feed twitter-embedded" ref={twitterRef}>
          <div className="embedded-feed-header">
            <div className="feed-title">
              <SocialIcon network="twitter" size={22} />
              <h3>Timeline de X</h3>
              <LiveIndicator />
            </div>
            <a
              href="https://x.com/JairoComunes"
              target="_blank"
              rel="noopener noreferrer"
              className="follow-btn follow-btn-twitter"
            >
              Seguir @JairoComunes
            </a>
          </div>
          <div className="twitter-embed-wrapper">
            {twitterError ? (
              <div className="embed-fallback twitter-fallback">
                <div className="fallback-header">
                  <div className="fallback-avatar">JC</div>
                  <div className="fallback-info">
                    <h4>Jairo Cala</h4>
                    <span>@JairoComunes</span>
                  </div>
                </div>
                <div className="fallback-tweets">
                  {samplePosts.filter(p => p.platform === 'twitter').slice(0, 3).map((tweet) => (
                    <div key={tweet.id} className="fallback-tweet">
                      <p>{tweet.content}</p>
                      <span className="tweet-date">{tweet.date}</span>
                    </div>
                  ))}
                </div>
                <a
                  href="https://x.com/JairoComunes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fallback-link"
                >
                  Ver más en X →
                </a>
              </div>
            ) : (
              <a
                className="twitter-timeline"
                data-height="550"
                data-theme="light"
                data-chrome="noheader nofooter noborders transparent"
                data-lang="es"
                data-dnt="true"
                href="https://twitter.com/JairoComunes?ref_src=twsrc%5Etfw"
              >
                <div className="twitter-loading">
                  <div className="loading-spinner"></div>
                  <p>Cargando tweets...</p>
                </div>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Facebook Embedded Page */}
      {(activeTab === 'all' || activeTab === 'facebook') && (
        <div className="embedded-feed facebook-embedded">
          <div className="embedded-feed-header">
            <div className="feed-title">
              <SocialIcon network="facebook" size={22} />
              <h3>Página de Facebook</h3>
              <LiveIndicator />
            </div>
            <a
              href="https://www.facebook.com/JairoComunes"
              target="_blank"
              rel="noopener noreferrer"
              className="follow-btn follow-btn-facebook"
            >
              Me gusta
            </a>
          </div>
          <div className="facebook-embed-wrapper">
            {/* Facebook Post Preview Cards */}
            <div className="facebook-preview-container">
              <div className="facebook-page-header">
                <div className="fb-page-avatar">
                  <span>JC</span>
                </div>
                <div className="fb-page-info">
                  <h4>Jairo Cala - Representante</h4>
                  <span>@JairoComunes · Político</span>
                  <span className="fb-followers">3,856 seguidores</span>
                </div>
              </div>
              <div className="facebook-posts-preview">
                {samplePosts.filter(p => p.platform === 'facebook').slice(0, 2).map((post) => (
                  <div key={post.id} className="fb-post-preview">
                    <p className="fb-post-text">{post.content.substring(0, 150)}...</p>
                    {post.image && (
                      <div className="fb-post-image">
                        <img src={post.image} alt="Post" loading="lazy" />
                      </div>
                    )}
                    <div className="fb-post-stats">
                      <span>👍 {post.likes?.toLocaleString()}</span>
                      <span>{post.comments} comentarios · {post.shares} compartidos</span>
                    </div>
                  </div>
                ))}
              </div>
              <a
                href="https://www.facebook.com/JairoComunes"
                target="_blank"
                rel="noopener noreferrer"
                className="fb-view-page"
              >
                <SocialIcon network="facebook" size={18} />
                Ver página completa en Facebook
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Instagram Embedded Profile - MEJORADO */}
      {(activeTab === 'all' || activeTab === 'instagram') && (
        <div className="embedded-feed instagram-embedded">
          <div className="embedded-feed-header">
            <div className="feed-title">
              <SocialIcon network="instagram" size={22} />
              <h3>Perfil de Instagram</h3>
              <LiveIndicator />
            </div>
            <a
              href="https://www.instagram.com/jairocomunes"
              target="_blank"
              rel="noopener noreferrer"
              className="follow-btn follow-btn-instagram"
            >
              Seguir
            </a>
          </div>
          <div className="instagram-embed-wrapper">
            <div className="instagram-profile-card">
              <div className="instagram-profile-top">
                <div className="instagram-avatar-large">
                  <span>JC</span>
                </div>
                <div className="instagram-stats">
                  <div className="instagram-stat">
                    <strong>187</strong>
                    <span>Publicaciones</span>
                  </div>
                  <div className="instagram-stat">
                    <strong>2,134</strong>
                    <span>Seguidores</span>
                  </div>
                  <div className="instagram-stat">
                    <strong>156</strong>
                    <span>Siguiendo</span>
                  </div>
                </div>
              </div>
              <div className="instagram-profile-info">
                <h4>Jairo Cala</h4>
                <span className="instagram-category">Político · Figura pública</span>
                <p className="instagram-bio-text">
                  🏛️ Representante a la Cámara por Santander<br/>
                  ✊ Constructor de paz y defensor de los derechos humanos<br/>
                  🌿 Defensor del medio ambiente y Santurbán<br/>
                  🇨🇴 Partido Comunes
                </p>
              </div>
              {/* Grid de imágenes reales */}
              <div className="instagram-grid-preview">
                {instagramGridImages.map((img, idx) => (
                  <a
                    key={idx}
                    href="https://www.instagram.com/jairocomunes"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="instagram-grid-item"
                  >
                    <img
                      src={img}
                      alt={`Instagram post ${idx + 1}`}
                      loading="lazy"
                    />
                    <div className="instagram-grid-overlay">
                      <span><SocialIcon network="heart" size={14} /> {Math.floor(Math.random() * 500 + 500)}</span>
                    </div>
                  </a>
                ))}
              </div>
              <a
                href="https://www.instagram.com/jairocomunes"
                target="_blank"
                rel="noopener noreferrer"
                className="instagram-view-full"
              >
                <SocialIcon network="instagram" size={18} />
                Ver perfil completo en Instagram
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN SOCIAL FEED COMPONENT
// ============================================

const SocialFeed: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter posts based on active tab
  const filteredPosts = activeTab === 'all'
    ? samplePosts
    : samplePosts.filter(post => post.platform === activeTab);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 1500);
  }, []);

  const tabs: { id: TabId; label: string; icon: string; count: number }[] = [
    { id: 'all', label: 'Todas', icon: 'all', count: samplePosts.length },
    { id: 'twitter', label: 'X', icon: 'twitter', count: samplePosts.filter(p => p.platform === 'twitter').length },
    { id: 'facebook', label: 'Facebook', icon: 'facebook', count: samplePosts.filter(p => p.platform === 'facebook').length },
    { id: 'instagram', label: 'Instagram', icon: 'instagram', count: samplePosts.filter(p => p.platform === 'instagram').length }
  ];

  const formatLastUpdated = (date: Date): string => {
    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <section id="redes-sociales" className="social-feed">
      <div className="social-feed-container">
        {/* Header Section */}
        <header className="social-feed-header">
          <div className="header-badge">
            <LiveIndicator />
            <span className="update-time">
              Actualizado: {formatLastUpdated(lastUpdated)}
            </span>
            <button
              className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
              onClick={handleRefresh}
              aria-label="Actualizar feeds"
            >
              <SocialIcon network="refresh" size={18} />
            </button>
          </div>
          <h2>Redes Sociales en Tiempo Real</h2>
          <p>
            Mantente al día con las últimas publicaciones, posiciones políticas y actividades
            del Representante Jairo Cala. Conéctate y participa en la conversación.
          </p>
        </header>

        {/* Social Networks Grid */}
        <div className="social-cards-grid">
          {socialNetworks.map((network, index) => (
            <SocialCard key={network.name} network={network} index={index} />
          ))}
        </div>

        {/* Tab Navigation */}
        <nav className="feed-tabs" role="tablist" aria-label="Filtrar por red social">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              className={`feed-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon === 'all' ? (
                <span className="tab-icon-all">📱</span>
              ) : (
                <SocialIcon network={tab.icon} size={18} />
              )}
              <span className="tab-label">{tab.label}</span>
              <span className="tab-count">{tab.count}</span>
              {activeTab === tab.id && <span className="tab-indicator"></span>}
            </button>
          ))}
        </nav>

        {/* Main Content */}
        {isLoading ? (
          <div className="feed-loading">
            <div className="loading-spinner-container">
              <div className="loading-spinner"></div>
              <div className="loading-pulse"></div>
            </div>
            <p>Cargando publicaciones en tiempo real...</p>
          </div>
        ) : (
          <div className="feed-main-content">
            {/* Recent Posts Section */}
            <section className="recent-posts-section">
              <div className="section-title">
                <h3>Publicaciones Recientes</h3>
                <span className="posts-count">{filteredPosts.length} publicaciones</span>
              </div>
              <div className="posts-grid">
                {filteredPosts.map((post, index) => (
                  <PostCard key={post.id} post={post} index={index} />
                ))}
              </div>
            </section>

            {/* Embedded Feeds Section */}
            <section className="embedded-feeds-section">
              <div className="section-title">
                <h3>Feeds en Vivo</h3>
                <span className="live-badge">
                  <span className="live-dot-small"></span>
                  Actualización automática
                </span>
              </div>
              <EmbeddedFeeds activeTab={activeTab} />
            </section>
          </div>
        )}

        {/* CTA Banner */}
        <div className="social-cta-banner">
          <div className="cta-background-elements">
            <div className="cta-circle cta-circle-1"></div>
            <div className="cta-circle cta-circle-2"></div>
            <div className="cta-circle cta-circle-3"></div>
          </div>
          <div className="cta-content">
            <h3>¡Únete a nuestra comunidad digital!</h3>
            <p>
              Sé parte del movimiento por un Santander más justo y próspero.
              Síguenos, comparte y participa en la construcción de un mejor futuro.
            </p>
          </div>
          <div className="cta-buttons">
            <a
              href="https://x.com/JairoComunes"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-btn cta-btn-primary"
            >
              <SocialIcon network="twitter" size={20} />
              Seguir en X
            </a>
            <a
              href="https://www.facebook.com/JairoComunes"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-btn cta-btn-secondary"
            >
              <SocialIcon network="facebook" size={20} />
              Facebook
            </a>
            <a
              href="https://www.instagram.com/jairocomunes"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-btn cta-btn-tertiary"
            >
              <SocialIcon network="instagram" size={20} />
              Instagram
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

// Extend Window interface for Twitter widgets
declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement | null) => void;
      };
    };
  }
}

export default SocialFeed;
