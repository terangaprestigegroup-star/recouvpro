// ============================================================
// SECTEURS SÉNÉGAL — Templates messages + exemples créances
// Utilisé dans onboarding, dashboard, relances WhatsApp
// ============================================================

export const SECTEURS = [
  { id: 'boutique',     emoji: '🏪', label: 'Boutique',         label_wo: 'Bitik' },
  { id: 'alimentation', emoji: '🛒', label: 'Alimentation',     label_wo: 'Épicerie' },
  { id: 'tissu',        emoji: '🧵', label: 'Tissus / Bazin',   label_wo: 'Mbag' },
  { id: 'cosmetique',   emoji: '💄', label: 'Cosmétique',       label_wo: 'Xessal' },
  { id: 'restaurant',   emoji: '🍽️', label: 'Restaurant',       label_wo: 'Daara lëkk' },
  { id: 'telephone',    emoji: '📱', label: 'Téléphones',       label_wo: 'Tëléfonn' },
  { id: 'pharmacie',    emoji: '💊', label: 'Pharmacie',        label_wo: 'Farmaasi' },
  { id: 'quincaillerie',emoji: '🔧', label: 'Quincaillerie',    label_wo: 'Ferre' },
  { id: 'tailleur',     emoji: '✂️', label: 'Tailleur',         label_wo: 'Taalör' },
  { id: 'grossiste',    emoji: '📦', label: 'Grossiste',        label_wo: 'Grossiste' },
  { id: 'autre',        emoji: '🏬', label: 'Autre commerce',   label_wo: 'Yeneen' },
];

// ── Exemples créances par secteur ────────────────
export const EXEMPLES_CREANCES = {
  boutique:      ['Commande boutique', 'Crédit marchandise', 'Avance commande', 'Reste paiement'],
  alimentation:  ['Crédit alimentation', 'Commande épicerie', 'Vivres semaine', 'Pain et lait'],
  tissu:         ['Tissu janvier', 'Bazin cérémonie', 'Pagnes commande', 'Reste tissu'],
  cosmetique:    ['Reste paiement coiffure', 'Perruque commande', 'Crèmes soins', 'Tresse cérémonie'],
  restaurant:    ['Repas crédit', 'Commande cérémonie', 'Thiéboudienne semaine', 'Déjeuner bureau'],
  telephone:     ['Téléphone crédit', 'Accessoires commande', 'Réparation écran', 'Batterie commande'],
  pharmacie:     ['Médicaments crédit', 'Ordonnance mois', 'Produits bébé', 'Traitement mensuel'],
  quincaillerie: ['Matériaux chantier', 'Ciment commande', 'Fer à béton', 'Peinture maison'],
  tailleur:      ['Costume cérémonie', 'Tenue tabaski', 'Habit graduation', 'Vêtements baptême'],
  grossiste:     ['Marchandise semaine', 'Stock mensuel', 'Commande grossiste', 'Livraison marché'],
  autre:         ['Crédit service', 'Commande en attente', 'Reste paiement', 'Avance travaux'],
};

// ── Messages WhatsApp par secteur + type ─────────
export const MESSAGES_WA = {
  // ── FRANÇAIS ──────────────────────────────────
  fr: {
    soft: {
      boutique:      (nom, montant) => `Salam ${nom} 👋\nPetit rappel pour les *${montant} FCFA* de ta commande boutique. Merci beaucoup 🙏`,
      alimentation:  (nom, montant) => `Salam ${nom} 👋\nRappel concernant les *${montant} FCFA* du crédit alimentaire. Merci 🙏`,
      tissu:         (nom, montant) => `Salam ${nom} 👋\nPetit rappel pour les *${montant} FCFA* du tissu. Quand tu peux 🙏`,
      cosmetique:    (nom, montant) => `Salam ${nom} 👋\nRappel pour les *${montant} FCFA* du reste paiement coiffure. Merci 🙏`,
      restaurant:    (nom, montant) => `Salam ${nom} 👋\nPetit rappel pour les *${montant} FCFA* des repas. Merci 🙏`,
      telephone:     (nom, montant) => `Salam ${nom} 👋\nRappel pour les *${montant} FCFA* du téléphone. Quand c'est possible 🙏`,
      pharmacie:     (nom, montant) => `Salam ${nom} 👋\nPetit rappel pour les *${montant} FCFA* des médicaments. Merci 🙏`,
      quincaillerie: (nom, montant) => `Salam ${nom} 👋\nRappel pour les *${montant} FCFA* des matériaux. Merci 🙏`,
      tailleur:      (nom, montant) => `Salam ${nom} 👋\nPetit rappel pour les *${montant} FCFA* du costume. Merci 🙏`,
      grossiste:     (nom, montant) => `Salam ${nom} 👋\nRappel pour les *${montant} FCFA* de la marchandise. Merci 🙏`,
      autre:         (nom, montant) => `Salam ${nom} 👋\nPetit rappel pour les *${montant} FCFA* en attente. Merci 🙏`,
    },
    normal: {
      boutique:      (nom, montant) => `Bonjour ${nom},\nLes *${montant} FCFA* de ta commande boutique sont toujours en attente. Merci de régulariser dès que possible.`,
      alimentation:  (nom, montant) => `Bonjour ${nom},\nLes *${montant} FCFA* du crédit alimentaire sont toujours en attente. Merci de passer.`,
      tissu:         (nom, montant) => `Bonjour ${nom},\nLes *${montant} FCFA* du tissu sont toujours en attente. Merci de régulariser.`,
      cosmetique:    (nom, montant) => `Bonjour ${nom},\nLes *${montant} FCFA* du reste coiffure sont en attente. Merci de régulariser.`,
      restaurant:    (nom, montant) => `Bonjour ${nom},\nLes *${montant} FCFA* des repas sont en attente. Merci de passer régler.`,
      telephone:     (nom, montant) => `Bonjour ${nom},\nLes *${montant} FCFA* du téléphone sont toujours en attente. Merci de régulariser.`,
      pharmacie:     (nom, montant) => `Bonjour ${nom},\nLes *${montant} FCFA* des médicaments sont en attente. Merci de régulariser.`,
      quincaillerie: (nom, montant) => `Bonjour ${nom},\nLes *${montant} FCFA* des matériaux chantier sont en attente. Merci de passer.`,
      tailleur:      (nom, montant) => `Bonjour ${nom},\nLes *${montant} FCFA* du costume sont en attente. Merci de venir récupérer et payer.`,
      grossiste:     (nom, montant) => `Bonjour ${nom},\nLes *${montant} FCFA* de la marchandise sont en attente. Merci de régulariser.`,
      autre:         (nom, montant) => `Bonjour ${nom},\nLes *${montant} FCFA* en attente n'ont pas encore été réglés. Merci.`,
    },
    firm: {
      boutique:      (nom, montant) => `Bonjour ${nom},\n⚠️ Les *${montant} FCFA* de ta commande sont toujours impayés. Merci de régler aujourd'hui.`,
      alimentation:  (nom, montant) => `Bonjour ${nom},\n⚠️ Les *${montant} FCFA* du crédit alimentaire sont toujours impayés. Merci de passer aujourd'hui.`,
      tissu:         (nom, montant) => `Bonjour ${nom},\n⚠️ Les *${montant} FCFA* du tissu sont toujours impayés. Dernier rappel.`,
      cosmetique:    (nom, montant) => `Bonjour ${nom},\n⚠️ Les *${montant} FCFA* sont toujours impayés. Merci de régler aujourd'hui.`,
      restaurant:    (nom, montant) => `Bonjour ${nom},\n⚠️ Les *${montant} FCFA* des repas sont toujours impayés. Merci de passer régler aujourd'hui.`,
      telephone:     (nom, montant) => `Bonjour ${nom},\n⚠️ Les *${montant} FCFA* du téléphone sont toujours impayés. Dernier rappel.`,
      pharmacie:     (nom, montant) => `Bonjour ${nom},\n⚠️ Les *${montant} FCFA* des médicaments sont toujours impayés. Merci de régler.`,
      quincaillerie: (nom, montant) => `Bonjour ${nom},\n⚠️ Les *${montant} FCFA* des matériaux sont toujours impayés. Merci de régler aujourd'hui.`,
      tailleur:      (nom, montant) => `Bonjour ${nom},\n⚠️ Les *${montant} FCFA* du costume sont toujours impayés. Merci de venir régler.`,
      grossiste:     (nom, montant) => `Bonjour ${nom},\n⚠️ Les *${montant} FCFA* de la marchandise sont toujours impayés. Dernier rappel.`,
      autre:         (nom, montant) => `Bonjour ${nom},\n⚠️ Les *${montant} FCFA* sont toujours impayés. Merci de régler aujourd'hui.`,
    },
  },

  // ── WOLOF ─────────────────────────────────────
  wo: {
    soft: {
      boutique:      (nom, montant) => `Asalaa maalekum ${nom} 👋\nXam-xam ci *${montant} FCFA* yi. Jërëjëf 🙏`,
      alimentation:  (nom, montant) => `Asalaa maalekum ${nom} 👋\nXam-xam ci *${montant} FCFA* crédit yi. Jërëjëf 🙏`,
      tissu:         (nom, montant) => `Asalaa maalekum ${nom} 👋\nXam-xam ci *${montant} FCFA* mbag bi. Bu la mën a jël 🙏`,
      cosmetique:    (nom, montant) => `Asalaa maalekum ${nom} 👋\nXam-xam ci *${montant} FCFA* yi. Jërëjëf 🙏`,
      restaurant:    (nom, montant) => `Asalaa maalekum ${nom} 👋\nXam-xam ci *${montant} FCFA* lëkk yi. Jërëjëf 🙏`,
      autre:         (nom, montant) => `Asalaa maalekum ${nom} 👋\nXam-xam ci *${montant} FCFA* yi. Jërëjëf 🙏`,
    },
    firm: {
      boutique:      (nom, montant) => `Asalaa maalekum ${nom},\n⚠️ *${montant} FCFA* yi dafa am toujours. Joxal ma tey sil vous plaît.`,
      autre:         (nom, montant) => `Asalaa maalekum ${nom},\n⚠️ *${montant} FCFA* yi dafa am toujours. Joxal ma tey.`,
    },
  },
};

// ── Noms clients réalistes Sénégal ───────────────
export const NOMS_DEMO = [
  'Mamadou Diallo', 'Fatou Ndiaye', 'Ibrahima Sow',
  'Aminata Traoré', 'Ousmane Ba', 'Marième Fall',
  'Abdoulaye Diop', 'Aissatou Koné', 'Moussa Sarr',
  'Rokhaya Mbaye',
];

// ── Placeholder input par secteur ────────────────
export const PLACEHOLDER_MONTANT = {
  boutique:      'ex : 8 500 (commande boutique)',
  alimentation:  'ex : 3 200 (crédit épicerie)',
  tissu:         'ex : 25 000 (tissu bazin)',
  cosmetique:    'ex : 12 000 (reste coiffure)',
  restaurant:    'ex : 6 500 (repas semaine)',
  telephone:     'ex : 45 000 (Samsung crédit)',
  pharmacie:     'ex : 7 800 (ordonnance mois)',
  quincaillerie: 'ex : 85 000 (matériaux chantier)',
  tailleur:      'ex : 35 000 (costume tabaski)',
  grossiste:     'ex : 150 000 (marchandise)',
  autre:         'ex : 15 000',
};

// ── Headline dashboard par secteur ───────────────
export const HEADLINE_DASHBOARD = {
  boutique:      '💰 Argent à récupérer chez tes clients',
  alimentation:  '💰 Crédits alimentaires en attente',
  tissu:         '💰 Paiements tissus en attente',
  cosmetique:    '💰 Restes paiements beauté',
  restaurant:    '💰 Additions non réglées',
  telephone:     '💰 Téléphones non payés',
  pharmacie:     '💰 Crédits pharmacie en attente',
  quincaillerie: '💰 Matériaux non réglés',
  tailleur:      '💰 Habits non payés',
  grossiste:     '💰 Marchandises en attente',
  autre:         '💰 Argent à récupérer',
};
