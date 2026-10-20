(() => {
  const form = document.querySelector('#airport-lounge-form');
  if (!form) return;

  const feedback = document.querySelector('#airport-lounge-feedback');
  const submit = form.querySelector('button[type="submit"]');
  const accepted = new Set(['pdf', 'jpg', 'jpeg', 'png']);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const files = [...form.querySelector('[name="attachments[]"]').files];
    if (!files.length) {
      feedback.textContent = 'Pilih setidaknya satu lampiran voucher.';
      return;
    }
    if (files.some(file => !accepted.has(file.name.split('.').pop().toLowerCase()))) {
      feedback.textContent = 'Lampiran hanya boleh berupa PDF, JPG, atau PNG.';
      return;
    }

    submit.disabled = true;
    feedback.textContent = 'Mengirim email dan lampiran…';
    try {
      const response = await fetch('/api/airport-lounge.php', { method: 'POST', body: new FormData(form) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || 'Email tidak dapat dikirim.');
      form.reset();
      feedback.textContent = 'Email voucher berhasil dikirim kepada pelanggan.';
    } catch (error) {
      feedback.textContent = error.message || 'Email tidak dapat dikirim saat ini.';
    } finally {
      submit.disabled = false;
    }
  });
})();
