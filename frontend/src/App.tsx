import { useEffect, useState } from 'react'

function App() {
  const [message, setMessage] = useState('Lade...')

  useEffect(() => {
    fetch('http://localhost:3000/api/v1/health')
      .then((res) => res.json())
      .then((data) => setMessage(data.status))
      .catch(() => setMessage('Fehler beim Verbinden'))
  }, [])

  return (
    <div>
      <h1>ChapterFlow</h1>
      <p>API Status: {message}</p>
    </div>
  )
}

export default App
