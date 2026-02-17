const API_KEY = '7d58ecd9d52094c0cb6f1bd55c6d6a88'; 
const URL_BASE = 'https://api.themoviedb.org/3';
const URL_IMG = 'https://image.tmdb.org/t/p/w500';

let tipoActual = 'movie';
let paginaActual = 1;
let listaVistas = JSON.parse(localStorage.getItem('mis_vistas')) || [];
let listaFavoritos = JSON.parse(localStorage.getItem('mis_favoritos')) || [];

// --- CARGA DE DATOS ---
async function cargarContenido(generoId = '', anio = '', estadoVista = 'todas', esNuevaCarga = true, estadoFavorito = 'todos') {
    const contenedor = document.getElementById('contenedor-principal');
    
    if (esNuevaCarga) {
        paginaActual = 1;
        contenedor.innerHTML = '<p style="padding:20px;">Buscando en plataformas de España...</p>';
    }

    // Filtros de región España y disponibilidad en plataformas
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

        // Filtro de Vistas/Pendientes
        if (estadoVista === 'vistas') {
            resultados = resultados.filter(item => listaVistas.includes(item.id.toString()));
        } else if (estadoVista === 'no-vistas') {
            resultados = resultados.filter(item => !listaVistas.includes(item.id.toString()));
        }

        // Filtro de Favoritos
        if (estadoFavorito === 'solo-favoritos') {
            resultados = resultados.filter(item => listaFavoritos.includes(item.id.toString()));
        }

        dibujarCatalogo(resultados, esNuevaCarga);
    } catch (error) {
        console.error("Error cargando contenido:", error);
    }
}

// --- DIBUJAR EN PANTALLA ---
function dibujarCatalogo(lista, borrarAnterior) {
    const contenedor = document.getElementById('contenedor-principal');
    if (borrarAnterior) contenedor.innerHTML = '';

    if (lista.length === 0 && borrarAnterior) {
        contenedor.innerHTML = '<p style="padding:20px;">No se encontraron resultados con estos filtros.</p>';
        return;
    }

    lista.forEach(item => {
        const titulo = item.title || item.name;
        const id = item.id.toString();
        const estaVista = listaVistas.includes(id);
        const esFavorito = listaFavoritos.includes(id);
        
        const tarjeta = document.createElement('div');
        tarjeta.classList.add('tarjeta');
        tarjeta.innerHTML = `
            <a href="detalle.html?id=${id}&tipo=${tipoActual}">
                <img src="${item.poster_path ? URL_IMG + item.poster_path : 'https://via.placeholder.com/200x300'}" alt="${titulo}">
            </a>
            <div class="info">
                <h3>${titulo}</h3>
                <div class="acciones" style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 0.8rem;">
                    <label style="cursor:pointer; display: flex; align-items: center; gap: 4px;">
                        <input type="checkbox" ${estaVista ? 'checked' : ''} onchange="toggleVista('${id}', event)"> 
                        <span>${estaVista ? ' Vista' : ' Pendiente'}</span>
                    </label>
                    <label style="cursor:pointer; display: flex; align-items: center; gap: 4px; color: ${esFavorito ? '#ff4757' : '#ccc'}">
                        <input type="checkbox" ${esFavorito ? 'checked' : ''} onchange="toggleFavorito('${id}', event)"> 
                        <span>${esFavorito ? ' ❤️ Fav' : ' ♡ Fav'}</span>
                    </label>
                </div>
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });
}

// --- FUNCIONES DE MEMORIA (SIN RECARGA DE SCROLL) ---
function toggleVista(id, event) {
    id = id.toString();
    const checkbox = event.target;
    const textoSpan = checkbox.nextElementSibling;

    if (listaVistas.includes(id)) {
        listaVistas = listaVistas.filter(i => i !== id);
        textoSpan.textContent = ' Pendiente';
    } else {
        listaVistas.push(id);
        textoSpan.textContent = ' Vista';
    }
    localStorage.setItem('mis_vistas', JSON.stringify(listaVistas));
    // No llamamos a ejecutarFiltros() para evitar el salto de scroll
}

function toggleFavorito(id, event) {
    id = id.toString();
    const checkbox = event.target;
    const label = checkbox.parentElement;
    const textoSpan = checkbox.nextElementSibling;

    if (listaFavoritos.includes(id)) {
        listaFavoritos = listaFavoritos.filter(i => i !== id);
        label.style.color = '#ccc';
        textoSpan.textContent = ' ♡ Fav';
    } else {
        listaFavoritos.push(id);
        label.style.color = '#ff4757';
        textoSpan.textContent = ' ❤️ Fav';
    }
    localStorage.setItem('mis_favoritos', JSON.stringify(listaFavoritos));
    // No llamamos a ejecutarFiltros() para evitar el salto de scroll
}

// --- FILTROS Y NAVEGACIÓN ---
function ejecutarFiltros() {
    const g = document.getElementById('desplegable-generos').value;
    const a = document.getElementById('desplegable-anios').value;
    const v = document.getElementById('desplegable-vistas').value;
    const f = document.getElementById('desplegable-favoritos').value;
    cargarContenido(g, a, v, true, f);
}

function siguientePagina() {
    paginaActual++;
    const g = document.getElementById('desplegable-generos').value;
    const a = document.getElementById('desplegable-anios').value;
    const v = document.getElementById('desplegable-vistas').value;
    const f = document.getElementById('desplegable-favoritos').value;
    cargarContenido(g, a, v, false, f);
}

function cambiarTipo(nuevoTipo) {
    tipoActual = nuevoTipo;
    document.getElementById('titulo-seccion').innerText = tipoActual === 'movie' ? 'Películas' : 'Series';
    // Limpiamos filtros al cambiar de tipo
    document.getElementById('desplegable-generos').value = "";
    document.getElementById('desplegable-anios').value = "";
    document.getElementById('desplegable-vistas').value = "todas";
    document.getElementById('desplegable-favoritos').value = "todos";
    cargarGeneros();
    cargarContenido();
}

async function cargarGeneros() {
    const res = await fetch(`${URL_BASE}/genre/${tipoActual}/list?api_key=${API_KEY}&language=es-ES`);
    const datos = await res.json();
    const select = document.getElementById('desplegable-generos');
    select.innerHTML = '<option value="">Todos los géneros</option>';
    datos.genres.forEach(g => {
        select.innerHTML += `<option value="${g.id}">${g.name}</option>`;
    });
}

function cargarAnios() {
    const select = document.getElementById('desplegable-anios');
    for (let i = new Date().getFullYear(); i >= 2005; i--) {
        select.innerHTML += `<option value="${i}">${i}</option>`;
    }
}

// Inicio de la App
cargarAnios();
cambiarTipo('movie');
