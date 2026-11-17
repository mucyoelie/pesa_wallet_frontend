/** Join conditional class names. Falsy values are dropped. */
export function cx(...values) {
  return values.flat().filter(Boolean).join(' ');
}
