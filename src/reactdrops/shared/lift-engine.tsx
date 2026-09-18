"use client";

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { createElement, forwardRef, useImperativeHandle, useRef, type CSSProperties, type ReactNode } from 'react';
import { createFontInkMeasurer } from './font-ink';
import { findLineMeasurementSlack } from './line-measurement';
import { stabilizeCharacterAdvances } from './character-measurement';
import './lift-engine.css';

gsap.registerPlugin(useGSAP, SplitText);

export type LiftTextHandle = { finish: () => void; play: () => void; reset: () => void };
export type LiftTextProps = {
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'div' | 'span' | 'b' | 'dt' | 'dd' | 'code';
  children: ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
  delay?: number;
  duration?: number;
  ease?: string;
  offsetPercent?: number;
  stagger?: number;
  /** Total stagger window; 'auto' uses Lama Lama's line-count formula. */
  staggerAmount?: number | 'auto';
  staggerFrom?: 'start' | 'end' | 'center' | 'edges' | 'random';
  startOpacity?: number;
  /** Initial uniform line scale from the center; 1 disables scaling. */
  startScale?: number;
  /** Center scaling on the full line box or on its text, independent of alignment. */
  scaleOrigin?: 'line' | 'text';
  /** Animate a clip on each moving line instead of a stationary line mask. */
  clipReveal?: boolean;
  /** Original percentage insets or font/manual fitted margins for animated clips. */
  clipBounds?: 'fitted' | 'reference';
  mask?: boolean;
  /** Manual clipping margin in em; ignored while autoMask is enabled. */
  maskPadding?: number;
  /** Fit the mask to measured glyph overhang instead of manual padding. */
  autoMask?: boolean;
  trigger?: 'manual' | 'scroll' | 'auto';
  /** Viewport height percentage at which the top of the text enters. */
  viewportStart?: number;
  once?: boolean;
};

type Action = 'play' | 'finish' | 'reset';

/** Internal rendering engine. Public components constrain their supported modes. */
export const LiftEngine = forwardRef<LiftTextHandle, LiftTextProps & { mode: 'lines' | 'chars' | 'words' }>(
  function LiftEngine({
    as = 'h1', children, className = '', id, style, delay = 0, duration = 1,
    ease = 'power4.out', offsetPercent = 120, stagger = 0.08, staggerAmount,
    staggerFrom = 'start', startOpacity = 1, startScale = 1, scaleOrigin = 'line', clipReveal = false, clipBounds = 'fitted', mask = true, maskPadding = 0.22, autoMask = true,
    mode, trigger = 'manual', viewportStart = 95, once = true,
  }, forwardedRef) {
    const elementRef = useRef<HTMLElement>(null);
    const actionRef = useRef<(action: Action) => void>(() => {});

    useImperativeHandle(forwardedRef, () => ({
      play: () => actionRef.current('play'),
      reset: () => actionRef.current('reset'),
      finish: () => actionRef.current('finish'),
    }), []);

    useGSAP(() => {
      const element = elementRef.current;
      if (!element) return;
      let disposed = false;
      let ready = false;
      let pending: Action | null = null;
      let state: 'idle' | 'playing' | 'finished' = 'idle';
      let splitInstance: ReturnType<typeof SplitText.create> | null = null;
      let tween: gsap.core.Tween | null = null;
      let resizeFrame = 0;
      let resizeObserver: ResizeObserver | undefined;
      let scrollObserver: IntersectionObserver | undefined;
      const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
      const originalWidth = element.style.width;
      const originalMinHeight = element.style.minHeight;
      const originalVisibility = element.style.visibility;
      const originalOpacity = element.style.opacity;
      // Keep interactive descendants usable. Splitting them would clone their DOM.
      const hasInteractiveContent = !!element.querySelector('a,button,input,select,textarea,[tabindex]');
      const restoreLayout = () => {
        element.style.width = originalWidth;
        element.style.minHeight = originalMinHeight;
      };
      const clearSplit = () => {
        tween?.kill();
        tween = null;
        splitInstance?.revert();
        splitInstance = null;
        restoreLayout();
      };
      const finish = () => {
        clearSplit();
        state = 'finished';
        gsap.set(element, { autoAlpha: 1 });
      };
      const prepare = () => {
        clearSplit();
        if (motion.matches || hasInteractiveContent) { finish(); return null; }
        const hasInlineElements = element.childElementCount > 0;
        const animatedClip = mode === 'lines' && mask && clipReveal;
        const referenceClip = animatedClip && clipBounds === 'reference';
        const computedStyle = getComputedStyle(element);
        const nativeRange = document.createRange();
        nativeRange.selectNodeContents(element);
        const nativeLineTops: number[] = [];
        const lineTopTolerance = Math.max(0.5, parseFloat(computedStyle.fontSize) * 0.02);
        for (const rect of nativeRange.getClientRects()) {
          if ((rect.width || rect.height)
            && !nativeLineTops.some(top => Math.abs(top - rect.top) <= lineTopTolerance)) {
            nativeLineTops.push(rect.top);
          }
        }
        nativeRange.detach();
        const nativeLineCount = nativeLineTops.length;
        const stableBounds = {
          // Keep the browser's fractional used width. offsetWidth rounds to an
          // integer and can make a line that only just fits wrap differently.
          width: computedStyle.width === 'auto'
            ? `${String(element.offsetWidth)}px`
            : computedStyle.width,
          height: computedStyle.height === 'auto' ? `${element.offsetHeight}px` : computedStyle.height,
        };

        // This must happen before SplitText mutates the contents. In flex/grid
        // layouts the generated line wrappers have different intrinsic sizing
        // from the original text; allowing that sizing to participate even once
        // makes SplitText measure a layout that it created itself. The outer
        // text box is therefore frozen at the browser's final, font-ready size
        // while SplitText discovers and animates the lines inside it.
        // Geometry is written through the CSSStyleDeclaration instead of GSAP:
        // CSSPlugin normalizes this one-time value and may round away a
        // subpixel. A fraction of a pixel is enough to change wrapping when a
        // line sits exactly on its available-width boundary.
        const stableWidth = parseFloat(stableBounds.width);
        element.style.width = stableBounds.width;
        element.style.minHeight = stableBounds.height;
        gsap.set(element, { autoAlpha: 0 });
        const splitConfig = {
          type: mode === 'chars' ? 'lines,words,chars' : mode === 'words' ? 'lines,words' : 'lines',
          ...(mask && !animatedClip ? { mask: 'lines' as const } : {}),
          // SplitText discovers lines by wrapping every word first. Its default
          // wrapper is an inline-block div, which changes kerning and negative
          // letter-spacing at word boundaries. Inline spans minimize that
          // difference before the native-line verification below.
          tag: 'span',
          reduceWhiteSpace: !/^(pre|break-spaces)/.test(computedStyle.whiteSpace),
          linesClass: 'masked-lift-line',
          wordsClass: 'masked-lift-word',
          charsClass: 'masked-lift-char',
        };
        let split = SplitText.create(element, splitConfig);

        // SplitText's temporary word wrappers can still differ fractionally
        // from continuous browser text. Preserve the browser's original line
        // count instead of accepting a line manufactured by measurement DOM.
        // The extra width exists only while discovering boundaries; once words
        // are unwrapped into line elements, restore the exact original box.
        if (nativeLineCount && Number.isFinite(stableWidth)) {
          const maxMeasurementSlack = Math.max(4, parseFloat(computedStyle.fontSize) * 0.25);
          let measurementSlack = 0;
          const measureAt = (slack: number) => {
            if (measurementSlack === slack) return split.lines.length <= nativeLineCount;
            split.revert();
            measurementSlack = slack;
            element.style.width = `${String(stableWidth + measurementSlack)}px`;
            split = SplitText.create(element, splitConfig);
            return split.lines.length <= nativeLineCount;
          };
          if (split.lines.length > nativeLineCount) {
            const slack = findLineMeasurementSlack(maxMeasurementSlack, measureAt);
            // Binary search may finish on a failing lower bound. Leave the
            // DOM split at the exact same first fitting width as before.
            measureAt(slack);
          }
          element.style.width = stableBounds.width;
        }
        if (mode === 'chars') stabilizeCharacterAdvances(split.words);
        // Keep the browser's whitespace rules, including hanging spaces in
        // pre-wrap text. Changing them to `pre` shifts centered/right-aligned lines.
        split.lines.forEach(line => { (line as HTMLElement).style.whiteSpace = computedStyle.whiteSpace; });
        // A soft-wrapped pre-wrap line hangs its trailing spaces outside the
        // alignment box. Once made into a block, those spaces become its final
        // line and participate in centering. Remove only these invisible tails;
        // revert() still restores the exact original whitespace.
        if (computedStyle.whiteSpace === 'pre-wrap') {
          split.lines.slice(0, -1).forEach(line => {
            const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
            const nodes: Text[] = [];
            while (walker.nextNode()) nodes.push(walker.currentNode as Text);
            for (const node of nodes.reverse()) {
              node.data = node.data.replace(/[ \t]+$/, '');
              if (node.data.length) break;
            }
          });
        }
        let extraTravel = 0;
        let lineInk: ReturnType<ReturnType<typeof createFontInkMeasurer>>[] = [];
        if (mask && autoMask && !referenceClip) {
          const ink = createFontInkMeasurer();
          const measurements = split.lines.map(line => {
            const lineStyle = getComputedStyle(line);
            const padding = ink(line as HTMLElement, line.textContent ?? '', lineStyle);
            const lineFont = lineStyle.font;
            // Account for inline descendants with their own fonts and sizes.
            // Generated character/word wrappers inherit the line font. Only
            // original inline markup can introduce a different typography run.
            const descendants = hasInlineElements ? line.querySelectorAll<HTMLElement>(':not(.masked-lift-char):not(.masked-lift-word)') : [];
            for (const child of descendants) {
              if (!child.textContent?.trim()) continue;
              const childStyle = getComputedStyle(child);
              if (childStyle.font === lineFont) continue;
              const extra = ink(child, child.textContent, childStyle);
              padding.top = Math.max(padding.top, extra.top);
              padding.bottom = Math.max(padding.bottom, extra.bottom);
            }
            return padding;
          });
          lineInk = measurements;
          if (!animatedClip) split.lines.forEach((line, index) => {
            const padding = measurements[index];
            const wrapper = line.parentElement;
            wrapper?.style.setProperty('--masked-lift-ink-top', `${padding.top}px`);
            wrapper?.style.setProperty('--masked-lift-ink-bottom', `${padding.bottom}px`);
            extraTravel = Math.max(extraTravel, padding.top + padding.bottom);
          });
        }
        // Exact Lama Lama percentages need no glyph or clip-bound measurements.
        // Fitted mode remains available for fonts requiring wider margins.
        const clips = referenceClip ? split.lines.map(() => ({
          from: 'inset(-10% -10% 110% -10%)',
          to: 'inset(-10% -10% -10% -10%)',
        })) : animatedClip ? split.lines.map((line, index) => {
          const css = getComputedStyle(line);
          const height = parseFloat(css.height), width = parseFloat(css.width);
          const manual = Math.max(0, maskPadding) * (parseFloat(css.fontSize) || 16);
          const ink = lineInk[index];
          const top = autoMask ? Math.max(height * .1, ink?.top ?? 0) : manual;
          const bottom = autoMask ? Math.max(height * .1, ink?.bottom ?? 0) : manual;
          const left = autoMask ? Math.max(width * .1, ink?.left ?? 0) : manual;
          const right = autoMask ? Math.max(width * .1, ink?.right ?? 0) : manual;
          return {
            from: `inset(${-top}px ${-right}px ${height * 1.1}px ${-left}px)`,
            to: `inset(${-top}px ${-right}px ${-bottom}px ${-left}px)`,
          };
        }) : null;
        splitInstance = split;
        const targets = split[mode];
        const scale = Number.isFinite(startScale) ? Math.max(0, startScale) : 1;
        // Read once before motion. Percentages also account for scaled preview
        // ancestors without forcing text alignment or adding wrapper elements.
        let textOrigins: string[] | undefined;
        if (scale !== 1 && mode === 'lines' && scaleOrigin === 'text') {
          const range = document.createRange();
          textOrigins = split.lines.map(line => {
            const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
            let first: Text | undefined, last: Text | undefined;
            while (walker.nextNode()) {
              const node = walker.currentNode as Text;
              if (!node.data.trim()) continue;
              first ??= node;
              last = node;
            }
            if (!first || !last) return '50% 50%';
            range.setStart(first, first.data.search(/\S/));
            range.setEnd(last, last.data.trimEnd().length);
            const text = range.getBoundingClientRect();
            const box = line.getBoundingClientRect();
            return `${box.width ? (text.left + text.width / 2 - box.left) / box.width * 100 : 50}% 50%`;
          });
          range.detach();
        }
        const from = {
          yPercent: offsetPercent, y: extraTravel * offsetPercent / 100, opacity: Math.max(0, Math.min(1, startOpacity)),
          ...(scale !== 1 ? { scale, transformOrigin: textOrigins ? (index: number) => textOrigins[index] : '50% 50%' } : {}),
          ...(clips ? { clipPath: (index: number) => clips[index].from } : {}),
          willChange: 'transform,opacity',
        };
        const to = {
          paused: true, yPercent: 0, y: 0, opacity: 1,
          ...(scale !== 1 ? { scale: 1 } : {}),
          ...(clips ? { clipPath: (index: number) => clips[index].to } : {}),
          delay: Math.max(0, delay), duration: Math.max(0, duration), ease,
          stagger: staggerAmount === undefined
            ? { each: Math.max(0, stagger), from: staggerFrom }
            : { amount: staggerAmount === 'auto' ? .135 + .03 * split.lines.length : Math.max(0, staggerAmount), from: staggerFrom },
          onComplete: finish,
        };
        // Explicit fromTo retains all four inset values. Reading a CSS-normalized
        // three-value inset after set() would animate the missing left edge from 0.
        if (clips) tween = gsap.fromTo(targets, from, to);
        else { gsap.set(targets, from); tween = gsap.to(targets, to); }
        return tween;
      };
      const act = (action: Action) => {
        if (disposed) return;
        if (!ready) { pending = action; return; }
        if (action === 'finish' || motion.matches || hasInteractiveContent) { finish(); return; }
        if (action === 'reset') {
          clearSplit();
          state = 'idle';
          gsap.set(element, { autoAlpha: 0 });
          return;
        }
        const animation = prepare();
        if (animation) {
          state = 'playing';
          gsap.set(element, { autoAlpha: 1 });
          animation.play(0);
        }
      };
      actionRef.current = act;

      // Re-measure only while split. Finished text uses the browser's native layout.
      const rebuild = () => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => {
          if (disposed || !ready || !splitInstance || !tween) return;
          const elapsed = tween.totalTime();
          const animation = prepare();
          if (animation) {
            gsap.set(element, { autoAlpha: 1 });
            animation.totalTime(Math.min(elapsed, animation.totalDuration()), false).play();
          }
        });
      };
      const onMotionChange = () => { if (motion.matches) act('finish'); };
      motion.addEventListener('change', onMotionChange);
      const fontSet = document.fonts;
      fontSet?.addEventListener('loadingdone', rebuild);
      gsap.set(element, { autoAlpha: motion.matches ? 1 : 0 });

      const activate = () => {
        if (disposed) return;
        ready = true;
        if (motion.matches || hasInteractiveContent) { finish(); return; }
        if (typeof ResizeObserver !== 'undefined') {
          // Observe the parent too: the text width is locked during a split.
          const widths = new WeakMap<Element, number>();
          resizeObserver = new ResizeObserver(entries => {
            let changed = false;
            for (const entry of entries) {
              const width = entry.contentRect.width;
              const previous = widths.get(entry.target);
              widths.set(entry.target, width);
              if (previous !== undefined && Math.abs(width - previous) > 0.5) changed = true;
            }
            if (changed) rebuild();
          });
          resizeObserver.observe(element);
          if (element.parentElement) resizeObserver.observe(element.parentElement);
        }
        window.addEventListener('resize', rebuild);
        if (trigger === 'scroll' && typeof IntersectionObserver !== 'undefined') {
          // rootMargin percentages are relative to WIDTH; use vh for the requested
          // viewport-height trigger by calculating the pixel inset explicitly.
          const observe = () => {
            scrollObserver?.disconnect();
            scrollObserver = new IntersectionObserver(entries => {
              for (const entry of entries) {
                if (entry.isIntersecting && state !== 'playing') {
                  act('play');
                  if (once) scrollObserver?.disconnect();
                } else if (!entry.isIntersecting && !once) act('reset');
              }
            }, { threshold: 0, rootMargin: `0px 0px -${window.innerHeight * (1 - Math.max(1, Math.min(100, viewportStart)) / 100)}px 0px` });
            scrollObserver.observe(element);
          };
          observe();
          // Keep the trigger's pixel inset correct on orientation changes.
          refreshScroll = () => { if (!once || state !== 'finished') observe(); };
          window.addEventListener('resize', refreshScroll);
        } else if (trigger !== 'manual') act('play');
        if (pending) { const action = pending; pending = null; act(action); }
      };
      let refreshScroll = () => {};
      const computed = getComputedStyle(element);
      const descriptor = `${computed.fontStyle} ${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
      // A rejected or missing font still leaves usable fallback text.
      try {
        void Promise.all([fontSet?.ready, fontSet?.load(descriptor, element.textContent || 'BESbswy')]).then(activate, activate);
      } catch { activate(); }

      return () => {
        disposed = true;
        actionRef.current = () => {};
        cancelAnimationFrame(resizeFrame);
        resizeObserver?.disconnect();
        scrollObserver?.disconnect();
        window.removeEventListener('resize', rebuild);
        window.removeEventListener('resize', refreshScroll);
        motion.removeEventListener('change', onMotionChange);
        fontSet?.removeEventListener('loadingdone', rebuild);
        clearSplit();
        element.style.visibility = originalVisibility;
        element.style.opacity = originalOpacity;
      };
    }, {
      scope: elementRef, revertOnUpdate: true,
      dependencies: [as, children, className, JSON.stringify(style), delay, duration, ease,
        offsetPercent, stagger, staggerAmount, staggerFrom, startOpacity, startScale, scaleOrigin, clipReveal, clipBounds, mask,
        maskPadding, autoMask, mode, trigger, viewportStart, once],
    });

    return createElement(as, {
      // React owns a fresh node when text changes; SplitText only ever restores
      // the old node during cleanup, never overwriting the next React text.
      key: typeof children === 'string' ? children : undefined,
      ref: elementRef, id, className: `masked-lift-text ${className}`.trim(),
      style: { '--masked-lift-padding': `${autoMask ? 0 : Math.max(0, maskPadding)}em`, ...style } as CSSProperties,
    }, children);
  },
);
