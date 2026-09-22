import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

const KATEGORI = ['Semua', 'Kemeja Batik', 'Dress Batik', 'Kain Batik']

export default function Home() {
  const [produk, setProduk] = useState([])
  const [kategori, setKategori] = useState('Semua')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = kategori !== 'Semua' ? { kategori } : {}
    api.get('/produk', { params })
      .then(res => setProduk(res.data.data || []))
      .catch(() => setProduk([]))
      .finally(() => setLoading(false))
  }, [kategori])

  const imgUrl = (gambar) => gambar ? `/uploads/${gambar}` : 'https://via.placeholder.com/300x200?text=No+Image'

  return (
    <div className="container">
      <div className="page-header">
        <h1>Produk Kami</h1>
      </div>

      <div className="filter-bar">
        {KATEGORI.map(k => (
          <button
            key={k}
            className={kategori === k ? 'active' : ''}
            onClick={() => setKategori(k)}
          >
            {k}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Memuat produk...</div>
      ) : produk.length === 0 ? (
        <div className="loading">Belum ada produk.</div>
      ) : (
        <div className="produk-grid">
          {produk.map(p => (
            <Link to={`/produk/${p.id_produk}`} key={p.id_produk} className="card produk-card">
              <img src={imgUrl(p.gambar)} alt={p.nama_produk} />
              <div className="body">
                <div className="kategori">{p.kategori}</div>
                <div className="nama">{p.nama_produk}</div>
                <div className="harga">Rp {Number(p.harga).toLocaleString('id-ID')}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
