import { useEffect, useState } from "react";
import { api } from "../../api";

function ArtikelPage() {
  const [artikel, setArtikel] = useState([]);

  const [form, setForm] = useState({
    judul: "",
    ringkasan: "",
    isi: "",
    gambar: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // =========================
  // AMBIL DATA ARTIKEL
  // =========================
  const loadArtikel = async () => {
    try {
      const response = await api.get("/artikel");

      setArtikel(
        Array.isArray(response.data)
          ? response.data
          : response.data?.data || []
      );
    } catch (error) {
      console.error("Gagal mengambil artikel:", error);
    }
  };

  useEffect(() => {
    loadArtikel();
  }, []);

  // =========================
  // HANDLE INPUT
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
  };

  // =========================
  // TAMBAH ARTIKEL
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.judul || !form.isi) {
      setMessage("Judul dan isi artikel wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await api.post("/artikel", form);

      setMessage("Artikel berhasil ditambahkan.");

      setForm({
        judul: "",
        ringkasan: "",
        isi: "",
        gambar: "",
      });

      loadArtikel();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Gagal menambahkan artikel."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // HAPUS ARTIKEL
  // =========================
  const handleDelete = async (id) => {
    const yakin = window.confirm(
      "Yakin ingin menghapus artikel ini?"
    );

    if (!yakin) return;

    try {
      await api.delete(`/artikel/${id}`);

      setMessage("Artikel berhasil dihapus.");

      loadArtikel();
    } catch (error) {
      console.error(error);

      setMessage("Gagal menghapus artikel.");
    }
  };

  return (
    <div className="admin-page">

      {/* HEADER */}
      <div className="admin-page-header">
        <div>
          <span className="section-label">
            CONTENT MANAGEMENT
          </span>

          <h1>Kelola Artikel</h1>

          <p>
            Tambahkan dan kelola artikel Batik Nusantara.
          </p>
        </div>
      </div>

      {/* FORM */}
      <div className="admin-card">

        <div className="admin-card-header">
          <div>
            <h2>Tambah Artikel</h2>

            <p>
              Artikel yang ditambahkan di sini akan
              ditampilkan pada halaman artikel publik.
            </p>
          </div>
        </div>

        <form
          className="admin-form"
          onSubmit={handleSubmit}
        >

          <div className="form-group">
            <label>Judul Artikel</label>

            <input
              type="text"
              name="judul"
              value={form.judul}
              onChange={handleChange}
              placeholder="Masukkan judul artikel"
            />
          </div>

          <div className="form-group">
            <label>Ringkasan</label>

            <textarea
              name="ringkasan"
              value={form.ringkasan}
              onChange={handleChange}
              placeholder="Masukkan ringkasan artikel"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Isi Artikel</label>

            <textarea
              name="isi"
              value={form.isi}
              onChange={handleChange}
              placeholder="Tulis isi artikel..."
              rows="8"
            />
          </div>

          <div className="form-group">
            <label>URL Gambar</label>

            <input
              type="text"
              name="gambar"
              value={form.gambar}
              onChange={handleChange}
              placeholder="Masukkan URL gambar"
            />
          </div>

          {message && (
            <div className="admin-message">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="admin-submit-btn"
            disabled={loading}
          >
            {loading
              ? "Menyimpan..."
              : "＋ Tambah Artikel"}
          </button>

        </form>
      </div>

      {/* DAFTAR ARTIKEL */}
      <div className="admin-card">

        <div className="admin-card-header">
          <div>
            <h2>Daftar Artikel</h2>

            <p>
              Artikel yang sudah dibuat oleh admin.
            </p>
          </div>
        </div>

        {artikel.length === 0 ? (
          <div className="admin-empty">

            <div className="admin-empty-icon">
              📰
            </div>

            <h3>
              Belum ada artikel
            </h3>

            <p>
              Tambahkan artikel pertama melalui form
              di atas.
            </p>

          </div>
        ) : (
          <div className="admin-article-list">

            {artikel.map((item) => (
              <div
                className="admin-article-item"
                key={item.id}
              >

                <div>
                  <span className="article-date">
                    {item.created_at
                      ? new Date(
                          item.created_at
                        ).toLocaleDateString("id-ID")
                      : ""}
                  </span>

                  <h3>
                    {item.judul || item.title}
                  </h3>

                  <p>
                    {item.ringkasan ||
                      item.excerpt ||
                      "Tidak ada ringkasan."}
                  </p>
                </div>

                <button
                  type="button"
                  className="delete-btn"
                  onClick={() =>
                    handleDelete(item.id)
                  }
                >
                  Hapus
                </button>

              </div>
            ))}

          </div>
        )}

      </div>

    </div>
  );
}

export default ArtikelPage;
