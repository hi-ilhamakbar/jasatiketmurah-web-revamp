/* Airport/city autocomplete. Data source: lxndrblz/Airports, CC BY-SA 4.0. */
(() => {
  const parseRow = line => {
    const values = []; let value = '', quoted = false;
    for (let index = 0; index < line.length; index++) {
      const character = line[index];
      if (character === '"' && line[index + 1] === '"') { value += '"'; index++; }
      else if (character === '"') quoted = !quoted;
      else if (character === ',' && !quoted) { values.push(value); value = ''; }
      else value += character;
    }
    values.push(value); return values;
  };
  const escape = value => String(value || '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  const boot = async () => {
    const form = document.querySelector('#search-form'); if (!form) return;
    let csv; try { csv = await fetch('/assets/airports.csv', { cache: 'force-cache' }).then(response => response.ok ? response.text() : Promise.reject()); } catch { return; }
    const rows = csv.split(/\r?\n/); const header = parseRow(rows.shift()).reduce((map, name, index) => ({ ...map, [name]: index }), {});
    const byCode = new Map();
    rows.forEach(line => { const row = parseRow(line); const code = (row[header.code] || '').toUpperCase(); if (!/^[A-Z]{3}$/.test(code) || byCode.has(code)) return; const airport = { code, city: row[header.city] || '', cityCode: row[header.city_code] || '', name: row[header.name] || '', country: row[header.country] || '' }; airport.search = `${airport.code} ${airport.cityCode} ${airport.city} ${airport.name} ${airport.country}`.toLocaleLowerCase(); byCode.set(code, airport); });
    const airports = [...byCode.values()];
    [document.querySelector('#origin'), document.querySelector('#destination')].forEach(input => {
      if (!input) return;
      input.parentElement.querySelectorAll('.airport-suggestions').forEach(node => node.remove());
      const list = document.createElement('div'); list.className = 'airport-suggestions'; list.hidden = true; input.parentElement.appendChild(list);
      const render = () => { const term = input.value.trim().toLocaleLowerCase(); if (term.length < 2) { list.hidden = true; return; } const matches = airports.filter(airport => airport.search.includes(term)).slice(0, 8); list.innerHTML = matches.map(airport => `<button type="button" data-airport="${escape(airport.code)}"><b>${escape(airport.city || airport.name)} (${escape(airport.code)})</b><small>${escape(airport.name)}${airport.country ? ` · ${escape(airport.country)}` : ''}</small></button>`).join(''); list.hidden = !matches.length; };
      input.addEventListener('input', render); input.addEventListener('focus', render); input.addEventListener('blur', () => setTimeout(() => list.hidden = true, 140));
      list.addEventListener('click', event => { const airport = byCode.get(event.target.closest('[data-airport]')?.dataset.airport); if (!airport) return; input.value = `${airport.city || airport.name} (${airport.code})`; list.hidden = true; input.dispatchEvent(new Event('change', { bubbles: true })); });
    });
  };
  boot();
})();
