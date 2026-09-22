import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [pesanan, setPesanan] = useState([])

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data.data)).catch(() => {})
    api.get('/admin/pembelian').then(res => setPesanan((res.data.data || []).slice(0, 5))).catch(() => {})
  }, [])

  if (!stats) return <div className="loading">Memuat...</div>

  return (
    <div>
      {/* Stats row 1 */}
      <div className="stats-row">
        <div className="stat-box yellow">
          <div className="label">Pembeli Terdaftar</div>
          <div className="value">{stats.total_users || 0}</div>
        </div>
        <div className="stat-box black">
          <div className="label">Total Transaksi</div>
          <div className="value">{stats.total_pesanan || 0}</div>
        </div>
        <div className="stat-box orange">
          <div className="label">Produk di Katalog</div>
          <div className="value">{stats.total_produk || 0}</div>
        </div>
        <div className="stat-box yellow">
          <div className="label">Produk Terjual</div>
          <div className="value">{stats.total_pesanan || 0}</div>
          <div className="sub">Jumlah pesanan</div>
        </div>
      </div>

      {/* Stats row 2 */}
      <div className="stats-row">
        <div className="stat-box">
          <div className="label">Artikel</div>
          <div className="value">{stats.total_artikel || 0}</div>
        </div>
        <div className="stat-box">
          <div className="label">Pesanan Aktif</div>
          <div className="value">—</div>
        </div>
        <div className="stat-box red">
          <div className="label">Belum Dibayar</div>
          <div className="value">—</div>
        </div>
        <div className="stat-box">
          <div className="label">&nbsp;</div>
          <div className="value" style={{ fontSize: '1rem', color: '#aaa' }}>—</div>
        </div>
      </div>

      {/* Pendapatan */}
      <div className="section-card">
        <span className="amount">Rp 0</span>
        <h3>Pendapatan (dibayar)</h3>
        <p className="desc">Total dari pesanan dengan status pembayaran "Dibayar".</p>
      </div>

      {/* Transaksi terbaru */}
      <div className="section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3>Transaksi terbaru</h3>
          <Link to="/admin/pesanan" className="btn btn-sm btn-outline">Lihat semua</Link>
        </div>
        {pesanan.length === 0 ? (
          <p className="desc">Belum ada pesanan.</p>
        ) : (
          <div className="table-wrap" style={{ boxShadow: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Produk</th>
                  <th>Status</th>
                  <th>Bayar</th>
                </tr>
              </thead>
              <tbody>
                {pesanan.map(o => (
                  <tr key={o.id}>
                    <td>#{o.id}</td>
                    <td>{o.nama_produk}</td>
                    <td><span className={`badge badge-${(o.status || '').toLowerCase()}`}>{o.status}</span></td>
                    <td><span className={`badge badge-${(o.pembayaran || '').toLowerCase()}`}>{o.pembayaran}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="quick-actions">
        <Link to="/admin/produk" className="btn">+ Tambah produk</Link>
        <Link to="/admin/artikel" className="btn">+ Tulis artikel</Link>
      </div>
    </div>
  )
}
