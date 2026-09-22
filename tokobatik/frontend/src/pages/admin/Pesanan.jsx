import { useEffect, useState } from 'react'
import api from '../../api/axios'

const STATUS_LIST = ['Tertunda', 'Dikemas', 'Dikirim', 'Diterima', 'Selesai']

export default function Pesanan() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    api.get('/admin/pembelian')
      .then(res => setList(res.data.data || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id, status) => {
    await api.put(`/admin/pembelian/${id}`, { status })
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus pesanan ini?')) return
    await api.delete(`/admin/pembelian/${id}`)
    load()
  }

  if (loading) return <div className="loading">Memuat...</div>

  return (
    <div>
      <div className="admin-page-title">
        <div>
          <h2>Daftar pesanan</h2>
          <div className="sub">{list.length} transaksi</div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Pembeli</th>
              <th>Gambar</th>
              <th>Produk</th>
              <th>Total</th>
              <th>Status</th>
              <th>Bayar</th>
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-row">Belum ada pesanan.</td>
              </tr>
            ) : (
              list.map(o => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>
                    {o.nama_d} {o.nama_b}
                    <div style={{ fontSize: '0.78rem', color: '#999' }}>{o.email}</div>
                  </td>
                  <td>
                    <img
                      className="thumb"
                      src={o.gambar ? `/uploads/${o.gambar}` : 'https://via.placeholder.com/42'}
                      alt=""
                    />
                  </td>
                  <td>{o.nama_produk}</td>
                  <td>Rp {Number(o.harga || 0).toLocaleString('id-ID')}</td>
                  <td>
                    <select
                      value={o.status}
                      onChange={e => updateStatus(o.id, e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd', fontSize: '0.82rem' }}
                    >
                      {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <span className={`badge badge-${(o.pembayaran || '').toLowerCase()}`}>{o.pembayaran}</span>
                    <div style={{ fontSize: '0.75rem', color: '#999' }}>{o.metode_pembayaran}</div>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(o.id)}>Hapus</button>
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
