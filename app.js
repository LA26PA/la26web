// ---------- cielo del hero: estrellas, luna cuadrada y un skyline de bloques ----------
(function () {
  const lienzo = document.getElementById('cielo');
  if (!lienzo) return;
  const ctx = lienzo.getContext('2d');
  const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, estrellas = [], capas = [], ratonX = 0, desvio = 0, ultimo = 0;

  function azar(semilla) {   // siempre dibuja el mismo paisaje
    let s = semilla | 0;
    return function () {
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function armar() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = lienzo.getBoundingClientRect();
    W = r.width; H = r.height;
    lienzo.width = Math.round(W * dpr); lienzo.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const R = azar(26);

    estrellas = Array.from({ length: Math.round((W * H) / 5200) }, () => ({
      x: R() * W, y: R() * H * 0.7, g: R() < 0.14 ? 2 : 1, fase: R() * 6.28, vel: 0.4 + R() * 1.1,
    }));

    const defs = [
      { bloque: 46, alto: 0.30, rango: 0.16, color: '#03140f', borde: 0.13, par: 8 },
      { bloque: 34, alto: 0.21, rango: 0.12, color: '#020c09', borde: 0.08, par: 18 },
      { bloque: 26, alto: 0.12, rango: 0.09, color: '#010504', borde: 0, par: 34 },
    ];
    capas = defs.map((d) => {
      const n = Math.ceil(W / d.bloque) + 8;
      const cols = [];
      let h = 0.5;
      for (let i = 0; i < n; i++) {
        h = Math.max(0, Math.min(1, h + (R() - 0.5) * 0.6));
        let alto = d.alto + (h - 0.5) * d.rango * 2;
        if (R() < 0.07) alto += 0.05 + R() * 0.06;      // alguna torre o árbol más alto
        cols.push(Math.max(1, Math.round((alto * H) / d.bloque)) * d.bloque);
      }
      return { ...d, cols };
    });
  }

  function luna() {
    const chico = W < 600;
    const t = chico ? 44 : Math.max(56, Math.min(96, W * 0.055));
    const x = W * (chico ? 0.8 : 0.78), y = chico ? 26 : Math.max(70, H * 0.17);
    const brillo = ctx.createRadialGradient(x + t / 2, y + t / 2, t * 0.3, x + t / 2, y + t / 2, t * 3.4);
    brillo.addColorStop(0, 'rgba(200,255,225,.28)'); brillo.addColorStop(1, 'rgba(200,255,225,0)');
    ctx.fillStyle = brillo; ctx.fillRect(x - t * 3, y - t * 3, t * 7, t * 7);
    ctx.fillStyle = '#e9fff2'; ctx.fillRect(x, y, t, t);
    ctx.fillStyle = 'rgba(110,190,150,.38)';
    const u = t / 4;
    [[0, 1], [1, 0], [2, 2], [3, 1], [1, 3]].forEach(([cx, cy]) => ctx.fillRect(x + cx * u, y + cy * u, u, u));
  }

  function dibujar(t) {
    const cielo = ctx.createLinearGradient(0, 0, 0, H);
    cielo.addColorStop(0, '#02110f'); cielo.addColorStop(0.55, '#06362d'); cielo.addColorStop(1, '#04100e');
    ctx.fillStyle = cielo; ctx.fillRect(0, 0, W, H);

    for (const e of estrellas) {
      const a = sinMovimiento ? 0.7 : 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(t / 1000 * e.vel + e.fase));
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(e.x, e.y, e.g, e.g);
    }
    luna();

    for (const c of capas) {
      const dx = -desvio * c.par;
      ctx.fillStyle = c.color;
      for (let i = 0; i < c.cols.length; i++) {
        const x = i * c.bloque + dx - c.bloque * 2;
        ctx.fillRect(x, H - c.cols[i], c.bloque + 0.6, c.cols[i]);
      }
      if (c.borde) {
        ctx.fillStyle = `rgba(141,255,184,${c.borde})`;
        for (let i = 0; i < c.cols.length; i++) ctx.fillRect(i * c.bloque + dx - c.bloque * 2, H - c.cols[i], c.bloque + 0.6, 2);
      }
    }
    const niebla = ctx.createLinearGradient(0, H * 0.7, 0, H);
    niebla.addColorStop(0, 'rgba(4,16,14,0)'); niebla.addColorStop(1, 'rgba(4,16,14,.85)');
    ctx.fillStyle = niebla; ctx.fillRect(0, H * 0.7, W, H * 0.3);
  }

  function ciclo(t) {
    requestAnimationFrame(ciclo);
    if (t - ultimo < 33) return;       // ~30 cuadros por segundo alcanzan
    ultimo = t;
    desvio += (ratonX - desvio) * 0.06;
    dibujar(t);
  }

  armar(); dibujar(0);
  let espera;
  addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(() => { armar(); dibujar(performance.now()); }, 120); });
  if (!sinMovimiento) {
    addEventListener('pointermove', (e) => { ratonX = (e.clientX / innerWidth - 0.5) * 2; });
    requestAnimationFrame(ciclo);
  }
})();

// ---------- menú en celular ----------
(function () {
  const btn = document.getElementById('menuBtn');
  const nav = document.getElementById('subnav');
  if (!btn || !nav) return;
  const cerrar = () => { nav.classList.remove('abierto'); btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('click', () => {
    const abre = !nav.classList.contains('abierto');
    nav.classList.toggle('abierto', abre);
    btn.setAttribute('aria-expanded', String(abre));
  });
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) cerrar(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });
})();
