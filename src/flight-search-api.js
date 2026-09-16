/* Google Flights search via the server-side SerpApi gateway. */
(() => {
  const code = value => String(value || '').trim().match(/^([A-Za-z]{3})$|\b([A-Za-z]{3})\b(?=\)?\s*$)/)?.slice(1).find(Boolean)?.toUpperCase() || '';
  const money = (value, currency) => new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value) || 0);
  const classMap = { 'Ekonomi': 1, 'Ekonomi Premium': 2, 'Bisnis': 3, 'Kelas Utama / Suites': 4 };
  const searchForm = document.querySelector('#search-form');
  if (searchForm) searchForm.addEventListener('submit', async event => {
    event.preventDefault(); event.stopImmediatePropagation();
    const feedback = document.querySelector('#search-feedback'), returnDate = document.querySelector('#return-date');
    const payload = { origin: code(document.querySelector('#origin')?.value), destination: code(document.querySelector('#destination')?.value), departureDate: document.querySelector('#travel-date')?.value, returnDate: returnDate?.disabled ? '' : returnDate?.value || '', adults: Number(document.querySelector('[data-count="adults"]')?.textContent || 1), children: Number(document.querySelector('[data-count="children"]')?.textContent || 0), infants: Number(document.querySelector('[data-count="infants"]')?.textContent || 0), directOnly: document.querySelector('[name="direct-only"]')?.checked || false, travelClass: classMap[document.querySelector('#booking-class')?.value] || 1, currency: localStorage.getItem('jtm-currency') || 'IDR' };
    if (!payload.origin || !payload.destination || payload.origin === payload.destination) { feedback.textContent = 'Pilih bandara asal dan tujuan yang berbeda dari daftar.'; return; }
    const button = searchForm.querySelector('.primary-button'); button.disabled = true; feedback.textContent = 'Mencari penerbangan…';
    try { const response = await fetch('/api/flights/search.php', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) }); const data = await response.json().catch(() => ({})); if (!response.ok || !data.ok) throw new Error(data.message || 'Pencarian penerbangan belum tersedia.'); sessionStorage.setItem('jtm-flight-search', JSON.stringify(data)); location.assign('/results/'); } catch (error) { feedback.textContent = error.message; } finally { button.disabled = false; }
  }, true);
  const root = document.querySelector('#flight-results'); if (!root) return;
  let data; try { data = JSON.parse(sessionStorage.getItem('jtm-flight-search') || ''); } catch {}
  if (!data?.ok) return;
  const flights = [...(data.results.best_flights || []), ...(data.results.other_flights || [])], currency = data.search.currency;
  document.querySelector('#result-route').textContent = `${data.search.origin} ke ${data.search.destination}`;
  const render = () => { const direct = document.querySelector('#filter-direct')?.checked, order = document.querySelector('#sort-results')?.value; const visible = flights.filter(item => !direct || item.flights?.length === 1).sort((a, b) => order === 'price-desc' ? b.price - a.price : a.price - b.price); root.innerHTML = visible.map((item, index) => { const first = item.flights?.[0] || {}, last = item.flights?.at(-1) || first; return `<article class="flight-result"><div><b>${first.airline || 'Maskapai'}</b><small>${first.flight_number || ''} · ${first.travel_class || 'Economy'}</small></div><div><b>${first.departure_airport?.time || '—'}</b><small>${first.departure_airport?.id || data.search.origin} → ${last.arrival_airport?.id || data.search.destination} · ${item.total_duration || '—'} mnt</small></div><div><small>${item.flights?.length > 1 ? `${item.flights.length - 1} transit` : 'Langsung'}</small></div><div class="result-price"><b>${money(item.price, currency)}</b><button type="button" data-flight="${index}">Pilih</button></div></article>`; }).join('') || '<p>Tidak ada penerbangan yang cocok dengan filter ini.</p>'; };
  document.querySelectorAll('#filter-direct,#sort-results').forEach(control => control.addEventListener('change', render)); render();
})();
