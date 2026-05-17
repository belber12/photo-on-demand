// Client-side validator for lead object returned by backend
export function isValidLead(lead) {
  if (!lead || typeof lead !== 'object') return false
  if (typeof lead.name !== 'string' || lead.name.trim().length < 2) return false
  if (typeof lead.phone !== 'string' || !lead.phone.startsWith('+7')) return false
  return true
}
