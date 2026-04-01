import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { PROPERTIES, URGENCY_LEVELS, URGENCY_STYLES, STATUS_OPTIONS, STATUS_STYLES } from '../lib/constants'
import { exportToCsv } from '../lib/exportCsv'
import {
  RefreshCw, Loader2, Filter,
  Download, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  ImageIcon, Check, X, ZoomIn,
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────
function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-AE', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Photo Lightbox Modal ─────────────────────────────────────
function PhotoLightbox({ photos, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex)

  const prev = useCallback(() => setIdx((i) => (i - 1 + photos.length) % photos.length), [photos.length])
  const next = useCallback(() => setIdx((i) => (i + 1) % photos.length), [photos.length])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape')      onClose()
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, prev, next])

  const photo = photos[idx]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
      >
        <X size={20} />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
        {idx + 1} / {photos.length}
      </div>

      {/* Prev */}
      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); prev() }}
          className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Image */}
      <div
        className="max-w-4xl max-h-[85vh] mx-16 flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photo.url}
          alt={photo.name}
          className="max-w-full max-h-[75vh] rounded-xl object-contain shadow-2xl"
        />
        <p className="text-white/70 text-sm">{photo.name}</p>
      </div>

      {/* Next */}
      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); next() }}
          className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Dot indicators */}
      {photos.length > 1 && (
        <div className="absolute bottom-5 flex gap-2">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIdx(i) }}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === idx ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────
function StatCard({ label, value, color, dark }) {
  return (
    <div className={`rounded-xl border shadow-sm px-5 py-4 ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    </div>
  )
}

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <ChevronUp size={12} className="text-gray-600 opacity-40" />
  return sortDir === 'asc'
    ? <ChevronUp   size={12} className="text-blue-300" />
    : <ChevronDown size={12} className="text-blue-300" />
}

// Inline notes editor — auto-save on blur
function NotesCell({ row, dark, onSave }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue]     = useState(row.notes ?? '')
  const [saving, setSaving]   = useState(false)
  const ref = useRef(null)

  async function handleSave() {
    if (value === (row.notes ?? '')) { setEditing(false); return }
    setSaving(true)
    await onSave(row.id, value)
    setSaving(false)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1 min-w-[160px]">
        <textarea
          ref={ref}
          autoFocus
          rows={3}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`text-xs rounded-lg border px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 w-full ${
            dark ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-800'
          }`}
          placeholder="Add internal note…"
        />
        <div className="flex gap-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
            Save
          </button>
          <button
            onClick={() => { setValue(row.notes ?? ''); setEditing(false) }}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <X size={10} /> Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={() => setEditing(true)}
      title="Click to edit note"
      className={`text-xs cursor-pointer rounded-lg px-2 py-1.5 min-w-[120px] min-h-[32px] transition-colors ${
        dark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-50'
      } ${value ? '' : 'italic opacity-50'}`}
    >
      {value || 'Add note…'}
    </div>
  )
}

// Photo thumbnails — all clickable, opens lightbox
function PhotosCell({ photos, onOpen }) {
  if (!Array.isArray(photos) || photos.length === 0) {
    return <span className="text-gray-400 text-xs">None</span>
  }
  return (
    <div className="flex items-center gap-1.5">
      {photos.map((p, i) => (
        <button
          key={i}
          onClick={() => onOpen(i)}
          title={p.name}
          className="relative shrink-0 group"
        >
          <img
            src={p.url}
            alt={p.name}
            className="w-8 h-8 rounded-md object-cover border border-gray-200 group-hover:opacity-75 transition-opacity"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn size={12} className="text-white drop-shadow" />
          </div>
        </button>
      ))}
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────
export default function Dashboard({ dark }) {
  const [issues, setIssues]               = useState([])
  const [loading, setLoading]             = useState(true)
  const [lightbox, setLightbox]           = useState(null) // {photos, index}
  const [error, setError]                 = useState('')
  const [filterProperty, setFilterProperty] = useState('')
  const [filterUrgency, setFilterUrgency]   = useState('')
  const [search, setSearch]               = useState('')
  const [sortCol, setSortCol]             = useState('submitted_at')
  const [sortDir, setSortDir]             = useState('desc')
  const [updatingId, setUpdatingId]       = useState(null)

  async function fetchIssues() {
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('maintenance_issues')
      .select('*')
      .order('submitted_at', { ascending: false })
    if (error) setError('Failed to load issues.')
    else setIssues(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchIssues() }, [])

  async function handleStatusChange(id, newStatus) {
    setUpdatingId(id)
    const { error } = await supabase
      .from('maintenance_issues')
      .update({ status: newStatus })
      .eq('id', id)
    if (!error) {
      setIssues((prev) => prev.map((i) => i.id === id ? { ...i, status: newStatus } : i))
    }
    setUpdatingId(null)
  }

  async function handleSaveNote(id, notes) {
    const { error } = await supabase
      .from('maintenance_issues')
      .update({ notes })
      .eq('id', id)
    if (!error) {
      setIssues((prev) => prev.map((i) => i.id === id ? { ...i, notes } : i))
    }
  }

  function toggleSort(col) {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(col); setSortDir('asc') }
  }

  // Filter
  const filtered = issues.filter((i) => {
    if (filterProperty && i.property_name !== filterProperty) return false
    if (filterUrgency  && i.urgency !== filterUrgency)        return false
    if (search) {
      const q = search.toLowerCase()
      return (
        i.ticket_number?.toLowerCase().includes(q)   ||
        i.property_name?.toLowerCase().includes(q)   ||
        i.issue_category?.toLowerCase().includes(q)  ||
        i.description?.toLowerCase().includes(q)     ||
        i.reporter_name?.toLowerCase().includes(q)   ||
        i.unit_number?.toLowerCase().includes(q)
      )
    }
    return true
  })

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    const va = a[sortCol] ?? ''
    const vb = b[sortCol] ?? ''
    const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true })
    return sortDir === 'asc' ? cmp : -cmp
  })

  // Stats
  const stats = {
    total:      issues.length,
    open:       issues.filter((i) => i.status === 'Open').length,
    inProgress: issues.filter((i) => i.status === 'In Progress').length,
    resolved:   issues.filter((i) => i.status === 'Resolved').length,
    high:       issues.filter((i) => i.urgency === 'High').length,
  }

  const text     = dark ? 'text-gray-100' : 'text-gray-900'
  const subtext  = dark ? 'text-gray-400' : 'text-gray-500'
  const cardBg   = dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
  const rowHover = dark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
  const divider  = dark ? 'divide-gray-800' : 'divide-gray-100'

  // Sortable columns definition
  const columns = [
    { key: 'ticket_number',  label: 'Ticket #',         sortable: true  },
    { key: 'property_name',  label: 'Property / Unit',  sortable: true  },
    { key: 'issue_category', label: 'Category',         sortable: true  },
    { key: 'urgency',        label: 'Urgency',          sortable: true  },
    { key: 'description',    label: 'Description',      sortable: false },
    { key: 'reporter_name',  label: 'Reporter',         sortable: true  },
    { key: 'access_time',    label: 'Access Time',      sortable: false },
    { key: 'photos',         label: 'Photos',           sortable: false },
    { key: 'submitted_at',   label: 'Date Submitted',   sortable: true  },
    { key: 'notes',          label: 'Internal Notes',   sortable: false },
    { key: 'status',         label: 'Status',           sortable: true  },
  ]

  return (
    <main className="flex-1 px-4 py-10">
      {/* Photo lightbox */}
      {lightbox && (
        <PhotoLightbox
          photos={lightbox.photos}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
      <div className="max-w-full mx-auto px-2">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className={`text-2xl font-bold ${dark ? 'text-gray-100' : 'text-[#2d3666]'}`}>Issue Dashboard</h1>
            <p className={`text-sm mt-1 ${subtext}`}>
              {sorted.length} issue{sorted.length !== 1 ? 's' : ''} shown
              {(filterProperty || filterUrgency || search) && ' (filtered)'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportToCsv(sorted)}
              disabled={sorted.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#4ab9e6] hover:opacity-90 shadow-lg shadow-[#4ab9e6]/30 hover:shadow-[#4ab9e6]/50 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all duration-200"
              title="Export visible issues to CSV"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={fetchIssues}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-colors ${
                dark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          <StatCard dark={dark} label="Total"        value={stats.total}      color="#2d3666" />
          <StatCard dark={dark} label="Open"         value={stats.open}       color="#4ab9e6" />
          <StatCard dark={dark} label="In Progress"  value={stats.inProgress} color="#f59e0b" />
          <StatCard dark={dark} label="Resolved"     value={stats.resolved}   color="#16a34a" />
          <StatCard dark={dark} label="High Urgency" value={stats.high}       color="#dc2626" />
        </div>

        {/* Filters + Search */}
        <div className={`rounded-2xl border shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center ${cardBg}`}>
          <div className={`flex items-center gap-2 text-sm shrink-0 ${subtext}`}>
            <Filter size={14} />
            <span className="font-medium">Filter:</span>
          </div>
          <select
            value={filterProperty}
            onChange={(e) => setFilterProperty(e.target.value)}
            className="field-input sm:max-w-xs"
          >
            <option value="">All Properties</option>
            {PROPERTIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="field-input sm:max-w-40"
          >
            <option value="">All Urgencies</option>
            {URGENCY_LEVELS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>

          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            <input
              type="text"
              placeholder="Search ticket, property, reporter…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field-input pl-9"
            />
          </div>

          {(filterProperty || filterUrgency || search) && (
            <button
              onClick={() => { setFilterProperty(''); setFilterUrgency(''); setSearch('') }}
              className="text-sm text-red-500 hover:underline shrink-0"
            >
              Clear all
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-6">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-gray-400" size={32} />
          </div>
        ) : sorted.length === 0 ? (
          <div className={`text-center py-24 ${subtext}`}>
            <p className="text-lg font-medium">No issues found</p>
            <p className="text-sm mt-1">
              {issues.length === 0 ? 'Submit an issue to get started' : 'Try adjusting your filters or search'}
            </p>
          </div>
        ) : (
          <div className={`rounded-2xl shadow-sm border overflow-hidden ${cardBg}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#2d3666]">
                    {columns.map(({ key, label, sortable }) => (
                      <th
                        key={key}
                        className={`px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wide whitespace-nowrap ${
                          sortable ? 'cursor-pointer select-none hover:text-gray-200 transition-colors' : ''
                        }`}
                        onClick={sortable ? () => toggleSort(key) : undefined}
                      >
                        <span className="flex items-center gap-1">
                          {label}
                          {sortable && <SortIcon col={key} sortCol={sortCol} sortDir={sortDir} />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${divider}`}>
                  {sorted.map((row) => (
                    <tr key={row.id} className={`transition-colors ${rowHover}`}>

                      {/* Ticket # */}
                      <td className={`px-4 py-3 font-mono font-semibold whitespace-nowrap ${text}`}>
                        {row.ticket_number}
                      </td>

                      {/* Property + Unit */}
                      <td className={`px-4 py-3 max-w-[180px] ${subtext}`}>
                        <p className="truncate font-medium" title={row.property_name}>{row.property_name}</p>
                        {row.unit_number && (
                          <p className="text-xs text-gray-400">Unit {row.unit_number}</p>
                        )}
                      </td>

                      {/* Category */}
                      <td className={`px-4 py-3 whitespace-nowrap ${subtext}`}>{row.issue_category}</td>

                      {/* Urgency */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${URGENCY_STYLES[row.urgency]?.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${URGENCY_STYLES[row.urgency]?.dot}`} />
                          {row.urgency}
                        </span>
                      </td>

                      {/* Description */}
                      <td className={`px-4 py-3 max-w-[200px] ${subtext}`}>
                        <p className="truncate" title={row.description}>{row.description}</p>
                      </td>

                      {/* Reporter */}
                      <td className={`px-4 py-3 whitespace-nowrap ${subtext}`}>
                        <p className="font-medium">{row.reporter_name || '—'}</p>
                        {row.reporter_phone && (
                          <a
                            href={`tel:${row.reporter_phone}`}
                            className="text-xs text-blue-400 hover:underline"
                          >
                            {row.reporter_phone}
                          </a>
                        )}
                      </td>

                      {/* Access Time */}
                      <td className={`px-4 py-3 text-xs whitespace-nowrap ${subtext}`}>
                        {row.access_time || <span className="text-gray-400">—</span>}
                      </td>

                      {/* Photos */}
                      <td className="px-4 py-3">
                        <PhotosCell
                          photos={row.photos}
                          onOpen={(i) => setLightbox({ photos: row.photos, index: i })}
                        />
                      </td>

                      {/* Date Submitted */}
                      <td className={`px-4 py-3 whitespace-nowrap text-xs ${subtext}`}>
                        {formatDateTime(row.submitted_at)}
                      </td>

                      {/* Internal Notes */}
                      <td className="px-4 py-3">
                        <NotesCell row={row} dark={dark} onSave={handleSaveNote} />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <select
                          value={row.status}
                          disabled={updatingId === row.id}
                          onChange={(e) => handleStatusChange(row.id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1.5 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors ${STATUS_STYLES[row.status]}`}
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
