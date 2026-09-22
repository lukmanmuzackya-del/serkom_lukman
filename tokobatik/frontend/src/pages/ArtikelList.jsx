import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

export default function ArtikelList() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/artikel')
      .then(res => setList(res.data.data || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Memuat artikel...</div>

  return (
    <div className="container">
      <div className="page-header">
        <h1>Artikel</h1>
      </div>
      {list.length === 0 ? (
        <div className="loading">Belum ada artikel.</div>
      ) : (
        <div className="produk-grid">
          {list.map(a => (
            <Link to={`/artikel/${a.id}`} key={a.id} className="card produk-card">
              <img
                src={a.gambar ? `/uploads/${a.gambar}` : 'https://via.placeholder.com/300x180?text=Artikel'}
                alt={a.judul}
              />
              <div className="body">
                <div className="nama">{a.judul}</div>
                <p style={{ fontSize: '0.85rem', color: '#666', marginTop: 6 }}>{a.ringkasan?.slice(0, 100)}...</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
