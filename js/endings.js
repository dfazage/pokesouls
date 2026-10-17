// Fins de chapitre : boss final (mène à la carte secrète) et boss secret (mène au menu principal), pour Kanto et Johto.
// Les textes marqués « à valider » sont des propositions de rédaction (voir la PR).
export const ENDINGS = {
  mewtwo: {
    kind: 'final', who: 'Mewtwo', next: 'secret',
    lines: [
      { who: 'Mewtwo', key: 'mewtwo', text: '…Tu as brisé ma garde. Personne ne l’avait jamais fait.' },
      { who: 'Mewtwo', key: 'mewtwo', text: 'Je n’ai pas demandé à naître. Mais tu m’as montré qu’on peut aussi choisir de tomber.' },
      { who: 'Mewtwo', key: 'mewtwo', text: 'Une autre présence veille sur cette île, au large. Elle t’attend.' },
    ],
    panel: { title: 'Fin du Chapitre', sub: 'Génération 1 · Kanto', text: 'Mewtwo est tombé.<br>Un appel venu de loin résonne dans votre esprit : un lieu secret est apparu sur la carte.', go: 'Suivre l’appel', stay: 'Rester' },
  },
  lugia: {
    kind: 'final', who: 'Lugia', next: 'secret',
    lines: [
      { who: 'Lugia', key: 'lugia', text: '…La tempête s’apaise. Tu as plus de force que la mer elle-même.' },
      { who: 'Lugia', key: 'lugia', text: 'Je me retire dans les profondeurs. Que le vent te porte.' },
      { who: 'Lugia', key: 'lugia', text: 'Au cœur d’une forêt, un gardien du temps t’attend. Va.' },
    ],
    panel: { title: 'Fin du Chapitre', sub: 'Génération 2 · Johto', text: 'Lugia a regagné les abysses.<br>Un appel venu de loin résonne dans votre esprit : un lieu secret est apparu sur la carte.', go: 'Suivre l’appel', stay: 'Rester' },
  },
  mew: {
    kind: 'secret', who: 'Mew', next: 'menu',
    lines: [
      { who: 'Mew', key: 'mew', text: '…Ah. Tu m’as attrapé pour de bon, cette fois.' },
      { who: 'Mew', key: 'mew', text: 'Merci d’avoir joué jusqu’au bout. Peu de voyageurs viennent me voir.' },
      { who: 'Mew', key: 'mew', text: 'Rentre chez toi. Le chemin se rouvrira, un jour.' },
    ],
    epilogue: ['Mew est apaisé.', 'Kanto retrouve le calme.', 'Votre équipe rentre, fière, au creux de la nuit.', 'Le voyage continuera, ailleurs, plus tard.'],
    fin: { sub: 'Génération 1 · Kanto', secret: 'Fin secrète' },
  },
  celebi: {
    kind: 'secret', who: 'Celebi', next: 'menu',
    lines: [
      { who: 'Celebi', key: 'celebi', text: '…Le temps s’arrête un instant. Merci, voyageur.' },
      { who: 'Celebi', key: 'celebi', text: 'Tu as traversé mes saisons sans ployer. Je m’en souviendrai.' },
      { who: 'Celebi', key: 'celebi', text: 'Rentre. Nous nous reverrons, à une autre saison.' },
    ],
    epilogue: ['Celebi s’efface dans les feuilles.', 'Johto respire de nouveau.', 'Votre équipe rentre, au fil des saisons retrouvées.', 'Le voyage continuera, ailleurs, plus tard.'],
    fin: { sub: 'Génération 2 · Johto', secret: 'Fin secrète' },
  },
};

// fins déjà vues (par navigateur) : sert à la pastille du menu principal
const KEY = 'pokesouls.endings';
export function endingsSeen() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
export function markEnding(id) { try { const s = endingsSeen(); s[id] = Date.now(); localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* stockage indisponible */ } }
export const fmtTime = s => { const m = Math.floor(s / 60); return Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0'); };
