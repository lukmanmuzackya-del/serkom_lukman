/** Field ganti password untuk form profil admin / pembeli */
export default function ProfilePasswordFields({ values, onChange }) {
  return (
    <div className="border-top pt-3 mt-3">
      <h3 className="h6 fw-semibold mb-3">Ganti kata sandi (opsional)</h3>
      <div className="row g-3">
        <div className="col-md-4">
          <label className="form-label">Kata sandi lama</label>
          <input
            type="password"
            className="form-control"
            value={values.passwd_lama || ''}
            onChange={(e) => onChange('passwd_lama', e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Kata sandi baru</label>
          <input
            type="password"
            className="form-control"
            value={values.passwd_baru || ''}
            onChange={(e) => onChange('passwd_baru', e.target.value)}
            autoComplete="new-password"
            minLength={6}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Konfirmasi kata sandi baru</label>
          <input
            type="password"
            className="form-control"
            value={values.passwd_baru_konfirmasi || ''}
            onChange={(e) => onChange('passwd_baru_konfirmasi', e.target.value)}
            autoComplete="new-password"
            minLength={6}
          />
        </div>
      </div>
      <p className="form-text mb-0">Kosongkan jika tidak ingin mengubah kata sandi. Minimal 6 karakter.</p>
    </div>
  );
}
