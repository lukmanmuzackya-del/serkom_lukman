import { useEffect, useState } from 'react'
import api from '../../api/axios'

export default function Pembeli() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    api.get('/admin/users')
      .then(res => setList((res.data.data || []).filter(u => u.role === 'pembeli')))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Hapus pembeli ini?')) return
    try {
      await api.delete(`/admin/users/${id}`)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus')
    }
  }

  if (loading) return <div className="loading">Memuat...</div>

  return (
    <div>
      <div className="admin-page-title">
        <div>
          <h2>Daftar pembeli</h2>
          <div className="sub">{list.length} akun pembeli</div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Foto</th>
              <th>Nama</th>
              <th>Email</th>
              <th>Username</th>
              <th>Telepon</th>
              <th>Daftar</th>
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-row">
                  Belum ada akun pembeli.
                </td>
              </tr>
            ) : (
              list.map(u => (
                <tr key={u.id}>
                  <td>
                    <img
                      className="thumb"
                      src={u.foto && u.foto !== 'default.jpg' ? `/uploads/${u.foto}` : 'https://via.placeholder.com/42'}
                      alt=""
                    />
                  </td>
                  <td>{u.nama_d} {u.nama_b}</td>
                  <td>{u.email}</td>
                  <td>{u.uname}</td>
                  <td>{u.phone || '—'}</td>
                  <td>{u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '—'}</td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id)}>Hapus</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
