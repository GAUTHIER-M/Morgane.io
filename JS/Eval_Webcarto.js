var map = L.map('map');
var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osmAttrib = 'Map data © OpenStreetMap contributors';
var osm = new L.TileLayer(osmUrl, { attribution: osmAttrib }).addTo(map);
map.setView([45.719, 4.918], 17);

// Ajout du contrôle d'échelle avec uniquement les unités métriques
L.control.scale({
    position: 'bottomright', // Position en bas à droite
    imperial: false, // Désactiver les unités impériales
    metric: true // Activer les unités métriques
}).addTo(map);

// Groupes de calques
var arrondissements_lyon = L.layerGroup(); // Calque pour les arrondissements
var sytral = L.layerGroup(); // Calque pour les lignes de transport

// Fonction pour déterminer le style des arrondissements
function getColor(nomreduit) {
    switch (nomreduit) {
        case 'Lyon 1': return 'rgba(248, 15, 15, 0.25)'; // Rouge
        case 'Lyon 2': return 'rgba(0, 255, 0, 0.25)'; // Vert
        case 'Lyon 3': return 'rgba(0, 0, 255, 0.25)'; // Bleu
        case 'Lyon 4': return 'rgba(255, 255, 0, 0.25)'; // Jaune
        case 'Lyon 5': return 'rgba(255, 0, 255, 0.25)'; // Magenta
        case 'Lyon 6': return 'rgba(0, 255, 255, 0.25)'; // Cyan
        case 'Lyon 7': return 'rgba(255, 166, 0, 0.25)'; // Orange
        case 'Lyon 8': return 'rgba(128, 0, 128, 0.25)'; // Violet
        case 'Lyon 9': return 'rgba(165, 42, 42, 0.25)'; // Marron
        default: return 'rgb(220, 220, 220)'; // Gris par défaut
    }
}

// Fonction de style pour le contour des arrondissements
function style(feature) {
    return {
        fillColor: getColor(feature.properties.nomreduit),
        weight: 2,
        opacity: 1,
        color: 'black',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

// Fonction pour obtenir la couleur des lignes de transport
function getLineColor(ligne) {
    switch (ligne) {
        case 'A': return 'rgb(193, 28, 132)';
        case 'B': return 'rgb(28, 44, 193)';
        case 'C': return 'rgb(251, 206, 7)';
        case 'D': return 'rgb(49, 114, 23)';
        case 'F1': return 'rgb(253, 9, 9)';
        case 'F2': return 'rgb(4, 226, 251)';
        default: return 'black'; // Couleur par défaut si la ligne n'est pas reconnue
    }
}

// Style des lignes de transport
function style_2(feature) {
    return {
        color: getLineColor(feature.properties.ligne), // Couleur des lignes
        weight: 4, // Largeur des lignes
        opacity: 1
    };
}

// Fonction pour réinitialiser les styles de la légende
function resetLegendHighlight() {
    var legendItems = document.querySelectorAll('.legend div');
    legendItems.forEach(function(item) {
        item.classList.remove('highlight');
    });
}

// Fonction pour mettre en surbrillance la légende correspondante
function highlightLegend(lineId) {
    // Réinitialiser les styles de toutes les légendes
    resetLegendHighlight();

    // Mettre en surbrillance la légende correspondante
    var legendItem = document.getElementById('legend-line-' + lineId);
    if (legendItem) {
        legendItem.classList.add('highlight');
    }
}

// Fonction pour afficher ou masquer la légende
function toggleLegend(show) {
    var legendDiv = document.getElementById("legend");
    if (show) {
        legendDiv.style.display = 'block';
    } else {
        legendDiv.style.display = 'none';
    }
}

// Ajout des données GeoJSON pour les arrondissements
var arrondissements_data = L.geoJSON(arrondissements, {
    style: style,
    onEachFeature: function (feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: zoomToFeature
        });
    }
}).addTo(arrondissements_lyon); // Ajoute les données au calque 'arrondissements_lyon'

// Ajout des données GeoJSON pour les lignes de transport + interaction pour les lignes
var sytral_data = L.geoJSON(transports, {
    style: style_2,
    onEachFeature: function (feature, layer) {
        layer.on({
            click: function (e) {       
                var info_div = document.getElementById("info");
                info_div.innerHTML = "Ligne : " + feature.properties.ligne + "<br>" +
                    "Nom Tracé : " + feature.properties.nom_trace;

                // Mettre en surbrillance la légende correspondante
                highlightLegend(feature.properties.ligne);
            }
        });
    }
}).addTo(sytral); // Ajoute les données au calque 'sytral'

// Ajout des calques à la carte
arrondissements_lyon.addTo(map); // Ajoute les arrondissements en premier
sytral.addTo(map); // Ajoute les lignes de transport après

// Assurez-vous que la couche des lignes de transport est au-dessus
sytral.eachLayer(function (layer) {
    layer.bringToFront();
});

// Contrôle des calques
var baseLayers = {
    "OpenStreetMap": osm
};
var overlays = {
    "Lignes de transports": sytral,
    "Arrondissements de Lyon": arrondissements_lyon
};

var layersControl = L.control.layers(baseLayers, overlays).addTo(map);

// Ajouter un événement pour suivre les changements de calque
map.on('overlayadd', function(eventLayer) {
    if (eventLayer.name === 'Lignes de transports') {
        toggleLegend(true);
    }
});

map.on('overlayremove', function(eventLayer) {
    if (eventLayer.name === 'Lignes de transports') {
        toggleLegend(false);
    }
});

// Fonctions d'interaction pour les arrondissements
function highlightFeature(e) {
    var layer = e.target;
    layer.setStyle({
        weight: 2,
        color: '#0000FF',
        dashArray: '',
        fillOpacity: 0.7
    });

    var color = getColor(layer.feature.properties.nomreduit);
    var info_div = document.getElementById("info");
    info_div.innerHTML = `
        Nom : ${layer.feature.properties.nom} 
        <div style="display: inline-block; width: 20px; height: 20px; background-color: ${color}; margin-left: 10px;"></div><br>
        INSEE : ${layer.feature.properties.insee}
    `;
}

function resetHighlight(e) {
    arrondissements_data.resetStyle(e.target);
}

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}

// Ajustement automatique du zoom pour englober tous les arrondissements
map.fitBounds(arrondissements_data.getBounds());

// Création de la légende dans le div avec id 'legend' (à côté de la carte)
function createLegend() {
    var legendDiv = document.getElementById("legend");
    legendDiv.innerHTML = "<h4>Lignes de transport</h4>";
    legendDiv.innerHTML += '<div id="legend-line-A"><i style="background:rgb(193, 28, 132)"></i> Metro A</div>';
    legendDiv.innerHTML += '<div id="legend-line-B"><i style="background:rgb(28, 44, 193)"></i> Metro B</div>';
    legendDiv.innerHTML += '<div id="legend-line-C"><i style="background:rgb(251, 206, 7)"></i> Metro C</div>';
    legendDiv.innerHTML += '<div id="legend-line-D"><i style="background:rgb(49, 114, 23)"></i> Metro D</div>';
    legendDiv.innerHTML += '<div id="legend-line-F1"><i style="background:rgb(253, 9, 9)"></i> Funiculaire F1</div>';
    legendDiv.innerHTML += '<div id="legend-line-F2"><i style="background:rgb(4, 226, 251)"></i> Funiculaire F2</div>';
}

// Appel de la fonction pour générer la légende
createLegend();

// Définir des icônes personnalisées pour différents types d'équipements
var icons = {
    "Terrain de football": L.icon({
        iconUrl: "img/foot.png", // Chemin de l'image pour le gymnase
        iconSize: [50, 50], // Taille de l'icône (ajustez selon vos besoins)
        iconAnchor: [16, 32], // Point d'ancrage (au centre et en bas de l'icône)
        popupAnchor: [0, -32] // Point d'ancrage du popup (au-dessus de l'icône)
    }),
    "Terrain mixte": L.icon({
        iconUrl: "img/foot.png",
        iconSize: [50, 50],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Salle ou terrain de jorkyball": L.icon({
        iconUrl: "img/foot.png", 
        iconSize: [50, 50], 
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Salle multisports (gymnase)": L.icon({
        iconUrl: "img/gymnase.png",
        iconSize: [50, 50],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Plateau EPS/Multisports/city-stades": L.icon({
        iconUrl: "img/EPS.png",
        iconSize: [50, 50],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "But/panier isolé de sport collectif": L.icon({
        iconUrl: "img/EPS.png",
        iconSize: [50, 50],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Salle de danse": L.icon({
        iconUrl: "img/danse.png",
        iconSize: [50, 50],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Terrain de handball": L.icon({
        iconUrl: "img/hand.png",
        iconSize: [50, 50],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Salle de handball": L.icon({
        iconUrl: "img/hand.png",
        iconSize: [50, 50],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Terrain de boules": L.icon({
        iconUrl: "img/boule.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Terrain de basket-ball": L.icon({
        iconUrl: "img/ballon_basket.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Salle de basket": L.icon({
        iconUrl: "img/ballon_basket.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Dojo / Salle d'arts martiaux": L.icon({
        iconUrl: "img/dojo.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Salle de combat": L.icon({
        iconUrl: "img/boxe.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Court de tennis": L.icon({
        iconUrl: "img/tennis.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Salle ou terrain de squash": L.icon({
        iconUrl: "img/tennis.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Mur et fronton": L.icon({
        iconUrl: "img/tennis.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Salle de tennis de table": L.icon({
        iconUrl: "img/tennis_table.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Salle de musculation/cardiotraining": L.icon({
        iconUrl: "img/halterre.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Salle d'haltérophilie": L.icon({
        iconUrl: "img/halterre.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Aire de sports de glace sportive": L.icon({
        iconUrl: "img/patin.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Bassin de natation": L.icon({
        iconUrl: "img/piscine.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Site d'activités aquatiques et nautiques": L.icon({
        iconUrl: "img/piscine.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Equipement d'athlétisme": L.icon({
        iconUrl: "img/athletisme.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Terrain de volley-ball": L.icon({
        iconUrl: "img/volley.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Salle de volley-ball": L.icon({
        iconUrl: "img/volley.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Salle de cours collectifs": L.icon({
        iconUrl: "img/gymnase.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Salle de gymnastique sportive": L.icon({
        iconUrl: "img/gym.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Skate park & vélo Freestyle": L.icon({
        iconUrl: "img/skatepark.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Structure Artificielle d'Escalade": L.icon({
        iconUrl: "img/escalade.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Pas de tir": L.icon({
        iconUrl: "img/tir.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Salle d'escrime": L.icon({
        iconUrl: "img/escrime.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Salle de lutte": L.icon({
        iconUrl: "img/lutte.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Salle de billard": L.icon({
        iconUrl: "img/billard.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Bowling": L.icon({
        iconUrl: "img/bowling.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Terrain de rugby": L.icon({
        iconUrl: "img/rugby.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Anneau / piste de cyclisme": L.icon({
        iconUrl: "img/velo.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Salle ou terrain de badminton": L.icon({
        iconUrl: "img/volant.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    }),
    "Salle de patinage sur roulette": L.icon({
        iconUrl: "img/roulette.png",
        iconSize: [60, 60],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    })
};

// Filtrer les équipements pour exclure ceux ayant "Salle non spécialisée" dans la famille
var filteredEquipSport = equip_sport.features.filter(function (feature) {
    return feature.properties.famille !== "Salle non spécialisée";
});

// Fonction pour créer une zone tampon de 300m autour d'un point
function createBuffer(latlng) {
    return L.circle(latlng, {
        radius: 300, // Rayon en mètres
        color: 'black',
        weight: 1,
        fillOpacity: 0.2
    });
}

// Ajout des équipements sportifs avec icônes, popups et zones tampons
var equip_data = L.geoJSON(filteredEquipSport, {
    pointToLayer: function (feature, latlng) {
        // Sélectionner l'icône appropriée en fonction du nom ou du type
        var icon = icons[feature.properties.famille] || icons[feature.properties.type];
        if (icon) {
            return L.marker(latlng, { icon: icon });
        } else {
            return L.marker(latlng); // Icône par défaut si aucune correspondance
        }
    },
    onEachFeature: function (feature, layer) {
        var type = feature.properties.type; // Type de l'équipement
        var installation = feature.properties.installation; // Installation de l'équipement

        // Contenu du popup
        var popupContent = `
            <div style="max-width: 200px; text-align: center;">
                <em>Type : ${type}</em><br>
                <em>Nom : ${installation}</em>
            </div>
        `;

        // Ajouter le popup au marqueur
        layer.bindPopup(popupContent);

        // Ajouter les événements de survol de la souris
        layer.on({
            mouseover: function (e) {
                var buffer = createBuffer(e.latlng);
                buffer.addTo(map);
                layer.buffer = buffer; // Stocker la référence du buffer dans le layer
            },
            mouseout: function (e) {
                if (layer.buffer) {
                    map.removeLayer(layer.buffer); // Supprimer le buffer du layer
                    layer.buffer = null;
                }
            }
        });
    }
});

// Ajoute les équipements au groupe de clusters
var markers = L.markerClusterGroup();
markers.addLayer(equip_data);

// Ajoute les clusters à la carte
map.addLayer(markers);
