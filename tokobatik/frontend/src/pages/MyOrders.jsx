import { useEffect, useState } from 'react'
import api from '../api/axios'

export default function MyOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(null)

  const load = () => {
    api.get('/pembelian/saya')
      .then(res => setOrders(res.data.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleUploadBukti = async (id, file) => {
    if (!file) return
    setUploading(id)
    const fd = new FormData()
    fd.append('foto_bukti', file)
    try {
      await api.put(`/pembelian/${id}/bukti`, fd)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal upload')
    } finally {
      setUploading(null)
    }
  }

  const statusClass = (s) => `badge badge-${(s || '').toLowerCase()}`

  if (loading) return <div className="loading">Memuat pesanan...</div>

  return (
    <div className="container">
      <div className="page-header">
        <h1>Pesanan Saya</h1>
      </div>

      {orders.length === 0 ? (
        <div className="loading">Belum ada pesanan.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Produk</th>
                <th>Harga</th>
                <th>Pembayaran</th>
                <th>Status</th>
                <th>Pengiriman</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td>
                    <strong>{o.nama_produk}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>#{o.id}</div>
                  </td>
                  <td>Rp {Number(o.harga).toLocaleString('id-ID')}</td>
                  <td>
                    <span className={`badge badge-${o.pembayaran?.toLowerCase()}`}>{o.pembayaran}</span>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{o.metode_pembayaran}</div>
                  </td>
                  <td><span className={statusClass(o.status)}>{o.status}</span></td>
                  <td>{o.pengiriman}</td>
                  <td>
                    {o.pembayaran === 'Belum' && o.metode_pembayaran === 'Bank Transfer' && (
                      <label className="btn btn-sm btn-primary" style={{ cursor: 'pointer' }}>
                        {uploading === o.id ? 'Uploading...' : 'Upload Bukti'}
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={e => handleUploadBukti(o.id, e.target.files[0])}
                        />
                      </label>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
