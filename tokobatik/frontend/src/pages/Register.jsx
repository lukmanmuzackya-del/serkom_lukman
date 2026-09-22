import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function Register() {
  const [form, setForm] = useState({
    nama_d: '', nama_b: '', kelamin: 'Laki-laki', lahir: '',
    alamat: '', phone: '', email: '', uname: '', passwd: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await api.post('/register', form)
      setSuccess('Registrasi berhasil! Silakan login.')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Registrasi gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-box" style={{ maxWidth: 520 }}>
      <h1>Daftar Akun</h1>
      <p>Buat akun pembeli baru</p>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label>Nama Depan</label>
            <input name="nama_d" value={form.nama_d} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Nama Belakang</label>
            <input name="nama_b" value={form.nama_b} onChange={handleChange} required />
          </div>
        </div>
        <div className="form-group">
          <label>Jenis Kelamin</label>
          <select name="kelamin" value={form.kelamin} onChange={handleChange}>
            <option>Laki-laki</option>
            <option>Perempuan</option>
          </select>
        </div>
        <div className="form-group">
          <label>Tanggal Lahir</label>
          <input type="date" name="lahir" value={form.lahir} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Alamat</label>
          <textarea name="alamat" value={form.alamat} onChange={handleChange} rows={2} required />
        </div>
        <div className="form-group">
          <label>No. HP</label>
          <input type="number" name="phone" value={form.phone} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Username</label>
          <input name="uname" value={form.uname} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" name="passwd" value={form.passwd} onChange={handleChange} required minLength={6} />
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Memproses...' : 'Daftar'}
        </button>
      </form>
      <p style={{ marginTop: 16, textAlign: 'center', fontSize: '0.9rem' }}>
        Sudah punya akun? <Link to="/login" style={{ color: '#4361ee' }}>Login</Link>
      </p>
    </div>
  )
}
