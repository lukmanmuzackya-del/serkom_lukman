import { useEffect, useState } from "react";
import { adminApi } from "../../api";
import { formatRupiah } from "../../utils";
import { KATEGORI_PRODUK } from "../../constants";

function ProdukPage() {
  const [produk, setProduk] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nama_produk: "",
    deskripsi: "",
    harga: "",
    gambar: "",
    kategori: "",
  });

  const [editId, setEditId] = useState(null);

  const loadProduk = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getProduk();
      setProduk(response.data || []);
    } catch (err) {
      setError(err.message || "Gagal mengambil produk.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduk();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setForm({
      nama_produk: "",
      deskripsi: "",
      harga: "",
      gambar: "",
      kategori: "",
    });
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const payload = {
        ...form,
        harga: Number(form.harga),
      };

      if (editId) {
        await adminApi.updateProduk(editId, payload);
      } else {
        await adminApi.createProduk(payload);
      }

      resetForm();
      await loadProduk();
    } catch (err) {
      setError(err.message || "Gagal menyimpan produk.");
    }
  };

  const handleEdit = (item) => {
    setEditId(item.id_produk);

    setForm({
      nama_produk: item.nama_produk || "",
      deskripsi: item.deskripsi || "",
      harga: item.harga || "",
      gambar: item.gambar || "",
      kategori: item.kategori || "",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus produk ini?")) {
      return;
    }

    try {
      await adminApi.deleteProduk(id);
      await loadProduk();
    } catch (err) {
      setError(err.message || "Gagal menghapus produk.");
    }
  };

  return (
    <div>
      <h1>Kelola Produk</h1>

      {error && <p>{error}</p>}

      <form onSubmit={handleSubmit}>
        <h2>{editId ? "Edit Produk" : "Tambah Produk"}</h2>

        <input
          type="text"
          name="nama_produk"
          placeholder="Nama produk"
          value={form.nama_produk}
          onChange={handleChange}
          required
        />

        <textarea
          name="deskripsi"
          placeholder="Deskripsi"
          value={form.deskripsi}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="harga"
          placeholder="Harga"
          value={form.harga}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="gambar"
          placeholder="Nama/path gambar"
          value={form.gambar}
          onChange={handleChange}
        />

        <select
          name="kategori"
          value={form.kategori}
          onChange={handleChange}
          required
        >
          <option value="">Pilih kategori</option>

          {KATEGORI_PRODUK?.map((kategori) => (
            <option key={kategori} value={kategori}>
              {kategori}
            </option>
          ))}
        </select>

        <button type="submit">
          {editId ? "Simpan Perubahan" : "Tambah Produk"}
        </button>

        {editId && (
          <button type="button" onClick={resetForm}>
            Batal
          </button>
        )}
      </form>

      <hr />

      <h2>Daftar Produk</h2>

      {loading ? (
        <p>Memuat produk...</p>
      ) : produk.length === 0 ? (
        <p>Belum ada produk.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Kategori</th>
              <th>Harga</th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody>
            {produk.map((item) => (
              <tr key={item.id_produk}>
                <td>{item.nama_produk}</td>
                <td>{item.kategori}</td>
                <td>{formatRupiah(item.harga)}</td>

                <td>
                  <button onClick={() => handleEdit(item)}>
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(item.id_produk)
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

export default ProdukPage; 