// Privacy guard for the admin panel. The panel is built to show account metadata and aggregates only:
// never a person's name, contact details, transactions, balances, merchants or any other financial content.
// The server must not send those fields either; this is a second line of defence on the client.

export const MIN_GROUP_SIZE = 5

// Keys that must never reach a screen, matched case-insensitively on the exact key name.
const FORBIDDEN_KEYS = new Set([
  'email', 'newemail', 'oldemail', 'phone', 'phonenumber', 'mobile',
  'firstname', 'lastname', 'fullname', 'displayname', 'username', 'name',
  'address', 'dateofbirth', 'dob', 'nationalid', 'iban', 'accountnumber', 'cardnumber', 'pan',
  'amount', 'balance', 'income', 'salary', 'expense', 'expenses',
  'merchant', 'merchantname', 'description', 'note', 'notes', 'memo',
  'transactions', 'transaction', 'password', 'token', 'accesstoken', 'refreshtoken', 'otp',
])

let onViolation = (keys) => {
  if (typeof console !== 'undefined') console.warn('[privacy] dropped forbidden fields from API response:', keys)
}
export const setViolationHandler = (fn) => {
  onViolation = fn
}

/** Recursively removes forbidden keys from an API payload. Returns a new value; the input is untouched. */
export function sanitize(value) {
  const dropped = new Set()
  const walk = (v) => {
    if (Array.isArray(v)) return v.map(walk)
    if (v && typeof v === 'object') {
      const out = {}
      for (const [k, val] of Object.entries(v)) {
        if (FORBIDDEN_KEYS.has(k.toLowerCase())) dropped.add(k)
        else out[k] = walk(val)
      }
      return out
    }
    return v
  }
  const result = walk(value)
  if (dropped.size) onViolation([...dropped])
  return result
}

/** j***@g***.com — enough to tell two accounts apart in a support ticket, not enough to contact the person. */
export function maskEmail(email) {
  if (typeof email !== 'string' || !email.includes('@')) return '—'
  const [local, domain] = email.split('@')
  const dot = domain.lastIndexOf('.')
  const host = dot > 0 ? domain.slice(0, dot) : domain
  const tld = dot > 0 ? domain.slice(dot) : ''
  return `${local[0] ?? ''}***@${host[0] ?? ''}***${tld}`
}

/** Pseudonymous reference shown instead of a name: the first 8 characters of the user id. */
export function shortId(id) {
  return typeof id === 'string' && id ? id.slice(0, 8) : '—'
}

/** Small groups can identify individuals, so counts below the threshold are shown as "<5". */
export function suppressSmall(count, min = MIN_GROUP_SIZE) {
  if (typeof count !== 'number') return '—'
  return count > 0 && count < min ? `<${min}` : String(count)
}
