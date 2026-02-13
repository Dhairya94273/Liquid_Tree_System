document.addEventListener('DOMContentLoaded', ()=>{
  // Accordion behavior
  document.querySelectorAll('.acc-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const panel = btn.nextElementSibling;
      const open = panel.style.display === 'block';
      // close all
      document.querySelectorAll('.acc-panel').forEach(p=> p.style.display='none');
      if (!open) panel.style.display='block';
    });
  });

  // small reveal animation for hero and cards
  const hero = document.querySelector('.about-hero');
  const cards = document.querySelectorAll('.about-cards .card');
  if (hero) hero.style.opacity = 0, setTimeout(()=> hero.style.transition='opacity 600ms', hero.style.opacity=1, 10);
  cards.forEach((c,i)=>{ c.style.opacity=0; setTimeout(()=>{ c.style.transition='opacity 600ms'; c.style.opacity=1; }, 200 + i*120); });
});
