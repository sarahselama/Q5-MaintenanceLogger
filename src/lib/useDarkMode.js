import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [dark, setDark] = useState(
    () => localStorage.getItem('dlx-dark') === 'true'
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('dlx-dark', dark)
  }, [dark])

  return [dark, setDark]
}
