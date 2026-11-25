const TAB_PATHS = '<path class="columns-tab-lower" d="M32.78,252.07v147.93l-21.64-.06v-176.86l18.3,19.92c2.26,2.46,3.46,5.72,3.34,9.06"/>'
  + '<path class="columns-tab-upper" d="M0,206.52V0h11.13v223.12l-7.79-7.54c-2.26-2.47-3.46-5.72-3.34-9.07"/>';

/**
 * media-text option: tag each row with the side its image sits on and add the
 * vertical tab strip on the image's inner edge (facing the text).
 * @param {Element} block The columns block element
 */
function decorateMediaText(block) {
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const imgIndex = cells.findIndex((cell) => cell.classList.contains('columns-img-col'));
    if (imgIndex < 0) return;
    const imgCell = cells[imgIndex];
    row.classList.add(imgIndex === 0 ? 'columns-image-left' : 'columns-image-right');

    const ns = 'http://www.w3.org/2000/svg';
    const tab = document.createElementNS(ns, 'svg');
    tab.setAttribute('class', 'columns-tab');
    tab.setAttribute('viewBox', '0 0 32.78 400');
    tab.setAttribute('preserveAspectRatio', 'none');
    tab.setAttribute('aria-hidden', 'true');
    tab.setAttribute('focusable', 'false');
    tab.innerHTML = TAB_PATHS;
    imgCell.append(tab);
  });
}

export default function decorate(block) {
  const cols = [...(block.firstElementChild?.children || [])];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  if (block.classList.contains('media-text')) decorateMediaText(block);
}
