/*
 * SKX — données publiées de la boutique.
 *
 * Ce fichier est ce que TOUS les visiteurs (et tous les collaborateurs) voient.
 * Il est mis à jour depuis l'espace équipe (#/equipe) :
 *   - « Publier en ligne » (envoi direct sur GitHub avec un jeton), ou
 *   - « Télécharger boutique-data.js » puis remplacer ce fichier à la main.
 */
window.SKX_DATA = {
  "version": 2,
  "settings": {
    "shopName": "SKX",
    "slogan": "Quatre éléments. Une seule signature.",
    "currency": "EUR",
    "contactEmail": "contact@skx.fr",
    "paymentLink": "",
    "orderEndpoint": "",
    "freeShippingFrom": 80,
    "shippingPrice": 5.9,
    "announcement": "Livraison offerte dès 80 € — Retours 30 jours — Matières biologiques et recyclées certifiées",
    "adminPasswordHash": "",
    "githubRepo": "anthoxxx/sitweb",
    "githubBranch": "claude/nice-clarke-bl2gc9",
    "instagram": "",
    "tiktok": ""
  },
  "team": [],
  "univers": {
    "montagne": {
      "name": "Montagne",
      "tagline": "Altitude, froid, silence.",
      "description": "Molletons épais, mailles denses, coupes amples. Des pièces pensées pour le froid sec et les lignes de crête.",
      "metric": "Alt. 3 842 m"
    },
    "terre": {
      "name": "Terre",
      "tagline": "Racines, poussière, matière brute.",
      "description": "Coton lourd teint en pièce, toile de chanvre, tons argile et ocre. Des vêtements qui se patinent avec le temps.",
      "metric": "Sol argileux · pH 6,8"
    },
    "pluie": {
      "name": "Pluie",
      "tagline": "Orage, asphalte, nuit mouillée.",
      "description": "Nylon recyclé déperlant sans PFC, coutures étanchées, noirs profonds. La ville sous l'averse.",
      "metric": "Précip. 92 mm/h"
    },
    "soleil": {
      "name": "Soleil",
      "tagline": "Chaleur, lumière, été sans fin.",
      "description": "Jersey léger, coupes relax, couleurs brûlées par la lumière. Pour les jours où tout chauffe.",
      "metric": "34 °C · UV 9"
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
  "charter": {
    "intro": "Exigences minimales applicables à toute pièce SKX, du choix de la fibre à l'emballage. Toute dérogation doit être validée par écrit par la direction.",
    "rules": [
      { "cat": "Fibres", "text": "Minimum 90 % (en poids) de fibres biologiques ou recyclées certifiées par pièce (GOTS, OCS, GRS)." },
      { "cat": "Coton", "text": "Coton 100 % biologique certifié GOTS. Aucun coton conventionnel." },
      { "cat": "Synthétiques", "text": "Polyester et polyamide uniquement recyclés (certification GRS). Aucune fibre synthétique vierge." },
      { "cat": "Teinture", "text": "Colorants conformes GOTS, sans métaux lourds ni amines aromatiques (azoïques). OEKO-TEX Standard 100 exigé sur le produit fini." },
      { "cat": "Traitements", "text": "Déperlance sans PFC. Aucun traitement biocide ou antibactérien." },
      { "cat": "Accessoires", "text": "Métaux sans nickel, aucun PVC. Étiquettes tissées en coton bio, fil polyester recyclé." },
      { "cat": "Qualité", "text": "Retrait au lavage ≤ 3 % (ISO 5077) · solidité des couleurs au lavage ≥ 4 (ISO 105-C06) · boulochage ≥ 3-4 (ISO 12945-2)." },
      { "cat": "Fournisseurs", "text": "Production en Europe ou bassin méditerranéen. Audit social à jour (Fair Wear, SA8000 ou amfori BSCI)." },
      { "cat": "Traçabilité", "text": "Chaque lot est identifié (fournisseur, n° de lot, date). Les certificats de transaction (TC) sont archivés pour chaque commande." },
      { "cat": "Emballage", "text": "Sachets en papier recyclé ou polybag 100 % recyclé. Aucun plastique vierge." }
    ]
  },
  "materials": [
    { "id": "m-molleton400", "name": "Molleton brossé 400", "category": "Tissu", "composition": "100 % coton biologique", "weight": 400, "certifications": ["GOTS", "OEKO-TEX 100"], "supplier": "Tecelagem Norte", "origin": "Portugal", "price": 14.5, "unit": "m", "stock": 320, "notes": "Laize 180 cm. Envers gratté." },
    { "id": "m-jersey240", "name": "Jersey lourd 240", "category": "Tissu", "composition": "100 % coton biologique", "weight": 240, "certifications": ["GOTS", "OEKO-TEX 100"], "supplier": "Tecelagem Norte", "origin": "Portugal", "price": 9.8, "unit": "m", "stock": 540, "notes": "Teint en pièce. Laize 170 cm tubulaire." },
    { "id": "m-jersey180", "name": "Jersey léger 180", "category": "Tissu", "composition": "100 % coton biologique", "weight": 180, "certifications": ["GOTS"], "supplier": "Ege Organik", "origin": "Turquie", "price": 7.9, "unit": "m", "stock": 410, "notes": "" },
    { "id": "m-ribcote", "name": "Bord-côte 1×1", "category": "Bord-côte", "composition": "95 % coton bio, 5 % élasthanne", "weight": 280, "certifications": ["GOTS"], "supplier": "Tecelagem Norte", "origin": "Portugal", "price": 11, "unit": "m", "stock": 120, "notes": "Coloris assortis au corps." },
    { "id": "m-chanvre", "name": "Toile chanvre-coton 320", "category": "Tissu", "composition": "55 % chanvre, 45 % coton biologique", "weight": 320, "certifications": ["GOTS"], "supplier": "Tessitura Alta", "origin": "Italie", "price": 16.2, "unit": "m", "stock": 150, "notes": "Sergé 2/1. Lavage enzymatique." },
    { "id": "m-nylon", "name": "Nylon recyclé déperlant", "category": "Tissu", "composition": "100 % polyamide recyclé", "weight": 90, "certifications": ["GRS", "bluesign"], "supplier": "Tessitura Alta", "origin": "Italie", "price": 12.4, "unit": "m", "stock": 200, "notes": "Déperlance C0 sans PFC. Colonne d'eau 10 000 mm." },
    { "id": "m-ouate", "name": "Ouate recyclée 100", "category": "Rembourrage", "composition": "100 % polyester recyclé", "weight": 100, "certifications": ["GRS"], "supplier": "Fibres de Lys", "origin": "France", "price": 4.6, "unit": "m", "stock": 180, "notes": "" },
    { "id": "m-popeline", "name": "Popeline doublure 110", "category": "Doublure", "composition": "100 % coton biologique", "weight": 110, "certifications": ["GOTS"], "supplier": "Ege Organik", "origin": "Turquie", "price": 5.2, "unit": "m", "stock": 260, "notes": "" },
    { "id": "m-laine", "name": "Fil laine recyclée", "category": "Fil à tricoter", "composition": "70 % laine recyclée, 30 % polyamide recyclé", "weight": null, "certifications": ["GRS"], "supplier": "Filatura Prato", "origin": "Italie", "price": 38, "unit": "kg", "stock": 45, "notes": "Laine régénérée à Prato, non reteinte." },
    { "id": "m-fil", "name": "Fil à coudre recyclé", "category": "Fil", "composition": "100 % polyester recyclé", "weight": null, "certifications": ["GRS", "OEKO-TEX 100"], "supplier": "Linhas Porto", "origin": "Portugal", "price": 3.1, "unit": "bobine", "stock": 90, "notes": "Tex 40." },
    { "id": "m-etiquette", "name": "Étiquette tissée SKX", "category": "Étiquette", "composition": "100 % coton biologique", "weight": null, "certifications": ["GOTS"], "supplier": "Labelia", "origin": "France", "price": 0.18, "unit": "pièce", "stock": 5000, "notes": "Logo gothique, fond noir." },
    { "id": "m-zip", "name": "Zip métal sans nickel", "category": "Accessoire", "composition": "Laiton sans nickel, ruban polyester recyclé", "weight": null, "certifications": ["OEKO-TEX 100"], "supplier": "Zippa", "origin": "Italie", "price": 2.4, "unit": "pièce", "stock": 300, "notes": "" },
    { "id": "m-cordon", "name": "Cordon plat", "category": "Accessoire", "composition": "100 % coton biologique", "weight": null, "certifications": ["GOTS"], "supplier": "Linhas Porto", "origin": "Portugal", "price": 0.35, "unit": "pièce", "stock": 800, "notes": "Embouts métal sans nickel." }
  ],
  "products": [
    { "id": "p-sommet", "name": "Hoodie Sommet", "univers": "montagne", "type": "hoodie", "color": "#c9d1d6", "price": 69, "oldPrice": null, "sizes": ["S", "M", "L", "XL", "XXL"], "stock": 25, "image": "", "featured": true, "description": "Molleton 400 g brossé, capuche doublée, logo SKX brodé poitrine. Coupe oversize.",
      "spec": { "status": "En production", "madeIn": "Portugal", "workshop": "Atelier Barcelos", "construction": "Coutures surjetées 4 fils, surpiqûre double aiguille aux emmanchures. Capuche doublée popeline. Poche kangourou.", "finishing": "Broderie ton sur ton poitrine. Lavage adoucissant enzymatique.", "care": "Lavage 30 °C à l'envers. Pas de sèche-linge.", "notes": "",
        "components": [ { "role": "Corps et manches", "materialId": "m-molleton400", "qty": 1.6 }, { "role": "Bord-côte", "materialId": "m-ribcote", "qty": 0.25 }, { "role": "Doublure capuche", "materialId": "m-popeline", "qty": 0.35 }, { "role": "Cordon", "materialId": "m-cordon", "qty": 1 }, { "role": "Fil", "materialId": "m-fil", "qty": 0.1 }, { "role": "Étiquette", "materialId": "m-etiquette", "qty": 1 } ] } },
    { "id": "p-glacier", "name": "Veste Glacier", "univers": "montagne", "type": "veste", "color": "#4a5862", "price": 129, "oldPrice": 149, "sizes": ["S", "M", "L", "XL"], "stock": 12, "image": "", "featured": false, "description": "Veste matelassée zippée, col montant, déperlante sans PFC.",
      "spec": { "status": "Validé", "madeIn": "Italie", "workshop": "Laboratorio Veneto", "construction": "Matelassage losange 6 cm. Coutures étanchées sur épaules. Col montant doublé.", "finishing": "Zip métal sans nickel, tirette gravée SKX.", "care": "Lavage 30 °C, programme délicat.", "notes": "",
        "components": [ { "role": "Extérieur", "materialId": "m-nylon", "qty": 2 }, { "role": "Rembourrage", "materialId": "m-ouate", "qty": 1.8 }, { "role": "Doublure", "materialId": "m-popeline", "qty": 1.8 }, { "role": "Fermeture", "materialId": "m-zip", "qty": 1 }, { "role": "Fil", "materialId": "m-fil", "qty": 0.2 }, { "role": "Étiquette", "materialId": "m-etiquette", "qty": 1 } ] } },
    { "id": "p-altitude", "name": "Bonnet Altitude", "univers": "montagne", "type": "bonnet", "color": "#e3e4e1", "price": 25, "oldPrice": null, "sizes": ["Unique"], "stock": 40, "image": "", "featured": false, "description": "Maille côtelée épaisse en laine recyclée, revers large.",
      "spec": { "status": "En production", "madeIn": "Italie", "workshop": "Maglificio Prato", "construction": "Tricot rectiligne côte 2×2, jauge 7. Remaillage main.", "finishing": "Étiquette tissée cousue au revers.", "care": "Lavage main à froid. Séchage à plat.", "notes": "",
        "components": [ { "role": "Maille", "materialId": "m-laine", "qty": 0.12 }, { "role": "Étiquette", "materialId": "m-etiquette", "qty": 1 } ] } },

    { "id": "p-argile", "name": "T-shirt Argile", "univers": "terre", "type": "tshirt", "color": "#9a6a3e", "price": 35, "oldPrice": null, "sizes": ["XS", "S", "M", "L", "XL"], "stock": 50, "image": "", "featured": true, "description": "Coton épais 240 g teint en pièce, col côtelé, logo SKX sérigraphié.",
      "spec": { "status": "En production", "madeIn": "Portugal", "workshop": "Atelier Barcelos", "construction": "Corps tubulaire sans couture latérale. Col bord-côte 2 cm, propreté épaules.", "finishing": "Sérigraphie à l'eau dos. Teinture en pièce.", "care": "Lavage 30 °C à l'envers.", "notes": "",
        "components": [ { "role": "Corps et manches", "materialId": "m-jersey240", "qty": 1.1 }, { "role": "Col", "materialId": "m-ribcote", "qty": 0.05 }, { "role": "Fil", "materialId": "m-fil", "qty": 0.05 }, { "role": "Étiquette", "materialId": "m-etiquette", "qty": 1 } ] } },
    { "id": "p-racine", "name": "Cargo Racine", "univers": "terre", "type": "pantalon", "color": "#5a4232", "price": 79, "oldPrice": null, "sizes": ["S", "M", "L", "XL"], "stock": 18, "image": "", "featured": false, "description": "Pantalon cargo en toile chanvre-coton, 6 poches, bas resserrables.",
      "spec": { "status": "Validé", "madeIn": "Italie", "workshop": "Laboratorio Veneto", "construction": "Coutures rabattues double aiguille. 6 poches dont 2 soufflets. Ceinture élastiquée arrière.", "finishing": "Lavage enzymatique. Boutons gravés sans nickel.", "care": "Lavage 40 °C.", "notes": "",
        "components": [ { "role": "Corps", "materialId": "m-chanvre", "qty": 1.5 }, { "role": "Fonds de poches", "materialId": "m-popeline", "qty": 0.3 }, { "role": "Cordon chevilles", "materialId": "m-cordon", "qty": 2 }, { "role": "Fil", "materialId": "m-fil", "qty": 0.15 }, { "role": "Étiquette", "materialId": "m-etiquette", "qty": 1 } ] } },
    { "id": "p-desert", "name": "Casquette Désert", "univers": "terre", "type": "casquette", "color": "#b49473", "price": 29, "oldPrice": null, "sizes": ["Unique"], "stock": 30, "image": "", "featured": false, "description": "Casquette 6 panneaux en toile délavée, broderie SKX ton sur ton.",
      "spec": { "status": "Prototype", "madeIn": "Portugal", "workshop": "Atelier Barcelos", "construction": "6 panneaux, visière préformée, bande de propreté intérieure.", "finishing": "Broderie 3D ton sur ton.", "care": "Lavage main.", "notes": "Proto 2 en attente de validation coloris.",
        "components": [ { "role": "Panneaux et visière", "materialId": "m-chanvre", "qty": 0.25 }, { "role": "Bande intérieure", "materialId": "m-popeline", "qty": 0.05 }, { "role": "Fil", "materialId": "m-fil", "qty": 0.05 }, { "role": "Étiquette", "materialId": "m-etiquette", "qty": 1 } ] } },

    { "id": "p-averse", "name": "Coupe-vent Averse", "univers": "pluie", "type": "veste", "color": "#353e44", "price": 99, "oldPrice": null, "sizes": ["S", "M", "L", "XL"], "stock": 15, "image": "", "featured": true, "description": "Nylon recyclé déperlant, capuche cachée dans le col, coutures étanchées.",
      "spec": { "status": "En production", "madeIn": "Italie", "workshop": "Laboratorio Veneto", "construction": "Coutures thermocollées. Capuche escamotable dans le col. Poignets élastiqués.", "finishing": "Logo réfléchissant dos. Zip métal sans nickel.", "care": "Lavage 30 °C. Ne pas repasser.", "notes": "",
        "components": [ { "role": "Extérieur", "materialId": "m-nylon", "qty": 1.9 }, { "role": "Doublure", "materialId": "m-popeline", "qty": 1.2 }, { "role": "Fermeture", "materialId": "m-zip", "qty": 1 }, { "role": "Fil", "materialId": "m-fil", "qty": 0.15 }, { "role": "Étiquette", "materialId": "m-etiquette", "qty": 1 } ] } },
    { "id": "p-orage", "name": "Hoodie Orage", "univers": "pluie", "type": "hoodie", "color": "#24292d", "price": 72, "oldPrice": null, "sizes": ["S", "M", "L", "XL", "XXL"], "stock": 22, "image": "", "featured": false, "description": "Molleton noir orage, logo SKX réfléchissant visible la nuit.",
      "spec": { "status": "En production", "madeIn": "Portugal", "workshop": "Atelier Barcelos", "construction": "Coutures surjetées 4 fils. Capuche double épaisseur.", "finishing": "Transfert réfléchissant dos.", "care": "Lavage 30 °C à l'envers.", "notes": "",
        "components": [ { "role": "Corps et manches", "materialId": "m-molleton400", "qty": 1.7 }, { "role": "Bord-côte", "materialId": "m-ribcote", "qty": 0.25 }, { "role": "Cordon", "materialId": "m-cordon", "qty": 1 }, { "role": "Fil", "materialId": "m-fil", "qty": 0.1 }, { "role": "Étiquette", "materialId": "m-etiquette", "qty": 1 } ] } },
    { "id": "p-bruine", "name": "Casquette Bruine", "univers": "pluie", "type": "casquette", "color": "#4f5d66", "price": 29, "oldPrice": null, "sizes": ["Unique"], "stock": 26, "image": "", "featured": false, "description": "Casquette technique déperlante, visière rigide, réglage arrière.",
      "spec": { "status": "Validé", "madeIn": "Italie", "workshop": "Laboratorio Veneto", "construction": "5 panneaux, coutures étanchées, réglage sangle arrière.", "finishing": "Logo réfléchissant.", "care": "Lavage main.", "notes": "",
        "components": [ { "role": "Panneaux", "materialId": "m-nylon", "qty": 0.3 }, { "role": "Bande intérieure", "materialId": "m-popeline", "qty": 0.05 }, { "role": "Fil", "materialId": "m-fil", "qty": 0.05 }, { "role": "Étiquette", "materialId": "m-etiquette", "qty": 1 } ] } },

    { "id": "p-zenith", "name": "T-shirt Zénith", "univers": "soleil", "type": "tshirt", "color": "#d39a2c", "price": 35, "oldPrice": null, "sizes": ["XS", "S", "M", "L", "XL"], "stock": 45, "image": "", "featured": true, "description": "Coton léger 180 g, coupe boxy, logo SKX gothique dans le dos.",
      "spec": { "status": "En production", "madeIn": "Portugal", "workshop": "Atelier Barcelos", "construction": "Coupe boxy, épaules tombantes. Col bord-côte 1,5 cm.", "finishing": "Sérigraphie à l'eau dos grand format.", "care": "Lavage 30 °C à l'envers.", "notes": "",
        "components": [ { "role": "Corps et manches", "materialId": "m-jersey180", "qty": 1.1 }, { "role": "Col", "materialId": "m-ribcote", "qty": 0.05 }, { "role": "Fil", "materialId": "m-fil", "qty": 0.05 }, { "role": "Étiquette", "materialId": "m-etiquette", "qty": 1 } ] } },
    { "id": "p-aube", "name": "Jogging Aube", "univers": "soleil", "type": "pantalon", "color": "#b8582f", "price": 59, "oldPrice": 69, "sizes": ["S", "M", "L", "XL"], "stock": 20, "image": "", "featured": false, "description": "Jogging en molleton, coupe droite, teinte orange brûlé.",
      "spec": { "status": "Validé", "madeIn": "Portugal", "workshop": "Atelier Barcelos", "construction": "Coupe droite, ceinture élastiquée avec cordon, 2 poches italiennes.", "finishing": "Teinture en pièce.", "care": "Lavage 30 °C.", "notes": "",
        "components": [ { "role": "Corps", "materialId": "m-molleton400", "qty": 1.3 }, { "role": "Ceinture et chevilles", "materialId": "m-ribcote", "qty": 0.2 }, { "role": "Cordon", "materialId": "m-cordon", "qty": 1 }, { "role": "Fil", "materialId": "m-fil", "qty": 0.1 }, { "role": "Étiquette", "materialId": "m-etiquette", "qty": 1 } ] } },
    { "id": "p-solstice", "name": "Casquette Solstice", "univers": "soleil", "type": "casquette", "color": "#d8b04a", "price": 29, "oldPrice": null, "sizes": ["Unique"], "stock": 35, "image": "", "featured": false, "description": "Casquette coton bio, broderie SKX noire.",
      "spec": { "status": "En production", "madeIn": "Portugal", "workshop": "Atelier Barcelos", "construction": "6 panneaux, visière préformée.", "finishing": "Broderie noire.", "care": "Lavage main.", "notes": "",
        "components": [ { "role": "Panneaux et visière", "materialId": "m-jersey240", "qty": 0.3 }, { "role": "Bande intérieure", "materialId": "m-popeline", "qty": 0.05 }, { "role": "Fil", "materialId": "m-fil", "qty": 0.05 }, { "role": "Étiquette", "materialId": "m-etiquette", "qty": 1 } ] } }
  ]
};
