const API_KEY = '7d58ecd9d52094c0cb6f1bd55c6d6a88'; 
const URL_BASE = 'https://api.themoviedb.org/3';
const URL_IMG = 'https://image.tmdb.org/t/p/w500';

let tipoActual = 'movie';
let listaVistas = JSON.parse(localStorage.getItem('mis_vistas')) || [];
let paginaActual = 1;

// --- FILTROS Y CARGA ---

// 2. Modifica la función cargarContenido para que acepte el número de página
async function cargarContenido(generoId = '', anio = '', estadoVista = 'todas', esNuevaCarga = true) {
    const contenedor = document.getElementById('contenedor-principal');
    
    // Si es una búsqueda nueva (cambio de filtro), reseteamos la página y borramos el grid
    if (esNuevaCarga) {
        paginaActual = 1;
        contenedor.innerHTML = '<p>Buscando...</p>';
    }

    let url = `${URL_BASE}/discover/${tipoActual}?api_key=${API_KEY}&language=es-ES&sort_by=popularity.desc&watch_region=ES&with_watch_monetization_types=flatrate&page=${paginaActual}`;
    
    if (generoId) url += `&with_genres=${generoId}`;
    if (anio) {
        const parametroAnio = (tipoActual === 'movie') ? 'primary_release_year' : 'first_air_date_year';
        url += `&${parametroAnio}=${anio}`;
    }

    try {
        const respuesta = await fetch(url);
        const datos = await respuesta.json();
        let resultados = datos.results;

        // Filtramos por vistas/no vistas
        if (estadoVista === 'vistas') {
            resultados = resultados.filter(item => listaVistas.includes(item.id.toString()));
        } else if (estadoVista === 'no-vistas') {
            resultados = resultados.filter(item => !listaVistas.includes(item.id.toString()));
        }

        // Llamamos a dibujar pasándole si debe borrar o añadir
        dibujarCatalogo(resultados, esNuevaCarga);
    } catch (error) {
        console.error("Error:", error);
    }
}


// 3. Modifica dibujarCatalogo para que no borre todo si estamos cargando más
function dibujarCatalogo(lista, borrarAnterior) {
    const contenedor = document.getElementById('contenedor-principal');
    if (borrarAnterior) {
        contenedor.innerHTML = '';
    }

    if (lista.length === 0 && borrarAnterior) {
        contenedor.innerHTML = '<p>No hay títulos que coincidan.</p>';
        return;
    }

    lista.forEach(item => {
        // ... (todo el código interno de la tarjeta igual que antes)
        const titulo = item.title || item.name;
        const id = item.id.toString();
        const estaVista = listaVistas.includes(id);
        const tarjeta = document.createElement('div');
        tarjeta.classList.add('tarjeta');

        tarjeta.innerHTML = `
            <a href="detalle.html?id=${id}&tipo=${tipoActual}">
                <img src="${item.poster_path ? URL_IMG + item.poster_path : 'https://via.placeholder.com/200x300'}" alt="${titulo}">
            </a>
            <div class="info">
                <h3>${titulo}</h3>
                <label>
                    <input type="checkbox" ${estaVista ? 'checked' : ''} onchange="toggleVista('${id}')"> 
                    ${estaVista ? 'Vista' : 'Pendiente'}
                </label>
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });
}

// 4. Nueva función para el botón
function siguientePagina() {
    paginaActual++; // Aumentamos el contador
    const g = document.getElementById('desplegable-generos').value;
    const a = document.getElementById('desplegable-anios').value;
    const v = document.getElementById('desplegable-vistas').value;
    
    // Llamamos a cargarContenido con 'false' para que NO borre lo que ya hay
    cargarContenido(g, a, v, false);
}


// (Las funciones toggleVista, cargarAnios, cambiarTipo y cargarGeneros se mantienen igual que antes)
function toggleVista(id) {
    id = id.toString();
    if (listaVistas.includes(id)) {
        listaVistas = listaVistas.filter(item => item !== id);
    } else {
        listaVistas.push(id);
    }
    localStorage.setItem('mis_vistas', JSON.stringify(listaVistas));
    ejecutarFiltros();
}

function cargarAnios() {
    const selectAnio = document.getElementById('desplegable-anios');
    const anioActual = new Date().getFullYear();
    for (let i = anioActual; i >= 2005; i--) {
        let opcion = document.createElement('option');
        opcion.value = i;
        opcion.textContent = i;
        selectAnio.appendChild(opcion);
    }
}

function cambiarTipo(nuevoTipo) {
    tipoActual = nuevoTipo;
    document.getElementById('titulo-seccion').innerText = tipoActual === 'movie' ? 'Películas' : 'Series';
    document.getElementById('desplegable-generos').value = "";
    document.getElementById('desplegable-anios').value = "";
    cargarGeneros();
    cargarContenido();
}

async function cargarGeneros() {
    const res = await fetch(`${URL_BASE}/genre/${tipoActual}/list?api_key=${API_KEY}&language=es-ES`);
    const datos = await res.json();
    const select = document.getElementById('desplegable-generos');
    select.innerHTML = '<option value="">Todos los géneros</option>';
    datos.genres.forEach(genero => {
        select.innerHTML += `<option value="${genero.id}">${genero.name}</option>`;
    });
}

function ejecutarFiltros() {
    const g = document.getElementById('desplegable-generos').value;
    const a = document.getElementById('desplegable-anios').value;
    const v = document.getElementById('desplegable-vistas').value;
    cargarContenido(g, a, v);
}

cargarAnios();
cambiarTipo('movie');