// components/SafeImg.jsx — <img> yang sembunyikan jika gagal load / src kosong
import { mediaUrl } from '../utils';

const EMPTY =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect fill="#f0ebe3" width="100%" height="100%"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9a8b7a" font-family="sans-serif" font-size="16">Tidak ada gambar</text></svg>'
  );

export default function SafeImg({ src, alt, className, style }) {
  const resolved = src ? mediaUrl(src) : EMPTY;
  return (
    <img
      src={resolved}
      alt={alt || ''}
      className={className}
      style={style}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = EMPTY;
      }}
    />
  );
}
