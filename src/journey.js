// One shared timeline drives the DOM, camera, plan and building.
export const clamp = value => Math.min(1, Math.max(0, value))
export function ease(start, end, value) {
  const t = clamp((value - start) / (end - start))
  return t * t * (3 - 2 * t)
}
export const stops = [0, .38, .64, .97]
export const chapters = ['El trazo', 'El plano', 'La forma', 'El espacio']
