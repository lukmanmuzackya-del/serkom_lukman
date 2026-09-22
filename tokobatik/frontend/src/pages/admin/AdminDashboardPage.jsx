import { useEffect, useState } from "react";
import { adminApi } from "../../api";

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await adminApi.getStats();

      setStats(response.data || response);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.message || "Gagal mengambil statistik.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p>Memuat dashboard...</p>;
  }

  if (error) {
    return (
      <div>
        <p>{error}</p>
        <button onClick={loadStats}>Coba Lagi</button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="page-title">
        <h2>Dashboard</h2>
        <p>Ringkasan toko</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Pembeli</h3>
          <strong>
            {stats?.totalPembeli ?? 0}
          </strong>
        </div>

        <div className="stat-card">
          <h3>Total Produk</h3>
          <strong>
            {stats?.totalProduk ?? 0}
          </strong>
        </div>

        <div className="stat-card">
          <h3>Total Pembelian</h3>
          <strong>
            {stats?.totalPembelian ?? 0}
          </strong>
        </div>

        <div className="stat-card">
          <h3>Total Artikel</h3>
          <strong>
            {stats?.totalArtikel ?? 0}
          </strong>
        </div>
      </div>

      <div className="recent-section">
        <div className="section-header">
          <div>
            <h2>Pembelian Terbaru</h2>
            <p>Daftar pembelian terbaru.</p>
          </div>

          <button onClick={loadStats}>
            Refresh
          </button>
        </div>

        {(!stats?.recentPembelian ||
          stats.recentPembelian.length === 0) ? (
          <p>Belum ada pembelian.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Pembeli</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                </tr>
              </thead>

              <tbody>
                {stats.recentPembelian.map((item) => (
                  <tr key={item.id_pembelian}>
                    <td>{item.id_pembelian}</td>

                    <td>
                      {item.nama_pembeli ||
                        item.nama_d ||
                        "-"}
                    </td>

                    <td>
                      Rp{" "}
                      {Number(
                        item.total || 0
                      ).toLocaleString("id-ID")}
                    </td>

                    <td>
                      {item.status_proses ||
                        item.status ||
                        "-"}
                    </td>

                    <td>
                      {item.created_at
                        ? new Date(
                            item.created_at
                          ).toLocaleDateString("id-ID")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;