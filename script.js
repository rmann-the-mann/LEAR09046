const portfolio = document.querySelector('#portfolio');

const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const linkEvidenceCodes = root => {
  root.querySelectorAll('p, li, td').forEach(el => {
    if (el.querySelector('img, a') || !/E\d{2}/.test(el.textContent)) return;
    el.innerHTML = el.innerHTML.replace(/\b(E\d{2})\b/g, '<a href="#$1">$1</a>');
  });
};

fetch('content.html').then(r => {
  if (!r.ok) throw new Error('Portfolio content could not be loaded.');
  return r.text();
}).then(html => {
  const source = document.createElement('div');
  source.innerHTML = html;
  const nodes = [...source.children];
  portfolio.innerHTML = '';

  const findIndex = (pattern, start = 0) => nodes.findIndex((n, i) => i >= start && n.matches('h1') && pattern.test(n.textContent));
  const introI = findIndex(/^Introduction$/i);
  const mapI = findIndex(/^Evidence Map$/i);
  const outcomeI = findIndex(/^Learning Outcome 1$/i);
  const conclusionI = findIndex(/^Conclusion$/i);
  const refsI = findIndex(/^References$/i);
  const appendixI = findIndex(/^Appendix/i);
  const firstEvidenceI = nodes.findIndex(n => n.matches('h2') && /^E01\b/.test(n.textContent));

  const makeSection = (id, kicker, title) => {
    const s = document.createElement('section'); s.id = id;
    s.innerHTML = `<p class="section-kicker">${kicker}</p><h1>${title}</h1>`;
    portfolio.append(s); return s;
  };
  const appendRange = (target, from, to) => nodes.slice(from, to).forEach(n => target.append(n));

  const intro = makeSection('introduction', 'Portfolio overview', 'Learning through practice');
  const introText = document.createElement('div'); introText.className = 'intro-block';
  appendRange(introText, introI + 1, mapI); intro.append(introText);

  const map = makeSection('evidence-map', 'Portfolio architecture', 'Evidence map & timeline');
  appendRange(map, mapI + 1, outcomeI);
  appendRange(map, appendixI + 1, firstEvidenceI);
  map.querySelectorAll('h1').forEach(h => { const replacement=document.createElement('h2'); replacement.innerHTML=h.innerHTML; replacement.id=h.id; h.replaceWith(replacement); });
  map.querySelectorAll('table').forEach(t => { const w = document.createElement('div'); w.className='table-wrap'; t.replaceWith(w); w.append(t); });

  const outcomes = makeSection('outcomes', 'Eight learning outcomes', 'Critical reflection');
  const grid = document.createElement('div'); grid.className = 'outcomes-grid'; outcomes.append(grid);
  let i = outcomeI;
  while (i < conclusionI) {
    if (nodes[i]?.matches('h1') && /^Learning Outcome \d+/.test(nodes[i].textContent)) {
      const number = nodes[i].textContent.match(/\d+/)[0];
      const card = document.createElement('article'); card.className='outcome-card'; card.id=`outcome-${number}`; card.dataset.number=number;
      card.innerHTML=`<p class="outcome-label">Learning outcome ${number}</p>`;
      i++;
      while (i < conclusionI && !(nodes[i].matches('h1') && /^Learning Outcome \d+/.test(nodes[i].textContent))) card.append(nodes[i++]);
      grid.append(card);
    } else i++;
  }

  const conclusion = makeSection('conclusion', 'What changed', 'Conclusion');
  const conclusionText = document.createElement('div'); conclusionText.className='intro-block';
  appendRange(conclusionText, conclusionI + 1, refsI); conclusion.append(conclusionText);

  const references = makeSection('references', 'Scholarship informing practice', 'References');
  references.classList.add('references-list'); appendRange(references, refsI + 1, appendixI);
  references.querySelectorAll('p').forEach(p => p.innerHTML = p.innerHTML.replace(/(https?:\/\/[^<\s]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>'));

  const evidence = makeSection('evidence', 'Appendix', 'Evidence collection');
  const evidenceGrid = document.createElement('div'); evidenceGrid.className='evidence-grid'; evidence.append(evidenceGrid);
  let cursor = firstEvidenceI;
  while (cursor < nodes.length) {
    if (nodes[cursor].matches('h2') && /^E\d{2}\b/.test(nodes[cursor].textContent)) {
      const heading = nodes[cursor].textContent.trim(); const code = heading.match(/^E\d{2}/)[0];
      const card = document.createElement('details'); card.className='evidence-card'; card.id=code;
      const summary = document.createElement('summary'); summary.textContent=heading; card.append(summary);
      const body=document.createElement('div'); body.className='evidence-body'; card.append(body); cursor++;
      while(cursor<nodes.length && !(nodes[cursor].matches('h2') && /^E\d{2}\b/.test(nodes[cursor].textContent))) body.append(nodes[cursor++]);
      evidenceGrid.append(card);
    } else cursor++;
  }
  linkEvidenceCodes(portfolio);
  document.querySelectorAll('.outcome-card > p:last-child').forEach(p => p.innerHTML=p.innerHTML.replace('Evidence Referenced:', '<span>Evidence:</span>'));
  document.querySelectorAll('.evidence-body img').forEach(img => {
    img.loading='lazy'; img.tabIndex=0; img.setAttribute('role','button');
    const open=()=>{const d=document.querySelector('#lightbox');d.querySelector('img').src=img.src;d.querySelector('img').alt=img.alt;d.querySelector('p').textContent=img.alt;d.showModal()};
    img.addEventListener('click',open); img.addEventListener('keydown',e=>{if(e.key==='Enter')open()});
  });
  buildNav(); openHashEvidence();
}).catch(err => portfolio.innerHTML=`<p class="loading">${err.message} Serve this folder from a local web server; see README.md.</p>`);

function buildNav(){
  const items=[['introduction','About'],['evidence-map','Map & timeline'],['outcomes','Learning outcomes'],['conclusion','Conclusion'],['references','References'],['evidence','Evidence collection']];
  const nav=document.querySelector('#sectionNav');nav.innerHTML=items.map(([id,label])=>`<a href="#${id}">${label}</a>`).join('');
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){nav.querySelectorAll('a').forEach(a=>a.classList.toggle('active',a.hash===`#${e.target.id}`))}}),{rootMargin:'-20% 0px -70%'});
  items.forEach(([id])=>observer.observe(document.getElementById(id)));
}
function openHashEvidence(){const el=document.querySelector(location.hash);if(el?.matches('details'))el.open=true}
window.addEventListener('hashchange',openHashEvidence);
const menu=document.querySelector('#menuButton'),mobile=document.querySelector('#mobileNav');
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));mobile.hidden=open});
mobile.addEventListener('click',()=>{mobile.hidden=true;menu.setAttribute('aria-expanded','false')});
document.querySelector('#lightbox button').addEventListener('click',()=>document.querySelector('#lightbox').close());
const topButton=document.querySelector('#toTop');window.addEventListener('scroll',()=>topButton.classList.toggle('visible',scrollY>800),{passive:true});topButton.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));
