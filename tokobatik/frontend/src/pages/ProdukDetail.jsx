import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function ProdukDetail() {
  const { id } = useParams()
  const [produk, setProduk] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    api.get(`/produk/${id}`)
      .then(res => setProduk(res.data.data))
      .catch(() => setProduk(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="loading">Memuat...</div>
  if (!produk) return <div className="loading">Produk tidak ditemukan.</div>

  const imgUrl = produk.gambar ? `/uploads/${produk.gambar}` : 'https://via.placeholder.com/500x400?text=No+Image'

  const handleBeli = () => {
    if (!user) {
      navigate('/login')
      return
    }
    navigate(`/checkout/${produk.id_produk}`)
  }

  return (
    <div className="container">
      <div className="detail-grid">
        <img src={imgUrl} alt={produk.nama_produk} className="detail-img" />
        <div>
          <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: 8 }}>{produk.kategori}</div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 12 }}>{produk.nama_produk}</h1>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4361ee', marginBottom: 20 }}>
            Rp {Number(produk.harga).toLocaleString('id-ID')}
          </div>
          <p style={{ color: '#555', marginBottom: 24, whiteSpace: 'pre-line' }}>{produk.deskripsi}</p>
          <button className="btn btn-primary" onClick={handleBeli} style={{ padding: '12px 32px' }}>
            Beli Sekarang
          </button>
          <div style={{ marginTop: 16 }}>
            <Link to="/" style={{ color: '#4361ee', fontSize: '0.9rem' }}>← Kembali ke beranda</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
