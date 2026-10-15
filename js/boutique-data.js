/*
 * SKX — données publiées de la boutique.
 *
 * Ce fichier est ce que TOUS les visiteurs voient.
 * Tu peux le modifier à la main, ou bien passer par l'espace admin du site
 * (#/admin) puis cliquer sur « Publier → télécharger boutique-data.js »
 * et remplacer ce fichier par celui téléchargé.
 */
window.SKX_DATA = {
  "version": 1,
  "settings": {
    "shopName": "SKX",
    "slogan": "Quatre éléments. Une seule signature.",
    "currency": "EUR",
    "contactEmail": "contact@skx.fr",
    "paymentLink": "",
    "orderEndpoint": "",
    "freeShippingFrom": 80,
    "shippingPrice": 5.9,
    "announcement": "Livraison offerte dès 80 € · Retours gratuits 30 jours",
    "adminPasswordHash": "",
    "instagram": "",
    "tiktok": ""
  },
  "univers": {
    "montagne": {
      "name": "Montagne",
      "tagline": "Altitude, froid, silence.",
      "description": "Des pièces chaudes et solides pour ceux qui montent toujours plus haut. Molletons épais, coupes amples, teintes glacier."
    },
    "terre": {
      "name": "Terre",
      "tagline": "Racines, poussière, matière brute.",
      "description": "Coton lourd, tons ocre et argile. Des vêtements faits pour durer, qui vieillissent avec toi."
    },
    "pluie": {
      "name": "Pluie",
      "tagline": "Orage, asphalte, nuit mouillée.",
      "description": "Coupe-vent, matières déperlantes et noirs profonds. La ville sous l'averse, en mode SKX."
    },
    "soleil": {
      "name": "Soleil",
      "tagline": "Chaleur, lumière, été sans fin.",
      "description": "Matières légères, couleurs qui brûlent, coupes relax. Pour les jours où tout brille."
    }
  },
  "stations": [
    {
      "name": "NRJ France",
      "urls": [
        "https://scdn.nrjaudio.fm/adwz2/fr/30001/mp3_128.mp3?origine=fluxradios",
        "https://streaming.nrjaudio.fm/oumvmk8fnozc"
      ]
    },
    {
      "name": "Fun Radio",
      "urls": [
        "https://streamer-02.rtl.fr/fun-1-44-128",
        "https://streamer-01.rtl.fr/fun-1-44-128"
      ]
    }
  ],
  "products": [
    { "id": "p-sommet", "name": "Hoodie Sommet", "univers": "montagne", "type": "hoodie", "color": "#cfd8dc", "price": 69, "oldPrice": null, "sizes": ["S", "M", "L", "XL", "XXL"], "stock": 25, "image": "", "featured": true, "description": "Molleton 400 g brossé, capuche doublée, logo SKX brodé poitrine. Coupe oversize." },
    { "id": "p-glacier", "name": "Veste Glacier", "univers": "montagne", "type": "veste", "color": "#455a64", "price": 129, "oldPrice": 149, "sizes": ["S", "M", "L", "XL"], "stock": 12, "image": "", "featured": false, "description": "Veste matelassée zippée, col montant, coupe-vent. Pour les sommets comme pour la ville." },
    { "id": "p-altitude", "name": "Bonnet Altitude", "univers": "montagne", "type": "bonnet", "color": "#eceff1", "price": 25, "oldPrice": null, "sizes": ["Unique"], "stock": 40, "image": "", "featured": false, "description": "Maille côtelée épaisse, revers large, pompon. Étiquette SKX tissée." },

    { "id": "p-argile", "name": "T-shirt Argile", "univers": "terre", "type": "tshirt", "color": "#a1662f", "price": 35, "oldPrice": null, "sizes": ["XS", "S", "M", "L", "XL"], "stock": 50, "image": "", "featured": true, "description": "Coton épais 240 g teint en pièce, col côtelé, logo SKX sérigraphié." },
    { "id": "p-racine", "name": "Cargo Racine", "univers": "terre", "type": "pantalon", "color": "#5d4037", "price": 79, "oldPrice": null, "sizes": ["S", "M", "L", "XL"], "stock": 18, "image": "", "featured": false, "description": "Pantalon cargo en toile robuste, 6 poches, bas resserrables." },
    { "id": "p-desert", "name": "Casquette Désert", "univers": "terre", "type": "casquette", "color": "#c19a6b", "price": 29, "oldPrice": null, "sizes": ["Unique"], "stock": 30, "image": "", "featured": false, "description": "Casquette 6 panneaux en coton délavé, broderie SKX ton sur ton." },

    { "id": "p-averse", "name": "Coupe-vent Averse", "univers": "pluie", "type": "veste", "color": "#37474f", "price": 99, "oldPrice": null, "sizes": ["S", "M", "L", "XL"], "stock": 15, "image": "", "featured": true, "description": "Nylon déperlant, capuche cachée dans le col, coutures étanchées." },
    { "id": "p-orage", "name": "Hoodie Orage", "univers": "pluie", "type": "hoodie", "color": "#263238", "price": 72, "oldPrice": null, "sizes": ["S", "M", "L", "XL", "XXL"], "stock": 22, "image": "", "featured": false, "description": "Molleton noir orage, logo SKX réfléchissant visible la nuit." },
    { "id": "p-bruine", "name": "Casquette Bruine", "univers": "pluie", "type": "casquette", "color": "#546e7a", "price": 29, "oldPrice": null, "sizes": ["Unique"], "stock": 26, "image": "", "featured": false, "description": "Casquette technique imperméable, visière rigide, réglage arrière." },

    { "id": "p-zenith", "name": "T-shirt Zénith", "univers": "soleil", "type": "tshirt", "color": "#ffb300", "price": 35, "oldPrice": null, "sizes": ["XS", "S", "M", "L", "XL"], "stock": 45, "image": "", "featured": true, "description": "Coton léger 180 g, coupe boxy, logo SKX gothique dans le dos." },
    { "id": "p-aube", "name": "Jogging Aube", "univers": "soleil", "type": "pantalon", "color": "#ff7043", "price": 59, "oldPrice": 69, "sizes": ["S", "M", "L", "XL"], "stock": 20, "image": "", "featured": false, "description": "Jogging en molleton léger, coupe droite, finitions orange brûlé." },
    { "id": "p-solstice", "name": "Casquette Solstice", "univers": "soleil", "type": "casquette", "color": "#fdd835", "price": 29, "oldPrice": null, "sizes": ["Unique"], "stock": 35, "image": "", "featured": false, "description": "Casquette coton jaune soleil, broderie SKX noire." }
  ]
};
