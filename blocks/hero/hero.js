const OVERLAY = '/images/full-hero-overlay.png';

/* compact variant: navy gradient swoop with sky-blue curves over the right half (from rjrt.com) */
let swoopId = 0;
function buildSwoop() {
  swoopId += 1;
  const id = `hero-swoop-gradient-${swoopId}`;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 3840 380');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.innerHTML = `<linearGradient id="${id}" x1="1615.932" x2="3840" y1="190" y2="190" gradientUnits="userSpaceOnUse">`
    + '<stop offset="0" stop-color="#09a0db"/><stop offset="0.1" stop-color="#1e3363"/><stop offset="1" stop-color="#1e3363"/></linearGradient>'
    + `<path fill="url(#${id})" d="M1996.4 289.9c5.4 29.7 3.7 59.8-4.3 90.1H3840V0H1615.9c255.1 37.5 356 154.9 380.5 289.9z"/>`
    + '<path fill="#09a0db" opacity="0.5" d="M2124,160.2c-24.9-50.3-82-115.1-212-160.2h-3.7c132,45,189.6,110.2,214.6,160.7c33,66.6,27.3,142.9-14.5,219.3h1.4C2151.5,303.4,2157.1,227,2124,160.2z"/>'
    + '<path fill="#09a0db" opacity="0.5" d="M2287.8,84.9c-25.8-31.7-59.3-59.6-96.8-80.6c-2.6-1.4-5.2-2.9-7.8-4.3h-2.6c3.3,1.8,6.5,3.5,9.7,5.3c37.4,21,70.7,48.7,96.4,80.3c42.8,52.6,62.7,112.4,57.4,172.9c-3.4,39.1-17.6,79.8-42.4,121.5h1.4c24.6-41.6,38.8-82.3,42.2-121.4C2350.8,197.8,2330.9,137.7,2287.8,84.9z"/>';
  return svg;
}

/**
 * Full-bleed hero: row 1 = background image, row 2 = heading (and optional text).
 * Option `compact` (authored "Hero (compact)"): short page banner with an inline SVG swoop
 * instead of the full-hero overlay PNG.
 * @param {Element} block The hero block element
 */
export default function decorate(block) {
  const picture = block.querySelector('picture') || block.querySelector('img');
  const content = [...block.querySelectorAll(':scope > div > div')].find((cell) => cell.querySelector('h1, h2, h3, p:not(:has(picture))'));

  const bg = document.createElement('div');
  bg.className = 'hero-bg';
  const overlay = document.createElement('div');
  overlay.className = 'hero-overlay';
  if (block.classList.contains('compact')) {
    overlay.append(buildSwoop());
  } else {
    const shade = document.createElement('img');
    shade.src = `${window.hlx.codeBasePath}${OVERLAY}`;
    shade.alt = '';
    shade.width = 801;
    shade.height = 435;
    shade.loading = 'eager';
    overlay.append(shade);
  }
  const media = document.createElement('div');
  media.className = 'hero-media';
  if (picture) {
    const img = picture.tagName === 'IMG' ? picture : picture.querySelector('img');
    if (img) { img.loading = 'eager'; img.fetchPriority = 'high'; }
    media.append(picture);
  }
  bg.append(overlay, media);

  const inner = document.createElement('div');
  inner.className = 'hero-content container';
  if (content) inner.append(...content.childNodes);
  inner.querySelectorAll('p:empty').forEach((p) => p.remove());

  block.replaceChildren(bg, inner);
}
