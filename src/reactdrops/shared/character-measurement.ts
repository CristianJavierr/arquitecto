/** Preserve native word advances when inline-block characters lose kerning.
 * Batch writes before reads so measuring a title doesn't force layout per glyph.
 * Connected scripts/ligatures should use words or lines to preserve shaping too.
 */
export function stabilizeCharacterAdvances(words: Element[]) {
  const snapshots = words.map(word => {
    const element = word as HTMLElement;
    const children = Array.from(element.childNodes);
    const chars = Array.from(element.querySelectorAll<HTMLElement>('.masked-lift-char'));
    const text = document.createTextNode(element.textContent ?? '');
    element.replaceChildren(text);
    return { element, children, chars, text };
  });
  const measurements = snapshots.map(({ element, chars, text }) => {
    const width = parseFloat(getComputedStyle(element).width);
    const visualWidth = element.getBoundingClientRect().width;
    const scale = visualWidth && Number.isFinite(width) ? width / visualWidth : 1;
    const range = document.createRange();
    range.setStart(text, 0);
    let offset = 0;
    let previous = 0;
    const advances = chars.map(char => {
      offset += char.textContent?.length ?? 0;
      range.setEnd(text, Math.min(offset, text.length));
      const end = range.getBoundingClientRect().width * scale;
      const advance = Math.max(0, end - previous);
      previous = end;
      return advance;
    });
    return { width, advances };
  });
  snapshots.forEach(({ element, children, chars }, index) => {
    element.replaceChildren(...children);
    const { width, advances } = measurements[index];
    if (Number.isFinite(width)) element.style.width = `${width}px`;
    element.style.whiteSpace = 'pre';
    chars.forEach((char, i) => { char.style.width = `${advances[i]}px`; });
  });
}
