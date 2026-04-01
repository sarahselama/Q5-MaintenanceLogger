import { useState, useRef } from 'react'
import {
  Upload, X, FileText, ChevronDown, Loader2,
  CheckCircle2, Plus, Phone, User,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PROPERTIES, CATEGORIES, URGENCY_LEVELS, ACCESS_TIME_OPTIONS } from '../lib/constants'

const INITIAL_FORM = {
  propertyName:  '',
  unitNumber:    '',
  issueCategory: '',
  urgency:       '',
  description:   '',
  reporterName:  '',
  reporterPhone: '',
  accessTime:    '',
}

export default function IssueForm({ dark = false }) {
  const [form, setForm]               = useState(INITIAL_FORM)
  const [errors, setErrors]           = useState({})
  const [photos, setPhotos]           = useState([])   // [{file, preview, name}]
  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [ticketNumber, setTicketNumber] = useState(null)
  const fileInputRef = useRef(null)

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  function handleFiles(e) {
    const files     = Array.from(e.target.files)
    const remaining = 3 - photos.length
    const toAdd     = files.slice(0, remaining)
    const newPhotos = toAdd.map((f) => ({
      file:    f,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      name:    f.name,
    }))
    setPhotos((prev) => [...prev, ...newPhotos])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removePhoto(idx) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx))
  }

  function validateField(field, value) {
    if (field === 'propertyName' && !value) return 'Please select a property.'
    if (field === 'unitNumber' && !value.trim()) return 'Please enter the unit/apartment number.'
    if (field === 'issueCategory' && !value) return 'Please select a category.'
    if (field === 'urgency' && !value) return 'Please select an urgency level.'
    if (field === 'description' && !value.trim()) return 'Please describe the issue.'
    if (field === 'reporterName' && !value.trim()) return 'Please enter your name.'
    if (field === 'reporterPhone' && value.trim()) {
      const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/
      if (!phoneRegex.test(value.trim())) return 'Please enter a valid phone format.'
    }
    return ''
  }

  function handleBlur(field) {
    const err = validateField(field, form[field])
    setErrors((prev) => ({ ...prev, [field]: err }))
  }

  function validate() {
    const e = {}
    Object.keys(INITIAL_FORM).forEach((key) => {
      const err = validateField(key, form[key])
      if (err) e[key] = err
    })
    return e
  }

  async function generateTicketNumber() {
    const { count } = await supabase
      .from('maintenance_issues')
      .select('*', { count: 'exact', head: true })
    const next = (count || 0) + 1
    return `MNT-${String(next).padStart(4, '0')}`
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setSubmitting(true)
    try {
      // Upload all photos
      const uploadedPhotos = []
      for (const p of photos) {
        const ext  = p.file.name.split('.').pop()
        const path = `maintenance/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(path, p.file)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path)
        uploadedPhotos.push({ url: urlData.publicUrl, name: p.name })
      }

      const ticket = await generateTicketNumber()

      const { error: dbError } = await supabase.from('maintenance_issues').insert({
        ticket_number:  ticket,
        property_name:  form.propertyName,
        unit_number:    form.unitNumber.trim()    || null,
        issue_category: form.issueCategory,
        urgency:        form.urgency,
        description:    form.description.trim(),
        reporter_name:  form.reporterName.trim(),
        reporter_phone: form.reporterPhone.trim() || null,
        access_time:    form.accessTime           || null,
        photos:         uploadedPhotos,
        status:         'Open',
        submitted_at:   new Date().toISOString(),
      })
      if (dbError) throw dbError

      setTicketNumber(ticket)
    } catch (err) {
      console.error('Submission error:', err)
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleReset() {
    setForm(INITIAL_FORM)
    setErrors({})
    setPhotos([])
    setTicketNumber(null)
    setSubmitError('')
  }

  // ── Success screen ────────────────────────────────────────────
  if (ticketNumber) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md text-center">
          <div className={`rounded-2xl shadow-sm border p-10 ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#e8f7fd' }}>
              <CheckCircle2 size={32} style={{ color: '#4ab9e6' }} />
            </div>
            <h2 className={`text-xl font-bold mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>Issue Reported</h2>
            <p className={`text-sm mb-6 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
              Your maintenance issue has been logged and assigned a ticket number.
            </p>
            <div className="rounded-xl px-6 py-4 mb-6" style={{ backgroundColor: '#f0faff' }}>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Ticket Number</p>
              <p className="text-3xl font-bold" style={{ color: '#2d3666' }}>{ticketNumber}</p>
            </div>
            <div className={`text-left space-y-2 text-sm mb-8`}>
              {[
                ['Property',    form.propertyName + (form.unitNumber ? ` · Unit ${form.unitNumber}` : '')],
                ['Category',    form.issueCategory],
                ['Urgency',     form.urgency],
                ['Reported by', form.reporterName],
                ...(form.accessTime ? [['Access time', form.accessTime]] : []),
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between gap-4">
                  <span className={dark ? 'text-gray-500' : 'text-gray-400'}>{label}</span>
                  <span className={`font-medium text-right ${dark ? 'text-gray-200' : 'text-gray-800'}`}>{val}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleReset}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#4ab9e6] hover:opacity-90 shadow-lg shadow-[#4ab9e6]/30 hover:shadow-[#4ab9e6]/50 hover:-translate-y-0.5 transition-all duration-200"
            >
              Report Another Issue
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ── Form ──────────────────────────────────────────────────────
  const card = dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
  const div  = dark ? 'border-gray-800' : 'border-gray-100'

  return (
    <main className="flex-1 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <h1 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-[#2d3666]'}`}>
            Report a Maintenance Issue
          </h1>
          <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
            Fill in the details below and our team will be notified immediately.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className={`rounded-2xl shadow-sm border p-6 sm:p-8 space-y-6 ${card}`}>

            {/* ── Property Details ── */}
            <SectionLabel dark={dark}>Property Details</SectionLabel>

            <Field label="Property" required error={errors.propertyName} dark={dark}>
              <div className="relative">
                <select
                  value={form.propertyName}
                  onChange={(e) => handleChange('propertyName', e.target.value)}
                  onBlur={() => handleBlur('propertyName')}
                  className={`field-input appearance-none pr-10 ${errors.propertyName ? 'border-red-400' : ''}`}
                >
                  <option value="">Select a property...</option>
                  {PROPERTIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </Field>

            <Field label="Unit / Apartment No." required error={errors.unitNumber} dark={dark}>
              <input
                type="text"
                placeholder="e.g. 12B, Apt 304, Villa 7"
                value={form.unitNumber}
                onChange={(e) => handleChange('unitNumber', e.target.value)}
                onBlur={() => handleBlur('unitNumber')}
                className={`field-input ${errors.unitNumber ? 'border-red-400' : ''}`}
              />
            </Field>

            <hr className={div} />

            {/* ── Issue Details ── */}
            <SectionLabel dark={dark}>Issue Details</SectionLabel>

            <Field label="Issue Category" required error={errors.issueCategory} dark={dark}>
              <div className="relative">
                <select
                  value={form.issueCategory}
                  onChange={(e) => handleChange('issueCategory', e.target.value)}
                  onBlur={() => handleBlur('issueCategory')}
                  className={`field-input appearance-none pr-10 ${errors.issueCategory ? 'border-red-400' : ''}`}
                >
                  <option value="">Select a category...</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </Field>

            <Field label="Urgency" required error={errors.urgency} dark={dark}>
              <div className="flex gap-3">
                {URGENCY_LEVELS.map((level) => {
                  const colors = {
                    Low:    { active: '#16a34a', bg: '#f0fdf4' },
                    Medium: { active: '#ca8a04', bg: '#fefce8' },
                    High:   { active: '#dc2626', bg: '#fef2f2' },
                  }
                  const c        = colors[level]
                  const isActive = form.urgency === level
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => handleChange('urgency', level)}
                      className="flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all"
                      style={{
                        backgroundColor: isActive ? c.bg  : (dark ? '#1f2937' : 'white'),
                        borderColor:     isActive ? c.active : (dark ? '#374151' : '#e5e7eb'),
                        color:           isActive ? c.active : (dark ? '#9ca3af' : '#6b7280'),
                      }}
                    >
                      {level}
                    </button>
                  )
                })}
              </div>
            </Field>

            <Field label="Description" required error={errors.description} dark={dark}>
              <textarea
                rows={4}
                placeholder="Describe the issue in detail..."
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                onBlur={() => handleBlur('description')}
                className={`field-input resize-none ${errors.description ? 'border-red-400' : ''}`}
              />
            </Field>

            {/* ── Photos (up to 3) ── */}
            <Field label="Photos" hint={`optional · up to 3`} dark={dark}>
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {photos.map((p, i) => (
                    <div
                      key={i}
                      className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
                      style={{ aspectRatio: '1' }}
                    >
                      {p.preview
                        ? <img src={p.preview} alt={p.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
                            <FileText className="text-blue-400" size={20} />
                            <p className="text-xs text-gray-500 truncate text-center w-full px-1">{p.name}</p>
                          </div>
                      }
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-black/80 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X size={12} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {photos.length < 3 && (
                <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  dark
                    ? 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}>
                  <Plus className="text-gray-400 mb-1" size={20} />
                  <span className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {photos.length === 0 ? 'Click to upload photos' : 'Add another photo'}
                  </span>
                  <span className="text-xs text-gray-400 mt-0.5">
                    {3 - photos.length} slot{3 - photos.length !== 1 ? 's' : ''} remaining · JPG, PNG up to 10MB
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFiles}
                    className="hidden"
                  />
                </label>
              )}
            </Field>

            <hr className={div} />

            {/* ── Contact Info ── */}
            <SectionLabel dark={dark}>Your Contact Info</SectionLabel>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Field label="Your Name" required error={errors.reporterName} dark={dark}>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} />
                  <input
                    type="text"
                    placeholder="Full name"
                    value={form.reporterName}
                    onChange={(e) => handleChange('reporterName', e.target.value)}
                    onBlur={() => handleBlur('reporterName')}
                    className={`field-input pl-9 ${errors.reporterName ? 'border-red-400' : ''}`}
                  />
                </div>
              </Field>

              <Field label="Phone Number" hint="optional" error={errors.reporterPhone} dark={dark}>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} />
                  <input
                    type="tel"
                    placeholder="+971 50 000 0000"
                    value={form.reporterPhone}
                    onChange={(e) => handleChange('reporterPhone', e.target.value)}
                    onBlur={() => handleBlur('reporterPhone')}
                    className={`field-input pl-9 ${errors.reporterPhone ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''}`}
                  />
                </div>
              </Field>
            </div>

            <Field label="Preferred Access Time" hint="optional" dark={dark}>
              <div className="relative">
                <select
                  value={form.accessTime}
                  onChange={(e) => handleChange('accessTime', e.target.value)}
                  onBlur={() => handleBlur('accessTime')}
                  className="field-input appearance-none pr-10"
                >
                  <option value="">No preference</option>
                  {ACCESS_TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </Field>

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#4ab9e6] hover:opacity-90 shadow-lg shadow-[#4ab9e6]/30 hover:shadow-[#4ab9e6]/50 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
            >
              {submitting
                ? <><Loader2 className="animate-spin" size={16} /> Submitting...</>
                : 'Submit Issue'
              }
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

function SectionLabel({ dark, children }) {
  return (
    <p className={`text-xs font-semibold uppercase tracking-widest ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
      {children}
    </p>
  )
}

function Field({ label, required, hint, error, dark, children }) {
  return (
    <div>
      <label className="field-label">
        {label}{' '}
        {required && <span className="text-red-400">*</span>}
        {hint    && <span className="text-gray-400 font-normal"> ({hint})</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
