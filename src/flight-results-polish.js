(() => {
  'use strict';

  const results = document.querySelector('.flight-results');
  if (!results) return;

  const style = document.createElement('style');
  style.textContent = `
    .flight-result-rich .flight-meta { align-content:center; display:grid; gap:5px; justify-items:start; min-width:122px; }
    .flight-result-rich .flight-meta small { line-height:1.3; }
    .flight-result-rich .flight-details-toggle { margin:0; padding:0; text-align:left; white-space:nowrap; }
    .selected-outbound-card { align-items:center; background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; display:grid; gap:3px; grid-template-columns:auto 1fr; margin:0 0 16px; padding:13px 16px; }
    .selected-outbound-card__label { background:#234197; border-radius:999px; color:#fff; font-size:.78rem; font-weight:700; grid-row:span 2; padding:6px 10px; }
    .selected-outbound-card strong { color:#10234b; }
    .selected-outbound-card small { color:#52709b; }
    .flight-result-rich .result-price small { display:block; line-height:1.35; margin-top:4px; }
    @media (max-width:700px) { .flight-result-rich .flight-meta { min-width:0; } .selected-outbound-card { align-items:start; } }
  `;
  document.head.append(style);

  const escapeHtml = value => String(value || '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
  const segmentInfo = (segment, search) => ({
    from: segment?.departure_airport?.name || segment?.departure_airport?.id || search?.origin || '',
    to: segment?.arrival_airport?.name || segment?.arrival_airport?.id || search?.destination || '',
    departure: segment?.departure_airport?.time || ''
  });

  const showSelectedOutbound = () => {
    const existing = results.querySelector('.selected-outbound-card');
    let state;
    try { state = JSON.parse(sessionStorage.getItem('jtm-flight-search') || 'null'); } catch (_) { return; }
    if (!state?.returnStage || !state?.outboundFlight) { existing?.remove(); return; }

    const flights = state.outboundFlight.flights || [];
    const first = flights[0] || {};
    const last = flights[flights.length - 1] || first;
    const from = segmentInfo(first, state.search);
    const to = segmentInfo(last, state.search);
    const duration = state.outboundFlight.total_duration ? ` · ${state.outboundFlight.total_duration}` : '';
    const markup = `<span class="selected-outbound-card__label">Pergi dipilih</span><strong>${escapeHtml(from.from)} → ${escapeHtml(to.to)}</strong><small>${escapeHtml(from.departure)}${escapeHtml(duration)}. Pilih jadwal pulang di bawah.</small>`;
    if (existing) {
      if (existing.innerHTML !== markup) existing.innerHTML = markup;
    } else {
      results.insertAdjacentHTML('afterbegin', `<section class="selected-outbound-card">${markup}</section>`);
    }
  };

  const polish = () => {
    results.querySelectorAll('.flight-result-rich > div:nth-child(3)').forEach(meta => {
      if (meta.querySelector('.flight-details-toggle')) meta.classList.add('flight-meta');
    });
    results.querySelectorAll('.result-price small').forEach(label => {
      if (/Harga per orang/i.test(label.textContent)) label.textContent = 'Harga pergi–pulang per orang';
    });
    showSelectedOutbound();
  };

  new MutationObserver(polish).observe(results, { childList:true, subtree:true });
  polish();
})();
