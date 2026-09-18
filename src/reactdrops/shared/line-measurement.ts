// Find the first fitting quarter-pixel width with logarithmic
// layout probes. The last candidate preserves a fractional maximum exactly.
export function findLineMeasurementSlack(maxSlack: number, fits: (slack: number) => boolean) {
  const steps = Math.ceil(maxSlack / .25);
  const slackAt = (step: number) => Math.min(step * .25, maxSlack);
  let low = 0;
  let high = 1;
  while (!fits(slackAt(high))) {
    if (high === steps) return maxSlack;
    low = high;
    high = Math.min(high * 2, steps);
  }
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (fits(slackAt(middle))) high = middle;
    else low = middle;
  }
  return slackAt(high);
}
