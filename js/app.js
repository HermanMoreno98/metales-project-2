// Crear el mapa
var map = L.map('map').setView([-9.19, -75.0152], 5);

// Añadir capa de mapa CartoDB.Positron
var cartoDBPositron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.carto.com/attributions">CARTO</a>',
    maxZoom: 19
}).addTo(map);

// Añadir capa de mapa Esri.WorldTopoMap
var esriWorldTopoMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    maxZoom: 18
});

// Añadir capa de mapa Terrain (Google Maps)
var googleTerrain = L.tileLayer('http://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}', {
    attribution: '&copy; <a href="https://www.google.com/maps">Google</a>',
    maxZoom: 19
});

// Definir capas de superposición (Overlay layers) 
var departamento = L.layerGroup();  // Estas capas pueden tener contenido
var provincia = L.layerGroup();
var distrito = L.layerGroup();
var reservorio = L.layerGroup();
var captacion = L.layerGroup();
var ptap = L.layerGroup();
var ptar = L.layerGroup();
var eps = L.layerGroup();
var rios = L.layerGroup();
var sectores = L.layerGroup();
var rios = L.layerGroup();
var ana_uh = L.layerGroup();
var cuencas_aporte = L.layerGroup();
var ana_acuiferos = L.layerGroup();
var cuencas_transfronterizas = L.layerGroup();
var canales = L.layerGroup();
var pasivos_mineros = L.layerGroup();
var prospeccion_as = L.layerGroup();
var prospeccion_as_hasta100 = L.layerGroup();
var monitoreo_ana = L.layerGroup();
var salud = L.layerGroup();
var Ana_pozos_ua = L.layerGroup();
var Ana_pozos_una = L.layerGroup();
var metales_laguna = L.layerGroup();
// Crear los LayerGroups para cada categoría
var category1Layer = L.layerGroup();
var category2Layer = L.layerGroup();
var category3Layer = L.layerGroup();
var unidades_proceso = L.layerGroup();

// Funcion para limpiar las capas
function clearAllLayers() {
    // Arreglo con todas las capas que deseas limpiar
    const layers = [
        departamento,
        provincia,
        distrito,
        reservorio,
        eps,
        captacion,
        ptap,
        ptar,
        category1Layer,
        category2Layer,
        category3Layer,
        sectores,
        rios,
        cuencas_transfronterizas,
        ana_uh,
        Ana_pozos_ua,
        Ana_pozos_una,
        ana_acuiferos,
        canales,
        cuencas_aporte,
        salud,
        pasivos_mineros,
        prospeccion_as,
        prospeccion_as_hasta100,
        monitoreo_ana,
        metales_laguna,
        unidades_proceso
    ];

    // Limpiar todas las capas
    layers.forEach(layer => {
        if (layer instanceof L.LayerGroup) {
            layer.clearLayers(); // Limpiar capas
        }
    });
}


function addGeoJSONLayer(url, objectName, styleOptions, labelProperty, layer, selectedDept, applyFilter = false, labelPrueba = null, tooltipProperty = null,popupPropertyFunction=null) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            layer.clearLayers(); // Limpiar capas anteriores

            let geojsonData;

            // Verificar si es TopoJSON
            if (data.type === 'Topology' && data.objects && Object.keys(data.objects).length > 0) {
                // Convertir TopoJSON a GeoJSON
                geojsonData = topojson.feature(data, data.objects[objectName]);
            } else {
                // Asumir que es GeoJSON
                geojsonData = data;
            }

            var geojsonLayer = L.geoJSON(geojsonData, {
                style: styleOptions,
                filter: function(feature) {
                    // Aplicar filtro solo si applyFilter es true
                    return applyFilter ? feature.properties[labelProperty] === selectedDept : true;
                },
                onEachFeature: function (feature, layer) {
                    // Mostrar el tooltip si 'labelPrueba' está definido
                    if (labelPrueba && feature.properties && feature.properties[labelPrueba]) {
                        layer.bindTooltip(feature.properties[labelPrueba], {
                            permanent: true,
                            direction: "center",
                            className: "label-tooltip"
                        }).openTooltip();
                    } else if (tooltipProperty && feature.properties[tooltipProperty]) {
                        // Mostrar el tooltip si 'tooltipProperty' está definido
                        var tooltipText = feature.properties[tooltipProperty];
                        layer.bindTooltip(tooltipText, {
                            permanent: true,
                            direction: "center",
                            className: "label-tooltip"
                        }).openTooltip();
                    }
                                        // Añadir popup con tabla si 'popupPropertyFunction' está definido
                    if (popupPropertyFunction) {
                        // Generar contenido de la tabla HTML con la función proporcionada
                        var popupHtml = `
                            <table class='popup-table'>
                                ${popupPropertyFunction(feature.properties)}
                            </table>
                        `;
                        layer.bindPopup(popupHtml);
                    }

                    if (feature.geometry && feature.geometry.type === "Point") {
                        var coords = feature.geometry.coordinates;
                        L.marker([coords[1], coords[0]]).addTo(layer);
                    }
                }
            });

            // Añadir la capa GeoJSON al mapa
            geojsonLayer.addTo(layer);

            geojsonLayers[objectName] = geojsonLayer;
        })
        .catch(error => {
            console.error('Error fetching or parsing GeoJSON data:', error);
        });
}
let geojsonLayers = {}; 
function addMarkersToMap(url,layer, objectName, icon, popupContent = null, selectedDept = null, deptField = 'nomdep',additionalFilter = null) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            layer.clearLayers(); // Limpiar capas anteriores
            
            let geojsonData;

            // Verificar si es TopoJSON
            if (data.type === 'Topology' && data.objects && Object.keys(data.objects).length > 0) {
                // Convertir TopoJSON a GeoJSON
                geojsonData = topojson.feature(data, data.objects[objectName]);

            } else {
                // Asumir que es GeoJSON
                geojsonData = data;
            }  
            
            geojsonData.features.forEach(function (feature) {

                let coordinates = feature.geometry.coordinates;
                let lng = coordinates[0]; // Longitud
                let lat = coordinates[1]; // Latitud

                // Verificar si la feature tiene propiedades (atributos)
                let properties = feature.properties || {};

                if (selectedDept && feature.properties[deptField] !== selectedDept) {
                    return; // Si el departamento no coincide, saltar este marcador
                }

                 // Aplicar el filtro adicional si se proporciona
                if (additionalFilter && !additionalFilter(properties)) {
                    return; // Si el filtro adicional no se cumple, omitir este marcador
                }


                if (lat && lng) {
   
                    // var marker = L.marker([parseFloat(feature.X), parseFloat(feature.Y)], { icon: icon });
                    var marker = L.marker([lat, lng], { icon: icon });


                    // Verificar si se debe mostrar el contenido del popup
                    if (popupContent) {
                        var popupHtml = `
                            <table class='popup-table'>
                                ${popupContent(feature.properties)}
                            </table>
                        `;
                        marker.bindPopup(popupHtml);
                    }
    
                    // Añadir el marcador al grupo
                    marker.addTo(layer);
    
                    geojsonLayers[objectName] = marker;
                }

            });  
            
        })
        .catch(error => {
            console.error('Error fetching or parsing GeoJSON data:', error);
        });
}



function addCombinedGeoJSONLayers(url1, url2, layer, styleOptions,o1,o2,selectedDept,labelProperty) {
    // Obtener y combinar datos de las dos URLs
    Promise.all([fetch(url1), fetch(url2)])
        .then(responses => Promise.all(responses.map(response => response.json())))
        .then(([data1, data2]) => {
            let combinedData;

            // Verificar si los datos son TopoJSON y convertir a GeoJSON si es necesario
            const convertToGeoJSON = (data, objectName) => {
                if (data.type === 'Topology' && data.objects && Object.keys(data.objects).length > 0) {
                    return topojson.feature(data, data.objects[objectName]);
                } else {
                    return data;
                }
            };

            // Convertir a GeoJSON si es TopoJSON
            const geojsonData1 = convertToGeoJSON(data1, o1); // Cambiar 'objectName1' según corresponda
            const geojsonData2 = convertToGeoJSON(data2, o2); // Cambiar 'objectName2' según corresponda

            // Combinar los datos GeoJSON
            combinedData = {
                type: "FeatureCollection",
                features: [...geojsonData1.features, ...geojsonData2.features]
            };

            // Crear la capa GeoJSON combinada
            var combinedLayer = L.geoJSON(combinedData, {
                style: styleOptions,
                filter: function(feature) {
                    return feature.properties[labelProperty] === selectedDept; // Filtrar por nombre de departamento
                },
                onEachFeature: function (feature, layer) {
                    // Opcional: Añadir tooltips, popups, etc.
                    
                }
            });

            // Limpiar capas anteriores y agregar la capa combinada al mapa
            layer.clearLayers();
            combinedLayer.addTo(layer);

        })
        .catch(error => {
            console.error('Error fetching or parsing GeoJSON data:', error);
        });
}

// Colores a los poligonos de la capa (cuencas transfronterizas)
/*
1. "Viridis"
Paleta perceptualmente uniforme, ideal para mapas de calor.
Uso: chroma.scale('viridis')
2. "Inferno"
Paleta de colores cálidos, pasando del negro al amarillo brillante.
Uso: chroma.scale('inferno')
3. "Magma"
Similar a "inferno", pero con tonos más oscuros y púrpuras.
Uso: chroma.scale('magma')
4. "Plasma"
Paleta vibrante que va desde azul profundo a amarillo brillante.
Uso: chroma.scale('plasma')
5. "Warm"
Una paleta de tonos cálidos que va de rojo a amarillo.
Uso: chroma.scale('warm')
6. "Cool"
Una paleta de tonos fríos que va de azul a verde.
Uso: chroma.scale('cool')
7. "RdYlBu"
Paleta divergente que va de rojo a azul con un centro amarillo. Ideal para mostrar desviaciones positivas y negativas.
Uso: chroma.scale('RdYlBu')
8. "Spectral"
Paleta divergente que combina múltiples colores brillantes.
Uso: chroma.scale('Spectral')
9. "Blues"
Escala secuencial de tonos azules.
Uso: chroma.scale('Blues')
10. "BuGn"
Escala de azul a verde.
Uso: chroma.scale('BuGn')
11. "PuBuGn"
Escala que combina púrpura, azul y verde.
Uso: chroma.scale('PuBuGn')
12. "OrRd"
Escala de colores cálidos que va de naranja a rojo.
Uso: chroma.scale('OrRd')
13. "YlGnBu"
Escala secuencial de amarillo a azul-verde.
Uso: chroma.scale('YlGnBu')
14. "BrBG"
Paleta divergente de marrón a azul-verde.
Uso: chroma.scale('BrBG')
15. "Set1", "Set2", "Set3"
Paletas cualitativas, con colores brillantes y variados, ideales para categorías.
Uso: chroma.scale('Set1')
*/
const colorScale = chroma.scale('Spectral').domain([1, 25]); 


function toggleGeoJSONLayer(layer) {
    if (map.hasLayer(layer)) {
        map.removeLayer(layer);
    } else {
        map.addLayer(layer);
    }
}

// Iconos
var capta_icon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/5371/5371132.png',
    iconSize: [20, 20]
});
var res_icon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1843/1843893.png',
    iconSize: [20, 20]
});
var ptar_icon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/10708/10708424.png',
    iconSize: [20, 20]
});
var ptap_icon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/8846/8846576.png',
    iconSize: [20, 20]
});
var eps_icon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/616/616546.png',
    iconSize: [20, 20]
});
var pasivos_mineros_icon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2547/2547847.png',
    iconSize: [20, 20]
});
var prospeccion_icon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/8336/8336930.png',
    iconSize: [10, 10]
});
var prospeccion_icon_hasta100 = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/12133/12133470.png',
    iconSize: [10, 10]
});
var prospeccion_icon_hasta100_ana = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/12133/12133768.png',
    iconSize: [10,10]
});
var salud_icon = L.icon({
    iconUrl: 'https://as2.ftcdn.net/v2/jpg/00/96/48/11/1000_F_96481179_ANEpnLLHZZxtIezAh5k3tTKHO3VaFqjF.jpg',
    iconSize: [10, 10]
});
var ana_ua_icon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/7389/7389966.png',
    iconSize: [15, 15]
});
var ana_una_icon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/6193/6193130.png',
    iconSize: [15, 15]
});
var urbano_icon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/4274/4274096.png',
    iconSize: [10, 10]
});
var pc_icon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/565/565665.png',
    iconSize: [10, 10]
});
var rural_icon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/44/44909.png',
    iconSize: [10, 10]
});
var laguna_icon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/128/401/401051.png',
    iconSize: [10, 10]
})



document.addEventListener('DOMContentLoaded', function() {
    const departamentoSelect = document.getElementById('departamento');

    if (departamentoSelect) {
        departamentoSelect.addEventListener('change', function(e) {
            const selectedDept = e.target.value;
            console.log(selectedDept);

            if (selectedDept !== "Seleccionar todos los departamentos") {
                // Cargar y filtrar la capa GeoJSON
                addGeoJSONLayer(
                    'https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/sectores_op.json', 
                    'sectores_op', 
                    {color: 'green', weight: 2}, 
                    'nomdep', 
                    sectores, 
                    selectedDept, 
                    applyFilter = true,
                    'SECTOR'
                );
                addGeoJSONLayer(
                    'https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/depa.json', 
                    'depa', 
                    {color: 'black', weight: 2, opacity: 1, fillOpacity: 0}, // Estilo de los polígonos
                    'nomdep', // Propiedad a filtrar
                    departamento, // Capa en el mapa donde se añadirá el geojson
                    selectedDept, // Departamento seleccionado
                    applyFilter = true,
                    null,null,
                    function(properties) {
                        // Generar contenido de la tabla HTML
                        return `
                            <tr><th>Nombre</th><td>${properties.nomdep}</td></tr>
                        `;
                    }
                );
                addGeoJSONLayer(
                    'https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/prov.json', 
                    'prov', 
                    {color: 'black', weight: 2, opacity: 1, fillOpacity: 0}, // Estilo de los polígonos
                    'nomdep', // Propiedad a filtrar
                    provincia, // Capa en el mapa donde se añadirá el geojson
                    selectedDept, // Departamento seleccionado
                    applyFilter = true,
                    'nomprov'
                );
                addGeoJSONLayer(
                    'https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/Capas/dist.json', 
                    'dist', 
                    {color: 'black', weight: 1, opacity: 1, fillOpacity: 0, dashArray: "5, 5"}, 
                    'nomdep', // Propiedad a filtrar
                    distrito, // Capa en el mapa donde se añadirá el geojson
                    selectedDept, // Departamento seleccionado
                    applyFilter = true,
                    'nomdist',null
                );
                addGeoJSONLayer(
                    'https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/Capas/up_adp.json', 
                    'up_adp', 
                    {color: 'yellow', weight: 3, opacity: 0.5, fillOpacity: 0.4}, 
                    'nomdep', // Propiedad a filtrar
                    unidades_proceso, // Capa en el mapa donde se añadirá el geojson
                    selectedDept, // Departamento seleccionado
                    applyFilter = true,
                    'codup',null
                );
                addCombinedGeoJSONLayers(
                    'https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/Capas/rios_nacional_1.json',
                    'https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/Capas/rios_nacional_2.json',
                    rios, // Capa en el mapa donde se añadirá el geojson combinado
                    {color: 'blue', weight: 2}, 
                    "rios_nacional_1","rios_nacional_2",selectedDept,'nomdep'
                );
                addGeoJSONLayer(
                    'https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/Capas/Ana_uh.json', 
                    'Ana_uh', 
                    {color: 'cyan', weight: 2, opacity: 0.5, fillOpacity: 0.4}, 
                    'nomdep', // Propiedad a filtrar
                    ana_uh, // Capa en el mapa donde se añadirá el geojson
                    selectedDept, // Departamento seleccionado
                    applyFilter = false,
                    'nombre',null
                );
                addGeoJSONLayer(
                    'https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/Capas/cuenta_aporte.geojson', 
                    'cuenta_aporte', 
                    {color: 'orange', weight: 1, opacity: 0.5, fillOpacity: 0.4}, 
                    'nomdep', // Propiedad a filtrar
                    cuencas_aporte, // Capa en el mapa donde se añadirá el geojson
                    selectedDept, // Departamento seleccionado
                    applyFilter = false,
                    null,null
                );
                addGeoJSONLayer(
                    'https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/Capas/Ana_acuiferos.geojson', 
                    'Ana_acuiferos', 
                    {color: 'yellow', weight: 1, opacity: 0.5, fillOpacity: 0.4}, 
                    'nomdep', // Propiedad a filtrar
                    ana_acuiferos, // Capa en el mapa donde se añadirá el geojson
                    selectedDept, // Departamento seleccionado
                    applyFilter = false,
                    null,null
                );
                addGeoJSONLayer(
                    'https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/Capas/cuencas_transfronterizas.geojson', 
                    'cuencas_transfronterizas', 
                    function(feature) {
                        const value = feature.properties.OBJECTID; // Cambia 'someProperty' por la propiedad de tus datos
                        const color = colorScale(value).hex(); // Generar color según el valor
                    
                        return {
                            fillColor: color,
                            fillOpacity: 0.7, // Opacidad de relleno
                            color: "#000",    // Color del borde
                            weight: 2         // Grosor del borde
                        };
                    },
                    // {color: 'purple', weight: 1, opacity: 0.5, fillOpacity: 0.4}, 
                    'nomdep', // Propiedad a filtrar
                    cuencas_transfronterizas, // Capa en el mapa donde se añadirá el geojson
                    selectedDept, // Departamento seleccionado
                    applyFilter = false,
                    null,null
                );
                addGeoJSONLayer(
                    'https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/Capas/canales.geojson', 
                    'canales', 
                    {color: 'purple', weight: 1, opacity: 0.5, fillOpacity: 0.4}, 
                    'nomdep', // Propiedad a filtrar
                    canales, // Capa en el mapa donde se añadirá el geojson
                    selectedDept, // Departamento seleccionado
                    applyFilter = false,
                    null,null
                );
                addMarkersToMap(
                    'https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/capta.json',
                    captacion,'capta',
                    capta_icon, 
                    function(properties) { // Popup content (si lo deseas)
                        return `
                            <tr><th>Nombre de la captación</th><td>${properties.Nombre_BD}</td></tr>
                            <tr><th>Tipo de captación</th><td>${properties.Tipo_cap}</td></tr>
                        `;
                    },
                    selectedDept,'nomdep'
                );
                addMarkersToMap(
                    'https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/res.json',
                    reservorio,'res',
                    res_icon, 
                    function(properties) { // Popup content (si lo deseas)
                        return `
                            <tr><th>Nombre de la EPS</th><td>${properties.NOMEPS}</td></tr>
                            <tr><th>Estado Operativo</th><td>${properties.ESTADOOP}</td></tr>
                        `;
                    },
                    selectedDept,'nomdep'
                );
                addMarkersToMap(
                    'https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/ptap.json',
                    ptap,'ptap',
                    ptap_icon, 
                    function(properties) { // Popup content (si lo deseas)
                        return `
                            <tr><th>Nombre de la PTAP</th><td>${properties.NOMPTAP}</td></tr>
                            <tr><th>Localidad</th><td>${properties.NOMLOCALID}</td></tr>
                        `;
                    },
                    selectedDept,'nomdep'
                );
                addMarkersToMap(
                    'https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/ptar.json',
                    ptar,'ptar',
                    ptar_icon, 
                    function(properties) { // Popup content (si lo deseas)
                        return `
                            <tr><th>Nombre de la PTAR</th><td>${properties.NOMPTAR}</td></tr>
                            <tr><th>Localidad</th><td>${properties.NOMLOCALID}</td></tr>
                        `;
                    },
                    selectedDept,'nomdep'
                );
                addMarkersToMap(
                    'https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/eps.json',
                    eps,'eps',
                    eps_icon, 
                    function(properties) { // Popup content (si lo deseas)
                        return `
                            <tr><th>Nombre de la EPS</th><td>${properties.NOMEPS}</td></tr>
                            <tr><th>Población ámbito</th><td>${properties.POBAMBEPS}</td></tr>
                        `;
                    },
                    selectedDept,'NOMDEP'
                );
                addMarkersToMap(
                    'https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/Capas/pasivos_mineros.geojson',
                    pasivos_mineros,'pasivos_mineros',
                    pasivos_mineros_icon, 
                    function(properties) { // Popup content (si lo deseas)
                        return `
                            <tr><th>Tipo</th><td>${properties.tipo}</td></tr>
                            <tr><th>Sub tipo</th><td>${properties.subtipo}</td></tr>
                        `;
                    },
                    selectedDept,'nomdep'
                );
                addMarkersToMap(
                    'https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/Capas/prospeccion_geo.geojson',
                    prospeccion_as,'prospeccion_geo',
                    prospeccion_icon, 
                    null,
                    selectedDept,'nomdep',
                    function(properties) { // Filtro adicional
                        return properties.AS_PPM_ADP_lab === 'Más de 100 veces el LMP'; // Solo mostrar pasivos de tipo 'Metálico'
                    }
                );
                addMarkersToMap(
                    'https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/Capas/prospeccion_geo.geojson',
                    prospeccion_as_hasta100,'prospeccion_geo',
                    prospeccion_icon_hasta100, 
                    null,
                    selectedDept,'nomdep',
                    function(properties) { // Filtro adicional
                        return properties.AS_PPM_ADP_lab === 'Hasta 100 veces el LMP'; // Solo mostrar pasivos de tipo 'Metálico'
                    }
                );
                addMarkersToMap(
                    'https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/Capas/monitoreo_ana.geojson',
                    monitoreo_ana,'monitoreo_ana',
                    prospeccion_icon_hasta100_ana, 
                    null,
                    selectedDept,'nomdep',
                    function(properties) { // Filtro adicional
                        return properties.AS_PPM_ADP_lab === 'Hasta 100 veces el LMP'; // Solo mostrar pasivos de tipo 'Metálico'
                    }
                );
                addMarkersToMap(
                    'https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/Capas/salud.geojson',
                    salud,'salud',
                    salud_icon, 
                    function(properties) { // Popup content (si lo deseas)
                        return `
                            <tr><th>Nombre de la institución</th><td>${properties.est_nombre}</td></tr>
                            <tr><th>Clasificación</th><td>${properties.clasificac}</td></tr>
                        `;
                    },
                    selectedDept,'nom_dpto',
                    null
                );  
                addMarkersToMap(
                    'https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/Capas/Ana_pozos_ua.geojson',
                    Ana_pozos_ua,'Ana_pozos_ua',
                    ana_ua_icon, 
                    function(properties) { // Popup content (si lo deseas)
                        return `
                            <tr><th>SECTOR</th><td>${properties.SECTOR}</td></tr>
                            <tr><th>Nombre de pozo</th><td>${properties.NOM_POZO}</td></tr>
                        `;
                    },
                    selectedDept,'nomdep',
                    null
                );  
                addMarkersToMap(
                    'https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/Capas/Ana_pozos_una.geojson',
                    Ana_pozos_una,'Ana_pozos_una',
                    ana_una_icon, 
                    function(properties) { // Popup content (si lo deseas)
                        return `
                            <tr><th>Usuario</th><td>${properties.NM_USUARIO}</td></tr>
                            <tr><th>Tipo de uso</th><td>${properties.TP_USO}</td></tr>
                            <tr><th>Ubicación</th><td>${properties.UBICACION}</td></tr>
                        `;
                    },
                    selectedDept,'nomdep',
                    null
                );  
                addMarkersToMap(
                    'https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/Capas/metales_laguna.geojson',
                    metales_laguna,'metales_laguna',
                    laguna_icon, 
                    function(properties) { // Popup content (si lo deseas)
                        return `
                            <tr><th>Arsenico</th><td>${properties.Arsenico}</td></tr>
                            <tr><th>Cadmio</th><td>${properties.Cadmio}</td></tr>
                            <tr><th>Cobre</th><td>${properties.Cobre}</td></tr>
                            <tr><th>Mercurio</th><td>${properties.Mercurio}</td></tr>
                            <tr><th>Plomo</th><td>${properties.Plomo}</td></tr>
                            <tr><th>Zinc</th><td>${properties.Zinc}</td></tr>
                            <tr><th>Investigación</th><td><a href="https://jpoll.ut.ac.ir/article_96586_bddd9e3fd71561768243d7006964cc91.pdf" target="_blank">Evaluation of Heavy Metal Contamination in Sediments of the Umayo Lagoon, Peru, and the Behaviour of Local Actors</a></td></tr>
                            <tr><th>Autores</th><td>
                                <ul>
                                    <li>* Dante Atilio Salas-Ávila</li>
                                    <li>* Fermin Francisco Chaiña Chura</li>
                                    <li>* German Belizario Quispe</li>
                                    <li>* Edgar Quispe Mamani</li>
                                    <li>* Edgar Vidal Hurtado Chavez</li>
                                    <li>* Felix Rojas Chahuares</li>
                                    <li>* Wenceslao Quispe Borda</li>
                                    <li>* Marian Alicia Hermoza Gutierrez</li>
                                    <li>* Dante Salas Mercado</li>
                                </ul>
                            </td></tr>
                        `;
                    },
                    selectedDept,'nomdep'
                );              
            }
        });
    } else {
        console.error("No se encontró el elemento con id 'departamento'.");
    }
});



// // Función para alternar la visibilidad del sidebar
// function toggleSidebar() {
//     var sidebar = document.getElementById('sidebar');
//     sidebar.classList.toggle('collapsed');
// }

function fetchReservoirData() {
    return fetch('https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/Capas/sunass_ccpp.csv')
        .then(response => response.text())
        .then(data => {
            // Parsear CSV usando PapaParse
            let parsedData = Papa.parse(data, { header: true }).data;
            
            // Filtrar filas vacías
            parsedData = parsedData.filter(row => Object.values(row).some(value => value !== ''));

            console.log(parsedData); // Para ver los datos parseados en la consola
            return parsedData;
        })
        .catch(error => {
            console.error('Error fetching or parsing the data:', error);
        });
}

// Función para agregar marcadores de reservorio por categoría
function addCCPP_Caracterizacion(data) {
    // Limpiar las capas antes de agregar nuevas
    category1Layer.clearLayers();
    category2Layer.clearLayers();
    category3Layer.clearLayers();


    let validMarkers = [];

    data.forEach(function(feature) {
        // Verificar que las coordenadas sean válidas
        if (!isNaN(feature.Longitud) && !isNaN(feature.Latitud)) {
            // Determinar la categoría del reservorio (puedes basarte en un atributo del CSV)
            let category = feature['ambito']; // Ejemplo: "Tipo.de.Reservorio"
            let marker;

            let popupContent = `
            <div style='max-height:300px; overflow-y:auto; overflow-x:auto;'>
                <table class='popup-table'>
                    <tr><th>Ubigeo</th><td>${feature.ubigeo_censo_17}</td></tr>
                    <tr><th>Nombre del centro poblado</th><td>${feature.NOM_CCPP}</td></tr>
                    <tr><th>Poblacion</th><td>${feature.POBTOTAL}</td></tr>
                    <tr><th>Vivienda</th><td>${feature.VIVTOTAL}</td></tr>
                    <tr><th>Continuidad horas</th><td>${feature.conti_avenida_horas}</td></tr>
                    <tr><th>Continuidad días</th><td>${feature.conti_avenida_dias}</td></tr>
                    <tr><th>Conexiones totales de agua</th><td>${feature.Conex_tot_agua}</td></tr>
                    <tr><th>Conexiones totales de alcantarillado</th><td>${feature.Conex_tot_alca}</td></tr>
                    <tr><th>Tipo de fuente</th><td>${feature.tipo_fuente}</td></tr>
                    <tr><th>Licencia de uso</th><td>${feature.licenciadeuso}</td></tr>
                    <tr><th>Tipo de sistema de agua</th><td>${feature.tipo_agua}</td></tr>
                    <tr><th>Año de información</th><td>${feature.Anio_informacion}</td></tr>
                </table>
            </div>`;
            
            // Asignar el ícono y la capa según la categoría
            if (category === "Rural") {
                marker = L.marker([parseFloat(feature.Latitud), parseFloat(feature.Longitud)], { icon: rural_icon })
                    .bindPopup(popupContent);
                category1Layer.addLayer(marker);
            } else if (category === "PC") {
                marker = L.marker([parseFloat(feature.Latitud), parseFloat(feature.Longitud)], { icon: pc_icon })
                    .bindPopup(popupContent);
                category2Layer.addLayer(marker);
            } else if (category === "Urbano no EPS") {
                marker = L.marker([parseFloat(feature.Latitud), parseFloat(feature.Longitud)], { icon: urbano_icon })
                    .bindPopup(popupContent);
                category3Layer.addLayer(marker);
            }

            // Agregar coordenadas válidas al arreglo
            validMarkers.push([parseFloat(feature.Latitud), parseFloat(feature.Longitud)]);
        }
    });

    // Agregar los grupos de capas al mapa
    category1Layer.addTo(map);
    category2Layer.addTo(map);
    category3Layer.addTo(map);

    // Ajustar el zoom para mostrar todos los marcadores
    if (validMarkers.length > 0) {
        map.fitBounds(validMarkers);
    }
}

// Crear el control de capas con etiquetas HTML e íconos
L.control.layers(
    {
        "Base Map": cartoDBPositron,
        "Esri": esriWorldTopoMap,
        "Terrain<hr><strong>Límites censales:</strong>": googleTerrain
    },
    {
        "Departamento": departamento,
        "Provincia": provincia,
        "Distrito<hr><strong>Infraestructura de saneamiento:</strong>": distrito,
        "EPS <img src='https://cdn-icons-png.flaticon.com/512/616/616546.png' width='20' height='20'>": eps,
        "Reservorio <img src='https://cdn-icons-png.flaticon.com/512/1843/1843893.png' width='20' height='20'>": reservorio,
        "Captacion <img src='https://cdn-icons-png.flaticon.com/512/5371/5371132.png' width='20' height='20'>": captacion,
        "PTAP <img src='https://cdn-icons-png.flaticon.com/512/8846/8846576.png' width='20' height='20'>": ptap,
        "PTAR <img src='https://cdn-icons-png.flaticon.com/512/10708/10708424.png' width='20' height='20'>": ptar,
        "CCPP Rural <img src='https://cdn-icons-png.flaticon.com/512/44/44909.png' width='20' height='20'>": category1Layer,
        "CCPP Pequeña Ciudad <img src='https://cdn-icons-png.flaticon.com/512/565/565665.png' width='20' height='20'>": category2Layer,
        "CCPP Pequeña Ciudad Tipo 2 <img src='https://cdn-icons-png.flaticon.com/512/4274/4274096.png' width='20' height='20'>": category3Layer,
        "Unidades de Proceso - ADP":unidades_proceso,
        "Sectores Operacionales <hr><strong>Hidrografía:</strong>": sectores, 
        "Rios <img src='https://www.kingtony.com/upload/products/87D11-071A-B_v.jpg' width='20' height='20'>": rios,
        "Cuencas transfronterizas":cuencas_transfronterizas,
        "Ana - UH": ana_uh,
        "Pozos de uso agricola <img src='https://cdn-icons-png.flaticon.com/512/7389/7389966.png' width='20' height='20'>":Ana_pozos_ua,
        "Pozos de uso poblacional <img src='https://cdn-icons-png.flaticon.com/512/6193/6193130.png' width='20' height='20'>":Ana_pozos_una,
        "Ana - Acuiferos":ana_acuiferos,"Canales":canales,
        "Cuenta de Aporte<hr><strong>Información secundaria:</strong>": cuencas_aporte,
        "Salud <img src='https://as2.ftcdn.net/v2/jpg/00/96/48/11/1000_F_96481179_ANEpnLLHZZxtIezAh5k3tTKHO3VaFqjF.jpg' width='20' height='20'>":salud,
        "Pasivos Mineros <img src='https://cdn-icons-png.flaticon.com/512/2547/2547847.png' width='20' height='20'><hr><strong>Metales pesados:</strong><br><hr><strong>INGEMENT</strong><br>":pasivos_mineros,
        "Arsénico (Más de 100 LMP) - INGEMMET <img src='https://cdn-icons-png.flaticon.com/512/8336/8336930.png' width='20' height='20'>":prospeccion_as,
        "Estudios Laguna Umayo <img src='https://cdn-icons-png.flaticon.com/128/401/401051.png' width='15' height='15'>":metales_laguna,
        "Arsénico (Hasta 100 veces LMP) - INGEMMET<img src='https://cdn-icons-png.flaticon.com/512/12133/12133470.png' width='20' height='20'><hr><strong>ANA</strong><br>":prospeccion_as_hasta100,
        "Arsénico (Hasta 100 veces LMP) - ANA <img src='https://cdn-icons-png.flaticon.com/512/12133/12133768.png' width='20' height='20'>":monitoreo_ana
        
    }
).addTo(map);




// Variable para almacenar los datos del CSV
let reservoriosData = [];

// Función para cargar datos desde CSV y poblar los select
function loadAndPopulateSelects() {
    fetch('https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/Capas/sunass_ccpp.csv')
        .then(response => response.text())
        .then(data => {
            // Parsear CSV usando PapaParse
            reservoriosData = Papa.parse(data, { header: true }).data;

            // Filtrar filas vacías
            reservoriosData = reservoriosData.filter(row => Object.values(row).some(value => value !== ''));

            // Obtener opciones únicas para el primer select (departamento)
            let departamentos = [...new Set(reservoriosData.map(item => item.nomdep))];

            // Ordenar alfabéticamente
            departamentos.sort((a, b) => a.localeCompare(b));

            updateSelectOptions('departamento', departamentos);

            // Poblar EPS, localidad y reservorio con todas las opciones
            updateSelectOptions('provincia', []);
            updateSelectOptions('distrito', []);
            updateSelectOptions('ccpp', []);
        })
        .catch(error => {
            console.error('Error fetching or parsing data:', error);
        });
}


// Función para actualizar las opciones de un select
function updateSelectOptions(selectId, options) {
    let selectElement = document.getElementById(selectId);
    selectElement.innerHTML = ''; // Limpiar opciones actuales

    // Crear opción por defecto
    let defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = selectId === 'departamento' ? 'Seleccionar todos los departamentos' : `Seleccione un ${selectId}`;
    selectElement.appendChild(defaultOption);

    // Ordenar opciones alfabéticamente solo si hay opciones disponibles
    if (options.length > 0) {
        options.sort((a, b) => a.localeCompare(b));
    }

    // Crear y añadir las nuevas opciones al select
    options.forEach(option => {
        let optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        selectElement.appendChild(optionElement);
    });
}

// Función para filtrar y actualizar select
function filterAndUpdateSelect(selectId, filterKey, filterValue, name) {
    let filteredOptions = [...new Set(reservoriosData.filter(item => item[filterKey] === filterValue).map(item => item[name]))];
    updateSelectOptions(selectId, filteredOptions);
}

// Función para resetear todos los select a su estado inicial
function resetFilters() {
    document.getElementById('departamento').value = '';
    updateSelectOptions('provincia', []);
    updateSelectOptions('distrito', []);
    updateSelectOptions('ccpp', []);
    // addCCPP_Caracterizacion(reservoriosData);
    clearAllLayers();

    map.setView([-9.19, -75.0152], 5);
}

// Event listener para el botón de resetear filtros
document.getElementById('reset_filters').addEventListener('click', function () {
    resetFilters();
});

// Event listeners para cambios en los selects
document.addEventListener('DOMContentLoaded', function () {
    loadAndPopulateSelects();

    let selectedDepartamento = "";  // Variable global para almacenar el departamento seleccionado
    let selectedProvincia = "";  // Variable global para almacenar el eps seleccionado
    let selectedDistrito = "";  // Variable global para almacenar la localidad seleccionada
    let selectedCCPP = "";  // Variable global para almacenar el ccpp seleccionado

    document.getElementById('departamento').addEventListener('change', function () {
        selectedDepartamento = this.value;
        selectedProvincia = "";  // Reinicia el EPS seleccionado
        selectedDistrito = "";  // Reinicia la localidad seleccionada
        selectedCCPP = "";  // Reinicia el CCPP seleccionado
        if (selectedDepartamento === "" || selectedDepartamento === "Seleccione todos los departamentos") {
            addCCPP_Caracterizacion(reservoriosData);
            updateSelectOptions('provincia', []);
            updateSelectOptions('distrito', []);
            updateSelectOptions('ccpp', []);
        } else {
            let filteredData = reservoriosData.filter(item => item.nomdep === selectedDepartamento);
            addCCPP_Caracterizacion(filteredData);
            filterAndUpdateSelect('provincia', 'nomdep', selectedDepartamento, 'nomprov');
            updateSelectOptions('distrito', []);
            updateSelectOptions('ccpp', []);
        }
    });

    document.getElementById('provincia').addEventListener('change', function () {
        selectedProvincia = this.value;
        selectedDistrito = "";  // Reinicia la localidad seleccionada
        selectedCCPP = "";  // Reinicia el CCPP seleccionado
        if (selectedProvincia === "" || selectedProvincia === "Seleccione un provincia") {
            if (selectedDepartamento === "" || selectedDepartamento === "Seleccione todos los departamentos") {
                addCCPP_Caracterizacion(reservoriosData);
            } else {
                let filteredData = reservoriosData.filter(item => item.nomdep === selectedDepartamento);
                addCCPP_Caracterizacion(filteredData);
            }
            updateSelectOptions('distrito', []);
            updateSelectOptions('ccpp', []);
        } else {
            let filteredData = reservoriosData.filter(item => item.nomprov === selectedProvincia && item.nomdep === selectedDepartamento);
            addCCPP_Caracterizacion(filteredData);
            filterAndUpdateSelect('distrito', 'nomprov', selectedProvincia, 'nomdist');
            updateSelectOptions('ccpp', []);
        }
    });

    document.getElementById('distrito').addEventListener('change', function () {
        selectedDistrito = this.value;
        selectedCCPP = "";  // Reinicia el CCPP seleccionado
        if (selectedDistrito === "" || selectedDistrito === "Seleccione un distrito") {
            if (selectedProvincia === "" || selectedProvincia === "Seleccione un provincia") {
                if (selectedDepartamento === "" || selectedDepartamento === "Seleccione todos los departamentos") {
                    addCCPP_Caracterizacion(reservoriosData);
                } else {
                    let filteredData = reservoriosData.filter(item => item.nomdep === selectedDepartamento);
                    addCCPP_Caracterizacion(filteredData);
                }
            } else {
                let filteredData = reservoriosData.filter(item => item.nomprov === selectedProvincia && item.nomdep === selectedDepartamento);
                addCCPP_Caracterizacion(filteredData);
            }
            updateSelectOptions('ccpp', []);
        } else {
            let filteredData = reservoriosData.filter(item => item.nomdist === selectedDistrito && item.nomprov === selectedProvincia && item.nomdep === selectedDepartamento);
            addCCPP_Caracterizacion(filteredData);
            filterAndUpdateSelect('ccpp', 'nomdist', selectedDistrito, 'NOM_CCPP');
        }
    });

    document.getElementById('ccpp').addEventListener('change', function () {
        let ccpp = this.value;

        if (ccpp === "" || ccpp === "Seleccione un ccpp") {
            if (selectedDistrito === "" || selectedDistrito === "Seleccione un distrito") {
                if (selectedProvincia === "" || selectedProvincia === "Seleccione un provincia") {
                        if (selectedDepartamento === "" || selectedDepartamento === "Seleccione todos los departamentos") {
                            addCCPP_Caracterizacion(reservoriosData);
                        } else {
                            let filteredData = reservoriosData.filter(item => item.nomdep === selectedDepartamento);
                            addCCPP_Caracterizacion(filteredData);
                        }
                    
                } else {
                    let filteredData = reservoriosData.filter(item => item.nomprov === selectedProvincia && item.nomdep === selectedDepartamento);
                    addCCPP_Caracterizacion(filteredData);
                }
            } else {
                let filteredData = reservoriosData.filter(item => item.nomdist === selectedDistrito && item.nomprov === selectedProvincia && item.nomdep === selectedDepartamento);
                addCCPP_Caracterizacion(filteredData);
            }
        } else {
            let filteredData = reservoriosData.filter(item => item.NOM_CCPP === ccpp && item.nomdist === selectedDistrito && item.nomprov === selectedProvincia && item.nomdep === selectedDepartamento);
            addCCPP_Caracterizacion(filteredData);
        }
    });

    addCCPP_Caracterizacion(reservoriosData);




    const btnClick = document.getElementById('icon-despliegue');

    btnClick.addEventListener('click',()=>{
        btnClick.classList.toggle('lista-click');
        capasBtn.classList.remove('list-open');
        check.classList.remove('check-list');
    });
    const btnSidebar = document.getElementById('btn');
    // btnSidebar.addEventListener('click',()=>{
    //     document.body.classList.toggle('close-sidebar');
    //     setTimeout(()=>{
    //         map.invalidateSize();
    //     },300);
    // });

    if (btnSidebar) {
        btnSidebar.addEventListener('click', () => {
            const body = document.body;
            
            // Alterna entre las clases 'open-sidebar' y 'close-sidebar'
            if (body.classList.contains('close-sidebar')) {
                body.classList.remove('close-sidebar');
                body.classList.add('open-sidebar');
                console.log('Sidebar opened.');
            } else {
                body.classList.remove('open-sidebar');
                body.classList.add('close-sidebar');
                console.log('Sidebar closed.');
            }

            // Actualiza el tamaño del mapa si es necesario
            setTimeout(() => {
                if (typeof map !== 'undefined') {
                    map.invalidateSize();
                }
            }, 300);
        });
    } else {
        console.log('Button with id "btn" not found.');
    }

    const capasBtn = document.getElementById('despliegue-capas');

    capasBtn.addEventListener('click', ()=>{
        btnClick.classList.remove('lista-click');
        capasBtn.classList.toggle('list-open');
        check.classList.remove('check-list');
    });
    const check = document.getElementById('check');
    check.addEventListener('click', ()=>{
        check.classList.toggle('check-list');
        btnClick.classList.remove('lista-click');
    });


});




  // Agregar el control de localización
const locateControl = L.control.locate({
    position: 'topleft',
    drawCircle: true,
    follow: false,
    setView: true,
    keepCurrentZoomLevel: false,
    markerStyle: {
        radius: 5,
        color: '#03f',
        fillColor: '#03f',
        fillOpacity: 0.8
    },
    circleStyle: {
        color: '#03f',
        fillColor: '#03f',
        fillOpacity: 0.2
    },
    strings: {
        title: "Mostrar mi ubicación"
    }
}).addTo(map);

// Opcional: Manejar el evento de localización
map.on('locationfound', function(e) {
    // L.marker(e.latlng).addTo(map)
    //     .bindPopup("Estás aquí").openPopup();
    map.setView(e.latlng, 13);
});

// Manejar el evento de error
map.on('locationerror', function(e) {
    alert(e.message);
});


// Al hacer clic en el botón, dispara el input de archivos (shapefile)
document.getElementById('shapefileInput').addEventListener('click', function() {
    document.getElementById('shapefileInput_input').click();
});

// Boton para subir shapefile
document.getElementById('shapefileInput_input').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const arrayBuffer = e.target.result;
            
            // Usamos shpjs para convertir el shapefile en GeoJSON
            shp(arrayBuffer).then(function(geojson) {
                // Añadir el GeoJSON al mapa
                L.geoJSON(geojson).addTo(map);

                // Ajustar la vista para mostrar el shapefile completo
                map.fitBounds(L.geoJSON(geojson).getBounds());
            }).catch(function(error) {
                console.error('Error al leer el shapefile:', error);
            });
        };

        // Leer el archivo como ArrayBuffer
        reader.readAsArrayBuffer(file);
    }
});


// // Inicializa Leaflet Draw
// const drawnItems = new L.FeatureGroup();
// map.addLayer(drawnItems);

// const drawControl = new L.Control.Draw({
//     edit: {
//         featureGroup: drawnItems
//     },
//     draw: {
//         polygon: true,
//         polyline: false,
//         rectangle: false,
//         circle: false,
//         marker: false
//     }
// });
// map.addControl(drawControl);

// // Evento cuando se dibuja un polígono
// map.on(L.Draw.Event.CREATED, function (event) {
//     const layer = event.layer;
//     drawnItems.addLayer(layer);
// });



// Boton para expandir mapa
const maximizeBtn = document.getElementById('maximize-btn');
const mapContainer = document.getElementById('map-container');
const mapElement = document.getElementById('map');

let isMaximized = false;

maximizeBtn.addEventListener('click', function() {
    if (!isMaximized) {
        // Maximizar el mapa
        mapContainer.classList.add('map-fullscreen');
        map.invalidateSize(); // Actualiza el tamaño del mapa para que se ajuste a pantalla completa
        maximizeBtn.textContent = "⛶"; // Cambia el ícono del botón a minimizar
    } else {
        // Restaurar el mapa a su tamaño original
        mapContainer.classList.remove('map-fullscreen');
        map.invalidateSize(); // Ajusta nuevamente el tamaño del mapa
        maximizeBtn.textContent = "⛶"; // Cambia el ícono del botón a maximizar
    }
    isMaximized = !isMaximized;
});



// BUFFER

// Variables para el buffer y el punto de referencia
var bufferLayer = null;
var referencePoint = null;
var referencePointGeoJSON = null;
var enableMarking = false; // Por defecto, no se permite marcar en el mapa

// Manejar clic en el checkbox para habilitar o deshabilitar la selección de punto
document.getElementById('enableMarker').addEventListener('change', function() {
    enableMarking = this.checked;
  
    // Si deshabilitamos la opción de marcar puntos, eliminamos el marcador del mapa
    if (!enableMarking) {
      // Eliminar el marcador del mapa
      if (referencePoint) {
        map.removeLayer(referencePoint);
        referencePoint = null; // Limpiamos la variable
        referencePointGeoJSON = null; // Limpiamos el punto GeoJSON también
      }
  
      // Eliminar el buffer si existe
      if (bufferLayer) {
        map.removeLayer(bufferLayer);
        bufferLayer = null; // Limpiar la variable del buffer
      }
    }
  });

// Manejar clic en el mapa para seleccionar el punto de referencia (solo si está habilitado)
map.on('click', function(e) {
  if (!enableMarking) return; // No marcar si no está habilitado

  // Eliminar el marcador anterior si existe
  if (referencePoint) {
    map.removeLayer(referencePoint);
  }

  // Crear marcador en la posición seleccionada
  referencePoint = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);

  // Guardar las coordenadas como punto GeoJSON
  referencePointGeoJSON = turf.point([e.latlng.lng, e.latlng.lat]);
  console.log(referencePointGeoJSON)
});

function countPointsInBuffer(layer, buffer) {
    var count = 0;
    layer.eachLayer(function(featureLayer) {
      // Verificar si la capa tiene latitud y longitud (para CSVs que no son GeoJSON)
      var latLng = featureLayer.getLatLng();
      if (latLng) {
        var point = [latLng.lng, latLng.lat]; // Coordenadas en [longitud, latitud]
        var turfPoint = turf.point(point); // Crear un punto de Turf.js con las coordenadas
        if (turf.booleanPointInPolygon(turfPoint, buffer)) {
          count++;
        }
      }
    });
    return count;
  }

// Crear el buffer y contar puntos dentro
function createBuffer(radius,category1Layer,category2Layer,category3Layer) {
  if (!referencePointGeoJSON) {
    alert("Por favor selecciona un punto en el mapa.");
    return;
  }

  // Borrar buffers anteriores
  if (bufferLayer) {
    map.removeLayer(bufferLayer);
  }

  // Crear buffer alrededor del punto de referencia
  var buffer = turf.buffer(referencePointGeoJSON, radius, { units: 'meters' });

  // Agregar buffer al mapa
  bufferLayer = L.geoJSON(buffer).addTo(map);

  // Contar puntos dentro del buffer
  var countLayer1 = 0;
  var countLayer2 = 0;
  var countLayer3 = 0;
  // Contar puntos en cada capa
  countLayer1 = countPointsInBuffer(category1Layer, buffer);
  countLayer2 = countPointsInBuffer(category2Layer, buffer);
  countLayer3 = countPointsInBuffer(category3Layer, buffer);

  alert(
    "Puntos dentro del buffer:\n" +
    "Rural: " + countLayer1 + " puntos\n" +
    "Pequeña Ciudad: " + countLayer2 + " puntos\n" +
    "Pequeña Ciudad Tipo II: " + countLayer3 + " puntos"
  );
}

// Manejar clic en el botón para aplicar el buffer
document.getElementById('applyBuffer').addEventListener('click', function() {
  var radius = parseFloat(document.getElementById('radius').value);
  if (isNaN(radius) || radius <= 0) {
    alert("Por favor ingresa un radio válido.");
  } else {
    createBuffer(radius,category1Layer,category2Layer,category3Layer);
  }
});

        

