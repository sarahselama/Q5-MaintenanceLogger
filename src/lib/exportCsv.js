/**
 * Converts an array of issue objects into a properly quoted CSV and triggers a download.
 * Filename format: MaintenanceReport_DDMMYYYY.csv
 */
export function exportToCsv(issues) {
  if (!issues.length) return

  // Wrap any value in quotes and escape internal quotes
  const q = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`

  const headers = [
    'Ticket #',
    'Property',
    'Unit #',
    'Category',
    'Urgency',
    'Description',
    'Reporter Name',
    'Reporter Phone',
    'Access Time',
    'Photo Count',
    'Photos',
    'Internal Notes',
    'Status',
    'Date Submitted',
  ]

  const rows = issues.map((i) => {
    const photoCount  = Array.isArray(i.photos) ? i.photos.length : 0
    const photoLabels = Array.isArray(i.photos)
      ? i.photos.map((p, idx) => `Image ${idx + 1}:\n${p.url}`).join('\n\n')
      : ''

    return [
      q(i.ticket_number),
      q(i.property_name),
      q(i.unit_number   ?? ''),
      q(i.issue_category),
      q(i.urgency),
      q(i.description),
      q(i.reporter_name  ?? ''),
      q(i.reporter_phone ?? ''),
      q(i.access_time    ?? ''),
      photoCount,
      q(photoLabels),
      q(i.notes          ?? ''),
      q(i.status),
      q(new Date(i.submitted_at).toLocaleString('en-AE')),
    ].join(',')
  })

  const csv = [headers.map((h) => `"${h}"`).join(','), ...rows].join('\r\n')

  // Filename: MaintenanceReport_DDMMYYYY.csv
  const now  = new Date()
  const dd   = String(now.getDate()).padStart(2, '0')
  const mm   = String(now.getMonth() + 1).padStart(2, '0')
  const yyyy = now.getFullYear()

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href  = url
  link.setAttribute('download', `MaintenanceReport_${dd}${mm}${yyyy}.csv`)
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Give Chrome time to read the filename before revoking the URL
  setTimeout(() => window.URL.revokeObjectURL(url), 200)
}
