/* Sabre calls happen only through same-origin PHP endpoints: no supplier secret reaches a browser. */
(() => {
  const api = '/api/flights';
  const code = value => String(value || '').match(/\b([A-Za-z]{3})\b(?=\)?\s*$)/)?.[1]?.toUpperCase() || '';
  const money = (amount, currency = 'IDR') => new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount) || 0);
  const request = async (path, payload) => {
    const response = await fetch(`${api}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.message || 'Layanan penerbangan tidak dapat dihubungi.');
    return data;
  };

  const searchForm = document.querySelector('#search-form');
  if (searchForm) searchForm.addEventListener('submit', async event => {
    event.preventDefault(); event.stopImmediatePropagation();
    const feedback = document.querySelector('#search-feedback');
    const origin = code(document.querySelector('#origin')?.value), destination = code(document.querySelector('#destination')?.value);
    const departureDate = document.querySelector('#travel-date')?.value;
    const returning = document.querySelector('#return-date');
    const payload = {
      origin, destination, departureDate, returnDate: returning?.disabled ? '' : returning?.value || '',
      adults: Number(document.querySelector('[data-count="adults"]')?.textContent || 1),
      children: Number(document.querySelector('[data-count="children"]')?.textContent || 0),
      infants: Number(document.querySelector('[data-count="infants"]')?.textContent || 0),
      currency: localStorage.getItem('jtm-currency') || 'IDR'
    };
    if (!origin || !destination) { feedback.textContent = 'Pilih bandara dari daftar saran agar pencarian dapat diproses.'; return; }
    const button = searchForm.querySelector('.primary-button'); button.disabled = true; feedback.textContent = 'Mencari penerbangan langsung dari Sabre…';
    try { const data = await request('search.php', payload); sessionStorage.setItem('jtm-sabre-search', JSON.stringify(data)); location.assign('/results/'); }
    catch (error) { feedback.textContent = error.message; } finally { button.disabled = false; }
  }, true);

  const resultRoot = document.querySelector('#flight-results');
  if (resultRoot) {
    let searchData; try { searchData = JSON.parse(sessionStorage.getItem('jtm-sabre-search') || ''); } catch {}
    if (!searchData?.ok) { resultRoot.innerHTML = '<p class="form-feedback">Sesi pencarian tidak ditemukan. Silakan kembali dan cari penerbangan lagi.</p>'; return; }
    const search = searchData.search;
    const items = searchData.supplierResponse?.PricedItineraries || searchData.supplierResponse?.pricedItineraries || searchData.supplierResponse?.itineraries || [];
    const offers = items.map((item, index) => {
      const itinerary = item.AirItinerary || item.airItinerary || item;
      const option = itinerary.OriginDestinationOptions?.OriginDestinationOption || itinerary.originDestinationOptions?.originDestinationOption || item.legs?.[0] || {};
      const segments = option.FlightSegment || option.flightSegment || option.segments || [];
      const list = Array.isArray(segments) ? segments : [segments]; const first = list[0] || {}, last = list.at(-1) || {};
      const fare = item.AirItineraryPricingInfo?.ItinTotalFare?.TotalFare || item.airItineraryPricingInfo?.itinTotalFare?.totalFare || item.totalFare || item.price || {};
      return { id: `sabre-${index}`, airline: first.MarketingAirline?.Code || first.marketingAirline?.code || first.carrierCode || 'Maskapai', flight: first.FlightNumber || first.flightNumber || '', departure: first.DepartureDateTime || first.departureDateTime || '', arrival: last.ArrivalDateTime || last.arrivalDateTime || '', origin: first.OriginLocation?.LocationCode || first.origin || search.origin, destination: last.DestinationLocation?.LocationCode || last.destination || search.destination, stops: Math.max(0, list.length - 1), amount: Number(fare.Amount ?? fare.amount ?? fare.total ?? 0), currency: fare.CurrencyCode ?? fare.currency ?? search.currency ?? 'IDR', raw: item };
    });
    document.querySelector('#result-route').textContent = `${search.origin} ke ${search.destination}`;
    const render = () => {
      const direct = document.querySelector('#filter-direct')?.checked, descending = document.querySelector('#sort-results')?.value === 'price-desc';
      const visible = offers.filter(offer => !direct || offer.stops === 0).sort((a, b) => descending ? b.amount - a.amount : a.amount - b.amount);
      resultRoot.innerHTML = visible.map(offer => `<article class="flight-result"><div><b>${offer.airline}</b><small>${offer.flight} · Economy</small></div><div><b>${String(offer.departure).replace('T', ' ') || '—'}</b><small>${offer.origin} → ${offer.destination}</small></div><div><small>${offer.stops ? `${offer.stops} transit` : 'Langsung'}</small></div><div class="result-price"><b>${money(offer.amount, offer.currency)}</b><button type="button" data-offer="${offer.id}">Pilih</button></div></article>`).join('') || '<p>Tidak ada penerbangan yang cocok dengan filter ini.</p>';
    };
    document.querySelectorAll('#filter-direct,#sort-results').forEach(control => control.addEventListener('change', render));
    resultRoot.addEventListener('click', event => { const selected = offers.find(offer => offer.id === event.target.closest('[data-offer]')?.dataset.offer); if (selected) { sessionStorage.setItem('jtm-sabre-offer', JSON.stringify({ offer: selected, search })); location.assign('/checkout/'); } });
    render();
  }

  const checkout = document.querySelector('#checkout-form');
  if (checkout) {
    let choice; try { choice = JSON.parse(sessionStorage.getItem('jtm-sabre-offer') || ''); } catch {}
    if (!choice?.offer) { document.querySelector('#checkout-feedback').textContent = 'Pilih penerbangan terlebih dahulu sebelum melanjutkan.'; return; }
    const { offer, search } = choice;
    document.querySelector('#checkout-route').textContent = `${offer.origin} → ${offer.destination}`;
    document.querySelector('#checkout-airline').textContent = `${offer.airline} ${offer.flight}`.trim(); document.querySelector('#checkout-total').textContent = money(offer.amount, offer.currency);
    checkout.querySelector('.field-grid')?.insertAdjacentHTML('afterend', '<fieldset class="checkout-choice"><legend>Data penumpang utama</legend><div class="field-grid"><label>Nama depan<input name="givenName" autocomplete="given-name" required></label><label>Nama belakang<input name="surname" autocomplete="family-name" required></label></div><p class="form-feedback">Nama harus sama persis dengan paspor.</p></fieldset>');
    checkout.addEventListener('submit', async event => {
      event.preventDefault(); event.stopImmediatePropagation(); const feedback = document.querySelector('#checkout-feedback'), button = checkout.querySelector('.primary-button'), data = new FormData(checkout); button.disabled = true; feedback.textContent = 'Mengirim permintaan booking ke Sabre…';
      try { const booking = await request('booking.php', { offer: offer.raw, search, passengers: [{ givenName: data.get('givenName'), surname: data.get('surname'), email: data.get('email'), phone: data.get('phone') }], paymentMethod: data.get('payment') }); const ref = booking.booking?.confirmationNumber; if (!ref) throw new Error('Sabre belum memberikan konfirmasi booking.'); sessionStorage.setItem('jtm-order', JSON.stringify({ number: ref, customer: Object.fromEntries(data), route: `${offer.origin} → ${offer.destination}`, price: money(offer.amount, offer.currency) })); location.assign(`/order-confirmation/?order=${encodeURIComponent(ref)}`); }
      catch (error) { feedback.textContent = error.message; } finally { button.disabled = false; }
    }, true);
  }
})();
