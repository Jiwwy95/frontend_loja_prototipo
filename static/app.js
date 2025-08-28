(function () {
  const $ = (sel) => document.querySelector(sel);
  const resultsEl = $('#results');
  const emptyStateEl = $('#emptyState');
  const itineraryCountEl = $('#itineraryCount');

  const detailsModalEl = document.getElementById('detailsModal');
  const detailsTitle = document.getElementById('detailsTitle');
  const detailsImage = document.getElementById('detailsImage');
  const detailsDescription = document.getElementById('detailsDescription');
  const detailsPrice = document.getElementById('detailsPrice');
  const detailsPlaces = document.getElementById('detailsPlaces');
  const btnAddFromModal = document.getElementById('btnAddFromModal');

  // Itinerario en localStorage
  function getItinerary(){ try { return JSON.parse(localStorage.getItem('itinerary')||'[]'); } catch { return []; } }
  function setItinerary(items){ localStorage.setItem('itinerary', JSON.stringify(items)); itineraryCountEl.textContent = 'Itinerario: ' + items.length; }
  setItinerary(getItinerary());

  // Mapa simple de jergas
  const JERGAS_MAP = {
    'barato': ['barato','económico','low cost','ahorrativo'],
    'tranquilo': ['tranqui','relax','relajado','chill'],
    'café': ['café','cafetería','coffee','cafe','cafes', 'cafés'],
    'museo': ['museo','museos','cultura'],
    'naturaleza': ['naturaleza','verde','aire libre','sendero','parque']
  };

  function buildQuery(){
    const q = ($('#query').value || '').trim().toLowerCase();
    const budget = document.getElementById('budget').value;
    const duration = document.getElementById('duration').value;
    let expanded = q;
    for (const key in JERGAS_MAP){ if (q.includes(key)) expanded += ' ' + JERGAS_MAP[key].join(' '); }
    return { q, expanded, budget, duration };
  }

  function cardTemplate(route){
    const img = route.imagen || './static/img/placeholder.png';
    const lugares = (route.lugares || []).slice(0,3).join(' · ');
    const price = (typeof route.precio_estimado === 'number') ? ('$' + route.precio_estimado) : (route.precio_estimado || '—');
    return `
    <div class="col-12 col-md-6 col-lg-4">
      <div class="card h-100 shadow-sm">
        <img src="${img}" class="card-img-top" alt="Imagen de ${route.nombre||'Ruta'}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${route.nombre || 'Ruta sin nombre'}</h5>
          <p class="card-text small text-muted mb-2">${route.descripcion || ''}</p>
          <p class="small mb-2"><strong>Lugares:</strong> ${lugares || '—'}</p>
          <p class="fw-semibold mb-3"><strong>Precio estimado:</strong> ${price}</p>
          <div class="mt-auto d-flex gap-2">
            <button class="btn btn-outline-info btn-sm" data-action="ver-mas" data-id="${route.id}">Ver más</button>
            <button class="btn btn-success btn-sm" data-action="agregar" data-id="${route.id}">Agregar a itinerario</button>
          </div>
        </div>
      </div>
    </div>`;
  }

  function render(routes){
    if (!routes || routes.length === 0){ resultsEl.innerHTML=''; emptyStateEl.classList.remove('d-none'); return; }
    emptyStateEl.classList.add('d-none');
    resultsEl.innerHTML = routes.map(cardTemplate).join('');
  }

  function openDetails(route){
    detailsTitle.textContent = route.nombre || 'Ruta';
    detailsImage.src = route.imagen || './static/img/placeholder.png';
    detailsDescription.textContent = route.descripcion || '';
    detailsPrice.textContent = 'Precio estimado: ' + ((typeof route.precio_estimado === 'number') ? ('$' + route.precio_estimado) : (route.precio_estimado || '—'));
    detailsPlaces.innerHTML = (route.lugares || []).map(l => '<li>'+l+'</li>').join('');
    btnAddFromModal.onclick = () => addToItinerary(route);
    const modal = new bootstrap.Modal(detailsModalEl);
    modal.show();
  }

  function addToItinerary(route){
    const items = getItinerary();
    if (!items.find(r => String(r.id) === String(route.id))){
      items.push({ id: route.id, nombre: route.nombre, precio: route.precio_estimado });
      setItinerary(items);
    }
  }

  function adapt(data){
    return (data || []).map((r, idx) => ({
      id: r.id || r._id || (idx + 1),
      nombre: r.nombre || r.name || 'Ruta sin nombre',
      categorias: r.categorias || r.categories || [],
      lugares: r.lugares || r.places || [],
      precio_estimado: (typeof r.precio_estimado !== 'undefined') ? r.precio_estimado : (r.price || '—'),
      descripcion: r.descripcion || r.description || '',
      imagen: r.imagen || r.image || './static/img/placeholder.png',
      duracion_horas: r.duracion_horas || r.duration_hours || null,
      ciudad: r.ciudad || r.city || 'Loja'
    }));
  }

  async function fetchJson(url){ const res = await fetch(url); if(!res.ok) throw new Error('HTTP '+res.status); return res.json(); }

  async function search(){
    resultsEl.innerHTML = Array.from({length:6}).map(() => `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="card h-100 shadow-sm">
          <div class="skeleton" style="height:180px;"></div>
          <div class="card-body">
            <div class="skeleton mb-2" style="height:24px;"></div>
            <div class="skeleton mb-2" style="height:14px;"></div>
            <div class="skeleton mb-2" style="height:14px;"></div>
            <div class="skeleton" style="height:18px;width:60%;"></div>
          </div>
        </div>
      </div>`).join('');

    const { expanded, budget, duration } = buildQuery();
    const params = new URLSearchParams();
    if (expanded) params.set('q', expanded);
    if (budget) params.set('budget', budget);
    if (duration) params.set('duration', duration);
    const url = `${window.APP_CONFIG.API_BASE_URL.replace(/\/$/, '')}/buscar?${params.toString()}`;

    try {
      const data = await fetchJson(url);
      const routes = adapt(data);
      render(routes);
    } catch (e) {
      if (window.APP_CONFIG.USE_MOCK_WHEN_OFFLINE){
        const mock = await fetchJson('./static/mock-data.json');
        const q = (expanded||'').toLowerCase();
        const filtered = mock.filter(r => {
          const text = [r.nombre, r.descripcion, ...(r.categorias||[]), ...(r.lugares||[])].join(' ').toLowerCase();
          const matchQ = !q || text.includes(q.split(' ')[0] || '');
          const matchBudget = !budget || (r.categorias||[]).includes(budget) || (budget==='barato' && r.precio_estimado<=10) || (budget==='medio' && r.precio_estimado<=25) || (budget==='alto' && r.precio_estimado>25);
          const matchDuration = !duration || !r.duracion_horas || (
            (duration==='1-3' && r.duracion_horas>=1 && r.duracion_horas<=3) ||
            (duration==='4-6' && r.duracion_horas>=4 && r.duracion_horas<=6) ||
            (duration==='7-10' && r.duracion_horas>=7 && r.duracion_horas<=10)
          );
          return matchQ && matchBudget && matchDuration;
        });
        render(filtered);
      } else {
        render([]);
      }
    }
  }

  document.getElementById('searchForm').addEventListener('submit', (e) => { e.preventDefault(); search(); });
  document.getElementById('results').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]'); if (!btn) return;
    const id = btn.getAttribute('data-id'); const cards = Array.from(document.querySelectorAll('#results .card'));
    const all = Array.from(cards).map((card, i) => card); // dummy para tener índice
  });

  // Cargar al iniciar (usando mock si no hay backend)
  search();
})();