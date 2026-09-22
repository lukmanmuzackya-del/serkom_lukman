/**
 * Upload gambar ke backend lalu simpan filename ke form.
 * value = nama file / path dari server
 */
import { useState } from 'react';
import { adminApi } from '../../api';
import { mediaUrl } from '../../utils';

/** Ambil path/filename dari berbagai bentuk response upload */
export function extractUploadPath(res) {
  if (!res) return '';
  const d = res.data;
  if (typeof d === 'string' && d.trim()) return d.trim();
  if (d && typeof d === 'object') {
    const fromData =
      d.path || d.filename || d.gambar || d.foto || d.file || d.url || d.name || '';
    if (fromData) return String(fromData);
  }
  const raw = res.raw || {};
  const fromRaw =
    raw.path ||
    raw.filename ||
    raw.gambar ||
    raw.foto ||
    raw.file ||
    raw.url ||
    (raw.data && (raw.data.path || raw.data.filename || raw.data.gambar || raw.data.foto)) ||
    '';
  return fromRaw ? String(fromRaw) : '';
}

export default function ImageUploadField({
  label = 'Gambar',
  value,
  onChange,
  clearable = false,
  uploadFn, // opsional: pakai pembeliApi.uploadGambar dll
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const doUpload = uploadFn || adminApi.uploadGambar;
      const res = await doUpload(file);
      const path = extractUploadPath(res);
      if (!path) {
        setError('Upload berhasil tapi path gambar tidak ditemukan di response server.');
        return;
      }
      onChange(path);
    } catch (err) {
      setError(err.message || 'Upload gagal');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="mb-3">
      <label className="form-label">{label}</label>
      {value ? (
        <div className="d-flex align-items-center gap-3 mb-2">
          <img
            src={mediaUrl(value)}
            alt=""
            className="admin-thumb"
            width={64}
            height={64}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/placeholder.png';
            }}
          />
          <div className="small text-secondary text-break">{value}</div>
          {clearable && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary rounded-0"
              onClick={() => onChange('')}
            >
              Hapus
            </button>
          )}
        </div>
      ) : null}
      <input
        type="file"
        accept="image/*"
        className="form-control"
        onChange={handleFile}
        disabled={uploading}
      />
      {uploading && <div className="form-text">Mengunggah…</div>}
      {error && <div className="text-danger small mt-1">{error}</div>}
    </div>
  );
}
