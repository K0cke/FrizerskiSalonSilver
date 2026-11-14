// Nalepite URL web aplikacije iz Google Apps Script-a (Deploy > Web app)
const API_URL = 'https://script.google.com/macros/s/AKfycbwh1Ap1wY5M8JBZgtIO4iYOMjNOy19jMiKWEKWiGPHmq4bLgvs_OMXEiZOoJuafFT5uYg/exec';

(() => {
  const MESECI = ['Januar','Februar','Mart','April','Maj','Jun','Jul','Avgust','Septembar','Oktobar','Novembar','Decembar'];
  const $ = id => document.getElementById(id);
  const svc = $('bkService'), days = $('calDays'), slotsEl = $('bkSlots');
  const form = $('bookingForm'), msg = $('bkMsg'), btn = $('bkSubmit');
  let cfg = null, date = null, time = null;
  const view = new Date(); view.setDate(1);

  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const say = (t, ok) => { msg.textContent = t; msg.className = t ? (ok ? 'ok' : 'err') : ''; };
  const get = async params => (await fetch(API_URL + '?' + new URLSearchParams(params))).json();

  async function init() {
    if (API_URL.startsWith('OVDE')) { say('Podesite API_URL u booking.js.'); return; }
    try {
      cfg = await get({ action: 'config' });
    } catch {
      say('Kalendar trenutno nije dostupan. Pozovite nas telefonom.');
      return;
    }
    svc.innerHTML = cfg.services.map(s => `<option value="${s.id}">${s.name} (${s.min} min)</option>`).join('');
    svc.onchange = () => { time = null; if (date) loadSlots(); };
    render();
  }

  function render() {
    const y = view.getFullYear(), m = view.getMonth();
    $('calTitle').textContent = `${MESECI[m]} ${y}`;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const last = new Date(today); last.setDate(last.getDate() + cfg.maxDays);
    const offset = (new Date(y, m, 1).getDay() + 6) % 7; // ponedeljak prvi
    const total = new Date(y, m + 1, 0).getDate();
    let html = '<span></span>'.repeat(offset);
    for (let d = 1; d <= total; d++) {
      const dt = new Date(y, m, d);
      const off = dt < today || dt > last || !cfg.hours[dt.getDay() || 7];
      html += `<button type="button" class="cal-day${ymd(dt) === date ? ' sel' : ''}" data-d="${ymd(dt)}"${off ? ' disabled' : ''}>${d}</button>`;
    }
    days.innerHTML = html;
    $('calPrev').disabled = new Date(y, m, 1) <= new Date(today.getFullYear(), today.getMonth(), 1);
    $('calNext').disabled = new Date(y, m + 1, 1) > last;
  }

  async function loadSlots() {
    slotsEl.innerHTML = '<p class="hint">Učitavanje termina…</p>';
    try {
      const r = await get({ action: 'slots', date, service: svc.value });
      slotsEl.innerHTML = r.slots && r.slots.length
        ? r.slots.map(t => `<button type="button" class="slot${t === time ? ' sel' : ''}">${t}</button>`).join('')
        : '<p class="hint">Nema slobodnih termina tog dana. Izaberite drugi dan.</p>';
    } catch {
      slotsEl.innerHTML = '<p class="hint">Termini se nisu učitali. Osvežite stranicu.</p>';
    }
  }

  days.onclick = e => {
    const b = e.target.closest('.cal-day');
    if (!b || b.disabled) return;
    date = b.dataset.d; time = null; say('');
    render(); loadSlots();
  };
  $('calPrev').onclick = () => { view.setMonth(view.getMonth() - 1); render(); };
  $('calNext').onclick = () => { view.setMonth(view.getMonth() + 1); render(); };
  slotsEl.onclick = e => {
    const b = e.target.closest('.slot');
    if (!b) return;
    time = b.textContent;
    slotsEl.querySelectorAll('.slot').forEach(x => x.classList.toggle('sel', x === b));
  };

  form.onsubmit = async e => {
    e.preventDefault(); say('');
    const f = new FormData(form);
    const name = f.get('name').trim(), phone = f.get('phone').trim();
    if (!date || !time) return say('Izaberite dan i vreme termina.');
    if (name.length < 2 || !/^[+\d][\d\s\/-]{5,}$/.test(phone)) return say('Unesite ime i ispravan broj telefona.');
    btn.disabled = true;
    try {
      const res = await fetch(API_URL, {
        method: 'POST', // bez posebnog Content-Type, da ne bi bilo CORS preflight-a
        body: JSON.stringify({ service: svc.value, date, time, name, phone, note: f.get('note'), website: f.get('website') })
      });
      const r = await res.json();
      if (r.ok) {
        new bootstrap.Toast($('successToast'), { delay: 5000 }).show();
        say(`Termin je zakazan: ${date.split('-').reverse().join('.')}. u ${time}.`, true);
        form.reset();
      } else if (r.error === 'taken') {
        say('Taj termin je upravo zauzet. Izaberite drugi.');
      } else {
        say('Zakazivanje nije uspelo. Pokušajte ponovo ili nas pozovite.');
      }
      time = null; loadSlots();
    } catch {
      say('Nema veze sa serverom. Pokušajte ponovo ili nas pozovite.');
    } finally {
      btn.disabled = false;
    }
  };

  init();
})();