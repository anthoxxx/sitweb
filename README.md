# SKX — boutique de vêtements

Site e-commerce statique (HTML/CSS/JS, aucune installation) avec :

- **4 univers animés** : Montagne (neige), Terre (poussière), Pluie (averse + éclairs), Soleil (rayons)
- **Boutique** : filtres par univers, recherche, tri, fiche produit avec tailles, panier, commande
- **Radio en fond** (NRJ France par défaut) : lecture/pause, volume +/−, curseur, muet, réduire le lecteur. Elle continue pendant la navigation et démarre au premier clic (les navigateurs interdisent la lecture automatique).
- **Espace admin** (`#/admin`, lien en bas de page) : produits (ajout, modif, photos, stock, promo), textes des univers, stations radio, réglages, mot de passe.

## Lancer le site

Ouvre `index.html` dans un navigateur, ou mets le dossier en ligne (GitHub Pages : *Settings → Pages → Deploy from branch*).

## Espace admin

- Mot de passe par défaut : **`skx2026`** → change-le dans *Réglages*.
- Les modifications sont d'abord un **brouillon** visible uniquement sur ton navigateur.
- Pour les mettre en ligne : *Tableau de bord → Publier* → télécharge `boutique-data.js` et remplace `js/boutique-data.js`.
- Photos : le mieux est de les mettre dans `assets/produits/` et d'indiquer le chemin (ex. `assets/produits/hoodie.jpg`).

## Commandes et paiement

Le site n'a pas de serveur. À la validation d'une commande :
- si une adresse **Formspree** est réglée (*Réglages*), la commande t'est envoyée automatiquement par email ;
- sinon le client l'envoie par email (bouton « Envoyer ma commande ») à ton adresse de contact ;
- si un **lien de paiement** est réglé (Stripe Payment Link, PayPal.me, SumUp…), un bouton « Payer » s'affiche.

> ⚠️ Le mot de passe admin protège l'interface, mais sur un site statique ce n'est pas une sécurité forte. Les vraies modifications du site passent par ton dépôt GitHub, qui reste le seul vrai accès.
