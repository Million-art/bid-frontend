/** ASCII digits only  matches client-backend phoneutil.Digits behavior. */
export function digitsOnly(s: string): string {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 48 && c <= 57) out += s[i];
  }
  return out;
}
