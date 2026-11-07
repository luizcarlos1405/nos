// The header on the sky sticks to the top of the screen, down to the band, while the land scrolls under
// it (css/style.css, "The header sticks"). Where the header is short (the inner pages on phones) it
// sticks whole. Where it is tall (from 760px, and the home) it folds: what sits under its bar (the
// page's name and line, the greeting and the date) fades out as the page leaves its top, and the header
// scrolls up under the bar (.site-bar: the mark, the links, the theme button), which stays, until only
// the bar is left on the sky's last bands, over the band. This module measures it:
// - --fold, on the header: how much of it scrolls away (its height under the bar, less the sky it keeps
//   under it, --head-keep; 0 where it sticks whole), so that it sticks at top: -fold;
// - --head-stuck, on <html>: the height it keeps on screen with its band (0 where it doesn't stick, on
//   short screens), under which the desk's panels stick and focus lands (scroll-padding-top).
// The fade and the home's band are tied to the scroll in CSS; where scroll timelines aren't supported,
// it marks <html> instead: data-scrolled once the page leaves its top, data-stuck once the header has
// folded all the way.

export function initHead() {
  const head = document.querySelector('.site-head');
  const bar = head?.querySelector('.site-bar');
  if (!bar) return;
  const root = document.documentElement;
  const timelines = window.CSS?.supports?.('animation-timeline: scroll()');
  let fold = 0;

  const mark = (name, on) => {
    if (root.hasAttribute(name) !== on) root.toggleAttribute(name, on);
  };
  const update = () => {
    if (timelines) return;
    mark('data-scrolled', window.scrollY > 0);
    mark('data-stuck', window.scrollY >= fold);
  };
  const measure = () => {
    const style = getComputedStyle(head);
    const sticky = style.position === 'sticky';
    const height = head.getBoundingClientRect().height;
    const keep = parseFloat(style.getPropertyValue('--head-keep')) || 0;
    fold = sticky && getComputedStyle(bar).position === 'sticky'
      ? Math.max(0, height - parseFloat(style.paddingTop) - bar.getBoundingClientRect().height - keep)
      : 0;
    const band = sticky ? parseFloat(getComputedStyle(head, '::after').height) || 0 : 0;
    head.style.setProperty('--fold', `${fold}px`);
    root.style.setProperty('--head-stuck', `${sticky ? height - fold + band : 0}px`);
    update();
  };

  // The header's height changes with the width, the fonts and the page's line ("4 atividades até
  // 20/11"); crossing into a short screen changes whether it sticks, not its height.
  let frame = 0;
  const later = () => {
    if (!frame) frame = requestAnimationFrame(() => {
      frame = 0;
      measure();
    });
  };
  new ResizeObserver(later).observe(head);
  window.addEventListener('resize', later);
  if (!timelines) window.addEventListener('scroll', update, { passive: true });
  measure();
}
