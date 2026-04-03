import { useState, useEffect } from "react";

const PHRASES = [
  "Pesquisar...",
  "Resumos...",
  "Flashcards...",
  "Simulados...",
  "Videoaulas...",
  "Artigos...",
];

const TYPING_SPEED = 80;
const DELETING_SPEED = 40;
const PAUSE_AFTER_TYPING = 1800;
const PAUSE_AFTER_DELETING = 400;

const SearchBarAnimatedText = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = PHRASES[phraseIndex];

    if (!isDeleting && charIndex === currentPhrase.length) {
      // Finished typing — pause then start deleting
      const timeout = setTimeout(() => setIsDeleting(true), PAUSE_AFTER_TYPING);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && charIndex === 0) {
      // Finished deleting — move to next phrase
      const timeout = setTimeout(() => {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
      }, PAUSE_AFTER_DELETING);
      return () => clearTimeout(timeout);
    }

    const speed = isDeleting ? DELETING_SPEED : TYPING_SPEED;
    const timeout = setTimeout(() => {
      setCharIndex((prev) => prev + (isDeleting ? -1 : 1));
    }, speed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, phraseIndex]);

  const displayText = PHRASES[phraseIndex].slice(0, charIndex);

  return (
    <span className="text-white text-sm font-bold flex-1 min-w-0 select-none tracking-wide">
      {displayText}
      <span className="animate-pulse text-primary/50">|</span>
    </span>
  );
};

export default SearchBarAnimatedText;
