import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
} from './aem.js';

if (window.trustedTypes && window.trustedTypes.createPolicy) {
  const innerTT = window.trustedTypes.createPolicy('tt-inner', {
    createHTML: (s) => s, // avoid stack overflow
  });

  window.trustedTypes.createPolicy('default', {
    createHTML: (input, type, sink) => {
      let processedInput = input;
      if (/srcdoc\s*=/i.test(processedInput)) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('iframe[srcdoc]').forEach((el) => el.removeAttribute('srcdoc'));
        processedInput = doc.body.innerHTML;
      }
      if (sink.includes('createContextualFragment') || sink.includes('Document write')) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('script').forEach((el) => el.remove());
        processedInput = doc.body.innerHTML;
      }
      return processedInput;
    },
    createScriptURL: (input) => input,
    createScript: (input) => input,
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p
      && p.querySelectorAll('a').length === 1
      && p.querySelector('a') === link
      && p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildWidgetAutoBlocks(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Section style "blue-swoop": background photo plus the white curve drawn over it.
 * @param {Element} main The main element
 */
const SWOOP = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1279.1 672.6" height="672.6" width="1279.1" fill="transparent" aria-hidden="true" focusable="false"><path stroke="rgb(255 255 255)" fill="none" d="M1158.6,48.9 c-52.5-29.5-110.3-48-168.8-61.2c-102-23.2-207-30.6-311.4-29.2c-53.1,0.7-106,3.6-158.9,8.6c-51,4.8-102,11.2-152.4,20 C317-4.2,267.1,5.5,217.7,17.5c-5.4,1.3-10.7,2.6-16,4c-0.7,0.2-1.2,0.9-1,1.6c0.2,0.6,0.8,1.1,1.4,1 c478.9-45.3,869.6,77.2,910.3,302c21.2,117-56.2,241.4-200.8,351.4c-0.6,0.4-0.7,1.3-0.3,1.9c0.4,0.6,1.2,0.7,1.8,0.3 c115.3-75.3,237.4-159.8,320.1-271.9c29.6-40.2,54.6-88.3,59-138.8C1300.4,174.7,1237.5,93.2,1158.6,48.9"/></svg>';
const TAB = '<svg class="gradient-panel-tab" viewBox="0 0 1920 32.78" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><path fill="#fff" d="M1186.86,11.13H.07L.09.04h1201.69l-10.26,9.37c-1.27,1.16-2.94,1.77-4.66,1.71"/><path class="gradient-panel-tab-left" d="M1146.13,32.77H0L.05,11.13h1170.43l-16.74,18.3c-1.92,2.19-4.7,3.41-7.61,3.34"/><path class="gradient-panel-tab-right" d="M1187.04,0h732.96v11.13h-749.56l7.54-7.79c2.47-2.26,5.72-3.46,9.06-3.34"/></svg>';
function decorateSectionBackgrounds(main) {
  main.querySelectorAll(':scope > .section.blue-swoop').forEach((section) => {
    const bg = document.createElement('div');
    bg.className = 'section-bg';
    const img = document.createElement('img');
    img.src = `${window.hlx.codeBasePath}/images/blue-swoop-bg.jpg`;
    img.alt = '';
    img.width = 1298;
    img.height = 682;
    bg.append(img);
    bg.insertAdjacentHTML('beforeend', SWOOP);
    section.prepend(bg);
  });

  // Section style "green-gradient": the default content sits on an inset gradient panel
  // with the source's tab-shaped top edge.
  main.querySelectorAll(':scope > .section.green-gradient > .default-content-wrapper').forEach((wrapper) => {
    const panel = document.createElement('div');
    panel.className = 'gradient-panel';
    panel.innerHTML = TAB;
    const content = document.createElement('div');
    content.className = 'gradient-panel-content';
    content.append(...wrapper.childNodes);
    panel.append(content);
    wrapper.append(panel);
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateSectionBackgrounds(main);
  decorateBlocks(main);
  decorateButtons(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('body > header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('body > footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  import('./consent-check.js');
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
