/* Airport/city autocomplete powered by the RateHawk region search endpoint. */
(() => {
  const safe = value => String(value || '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]);
  const regions = new Map();
  const label = region => `${region.city || region.name} (${region.iata})`;
  const cityName = region => region.type === 'City' ? region.name : (region.city || region.name.replace(/\s+(international\s+)?airport$/i, '').trim());
  window.JTM_AIRPORTS = {
    get: code => regions.get(String(code || '').toUpperCase()),
    label: code => { const region = regions.get(String(code || '').toUpperCase()); return region ? label(region) : String(code || '').toUpperCase(); },
  };
  window.dispatchEvent(new Event('jtm-airports-ready'));

  const form = document.querySelector('#search-form');
  if (!form) return;
  document.head.insertAdjacentHTML('beforeend', '<style>.airport-city{display:block;width:100%;border:0;background:#fff;text-align:left;padding:9px 12px 7px;font:inherit;cursor:pointer}.airport-city b{display:block}.airport-city small{display:block;color:#526b8e;font-size:.76rem}.airport-option{display:block;width:100%;border:0;border-top:1px solid #e8eef6;background:#f8fbff;text-align:left;padding:8px 12px 8px 28px;font:inherit;cursor:pointer}.airport-option:hover{background:#edf5ff}.airport-option b{display:block}.airport-option small{display:block;color:#526b8e;font-size:.76rem}.airport-loading{display:block;padding:10px 12px;color:#526b8e}</style>');
  [document.querySelector('#origin'), document.querySelector('#destination')].forEach(input => {
    if (!input) return;
    input.parentElement.querySelectorAll('.airport-suggestions').forEach(node => node.remove());
    const list = document.createElement('div');
    list.className = 'airport-suggestions';
    list.hidden = true;
    input.parentElement.appendChild(list);
    let controller, timer;
    const renderGroups = found => {
      const groups = new Map();
      found.forEach(region => {
        const key = `${cityName(region).toLocaleLowerCase()}|${region.countryCode}`;
        if (!groups.has(key)) groups.set(key, { city: null, airports: [], name: cityName(region), country: region.country });
        const group = groups.get(key);
        if (region.type === 'City') group.city ||= region;
        else group.airports.push(region);
      });
      const ordered = [...groups.values()];
      const rows = [];
      const selectable = [];
      ordered.forEach(group => {
        const city = group.city;
        if (city) {
          const index = selectable.push(city) - 1;
          rows.push(`<button type="button" class="airport-city" data-region="${index}"><b>${safe(group.name)}</b><small>Kota · ${safe(group.country)}</small></button>`);
        } else rows.push(`<div class="airport-city" aria-hidden="true"><b>${safe(group.name)}</b><small>Kota · ${safe(group.country)}</small></div>`);
        const usedIata = new Set(city ? [city.iata] : []);
        group.airports.forEach(airport => {
          if (usedIata.has(airport.iata)) return;
          usedIata.add(airport.iata);
          const index = selectable.push(airport) - 1;
          rows.push(`<button type="button" class="airport-option" data-region="${index}"><b>${safe(airport.name)} (${safe(airport.iata)})</b><small>Bandara · ${safe(airport.country)}</small></button>`);
        });
      });
      list._regions = selectable;
      return rows.join('');
    };
    const render = async () => {
      const query = input.value.trim();
      if (query.length < 2) { list.hidden = true; return; }
      controller?.abort();
      controller = new AbortController();
      list.hidden = false;
      list.innerHTML = '<small class="airport-loading">Mencari kota dan bandara…</small>';
      try {
        const response = await fetch(`/api/flights/regions.php?query=${encodeURIComponent(query)}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.ok) throw new Error(data.message || 'Pencarian bandara belum tersedia.');
        const found = data.regions || [];
        found.forEach(region => regions.set(region.iata, region));
        list.innerHTML = renderGroups(found) || '<small class="airport-loading">Tidak ada kota atau bandara yang ditemukan.</small>';
      } catch (error) {
        if (error.name === 'AbortError') return;
        list.innerHTML = `<small class="airport-loading">${safe(error.message || 'Pencarian bandara belum tersedia.')}</small>`;
      }
    };
    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(render, 250); });
    input.addEventListener('focus', () => { if (input.value.trim().length >= 2) render(); });
    input.addEventListener('blur', () => setTimeout(() => { list.hidden = true; }, 140));
    list.addEventListener('click', event => {
      const button = event.target.closest('[data-region]');
      const region = list._regions?.[Number(button?.dataset.region)];
      if (!region) return;
      regions.set(region.iata, region);
      input.value = label(region);
      list.hidden = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
})();
