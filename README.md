# SKX — boutique de vêtements

Site statique (HTML/CSS/JS, rien à installer). SKX, pensé en 2014.

- **Homme, Femme, Enfants**, tailles XS à 3XL (filtres genre, zone, taille)
- **5 zones** façon ascension en montagne, chacune avec son paysage animé : Streetwear (camp de base), Sport (col), 1ère classe (sommet), Accessoires (refuge), Cool (lac d'altitude)
- **Histoire** : la marque racontée en slides (flèches, clavier, glisser sur mobile)
- **L'équipe** : du fondateur aux collaborateurs
- **Matières** : textiles certifiés et règles du cahier des charges
- **Radio en fond** : NRJ France et Fun Radio
- **Espace équipe** (`#/equipe`) : comptes collaborateurs et rôles, produits, zones, histoire, page équipe, matières, fiches techniques
- Contact : contact-team@skx.fr

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
