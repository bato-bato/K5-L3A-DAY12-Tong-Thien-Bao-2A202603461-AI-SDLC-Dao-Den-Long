// Each shell follows its launch trail, then opens into a ring of drifting sparks.
export function initGreeting() {
  const dialog = document.getElementById('greeting');
  const canvas = document.getElementById('fireworks');
  const button = document.getElementById('celebrate');
  dialog.remove();
  const colors = ['#ffd585', '#ff9c97', '#92e9d8', '#b8b0ff'];
  let frame = 0;
  button.addEventListener('click', () => {
    document.body.append(dialog);
    dialog.showModal();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduced = document.getElementById('reduced').checked || matchMedia('(prefers-reduced-motion: reduce)').matches;
    const positions = [[.20,.25],[.79,.31],[.64,.13],[.12,.58],[.88,.57],[.38,.18]];
    const start = performance.now();
    function paint(now) {
      if (!dialog.open) return;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const scale = Math.min(devicePixelRatio, 2);
      if (canvas.width !== Math.round(w*scale) || canvas.height !== Math.round(h*scale)) {
        canvas.width = Math.round(w*scale); canvas.height = Math.round(h*scale);
      }
      ctx.setTransform(scale,0,0,scale,0,0);
      ctx.clearRect(0,0,w,h);
      const time = (now-start)/1000, size = Math.min(w,h)*.13;
      positions.forEach(([x,y],i) => {
        const age = reduced ? 1.05 : (time-i*.52)%4.6;
        if (age < 0 || age > 2.1) return;
        ctx.strokeStyle = colors[i%colors.length];
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (age < .42) {
          const rise = 1-age/.42;
          ctx.globalAlpha = .85;
          ctx.moveTo(x*w,y*h+rise*rise*h*.65);
          ctx.lineTo(x*w+1,y*h+rise*rise*h*.65+14);
        } else {
          const u=(age-.42)/1.68;
          ctx.globalAlpha=1-u;
          for(let j=0;j<60;j++){
            const angle=j*2.39996+i, speed=size*(.48+.52*((j*17)%29)/28);
            const radius=speed*(1-Math.pow(1-u,3));
            const dx=Math.cos(angle)*radius, dy=Math.sin(angle)*radius, fall=u*u*size*.52;
            ctx.moveTo(x*w+dx*.86,y*h+dy*.86+fall);
            ctx.lineTo(x*w+dx,y*h+dy+fall);
          }
        }
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      if (!reduced) frame=requestAnimationFrame(paint);
    }
    paint(start);
  });
  dialog.addEventListener('close', () => {
    cancelAnimationFrame(frame);
    dialog.remove();
    button.focus();
  });
}
