import React from 'react'
import { useSearchParams } from 'react-router-dom'

export default function Header() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') || ''

  const updateSearch = (value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set('q', value)
    else next.delete('q')
    setSearchParams(next)
  }

  return (
    <header className="header">
      <div className="header-inner">
        <h1 className="header-title">Student Workspace</h1>
      </div>
    </header>
  )
}
