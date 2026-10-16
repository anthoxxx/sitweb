/*
 * SKX — données publiées de la boutique.
 *
 * Ce fichier est ce que TOUS les visiteurs (et tous les collaborateurs) voient.
 * Il est mis à jour depuis l'espace équipe (#/equipe) :
 *   - « Publier en ligne » (envoi direct sur GitHub avec un jeton), ou
 *   - « Télécharger boutique-data.js » puis remplacer ce fichier à la main.
 */
window.SKX_DATA = {
  "version": 4,
  "settings": {
    "shopName": "SKX",
    "slogan": "Ta fierté, ton progrès.",
    "currency": "EUR",
    "contactEmail": "contact-team@skx.fr",
    "paymentLink": "",
    "orderEndpoint": "",
    "freeShippingFrom": 80,
    "shippingPrice": 5.9,
    "announcement": "Livraison offerte dès 80 € — Retours 30 jours — Personnalise ton coloris et ton motif",
    "adminPasswordHash": "",
    "githubRepo": "anthoxxx/sitweb",
    "githubBranch": "claude/nice-clarke-bl2gc9",
    "founded": "2014"
  },
  "team": [],
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
      {
        "cat": "Fibres",
        "text": "Minimum 90 % (en poids) de fibres biologiques ou recyclées certifiées par pièce (GOTS, OCS, GRS)."
      },
      {
        "cat": "Coton",
        "text": "Coton 100 % biologique certifié GOTS. Aucun coton conventionnel."
      },
      {
        "cat": "Synthétiques",
        "text": "Polyester et polyamide uniquement recyclés (certification GRS). Aucune fibre synthétique vierge."
      },
      {
        "cat": "Teinture",
        "text": "Colorants conformes GOTS, sans métaux lourds ni amines aromatiques (azoïques). OEKO-TEX Standard 100 exigé sur le produit fini."
      },
      {
        "cat": "Traitements",
        "text": "Déperlance sans PFC. Aucun traitement biocide ou antibactérien."
      },
      {
        "cat": "Accessoires",
        "text": "Métaux sans nickel, aucun PVC. Étiquettes tissées en coton bio, fil polyester recyclé."
      },
      {
        "cat": "Marquage",
        "text": "Logo SKX toujours brodé en bas à gauche du vêtement, et présent dans le col (étiquette tissée ou transfert) ou sur l'étiquette."
      },
      {
        "cat": "Qualité",
        "text": "Retrait au lavage ≤ 3 % (ISO 5077) · solidité des couleurs au lavage ≥ 4 (ISO 105-C06) · boulochage ≥ 3-4 (ISO 12945-2)."
      },
      {
        "cat": "Fournisseurs",
        "text": "Production en Europe ou bassin méditerranéen. Audit social à jour (Fair Wear, SA8000 ou amfori BSCI)."
      },
      {
        "cat": "Traçabilité",
        "text": "Chaque lot est identifié (fournisseur, n° de lot, date). Les certificats de transaction (TC) sont archivés pour chaque commande."
      },
      {
        "cat": "Emballage",
        "text": "Sachets en papier recyclé ou polybag 100 % recyclé. Aucun plastique vierge."
      }
    ]
  },
  "materials": [
    {
      "id": "m-molleton400",
      "name": "Molleton brossé 400",
      "category": "Tissu",
      "composition": "100 % coton biologique",
      "weight": 400,
      "certifications": [
        "GOTS",
        "OEKO-TEX 100"
      ],
      "supplier": "Tecelagem Norte",
      "origin": "Portugal",
      "price": 14.5,
      "unit": "m",
      "stock": 320,
      "notes": "Laize 180 cm. Envers gratté."
    },
    {
      "id": "m-jersey240",
      "name": "Jersey lourd 240",
      "category": "Tissu",
      "composition": "100 % coton biologique",
      "weight": 240,
      "certifications": [
        "GOTS",
        "OEKO-TEX 100"
      ],
      "supplier": "Tecelagem Norte",
      "origin": "Portugal",
      "price": 9.8,
      "unit": "m",
      "stock": 540,
      "notes": "Teint en pièce. Laize 170 cm tubulaire."
    },
    {
      "id": "m-jersey180",
      "name": "Jersey léger 180",
      "category": "Tissu",
      "composition": "100 % coton biologique",
      "weight": 180,
      "certifications": [
        "GOTS"
      ],
      "supplier": "Ege Organik",
      "origin": "Turquie",
      "price": 7.9,
      "unit": "m",
      "stock": 410,
      "notes": ""
    },
    {
      "id": "m-ribcote",
      "name": "Bord-côte 1×1",
      "category": "Bord-côte",
      "composition": "95 % coton bio, 5 % élasthanne",
      "weight": 280,
      "certifications": [
        "GOTS"
      ],
      "supplier": "Tecelagem Norte",
      "origin": "Portugal",
      "price": 11,
      "unit": "m",
      "stock": 120,
      "notes": "Coloris assortis au corps."
    },
    {
      "id": "m-chanvre",
      "name": "Toile chanvre-coton 320",
      "category": "Tissu",
      "composition": "55 % chanvre, 45 % coton biologique",
      "weight": 320,
      "certifications": [
        "GOTS"
      ],
      "supplier": "Tessitura Alta",
      "origin": "Italie",
      "price": 16.2,
      "unit": "m",
      "stock": 150,
      "notes": "Sergé 2/1. Lavage enzymatique."
    },
    {
      "id": "m-nylon",
      "name": "Nylon recyclé déperlant",
      "category": "Tissu",
      "composition": "100 % polyamide recyclé",
      "weight": 90,
      "certifications": [
        "GRS",
        "bluesign"
      ],
      "supplier": "Tessitura Alta",
      "origin": "Italie",
      "price": 12.4,
      "unit": "m",
      "stock": 200,
      "notes": "Déperlance C0 sans PFC. Colonne d'eau 10 000 mm."
    },
    {
      "id": "m-ouate",
      "name": "Ouate recyclée 100",
      "category": "Rembourrage",
      "composition": "100 % polyester recyclé",
      "weight": 100,
      "certifications": [
        "GRS"
      ],
      "supplier": "Fibres de Lys",
      "origin": "France",
      "price": 4.6,
      "unit": "m",
      "stock": 180,
      "notes": ""
    },
    {
      "id": "m-popeline",
      "name": "Popeline doublure 110",
      "category": "Doublure",
      "composition": "100 % coton biologique",
      "weight": 110,
      "certifications": [
        "GOTS"
      ],
      "supplier": "Ege Organik",
      "origin": "Turquie",
      "price": 5.2,
      "unit": "m",
      "stock": 260,
      "notes": ""
    },
    {
      "id": "m-laine",
      "name": "Fil laine recyclée",
      "category": "Fil à tricoter",
      "composition": "70 % laine recyclée, 30 % polyamide recyclé",
      "weight": null,
      "certifications": [
        "GRS"
      ],
      "supplier": "Filatura Prato",
      "origin": "Italie",
      "price": 38,
      "unit": "kg",
      "stock": 45,
      "notes": "Laine régénérée à Prato, non reteinte."
    },
    {
      "id": "m-fil",
      "name": "Fil à coudre recyclé",
      "category": "Fil",
      "composition": "100 % polyester recyclé",
      "weight": null,
      "certifications": [
        "GRS",
        "OEKO-TEX 100"
      ],
      "supplier": "Linhas Porto",
      "origin": "Portugal",
      "price": 3.1,
      "unit": "bobine",
      "stock": 90,
      "notes": "Tex 40."
    },
    {
      "id": "m-etiquette",
      "name": "Étiquette tissée SKX",
      "category": "Étiquette",
      "composition": "100 % coton biologique",
      "weight": null,
      "certifications": [
        "GOTS"
      ],
      "supplier": "Labelia",
      "origin": "France",
      "price": 0.18,
      "unit": "pièce",
      "stock": 5000,
      "notes": "Logo gothique, fond noir."
    },
    {
      "id": "m-zip",
      "name": "Zip métal sans nickel",
      "category": "Accessoire",
      "composition": "Laiton sans nickel, ruban polyester recyclé",
      "weight": null,
      "certifications": [
        "OEKO-TEX 100"
      ],
      "supplier": "Zippa",
      "origin": "Italie",
      "price": 2.4,
      "unit": "pièce",
      "stock": 300,
      "notes": ""
    },
    {
      "id": "m-cordon",
      "name": "Cordon plat",
      "category": "Accessoire",
      "composition": "100 % coton biologique",
      "weight": null,
      "certifications": [
        "GOTS"
      ],
      "supplier": "Linhas Porto",
      "origin": "Portugal",
      "price": 0.35,
      "unit": "pièce",
      "stock": 800,
      "notes": "Embouts métal sans nickel."
    }
  ],
  "products": [
    {
      "id": "p-sommet",
      "name": "Hoodie Sommet",
      "type": "hoodie",
      "color": "#c9d1d6",
      "price": 69,
      "oldPrice": null,
      "sizes": [
        "XS",
        "S",
        "M",
        "L",
        "XL",
        "2XL",
        "3XL"
      ],
      "stock": 25,
      "image": "",
      "featured": true,
      "description": "Molleton 400 g brossé, capuche doublée, logo SKX brodé en bas à gauche. Coupe oversize.",
      "spec": {
        "status": "En production",
        "madeIn": "Portugal",
        "workshop": "Atelier Barcelos",
        "construction": "Coutures surjetées 4 fils, surpiqûre double aiguille aux emmanchures. Capuche doublée popeline. Poche kangourou.",
        "finishing": "Logo SKX brodé en bas à gauche. Étiquette tissée SKX dans le col. Lavage adoucissant enzymatique.",
        "care": "Lavage 30 °C à l'envers. Pas de sèche-linge.",
        "notes": "",
        "components": [
          {
            "role": "Corps et manches",
            "materialId": "m-molleton400",
            "qty": 1.6
          },
          {
            "role": "Bord-côte",
            "materialId": "m-ribcote",
            "qty": 0.25
          },
          {
            "role": "Doublure capuche",
            "materialId": "m-popeline",
            "qty": 0.35
          },
          {
            "role": "Cordon",
            "materialId": "m-cordon",
            "qty": 1
          },
          {
            "role": "Fil",
            "materialId": "m-fil",
            "qty": 0.1
          },
          {
            "role": "Étiquette",
            "materialId": "m-etiquette",
            "qty": 1
          }
        ]
      },
      "zone": "streetwear",
      "gender": "mixte",
      "colors": [
        {
          "name": "Glacier",
          "hex": "#c9d1d6"
        },
        {
          "name": "Noir",
          "hex": "#18191b"
        },
        {
          "name": "Sable",
          "hex": "#c8b79a"
        },
        {
          "name": "Forêt",
          "hex": "#33433a"
        }
      ],
      "customizable": true
    },
    {
      "id": "p-glacier",
      "name": "Veste Glacier",
      "type": "veste",
      "color": "#4a5862",
      "price": 129,
      "oldPrice": 149,
      "sizes": [
        "XS",
        "S",
        "M",
        "L",
        "XL",
        "2XL",
        "3XL"
      ],
      "stock": 12,
      "image": "",
      "featured": false,
      "description": "Veste matelassée zippée, col montant, déperlante sans PFC.",
      "spec": {
        "status": "Validé",
        "madeIn": "Italie",
        "workshop": "Laboratorio Veneto",
        "construction": "Matelassage losange 6 cm. Coutures étanchées sur épaules. Col montant doublé.",
        "finishing": "Logo SKX brodé en bas à gauche. Étiquette tissée SKX dans le col. Zip métal sans nickel, tirette gravée SKX.",
        "care": "Lavage 30 °C, programme délicat.",
        "notes": "",
        "components": [
          {
            "role": "Extérieur",
            "materialId": "m-nylon",
            "qty": 2
          },
          {
            "role": "Rembourrage",
            "materialId": "m-ouate",
            "qty": 1.8
          },
          {
            "role": "Doublure",
            "materialId": "m-popeline",
            "qty": 1.8
          },
          {
            "role": "Fermeture",
            "materialId": "m-zip",
            "qty": 1
          },
          {
            "role": "Fil",
            "materialId": "m-fil",
            "qty": 0.2
          },
          {
            "role": "Étiquette",
            "materialId": "m-etiquette",
            "qty": 1
          }
        ]
      },
      "zone": "premiere",
      "gender": "homme",
      "colors": [
        {
          "name": "Ardoise",
          "hex": "#4a5862"
        },
        {
          "name": "Noir",
          "hex": "#18191b"
        }
      ],
      "customizable": true
    },
    {
      "id": "p-altitude",
      "name": "Bonnet Altitude",
      "type": "bonnet",
      "color": "#e3e4e1",
      "price": 25,
      "oldPrice": null,
      "sizes": [
        "Unique"
      ],
      "stock": 40,
      "image": "",
      "featured": false,
      "description": "Maille côtelée épaisse en laine recyclée, revers large.",
      "spec": {
        "status": "En production",
        "madeIn": "Italie",
        "workshop": "Maglificio Prato",
        "construction": "Tricot rectiligne côte 2×2, jauge 7. Remaillage main.",
        "finishing": "Étiquette tissée cousue au revers.",
        "care": "Lavage main à froid. Séchage à plat.",
        "notes": "",
        "components": [
          {
            "role": "Maille",
            "materialId": "m-laine",
            "qty": 0.12
          },
          {
            "role": "Étiquette",
            "materialId": "m-etiquette",
            "qty": 1
          }
        ]
      },
      "zone": "accessoires",
      "gender": "mixte",
      "colors": [
        {
          "name": "Craie",
          "hex": "#e3e4e1"
        },
        {
          "name": "Noir",
          "hex": "#18191b"
        },
        {
          "name": "Ocre",
          "hex": "#b8873e"
        }
      ],
      "customizable": false
    },
    {
      "id": "p-argile",
      "name": "T-shirt Argile",
      "type": "tshirt",
      "color": "#9a6a3e",
      "price": 35,
      "oldPrice": null,
      "sizes": [
        "XS",
        "S",
        "M",
        "L",
        "XL",
        "2XL",
        "3XL"
      ],
      "stock": 50,
      "image": "",
      "featured": true,
      "description": "Coton épais 240 g teint en pièce, col côtelé, logo SKX brodé en bas à gauche.",
      "spec": {
        "status": "En production",
        "madeIn": "Portugal",
        "workshop": "Atelier Barcelos",
        "construction": "Corps tubulaire sans couture latérale. Col bord-côte 2 cm, propreté épaules.",
        "finishing": "Logo SKX brodé en bas à gauche. Étiquette tissée SKX dans le col. Sérigraphie à l'eau dos. Teinture en pièce.",
        "care": "Lavage 30 °C à l'envers.",
        "notes": "",
        "components": [
          {
            "role": "Corps et manches",
            "materialId": "m-jersey240",
            "qty": 1.1
          },
          {
            "role": "Col",
            "materialId": "m-ribcote",
            "qty": 0.05
          },
          {
            "role": "Fil",
            "materialId": "m-fil",
            "qty": 0.05
          },
          {
            "role": "Étiquette",
            "materialId": "m-etiquette",
            "qty": 1
          }
        ]
      },
      "zone": "streetwear",
      "gender": "mixte",
      "colors": [
        {
          "name": "Argile",
          "hex": "#9a6a3e"
        },
        {
          "name": "Craie",
          "hex": "#e8e4da"
        },
        {
          "name": "Noir",
          "hex": "#18191b"
        },
        {
          "name": "Olive",
          "hex": "#5d6345"
        }
      ],
      "customizable": true
    },
    {
      "id": "p-racine",
      "name": "Cargo Racine",
      "type": "pantalon",
      "color": "#5a4232",
      "price": 79,
      "oldPrice": null,
      "sizes": [
        "XS",
        "S",
        "M",
        "L",
        "XL",
        "2XL",
        "3XL"
      ],
      "stock": 18,
      "image": "",
      "featured": false,
      "description": "Pantalon cargo en toile chanvre-coton, 6 poches, bas resserrables.",
      "spec": {
        "status": "Validé",
        "madeIn": "Italie",
        "workshop": "Laboratorio Veneto",
        "construction": "Coutures rabattues double aiguille. 6 poches dont 2 soufflets. Ceinture élastiquée arrière.",
        "finishing": "Lavage enzymatique. Boutons gravés sans nickel.",
        "care": "Lavage 40 °C.",
        "notes": "",
        "components": [
          {
            "role": "Corps",
            "materialId": "m-chanvre",
            "qty": 1.5
          },
          {
            "role": "Fonds de poches",
            "materialId": "m-popeline",
            "qty": 0.3
          },
          {
            "role": "Cordon chevilles",
            "materialId": "m-cordon",
            "qty": 2
          },
          {
            "role": "Fil",
            "materialId": "m-fil",
            "qty": 0.15
          },
          {
            "role": "Étiquette",
            "materialId": "m-etiquette",
            "qty": 1
          }
        ]
      },
      "zone": "streetwear",
      "gender": "homme",
      "colors": [
        {
          "name": "Terre",
          "hex": "#5a4232"
        },
        {
          "name": "Noir",
          "hex": "#18191b"
        },
        {
          "name": "Kaki",
          "hex": "#5d6345"
        }
      ],
      "customizable": false
    },
    {
      "id": "p-desert",
      "name": "Casquette Désert",
      "type": "casquette",
      "color": "#b49473",
      "price": 29,
      "oldPrice": null,
      "sizes": [
        "Unique"
      ],
      "stock": 30,
      "image": "",
      "featured": false,
      "description": "Casquette 6 panneaux en toile délavée, broderie SKX ton sur ton.",
      "spec": {
        "status": "Prototype",
        "madeIn": "Portugal",
        "workshop": "Atelier Barcelos",
        "construction": "6 panneaux, visière préformée, bande de propreté intérieure.",
        "finishing": "Broderie 3D ton sur ton.",
        "care": "Lavage main.",
        "notes": "Proto 2 en attente de validation coloris.",
        "components": [
          {
            "role": "Panneaux et visière",
            "materialId": "m-chanvre",
            "qty": 0.25
          },
          {
            "role": "Bande intérieure",
            "materialId": "m-popeline",
            "qty": 0.05
          },
          {
            "role": "Fil",
            "materialId": "m-fil",
            "qty": 0.05
          },
          {
            "role": "Étiquette",
            "materialId": "m-etiquette",
            "qty": 1
          }
        ]
      },
      "zone": "accessoires",
      "gender": "mixte",
      "colors": [
        {
          "name": "Sable",
          "hex": "#b49473"
        },
        {
          "name": "Noir",
          "hex": "#18191b"
        }
      ],
      "customizable": true
    },
    {
      "id": "p-averse",
      "name": "Coupe-vent Averse",
      "type": "veste",
      "color": "#353e44",
      "price": 99,
      "oldPrice": null,
      "sizes": [
        "XS",
        "S",
        "M",
        "L",
        "XL",
        "2XL",
        "3XL"
      ],
      "stock": 15,
      "image": "",
      "featured": true,
      "description": "Nylon recyclé déperlant, capuche cachée dans le col, coutures étanchées.",
      "spec": {
        "status": "En production",
        "madeIn": "Italie",
        "workshop": "Laboratorio Veneto",
        "construction": "Coutures thermocollées. Capuche escamotable dans le col. Poignets élastiqués.",
        "finishing": "Logo SKX brodé en bas à gauche. Étiquette tissée SKX dans le col. Logo réfléchissant dos. Zip métal sans nickel.",
        "care": "Lavage 30 °C. Ne pas repasser.",
        "notes": "",
        "components": [
          {
            "role": "Extérieur",
            "materialId": "m-nylon",
            "qty": 1.9
          },
          {
            "role": "Doublure",
            "materialId": "m-popeline",
            "qty": 1.2
          },
          {
            "role": "Fermeture",
            "materialId": "m-zip",
            "qty": 1
          },
          {
            "role": "Fil",
            "materialId": "m-fil",
            "qty": 0.15
          },
          {
            "role": "Étiquette",
            "materialId": "m-etiquette",
            "qty": 1
          }
        ]
      },
      "zone": "sport",
      "gender": "mixte",
      "colors": [
        {
          "name": "Orage",
          "hex": "#353e44"
        },
        {
          "name": "Noir",
          "hex": "#18191b"
        },
        {
          "name": "Glacier",
          "hex": "#9fb3c2"
        }
      ],
      "customizable": true
    },
    {
      "id": "p-orage",
      "name": "Hoodie Orage",
      "type": "hoodie",
      "color": "#24292d",
      "price": 72,
      "oldPrice": null,
      "sizes": [
        "XS",
        "S",
        "M",
        "L",
        "XL",
        "2XL",
        "3XL"
      ],
      "stock": 22,
      "image": "",
      "featured": false,
      "description": "Molleton noir orage, logo SKX brodé en bas à gauche, transfert réfléchissant au dos.",
      "spec": {
        "status": "En production",
        "madeIn": "Portugal",
        "workshop": "Atelier Barcelos",
        "construction": "Coutures surjetées 4 fils. Capuche double épaisseur.",
        "finishing": "Logo SKX brodé en bas à gauche. Étiquette tissée SKX dans le col. Transfert réfléchissant dos.",
        "care": "Lavage 30 °C à l'envers.",
        "notes": "",
        "components": [
          {
            "role": "Corps et manches",
            "materialId": "m-molleton400",
            "qty": 1.7
          },
          {
            "role": "Bord-côte",
            "materialId": "m-ribcote",
            "qty": 0.25
          },
          {
            "role": "Cordon",
            "materialId": "m-cordon",
            "qty": 1
          },
          {
            "role": "Fil",
            "materialId": "m-fil",
            "qty": 0.1
          },
          {
            "role": "Étiquette",
            "materialId": "m-etiquette",
            "qty": 1
          }
        ]
      },
      "zone": "streetwear",
      "gender": "mixte",
      "colors": [
        {
          "name": "Orage",
          "hex": "#24292d"
        },
        {
          "name": "Ardoise",
          "hex": "#4a5862"
        }
      ],
      "customizable": true
    },
    {
      "id": "p-bruine",
      "name": "Casquette Bruine",
      "type": "casquette",
      "color": "#4f5d66",
      "price": 29,
      "oldPrice": null,
      "sizes": [
        "Unique"
      ],
      "stock": 26,
      "image": "",
      "featured": false,
      "description": "Casquette technique déperlante, visière rigide, réglage arrière.",
      "spec": {
        "status": "Validé",
        "madeIn": "Italie",
        "workshop": "Laboratorio Veneto",
        "construction": "5 panneaux, coutures étanchées, réglage sangle arrière.",
        "finishing": "Logo réfléchissant.",
        "care": "Lavage main.",
        "notes": "",
        "components": [
          {
            "role": "Panneaux",
            "materialId": "m-nylon",
            "qty": 0.3
          },
          {
            "role": "Bande intérieure",
            "materialId": "m-popeline",
            "qty": 0.05
          },
          {
            "role": "Fil",
            "materialId": "m-fil",
            "qty": 0.05
          },
          {
            "role": "Étiquette",
            "materialId": "m-etiquette",
            "qty": 1
          }
        ]
      },
      "zone": "accessoires",
      "gender": "mixte",
      "colors": [
        {
          "name": "Brume",
          "hex": "#4f5d66"
        },
        {
          "name": "Noir",
          "hex": "#18191b"
        }
      ],
      "customizable": true
    },
    {
      "id": "p-zenith",
      "name": "T-shirt Zénith",
      "type": "tshirt",
      "color": "#d39a2c",
      "price": 35,
      "oldPrice": null,
      "sizes": [
        "XS",
        "S",
        "M",
        "L",
        "XL",
        "2XL",
        "3XL"
      ],
      "stock": 45,
      "image": "",
      "featured": false,
      "description": "Coton léger 180 g, coupe boxy, grand motif gothique sérigraphié dans le dos.",
      "spec": {
        "status": "En production",
        "madeIn": "Portugal",
        "workshop": "Atelier Barcelos",
        "construction": "Coupe boxy, épaules tombantes. Col bord-côte 1,5 cm.",
        "finishing": "Logo SKX brodé en bas à gauche. Étiquette tissée SKX dans le col. Sérigraphie à l'eau dos grand format.",
        "care": "Lavage 30 °C à l'envers.",
        "notes": "",
        "components": [
          {
            "role": "Corps et manches",
            "materialId": "m-jersey180",
            "qty": 1.1
          },
          {
            "role": "Col",
            "materialId": "m-ribcote",
            "qty": 0.05
          },
          {
            "role": "Fil",
            "materialId": "m-fil",
            "qty": 0.05
          },
          {
            "role": "Étiquette",
            "materialId": "m-etiquette",
            "qty": 1
          }
        ]
      },
      "zone": "cool",
      "gender": "femme",
      "colors": [
        {
          "name": "Zénith",
          "hex": "#d39a2c"
        },
        {
          "name": "Craie",
          "hex": "#e8e4da"
        },
        {
          "name": "Noir",
          "hex": "#18191b"
        }
      ],
      "customizable": true
    },
    {
      "id": "p-aube",
      "name": "Jogging Aube",
      "type": "pantalon",
      "color": "#b8582f",
      "price": 59,
      "oldPrice": 69,
      "sizes": [
        "XS",
        "S",
        "M",
        "L",
        "XL",
        "2XL",
        "3XL"
      ],
      "stock": 20,
      "image": "",
      "featured": true,
      "description": "Jogging en molleton, coupe droite, teinte orange brûlé.",
      "spec": {
        "status": "Validé",
        "madeIn": "Portugal",
        "workshop": "Atelier Barcelos",
        "construction": "Coupe droite, ceinture élastiquée avec cordon, 2 poches italiennes.",
        "finishing": "Teinture en pièce.",
        "care": "Lavage 30 °C.",
        "notes": "",
        "components": [
          {
            "role": "Corps",
            "materialId": "m-molleton400",
            "qty": 1.3
          },
          {
            "role": "Ceinture et chevilles",
            "materialId": "m-ribcote",
            "qty": 0.2
          },
          {
            "role": "Cordon",
            "materialId": "m-cordon",
            "qty": 1
          },
          {
            "role": "Fil",
            "materialId": "m-fil",
            "qty": 0.1
          },
          {
            "role": "Étiquette",
            "materialId": "m-etiquette",
            "qty": 1
          }
        ]
      },
      "zone": "sport",
      "gender": "femme",
      "colors": [
        {
          "name": "Aube",
          "hex": "#b8582f"
        },
        {
          "name": "Noir",
          "hex": "#18191b"
        },
        {
          "name": "Gris chiné",
          "hex": "#8d8d88"
        }
      ],
      "customizable": false
    },
    {
      "id": "p-solstice",
      "name": "Casquette Solstice",
      "type": "casquette",
      "color": "#d8b04a",
      "price": 29,
      "oldPrice": null,
      "sizes": [
        "Unique"
      ],
      "stock": 35,
      "image": "",
      "featured": false,
      "description": "Casquette coton bio, broderie SKX noire.",
      "spec": {
        "status": "En production",
        "madeIn": "Portugal",
        "workshop": "Atelier Barcelos",
        "construction": "6 panneaux, visière préformée.",
        "finishing": "Broderie noire.",
        "care": "Lavage main.",
        "notes": "",
        "components": [
          {
            "role": "Panneaux et visière",
            "materialId": "m-jersey240",
            "qty": 0.3
          },
          {
            "role": "Bande intérieure",
            "materialId": "m-popeline",
            "qty": 0.05
          },
          {
            "role": "Fil",
            "materialId": "m-fil",
            "qty": 0.05
          },
          {
            "role": "Étiquette",
            "materialId": "m-etiquette",
            "qty": 1
          }
        ]
      },
      "zone": "accessoires",
      "gender": "mixte",
      "colors": [
        {
          "name": "Solstice",
          "hex": "#d8b04a"
        },
        {
          "name": "Noir",
          "hex": "#18191b"
        }
      ],
      "customizable": true
    },
    {
      "id": "p-cime",
      "name": "Doudoune Cime",
      "type": "veste",
      "color": "#1c1f22",
      "price": 189,
      "oldPrice": null,
      "sizes": [
        "XS",
        "S",
        "M",
        "L",
        "XL",
        "2XL",
        "3XL"
      ],
      "stock": 8,
      "image": "",
      "featured": true,
      "description": "Doudoune longue matelassée, col montant, zip métal. Série limitée numérotée.",
      "spec": {
        "status": "Validé",
        "madeIn": "Italie",
        "workshop": "Laboratorio Veneto",
        "construction": "Matelassage losange 6 cm. Coutures étanchées sur épaules. Col montant doublé.",
        "finishing": "Logo SKX brodé en bas à gauche. Étiquette tissée SKX dans le col. Zip métal sans nickel, tirette gravée SKX.",
        "care": "Lavage 30 °C, programme délicat.",
        "notes": "",
        "components": [
          {
            "role": "Extérieur",
            "materialId": "m-nylon",
            "qty": 2.6
          },
          {
            "role": "Rembourrage",
            "materialId": "m-ouate",
            "qty": 2.4
          },
          {
            "role": "Doublure",
            "materialId": "m-popeline",
            "qty": 2.4
          },
          {
            "role": "Fermeture",
            "materialId": "m-zip",
            "qty": 1
          },
          {
            "role": "Fil",
            "materialId": "m-fil",
            "qty": 0.2
          },
          {
            "role": "Étiquette",
            "materialId": "m-etiquette",
            "qty": 1
          }
        ]
      },
      "zone": "premiere",
      "gender": "femme",
      "colors": [
        {
          "name": "Nuit",
          "hex": "#1c1f22"
        },
        {
          "name": "Sable",
          "hex": "#c8b79a"
        }
      ],
      "customizable": true
    },
    {
      "id": "p-crete",
      "name": "Hoodie Crête",
      "type": "hoodie",
      "color": "#3b4d3f",
      "price": 75,
      "oldPrice": null,
      "sizes": [
        "XS",
        "S",
        "M",
        "L",
        "XL",
        "2XL",
        "3XL"
      ],
      "stock": 16,
      "image": "",
      "featured": true,
      "description": "Hoodie technique zippé, coupe athlétique, poignets à passe-pouce.",
      "spec": {
        "status": "En production",
        "madeIn": "Portugal",
        "workshop": "Atelier Barcelos",
        "construction": "Coutures surjetées 4 fils. Capuche double épaisseur.",
        "finishing": "Logo SKX brodé en bas à gauche. Étiquette tissée SKX dans le col. Transfert réfléchissant dos.",
        "care": "Lavage 30 °C à l'envers.",
        "notes": "",
        "components": [
          {
            "role": "Corps et manches",
            "materialId": "m-molleton400",
            "qty": 1.7
          },
          {
            "role": "Bord-côte",
            "materialId": "m-ribcote",
            "qty": 0.25
          },
          {
            "role": "Cordon",
            "materialId": "m-cordon",
            "qty": 1
          },
          {
            "role": "Fil",
            "materialId": "m-fil",
            "qty": 0.1
          },
          {
            "role": "Étiquette",
            "materialId": "m-etiquette",
            "qty": 1
          }
        ]
      },
      "zone": "sport",
      "gender": "homme",
      "colors": [
        {
          "name": "Forêt",
          "hex": "#3b4d3f"
        },
        {
          "name": "Noir",
          "hex": "#18191b"
        },
        {
          "name": "Glacier",
          "hex": "#9fb3c2"
        }
      ],
      "customizable": true
    },
    {
      "id": "p-mini-sommet",
      "name": "Hoodie Mini Sommet",
      "type": "hoodie",
      "color": "#9fb3c2",
      "price": 45,
      "oldPrice": null,
      "sizes": [
        "XS",
        "S",
        "M",
        "L",
        "XL",
        "2XL",
        "3XL"
      ],
      "stock": 20,
      "image": "",
      "featured": false,
      "description": "Le Hoodie Sommet en version enfant. Même molleton 400 g, capuche doublée.",
      "spec": {
        "status": "En production",
        "madeIn": "Portugal",
        "workshop": "Atelier Barcelos",
        "construction": "Coutures surjetées 4 fils, surpiqûre double aiguille aux emmanchures. Capuche doublée popeline. Poche kangourou.",
        "finishing": "Logo SKX brodé en bas à gauche. Étiquette tissée SKX dans le col. Lavage adoucissant enzymatique.",
        "care": "Lavage 30 °C à l'envers. Pas de sèche-linge.",
        "notes": "",
        "components": [
          {
            "role": "Corps et manches",
            "materialId": "m-molleton400",
            "qty": 0.9
          },
          {
            "role": "Bord-côte",
            "materialId": "m-ribcote",
            "qty": 0.25
          },
          {
            "role": "Doublure capuche",
            "materialId": "m-popeline",
            "qty": 0.2
          },
          {
            "role": "Cordon",
            "materialId": "m-cordon",
            "qty": 1
          },
          {
            "role": "Fil",
            "materialId": "m-fil",
            "qty": 0.1
          },
          {
            "role": "Étiquette",
            "materialId": "m-etiquette",
            "qty": 1
          }
        ]
      },
      "zone": "cool",
      "gender": "enfant",
      "colors": [
        {
          "name": "Glacier",
          "hex": "#9fb3c2"
        },
        {
          "name": "Sable",
          "hex": "#c8b79a"
        },
        {
          "name": "Rouge sommet",
          "hex": "#9b3b2e"
        }
      ],
      "customizable": true
    },
    {
      "id": "p-mini-argile",
      "name": "T-shirt Mini Argile",
      "type": "tshirt",
      "color": "#b07a48",
      "price": 22,
      "oldPrice": null,
      "sizes": [
        "XS",
        "S",
        "M",
        "L",
        "XL",
        "2XL",
        "3XL"
      ],
      "stock": 30,
      "image": "",
      "featured": false,
      "description": "Le tee lourd SKX taillé pour les enfants. Coton bio 240 g.",
      "spec": {
        "status": "En production",
        "madeIn": "Portugal",
        "workshop": "Atelier Barcelos",
        "construction": "Corps tubulaire sans couture latérale. Col bord-côte 2 cm, propreté épaules.",
        "finishing": "Logo SKX brodé en bas à gauche. Étiquette tissée SKX dans le col. Sérigraphie à l'eau dos. Teinture en pièce.",
        "care": "Lavage 30 °C à l'envers.",
        "notes": "",
        "components": [
          {
            "role": "Corps et manches",
            "materialId": "m-jersey240",
            "qty": 0.6
          },
          {
            "role": "Col",
            "materialId": "m-ribcote",
            "qty": 0.05
          },
          {
            "role": "Fil",
            "materialId": "m-fil",
            "qty": 0.05
          },
          {
            "role": "Étiquette",
            "materialId": "m-etiquette",
            "qty": 1
          }
        ]
      },
      "zone": "streetwear",
      "gender": "enfant",
      "colors": [
        {
          "name": "Argile",
          "hex": "#b07a48"
        },
        {
          "name": "Craie",
          "hex": "#e8e4da"
        },
        {
          "name": "Noir",
          "hex": "#18191b"
        }
      ],
      "customizable": true
    },
    {
      "id": "p-redescente",
      "name": "T-shirt Redescente",
      "type": "tshirt",
      "color": "#8a8f7a",
      "price": 35,
      "oldPrice": null,
      "sizes": [
        "XS",
        "S",
        "M",
        "L",
        "XL",
        "2XL",
        "3XL"
      ],
      "stock": 40,
      "image": "",
      "featured": false,
      "description": "Tee boxy délavé, sérigraphie montagne au dos.",
      "spec": {
        "status": "En production",
        "madeIn": "Portugal",
        "workshop": "Atelier Barcelos",
        "construction": "Coupe boxy, épaules tombantes. Col bord-côte 1,5 cm.",
        "finishing": "Logo SKX brodé en bas à gauche. Étiquette tissée SKX dans le col. Sérigraphie à l'eau dos grand format.",
        "care": "Lavage 30 °C à l'envers.",
        "notes": "",
        "components": [
          {
            "role": "Corps et manches",
            "materialId": "m-jersey180",
            "qty": 1.1
          },
          {
            "role": "Col",
            "materialId": "m-ribcote",
            "qty": 0.05
          },
          {
            "role": "Fil",
            "materialId": "m-fil",
            "qty": 0.05
          },
          {
            "role": "Étiquette",
            "materialId": "m-etiquette",
            "qty": 1
          }
        ]
      },
      "zone": "cool",
      "gender": "homme",
      "colors": [
        {
          "name": "Lichen",
          "hex": "#8a8f7a"
        },
        {
          "name": "Craie",
          "hex": "#e8e4da"
        },
        {
          "name": "Noir",
          "hex": "#18191b"
        }
      ],
      "customizable": true
    }
  ],
  "zones": {
    "streetwear": {
      "name": "Streetwear",
      "tagline": "La ville, vue d'en haut.",
      "description": "Hoodies épais, tees lourds, cargos. Les pièces de tous les jours, coupées large et faites pour durer.",
      "metric": "Camp de base · 1 200 m"
    },
    "sport": {
      "name": "Sport",
      "tagline": "Souffle court, jambes lourdes.",
      "description": "Joggings, coupe-vent et matières qui respirent. Pour courir, grimper, transpirer.",
      "metric": "Col · 2 400 m"
    },
    "premiere": {
      "name": "1ère classe",
      "tagline": "Le sommet, sans compromis.",
      "description": "Les pièces les plus abouties : matières nobles, finitions à la main, séries limitées.",
      "metric": "Sommet · 4 808 m"
    },
    "accessoires": {
      "name": "Accessoires",
      "tagline": "Ce qu'on emporte au refuge.",
      "description": "Casquettes, bonnets, sacs et petites pièces. Le détail qui signe la tenue.",
      "metric": "Refuge · 2 900 m"
    },
    "cool": {
      "name": "Cool",
      "tagline": "Redescendre, tranquille.",
      "description": "Coupes relax, couleurs passées, pièces pour ne rien faire. L'après-ski, toute l'année.",
      "metric": "Lac d'altitude · 1 900 m"
    }
  },
  "history": {
    "intro": "De la première idée en 2014 au site d'aujourd'hui.",
    "slides": [
      {
        "year": "2014",
        "title": "L'idée",
        "text": "SKX est pensé en 2014. Un nom, un logo gothique, et l'envie de faire des vêtements qui ont du caractère."
      },
      {
        "year": "Les débuts",
        "title": "Le logo",
        "text": "Les lettres SKX prennent leur forme définitive : un tracé gothique en double contour, devenu la signature de la marque."
      },
      {
        "year": "La montagne",
        "title": "L'esprit SKX",
        "text": "La montagne devient l'univers de la marque : du camp de base au sommet, chaque zone de la boutique est une étape de l'ascension."
      },
      {
        "year": "Les matières",
        "title": "Un cahier des charges",
        "text": "Coton biologique, chanvre, fibres recyclées et ateliers européens : chaque pièce suit des règles écrites et contrôlées."
      },
      {
        "year": "2026",
        "title": "Le site",
        "text": "La boutique en ligne ouvre avec cinq zones, des collections Homme, Femme et Enfants, et la radio en fond."
      },
      {
        "year": "Demain",
        "title": "La suite",
        "text": "Nouvelles collections, collaborations et premières séries 1ère classe. L'ascension continue."
      }
    ]
  },
  "people": [
    {
      "id": "pp-karim",
      "name": "Karim",
      "title": "Fondateur",
      "bio": "Fondateur de la marque. Passionné de sport, de culture et d'aventures en tout genre.",
      "quote": "Ce qui me motive ? Le besoin du style, en créant des pièces qui suivent les aventures de chacun.",
      "photo": "",
      "since": "",
      "avatar": {
        "hair": "court",
        "facial": "barbe",
        "acc": "casquette",
        "top": "#33433a",
        "bg": "sport",
        "skin": "#cbc3b4",
        "hairColor": "#1b1a19"
      }
    },
    {
      "id": "pp-anthony",
      "name": "Anthony",
      "title": "Co-gestionnaire · Designer",
      "bio": "Co-gestionnaire et designer de la marque. Passionné d'informatique et de belles autos.",
      "quote": "Ce qui est essentiel, à mon avis, c'est d'imaginer le développement sous tous ses angles.",
      "photo": "",
      "since": "",
      "avatar": {
        "hair": "meche",
        "facial": "aucune",
        "acc": "lunettes",
        "top": "#1c1f22",
        "bg": "premiere",
        "skin": "#cbc3b4",
        "hairColor": "#2a211b"
      }
    },
    {
      "id": "pp-fabio",
      "name": "Fabio",
      "title": "Co-gestionnaire du site",
      "bio": "Co-gestionnaire du site, côté technique et expérience client.",
      "quote": "Je veille à ce que ton expérience sur le site soit aussi fluide que possible.",
      "photo": "",
      "since": "",
      "avatar": {
        "hair": "boucle",
        "facial": "moustache",
        "acc": "casque",
        "top": "#4a5862",
        "bg": "streetwear",
        "skin": "#cbc3b4",
        "hairColor": "#151413"
      }
    }
  ],
  "designs": [
    {
      "id": "none",
      "name": "Uni",
      "price": 0,
      "enabled": true,
      "image": ""
    },
    {
      "id": "crete",
      "name": "Crête",
      "price": 5,
      "enabled": true,
      "image": ""
    },
    {
      "id": "gothique",
      "name": "SKX gothique",
      "price": 5,
      "enabled": true,
      "image": ""
    },
    {
      "id": "boussole",
      "name": "Boussole",
      "price": 5,
      "enabled": true,
      "image": ""
    },
    {
      "id": "altitude",
      "name": "4 808 m",
      "price": 5,
      "enabled": true,
      "image": ""
    },
    {
      "id": "slogan",
      "name": "Ta fierté, ton progrès",
      "price": 7,
      "enabled": true,
      "image": ""
    }
  ],
  "promos": {
    "maxCode": 70,
    "maxSale": 50,
    "codes": [],
    "sales": [],
    "volume": {
      "enabled": false,
      "tiers": [
        {
          "qty": 2,
          "percent": 5
        },
        {
          "qty": 3,
          "percent": 10
        }
      ]
    },
    "giftWrap": {
      "enabled": true,
      "price": 3
    }
  }
};
