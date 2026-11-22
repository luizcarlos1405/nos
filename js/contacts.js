// Contacts as people type them in a sheet's free text: Brazilian phone numbers and Instagram handles. The
// Mapa reads its "Contato" and "Instagram" columns with them (js/places.js). Nothing is invented: a
// number without its area code, or a word that can't be a handle, is not read as one, so it never
// becomes a link.

// ---------- Phones ----------

// Runs of digits with the usual separators: "(67) 9 0000-0000", "67-90000-0000", "67 900000000".
const PHONE_RUN = /\+?\(?\d[\d\s().-]{6,}\d/g;

// Brazilian numbers with their area code: 11 digits for mobiles (DDD + 9 + 8), 10 for landlines.
// A number without the area code can't be dialled from WhatsApp, so it stays as text.
function readPhone(run) {
  let digits = run.replace(/\D/g, '');
  if (digits.length >= 12 && digits.startsWith('55')) digits = digits.slice(2);
  if (digits.length >= 11 && digits.startsWith('0')) digits = digits.slice(1);
  const ddd = digits.slice(0, 2);
  if (!/^[1-9][1-9]$/.test(ddd)) return null;
  if (digits.length === 11 && digits[2] === '9') return { digits, mobile: true, label: `(${ddd}) ${digits.slice(2, 7)}-${digits.slice(7)}` };
  if (digits.length === 10 && /[2-8]/.test(digits[2])) return { digits, mobile: false, label: `(${ddd}) ${digits.slice(2, 6)}-${digits.slice(6)}` };
  return null;
}

// Every number found in the text, once each: { digits, mobile, label }.
export function phonesIn(text) {
  const phones = [];
  for (const [run] of (text || '').matchAll(PHONE_RUN)) {
    const phone = readPhone(run);
    if (phone && !phones.some((p) => p.digits === phone.digits)) phones.push(phone);
  }
  return phones;
}

// ---------- Instagram ----------

const HANDLE = /^[a-z0-9._]{1,30}$/;

// Words that answer the question instead of naming a profile ("Sim", "Instagram", "Apenas whatsapp"):
// typed bare, without an @, none of them is read as a handle.
const CHANNEL_WORDS = new Set(['sim', 'nao', 'apenas', 'somente', 'so', 'e', 'ou', 'o', 'a', 'os', 'as', 'de', 'do', 'da', 'no', 'na', 'pelo', 'pela', 'por', 'mesmo', 'mesmos', 'mesma', 'mesmas', 'tem', 'temos', 'instagram', 'insta', 'ig', 'whatsapp', 'whats', 'watts', 'wpp', 'zap', 'zapzap', 'direct', 'dm', 'tambem', 'ate', 'agora', 'enquanto', 'ainda']);

// "@grupodoexemplo", "grupodoexemplo", "https://www.instagram.com/grupodoexemplo?igsh=…": the handle,
// or null. Instagram names have no accents, so "capoeiradoexemplo_são" is read as
// capoeiradoexemplo_sao.
export function readInstagram(raw) {
  const text = (raw || '').trim();
  const url = text.match(/instagram\.com\/([^/?#\s]+)/i);
  const candidate = (url ? url[1] : text.replace(/^@/, '')).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (!url && !text.startsWith('@') && CHANNEL_WORDS.has(candidate)) return null;
  return HANDLE.test(candidate) && /[a-z]/.test(candidate) ? candidate : null;
}

export const instagramUrl = (handle) => `https://www.instagram.com/${handle}/`;
