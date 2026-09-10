# Génitique PAR 5 — application terrain

Application **téléphone** permettant aux travailleurs de remplir sur place le
**PAR 5** (analyse de risques, 16 risques du carnet Génitique de janvier 2025),
de le signer et de le transmettre en PDF.

Tout reste sur l'appareil : les fiches sont conservées dans le `localStorage`
du navigateur (clé `gtq-par5`). Aucune donnée n'est envoyée à un serveur.

## Pile technique

Vite · React 18 · TypeScript · Tailwind v4 · jsPDF. Pas d'Electron : la cible
est un téléphone.

## Commandes

| Commande | Effet |
| --- | --- |
| `npm i` | Installer les dépendances requises |
| `npm run dev` | Serveur de développement |
| `npm run build` | Contrôle des types puis construction dans `dist/` |
| `npm run publier` | Construit puis copie **`Génitique PAR 5.html`** sur le Bureau |
| `npm run apercu` | Sert `dist/` sur le port 4190 |
| `npm run test:pdf` | Banc d'essai du PDF (relit le PDF produit avec pdf.js) |
| `node tools/construire-web.cjs` | Produit `dist-web/`, la version **installable** |
| `node tools/audit-pdf.cjs` | Audit géométrique du PDF (débordements, chevauchements) |
| `node tools/test-controle.cjs` | Banc d'essai du garde-fou avant transmission |
| `node tools/contraste.cjs` | Vérifie les contrastes de la palette |
| `node tools/faire-icone.cjs` | Regénère les icônes 180/192/512 px |

## Deux formats de sortie

- **`dist/index.html`** — fichier **unique**, tout inliné (y compris les
  icônes). Se double-clique sur un poste, marche hors ligne, se copie sur une
  clé. C'est ce que `npm run publier` dépose sur le Bureau.
- **`dist-web/`** — dossier à déposer sur un hébergement **HTTPS**. Il porte le
  manifeste, l'agent de service et les icônes en vrais fichiers : c'est le seul
  format qu'Android propose d'« installer » et le seul qui fonctionne hors
  ligne une fois servi par le réseau.

Les deux dossiers sont **régénérés** à chaque construction et ne sont donc pas
versionnés.

## Structure

```
src/
  App.tsx                    coque + barre d'onglets (constante ONGLETS)
  components/                logo, écran d'ouverture, bannière d'installation
  data/
    par5.ts                  modèle des 16 risques + verifierPar5()
    par5-store.ts            persistance localStorage
    pdf-par5.ts              construction et envoi du PDF
    photo.ts                 compression et budget mémoire des photos
    theme.ts                 bascule clair/sombre
  pages/par5/                formulaire, mes fiches, définitions
tools/                       construction, publication et bancs d'essai
```

> ⚠️ `src/data/par5.ts` est une **copie** du carnet des 16 risques présent dans
> ToolApp. Si le carnet officiel change, les deux projets doivent être mis à
> jour.
