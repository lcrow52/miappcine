const API_KEY = '7d58ecd9d52094c0cb6f1bd55c6d6a88'; 
const URL_BASE = 'https://api.themoviedb.org/3';
const URL_IMG = 'https://image.tmdb.org/t/p/w500';

let estado = JSON.parse(localStorage.getItem('estado_app')) || {
    tipo: 'both',
    genero: '',
    anio: '',
    vista: 'todas',
    favorito: 'todos',
    busqueda: '',
    pagina: 1
};

let listaVistas = JSON.parse(localStorage.getItem('mis_vistas')) || [];
let listaFavoritos = JSON.parse(localStorage.getItem('mis_favoritos')) || [];

function inicializar() {
    cargarAnios();
    sincronizarInterfaz();
    cargarGeneros();
    cargarContenido(true);
}

function sincronizarInterfaz() {
    document.getElementById('desplegable-generos').value = estado.genero;
    document.getElementById('desplegable-anios').value = estado.anio;
    document.getElementById('desplegable-vistas').value = estado.vista;
    document.getElementById('desplegable-favoritos').value = estado.favorito;
    document.getElementById('input-busqueda').value = estado.busqueda;
    
    document.querySelectorAll('.btn-tipo').forEach(btn => btn.classList.remove('activo'));
    const btnActivo = document.getElementById(`btn-${estado.tipo}`);
    if (btnActivo) btnActivo.classList.add('activo');

    const titulos = { 'movie': 'Películas', 'tv': 'Series', 'both': 'Cine y Series' };
    document.getElementById('titulo-seccion').innerText = titulos[estado.tipo];
}

async function cargarContenido(esNuevaCarga = true) {
    const contenedor = document.getElementById('contenedor-principal');
    const MINIMO = 12;
    let resultadosAcumulados = [];
    
    // Si buscamos favoritos, ampliamos el límite de búsqueda para encontrar los títulos guardados
    const limitePaginas = estado.favorito === 'solo-favoritos' ? 50 : 15;

    if (esNuevaCarga) {
        estado.pagina = 1;
        contenedor.innerHTML = '<p style="padding:20px;">Escaneando tu biblioteca...</p>';
    }

    try {
        while (resultadosAcumulados.length < MINIMO && estado.pagina <= limitePaginas) {
            let tiposABuscar = estado.tipo === 'both' ? ['movie', 'tv'] : [estado.tipo];
            let resultadosTemporales = [];

            for (let t of tiposABuscar) {
                let url = "";
                if (estado.busqueda) {
                    url = `${URL_BASE}/search/${t}?api_key=${API_KEY}&language=es-ES&query=${encodeURIComponent(estado.busqueda)}&page=${estado.pagina}`;
                } else {
                    url = `${URL_BASE}/discover/${t}?api_key=${API_KEY}&language=es-ES&sort_by=popularity.desc&watch_region=ES&with_watch_monetization_types=flatrate&page=${estado.pagina}`;
                    if (estado.genero) url += `&with_genres=${estado.genero}`;
                    if (estado.anio) url += t === 'movie' ? `&primary_release_year=${estado.anio}` : `&first_air_date_year=${estado.anio}`;
                }

                const res = await fetch(url);
                const data = await res.json();
                if (data.results) {
                    data.results.forEach(i => i.media_type_manual = t);
                    resultadosTemporales = [...resultadosTemporales, ...data.results];
                }
            }

            // APLICAR FILTROS (Vistas y Favoritos)
            let filtrados = resultadosTemporales;

            if (estado.vista === 'vistas') {
                filtrados = filtrados.filter(i => listaVistas.includes(i.id.toString()));
            } else if (estado.vista === 'no-vistas') {
                filtrados = filtrados.filter(i => !listaVistas.includes(i.id.toString()));
            }

            if (estado.favorito === 'solo-favoritos') {
                filtrados = filtrados.filter(i => listaFavoritos.includes(i.id.toString()));
            }

            resultadosAcumulados = [...resultadosAcumulados, ...filtrados];

            // Si no hemos llenado la pantalla, saltamos a la siguiente página de la API
            if (resultadosAcumulados.length < MINIMO) {
                estado.pagina++;
            } else {
                break;
            }
        }

        dibujarCatalogo(resultadosAcumulados, esNuevaCarga);
        localStorage.setItem('estado_app', JSON.stringify(estado));

    } catch (e) { console.error("Error en carga:", e); }
}

function dibujarCatalogo(lista, borrarAnterior) {
    const contenedor = document.getElementById('contenedor-principal');
    if (borrarAnterior) contenedor.innerHTML = '';

    if (lista.length === 0 && borrarAnterior) {
        contenedor.innerHTML = '<p style="padding:20px;">No hay resultados. Prueba a cambiar los filtros o a cargar más páginas.</p>';
        return;
    }

    // Eliminar duplicados si los hubiera (común al mezclar tipos)
    const listaUnica = Array.from(new Map(lista.map(item => [item.id, item])).values());

    listaUnica.forEach(item => {
        const id = item.id.toString();
        const tipo = item.media_type_manual;
        const estaV = listaVistas.includes(id);
        const esF = listaFavoritos.includes(id);
        const tarjeta = document.createElement('div');
        tarjeta.classList.add('tarjeta');

        tarjeta.innerHTML = `
            <a href="detalle.html?id=${id}&tipo=${tipo}">
                <img src="${item.poster_path ? URL_IMG + item.poster_path : 'https://via.placeholder.com/200x300'}" alt="poster">
            </a>
            <div class="info">
                <h3>${item.title || item.name}</h3>
                <div class="acciones" style="display:flex; justify-content:space-between; margin-top:10px; font-size:0.75rem;">
                    <label style="cursor:pointer;"><input type="checkbox" ${estaV?'checked':''} onchange="toggleVista('${id}', event)"> ${estaV?'Vista':'Pendiente'}</label>
                    <label style="cursor:pointer; color:${esF?'#ff4757':'#ccc'}"><input type="checkbox" ${esF?'checked':''} onchange="toggleFavorito('${id}', event)"> ${esF?'❤️ Fav':'♡ Fav'}</label>
                </div>
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });
}

// --- RESTO DE FUNCIONES (IGUALES) ---
function ejecutarFiltros() {
    estado.genero = document.getElementById('desplegable-generos').value;
    estado.anio = document.getElementById('desplegable-anios').value;
    estado.vista = document.getElementById('desplegable-vistas').value;
    estado.favorito = document.getElementById('desplegable-favoritos').value;
    cargarContenido(true);
}

function ejecutarBusqueda() {
    estado.busqueda = document.getElementById('input-busqueda').value;
    cargarContenido(true);
}

function cambiarTipo(t) {
    estado.tipo = t;
    sincronizarInterfaz();
    cargarGeneros();
    cargarContenido(true);
}

function reiniciarFiltros() {
    estado = { tipo: 'both', genero: '', anio: '', vista: 'todas', favorito: 'todos', busqueda: '', pagina: 1 };
    sincronizarInterfaz();
    cargarGeneros();
    cargarContenido(true);
}

function siguientePagina() {
    estado.pagina++;
    cargarContenido(false);
}

function toggleVista(id, event) {
    id = id.toString();
    listaVistas.includes(id) ? listaVistas = listaVistas.filter(i => i !== id) : listaVistas.push(id);
    localStorage.setItem('mis_vistas', JSON.stringify(listaVistas));
    event.target.parentElement.lastChild.textContent = event.target.checked ? ' Vista' : ' Pendiente';
}

function toggleFavorito(id, event) {
    id = id.toString();
    listaFavoritos.includes(id) ? listaFavoritos = listaFavoritos.filter(i => i !== id) : listaFavoritos.push(id);
    localStorage.setItem('mis_favoritos', JSON.stringify(listaFavoritos));
    const label = event.target.parentElement;
    label.style.color = event.target.checked ? '#ff4757' : '#ccc';
    label.lastChild.textContent = event.target.checked ? ' ❤️ Fav' : ' ♡ Fav';
}

async function cargarGeneros() {
    const t = (estado.tipo === 'both' || estado.tipo === '') ? 'movie' : estado.tipo;
    const res = await fetch(`${URL_BASE}/genre/${t}/list?api_key=${API_KEY}&language=es-ES`);
    const data = await res.json();
    const select = document.getElementById('desplegable-generos');
    select.innerHTML = '<option value="">Todos los géneros</option>';
    data.genres.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = g.name;
        if(g.id == estado.genero) opt.selected = true;
        select.appendChild(opt);
    });
}

function cargarAnios() {
    const select = document.getElementById('desplegable-anios');
    for (let i = 2026; i >= 2005; i--) {
        select.innerHTML += `<option value="${i}">${i}</option>`;
    }
}

inicializar();
