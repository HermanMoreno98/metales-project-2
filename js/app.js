// Crear el mapa
var map = L.map('map').setView([-9.19, -75.0152], 5);

// Definir capas base (Base layers)
var baseMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: 'OpenStreetMap'
}).addTo(map);

var esri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18,
    attribution: 'Esri'
});

var terrain = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: 'OpenTopoMap'
});

// Definir capas de superposición (Overlay layers) 
var departamento = L.layerGroup();  // Estas capas pueden tener contenido
var provincia = L.layerGroup();
var distrito = L.layerGroup();
var reservorio = L.layerGroup();
var captacion = L.layerGroup();
var ptap = L.layerGroup();
var rios = L.layerGroup();
var sectores = L.layerGroup();
var rios = L.layerGroup();
var ana_uh = L.layerGroup();

function addGeoJSONLayer(url, objectName, styleOptions, labelProperty, layer, selectedDept, applyFilter = false, labelPrueba = null, tooltipProperty = null) {
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



function toggleGeoJSONLayer(layer) {
    if (map.hasLayer(layer)) {
        map.removeLayer(layer);
    } else {
        map.addLayer(layer);
    }
}

// // Llamar a la función para agregar las capas GeoJSON con estilos personalizados
// var layerStyles = {
//     geojsonLayer: {
//         color: "black",
//         weight: 3,
//         opacity: 1,
//         fillOpacity: 0
//     },
//     geojsonLayerProv: {
//         color: "black",
//         weight: 2,
//         opacity: 1,
//         fillOpacity: 0
//     },
//     geojsonLayerDist: {
//         color: "black",
//         weight: 1,
//         opacity: 1,
//         fillOpacity: 0,
//         dashArray: "5, 5"
//     },
//     geojsonSectores: {
//         color: "red",
//         weight: 2,
//         opacity: 1,
//         fillOpacity: 0.5
//     }
// };


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
                    {color: 'blue', weight: 2}, // Estilo de los polígonos
                    'nomdep', // Propiedad a filtrar
                    sectores, // Capa en el mapa donde se añadirá el geojson
                    selectedDept, // Departamento seleccionado
                    applyFilter = true,
                    null,
                    null
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
                    'https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/Capas/dist.json', 
                    'dist', 
                    {color: 'black', weight: 1, opacity: 1, fillOpacity: 0, dashArray: "5, 5"}, 
                    'nomdep', // Propiedad a filtrar
                    distrito, // Capa en el mapa donde se añadirá el geojson
                    selectedDept, // Departamento seleccionado
                    applyFilter = true,
                    'nomdist',null
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
                    {color: 'cyan', weight: 1, opacity: 0.5, fillOpacity: 0.4}, 
                    'nomdep', // Propiedad a filtrar
                    ana_uh, // Capa en el mapa donde se añadirá el geojson
                    selectedDept, // Departamento seleccionado
                    applyFilter = false,
                    'nombre',null
                );
            }
        });
    } else {
        console.error("No se encontró el elemento con id 'departamento'.");
    }
});

// Crear el control de capas con etiquetas HTML e íconos
L.control.layers(
    {
        "Base Map": baseMap,
        "Esri": esri,
        "Terrain": terrain
    },
    {
        "Departamento": departamento,
        "Provincia": provincia,
        "Distrito<hr><strong>Infraestructura de saneamiento:</strong>": distrito,
        "Reservorio <img src='https://cdn-icons-png.flaticon.com/512/1843/1843893.png' width='20' height='20'>": reservorio,
        "Captacion <img src='https://cdn-icons-png.flaticon.com/512/5371/5371132.png' width='20' height='20'>": captacion,
        "PTAP <img src='https://cdn-icons-png.flaticon.com/512/8846/8846576.png' width='20' height='20'>": ptap,
        "Rios <img src='https://www.kingtony.com/upload/products/87D11-071A-B_v.jpg' width='20' height='20'>": rios,
        "Sectores": sectores, "Ana - UH": ana_uh
    }
).addTo(map);



var reservoirIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1843/1843893.png',
    iconSize: [30, 30], // Tamaño del ícono
    iconAnchor: [15, 30], // Punto de anclaje del ícono (donde se coloca en el marcador)
    popupAnchor: [0, -30] // Punto de anclaje del popup del marcador
});
var geojsonLayers = {};



 // Asegúrate de que la propiedad de etiqueta sea 'name'


// Función para alternar la visibilidad del sidebar
function toggleSidebar() {
    var sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
}

function fetchReservoirData() {
    return fetch('https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/Informacio%CC%81_sobre_reservorios_EPS_2.csv')
        .then(response => response.text())
        .then(data => {
            // Parsear CSV usando PapaParse
            let parsedData = Papa.parse(data, { header: true }).data;
            
            // Filtrar filas vacías
            parsedData = parsedData.filter(row => Object.values(row).some(value => value !== ''));

            // // Obtener opciones únicas para cada select
            // let departamentos = [...new Set(parsedData.map(item => item.ODS))];
            // let eps = [...new Set(parsedData.map(item => item.Nombre_EPS))];
            // let localidades = [...new Set(parsedData.map(item => item.Localidad))];
            // let reservorios = [...new Set(parsedData.map(item => item.Nombre_Reservorio))];
            // let ccpps = [...new Set(parsedData.map(item => item.CCPP))];

            // // Actualizar opciones de los select
            // updateSelectOptions('departamento', departamentos);
            // updateSelectOptions('eps', eps);
            // updateSelectOptions('localidad', localidades);
            // updateSelectOptions('reservorio', reservorios);
            // updateSelectOptions('ccpp', ccpps);

            console.log(parsedData); // Para ver los datos parseados en la consola
            return parsedData;
        })
        .catch(error => {
            console.error('Error fetching or parsing the data:', error);
        });
}


let markersLayer = L.layerGroup();
// Función para agregar marcadores de reservorio con popups personalizados
function addReservoirMarkers(data) {
    markersLayer.clearLayers();
    let validMarkers = [];
    data.forEach(function(feature) {
        // Verificar que las coordenadas sean válidas
        if (!isNaN(feature.X) && !isNaN(feature.Y)) {
            var marker = L.marker([parseFloat(feature.X), parseFloat(feature.Y)], { icon: reservoirIcon })
                .bindPopup(
                    "<div style='max-height:300px; overflow-y:auto; overflow-x:auto;'>" +
                    "<table class='popup-table'>" +
                    "<tr><th>Nombre del Reservorio</th><td>" + feature.Nombre_Reservorio + "</td></tr>" +
                    "<tr><th>Estado del Reservorio</th><td>" + feature['Estado.Operativo'] + "</td></tr>" +
                    "<tr><th>Tipo de Reservorio</th><td>" + feature['Tipo.de.Reservorio'] + "</td></tr>" +
                    "<tr><th>Volumen de Reservorio (m3)</th><td>" + feature['Volumen.Reservorio..m3.'] + "</td></tr>" +
                    "<tr><th>Material del Reservorio</th><td>" + feature.Material + "</td></tr>" +
                    "<tr><th>Foto panorámica</th><td><a href='" + feature.Foto_panoramica + "' target='_blank'><img src='" + feature.Foto_panoramica + "' style='width:200px;'></a></td></tr>" +
                    "<tr><th>Foto de la tapa</th><td><a href='" + feature.Foto_tapa + "' target='_blank'><img src='" + feature.Foto_tapa + "' style='width:200px;'></a></td></tr>" +
                    "<tr><th>Foto del estado</th><td><a href='" + feature.Foto_estado + "' target='_blank'><img src='" + feature.Foto_estado + "' style='width:200px;'></a></td></tr>" +
                    "</table>" +
                    "</div>"
                );
            markersLayer.addLayer(marker);
            // Agregar coordenadas válidas al arreglo
            validMarkers.push([parseFloat(feature.X), parseFloat(feature.Y)]);
            console.log(validMarkers)
        }
    });

    markersLayer.addTo(map);

    // Ajustar el zoom y centrar el mapa en los marcadores válidos
    if (validMarkers.length > 0) {
    map.fitBounds(validMarkers);
}
}


// Variable para almacenar los datos del CSV
let reservoriosData = [];

// Función para cargar datos desde CSV y poblar los select
function loadAndPopulateSelects() {
    fetch('https://raw.githubusercontent.com/HermanMoreno98/DATA_DASH/main/Informacio%CC%81_sobre_reservorios_EPS_2.csv')
        .then(response => response.text())
        .then(data => {
            // Parsear CSV usando PapaParse
            reservoriosData = Papa.parse(data, { header: true }).data;

            // Filtrar filas vacías
            reservoriosData = reservoriosData.filter(row => Object.values(row).some(value => value !== ''));

            // Obtener opciones únicas para el primer select (departamento)
            let departamentos = [...new Set(reservoriosData.map(item => item.ODS))];
            updateSelectOptions('departamento', departamentos);

            // Poblar EPS, localidad y reservorio con todas las opciones
            updateSelectOptions('eps', []);
            updateSelectOptions('localidad', []);
            updateSelectOptions('reservorio', []);
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
    updateSelectOptions('eps', []);
    updateSelectOptions('localidad', []);
    updateSelectOptions('ccpp', []);
    updateSelectOptions('reservorio', []);
    addReservoirMarkers(reservoriosData);
}

// Event listener para el botón de resetear filtros
document.getElementById('reset_filters').addEventListener('click', function () {
    resetFilters();
});

// Event listeners para cambios en los selects
document.addEventListener('DOMContentLoaded', function () {
    loadAndPopulateSelects();

    let selectedDepartamento = "";  // Variable global para almacenar el departamento seleccionado
    let selectedEps = "";  // Variable global para almacenar el eps seleccionado
    let selectedLocalidad = "";  // Variable global para almacenar la localidad seleccionada
    let selectedCCPP = "";  // Variable global para almacenar el ccpp seleccionado

    document.getElementById('departamento').addEventListener('change', function () {
        selectedDepartamento = this.value;
        selectedEps = "";  // Reinicia el EPS seleccionado
        selectedLocalidad = "";  // Reinicia la localidad seleccionada
        selectedCCPP = "";  // Reinicia el CCPP seleccionado
        if (selectedDepartamento === "" || selectedDepartamento === "Seleccione todos los departamentos") {
            addReservoirMarkers(reservoriosData);
            updateSelectOptions('eps', []);
            updateSelectOptions('localidad', []);
            updateSelectOptions('ccpp', []);
            updateSelectOptions('reservorio', []);
        } else {
            let filteredData = reservoriosData.filter(item => item.ODS === selectedDepartamento);
            addReservoirMarkers(filteredData);
            filterAndUpdateSelect('eps', 'ODS', selectedDepartamento, 'Nombre_EPS');
            updateSelectOptions('localidad', []);
            updateSelectOptions('ccpp', []);
            updateSelectOptions('reservorio', []);
        }
    });

    document.getElementById('eps').addEventListener('change', function () {
        selectedEps = this.value;
        selectedLocalidad = "";  // Reinicia la localidad seleccionada
        selectedCCPP = "";  // Reinicia el CCPP seleccionado
        if (selectedEps === "" || selectedEps === "Seleccione un eps") {
            if (selectedDepartamento === "" || selectedDepartamento === "Seleccione todos los departamentos") {
                addReservoirMarkers(reservoriosData);
            } else {
                let filteredData = reservoriosData.filter(item => item.ODS === selectedDepartamento);
                addReservoirMarkers(filteredData);
            }
            updateSelectOptions('localidad', []);
            updateSelectOptions('ccpp', []);
            updateSelectOptions('reservorio', []);
        } else {
            let filteredData = reservoriosData.filter(item => item.Nombre_EPS === selectedEps && item.ODS === selectedDepartamento);
            addReservoirMarkers(filteredData);
            filterAndUpdateSelect('localidad', 'Nombre_EPS', selectedEps, 'Localidad');
            updateSelectOptions('ccpp', []);
            updateSelectOptions('reservorio', []);
        }
    });

    document.getElementById('localidad').addEventListener('change', function () {
        selectedLocalidad = this.value;
        selectedCCPP = "";  // Reinicia el CCPP seleccionado
        if (selectedLocalidad === "" || selectedLocalidad === "Seleccione un localidad") {
            if (selectedEps === "" || selectedEps === "Seleccione un eps") {
                if (selectedDepartamento === "" || selectedDepartamento === "Seleccione todos los departamentos") {
                    addReservoirMarkers(reservoriosData);
                } else {
                    let filteredData = reservoriosData.filter(item => item.ODS === selectedDepartamento);
                    addReservoirMarkers(filteredData);
                }
            } else {
                let filteredData = reservoriosData.filter(item => item.Nombre_EPS === selectedEps && item.ODS === selectedDepartamento);
                addReservoirMarkers(filteredData);
            }
            updateSelectOptions('ccpp', []);
            updateSelectOptions('reservorio', []);
        } else {
            let filteredData = reservoriosData.filter(item => item.Localidad === selectedLocalidad && item.Nombre_EPS === selectedEps && item.ODS === selectedDepartamento);
            addReservoirMarkers(filteredData);
            filterAndUpdateSelect('ccpp', 'Localidad', selectedLocalidad, 'CCPP');
            updateSelectOptions('reservorio', []);
        }
    });

    document.getElementById('ccpp').addEventListener('change', function () {
        selectedCCPP = this.value;
        if (selectedCCPP === "" || selectedCCPP === "Seleccione un ccpp") {
            if (selectedLocalidad === "" || selectedLocalidad === "Seleccione un localidad") {
                if (selectedEps === "" || selectedEps === "Seleccione un eps") {
                    if (selectedDepartamento === "" || selectedDepartamento === "Seleccione todos los departamentos") {
                        addReservoirMarkers(reservoriosData);
                    } else {
                        let filteredData = reservoriosData.filter(item => item.ODS === selectedDepartamento);
                        addReservoirMarkers(filteredData);
                    }
                } else {
                    let filteredData = reservoriosData.filter(item => item.Nombre_EPS === selectedEps && item.ODS === selectedDepartamento);
                    addReservoirMarkers(filteredData);
                }
            } else {
                let filteredData = reservoriosData.filter(item => item.Localidad === selectedLocalidad && item.Nombre_EPS === selectedEps && item.ODS === selectedDepartamento);
                addReservoirMarkers(filteredData);
            }
            updateSelectOptions('reservorio', []);
        } else {
            let filteredData = reservoriosData.filter(item => item.CCPP === selectedCCPP && item.Localidad === selectedLocalidad && item.Nombre_EPS === selectedEps && item.ODS === selectedDepartamento);
            addReservoirMarkers(filteredData);
            filterAndUpdateSelect('reservorio', 'CCPP', selectedCCPP, 'Nombre_Reservorio');
        }
    });

    document.getElementById('reservorio').addEventListener('change', function () {
        let reservorio = this.value;

        if (reservorio === "" || reservorio === "Seleccione un reservorio") {
            if (selectedCCPP === "" || selectedCCPP === "Seleccione un ccpp") {
                if (selectedLocalidad === "" || selectedLocalidad === "Seleccione un localidad") {
                    if (selectedEps === "" || selectedEps === "Seleccione un eps") {
                        if (selectedDepartamento === "" || selectedDepartamento === "Seleccione todos los departamentos") {
                            addReservoirMarkers(reservoriosData);
                        } else {
                            let filteredData = reservoriosData.filter(item => item.ODS === selectedDepartamento);
                            addReservoirMarkers(filteredData);
                        }
                    } else {
                        let filteredData = reservoriosData.filter(item => item.Nombre_EPS === selectedEps && item.ODS === selectedDepartamento);
                        addReservoirMarkers(filteredData);
                    }
                } else {
                    let filteredData = reservoriosData.filter(item => item.Localidad === selectedLocalidad && item.Nombre_EPS === selectedEps && item.ODS === selectedDepartamento);
                    addReservoirMarkers(filteredData);
                }
            } else {
                let filteredData = reservoriosData.filter(item => item.CCPP === selectedCCPP && item.Localidad === selectedLocalidad && item.Nombre_EPS === selectedEps && item.ODS === selectedDepartamento);
                addReservoirMarkers(filteredData);
            }
        } else {
            let filteredData = reservoriosData.filter(item => item.Nombre_Reservorio === reservorio && item.CCPP === selectedCCPP && item.Localidad === selectedLocalidad && item.Nombre_EPS === selectedEps && item.ODS === selectedDepartamento);
            addReservoirMarkers(filteredData);
        }
    });

    addReservoirMarkers(reservoriosData);




    const btnClick = document.getElementById('icon-despliegue');

    btnClick.addEventListener('click',()=>{
        btnClick.classList.toggle('lista-click');
        capasBtn.classList.remove('list-open');
        check.classList.remove('check-list');
    });
    const btnSidebar = document.getElementById('btn');
    btnSidebar.addEventListener('click',()=>{
        document.body.classList.toggle('close-sidebar');
    });
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












        

