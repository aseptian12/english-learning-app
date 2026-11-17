const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ic = n => '<i class="bi bi-' + n + '" aria-hidden="true"></i>';
const SETD = { APP_NAME: 'English Journey', ALLOW_REGISTRATION: 'true', MIN_PASSWORD: '6', XP_PER_CORRECT: '10', CEFR_A2: '80', CEFR_A1: '50', MAINTENANCE: 'false' };
const S = { t: null, u: null, L: [], Q: [], done: {}, run: null, rep: null, tab: 'home', set: Object.assign({}, SETD), A: null, at: 'sum', lq: null, q: { r: '', u: '', ur: '', l: '' } };
const SK = { Vocabulary: ['translate','c1'], Grammar: ['puzzle','c2'], Listening: ['headphones','c3'], Reading: ['book','c4'], Writing: ['pencil','c5'], Speaking: ['mic','c5'] };
const ls = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }, del: k => { try { localStorage.removeItem(k); } catch (e) {} } };

// Pemanggil backend via fetch (POST text/plain agar tidak kena preflight CORS GAS).
// Navigasi tetap 100% client-side → instan; server hanya untuk data.
async function call(fn, ...a) {
  if (typeof GAS_URL === 'undefined' || !/^https:\/\/script\.google\.com\//.test(GAS_URL)) throw new Error('GAS_URL belum diisi di js/config.js');
  const res = await fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: fn, args: a }) });
  const r = await res.json();
  if (!r || !r.success) throw new Error((r && r.message) || 'Gagal terhubung.');
  return r.data;
}
function toast(m, t) { const e = $('#toast'); e.textContent = m; e.className = 'toast-ej show ' + (t || ''); clearTimeout(toast.h); toast.h = setTimeout(() => e.className = 'toast-ej', 3200); }
function view(h, keep) { $('#view').innerHTML = h; if (!keep) window.scrollTo(0, 0); }
const skel = () => '<div class="card-ej"><div class="sk" style="width:40%"></div><div class="sk"></div><div class="sk" style="width:80%"></div></div>'.repeat(3);
function theme(t) { document.documentElement.dataset.theme = t; ls.set('ej_th', t); }
const level = u => Math.floor((Number(u.XP) || 0) / 100) + 1;
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const speak = t => { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'en-US'; u.rate = .85; speechSynthesis.speak(u); } catch (e) { toast('Suara tidak didukung di perangkat ini.', 'err'); } };
const MASCOT = '<svg viewBox="0 0 100 100" role="img" aria-label="Maskot Ollie"><circle cx="50" cy="56" r="34" fill="#1f6fd1"/><circle cx="36" cy="46" r="13" fill="#fff"/><circle cx="64" cy="46" r="13" fill="#fff"/><circle cx="38" cy="47" r="6" fill="#1f2540"/><circle cx="62" cy="47" r="6" fill="#1f2540"/><path d="M44 58l6 9 6-9z" fill="#ffd23f"/><path d="M24 30l10 8M76 30l-10 8" stroke="#1f6fd1" stroke-width="8" stroke-linecap="round"/></svg>';

// ── Auth ──
function authView(mode) {
  const reg = mode === 'reg';
  $('#top').hidden = true; $('#nav').hidden = true;
  view('<form class="card-ej auth" onsubmit="return doAuth(event,' + reg + ')">' +
    '<div class="row" style="justify-content:center">' + MASCOT.replace('<svg', '<svg width="80" height="80"') + '</div>' +
    '<h1 style="text-align:center">' + esc(S.set.APP_NAME) + '</h1><p class="mut" style="text-align:center">Learn • Practice • Play • Improve</p>' +
    '<div class="tabs"><button type="button" class="btn-ej ' + (reg ? 'o' : '') + '" onclick="authView()">Masuk</button><button type="button" id="tab_reg" ' + (S.set.ALLOW_REGISTRATION === 'true' ? '' : 'hidden') + ' class="btn-ej ' + (reg ? '' : 'o') + '" onclick="authView(\'reg\')">Daftar</button></div>' +
    (reg ? '<div class="fld"><label for="f_nama">Nama lengkap</label><input id="f_nama" required minlength="2" autocomplete="name"></div>' : '') +
    '<div class="fld"><label for="f_un">Username</label><input id="f_un" required minlength="3" autocomplete="username" autocapitalize="none"></div>' +
    '<div class="fld"><label for="f_pw">Kata sandi</label><input id="f_pw" type="password" required minlength="' + (reg ? S.set.MIN_PASSWORD : 1) + '" autocomplete="' + (reg ? 'new-password' : 'current-password') + '"></div>' +
    (reg ? '<div class="fld"><label for="f_peran">Saya adalah</label><select id="f_peran" onchange="$(\'#sw\').hidden=this.value===\'Guru\'"><option>Siswa</option><option>Guru</option></select></div>' +
      '<div id="sw"><div class="fld"><label for="f_kelas">Kelas</label><select id="f_kelas"><option>3</option><option>4</option><option selected>5</option><option>6</option></select></div>' +
      '<div class="fld"><label for="f_kode">Kode kelas (opsional)</label><input id="f_kode" placeholder="mis. EJ-5A-001"></div></div>' : '') +
    '<button class="btn-ej w" id="f_go" type="submit">' + (reg ? 'Buat akun' : 'Masuk') + ' ' + ic('arrow-right') + '</button></form>');
}
function doAuth(ev, reg) {
  ev.preventDefault();
  const v = id => ($('#' + id) || {}).value;
  const btn = $('#f_go'); btn.disabled = true;
  const p = reg ? call('register', { nama: v('f_nama'), username: v('f_un'), password: v('f_pw'), peran: v('f_peran'), kelas: v('f_kelas'), kode: v('f_kode') }) : call('login', v('f_un'), v('f_pw'));
  p.then(d => { S.t = d.token; ls.set('ej_t', d.token); apply(d); enter(); }).catch(e => { btn.disabled = false; toast(e.message, 'err'); });
  return false;
}
function apply(d) {
  S.u = d.user; S.L = d.lessons; S.Q = d.questions; S.done = d.done; S.set = Object.assign({}, SETD, d.settings || {});
  document.title = S.set.APP_NAME; stash();
}
function stash() { ls.set('ej_boot', JSON.stringify({ u: S.u, L: S.L, Q: S.Q, done: S.done, set: S.set })); }
function enter() {
  flushQueue(); chrome();
  if (S.u.Peran === 'Siswa') { if (!S.u.CEFR) return intro(); go('home'); }
  else go(S.u.Peran === 'Admin' ? 'admin' : 'teacher');
}
// Muat ulang diam-diam di latar belakang (stale-while-revalidate): UI tidak menunggu server
function refresh() {
  return call('getBootstrap', S.t).then(d => {
    apply(d); syncChips();
    if (!S.run && !document.querySelector('dialog[open]') && ['home', 'learn', 'progress'].indexOf(S.tab) > -1 && !(document.activeElement && document.activeElement.tagName === 'INPUT')) go(S.tab);
  });
}
function logout() { ls.del('ej_t'); ls.del('ej_boot'); S.t = null; S.u = null; S.A = null; S.rep = null; authView(); }

// ── Kerangka: top bar + menu bawah per peran ──
function chrome() {
  const u = S.u;
  $('#top').hidden = false; $('#nav').hidden = false;
  $('#top').innerHTML = '<span class="logo">' + ic('journal-richtext') + ' ' + esc(S.set.APP_NAME) + '</span>' +
    (u.Peran === 'Siswa' ? '<span class="chip">' + ic('fire') + '<span id="c_st">' + u.Streak + '</span></span><span class="chip">' + ic('lightning-charge-fill') + '<span id="c_xp">' + u.XP + '</span> XP</span>' : '') +
    '<button class="btn-ej ib" aria-label="Ganti tema" onclick="theme(document.documentElement.dataset.theme===\'dark\'?\'light\':\'dark\')">' + ic('moon-stars') + '</button>' +
    '<button class="btn-ej ib" aria-label="Keluar" onclick="logout()">' + ic('box-arrow-right') + '</button>';
  const items = u.Peran === 'Siswa' ? [['home','house-door','Beranda'],['learn','book','Belajar'],['progress','graph-up','Progres']] : (u.Peran === 'Admin' ? [['admin','gear','Admin']] : [['teacher','bar-chart','Laporan']]);
  $('#nav').innerHTML = items.map(i => '<button data-t="' + i[0] + '" onclick="go(\'' + i[0] + '\')">' + ic(i[1]) + i[2] + '</button>').join('');
}
function syncChips() { if ($('#c_xp')) { $('#c_xp').textContent = S.u.XP; $('#c_st').textContent = S.u.Streak; } }
function go(t, arg) {
  S.tab = t; S.run = null;
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  ({ home, learn: () => learn(arg), progress, teacher: report, admin })[t]();
}

// ── Beranda siswa ──
function home() {
  const u = S.u, nxt = S.L.find(l => !S.done[l.ID]) || S.L[0];
  const cnt = k => S.L.filter(l => l.Skill === k).length;
  view('<section class="card-ej hero"><div class="sp"><h1>Hai, ' + esc(u.Nama.split(' ')[0]) + '!</h1><p>Level ' + level(u) + ' • CEFR ' + esc(u.CEFR || '-') + '</p>' +
    (nxt ? '<button class="btn-ej" onclick="startRun(\'' + nxt.ID + '\')">' + ic('play-fill') + ' Lanjut belajar</button>' : '') + '</div>' + MASCOT + '</section>' +
    (nxt ? '<section class="card-ej"><p class="mut">' + esc(nxt.Unit) + '</p><h2>' + esc(nxt.Judul) + '</h2><div class="bar"><i style="width:' + Math.round(Object.keys(S.done).length / Math.max(1, S.L.length) * 100) + '%"></i></div></section>' : '') +
    '<h2>5 Kemampuan</h2><div class="grid">' +
    Object.keys(SK).map(k => { const n = cnt(k); return '<button class="tile ' + SK[k][1] + '" ' + (n ? 'onclick="go(\'learn\',\'' + k + '\')"' : 'disabled') + '>' + ic(SK[k][0]) + '<span>' + k + '<br><small>' + (n ? n + ' pelajaran' : 'Segera hadir') + '</small></span></button>'; }).join('') + '</div>');
}

// ── Daftar pelajaran ──
function learn(skill) {
  const list = S.L.filter(l => !skill || l.Skill === skill);
  view('<h1>' + (skill || 'Peta Belajar') + '</h1>' + (list.length ? list.map(l => {
    const d = S.done[l.ID] != null;
    return '<button class="node ' + (d ? 'ok' : '') + '" onclick="startRun(\'' + l.ID + '\')">' + ic(d ? 'check-circle-fill' : 'play-circle-fill') + '<span class="sp">' + esc(l.Judul) + '<br><small class="mut">' + esc(l.Skill) + ' • ' + esc(l.Unit) + '</small></span>' + (d ? '<span class="pill">' + S.done[l.ID] + '%</span>' : '') + '</button>';
  }).join('') : '<p class="mut">Belum ada pelajaran.</p>'));
}

// ── Placement test ──
function intro() {
  view('<section class="card-ej auth" style="text-align:center">' + MASCOT.replace('<svg', '<svg width="96" height="96"') + '<h1>Tes Penempatan</h1><p>5 soal singkat untuk menentukan level awalmu.</p><button class="btn-ej w" onclick="startRun(\'PLACEMENT\')">Mulai ' + ic('arrow-right') + '</button></section>');
}

// ── Pemutar soal (mcq / listen / tile), semua dinilai instan di klien ──
function startRun(id) {
  const items = S.Q.filter(q => q.LessonID === id);
  if (!items.length) return toast('Soal belum tersedia.', 'err');
  S.run = { id, items, i: 0, score: 0, ans: [], pool: null, done: false };
  q();
}
function q() {
  const r = S.run, it = r.items[r.i], o = String(it.Opsi).split('|');
  const head = '<div class="row noprint" style="margin-bottom:12px"><button class="btn-ej ib" aria-label="Tutup" onclick="' + (r.id === 'PLACEMENT' ? 'intro()' : 'go(\'learn\')') + '">' + ic('x-lg') + '</button><div class="bar sp"><i style="width:' + (r.i / r.items.length * 100) + '%"></i></div><span class="chip">' + (r.i + 1) + '/' + r.items.length + '</span></div>';
  let body = '<h2>' + esc(it.Soal) + '</h2>';
  if (it.Tipe === 'listen') { body += '<button class="btn-ej o" onclick="speak(' + esc(JSON.stringify(it.Audio)).replace(/&quot;/g, '&#34;') + ')">' + ic('volume-up-fill') + ' Putar suara</button><div style="height:12px"></div>'; }
  if (it.Tipe === 'tile') {
    r.pool = r.pool || shuffle(o);
    body += '<div class="tiles" aria-label="Jawabanmu">' + r.ans.map((t, i) => '<button class="tl" onclick="untile(' + i + ')">' + esc(t) + '</button>').join('') + '</div><div class="tiles">' +
      r.pool.map((t, i) => r.ans.indexOf(t) > -1 && r.pool.indexOf(t) === i ? '' : '<button class="tl" onclick="tile(' + i + ')">' + esc(t) + '</button>').join('') + '</div>' +
      '<button class="btn-ej w" ' + (r.done || !r.ans.length ? 'disabled' : '') + ' onclick="checkTile()">Periksa</button>';
  } else body += o.map((t, i) => '<button class="opt" ' + (r.done ? 'disabled' : '') + ' onclick="pick(' + i + ')">' + esc(t) + '</button>').join('');
  view(head + '<section class="card-ej">' + body + '<div id="fb"></div></section>');
  if (it.Tipe === 'listen') setTimeout(() => speak(it.Audio), 300);
}
function tile(i) { const r = S.run; if (r.done) return; r.ans.push(r.pool[i]); q(); }
function untile(i) { const r = S.run; if (r.done) return; r.ans.splice(i, 1); q(); }
function verdict(okk) {
  const r = S.run, it = r.items[r.i]; r.done = true; if (okk) r.score++;
  $('#fb').innerHTML = '<div class="fb ' + (okk ? 'good' : 'bad') + '">' + (okk ? 'Benar! Hebat.' : 'Hampir benar! Jawaban: ' + esc(it.Kunci)) + (it.Penjelasan ? '<br><small>' + esc(it.Penjelasan) + '</small>' : '') + '</div><button class="btn-ej w" onclick="nextQ()">' + (r.i + 1 >= r.items.length ? 'Selesai' : 'Lanjut') + ' ' + ic('arrow-right') + '</button>';
}
function pick(i) {
  const r = S.run; if (r.done) return;
  const it = r.items[r.i], o = String(it.Opsi).split('|'), good = o[i] === String(it.Kunci);
  document.querySelectorAll('.opt').forEach((b, k) => { b.disabled = true; if (o[k] === String(it.Kunci)) b.classList.add('good'); else if (k === i) b.classList.add('bad'); });
  verdict(good);
}
function checkTile() { const r = S.run; verdict(r.ans.join(' ') === String(r.items[r.i].Kunci)); document.querySelectorAll('.tl,.btn-ej.w').forEach(b => { if (b.textContent === 'Periksa') b.disabled = true; }); }
function nextQ() { const r = S.run; r.i++; r.ans = []; r.pool = null; r.done = false; r.i >= r.items.length ? finish() : q(); }

// ── Selesai: UI diperbarui instan (optimistic), sinkron ke server di latar belakang ──
function finish() {
  const r = S.run, total = r.items.length, pct = Math.round(r.score / total * 100), pl = r.id === 'PLACEMENT';
  const xpc = Number(S.set.XP_PER_CORRECT) || 10;
  if (pl) S.u.CEFR = pct >= Number(S.set.CEFR_A2) ? 'A2' : pct >= Number(S.set.CEFR_A1) ? 'A1' : 'Pre-A1';
  else { S.u.XP = Number(S.u.XP) + r.score * xpc; S.done[r.id] = Math.max(S.done[r.id] || 0, pct); }
  syncChips(); stash();
  const job = { id: r.id, s: r.score, t: total };
  call('submitAttempt', S.t, job.id, job.s, job.t).then(d => { S.u.XP = d.xp; S.u.Streak = d.streak; S.u.CEFR = d.cefr || S.u.CEFR; syncChips(); stash(); })
    .catch(() => { const k = JSON.parse(ls.get('ej_q') || '[]'); k.push(job); ls.set('ej_q', JSON.stringify(k)); toast('Offline: hasil disimpan dan dikirim nanti.'); });
  view('<section class="card-ej auth" style="text-align:center">' + MASCOT.replace('<svg', '<svg width="96" height="96"') + '<h1>' + (pl ? 'Level kamu: ' + esc(S.u.CEFR) : pct + '%') + '</h1><p>' + r.score + ' dari ' + total + ' benar' + (pl ? '' : ' • +' + r.score * xpc + ' XP') + '</p><button class="btn-ej w" onclick="go(\'home\')">Ke beranda</button></section>');
  S.run = null;
}
function flushQueue() {
  const k = JSON.parse(ls.get('ej_q') || '[]'); if (!k.length) return;
  ls.del('ej_q');
  k.forEach(j => call('submitAttempt', S.t, j.id, j.s, j.t).catch(() => { const x = JSON.parse(ls.get('ej_q') || '[]'); x.push(j); ls.set('ej_q', JSON.stringify(x)); }));
}

// ── Progres ──
function progress() {
  const u = S.u, sk = Object.keys(SK).filter(k => S.L.some(l => l.Skill === k));
  const nd = Object.keys(S.done).length, badges = [['First Step', 'flag', nd >= 1], ['3-Day Streak', 'fire', u.Streak >= 3], ['100 XP', 'lightning-charge-fill', u.XP >= 100], ['Master', 'trophy', nd >= S.L.length && S.L.length > 0]];
  view('<h1>Progres</h1><div class="stats"><div class="card-ej"><span class="mut">Level CEFR</span><b>' + esc(u.CEFR || '-') + '</b></div><div class="card-ej"><span class="mut">Total XP</span><b>' + u.XP + '</b></div><div class="card-ej"><span class="mut">Streak</span><b>' + u.Streak + ' hari</b></div></div>' +
    '<section class="card-ej"><h2>Penguasaan Kemampuan</h2>' + sk.map(k => { const ls_ = S.L.filter(l => l.Skill === k), d = ls_.filter(l => S.done[l.ID] != null).length, p = Math.round(d / ls_.length * 100); return '<p class="row"><b class="sp">' + k + '</b><span>' + p + '%</span></p><div class="bar" style="margin-bottom:12px"><i style="width:' + p + '%"></i></div>'; }).join('') + '</section>' +
    '<section class="card-ej"><h2>Lencana</h2><div class="grid">' + badges.map(b => '<div class="tile ' + (b[2] ? 'c3' : '') + '" style="' + (b[2] ? '' : 'background:var(--bd);opacity:.6') + '">' + ic(b[1]) + '<span>' + b[0] + '<br><small>' + (b[2] ? 'Diraih' : 'Terkunci') + '</small></span></div>').join('') + '</div></section>');
}

// ── Laporan guru: tampil instan dari data terakhir, lalu disegarkan diam-diam ──
function report() {
  if (S.rep) drawReport(); else view(skel());
  call('getReport', S.t).then(d => { S.rep = d; if (S.tab === 'teacher' && !isTyping()) drawReport(); })
    .catch(e => { if (!S.rep) view('<div class="card-ej"><p>' + esc(e.message) + '</p></div>'); else toast(e.message, 'err'); });
}
const isTyping = () => document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(document.activeElement.tagName) > -1;
function sq(key, v) {   // pencarian dengan debounce; fokus tetap di kolom
  clearTimeout(sq.h);
  sq.h = setTimeout(() => { S.q[key] = v; S.tab === 'admin' ? drawAdmin() : drawReport(); const e = $('#q_' + key); if (e) { e.focus(); e.setSelectionRange(v.length, v.length); } }, 250);
}
function repHTML() {
  const d = S.rep, f = S.q.r.toLowerCase(), rows = d.rows.filter(r => (r.Nama + r.Kelas + r.CEFR).toLowerCase().includes(f)), adm = S.u.Peran === 'Admin', st = d.stats;
  return '<div class="stats">' + (adm ? '<div class="card-ej"><span class="mut">Total pengguna</span><b>' + st.users + '</b></div><div class="card-ej"><span class="mut">Siswa</span><b>' + st.siswa + '</b></div><div class="card-ej"><span class="mut">Guru</span><b>' + st.guru + '</b></div><div class="card-ej"><span class="mut">Percobaan belajar</span><b>' + st.attempts + '</b></div>' :
      '<div class="card-ej"><span class="mut">Kode kelas</span><b>' + esc(d.kode || '-') + '</b></div><div class="card-ej"><span class="mut">Siswa</span><b>' + d.rows.length + '</b></div>') + '</div>' +
    '<section class="card-ej"><h2>Rata-rata per Kemampuan</h2>' + (Object.keys(d.skills).length ? Object.keys(d.skills).map(k => '<p class="row"><b class="sp">' + esc(k) + '</b><span>' + d.skills[k] + '%</span></p><div class="bar" style="margin-bottom:10px"><i style="width:' + d.skills[k] + '%"></i></div>').join('') : '<p class="mut">Belum ada data belajar.</p>') + '</section>' +
    '<section class="card-ej"><div class="row noprint" style="margin-bottom:12px"><div class="fld sp" style="margin:0"><label class="mut" for="q_r">Cari siswa</label><input id="q_r" value="' + esc(S.q.r) + '" oninput="sq(\'r\',this.value)"></div><button class="btn-ej o" onclick="csv()">' + ic('file-earmark-spreadsheet') + ' Excel (CSV)</button><button class="btn-ej o" onclick="window.print()">' + ic('printer') + ' PDF / Cetak</button></div>' +
    '<div class="tw"><table><thead><tr><th>Nama</th><th>Kelas</th><th>CEFR</th><th>XP</th><th>Streak</th><th>Rata-rata</th><th>Aktif</th></tr></thead><tbody>' +
    (rows.length ? rows.map(r => '<tr><td>' + esc(r.Nama) + '</td><td>' + esc(r.Kelas) + '</td><td>' + esc(r.CEFR) + '</td><td>' + r.XP + '</td><td>' + r.Streak + '</td><td><span class="pill ' + (r.Avg && r.Avg < 65 ? 'warn' : '') + '">' + r.Avg + '%</span></td><td>' + esc(r.LastActive) + '</td></tr>').join('') : '<tr><td colspan="7" class="mut">Tidak ada data.</td></tr>') + '</tbody></table></div></section>';
}
function drawReport() { if (S.tab === 'teacher' && S.rep) view('<h1>Dashboard Guru</h1>' + repHTML(), true); }
function dl(file, h, rows) {
  const L = [h].concat(rows).map(l => l.map(v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + L], { type: 'text/csv' })); a.download = file; a.click();
}
function csv() { dl('laporan-kelas.csv', ['Nama','Kelas','CEFR','XP','Streak','RataRata','TerakhirAktif'], S.rep.rows.map(x => [x.Nama, x.Kelas, x.CEFR, x.XP, x.Streak, x.Avg, x.LastActive])); }

// ══ ADMIN: semua data dimuat sekali → pindah tab & pencarian instan, simpan/hapus optimistis ══
function admin() {
  if (S.A) drawAdmin(); else view(skel());
  call('getAdminData', S.t).then(d => { S.A = d; S.rep = d; S.set = Object.assign({}, SETD, d.settings); if (S.tab === 'admin' && !isTyping() && !document.querySelector('dialog[open]')) drawAdmin(); })
    .catch(e => { if (!S.A) view('<div class="card-ej"><p>' + esc(e.message) + '</p></div>'); else toast(e.message, 'err'); });
}
function setAt(t) { S.at = t; S.lq = null; drawAdmin(); window.scrollTo(0, 0); }
function drawAdmin() {
  if (S.tab !== 'admin' || !S.A) return;
  const T = [['sum','Ringkasan','speedometer2'],['usr','Pengguna','people'],['mat','Materi','journal-text'],['set','Pengaturan','gear']];
  const tabs = '<div class="seg noprint" role="tablist">' + T.map(t => '<button role="tab" aria-selected="' + (S.at === t[0]) + '" class="' + (S.at === t[0] ? 'on' : '') + '" onclick="setAt(\'' + t[0] + '\')">' + ic(t[2]) + ' ' + t[1] + '</button>').join('') + '</div>';
  const body = { sum: () => '<h1>Ringkasan Admin</h1>' + repHTML(), usr: usersHTML, mat: () => S.lq ? questionsHTML() : lessonsHTML(), set: settingsHTML }[S.at]();
  view(tabs + body, true);
}
function openForm(title, fields, vals, onSave) {
  let d = $('#dlg'); if (!d) { d = document.createElement('dialog'); d.id = 'dlg'; document.body.appendChild(d); }
  vals = vals || {};
  const inp = f => { const v = vals[f.k] == null ? '' : vals[f.k], at = 'name="' + f.k + '" id="df_' + f.k + '"' + (f.r ? ' required' : '');
    if (f.t === 'select') return '<select ' + at + '>' + f.o.map(o => '<option' + (String(o) === String(v) ? ' selected' : '') + '>' + esc(o) + '</option>').join('') + '</select>';
    if (f.t === 'area') return '<textarea ' + at + ' rows="3">' + esc(v) + '</textarea>';
    return '<input ' + at + ' type="' + (f.t || 'text') + '" value="' + esc(v) + '"' + (f.t === 'password' ? ' autocomplete="new-password"' : '') + '>'; };
  d.innerHTML = '<form class="dl"><h2>' + esc(title) + '</h2>' + fields.map(f => '<div class="fld"><label for="df_' + f.k + '">' + f.l + '</label>' + inp(f) + (f.h ? '<small class="mut">' + f.h + '</small>' : '') + '</div>').join('') +
    '<div class="row"><button type="button" class="btn-ej o sp" onclick="$(\'#dlg\').close()">Batal</button><button class="btn-ej sp" type="submit">Simpan</button></div></form>';
  d.querySelector('form').onsubmit = ev => { ev.preventDefault(); const o = {}; fields.forEach(f => o[f.k] = d.querySelector('[name="' + f.k + '"]').value); d.close(); onSave(o); };
  d.showModal();
}
const LIST = { Users: 'users', Lessons: 'lessons', Questions: 'questions' };
// Simpan optimistis: UI berubah seketika; bila server menolak, dikembalikan + pesan galat
function sv(name, base, o) {
  const list = S.A[LIST[name]], old = base ? Object.assign({}, base) : null, opt = Object.assign({}, base || {}, o);
  delete opt.Password; if (!base) opt.ID = 'tmp' + Date.now();
  if (base) list[list.findIndex(x => x.ID === base.ID)] = opt; else list.unshift(opt);
  drawAdmin();
  call('adminSave', S.t, name, Object.assign({}, o, { ID: base ? base.ID : '' })).then(r => {
    const i = list.findIndex(x => x.ID === opt.ID); if (i > -1) list[i] = r; if (S.lq === opt.ID) S.lq = r.ID;
    toast('Tersimpan'); drawAdmin();
  }).catch(e => {
    const i = list.findIndex(x => x.ID === opt.ID);
    if (i > -1) { if (old) list[i] = old; else list.splice(i, 1); }
    toast(e.message, 'err'); drawAdmin();
  });
}
function del(name, id, label) {
  if (!confirm('Hapus ' + label + '? Data terkait ikut terhapus dan tidak bisa dikembalikan.')) return;
  const list = S.A[LIST[name]], i = list.findIndex(x => x.ID === id), item = list[i], qs = name === 'Lessons' ? S.A.questions.filter(x => x.LessonID === id) : [];
  list.splice(i, 1); if (name === 'Lessons') S.A.questions = S.A.questions.filter(x => x.LessonID !== id);
  drawAdmin();
  call('adminDelete', S.t, name, id).then(() => toast('Dihapus')).catch(e => {
    list.splice(i, 0, item); S.A.questions = S.A.questions.concat(qs); toast(e.message, 'err'); drawAdmin();
  });
}
// — Pengguna —
const UF = [{ k: 'Nama', l: 'Nama lengkap', r: 1 }, { k: 'Username', l: 'Username', r: 1 }, { k: 'Peran', l: 'Peran', t: 'select', o: ['Siswa', 'Guru', 'Admin'] },
  { k: 'Kelas', l: 'Kelas (siswa)', t: 'select', o: [3, 4, 5, 6] }, { k: 'KodeKelas', l: 'Kode kelas', h: 'Guru: kode yang dibagikan ke siswa.' }, { k: 'Password', l: 'Kata sandi', t: 'password', h: 'Kosongkan jika tidak ingin mengubah.' }];
function usersHTML() {
  const q = S.q.u.toLowerCase(), rf = S.q.ur, all = S.A.users, list = all.filter(u => (!rf || u.Peran === rf) && (u.Nama + u.Username + u.KodeKelas).toLowerCase().includes(q)), shown = list.slice(0, 100);
  return '<h1>Pengguna</h1><section class="card-ej"><div class="row noprint" style="margin-bottom:12px"><div class="fld sp" style="margin:0"><label class="mut" for="q_u">Cari</label><input id="q_u" value="' + esc(S.q.u) + '" oninput="sq(\'u\',this.value)"></div>' +
    '<div class="fld" style="margin:0"><label class="mut" for="q_ur">Peran</label><select id="q_ur" onchange="S.q.ur=this.value;drawAdmin()">' + ['', 'Siswa', 'Guru', 'Admin'].map(r => '<option value="' + r + '"' + (r === rf ? ' selected' : '') + '>' + (r || 'Semua') + '</option>').join('') + '</select></div>' +
    '<button class="btn-ej" onclick="eu()">' + ic('person-plus') + ' Tambah</button><button class="btn-ej o" onclick="dlUsers()">' + ic('download') + ' CSV</button></div>' +
    '<p class="mut">' + list.length + ' dari ' + all.length + ' pengguna' + (list.length > 100 ? ' (menampilkan 100 pertama, gunakan pencarian)' : '') + '</p><div class="tw"><table><thead><tr><th>Nama</th><th>Username</th><th>Peran</th><th>Kelas/Kode</th><th>XP</th><th></th></tr></thead><tbody>' +
    (shown.length ? shown.map(u => '<tr><td>' + esc(u.Nama) + '</td><td>' + esc(u.Username) + '</td><td><span class="pill">' + esc(u.Peran) + '</span></td><td>' + esc(u.Kelas || '') + ' ' + esc(u.KodeKelas || '') + '</td><td>' + (Number(u.XP) || 0) + '</td><td class="nw"><button class="btn-ej o sm" aria-label="Ubah ' + esc(u.Nama) + '" onclick="eu(\'' + esc(u.ID) + '\')">' + ic('pencil') + '</button> <button class="btn-ej o sm dng" aria-label="Hapus ' + esc(u.Nama) + '" onclick="del(\'Users\',\'' + esc(u.ID) + '\',\'' + esc(String(u.Nama).replace(/['"\\]/g, '')) + '\')">' + ic('trash') + '</button></td></tr>').join('') : '<tr><td colspan="6" class="mut">Tidak ada data.</td></tr>') + '</tbody></table></div></section>';
}
function eu(id) { const b = id ? S.A.users.find(x => x.ID === id) : null; openForm(b ? 'Ubah pengguna' : 'Tambah pengguna', UF, b || { Peran: 'Siswa', Kelas: 5 }, o => sv('Users', b, o)); }
function dlUsers() { dl('pengguna.csv', ['Nama','Username','Peran','Kelas','KodeKelas','CEFR','XP','Streak'], S.A.users.map(u => [u.Nama, u.Username, u.Peran, u.Kelas, u.KodeKelas, u.CEFR, u.XP, u.Streak])); }
// — Materi (pelajaran & soal) —
const LF = [{ k: 'Judul', l: 'Judul', r: 1 }, { k: 'Skill', l: 'Kemampuan', t: 'select', o: ['Vocabulary','Grammar','Listening','Reading','Writing','Speaking'] }, { k: 'Unit', l: 'Unit' },
  { k: 'Kelas', l: 'Kelas', t: 'select', o: [3, 4, 5, 6] }, { k: 'CEFR', l: 'CEFR', t: 'select', o: ['Pre-A1', 'A1', 'A2', 'B1'] }, { k: 'Urutan', l: 'Urutan', t: 'number' }];
const QF = [{ k: 'Tipe', l: 'Tipe soal', t: 'select', o: ['mcq', 'listen', 'tile'] }, { k: 'Soal', l: 'Pertanyaan', t: 'area', r: 1 }, { k: 'Opsi', l: 'Opsi', r: 1, h: 'Pisahkan dengan tanda | . Tipe tile: semua kata, termasuk pengecoh.' },
  { k: 'Kunci', l: 'Jawaban benar', r: 1, h: 'Sama persis dengan salah satu opsi (tile: kalimat lengkap).' }, { k: 'Audio', l: 'Teks audio', h: 'Wajib untuk tipe listen (dibacakan suara).' }, { k: 'Penjelasan', l: 'Penjelasan' }];
function lessonsHTML() {
  const L = S.A.lessons.slice().sort((a, b) => Number(a.Urutan) - Number(b.Urutan)), n = id => S.A.questions.filter(q => q.LessonID === id).length;
  return '<h1>Materi</h1><section class="card-ej"><div class="row noprint" style="margin-bottom:12px"><span class="mut sp">' + L.length + ' pelajaran • ' + n('PLACEMENT') + ' soal tes penempatan</span><button class="btn-ej o" onclick="S.lq=\'PLACEMENT\';drawAdmin()">Soal penempatan</button><button class="btn-ej" onclick="el()">' + ic('plus-lg') + ' Pelajaran</button></div><div class="tw"><table><thead><tr><th>#</th><th>Judul</th><th>Skill</th><th>Kelas</th><th>CEFR</th><th>Soal</th><th></th></tr></thead><tbody>' +
    (L.length ? L.map(l => '<tr><td>' + esc(l.Urutan) + '</td><td>' + esc(l.Judul) + '<br><small class="mut">' + esc(l.Unit) + '</small></td><td>' + esc(l.Skill) + '</td><td>' + esc(l.Kelas) + '</td><td>' + esc(l.CEFR) + '</td><td>' + n(l.ID) + '</td><td class="nw"><button class="btn-ej o sm" onclick="S.lq=\'' + esc(l.ID) + '\';drawAdmin();window.scrollTo(0,0)">Soal</button> <button class="btn-ej o sm" aria-label="Ubah" onclick="el(\'' + esc(l.ID) + '\')">' + ic('pencil') + '</button> <button class="btn-ej o sm dng" aria-label="Hapus" onclick="del(\'Lessons\',\'' + esc(l.ID) + '\',\'' + esc(String(l.Judul).replace(/['"\\]/g, '')) + '\')">' + ic('trash') + '</button></td></tr>').join('') : '<tr><td colspan="7" class="mut">Belum ada pelajaran.</td></tr>') + '</tbody></table></div></section>';
}
function el(id) { const b = id ? S.A.lessons.find(x => x.ID === id) : null; openForm(b ? 'Ubah pelajaran' : 'Tambah pelajaran', LF, b || { Skill: 'Vocabulary', Kelas: 5, CEFR: 'A1', Urutan: S.A.lessons.length + 1 }, o => sv('Lessons', b, o)); }
function questionsHTML() {
  const l = S.A.lessons.find(x => x.ID === S.lq), qs = S.A.questions.filter(x => x.LessonID === S.lq);
  return '<div class="row noprint" style="margin-bottom:8px"><button class="btn-ej o" onclick="S.lq=null;drawAdmin()">' + ic('arrow-left') + ' Kembali</button></div><h1>Soal: ' + esc(l ? l.Judul : 'Tes Penempatan') + '</h1><section class="card-ej"><div class="row noprint" style="margin-bottom:12px"><span class="mut sp">' + qs.length + ' soal</span><button class="btn-ej" onclick="eq()">' + ic('plus-lg') + ' Soal</button></div><div class="tw"><table><thead><tr><th>Tipe</th><th>Pertanyaan</th><th>Jawaban</th><th></th></tr></thead><tbody>' +
    (qs.length ? qs.map(q => '<tr><td><span class="pill">' + esc(q.Tipe) + '</span></td><td>' + esc(String(q.Soal).slice(0, 90)) + '</td><td>' + esc(q.Kunci) + '</td><td class="nw"><button class="btn-ej o sm" aria-label="Ubah" onclick="eq(\'' + esc(q.ID) + '\')">' + ic('pencil') + '</button> <button class="btn-ej o sm dng" aria-label="Hapus" onclick="del(\'Questions\',\'' + esc(q.ID) + '\',\'soal ini\')">' + ic('trash') + '</button></td></tr>').join('') : '<tr><td colspan="4" class="mut">Belum ada soal.</td></tr>') + '</tbody></table></div></section>';
}
function eq(id) { const b = id ? S.A.questions.find(x => x.ID === id) : null; openForm(b ? 'Ubah soal' : 'Tambah soal', QF, b || { Tipe: 'mcq' }, o => sv('Questions', b, Object.assign({}, o, { LessonID: S.lq }))); }
// — Pengaturan —
function settingsHTML() {
  const s = S.set, yn = (k, a, b) => '<select name="' + k + '" id="s_' + k + '"><option value="true"' + (s[k] === 'true' ? ' selected' : '') + '>' + a + '</option><option value="false"' + (s[k] === 'false' ? ' selected' : '') + '>' + b + '</option></select>', num = (k, a, b) => '<input name="' + k + '" id="s_' + k + '" type="number" min="' + a + '" max="' + b + '" value="' + esc(s[k]) + '" required>';
  const f = (k, l, h, i) => '<div class="fld"><label for="s_' + k + '">' + l + '</label>' + i + (h ? '<small class="mut">' + h + '</small>' : '') + '</div>';
  return '<h1>Pengaturan</h1><form class="card-ej" onsubmit="return saveSet(event)">' +
    f('APP_NAME', 'Nama aplikasi', 'Tampil di judul, menu atas, dan halaman masuk.', '<input name="APP_NAME" id="s_APP_NAME" minlength="2" maxlength="40" value="' + esc(s.APP_NAME) + '" required>') +
    f('ALLOW_REGISTRATION', 'Pendaftaran akun baru', '', yn('ALLOW_REGISTRATION', 'Dibuka', 'Ditutup')) +
    f('MAINTENANCE', 'Mode pemeliharaan', 'Jika aktif, hanya admin yang bisa masuk.', yn('MAINTENANCE', 'Aktif', 'Nonaktif')) +
    f('MIN_PASSWORD', 'Panjang minimal kata sandi', '4-20 karakter.', num('MIN_PASSWORD', 4, 20)) +
    f('XP_PER_CORRECT', 'XP per jawaban benar', '1-100.', num('XP_PER_CORRECT', 1, 100)) +
    f('CEFR_A2', 'Ambang level A2 (%)', 'Skor tes penempatan minimal untuk A2.', num('CEFR_A2', 2, 100)) +
    f('CEFR_A1', 'Ambang level A1 (%)', 'Di bawah ini = Pre-A1. Harus lebih kecil dari ambang A2.', num('CEFR_A1', 1, 99)) +
    '<div class="row"><button class="btn-ej" id="s_go" type="submit">' + ic('check-lg') + ' Simpan pengaturan</button></div></form>' +
    '<section class="card-ej"><h2>Sistem</h2><p class="mut">Jika data di Google Sheets diubah manual, bersihkan cache agar langsung terbaca.</p><div class="row"><button class="btn-ej o" onclick="flushSrv()">' + ic('arrow-repeat') + ' Bersihkan cache server</button>' + (S.A.sheetUrl ? '<a class="btn-ej o" href="' + esc(S.A.sheetUrl) + '" target="_blank" rel="noopener">' + ic('table') + ' Buka Google Sheets</a>' : '') + '</div></section>';
}
function saveSet(ev) {
  ev.preventDefault(); const o = {}; new FormData(ev.target).forEach((v, k) => o[k] = v);
  const old = Object.assign({}, S.set), b = $('#s_go'); b.disabled = true;
  Object.assign(S.set, o); document.title = S.set.APP_NAME; chrome();
  call('saveSettings', S.t, o).then(r => { S.set = Object.assign({}, SETD, r); stash(); toast('Pengaturan disimpan'); drawAdmin(); })
    .catch(e => { S.set = old; document.title = old.APP_NAME; chrome(); toast(e.message, 'err'); drawAdmin(); });
  return false;
}
function flushSrv() { call('clearCache', S.t).then(() => { toast('Cache dibersihkan'); S.A = null; admin(); }).catch(e => toast(e.message, 'err')); }

// ── Init: tampil instan dari cache lokal, server menyusul di latar belakang ──
function warmUp() {
  if (typeof GAS_URL === 'undefined' || !/^https:\/\/script\.google\.com\//.test(GAS_URL)) return;
  fetch(GAS_URL).then(r => r.json()).then(r => {
    const n = Object.assign({}, SETD, (r.data || {}).settings); if (S.u || JSON.stringify(n) === JSON.stringify(S.set)) return;
    S.set = n; if (!(($('#f_un') || {}).value)) authView($('#f_nama') ? 'reg' : undefined);
  }).catch(() => {});
}
document.addEventListener('DOMContentLoaded', () => {
  theme(ls.get('ej_th') || 'light');
  S.t = ls.get('ej_t');
  const end = () => { const b = $('#boot'); if (b) b.remove(); };
  let boot = null; try { boot = JSON.parse(ls.get('ej_boot') || 'null'); } catch (e) {}
  if (S.t && boot && boot.u) {
    S.u = boot.u; S.L = boot.L; S.Q = boot.Q; S.done = boot.done || {}; S.set = Object.assign({}, SETD, boot.set); document.title = S.set.APP_NAME;
    enter(); end();
    refresh().catch(e => { if (/Sesi|pemeliharaan|ditemukan/.test(e.message)) { logout(); toast(e.message, 'err'); } });
  } else if (S.t) {
    call('getBootstrap', S.t).then(d => { apply(d); enter(); }).catch(() => { ls.del('ej_t'); authView(); }).then(end, end);
  } else { authView(); end(); warmUp(); }
});
