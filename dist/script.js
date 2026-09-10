const dateField = document.querySelector('#travel-date');
dateField.min = new Date().toISOString().split('T')[0];
dateField.value = new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0];
document.querySelector('#year').textContent = new Date().getFullYear();

const services = { flight: ['Dari', 'Ke', 'Jakarta (CGK)', 'Pilih tujuan'], hotel: ['Kota atau hotel', 'Tujuan', '', 'Contoh: Ubud, Bali'], tour: ['Kota keberangkatan', 'Aktivitas atau tujuan', '', 'Contoh: Tokyo city tour'], visa: ['Negara paspor', 'Negara tujuan', 'Indonesia', 'Contoh: Jepang'] };
document.querySelectorAll('.service-tab').forEach((tab) => tab.addEventListener('click', () => {
  document.querySelectorAll('.service-tab').forEach((item) => { item.classList.remove('active'); item.setAttribute('aria-selected', 'false'); });
  tab.classList.add('active'); tab.setAttribute('aria-selected', 'true');
  const [originText, destinationText, origin, destination] = services[tab.dataset.service];
  document.querySelector('#origin-label').textContent = originText;
  document.querySelector('#destination-label').textContent = destinationText;
  document.querySelector('#origin').value = origin;
  document.querySelector('#destination').value = '';
  document.querySelector('#destination').placeholder = destination;
}));
document.querySelector('.swap').addEventListener('click', () => { const a = document.querySelector('#origin'); const b = document.querySelector('#destination'); [a.value, b.value] = [b.value, a.value]; });
document.querySelector('#search-form').addEventListener('submit', (event) => { event.preventDefault(); document.querySelector('#search-feedback').textContent = 'Pencarian Anda siap. Integrasi harga live akan tersedia pada fase koneksi API.'; });

let captchaAnswer;
function makeCaptcha() { const a = Math.floor(Math.random() * 90) + 10; const b = Math.floor(Math.random() * (a + 1)); captchaAnswer = a - b; document.querySelector('#captcha-label').firstChild.textContent = `Verifikasi: ${a} − ${b} = `; }
makeCaptcha();
document.querySelector('#contact-form').addEventListener('submit', (event) => { event.preventDefault(); const feedback = document.querySelector('#contact-feedback'); if (Number(document.querySelector('#captcha').value) !== captchaAnswer) { feedback.textContent = 'Jawaban verifikasi belum tepat. Silakan coba lagi.'; makeCaptcha(); return; } feedback.textContent = 'Terima kasih. Pesan Anda sudah siap dikirim ke tim JasaTiketMurah.'; event.currentTarget.reset(); makeCaptcha(); });
document.querySelector('.menu-toggle').addEventListener('click', (event) => { const nav = document.querySelector('.main-nav'); const open = nav.classList.toggle('open'); event.currentTarget.setAttribute('aria-expanded', String(open)); });
