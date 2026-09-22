import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function Checkout() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [produk, setProduk] = useState(null)
  const [form, setForm] = useState({
    nama_pembeli: '',
    alamat_pembeli: '',
    phone_pembeli: '',
    metode_pembayaran: 'COD',
    pengiriman: 'JNT Express',
    catatan: ''
  })
  const [foto, setFoto] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get(`/produk/${id}`).then(res => setProduk(res.data.data))
    if (user) {
      setForm(f => ({
        ...f,
        nama_pembeli: `${user.nama_d || ''} ${user.nama_b || ''}`.trim(),
        phone_pembeli: user.phone || ''
      }))
    }
  }, [id, user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      fd.append('id_produk', id)
      if (foto) fd.append('foto_bukti', foto)

      await api.post('/pembelian', fd)
      navigate('/pesanan-saya')
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat pesanan')
    } finally {
      setLoading(false)
    }
  }

  if (!produk) return <div className="loading">Memuat...</div>

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <div className="page-header">
        <h1>Checkout</h1>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <strong>{produk.nama_produk}</strong>
        <div style={{ color: '#4361ee', fontWeight: 700, marginTop: 4 }}>
          Rp {Number(produk.harga).toLocaleString('id-ID')}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="card" style={{ padding: 24 }}>
        <div className="form-group">
          <label>Nama Penerima</label>
          <input value={form.nama_pembeli} onChange={e => setForm({ ...form, nama_pembeli: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Alamat Pengiriman</label>
          <textarea value={form.alamat_pembeli} onChange={e => setForm({ ...form, alamat_pembeli: e.target.value })} rows={3} required />
        </div>
        <div className="form-group">
          <label>No. HP</label>
          <input type="number" value={form.phone_pembeli} onChange={e => setForm({ ...form, phone_pembeli: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Metode Pembayaran</label>
          <select value={form.metode_pembayaran} onChange={e => setForm({ ...form, metode_pembayaran: e.target.value })}>
            <option value="COD">COD (Bayar di tempat)</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>
        {form.metode_pembayaran === 'Bank Transfer' && (
          <div className="form-group">
            <label>Upload Bukti Transfer</label>
            <input type="file" accept="image/*" onChange={e => setFoto(e.target.files[0])} />
          </div>
        )}
        <div className="form-group">
          <label>Jasa Pengiriman</label>
          <select value={form.pengiriman} onChange={e => setForm({ ...form, pengiriman: e.target.value })}>
            <option value="JNT Express">JNT Express</option>
            <option value="JNE">JNE</option>
          </select>
        </div>
        <div className="form-group">
          <label>Catatan (opsional)</label>
          <textarea value={form.catatan} onChange={e => setForm({ ...form, catatan: e.target.value })} rows={2} />
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Memproses...' : 'Buat Pesanan'}
        </button>
      </form>
    </div>
  )
}
