import { useEffect, useState } from 'react'
import api from '../../api/axios'

export default function Produk() {
  const [list, setList] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ nama_produk: '', deskripsi: '', harga: '', kategori: 'Kemeja Batik' })
  const [gambar, setGambar] = useState(null)
  const [msg, setMsg] = useState('')

  const load = () => api.get('/produk').then(res => setList(res.data.data || []))
  useEffect(() => { load() }, [])

  const reset = () => {
    setForm({ nama_produk: '', deskripsi: '', harga: '', kategori: 'Kemeja Batik' })
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
        await api.put(`/admin/produk/${editId}`, fd)
        setMsg('Produk berhasil diperbarui')
      } else {
        await api.post('/admin/produk', fd)
        setMsg('Produk berhasil ditambahkan')
      }
      reset()
      load()
    } catch (err) {
      setMsg(err.response?.data?.message || 'Gagal menyimpan')
    }
  }

  const handleEdit = (p) => {
    setForm({ nama_produk: p.nama_produk, deskripsi: p.deskripsi, harga: p.harga, kategori: p.kategori })
    setEditId(p.id_produk)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus produk ini?')) return
    await api.delete(`/admin/produk/${id}`)
    load()
  }

  return (
    <div>
      <div className="admin-page-title">
        <div>
          <h2>Daftar produk</h2>
          <div className="sub">{list.length} produk di katalog</div>
        </div>
        <button className="btn btn-dark" onClick={() => { reset(); setShowForm(true) }}>+ Produk baru</button>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="section-card" style={{ marginBottom: 18 }}>
          <div className="form-group">
            <label>Nama Produk</label>
            <input value={form.nama_produk} onChange={e => setForm({ ...form, nama_produk: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Deskripsi</label>
            <textarea value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} rows={3} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Harga</label>
              <input type="number" value={form.harga} onChange={e => setForm({ ...form, harga: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Kategori</label>
              <select value={form.kategori} onChange={e => setForm({ ...form, kategori: e.target.value })}>
                <option>Kemeja Batik</option>
                <option>Dress Batik</option>
                <option>Kain Batik</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Gambar {editId && '(kosongkan jika tidak diubah)'}</label>
            <input type="file" accept="image/*" onChange={e => setGambar(e.target.files[0])} />
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
              <th>Nama</th>
              <th>Kategori</th>
              <th>Harga</th>
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={5} className="empty-row">Belum ada produk.</td></tr>
            ) : list.map(p => (
              <tr key={p.id_produk}>
                <td>
                  <img className="thumb" src={p.gambar ? `/uploads/${p.gambar}` : 'https://via.placeholder.com/42'} alt="" />
                </td>
                <td>{p.nama_produk}</td>
                <td>{p.kategori}</td>
                <td>Rp {Number(p.harga).toLocaleString('id-ID')}</td>
                <td>
                  <button className="btn btn-sm btn-outline" onClick={() => handleEdit(p)}>Ubah</button>{' '}
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id_produk)}>Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
