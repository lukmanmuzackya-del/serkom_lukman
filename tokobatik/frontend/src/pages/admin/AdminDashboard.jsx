import { useEffect, useState } from "react";
import { adminApi } from "../../api";
import { formatRupiah, formatTanggal } from "../../utils";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = async () => {
    try {
      setLoading(true);

      const response = await adminApi.getStats();

      setStats(response.data || response);
    } catch (err) {
      setError(err.message || "Gagal mengambil statistik.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return <p>Memuat dashboard...</p>;
  }

  return (
    <div>
      <h1>Dashboard Admin</h1>

      {error && <p>{error}</p>}

      {stats && (
        <>
          <div>
            <div>
              <h3>Total Pembeli</h3>
              <p>{stats.totalPembeli ?? 0}</p>
            </div>

            <div>
              <h3>Total Produk</h3>
              <p>{stats.totalProduk ?? 0}</p>
            </div>

            <div>
              <h3>Total Artikel</h3>
              <p>{stats.totalArtikel ?? 0}</p>
            </div>

            <div>
              <h3>Total Pembelian</h3>
              <p>{stats.totalPembelian ?? 0}</p>
            </div>

            <div>
              <h3>Total Pendapatan</h3>
              <p>
                {formatRupiah(stats.totalPendapatan ?? 0)}
              </p>
            </div>
          </div>

          <hr />

          <h2>Pembelian Terbaru</h2>

          {!stats.recentPembelian ||
          stats.recentPembelian.length === 0 ? (
            <p>Belum ada pembelian.</p>
          ) : (
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
                      {item.nama_d || item.id_pembeli || "-"}
                    </td>

                    <td>
                      {formatRupiah(
                        item.total_harga ?? item.total ?? 0
                      )}
                    </td>

                    <td>
                      {item.status_proses || "-"}
                    </td>

                    <td>
                      {item.created_at
                        ? formatTanggal(item.created_at)
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

export default AdminDashboard;