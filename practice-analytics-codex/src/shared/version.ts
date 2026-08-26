export function parseVer(v: string): number[] {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:a(\d+))?$/.exec(v);
  if (!m) return [-1, -1, -1, -1];
  const alpha = m[4] !== undefined ? Number(m[4]) : Number.MAX_SAFE_INTEGER;
  return [Number(m[1]), Number(m[2]), Number(m[3]), alpha];
}

export function semverGt(a: string, b: string): boolean {
  const pa = parseVer(a);
  const pb = parseVer(b);
  for (let i = 0; i < 4; i++) {
    if (pa[i] > pb[i]) return true;
    if (pa[i] < pb[i]) return false;
  }
  return false;
}
