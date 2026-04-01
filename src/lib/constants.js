export const PROPERTIES = [
  'Downtown Dubai - Burj Khalifa District',
  'Palm Jumeirah - Signature Villa',
  'Dubai Marina - Marina Gate',
  'Business Bay - Executive Tower',
  'Jumeirah Beach Residence - Rimal',
]

export const CATEGORIES = [
  'Plumbing',
  'Electrical',
  'AC/HVAC',
  'Furniture',
  'Cleaning',
  'Other',
]

export const URGENCY_LEVELS = ['Low', 'Medium', 'High']

export const URGENCY_STYLES = {
  Low:    { badge: 'bg-green-100 text-green-700 border-green-200',   dot: 'bg-green-500'  },
  Medium: { badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  High:   { badge: 'bg-red-100 text-red-700 border-red-200',         dot: 'bg-red-500'    },
}

export const STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved']

export const STATUS_STYLES = {
  'Open':        'bg-blue-50 text-blue-700',
  'In Progress': 'bg-orange-50 text-orange-700',
  'Resolved':    'bg-green-50 text-green-700',
}

export const ACCESS_TIME_OPTIONS = [
  'Anytime',
  'Morning (8am - 12pm)',
  'Afternoon (12pm - 5pm)',
  'Evening (5pm - 8pm)',
]
