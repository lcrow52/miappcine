const API_KEY = '7d58ecd9d52094c0cb6f1bd55c6d6a88'; 
const URL_BASE = 'https://api.themoviedb.org/3';
const URL_IMG = 'https://image.tmdb.org/t/p/w500';

let tipoActual = 'movie';
let paginaActual = 1;
let listaVistas = JSON.parse(localStorage.getItem('mis_vistas')) || [];
let listaFavoritos = JSON.parse(localStorage.getItem('mis_favoritos')) || [];

async function cargarContenido(generoId = '', anio = '', estadoVista = 'todas', esNuevaCarga = true, estadoFavorito = 'todos') {
    const contenedor = document.getElementById('contenedor-principal');
    if (esNuevaCarga) {
        paginaActual = 1;
        contenedor.innerHTML = '<p>Buscando en plataformas...</p>';
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

        // Filtro Vistas
        if (estadoVista === 'vistas') {
            resultados = resultados.filter(item => listaVistas.includes(item.id.toString()));
        } else if (estadoVista === 'no-vistas') {
            resultados = resultados.filter(item => !listaVistas.includes(item.id.toString()));
        }

        // Filtro Favoritos
        if (estadoFavorito === 'solo-favoritos') {
            resultados = resultados.filter(item => listaFavoritos.includes(item.id.toString()));
        }

        dibujarCatalogo(resultados, esNuevaCarga);
    } catch (error) {
        console.error("Error cargando contenido:", error);
    }
}

function dibujarCatalogo(lista, borrarAnterior) {
    const contenedor = document.getElementById('contenedor-principal');
    if (borrarAnterior) contenedor.innerHTML = '';

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
                    <label style="cursor:pointer;">
                        <input type="checkbox" ${estaVista ? 'checked' : ''} onchange="toggleVista('${id}')"> 
                        ${estaVista ? 'Vista' : 'Pendiente'}
                    </label>
                    <label style="cursor:pointer; color: ${esFavorito ? '#ff4757' : '#ccc'}">
                        <input type="checkbox" ${esFavorito ? 'checked' : ''} onchange="toggleFavorito('${id}')"> 
                        ${esFavorito ? '❤️ Fav' : '♡ Fav'}
                    </label>
                </div>
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });
}

function toggleVista(id) {
    id = id.toString();
    listaVistas.includes(id) ? listaVistas = listaVistas.filter(i => i !== id) : listaVistas.push(id);
    localStorage.setItem('mis_vistas', JSON.stringify(listaVistas));
    ejecutarFiltros();
}

function toggleFavorito(id) {
    id = id.toString();
    listaFavoritos.includes(id) ? listaFavoritos = listaFavoritos.filter(i => i !== id) : listaFavoritos.push(id);
    localStorage.setItem('mis_favoritos', JSON.stringify(listaFavoritos));
    ejecutarFiltros();
}

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
    cargarGeneros();
    cargarContenido();
}

async function cargarGeneros() {
    const res = await fetch(`${URL_BASE}/genre/${tipoActual}/list?api_key=${API_KEY}&language=es-ES`);
    const datos = await res.json();
    const select = document.getElementById('desplegable-generos');
    select.innerHTML = '<option value="">Todos los géneros</option>';
    datos.genres.forEach(g => select.innerHTML += `<option value="${g.id}">${g.name}</option>`);
}

function cargarAnios() {
    const select = document.getElementById('desplegable-anios');
    for (let i = new Date().getFullYear(); i >= 2005; i--) {
        select.innerHTML += `<option value="${i}">${i}</option>`;
    }
}

cargarAnios();
cambiarTipo('movie');
