(() => {
  const form = document.querySelector('#japan-visa-form');
  if (!form) return;
  const type = document.querySelector('#japan-visa-type');
  const speed = document.querySelector('#japan-speed');
  const quantity = document.querySelector('#japan-quantity');
  const price = document.querySelector('#japan-price');
  const total = document.querySelector('#japan-total');
  const note = document.querySelector('#japan-speed-note');
  const docs = document.querySelector('#japan-documents');
  const feedback = document.querySelector('#japan-feedback');
  const submit = form.querySelector('[type="submit"]');
  const prices = { normal: 250000, express: 500000 };
  const documentCards = [
    ['passport', 'Halaman biodata paspor', true, '.pdf,.jpg,.jpeg,.png', 'visa-passport.png', 'visa-passport-sample.jpg'],
    ['endorsement', 'Halaman catatan pengesahan / Endorsement', true, '.pdf,.jpg,.jpeg,.png', 'visa-document.png']
  ];
  const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
  const applicants = () => Math.min(10, Math.max(1, Number(quantity.value) || 1));
  const renderDocs = () => {
    docs.innerHTML = Array.from({ length: applicants() }, (_, index) => `<details class="visa-applicant" ${index === 0 ? 'open' : ''}><summary><b>Pemohon ${index + 1} — Dokumen</b><span>0 file dipilih</span></summary><div class="visa-upload-grid">${documentCards.map(([key, label, required, accept, icon, preview]) => `<label class="visa-document-card${preview ? ' has-preview' : ''}"><img class="visa-document-icon" src="/assets/${icon}" alt="" aria-hidden="true">${preview ? `<span class="visa-document-preview"><img src="/assets/${preview}" alt="Contoh ${label}"></span>` : ''}<b>${label}${required ? ' *' : ''}</b><small>Klik untuk upload</small><input name="${key}_${index + 1}${key.startsWith('additional') ? '[]' : ''}" type="file" ${required ? 'required' : ''} ${key.startsWith('additional') ? 'multiple' : ''} accept="${accept}"></label>`).join('')}</div></details>`).join('');
    docs.querySelectorAll('.visa-applicant').forEach(item => {
      item.addEventListener('change', () => { item.querySelector('summary span').textContent = `${[...item.querySelectorAll('input[type=file]')].reduce((sum, input) => sum + (input.files?.length || 0), 0)} file dipilih`; });
      item.addEventListener('toggle', () => { if (item.open) docs.querySelectorAll('.visa-applicant[open]').forEach(other => { if (other !== item) other.open = false; }); });
    });
  };
  const refresh = () => {
    const ready = Boolean(type.value && speed.value);
    const unit = ready ? prices[speed.value] : 0;
    price.textContent = money(unit); total.textContent = money(unit * applicants()); note.textContent = speed.options[speed.selectedIndex].text;
    docs.hidden = !ready; submit.disabled = !ready;
    if (ready) renderDocs();
  };
  [type, speed, quantity].forEach(control => control.addEventListener('input', refresh));
  const nationality = form.querySelector('[name="nationality"]');
  if (nationality) {
    [...nationality.options].forEach(option => { if (!['ID', 'QA'].includes(option.value)) option.remove(); });
    nationality.value = 'ID';
    nationality.addEventListener('change', () => {
      nationality.style.setProperty('--country-flag', `url("https://flagcdn.com/w40/${nationality.value.toLowerCase()}.png")`);
    });
  }
  window.addVisaAddressFields(form);
  form.querySelector('[name="phone"]').addEventListener('input', event => { event.target.value = event.target.value.replace(/\D/g, ''); });
  refresh();
  form.addEventListener('submit', async event => {
    event.preventDefault(); const data = new FormData(form);
    data.append('country', 'JP'); data.append('visaType', type.value); data.append('processingSpeed', speed.value); data.append('quantity', quantity.value); feedback.textContent = 'Mengirim aplikasi…';
    try { const response = await fetch('/api/visa/create.php', { method: 'POST', body: data }); const result = await response.json(); if (!response.ok || !result.ok) throw new Error(result.message || 'Tidak dapat mengirim aplikasi.'); feedback.textContent = 'Aplikasi diterima.'; if (result.paymentUrl) location.href = result.paymentUrl; } catch (error) { feedback.textContent = error.message || 'Koneksi pembayaran belum tersedia. Silakan hubungi tim kami.'; }
  });
})();
