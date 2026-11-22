"""
Génère les podcasts et les vocaux du portfolio avec Google Cloud Text-to-Speech.

Pour chaque page de module, le script lit la section « Résumé du cours »
(<section id="resume">) et produit :
  medias/audio/<page>-vocal.mp3    -> lecture du résumé par une seule voix
  medias/audio/<page>-podcast.mp3  -> épisode à deux voix (animatrice + explications)

Prérequis
---------
1. Un projet Google Cloud avec l'API « Cloud Text-to-Speech » activée.
2. Une clé API (Console Google Cloud > API et services > Identifiants).
3. Mettre la clé dans une variable d'environnement — JAMAIS dans le code
   ni dans le dépôt GitHub :
       PowerShell :  $env:GOOGLE_TTS_API_KEY = "ta-cle"
       Bash       :  export GOOGLE_TTS_API_KEY="ta-cle"

Utilisation (depuis la racine du site)
--------------------------------------
    python outils/generer_audio.py              # toutes les pages
    python outils/generer_audio.py python       # une seule page
    python outils/generer_audio.py --liste      # voir les pages trouvées

Aucune bibliothèque à installer : uniquement la bibliothèque standard Python.

Moteur gratuit sans clé (voix neuronales Microsoft Edge)
--------------------------------------------------------
    pip install edge-tts
    python outils/generer_audio.py --moteur edge
"""
import base64
import json
import os
import pathlib
import sys
import urllib.error
import urllib.request
from html.parser import HTMLParser

RACINE = pathlib.Path(__file__).resolve().parent.parent
SORTIE = RACINE / "medias" / "audio"
API = "https://texttospeech.googleapis.com/v1/text:synthesize"

# Voix françaises (liste complète : https://cloud.google.com/text-to-speech/docs/voices)
VOIX_ANIMATRICE = "fr-FR-Neural2-A"   # voix féminine
VOIX_EXPERT = "fr-FR-Neural2-B"       # voix masculine
VOIX_VOCAL = "fr-FR-Neural2-A"
LIMITE_OCTETS = 4500                  # l'API accepte 5000 octets par requête

# Équivalents pour le moteur « edge » (gratuit, sans clé)
VOIX_EDGE = {
    VOIX_ANIMATRICE: "fr-FR-DeniseNeural",
    VOIX_EXPERT: "fr-FR-HenriNeural",
}
MOTEUR = "google"


def synthetiser_edge(texte, voix):
    """Synthèse avec edge-tts (pip install edge-tts) ; renvoie les octets MP3."""
    import asyncio
    import edge_tts

    async def run():
        audio = b""
        com = edge_tts.Communicate(texte, VOIX_EDGE.get(voix, "fr-FR-DeniseNeural"), rate="+0%")
        async for morceau in com.stream():
            if morceau["type"] == "audio":
                audio += morceau["data"]
        return audio

    for essai in range(3):
        try:
            return asyncio.run(run())
        except Exception as e:  # coupure réseau : on réessaie
            if essai == 2:
                sys.exit(f"Erreur edge-tts : {e}")


class LecteurResume(HTMLParser):
    """Extrait le titre de la page et le texte de <section id="resume">, découpé par <h3>."""

    def __init__(self):
        super().__init__()
        self.titre, self._in_title = "", False
        self.profondeur = 0           # > 0 quand on est dans la section résumé
        self.ignorer = 0              # > 0 dans un bloc <pre> (code non lu)
        self.dans_h3 = False
        self.parties = [["Introduction", []]]
        self._tampon = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "title":
            self._in_title = True
        if self.profondeur:
            if tag == "section":
                self.profondeur += 1
            if tag == "pre":
                self.ignorer += 1
                self._ajouter("Voir l'exemple de code sur la page.")
            if tag == "h3":
                self._vider()
                self.dans_h3 = True
                self.parties.append(["", []])
            if tag in ("p", "li", "div", "tr", "br"):
                self._vider()
        elif tag == "section" and attrs.get("id") == "resume":
            self.profondeur = 1

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        if not self.profondeur:
            return
        if tag == "pre":
            self.ignorer -= 1
        elif tag == "h3":
            self.parties[-1][0] = " ".join(self._tampon).strip()
            self._tampon, self.dans_h3 = [], False
        elif tag in ("p", "li", "div", "tr"):
            self._vider()
        elif tag == "section":
            self.profondeur -= 1
            if not self.profondeur:
                self._vider()

    def handle_data(self, data):
        if self._in_title:
            self.titre += data
        if self.profondeur and not self.ignorer:
            texte = " ".join(data.split())
            if texte and texte != "Résumé du cours":
                self._tampon.append(texte)

    def _ajouter(self, phrase):
        self._vider()
        self.parties[-1][1].append(phrase)

    def _vider(self):
        if self.dans_h3:
            return
        phrase = " ".join(self._tampon).strip()
        self._tampon = []
        if phrase:
            if phrase[-1] not in ".!?:":
                phrase += "."
            self.parties[-1][1].append(phrase)


def decouper(texte, limite=LIMITE_OCTETS):
    """Coupe un texte en morceaux de moins de `limite` octets, sur les fins de phrase."""
    morceaux, courant = [], ""
    for phrase in texte.replace("\n", " ").split(". "):
        essai = (courant + " " + phrase + ".").strip() if courant else phrase + "."
        if len(essai.encode("utf-8")) > limite and courant:
            morceaux.append(courant)
            courant = phrase + "."
        else:
            courant = essai
    if courant:
        morceaux.append(courant)
    return morceaux


def synthetiser(texte, voix, cle):
    """Appelle l'API Text-to-Speech et renvoie les octets MP3."""
    if MOTEUR == "edge":
        return synthetiser_edge(texte, voix)
    audio = b""
    for morceau in decouper(texte):
        corps = json.dumps({
            "input": {"text": morceau},
            "voice": {"languageCode": "fr-FR", "name": voix},
            "audioConfig": {"audioEncoding": "MP3", "speakingRate": 1.0},
        }).encode("utf-8")
        requete = urllib.request.Request(API, data=corps, method="POST", headers={
            "Content-Type": "application/json; charset=utf-8",
            "X-Goog-Api-Key": cle,       # clé dans l'en-tête, pas dans l'URL
        })
        try:
            with urllib.request.urlopen(requete, timeout=60) as rep:
                audio += base64.b64decode(json.load(rep)["audioContent"])
        except urllib.error.HTTPError as e:
            message = e.read().decode("utf-8", "replace")
            sys.exit(f"Erreur de l'API Google ({e.code}) : {message}")
    return audio


def titre_court(titre):
    return titre.split("—")[0].strip()


def generer(page, cle):
    lecteur = LecteurResume()
    lecteur.feed(page.read_text(encoding="utf-8"))
    parties = [(t, c) for t, c in lecteur.parties if c]
    if not parties:
        print(f"  ! pas de section résumé dans {page.name}, ignorée")
        return
    sujet = titre_court(lecteur.titre)
    nom = page.stem
    SORTIE.mkdir(parents=True, exist_ok=True)

    # 1) Vocal : une seule voix lit tout le résumé
    texte_vocal = f"Résumé : {sujet}. " + " ".join(
        (f"{t}. " if t else "") + " ".join(c) for t, c in parties)
    (SORTIE / f"{nom}-vocal.mp3").write_bytes(synthetiser(texte_vocal, VOIX_VOCAL, cle))
    print(f"  ✓ {nom}-vocal.mp3")

    # 2) Podcast : l'animatrice introduit chaque partie, l'expert explique
    audio = synthetiser(
        f"Bonjour et bienvenue dans le podcast de révision de Soulaima. "
        f"Aujourd'hui, on parle de : {sujet}. C'est parti !", VOIX_ANIMATRICE, cle)
    for i, (titre, contenu) in enumerate(parties):
        if titre:
            intro = "On commence avec" if i <= 1 else "Passons maintenant à"
            audio += synthetiser(f"{intro} : {titre}.", VOIX_ANIMATRICE, cle)
        audio += synthetiser(" ".join(contenu), VOIX_EXPERT, cle)
    audio += synthetiser(
        "Merci de nous avoir écoutés ! Pour vérifier tes connaissances, "
        "fais le quiz de révision sur la page. À bientôt !", VOIX_ANIMATRICE, cle)
    (SORTIE / f"{nom}-podcast.mp3").write_bytes(audio)
    print(f"  ✓ {nom}-podcast.mp3")


def main():
    pages = sorted(p for p in RACINE.glob("*/*.html") if p.parent.name not in ("outils", "medias"))
    args = sys.argv[1:]
    if "--liste" in args:
        for p in pages:
            print(p.relative_to(RACINE))
        return
    noms = [a for a in args if not a.startswith("--") and a not in ("edge", "google")]
    if noms:
        pages = [p for p in pages if p.stem in noms]
        if not pages:
            sys.exit("Aucune page ne correspond. Utilise --liste pour voir les noms.")

    if "--apercu" in args:
        # Affiche le texte qui sera lu, sans appeler l'API (gratuit)
        for page in pages:
            lecteur = LecteurResume()
            lecteur.feed(page.read_text(encoding="utf-8"))
            print(f"\n===== {titre_court(lecteur.titre)} =====")
            for titre, contenu in lecteur.parties:
                if contenu:
                    print(f"[{titre or 'Intro'}] " + " ".join(contenu))
        return

    global MOTEUR
    if "--moteur" in args and args[args.index("--moteur") + 1:][:1] == ["edge"]:
        MOTEUR = "edge"
    cle = os.environ.get("GOOGLE_TTS_API_KEY", "")
    if MOTEUR == "google" and not cle:
        sys.exit("Variable GOOGLE_TTS_API_KEY absente. Voir les instructions en haut du fichier.")

    for page in pages:
        print(f"→ {page.relative_to(RACINE)}")
        generer(page, cle)
    print(f"\nTerminé. Fichiers dans {SORTIE.relative_to(RACINE)}")


if __name__ == "__main__":
    main()
