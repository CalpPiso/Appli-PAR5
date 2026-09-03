/* Genere par esbuild depuis src/data/par5.ts - ne pas editer a la main. */
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/data/par5.ts
var par5_exports = {};
__export(par5_exports, {
  RISQUES: () => RISQUES,
  bloquants: () => bloquants,
  donneesPar5Vides: () => donneesPar5Vides,
  ligneVide: () => ligneVide,
  verifierPar5: () => verifierPar5
});
module.exports = __toCommonJS(par5_exports);
var RISQUES = [
  {
    id: "chimiques",
    nom: "Risques chimiques",
    description: "Pr\xE9sence de produits dangereux sous forme de solide, liquide, a\xE9rosol, gaz, vapeur, poussi\xE8re, fum\xE9e, brouillards, autre (pr\xE9cisez).",
    moyens: "\xC9liminer les produits dangereux et utiliser des substituts moins toxiques, r\xE9duire la quantit\xE9 de produit, s'assurer d'une ventilation ad\xE9quate. S'assurer que les capteurs de d\xE9tection continue sont fonctionnels et que les \xE9quipements et contenants sont s\xE9curitaires. Consulter les proc\xE9dures et les fiches de s\xE9curit\xE9 ainsi que les \xE9tiquettes, \xEAtre form\xE9 sur le SIMDUT et l'utilisation des \xC9PI. Conna\xEEtre le plan d'\xE9vacuation en vigueur ainsi que l'emplacement des douches de s\xE9curit\xE9 chimique."
  },
  {
    id: "biologiques",
    nom: "Risques biologiques",
    description: "Pr\xE9sence de micro-organismes sous forme de poussi\xE8re, brume, d\xE9composition, croissance dans un milieu humide, amiante, plomb, autre (pr\xE9cisez).",
    moyens: "Utiliser des instruments et appareils s\xE9curitaires, utiliser des produits ou \xE9quipements plus s\xFBrs, s'assurer que la ventilation est ad\xE9quate. Consulter les proc\xE9dures, utiliser des fiches de s\xE9curit\xE9, ma\xEEtriser les r\xE8gles de bios\xE9curit\xE9 et une proc\xE9dure d'entreposage s\xE9curitaire. Manipuler et entreposer correctement les d\xE9chets biom\xE9dicaux, entretenir les lieux, assainir les outils. \xCAtre \xE0 jour dans sa vaccination, conna\xEEtre l'emplacement des auto-injecteurs d'\xE9pin\xE9phrine et les mesures d'urgence, utiliser des \xC9PI."
  },
  {
    id: "electriques",
    nom: "Risques \xE9lectriques",
    description: "Exposition \xE0 des pi\xE8ces sous tension ou charg\xE9es, un courant de fuite, une source d'alimentation, de l'\xE9nergie emmagasin\xE9e, autre (pr\xE9cisez).",
    moyens: "Prendre connaissance des consignes de s\xE9curit\xE9 affich\xE9es, les respecter en tout temps et porter les \xC9PI requis. S'assurer que toutes les pi\xE8ces accessibles sont mises hors tension. Appliquer une m\xE9thode de contr\xF4le de l'\xE9nergie \xE9lectrique comme le cadenassage. S'assurer que les composantes d'un circuit de plus de 30 V sont prot\xE9g\xE9es pour emp\xEAcher tout contact avec un \xE9l\xE9ment sous tension. V\xE9rifier que les appareils ou outils \xE9lectriques comportent un lien \xE0 la terre par continuit\xE9 des masses ou une double isolation."
  },
  {
    id: "chocs-electriques",
    nom: "Risques de chocs \xE9lectriques",
    description: "Exposition \xE0 des conducteurs sous tension, contacts directs ou indirects avec des parties actives, d\xE9faut d'isolement, installation d\xE9fectueuse, manipulation incorrecte d'\xE9quipements \xE9lectriques, chute d'objets ou de c\xE2bles sous tension, ou exposition \xE0 des environnements humides favorisant la conductivit\xE9.",
    moyens: "Prendre connaissance des consignes de s\xE9curit\xE9 affich\xE9es et les respecter en tout temps. S'assurer que les \xE9quipements \xE9lectriques sont hors tension avant d'intervenir. V\xE9rifier l'int\xE9grit\xE9 des isolations et des protections contre les contacts accidentels. Utiliser des outils et \xE9quipements isol\xE9s ou \xE0 double isolation. Assurer une mise \xE0 la terre correcte de tous les appareils et circuits. Porter les \xC9PI appropri\xE9s."
  },
  {
    id: "thermiques",
    nom: "Risques thermiques",
    description: "Exposition \xE0 des temp\xE9ratures froides, chaudes ou extr\xEAmes, \xE0 des objets ou \xE0 des mat\xE9riaux, \xE0 des flammes, autre (pr\xE9cisez).",
    moyens: "Utiliser des proc\xE9d\xE9s s\xE9curitaires pour r\xE9duire l'\xE9mission de chaleur, \xE9liminer l'exposition \xE0 la chaleur radiante, am\xE9liorer la ventilation, utiliser des \xE9quipements d'aide \xE0 la manutention, recouvrir les poign\xE9es m\xE9talliques d'isolant thermique. Prendre un temps d'acclimatation avant le travail intense, r\xE9duire le temps d'exposition aux temp\xE9ratures extr\xEAmes. S'assurer d'avoir acc\xE8s \xE0 l'eau potable, conna\xEEtre les aires de repos, porter une tenue appropri\xE9e et des \xC9PI."
  },
  {
    id: "bruit",
    nom: "Risques de bruit",
    description: "Exposition au bruit continu, intermittent, impulsif ou de choc, autre (pr\xE9cisez).",
    moyens: "Conna\xEEtre le niveau de bruit des activit\xE9s et des \xE9quipements sur lesquels on intervient et porter les \xC9PI ad\xE9quats. Choisir la bonne m\xE9thode de travail. R\xE9duire la dur\xE9e d'exposition ou utiliser des protecteurs auditifs."
  },
  {
    id: "vibrations",
    nom: "Risques de vibrations",
    description: "Exposition \xE0 des vibrations.",
    moyens: "Conna\xEEtre les m\xE9thodes de travail s\xE9curitaire et les moyens de pr\xE9vention. Limiter le temps d'exposition. Porter des gants antivibrations si requis. Porter les \xC9PI ad\xE9quats."
  },
  {
    id: "mecaniques",
    nom: "Risques m\xE9caniques g\xE9n\xE9raux",
    description: "Contact avec des sources d'\xE9nergie accumul\xE9e ou non, avec une forme dangereuse (pointue ou tranchante), fixe ou mobile, autre (pr\xE9cisez).",
    moyens: "Conna\xEEtre les proc\xE9dures de travail s\xE9curitaire et les appliquer. V\xE9rifier que les protections figurant sur les machines sont en place et fonctionnelles. Prendre des pauses r\xE9guli\xE8res. Utiliser les \xC9PI requis."
  },
  {
    id: "pieces-mouvement",
    nom: "Risques de pi\xE8ces, d'outils et de v\xE9hicule en mouvement",
    description: "Risque d'happement, d'enroulement, d'entra\xEEnement, de coupure, de blessure, de sectionnement, cisaillement, de perte totale ou partielle d'un membre, autre (pr\xE9cisez).",
    moyens: "V\xE9rifier que l'\xE9clairage est suffisant. Pr\xE9voir des p\xE9riodes de repos r\xE9guli\xE8res. Respecter les m\xE9thodes de travail s\xE9curitaires et les proc\xE9dures de cadenassage. V\xE9rifier r\xE9guli\xE8rement que les protecteurs et dispositifs de protection sont en place et en bon \xE9tat. Utiliser des \xC9PI."
  },
  {
    id: "espace-clos",
    nom: "Risques d'espace clos",
    description: "D\xE9ficience en oxyg\xE8ne, pr\xE9sence de gaz, poussi\xE8re toxique ou inflammable, pr\xE9sence de mati\xE8re \xE0 \xE9coulement libre, solide ou liquide, autre (pr\xE9cisez).",
    moyens: "S'assurer que le syst\xE8me de ventilation est ad\xE9quat. Contr\xF4ler les \xE9nergies et cadenasser \xE0 partir de l'ext\xE9rieur. Conna\xEEtre les proc\xE9dures de sauvetage en cas d'urgence. Participer aux formations sur les pratiques de s\xE9curit\xE9 et rester inform\xE9 des mises \xE0 jour. Utiliser des \xC9PI et les moyens de communication appropri\xE9s."
  },
  {
    id: "chute",
    nom: "Risques de chute",
    description: "Travail en hauteur, sous une charge, sous une machine, \xE0 proximit\xE9 du vide, voie de circulation encombr\xE9e, plancher glissant ou en mauvais \xE9tat, autre (pr\xE9cisez).",
    moyens: "Maintenir les voies d'acc\xE8s et de circulation, les passages, planchers et postes de travail en bon \xE9tat, d\xE9gag\xE9s et non glissants, \xE0 l'int\xE9rieur comme \xE0 l'ext\xE9rieur. Travailler \xE0 partir du sol, utiliser des appareils de levage, assurer une protection collective, adopter des m\xE9thodes de travail s\xE9curitaires. R\xE9aliser un entretien p\xE9riodique des lieux. Porter des \xC9PI ad\xE9quats."
  },
  {
    id: "incendie-explosion",
    nom: "Risques d'incendie et d'explosion",
    description: "\xC9clat d'arc flash \xE9lectrique, entreposage ou utilisation de produits inflammables, travail \xE0 chaud, environnement explosif, autre (pr\xE9cisez).",
    moyens: "V\xE9rifier que la ventilation des lieux est ad\xE9quate, s'assurer de la pr\xE9sence et du bon fonctionnement d'un avertisseur de fum\xE9e et de monoxyde de carbone lorsque n\xE9cessaire. Utiliser des \xE9quipements anti-explosion. Ma\xEEtriser les m\xE9thodes de travail s\xE9curitaires, le SIMDUT et les mesures d'urgence. Utiliser les bons \xC9PI."
  },
  {
    id: "ergonomiques",
    nom: "Risques ergonomiques",
    description: "Effort statique, posture contraignante, effort excessif, mouvements r\xE9p\xE9titifs, autre (pr\xE9cisez).",
    moyens: "S\xE9lectionner des \xE9quipements, outils, mobilier et v\xE9hicules offrant des ajustements pour des postures s\xE9curitaires lors des efforts. Conna\xEEtre les m\xE9thodes de travail, les gestes et postures \xE0 privil\xE9gier (manutention et travail statique). Int\xE9grer des temps de pause selon l'exigence de la t\xE2che, la temp\xE9rature et la nature du travail. Porter des \xC9PI adapt\xE9s."
  },
  {
    id: "psychosociaux",
    nom: "Risques psychosociaux",
    description: "Surcharge de travail, rythme \xE9lev\xE9, demande psychologique \xE9lev\xE9e, conflit, exposition \xE0 un environnement de travail malsain, \xE9tat d'esprit (pression, fatigue, pr\xE9occupation), autre (pr\xE9cisez).",
    moyens: "Appliquer une tol\xE9rance z\xE9ro pour la violence et le harc\xE8lement physique ou moral. Conna\xEEtre la politique contre le harc\xE8lement. Rapporter tout fait de violence verbale ou physique dont on est t\xE9moin ou victime. Conna\xEEtre le plan d'\xE9vacuation d'urgence."
  },
  {
    id: "violences",
    nom: "Risques de violences",
    description: "Comportements violents provenant de l'externe, par des coll\xE8gues, par des fournisseurs, par des animaux, autre (pr\xE9cisez).",
    moyens: "Respecter la politique de tol\xE9rance z\xE9ro \xE0 la violence. En cas de comportement violent, le signaler imm\xE9diatement \xE0 un responsable et remplir un rapport d'incident selon les proc\xE9dures. Conna\xEEtre le plan d'\xE9vacuation et les points de rassemblement en cas de situation de violence."
  },
  {
    id: "coactivite",
    nom: "Risque de coactivit\xE9",
    description: "Risques d\u2019interf\xE9rence, chute, \xE9lectrique, nuisances sonores et visuelles, autre (pr\xE9cisez).",
    moyens: "\xC9tablir une planification claire des activit\xE9s de chaque \xE9quipe et organiser des r\xE9unions pour tous les intervenants. D\xE9limiter clairement les zones de travail. Avoir une communication constante avec les autres intervenants \xE0 proximit\xE9. Effectuer des inspections fr\xE9quentes pour identifier les dangers potentiels."
  }
];
function ligneVide(risqueId) {
  return { risqueId, present: null, specification: "", moyens: "", responsable: "", realise: false };
}
function donneesPar5Vides() {
  return {
    noProjet: "",
    installation: "",
    emplacement: "",
    tache: "",
    lignes: RISQUES.map((r) => ligneVide(r.id)),
    travailleurs: [{ nom: "", initiales: "", date: "" }]
  };
}
function verifierPar5(d) {
  const m = [];
  const nom = (id) => RISQUES.find((r) => r.id === id)?.nom ?? id;
  const sansReponse = d.lignes.filter((l) => l.present === null);
  if (sansReponse.length)
    m.push({
      gravite: "bloquant",
      texte: sansReponse.length === 1 ? `1 risque sur ${RISQUES.length} n'a pas de r\xE9ponse : ${nom(sansReponse[0].risqueId)}.` : `${sansReponse.length} risques sur ${RISQUES.length} n'ont pas de r\xE9ponse.`
    });
  const presents = d.lignes.filter((l) => l.present === "oui");
  for (const l of presents.filter((x) => !x.moyens.trim()))
    m.push({
      gravite: "bloquant",
      texte: `\xAB ${nom(l.risqueId)} \xBB est pr\xE9sent, mais aucun moyen de pr\xE9vention n'est \xE9crit.`
    });
  if (!d.travailleurs.some((t) => t.nom.trim() || t.initiales.trim()))
    m.push({ gravite: "bloquant", texte: "Aucun travailleur n\u2019est inscrit sur la fiche." });
  if (!d.tache.trim())
    m.push({ gravite: "avertissement", texte: "La t\xE2che \xE0 ex\xE9cuter n\u2019est pas d\xE9crite." });
  if (!d.noProjet.trim() && !d.installation.trim())
    m.push({
      gravite: "avertissement",
      texte: "Ni num\xE9ro de projet ni installation : la fiche sera difficile \xE0 retrouver."
    });
  for (const l of presents.filter((x) => !x.responsable.trim()))
    m.push({
      gravite: "avertissement",
      texte: `\xAB ${nom(l.risqueId)} \xBB : aucun responsable d\xE9sign\xE9.`
    });
  const pasEnPlace = presents.filter((x) => x.moyens.trim() && !x.realise);
  if (pasEnPlace.length)
    m.push({
      gravite: "avertissement",
      texte: pasEnPlace.length === 1 ? `Les moyens de \xAB ${nom(pasEnPlace[0].risqueId)} \xBB ne sont pas d\xE9clar\xE9s mis en place.` : `${pasEnPlace.length} risques ont des moyens qui ne sont pas d\xE9clar\xE9s mis en place.`
    });
  return m;
}
var bloquants = (m) => m.filter((x) => x.gravite === "bloquant");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RISQUES,
  bloquants,
  donneesPar5Vides,
  ligneVide,
  verifierPar5
});
