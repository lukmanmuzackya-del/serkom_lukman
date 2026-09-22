import { useEffect, useState } from 'react'
import api from '../../api/axios'

export default function AdminUsers() {
  const [list, setList] = useState([])

  const load = () => api.get('/admin/users').then(res => setList(res.data.data || []))
  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Hapus user ini?')) return
    try {
      await api.delete(`/admin/users/${id}`)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus')
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Kelola Users</h1>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>Username</th>
              <th>Role</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.map(u => (
              <tr key={u.id}>
                <td>{u.nama_d} {u.nama_b}</td>
                <td>{u.email}</td>
                <td>{u.uname}</td>
                <td>
                  <span className={`badge ${u.role === 'admin' ? 'badge-dikemas' : 'badge-tertunda'}`}>
                    {u.role}
                  </span>
                </td>
                <td>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id)}>Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
