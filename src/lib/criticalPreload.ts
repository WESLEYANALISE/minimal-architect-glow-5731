/**
 * Critical Preload — hero images only (above the fold)
 * 
 * Injects <link rel="preload"> for the 4 most critical hero backgrounds
 * BEFORE React mounts. Shortcut covers are deferred to idle time.
 */

// Hero tab backgrounds (critical — above the fold, matches Index.tsx imports)
import heroBannerEstudos from "@/assets/hero-estudos-law-student.webp";
import logoDireitoPremium from "@/assets/logo-direito-premium-new.webp";
import leisHeroBackground from "@/assets/leis-hero-background.webp";
import destaquesHeroBackground from "@/assets/destaques-hero-background.webp";

// Secondary hero images (deferred)
import jornadaHeroBackground from "@/assets/hero-biblioteca-cover.webp";
import juriflixHeroBackground from "@/assets/juriflix-hero-cover.webp";
import bloggerHeroBackground from "@/assets/blogger-hero-courtroom.webp";
import heroBannerThemisChorando from "@/assets/hero-banner-themis-chorando.webp";
import heroBannerTribunal from "@/assets/hero-banner-tribunal.webp";
import heroVadeMecumPlanalto from "@/assets/hero-vademecum-planalto.webp";

// Shortcut covers (deferred)
import atalhoProfessora from "@/assets/atalho-professora.webp";
import atalhoAulas from "@/assets/atalho-aulas.webp";
import atalhoBiblioteca from "@/assets/atalho-biblioteca-juridica.webp";
import atalhoEvelyn from "@/assets/atalho-evelyn.webp";
import atalhoFlashcards from "@/assets/atalho-flashcards.webp";
import atalhoResumos from "@/assets/atalho-resumos.webp";
import atalhoAudioaulas from "@/assets/atalho-audioaulas.webp";
import atalhoPrimeirosPassos from "@/assets/atalho-iniciando.webp";

// Critical above-the-fold: hero default tab (Estudos) + logo
const CRITICAL_IMAGES = [
  heroBannerEstudos,
  logoDireitoPremium,
  leisHeroBackground,
];

// Deferred images — loaded during idle time
const DEFERRED_IMAGES = [
  destaquesHeroBackground,
  jornadaHeroBackground,
  juriflixHeroBackground,
  bloggerHeroBackground,
  heroBannerThemisChorando,
  heroBannerTribunal,
  heroVadeMecumPlanalto,
  atalhoPrimeirosPassos,
  atalhoBiblioteca,
  atalhoProfessora,
  atalhoAudioaulas,
  atalhoAulas,
  atalhoFlashcards,
  atalhoResumos,
  atalhoEvelyn,
];

function injectPreloadLink(href: string) {
  if (!href || typeof document === 'undefined') return;
  if (document.querySelector(`link[rel="preload"][href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = href;
  link.setAttribute('fetchpriority', 'high');
  document.head.appendChild(link);
}

// Only preload the 4 critical hero images synchronously
CRITICAL_IMAGES.forEach(injectPreloadLink);

// Defer all other images to idle time
const idleCallback = window.requestIdleCallback || ((cb: IdleRequestCallback) => setTimeout(cb, 200));
idleCallback(() => {
  DEFERRED_IMAGES.forEach((src, i) => {
    setTimeout(() => {
      const img = new Image();
      img.src = src;
    }, i * 150);
  });
});

export { CRITICAL_IMAGES, DEFERRED_IMAGES };
