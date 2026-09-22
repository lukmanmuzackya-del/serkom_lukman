import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [form, setForm] = useState({ emailOrUname: '', passwd: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/login', form)
      login(res.data.token, res.data.user)
      if (res.data.user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-box">
      <h1>Login</h1>
      <p>Masuk ke akun Anda</p>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email atau Username</label>
          <input
            type="text"
            value={form.emailOrUname}
            onChange={e => setForm({ ...form, emailOrUname: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={form.passwd}
            onChange={e => setForm({ ...form, passwd: e.target.value })}
            required
          />
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Memproses...' : 'Login'}
        </button>
      </form>
      <p style={{ marginTop: 16, textAlign: 'center', fontSize: '0.9rem' }}>
        Belum punya akun? <Link to="/register" style={{ color: '#4361ee' }}>Daftar</Link>
      </p>
    </div>
  )
}
