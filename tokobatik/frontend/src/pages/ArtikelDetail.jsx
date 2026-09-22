import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axios'

export default function ArtikelDetail() {
  const { id } = useParams()
  const [artikel, setArtikel] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/artikel/${id}`)
      .then(res => setArtikel(res.data.data))
      .catch(() => setArtikel(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="loading">Memuat...</div>
  if (!artikel) return <div className="loading">Artikel tidak ditemukan.</div>

  return (
    <div className="container" style={{ maxWidth: 800 }}>
      <div style={{ marginTop: 28 }}>
        <Link to="/artikel" style={{ color: '#4361ee', fontSize: '0.9rem' }}>← Kembali ke daftar artikel</Link>
      </div>
      <h1 style={{ margin: '16px 0' }}>{artikel.judul}</h1>
      {artikel.gambar && (
        <img
          src={`/uploads/${artikel.gambar}`}
          alt={artikel.judul}
          style={{ width: '100%', borderRadius: 12, marginBottom: 20, maxHeight: 360, objectFit: 'cover' }}
        />
      )}
      <p style={{ color: '#666', fontStyle: 'italic', marginBottom: 20 }}>{artikel.ringkasan}</p>
      <div style={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>{artikel.isi}</div>
    </div>
  )
}
