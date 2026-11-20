const showSeconds = 15;
const colors = ['#ffca64', '#ff799e', '#69e6dc', '#b99aff', '#8ccfff', '#ff965b'];
function choreography() {
  const shells = [];
  for (let beat = 0; beat < 14.45; beat += beat < 10 ? .55 : .32) {
    const count = beat < 4 ? 2 : beat < 10 ? 3 : 4;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      shells.push({
        launch: beat + i * .06, x: .07 + .86 * ((i + Math.random()) / count),
        y: .12 + .46 * Math.random(), drift: .09 * Math.cos(angle),
        size: .095 + Math.random() * .12, color: colors[Math.floor(Math.random() * colors.length)],
        angle, flight: .35 + .22 * Math.random(), life: 1.2 + .65 * Math.random()
      });
    }
  }
  return shells;
}

function drawShell(ctx, shell, age, w, h) {
  const x = shell.x * w, y = shell.y * h, r = Math.min(w,h) * shell.size;
  ctx.lineWidth = 2;
  ctx.strokeStyle = shell.color;
  ctx.beginPath();
  if (age < shell.flight) {
    const remaining = 1 - age / shell.flight;
    ctx.globalAlpha = .9;
    ctx.moveTo(x + shell.drift*w*remaining, y + (h-y)*remaining*remaining);
    const tail = Math.min(1, remaining+.065);
    ctx.lineTo(x + shell.drift*w*tail, y + (h-y)*tail*tail);
    ctx.stroke();
    return;
  }
  const progress = (age-shell.flight)/shell.life;
  const spread = 1 - (1-progress)**2.5;
  const fall = progress*progress*r*.66;
  for (let ring = 0; ring < 2; ring++) {
    ctx.strokeStyle = ring ? '#fff0bf' : shell.color;
    ctx.globalAlpha = (1-progress)**.75;
    ctx.beginPath();
    const sparks = ring ? 22 : 54;
    for (let j = 0; j < sparks; j++) {
      const angle = shell.angle + j*2*Math.PI/sparks;
      const length = r*spread*(ring ? .45 : .9+.1*Math.sin(j*7+shell.angle));
      const dx = Math.cos(angle)*length, dy = Math.sin(angle)*length;
      ctx.moveTo(x+dx*.83,y+dy*.83+fall);
      ctx.lineTo(x+dx,y+dy+fall);
    }
    ctx.stroke();
  }
}

export function initGreeting(enableSound, boom) {
  const dialog = document.getElementById('greeting');
  const canvas = document.getElementById('fireworks');
  const button = document.getElementById('celebrate');
  const card = dialog.querySelector('.greeting-card');
  const leave = dialog.querySelector('.leave-show');
  dialog.remove();
  let frame, timer;
  button.addEventListener('click', () => {
    card.hidden = true;
    leave.hidden = false;
    dialog.setAttribute('aria-label','Màn pháo hoa 20/11');
    dialog.removeAttribute('aria-labelledby');
    document.body.append(dialog);
    dialog.showModal();
    leave.focus();
    enableSound();
    const ctx = canvas.getContext('2d');
    const reduced = document.getElementById('reduced').checked || matchMedia('(prefers-reduced-motion: reduce)').matches;
    const shells = choreography(), start = performance.now();
    let previous = 0, lastBoom = -1;
    function paint(now) {
      if (!dialog.open || !ctx) return;
      const elapsed = (now-start)/1000;
      const time = reduced ? 11.6 : elapsed;
      const w = canvas.clientWidth, h = canvas.clientHeight, scale = Math.min(devicePixelRatio, 2);
      if (canvas.width !== Math.round(w*scale) || canvas.height !== Math.round(h*scale)) {
        canvas.width = Math.round(w*scale); canvas.height = Math.round(h*scale);
      }
      ctx.setTransform(scale,0,0,scale,0,0);
      ctx.clearRect(0,0,w,h);
      for (const shell of shells) {
        const age = time-shell.launch;
        if (age < 0 || age >= shell.flight+shell.life) continue;
        drawShell(ctx,shell,age,w,h);
        if (!reduced && previous < shell.launch+shell.flight && age >= shell.flight && time-lastBoom > .17) {
          boom(); lastBoom=time;
        }
      }
      previous=time;
      ctx.globalAlpha=1;
      if (!reduced && time < showSeconds+2) frame=requestAnimationFrame(paint);
    }
    paint(start);
    timer=setTimeout(() => {
      if (!dialog.open) return;
      card.hidden=false;
      leave.hidden=true;
      dialog.setAttribute('aria-labelledby','greeting-title');
      dialog.removeAttribute('aria-label');
      card.querySelector('button').focus();
    },showSeconds*1000);
  });
  leave.onclick=()=>dialog.close();
  dialog.addEventListener('close', () => {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    dialog.remove();
    button.focus();
  });
}
