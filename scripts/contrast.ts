// Prints WCAG contrast ratios for the DESIGN.md colour pairs.
const lum = (hex: string): number => {
  const c = [1, 3, 5].map((i) => {
    const v = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (c[0] ?? 0) + 0.7152 * (c[1] ?? 0) + 0.0722 * (c[2] ?? 0);
};
export const ratio = (a: string, b: string): number => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
};
const PAIRS: [string, string, string][] = [
  ["ink on paper", "#1B2A41", "#F6F1E4"],
  ["ink on card", "#1B2A41", "#FFFDF7"],
  ["muted on paper", "#4A5568", "#F6F1E4"],
  ["muted on card", "#4A5568", "#FFFDF7"],
  ["teal on paper", "#0F5C5C", "#F6F1E4"],
  ["teal on card", "#0F5C5C", "#FFFDF7"],
  ["brick on paper", "#9B3324", "#F6F1E4"],
  ["brick on card", "#9B3324", "#FFFDF7"],
  ["paper on teal", "#F6F1E4", "#0F5C5C"],
  ["paper on ink", "#F6F1E4", "#1B2A41"],
  ["ink on sand", "#1B2A41", "#E9E0C8"],
  ["teal on sand", "#0F5C5C", "#E9E0C8"],
  ["brick on sand", "#9B3324", "#E9E0C8"],
  ["muted on sand", "#4A5568", "#E9E0C8"],
  ["rule vs paper (non-text)", "#8A7F62", "#F6F1E4"],
];
if (import.meta.main) {
  for (const [name, fg, bg] of PAIRS)
    console.log(`${name}\t${fg} on ${bg}\t${ratio(fg, bg).toFixed(2)}`);
}
