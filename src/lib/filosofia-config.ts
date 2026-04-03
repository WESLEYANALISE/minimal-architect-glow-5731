export interface FilosofoConfig {
  slug: string;
  nome: string;
  nomeWikipedia: string;
  periodo: string;
  categorias: string[];
}

export const CATEGORIAS_FILOSOFIA = [
  "Ética", "Política", "Metafísica", "Epistemologia", "Lógica", "Estética", "Existencialismo"
] as const;

export const FILOSOFOS: FilosofoConfig[] = [
  { slug: "socrates", nome: "Sócrates", nomeWikipedia: "Sócrates", periodo: "470–399 a.C.", categorias: ["Ética", "Epistemologia"] },
  { slug: "platao", nome: "Platão", nomeWikipedia: "Platão", periodo: "428–348 a.C.", categorias: ["Metafísica", "Política", "Epistemologia"] },
  { slug: "aristoteles", nome: "Aristóteles", nomeWikipedia: "Aristóteles", periodo: "384–322 a.C.", categorias: ["Lógica", "Ética", "Metafísica", "Política"] },
  { slug: "epicuro", nome: "Epicuro", nomeWikipedia: "Epicuro", periodo: "341–270 a.C.", categorias: ["Ética", "Epistemologia"] },
  { slug: "seneca", nome: "Sêneca", nomeWikipedia: "Sêneca", periodo: "4 a.C.–65 d.C.", categorias: ["Ética", "Política"] },
  { slug: "marco-aurelio", nome: "Marco Aurélio", nomeWikipedia: "Marco_Aurélio", periodo: "121–180", categorias: ["Ética"] },
  { slug: "santo-agostinho", nome: "Santo Agostinho", nomeWikipedia: "Agostinho_de_Hipona", periodo: "354–430", categorias: ["Metafísica", "Ética"] },
  { slug: "tomas-de-aquino", nome: "Tomás de Aquino", nomeWikipedia: "Tomás_de_Aquino", periodo: "1225–1274", categorias: ["Metafísica", "Ética", "Política"] },
  { slug: "maquiavel", nome: "Maquiavel", nomeWikipedia: "Nicolau_Maquiavel", periodo: "1469–1527", categorias: ["Política"] },
  { slug: "descartes", nome: "Descartes", nomeWikipedia: "René_Descartes", periodo: "1596–1650", categorias: ["Epistemologia", "Metafísica"] },
  { slug: "spinoza", nome: "Spinoza", nomeWikipedia: "Baruch_Espinoza", periodo: "1632–1677", categorias: ["Metafísica", "Ética"] },
  { slug: "locke", nome: "John Locke", nomeWikipedia: "John_Locke", periodo: "1632–1704", categorias: ["Epistemologia", "Política"] },
  { slug: "hume", nome: "David Hume", nomeWikipedia: "David_Hume", periodo: "1711–1776", categorias: ["Epistemologia", "Ética"] },
  { slug: "rousseau", nome: "Rousseau", nomeWikipedia: "Jean-Jacques_Rousseau", periodo: "1712–1778", categorias: ["Política", "Ética"] },
  { slug: "kant", nome: "Immanuel Kant", nomeWikipedia: "Immanuel_Kant", periodo: "1724–1804", categorias: ["Epistemologia", "Ética", "Metafísica"] },
  { slug: "hegel", nome: "Hegel", nomeWikipedia: "Georg_Wilhelm_Friedrich_Hegel", periodo: "1770–1831", categorias: ["Metafísica", "Política", "Lógica"] },
  { slug: "schopenhauer", nome: "Schopenhauer", nomeWikipedia: "Arthur_Schopenhauer", periodo: "1788–1860", categorias: ["Metafísica", "Estética"] },
  { slug: "kierkegaard", nome: "Kierkegaard", nomeWikipedia: "Søren_Kierkegaard", periodo: "1813–1855", categorias: ["Existencialismo", "Ética"] },
  { slug: "marx", nome: "Karl Marx", nomeWikipedia: "Karl_Marx", periodo: "1818–1883", categorias: ["Política", "Ética"] },
  { slug: "nietzsche", nome: "Nietzsche", nomeWikipedia: "Friedrich_Nietzsche", periodo: "1844–1900", categorias: ["Ética", "Existencialismo", "Estética"] },
  { slug: "husserl", nome: "Edmund Husserl", nomeWikipedia: "Edmund_Husserl", periodo: "1859–1938", categorias: ["Epistemologia", "Metafísica"] },
  { slug: "heidegger", nome: "Heidegger", nomeWikipedia: "Martin_Heidegger", periodo: "1889–1976", categorias: ["Existencialismo", "Metafísica"] },
  { slug: "sartre", nome: "Jean-Paul Sartre", nomeWikipedia: "Jean-Paul_Sartre", periodo: "1905–1980", categorias: ["Existencialismo", "Ética", "Política"] },
  { slug: "simone-de-beauvoir", nome: "Simone de Beauvoir", nomeWikipedia: "Simone_de_Beauvoir", periodo: "1908–1986", categorias: ["Existencialismo", "Ética", "Política"] },
  { slug: "hannah-arendt", nome: "Hannah Arendt", nomeWikipedia: "Hannah_Arendt", periodo: "1906–1975", categorias: ["Política", "Ética"] },
  { slug: "foucault", nome: "Michel Foucault", nomeWikipedia: "Michel_Foucault", periodo: "1926–1984", categorias: ["Política", "Epistemologia"] },
];
