export const DEFAULT_CHECKLIST = [
  { label: 'Offer Submitted',          sort_order: 1, is_system: true },
  { label: 'Counter-Offer (if any)',   sort_order: 2, is_system: true },
  { label: 'Offer Accepted',           sort_order: 3, is_system: true },
  { label: 'Proof of Funds Submitted', sort_order: 4, is_system: true },
  { label: 'SPA Signed (OFW Buyers)',  sort_order: 5, is_system: true },
  { label: 'Reservation Fee Paid',     sort_order: 6, is_system: true },
  { label: 'Contract to Sell Signed',  sort_order: 7, is_system: true },
  { label: 'Deal Closed',              sort_order: 8, is_system: true },
] as const
