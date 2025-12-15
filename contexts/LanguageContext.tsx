"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

// Supported languages
export type Language = "en" | "es";

// Translation keys type
export type TranslationKey = keyof typeof translations.en;

// Translations object
export const translations = {
  en: {
    // Header & Navigation
    "nav.connect": "Connect",
    "nav.connecting": "Connecting...",
    "nav.profile": "View profile",
    "nav.copyAddress": "Copy address",
    "nav.viewOnExplorer": "View on Arbiscan",
    "nav.changeWallet": "Change wallet",
    "nav.disconnect": "Disconnect",
    "nav.exploreButton": "Explore the forum",
    "nav.goToForum": "Go to Forum",
    "nav.admin": "Administration",
    
    // Wallet Onboarding Modal
    "wallet.connectTitle": "Connect a wallet",
    "wallet.connectDescription": "To participate in NodeSpeak you need an Ethereum-compatible wallet.",
    "wallet.otherWallets": "Other compatible wallets",
    "wallet.allCompatible": "All are Ethereum compatible",
    "wallet.whatIsWallet": "What is a wallet?",
    "wallet.tipTitle": "The wallet allows you to post and participate without creating traditional accounts.",
    "wallet.tipSubtitle": "You can explore NodeSpeak without a wallet, but you need one to interact.",
    "wallet.skipIntro": "Skip introduction",
    "wallet.back": "Back",
    "wallet.next": "Next",
    "wallet.installWallet": "Install wallet",
    
    // Onboarding screens
    "onboarding.screen1Title": "We don't store your data",
    "onboarding.screen1Desc": "Your wallet is your identity. No need to create accounts or give your email.",
    "onboarding.screen2Title": "No censorship",
    "onboarding.screen2Desc": "No one can delete your on-chain content. Your voice is permanent.",
    
    // Wallet descriptions
    "wallet.rabbyDesc": "Modern and secure",
    "wallet.metamaskDesc": "The most popular",
    "wallet.trustDesc": "Easy to use",
    "wallet.coinbaseDesc": "From Coinbase",
    
    // Connection feedback
    "wallet.connectAnytime": "You can connect your wallet anytime from here.",
    "wallet.connectionError": "Connection error. Please try again.",
    
    // Landing Page
    "landing.title": "Node Speak v3.3",
    "landing.heroTitle": "The Decentralized and Immutable Forum",
    "landing.heroSubtitle": "Node Speak is a platform that redefines online forums by using blockchain technology and decentralized storage. Designed to ensure permanence, transparency and resistance to censorship.",
    "landing.exploreForum": "Explore Forum",
    "landing.communities": "Communities",
    "landing.communitiesDesc": "Create and manage discussion topics. Follow profiles of interest.",
    "landing.postsThreads": "Posts & Threads",
    "landing.postsThreadsDesc": "Post messages and reply to other participants.",
    "landing.adminMode": "Admin Mode",
    "landing.adminModeDesc": "Moderate, curate, and protect spaces in one interface.",
    "landing.keyFeatures": "Key Features",
    "landing.blockchainSecurity": "Blockchain Security",
    "landing.blockchainSecurityDesc": "All messages backed by blockchain.",
    "landing.permanentStorage": "Permanent Storage",
    "landing.permanentStorageDesc": "IPFS decentralized, immutable data.",
    "landing.noCensorship": "No Censorship",
    "landing.noCensorshipDesc": "Community-moderated content.",
    "landing.secureContent": "Secure Content",
    "landing.secureContentDesc": "Protected against manipulations.",
    "landing.footer": "Built for decentralized communities.",
    "landing.communityPreviewTitle": "Active Communities",
    "landing.joinCommunity": "Join Community",
    "landing.viewAll": "View All",
    
    // Forum
    "forum.title": "Forum",
    "forum.newPost": "New Post",
    "forum.newCommunity": "New Community",
    "forum.search": "Search...",
    "forum.noResults": "No results found",
    "forum.loading": "Loading...",
    "forum.error": "Error loading content",
    "forum.retry": "Retry",
    "forum.communities": "Communities",
    "forum.posts": "Posts",
    "forum.activity": "Activity",
    "forum.trending": "Trending",
    "forum.latest": "Latest",
    "forum.top": "Top",
    
    // Post
    "post.by": "by",
    "post.comments": "comments",
    "post.comment": "comment",
    "post.reply": "Reply",
    "post.delete": "Delete",
    "post.edit": "Edit",
    "post.share": "Share",
    "post.report": "Report",
    "post.vote": "Vote",
    "post.votes": "votes",
    "post.writeComment": "Write a comment...",
    "post.submitComment": "Submit",
    "post.cancel": "Cancel",
    "post.save": "Save",
    "post.posting": "Posting...",
    "post.connectToComment": "Connect your wallet to comment",
    "post.connectToVote": "Connect your wallet to vote",
    "post.noComments": "No comments yet. Be the first!",
    
    // Create Post
    "createPost.title": "Create Post",
    "createPost.titlePlaceholder": "Title",
    "createPost.contentPlaceholder": "What's on your mind?",
    "createPost.selectCommunity": "Select a community",
    "createPost.submit": "Post",
    "createPost.submitting": "Posting...",
    "createPost.connectRequired": "Connect your wallet to create a post",
    
    // Create Community
    "createCommunity.title": "Create Community",
    "createCommunity.namePlaceholder": "Community name",
    "createCommunity.descriptionPlaceholder": "Description",
    "createCommunity.submit": "Create",
    "createCommunity.creating": "Creating...",
    "createCommunity.connectRequired": "Connect your wallet to create a community",
    
    // Profile
    "profile.title": "Profile",
    "profile.posts": "Posts",
    "profile.comments": "Comments",
    "profile.communities": "Communities",
    "profile.joined": "Joined",
    "profile.noPosts": "No posts yet",
    "profile.noComments": "No comments yet",
    "profile.editProfile": "Edit Profile",
    
    // Admin
    "admin.title": "Administration",
    "admin.dashboard": "Dashboard",
    "admin.users": "Users",
    "admin.hiddenUsers": "Hidden Users",
    "admin.hiddenCommunities": "Hidden Communities",
    "admin.settings": "Settings",
    "admin.hide": "Hide",
    "admin.unhide": "Unhide",
    "admin.ban": "Ban",
    "admin.reason": "Reason",
    "admin.confirm": "Confirm",
    "admin.viewMode": "View Mode",
    "admin.adminView": "Admin View",
    "admin.userView": "User View",
    
    // Common
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.confirm": "Confirm",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.close": "Close",
    "common.back": "Back",
    "common.next": "Next",
    "common.submit": "Submit",
    "common.search": "Search",
    "common.noResults": "No results",
    "common.seeMore": "See more",
    "common.seeLess": "See less",
    "common.copied": "Copied!",
    "common.share": "Share",
    "common.report": "Report",
    
    // Time
    "time.now": "just now",
    "time.minutesAgo": "minutes ago",
    "time.hoursAgo": "hours ago",
    "time.daysAgo": "days ago",
    "time.weeksAgo": "weeks ago",
    "time.monthsAgo": "months ago",
    "time.yearsAgo": "years ago",
    
    // Errors
    "error.generic": "Something went wrong. Please try again.",
    "error.network": "Network error. Please check your connection.",
    "error.walletRequired": "Please connect your wallet first.",
    "error.unauthorized": "You are not authorized to perform this action.",
    "error.notFound": "Content not found.",
  },
  es: {
    // Header & Navigation
    "nav.connect": "Conectar",
    "nav.connecting": "Conectando...",
    "nav.profile": "Ver perfil",
    "nav.copyAddress": "Copiar dirección",
    "nav.viewOnExplorer": "Ver en Arbiscan",
    "nav.changeWallet": "Cambiar wallet",
    "nav.disconnect": "Desconectar",
    "nav.exploreButton": "Explorar el foro",
    "nav.goToForum": "Ir al Foro",
    "nav.admin": "Administración",
    
    // Wallet Onboarding Modal
    "wallet.connectTitle": "Conecta una wallet",
    "wallet.connectDescription": "Para participar en NodeSpeak necesitás una wallet compatible con Ethereum.",
    "wallet.otherWallets": "Otras wallets compatibles",
    "wallet.allCompatible": "Todas son compatibles con Ethereum",
    "wallet.whatIsWallet": "¿Qué es una wallet?",
    "wallet.tipTitle": "La wallet te permite publicar y participar sin crear cuentas tradicionales.",
    "wallet.tipSubtitle": "Podés explorar NodeSpeak sin wallet, pero necesitás una para interactuar.",
    "wallet.skipIntro": "Saltar introducción",
    "wallet.back": "Atrás",
    "wallet.next": "Siguiente",
    "wallet.installWallet": "Instalar wallet",
    
    // Onboarding screens
    "onboarding.screen1Title": "No guardamos tus datos",
    "onboarding.screen1Desc": "Tu wallet es tu identidad. No necesitás crear cuentas ni dar tu email.",
    "onboarding.screen2Title": "Sin censura",
    "onboarding.screen2Desc": "Nadie puede borrar tu contenido on-chain. Tu voz es permanente.",
    
    // Wallet descriptions
    "wallet.rabbyDesc": "Moderna y segura",
    "wallet.metamaskDesc": "La más popular",
    "wallet.trustDesc": "Fácil de usar",
    "wallet.coinbaseDesc": "De Coinbase",
    
    // Connection feedback
    "wallet.connectAnytime": "Podés conectar tu wallet cuando quieras desde acá.",
    "wallet.connectionError": "Error de conexión. Por favor intentá de nuevo.",
    
    // Landing Page
    "landing.title": "Node Speak v3.3",
    "landing.heroTitle": "El Foro Descentralizado e Inmutable",
    "landing.heroSubtitle": "Node Speak es una plataforma que redefine los foros online usando tecnología blockchain y almacenamiento descentralizado. Diseñado para garantizar permanencia, transparencia y resistencia a la censura.",
    "landing.exploreForum": "Explorar Foro",
    "landing.communities": "Comunidades",
    "landing.communitiesDesc": "Creá y gestioná temas de discusión. Seguí perfiles de interés.",
    "landing.postsThreads": "Posts e Hilos",
    "landing.postsThreadsDesc": "Publicá mensajes y respondé a otros participantes.",
    "landing.adminMode": "Modo Admin",
    "landing.adminModeDesc": "Moderá, curá y protegé espacios en una sola interfaz.",
    "landing.keyFeatures": "Características",
    "landing.blockchainSecurity": "Seguridad Blockchain",
    "landing.blockchainSecurityDesc": "Todos los mensajes respaldados por blockchain.",
    "landing.permanentStorage": "Almacenamiento Permanente",
    "landing.permanentStorageDesc": "Datos descentralizados e inmutables en IPFS.",
    "landing.noCensorship": "Sin Censura",
    "landing.noCensorshipDesc": "Contenido moderado por la comunidad.",
    "landing.secureContent": "Contenido Seguro",
    "landing.secureContentDesc": "Protegido contra manipulaciones.",
    "landing.footer": "Construido para comunidades descentralizadas.",
    "landing.communityPreviewTitle": "Comunidades Activas",
    "landing.joinCommunity": "Unirse",
    "landing.viewAll": "Ver Todas",
    
    // Forum
    "forum.title": "Foro",
    "forum.newPost": "Nueva Publicación",
    "forum.newCommunity": "Nueva Comunidad",
    "forum.search": "Buscar...",
    "forum.noResults": "No se encontraron resultados",
    "forum.loading": "Cargando...",
    "forum.error": "Error al cargar contenido",
    "forum.retry": "Reintentar",
    "forum.communities": "Comunidades",
    "forum.posts": "Publicaciones",
    "forum.activity": "Actividad",
    "forum.trending": "Tendencias",
    "forum.latest": "Recientes",
    "forum.top": "Destacados",
    
    // Post
    "post.by": "por",
    "post.comments": "comentarios",
    "post.comment": "comentario",
    "post.reply": "Responder",
    "post.delete": "Eliminar",
    "post.edit": "Editar",
    "post.share": "Compartir",
    "post.report": "Reportar",
    "post.vote": "Votar",
    "post.votes": "votos",
    "post.writeComment": "Escribí un comentario...",
    "post.submitComment": "Enviar",
    "post.cancel": "Cancelar",
    "post.save": "Guardar",
    "post.posting": "Publicando...",
    "post.connectToComment": "Conectá tu wallet para comentar",
    "post.connectToVote": "Conectá tu wallet para votar",
    "post.noComments": "Sin comentarios aún. ¡Sé el primero!",
    
    // Create Post
    "createPost.title": "Crear Publicación",
    "createPost.titlePlaceholder": "Título",
    "createPost.contentPlaceholder": "¿Qué tenés en mente?",
    "createPost.selectCommunity": "Seleccioná una comunidad",
    "createPost.submit": "Publicar",
    "createPost.submitting": "Publicando...",
    "createPost.connectRequired": "Conectá tu wallet para crear una publicación",
    
    // Create Community
    "createCommunity.title": "Crear Comunidad",
    "createCommunity.namePlaceholder": "Nombre de la comunidad",
    "createCommunity.descriptionPlaceholder": "Descripción",
    "createCommunity.submit": "Crear",
    "createCommunity.creating": "Creando...",
    "createCommunity.connectRequired": "Conectá tu wallet para crear una comunidad",
    
    // Profile
    "profile.title": "Perfil",
    "profile.posts": "Publicaciones",
    "profile.comments": "Comentarios",
    "profile.communities": "Comunidades",
    "profile.joined": "Se unió",
    "profile.noPosts": "Sin publicaciones aún",
    "profile.noComments": "Sin comentarios aún",
    "profile.editProfile": "Editar Perfil",
    
    // Admin
    "admin.title": "Administración",
    "admin.dashboard": "Panel",
    "admin.users": "Usuarios",
    "admin.hiddenUsers": "Usuarios Ocultos",
    "admin.hiddenCommunities": "Comunidades Ocultas",
    "admin.settings": "Configuración",
    "admin.hide": "Ocultar",
    "admin.unhide": "Mostrar",
    "admin.ban": "Banear",
    "admin.reason": "Motivo",
    "admin.confirm": "Confirmar",
    "admin.viewMode": "Modo de Vista",
    "admin.adminView": "Vista Admin",
    "admin.userView": "Vista Usuario",
    
    // Common
    "common.loading": "Cargando...",
    "common.error": "Error",
    "common.success": "Éxito",
    "common.confirm": "Confirmar",
    "common.cancel": "Cancelar",
    "common.save": "Guardar",
    "common.delete": "Eliminar",
    "common.edit": "Editar",
    "common.close": "Cerrar",
    "common.back": "Atrás",
    "common.next": "Siguiente",
    "common.submit": "Enviar",
    "common.search": "Buscar",
    "common.noResults": "Sin resultados",
    "common.seeMore": "Ver más",
    "common.seeLess": "Ver menos",
    "common.copied": "¡Copiado!",
    "common.share": "Compartir",
    "common.report": "Reportar",
    
    // Time
    "time.now": "ahora",
    "time.minutesAgo": "minutos atrás",
    "time.hoursAgo": "horas atrás",
    "time.daysAgo": "días atrás",
    "time.weeksAgo": "semanas atrás",
    "time.monthsAgo": "meses atrás",
    "time.yearsAgo": "años atrás",
    
    // Errors
    "error.generic": "Algo salió mal. Por favor intentá de nuevo.",
    "error.network": "Error de red. Por favor verificá tu conexión.",
    "error.walletRequired": "Por favor conectá tu wallet primero.",
    "error.unauthorized": "No tenés autorización para realizar esta acción.",
    "error.notFound": "Contenido no encontrado.",
  },
} as const;

// Context type
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  toggleLanguage: () => void;
}

// Create context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Storage key
const LANGUAGE_STORAGE_KEY = "nodespeak_language";

// Provider props
interface LanguageProviderProps {
  children: ReactNode;
}

// Provider component
export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("en");
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize language from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored === "en" || stored === "es") {
        setLanguageState(stored);
      }
      setIsInitialized(true);
    }
  }, []);

  // Set language and persist to localStorage
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }
  }, []);

  // Toggle between languages
  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "es" : "en");
  }, [language, setLanguage]);

  // Translation function
  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[language][key] || key;
    },
    [language]
  );

  // Don't render until initialized to prevent hydration mismatch
  if (!isInitialized) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export default LanguageContext;
