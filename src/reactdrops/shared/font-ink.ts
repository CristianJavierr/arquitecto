export type InkPadding = { top: number; bottom: number; left: number; right: number; rangeTop: number; rangeBottom: number };

type Baseline = { baseline: number; rangeAscent: number; rangeDescent: number; usedHeight: number };
type InkMetrics = { ascent: number; descent: number; left: number; right: number };

/** LRU bounded by both entry count and retained key characters. No DOM nodes. */
class BoundedCache<T> {
  private values = new Map<string, T>();
  private characters = 0;
  constructor(private limit: number, private budget = 131072) {}
  get(key: string) {
    const value = this.values.get(key);
    if (value !== undefined) { this.values.delete(key); this.values.set(key, value); }
    return value;
  }
  set(key: string, value: T) {
    if (key.length > this.budget / 4) return;
    if (this.values.has(key)) this.values.delete(key);
    else this.characters += key.length;
    this.values.set(key, value);
    while (this.values.size > this.limit || this.characters > this.budget) {
      const oldest = this.values.keys().next().value!;
      this.values.delete(oldest); this.characters -= oldest.length;
    }
  }
  clear() { this.values.clear(); this.characters = 0; }
}
const stretches: Record<string, CanvasFontStretch> = { '50%': 'ultra-condensed', '62.5%': 'extra-condensed', '75%': 'condensed', '87.5%': 'semi-condensed', '100%': 'normal', '112.5%': 'semi-expanded', '125%': 'expanded', '150%': 'extra-expanded', '200%': 'ultra-expanded' };
function createState(document: Document) {
  const state = {
    context: undefined as CanvasRenderingContext2D | null | undefined,
    cache: new BoundedCache<InkPadding>(256),
    baselines: new BoundedCache<Baseline>(64, 16384),
    metrics: new BoundedCache<InkMetrics>(512),
    seams: new BoundedCache<readonly boolean[]>(128, 65536),
    raster: undefined as CanvasRenderingContext2D | null | undefined,
    configuredFont: '',
    fontCount: document.fonts?.size,
    fontStatus: document.fonts?.status,
    faces: [] as Array<{ face: FontFace; signature: string }>,
  };
  const invalidate = () => {
    state.cache.clear(); state.baselines.clear(); state.metrics.clear(); state.seams.clear();
    state.configuredFont = '';
    state.faces = [];
    state.fontCount = document.fonts?.size; state.fontStatus = document.fonts?.status;
  };
  // One set of listeners per document, not per component or replay.
  document.fonts?.addEventListener('loading', invalidate);
  document.fonts?.addEventListener('loadingdone', invalidate);
  document.fonts?.addEventListener('loadingerror', invalidate);
  return Object.assign(state, { invalidate });
}
type State = ReturnType<typeof createState>;
const documents = new WeakMap<Document, State>();

function getFontState(document: Document, checkedFonts: WeakSet<Document>) {
  let state = documents.get(document);
  if (!state) { state = createState(document); documents.set(document, state); }
  if (state.fontCount !== document.fonts?.size || state.fontStatus !== document.fonts?.status) state.invalidate();
  if (!checkedFonts.has(document)) {
    checkedFonts.add(document);
    // Also catch already-loaded face replacements/descriptor edits, which
    // need not emit a FontFaceSet loading event. Check once per preparation.
    const faces = Array.from(document.fonts ?? []).map(face => {
      const metrics = face as FontFace & { variationSettings?: string; ascentOverride?: string; descentOverride?: string; lineGapOverride?: string; sizeAdjust?: string };
      return { face, signature: [face.family, face.style, face.weight, face.stretch, face.unicodeRange, face.featureSettings, face.status,
        metrics.variationSettings, metrics.ascentOverride, metrics.descentOverride, metrics.lineGapOverride, metrics.sizeAdjust].join('|') };
    });
    if (faces.length !== state.faces.length || faces.some((entry, index) => entry.face !== state!.faces[index]?.face || entry.signature !== state!.faces[index]?.signature)) {
      state.invalidate(); state.faces = faces;
    }
  }
  return state;
}

/** Shared, bounded geometry caches survive Replay and component remounts.
 * Font events invalidate them; typography, text and DPR are part of cache keys.
 * The small per-pass style cache never outlives the preparation that owns it.
 */
export function createFontInkMeasurer() {
  const styles = new WeakMap<HTMLElement, CSSStyleDeclaration>();
  // A factory belongs to one synchronous preparation. Every glyph of a source
  // shares these style keys; build them once, rather than reading CSS per glyph.
  const signatures = new WeakMap<CSSStyleDeclaration, { font: string; glyphSignature: string; signature: string; prefix: string }>();
  const checkedFonts = new WeakSet<Document>();
  return (element: HTMLElement, text = element.textContent ?? '', computedStyle?: CSSStyleDeclaration): InkPadding => {
    const document = element.ownerDocument;
    const view = document.defaultView!;
    const css = computedStyle ?? styles.get(element) ?? view.getComputedStyle(element);
    styles.set(element, css);
    const size = parseFloat(css.fontSize) || 16;
    const fallback = { top: size * .25, bottom: size * .25, left: size * .25, right: size * .25, rangeTop: -size * .25, rangeBottom: size * .25 };
    if (!text.trim()) return { top: 0, bottom: 0, left: 0, right: 0, rangeTop: 0, rangeBottom: 0 };
    // Canvas cannot reproduce custom OpenType axes/features or vertical layout.
    // Keep an explicit conservative fallback; manual mode can override it.
    if (css.writingMode !== 'horizontal-tb'
      || css.fontVariationSettings !== 'normal' || css.fontFeatureSettings !== 'normal') return fallback;
    const state = getFontState(document, checkedFonts);
    const { cache, baselines } = state;
    let keys = signatures.get(css);
    if (!keys) {
      const font = `${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
      const glyphSignature = [font, css.fontStretch, css.fontKerning, css.fontVariantCaps,
        css.letterSpacing, css.wordSpacing, css.textTransform, css.direction].join('\n');
      const signature = `${glyphSignature}\n${css.lineHeight}`;
      keys = { font, glyphSignature, signature,
        prefix: `${signature}\n${css.getPropertyValue('-webkit-text-stroke-width')}\n${view.devicePixelRatio || 1}\n` };
      signatures.set(css, keys);
    }
    const { font, glyphSignature, signature } = keys;
    const key = keys.prefix + text;
    const cached = cache.get(key);
    if (cached) return { ...cached };
    if (state.context === undefined) state.context = document.createElement('canvas').getContext('2d');
    const context = state.context;
    if (!context) return fallback;
    const stretch = stretches[css.fontStretch] ?? css.fontStretch;
    if (stretch.endsWith('%')) return fallback;
    if (state.configuredFont !== glyphSignature) {
      context.font = font;
      context.textAlign = 'left'; context.textBaseline = 'alphabetic';
      context.direction = css.direction === 'rtl' ? 'rtl' : 'ltr';
      context.fontKerning = css.fontKerning as CanvasFontKerning;
      context.fontStretch = stretch as CanvasFontStretch;
      context.fontVariantCaps = css.fontVariantCaps as CanvasFontVariantCaps;
      if ('letterSpacing' in context) context.letterSpacing = css.letterSpacing === 'normal' ? '0px' : css.letterSpacing;
      if ('wordSpacing' in context) context.wordSpacing = css.wordSpacing === 'normal' ? '0px' : css.wordSpacing;
      state.configuredFont = glyphSignature;
    }

    // A zero-size inline marker gives the DOM baseline under the exact CSS.
    // The probe is absolute, invisible and removed immediately; it cannot alter wrapping.
    let geometry = baselines.get(signature);
    if (!geometry) {
      const probe = document.createElement('span');
      probe.setAttribute('aria-hidden', 'true');
      probe.style.cssText = 'position:absolute;display:block;visibility:hidden;pointer-events:none;white-space:pre;width:max-content;padding:0;margin:0;border:0;';
      const sample = document.createTextNode('Mg');
      const marker = document.createElement('span');
      marker.style.cssText = 'display:inline-block;width:0;height:0;padding:0;margin:0;border:0;vertical-align:baseline';
      probe.append(sample, marker); element.appendChild(probe);
      const box = probe.getBoundingClientRect();
      const usedHeight = parseFloat(view.getComputedStyle(probe).height);
      const scale = box.height && usedHeight ? usedHeight / box.height : 1;
      const markerTop = marker.getBoundingClientRect().top;
      const baseline = (markerTop - box.top) * scale;
      const range = document.createRange(); range.selectNodeContents(sample);
      const glyphBox = range.getBoundingClientRect();
      const rangeAscent = (markerTop - glyphBox.top) * scale;
      const rangeDescent = (glyphBox.bottom - markerTop) * scale;
      probe.remove();
      geometry = { baseline, rangeAscent, rangeDescent, usedHeight };
      baselines.set(signature, geometry);
    }
    const { baseline, rangeAscent, rangeDescent, usedHeight } = geometry;
    let ascent = 0, descent = 0, left = 0, right = 0;
    // Measure words too: each may become an edge after responsive line wrapping.
    const chunks = new Set([text, ...text.split(/\s+/u).filter(Boolean)]);
    for (let chunk of chunks) {
      if (css.textTransform === 'uppercase') chunk = chunk.toLocaleUpperCase();
      else if (css.textTransform === 'lowercase') chunk = chunk.toLocaleLowerCase();
      else if (css.textTransform === 'capitalize') chunk = chunk.replace(/(^|\s)(\S)/gu, (_, space, char) => space + char.toLocaleUpperCase());
      const metricsKey = `${glyphSignature}\n${chunk}`;
      let metrics = state.metrics.get(metricsKey);
      if (!metrics) {
        const measured = context.measureText(chunk);
        if (![measured.actualBoundingBoxAscent, measured.actualBoundingBoxDescent, measured.actualBoundingBoxLeft, measured.actualBoundingBoxRight].every(Number.isFinite)) return fallback;
        metrics = { ascent: measured.actualBoundingBoxAscent, descent: measured.actualBoundingBoxDescent,
          left: measured.actualBoundingBoxLeft, right: measured.actualBoundingBoxRight - measured.width };
        state.metrics.set(metricsKey, metrics);
      }
      ascent = Math.max(ascent, metrics.ascent);
      descent = Math.max(descent, metrics.descent);
      left = Math.max(left, metrics.left);
      right = Math.max(right, metrics.right);
    }
    const stroke = (parseFloat(css.getPropertyValue('-webkit-text-stroke-width')) || 0) / 2;
    const fringe = 1 / (view.devicePixelRatio || 1);
    const result = {
      top: Math.max(0, ascent - Math.min(baseline, rangeAscent)) + stroke + fringe,
      bottom: Math.max(0, descent - Math.min(usedHeight - baseline, rangeDescent)) + stroke + fringe,
      left: Math.max(0, left) + stroke + fringe,
      right: Math.max(0, right) + stroke + fringe,
      rangeTop: rangeAscent - ascent - stroke - fringe,
      rangeBottom: descent - rangeDescent + stroke + fringe,
    };
    cache.set(key, result);
    return { ...result };
  };
}

/** Test proposed vertical seams against a raster of the entire shaped line.
 * Only empty columns may separate independently moving snapshots. Uncertain
 * Canvas/DOM parity keeps the line together. Results, never pixels, are cached.
 */
export function createInkSeamTester(element: HTMLElement, css: CSSStyleDeclaration) {
  const document = element.ownerDocument;
  const checkedFonts = new WeakSet<Document>();
  return (text: string, width: number, seams: number[]): readonly boolean[] => {
    const unsafe = () => seams.map(() => false);
    if (!seams.length) return [];
    if (css.writingMode !== 'horizontal-tb' || css.direction !== 'ltr'
      || css.fontVariationSettings !== 'normal' || css.fontFeatureSettings !== 'normal'
      || css.fontVariantLigatures !== 'normal' || css.textTransform !== 'none'
      || css.textAlign === 'justify' || css.textShadow !== 'none' || css.filter !== 'none'
      || /[\u0590-\u08ff]/u.test(text)) return unsafe();
    const stretch = stretches[css.fontStretch] ?? css.fontStretch;
    if (stretch.endsWith('%')) return unsafe();
    const state = getFontState(document, checkedFonts);
    const font = `${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
    const stroke = parseFloat(css.getPropertyValue('-webkit-text-stroke-width')) || 0;
    const key = [font, stretch, css.fontKerning, css.fontVariantCaps, css.letterSpacing,
      css.wordSpacing, css.textRendering, stroke, width, seams.join(','), text].join('\n');
    const cached = state.seams.get(key);
    if (cached) return cached;
    const remember = (value: readonly boolean[]) => { Object.freeze(value); state.seams.set(key, value); return value; };
    if (state.raster === undefined) state.raster = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const context = state.raster;
    if (!context || !('letterSpacing' in context) || !('wordSpacing' in context)) return remember(unsafe());
    const configure = () => {
      context.font = font; context.textAlign = 'left'; context.textBaseline = 'alphabetic'; context.direction = 'ltr';
      context.fontStretch = stretch as CanvasFontStretch; context.fontKerning = css.fontKerning as CanvasFontKerning;
      context.fontVariantCaps = css.fontVariantCaps as CanvasFontVariantCaps;
      context.letterSpacing = css.letterSpacing === 'normal' ? '0px' : css.letterSpacing;
      context.wordSpacing = css.wordSpacing === 'normal' ? '0px' : css.wordSpacing;
      context.textRendering = css.textRendering as CanvasTextRendering;
    };
    configure();
    const metrics = context.measureText(text);
    const { actualBoundingBoxLeft: left, actualBoundingBoxRight: right, actualBoundingBoxAscent: ascent, actualBoundingBoxDescent: descent } = metrics;
    // Range widths have subpixel rounding; larger disagreements mean shaping,
    // whitespace or CSS cannot be reproduced safely by Canvas.
    if (![left, right, ascent, descent].every(Number.isFinite) || Math.abs(metrics.width - width) > .15) return remember(unsafe());
    const scale = 2, fringe = 1, pad = stroke / 2 + fringe;
    const origin = Math.ceil(Math.max(0, left) + pad);
    const baseline = Math.ceil(ascent + pad);
    const w = Math.ceil((origin + Math.max(width, right) + pad) * scale);
    const h = Math.ceil((baseline + descent + pad) * scale);
    // Bound readback memory and cold work for oversized text. Grouping is safe.
    if (w <= 0 || h <= 0 || w > 8192 || h > 2048 || w * h > 1048576) return remember(unsafe());
    context.canvas.width = w; context.canvas.height = h;
    configure(); context.scale(scale, scale);
    context.fillStyle = '#000'; context.fillText(text, origin, baseline);
    if (stroke) { context.lineWidth = stroke; context.strokeStyle = '#000'; context.strokeText(text, origin, baseline); }
    const { data } = context.getImageData(0, 0, w, h);
    const result = seams.map(seam => {
      const a = Math.floor((origin + seam - fringe) * scale);
      const b = Math.ceil((origin + seam + fringe) * scale);
      if (a < 0 || b >= w) return false;
      for (let y = 0; y < h; y++) {
        for (let x = a; x <= b; x++) if (data[(y * w + x) * 4 + 3]) return false;
      }
      return true;
    });
    return remember(result);
  };
}
