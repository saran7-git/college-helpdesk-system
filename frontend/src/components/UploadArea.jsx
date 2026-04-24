import React, { useRef, useState } from 'react'

export default function UploadArea({ onFilesSelected }) {
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')
  const ref = useRef(null)
  const maxMb = 200
  const maxBytes = maxMb * 1024 * 1024

  const onDrop = (e) => {
    e.preventDefault()
    const f = Array.from(e.dataTransfer.files || [])
    handleFiles(f)
  }

  const handleFiles = (f) => {
    const allowed = ['image/', 'video/', 'application/pdf']
    const filtered = f.filter((x) => allowed.some((p) => x.type.startsWith(p)))
    const oversized = filtered.filter((x) => x.size > maxBytes)
    const valid = filtered.filter((x) => x.size <= maxBytes)

    if (oversized.length > 0) {
      setError(`Some files were skipped because they exceed ${maxMb}MB each.`)
    } else {
      setError('')
    }

    if (filtered.length !== f.length && filtered.length > 0) {
      setError('Some files were skipped because only image/video/PDF are allowed.')
    }

    if (filtered.length === 0 && f.length > 0) {
      setError('Only image, video, or PDF files are allowed.')
    }

    setFiles(valid)
    onFilesSelected(valid)
  }

  return (
    <div
      className="upload"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <div style={{ marginBottom: 8 }}>Drag and drop files here</div>
      <div style={{ marginBottom: 8, color: 'var(--subtext)', fontSize: 12 }}>Allowed: image / video / PDF (max {maxMb}MB each)</div>
      <div style={{ marginBottom: 8 }}>or</div>
      <button className="btn secondary" onClick={() => ref.current.click()}>Browse</button>
      <input
        ref={ref}
        type="file"
        accept="image/*,video/*,application/pdf"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(Array.from(e.target.files || []))}
      />
      {error && <div style={{ marginTop: 10, color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
      {files.length > 0 && (
        <div style={{ marginTop: 12, display: 'grid', gap: 8, gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {files.map((f, i) => (
            <div key={i} className="card" style={{ padding: 8 }}>
              <div style={{ fontSize: 12 }}>{f.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
