export const SITE = {
  nama_toko: 'Batik Nusantara',
  tagline: 'Warisan Batik Asli Indonesia',
  tentang:
    'Batik Nusantara adalah toko pengrajin batik lokal yang menghadirkan kain batik, kemeja batik, dress batik, dan aksesoris batik berkualitas. Setiap motif dibuat dengan dedikasi untuk melestarikan budaya Indonesia.',
  alamat_toko: 'Jl. Niken Gandini No. 144, Japan, Babadan',
  email_toko: 'batiknusantara@gmail.com',
  tlp_toko: '+62895807426969',
  jam_buka: '09.00',
  jam_tutup: '21.00',
  hari_buka: 'Senin – Minggu',
  link_wa: 'https://wa.me/62895807426969',
  link_ig: 'https://instagram.com/',
  link_fb: 'https://facebook.com/',
  logo: '/logo-batik-icon.svg',
  logo_auth: '/logo-batik.svg',
  logo_auth_white: '/logo-batik-white.svg',
};

/** Konten hero beranda */
export const HERO = {
  badge: 'BATIK TULIS · BATIK CAP · WARISAN NUSANTARA',
  title: 'Batik Nusantara',
  deskripsi:
    'Toko pengrajin batik yang menghadirkan koleksi kain batik, kemeja, dress, dan aksesoris batik asli. Motif klasik hingga kontemporer — elegan, bermakna, siap dipakai setiap hari.',
  cta_koleksi: 'Lihat Koleksi',
  cta_wa: 'WhatsApp',
  gambar: '/hero-batik.jpg',
  gambar_alt: 'Pengrajin batik tulis Nusantara',
};

/** Fitur / keunggulan di beranda */
export const KEUNGGULAN = [
  { icon: 'bi-shield-check', judul: 'Kualitas Pengrajin', deskripsi: 'Batik tulis & cap dari pengrajin berpengalaman.' },
  { icon: 'bi-truck', judul: 'Kirim Cepat', deskripsi: 'JNT Express & JNE ke seluruh Indonesia.' },
  { icon: 'bi-credit-card', judul: 'Bayar Fleksibel', deskripsi: 'Bank Transfer atau COD sesuai kebutuhan.' },
  { icon: 'bi-stars', judul: 'Motif Berwarna', deskripsi: 'Motif klasik hingga modern yang penuh makna.' },
];

export const PUBLIC_NAV = [
  { to: '/', label: 'Beranda', end: true },
  { to: '/toko', label: 'Koleksi', end: false },
  { to: '/artikel', label: 'Artikel', end: false },
];

export const KELAMIN = ['Laki-laki', 'Perempuan'];
export const KATEGORI_PRODUK = ['Kemeja Batik', 'Dress Batik', 'Kain Batik'];
export const METODE_BAYAR = ['Bank Transfer', 'COD'];
/** Rekening tujuan saat bayar Bank Transfer */
export const BANK_OPTIONS = [
  { id: 'BCA', label: 'BCA', norek: '1234567890', atas_nama: 'Batik Nusantara' },
  { id: 'BRI', label: 'BRI', norek: '0987654321', atas_nama: 'Batik Nusantara' },
  { id: 'Mandiri', label: 'Mandiri', norek: '1122334455', atas_nama: 'Batik Nusantara' },
  { id: 'BNI', label: 'BNI', norek: '5566778899', atas_nama: 'Batik Nusantara' },
];
export const SHIPPING = ['JNT Express', 'JNE'];
export const STATUS_PROSES = ['Tertunda', 'Dikemas', 'Dikirim', 'Diterima', 'Selesai', 'Dibatalkan'];
export const STATUS_BAYAR = ['Belum', 'Dibayar'];
