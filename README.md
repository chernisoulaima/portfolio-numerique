# Portfolio numérique — Soulaima

**Étudiante :** Soulaima — 1ère année, Technologie de l'Informatique — ISET Nabeul
**Dépôt :** https://github.com/chernisoulaima/portfolio-numerique  
**Site en ligne :** https://chernisoulaima.github.io/portfolio-numerique/

## Objectif du projet

Ce portfolio présente mes réalisations dans chaque unité d'enseignement du semestre. Pour chaque cours, on trouve un résumé, une carte mentale interactive, un podcast, un vocal, des vidéos recommandées et un quiz de révision. Chaque fiche peut être partagée sur Google Classroom.

Le site est **statique** : HTML, CSS et JavaScript natifs, sans framework ni étape de compilation. Il est hébergé sur GitHub Pages.

## Modules

| Unité d'enseignement | Pages |
|---|---|
| Digital Skills | [Cybersécurité](digital-skills/cybersecurite.html) · [Prompt engineering](digital-skills/prompt-engineering.html) · [Création de contenu](digital-skills/creation-contenu.html) |
| Développement | [Python](developpement/python.html) · [Langage C](developpement/langage-c.html) · [Algorithmique](developpement/algorithmique.html) |
| Systèmes d'exploitation et fondements | [Systèmes d'exploitation](systemes/systemes-exploitation.html) · [Architecture et électronique](systemes/architecture-electronique.html) |
| Développement web côté client | [HTML, CSS, JavaScript](web/developpement-web.html) |

## Structure

```
portfolio-numerique/
├── index.html                 page d'accueil (présentation + cartes des modules)
├── css/style.css              feuille de style commune (responsive + mode sombre)
├── js/script.js               interactivité (menu, thème, quiz, cartes mentales…)
├── digital-skills/            cybersecurite, prompt-engineering, creation-contenu
├── developpement/             python, langage-c, algorithmique
├── systemes/                  systemes-exploitation, architecture-electronique
├── web/                       developpement-web
├── medias/
│   ├── audio/                 podcasts et vocaux (MP3)
│   ├── images/                captures, infographies
│   └── pdf/                   présentations exportées
└── outils/generer_audio.py    génération des audios avec Google Cloud TTS
```

## Fonctionnalités JavaScript

- Mode sombre mémorisé, menu mobile, filtre des modules sur l'accueil
- Cartes mentales en SVG générées à partir de données JSON (dans chaque page)
- Quiz de révision et checklist « Suis-je bien protégé ? »
- Animation de tri (bulles, sélection, insertion)
- Convertisseur décimal / binaire / hexadécimal / octal et simulateur de portes logiques
- Lecture vocale du résumé par le navigateur (Web Speech API)
- Bouton « Partager sur Google Classroom »

## Ajouter les médias

**Vidéos recommandées** : chaque module propose une sélection de 3 vidéos YouTube en français (lecteur intégré et playlist cliquable) pour approfondir le cours. Les identifiants des vidéos se trouvent dans l'attribut `data-youtube` et dans les boutons `.yt-item` de chaque page.

**Podcasts et vocaux** : les 18 fichiers de `medias/audio/` (un podcast à deux voix et un vocal par module) ont été générés à partir des résumés avec des voix neuronales françaises (Denise et Henri, via `edge-tts`) :
```powershell
pip install edge-tts
python outils/generer_audio.py --moteur edge
```
À relancer après chaque modification d'un résumé.

**Variante avec Google Cloud Text-to-Speech**

1. Dans la console Google Cloud, active l'API *Cloud Text-to-Speech* et crée une clé API.
2. Dans PowerShell, à la racine du site :
   ```powershell
   $env:GOOGLE_TTS_API_KEY = "ta-cle"
   python outils/generer_audio.py --apercu     # vérifier le texte (gratuit)
   python outils/generer_audio.py              # générer tous les MP3
   ```
3. Les fichiers `medias/audio/<page>-podcast.mp3` et `<page>-vocal.mp3` sont créés, et les lecteurs de chaque page les chargent automatiquement.

> ⚠️ Ne publie jamais la clé API sur GitHub. Elle reste dans la variable d'environnement.


## Publier sur GitHub Pages

```powershell
git init
git add .
git commit -m "Portfolio numérique"
git branch -M main
git remote add origin https://github.com/chernisoulaima/portfolio-numerique.git
git push -u origin main
```

Ensuite, sur GitHub : *Settings → Pages → Branch : main → / (root) → Save*.

## Outils utilisés

Claude, ChatGPT, Perplexity, NotebookLM, edge-tts (synthèse vocale), Canva, Gamma, YouTube (vidéos recommandées), VS Code, Git, GitHub Pages.

## Transparence IA

La structure du site et un premier jet des résumés ont été produits avec Claude. Les contenus doivent être relus, corrigés et complétés à partir des supports de cours (voir la fiche « Transparence IA » en bas de chaque page).
