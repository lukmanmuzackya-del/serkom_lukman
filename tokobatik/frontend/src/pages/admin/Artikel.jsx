import { useEffect, useState } from 'react'
import api from '../../api/axios'

export default function Artikel() {
  const [list, setList] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ judul: '', ringkasan: '', isi: '' })
  const [gambar, setGambar] = useState(null)
  const [msg, setMsg] = useState('')

  const load = () => api.get('/artikel').then(res => setList(res.data.data || []))
  useEffect(() => { load() }, [])

  const reset = () => {
    setForm({ judul: '', ringkasan: '', isi: '' })
    setGambar(null)
    setEditId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    if (gambar) fd.append('gambar', gambar)
    try {
      if (editId) {
        await api.put(`/admin/artikel/${editId}`, fd)
        setMsg('Artikel diperbarui')
      } else {
        await api.post('/admin/artikel', fd)
        setMsg('Artikel ditambahkan')
      }
      reset()
      load()
    } catch (err) {
      setMsg(err.response?.data?.message || 'Gagal')
    }
  }

  const handleEdit = (a) => {
    setForm({ judul: a.judul, ringkasan: a.ringkasan, isi: a.isi })
    setEditId(a.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus artikel?')) return
    await api.delete(`/admin/artikel/${id}`)
    load()
  }

  return (
    <div>
      <div className="admin-page-title">
        <div>
          <h2>Artikel & blog</h2>
          <div className="sub">{list.length} artikel</div>
        </div>
        <button className="btn btn-dark" onClick={() => { reset(); setShowForm(true) }}>+ Artikel baru</button>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="section-card" style={{ marginBottom: 18 }}>
          <div className="form-group">
            <label>Judul</label>
            <input value={form.judul} onChange={e => setForm({ ...form, judul: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Ringkasan</label>
            <textarea value={form.ringkasan} onChange={e => setForm({ ...form, ringkasan: e.target.value })} rows={2} required />
          </div>
          <div className="form-group">
            <label>Isi</label>
            <textarea value={form.isi} onChange={e => setForm({ ...form, isi: e.target.value })} rows={6} required />
          </div>
          <div className="form-group">
            <label>Gambar {!editId && '(wajib)'}</label>
            <input type="file" accept="image/*" onChange={e => setGambar(e.target.files[0])} required={!editId} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-dark">{editId ? 'Update' : 'Simpan'}</button>
            <button type="button" className="btn btn-outline" onClick={reset}>Batal</button>
          </div>
        </form>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Gambar</th>
              <th>Judul</th>
              <th>Tanggal</th>
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={4} className="empty-row">Belum ada artikel.</td></tr>
            ) : list.map(a => (
              <tr key={a.id}>
                <td>
                  <img className="thumb" src={a.gambar ? `/uploads/${a.gambar}` : 'https://via.placeholder.com/42'} alt="" />
                </td>
                <td>
                  <strong>{a.judul}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#999' }}>{a.ringkasan?.slice(0, 80)}...</div>
                </td>
                <td>{a.created_at ? new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</td>
                <td>
                  <button className="btn btn-sm btn-outline" onClick={() => handleEdit(a)}>Ubah</button>{' '}
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(a.id)}>Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
