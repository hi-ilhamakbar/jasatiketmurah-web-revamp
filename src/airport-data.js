/* Airport/city autocomplete powered by the RateHawk region search endpoint. */
(() => {
  const safe = value => String(value || '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]);
  const regions = new Map();
  const label = region => `${region.city || region.name} (${region.iata})`;
  window.JTM_AIRPORTS = {
    get: code => regions.get(String(code || '').toUpperCase()),
    label: code => { const region = regions.get(String(code || '').toUpperCase()); return region ? label(region) : String(code || '').toUpperCase(); },
  };
  window.dispatchEvent(new Event('jtm-airports-ready'));

  const form = document.querySelector('#search-form');
  if (!form) return;
  [document.querySelector('#origin'), document.querySelector('#destination')].forEach(input => {
    if (!input) return;
    input.parentElement.querySelectorAll('.airport-suggestions').forEach(node => node.remove());
    const list = document.createElement('div');
    list.className = 'airport-suggestions';
    list.hidden = true;
    input.parentElement.appendChild(list);
    let controller, timer;
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
        list.innerHTML = found.map((region, index) => `<button type="button" data-region="${index}"><b>${safe(label(region))}</b><small>${safe(region.type === 'Airport' ? region.name : 'Kota')} · ${safe(region.country)}</small></button>`).join('') || '<small class="airport-loading">Tidak ada kota atau bandara yang ditemukan.</small>';
        list._regions = found;
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
