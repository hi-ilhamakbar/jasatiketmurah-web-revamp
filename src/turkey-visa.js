(() => {
  const form = document.querySelector('#turkey-visa-form');
  if (!form) return;

  const type = document.querySelector('#turkey-visa-type');
  const speed = document.querySelector('#turkey-speed');
  const quantity = document.querySelector('#turkey-quantity');
  const price = document.querySelector('#turkey-price');
  const total = document.querySelector('#turkey-total');
  const note = document.querySelector('#turkey-speed-note');
  const docs = document.querySelector('#turkey-documents');
  const feedback = document.querySelector('#turkey-feedback');
  const submit = form.querySelector('[type="submit"]');
  const prices = { normal: 1500000, express: 2000000, 'super-express': 2500000 };
  const documentCards = [
    ['face', 'Foto diri (tanpa kacamata)', true, '.jpg,.jpeg,.png', 'visa-face.png', 'visa-face-sample.jpg'],
    ['passport', 'Halaman biodata paspor', true, '.pdf,.jpg,.jpeg,.png', 'visa-passport.png', 'visa-passport-sample.jpg'],
    ['ticket', 'Tiket penerbangan', false, '.pdf,.jpg,.jpeg,.png', 'visa-ticket.png'],
    ['hotel', 'Bukti reservasi hotel', false, '.pdf,.jpg,.jpeg,.png', 'visa-hotel.png'],
    ['additional-one', 'Dokumen tambahan 1', false, '.pdf,.jpg,.jpeg,.png', 'visa-document.png'],
    ['additional-two', 'Dokumen tambahan 2', false, '.pdf,.jpg,.jpeg,.png', 'visa-document.png']
  ];
  const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
  const applicantCount = () => Math.min(10, Math.max(1, Number(quantity.value) || 1));

  const renderDocs = () => {
    docs.innerHTML = Array.from({ length: applicantCount() }, (_, index) => `<details class="visa-applicant" ${index === 0 ? 'open' : ''}><summary><b>Pemohon ${index + 1} — Dokumen</b><span>0 file dipilih</span></summary><div class="visa-upload-grid">${documentCards.map(([key, label, required, accept, icon, preview]) => `<label class="visa-document-card${preview ? ' has-preview' : ''}"><img class="visa-document-icon" src="/assets/${icon}" alt="" aria-hidden="true">${preview ? `<span class="visa-document-preview"><img src="/assets/${preview}" alt="Contoh ${label}"></span>` : ''}<b>${label}${required ? ' *' : ''}</b><small>Klik untuk upload</small><input name="${key}_${index + 1}${key.startsWith('additional') ? '[]' : ''}" type="file" ${required ? 'required' : ''} ${key.startsWith('additional') ? 'multiple' : ''} accept="${accept}"></label>`).join('')}</div></details>`).join('');
    docs.querySelectorAll('.visa-applicant').forEach(item => {
      item.addEventListener('change', () => {
        const selected = [...item.querySelectorAll('input[type=file]')].reduce((sum, input) => sum + (input.files?.length || 0), 0);
        item.querySelector('summary span').textContent = `${selected} file dipilih`;
      });
      item.addEventListener('toggle', () => {
        if (item.open) docs.querySelectorAll('.visa-applicant[open]').forEach(other => { if (other !== item) other.open = false; });
      });
    });
  };
  const refresh = () => {
    const chosen = Boolean(type.value && speed.value);
    const unit = chosen ? (prices[speed.value] || prices.normal) : 0;
    price.textContent = money(unit);
    total.textContent = money(unit * applicantCount());
    note.textContent = speed.options[speed.selectedIndex].text;
    docs.hidden = !chosen;
    submit.disabled = !chosen;
    if (chosen) renderDocs();
  };

  [type, speed, quantity].forEach(control => control.addEventListener('input', refresh));
  form.querySelector('[name="phone"]').addEventListener('input', event => { event.target.value = event.target.value.replace(/\D/g, ''); });
  refresh();
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const data = new FormData(form);
    data.append('country', 'TR'); data.append('visaType', type.value); data.append('processingSpeed', speed.value); data.append('quantity', quantity.value);
    feedback.textContent = 'Mengirim aplikasi…';
    try {
      const response = await fetch('/api/visa/create.php', { method: 'POST', body: data });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || 'Tidak dapat mengirim aplikasi.');
      feedback.textContent = 'Aplikasi diterima.';
      if (result.paymentUrl) location.href = result.paymentUrl;
    } catch (error) { feedback.textContent = error.message || 'Koneksi pembayaran belum tersedia. Silakan hubungi tim kami.'; }
  });
})();
