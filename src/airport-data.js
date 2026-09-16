/* Airport/city autocomplete. Data: lxndrblz/Airports, CC BY-SA 4.0. */
(() => {
  const cityOverrides = { LAX: 'Los Angeles', VTE: 'Vientiane' };
  const parse = line => { const out = []; let value = '', quoted = false; for (let i = 0; i < line.length; i++) { const char = line[i]; if (char === '"' && line[i + 1] === '"') { value += char; i++; } else if (char === '"') quoted = !quoted; else if (char === ',' && !quoted) { out.push(value); value = ''; } else value += char; } out.push(value); return out; };
  const safe = value => String(value || '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  const load = async () => {
    const form = document.querySelector('#search-form'); if (!form) return;
    let csv; try { csv = await fetch('/assets/airports.csv', { cache: 'force-cache' }).then(response => response.ok ? response.text() : Promise.reject()); } catch { return; }
    const lines = csv.split(/\r?\n/), header = parse(lines.shift()).reduce((all, name, index) => ({ ...all, [name]: index }), {}), codes = new Map();
    lines.forEach(line => { const row = parse(line), code = (row[header.code] || '').toUpperCase(); if (!/^[A-Z]{3}$/.test(code) || codes.has(code)) return; const city = cityOverrides[code] || row[header.city] || row[header.name] || code; const item = { code, city, name: row[header.name] || '', country: row[header.country] || '', cityCode: row[header.city_code] || '' }; item.index = `${item.code} ${item.cityCode} ${item.city} ${item.name} ${item.country}`.toLocaleLowerCase(); codes.set(code, item); });
    const airports = [...codes.values()];
    [document.querySelector('#origin'), document.querySelector('#destination')].forEach(input => {
      if (!input) return; input.parentElement.querySelectorAll('.airport-suggestions').forEach(node => node.remove());
      const list = document.createElement('div'); list.className = 'airport-suggestions'; list.hidden = true; input.parentElement.appendChild(list);
      const render = () => { const term = input.value.trim().toLocaleLowerCase(); if (term.length < 2) { list.hidden = true; return; } const matches = airports.filter(airport => airport.index.includes(term)).sort((a, b) => (a.code === term.toUpperCase() ? -1 : b.code === term.toUpperCase() ? 1 : a.city.localeCompare(b.city))).slice(0, 8); list.innerHTML = matches.map(airport => `<button type="button" data-airport="${safe(airport.code)}"><b>${safe(airport.city)} (${safe(airport.code)})</b><small>${safe(airport.name)}${airport.country ? ` · ${safe(airport.country)}` : ''}</small></button>`).join(''); list.hidden = !matches.length; };
      input.addEventListener('input', render); input.addEventListener('focus', render); input.addEventListener('blur', () => setTimeout(() => list.hidden = true, 140));
      list.addEventListener('click', event => { const airport = codes.get(event.target.closest('[data-airport]')?.dataset.airport); if (!airport) return; input.value = `${airport.city} (${airport.code})`; list.hidden = true; input.dispatchEvent(new Event('change', { bubbles: true })); });
    });
  };
  load();
})();
