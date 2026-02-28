const decodeBase64Url = (input) => {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  while (i < padded.length) {
    const e1 = chars.indexOf(padded[i++]);
    const e2 = chars.indexOf(padded[i++]);
    const e3 = chars.indexOf(padded[i++]);
    const e4 = chars.indexOf(padded[i++]);
    const c1 = (e1 << 2) | (e2 >> 4);
    const c2 = ((e2 & 15) << 4) | (e3 >> 2);
    const c3 = ((e3 & 3) << 6) | e4;
    output += String.fromCharCode(c1);
    if (e3 !== 64) output += String.fromCharCode(c2);
    if (e4 !== 64) output += String.fromCharCode(c3);
  }
  return output;
};

const payload = { sub: "user123", role: "USER", nickname: "테스트" };
const base64url = Buffer.from(JSON.stringify(payload)).toString('base64url');
console.log("Base64Url:", base64url);
const decoded = decodeBase64Url(base64url);
console.log("Decoded:", decoded);
try {
  console.log("Parsed:", JSON.parse(decoded));
} catch (e) {
  console.log("Parse Error:", e.message);
}
