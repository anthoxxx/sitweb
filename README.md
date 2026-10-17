# SKX — boutique de vêtements

Site statique (HTML/CSS/JS, rien à installer). SKX, pensé en 2014 — « Ta fierté, ton progrès. »

- **Homme, Femme, Enfants**, tailles XS à 3XL (filtres genre, zone, taille)
- **5 zones** façon ascension en montagne, chacune avec son paysage animé : Streetwear (camp de base), Sport (col), 1ère classe (sommet), Accessoires (refuge), Cool (lac d'altitude)
- **Histoire** : la marque racontée en slides (flèches, clavier, glisser sur mobile)
- **L'équipe** : Karim, Anthony, Fabio, avec avatars illustrés réglables
- **Personnalisation** : coloris et dessin au choix, aperçu en direct, supplément par dessin
- **Promotions** : codes promo pour les proches (70 % max, enregistrés chiffrés), soldes d'hiver et d'été (50 % max), remise par quantité, emballage cadeau
- **Ventes** : recommandations « Complète la tenue », barre de livraison offerte, « Vus récemment », page Soldes
- **Conversion** : barre de réassurance, Meilleures ventes / Nouveautés, packs avec remise automatique, ajout rapide au survol, liste d'envies, avis clients (modérés), FAQ, code de bienvenue, « Acheter maintenant », ajout après commande à −10 %, numéro et prénom au dos
- **Pages** : Notre histoire (blocs histoire, valeurs, mission, équipe, qualité), Contact, Mentions légales, CGV, Confidentialité (champs à compléter dans Réglages)
- **Marquage** : logo SKX brodé en bas à gauche + étiquette dans le col
- **Matières** : textiles certifiés et règles du cahier des charges
- **Radio en fond** : 21 stations (NRJ, Fun Radio, Skyrock, Mouv', FIP, radios ici des 4 coins de la France, BBC, KEXP, triple j…), groupées par région, boutons station précédente/suivante
- **Espace équipe** (`#/equipe`) : comptes collaborateurs et rôles, produits, zones, histoire, page équipe, matières, fiches techniques
- Contact : contact-team@skx.fr

## Espace client (#/compte)

Les clients créent un compte, se connectent et retrouvent : leur panier, leurs commandes (avec « Racheter »), leur liste d'envies, leur adresse (pré-remplie à la commande) et leurs codes.

- **Sans réglage** : les comptes sont enregistrés sur l'appareil du client (pratique pour tester, mais pas de synchronisation entre téléphone et ordinateur).
- **Vrais comptes en ligne (recommandé, gratuit)** :
  1. Crée un projet sur https://supabase.com
  2. SQL Editor → colle le contenu de `supabase/schema.sql` → Run
  3. Project Settings → API : copie l'**URL** et la clé **anon public**
  4. Espace équipe → Réglages → colle-les dans « Comptes clients », puis publie
  Les comptes, paniers, envies et commandes sont alors synchronisés sur tous les appareils, avec e-mail de confirmation et « mot de passe oublié ». Le statut des commandes se change dans Supabase (table `orders`, colonne `status`).

## Espace équipe

Première connexion : identifiant `admin`, mot de passe `skx2026`. Le site te demande alors de créer ton compte administrateur ; le compte `admin` est ensuite désactivé.

| Rôle | Accès |
|---|---|
| Admin | tout, y compris l'équipe et les réglages |
| Gestion | produits, stock, zones, histoire, page équipe, radio, commandes, fiches, matières |
| Atelier | matières, fiches techniques, cahier des charges |
| Lecture | consultation seule |

Les mots de passe sont chiffrés (PBKDF2-SHA256) et ne sont jamais enregistrés en clair.

## Cahier des charges (onglets Matières, Fiches techniques, Cahier des charges)

- **Matières** : bibliothèque des matières premières (composition, grammage, certifications GOTS/GRS/OEKO-TEX…, fournisseur, origine, prix, stock).
- **Fiches techniques** : pour chaque produit, l'assemblage (matières et quantités par pièce), la construction, les finitions, l'entretien et l'atelier. Le site calcule le coût matière, le coefficient et la part de fibres certifiées, et vérifie la fiche par rapport au cahier des charges. Chaque fiche s'imprime ou s'enregistre en PDF.
- **Cahier des charges** : les exigences de la marque, modifiables et imprimables.

## Publier les modifications

Les modifications faites dans l'espace équipe restent sur ton navigateur jusqu'à la publication.

**Publier en ligne (recommandé)** : crée un jeton GitHub sur https://github.com/settings/personal-access-tokens/new
→ *Repository access* : seulement `anthoxxx/sitweb` → *Permissions* : **Contents : Read and write**.
Colle-le dans *Tableau de bord → Publier en ligne*. Chaque collaborateur qui publie a besoin d'un jeton (ou d'être ajouté comme collaborateur du dépôt GitHub).

**Sinon** : *Télécharger boutique-data.js*, puis remplace `js/boutique-data.js` dans le dépôt.

## Mise en ligne

GitHub → *Settings → Pages* → branche `claude/nice-clarke-bl2gc9`, dossier `/ (root)`. Le site est alors sur https://anthoxxx.github.io/sitweb/

## Limites

Le site n'a pas de serveur : la connexion protège l'interface, pas les données. Le fichier `boutique-data.js` (produits, matières, fiches) est public. Les vraies écritures passent par GitHub, donc par les jetons. Pour des données vraiment privées (prix fournisseurs, marges), il faudra un backend (Supabase, Firebase…).
