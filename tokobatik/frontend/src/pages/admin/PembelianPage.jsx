import { useEffect, useState } from "react";
import { adminApi } from "../../api";
import { formatRupiah, formatTanggal } from "../../utils";

function PembelianPage() {
  const [pembelian, setPembelian] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPembelian = async () => {
    try {
      setLoading(true);

      const response = await adminApi.getPembelian();

      setPembelian(response.data || []);
    } catch (err) {
      setError(err.message || "Gagal mengambil data pembelian.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPembelian();
  }, []);

  const handleUpdate = async (item) => {
    const status_proses = window.prompt(
      "Masukkan status proses:",
      item.status_proses || ""
    );

    if (status_proses === null) return;

    try {
      await adminApi.updatePembelian(item.id_pembelian, {
        status_proses,
      });

      await loadPembelian();
    } catch (err) {
      setError(
        err.message || "Gagal memperbarui pembelian."
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus pembelian ini?")) {
      return;
    }

    try {
      await adminApi.deletePembelian(id);
      await loadPembelian();
    } catch (err) {
      setError(err.message || "Gagal menghapus pembelian.");
    }
  };

  return (
    <div>
      <h1>Kelola Pembelian</h1>

      {error && <p>{error}</p>}

      {loading ? (
        <p>Memuat pembelian...</p>
      ) : pembelian.length === 0 ? (
        <p>Belum ada pembelian.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Pembeli</th>
              <th>Total</th>
              <th>Metode Bayar</th>
              <th>Kurir</th>
              <th>Status Proses</th>
              <th>Tanggal</th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody>
            {pembelian.map((item) => (
              <tr key={item.id_pembelian}>
                <td>{item.id_pembelian}</td>

                <td>
                  {item.nama_d || item.id_pembeli || "-"}
                </td>

                <td>
                  {formatRupiah(item.total_harga || item.total)}
                </td>

                <td>{item.metode_bayar || "-"}</td>

                <td>{item.kurir || "-"}</td>

                <td>{item.status_proses || "-"}</td>

                <td>
                  {item.created_at
                    ? formatTanggal(item.created_at)
                    : "-"}
                </td>

                <td>
                  <button
                    onClick={() => handleUpdate(item)}
                  >
                    Update
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(item.id_pembelian)
                    }
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default PembelianPage;