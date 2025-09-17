# Komponen Manajemen Basis Pengetahuan

## Deskripsi
Komponen React untuk mengelola basis pengetahuan (kamus bisnis) aplikasi VizStudio. Menyediakan interface CRUD untuk menambah, melihat, mencari, dan mengelola terminologi bisnis, kata kunci SQL, dan definisi lainnya.

## Features
- ✅ **Tampilan Tabel Responsif** - Menampilkan data basis pengetahuan dalam format tabel
- ✅ **Form Sidebar** - Form slide-in untuk menambah data baru
- ✅ **Pencarian Real-time** - Filter data berdasarkan istilah, deskripsi, atau tipe
- ✅ **Kategori Pengetahuan** - Mendukung berbagai tipe pengetahuan dengan badge warna
- ✅ **Data Dummy** - Pre-loaded dengan contoh data untuk demonstrasi
- ✅ **Responsive Design** - Bekerja di desktop, tablet, dan mobile

## Struktur Komponen

### Props
Komponen ini tidak memerlukan props khusus dan dapat digunakan secara standalone.

### State Management
```javascript
const [showSidebar, setShowSidebar] = useState(false);     // Kontrol sidebar
const [searchTerm, setSearchTerm] = useState('');          // Term pencarian
const [formData, setFormData] = useState({                 // Data form
  type: '',
  term: '',
  description: ''
});
const [knowledgeData, setKnowledgeData] = useState([...]);  // Data tabel
```

### Tipe Pengetahuan yang Didukung
1. **Terminologi Bisnis** - Istilah-istilah bisnis umum
2. **Kata Kunci SQL** - Command dan syntax SQL
3. **Metrik Bisnis** - KPI dan metrics bisnis
4. **Konsep Analitik** - Konsep analisis data
5. **Definisi Data** - Definisi struktur data

## Cara Penggunaan

### 1. Import Komponen
```jsx
import KnowledgeManagement from './component/KnowledgeManagement';
```

### 2. Gunakan dalam App
```jsx
function App() {
  const [currentPage, setCurrentPage] = useState('knowledge');
  
  return (
    <div>
      {currentPage === 'knowledge' && <KnowledgeManagement />}
    </div>
  );
}
```

### 3. Integrasi dengan Router (Opsional)
```jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/knowledge" element={<KnowledgeManagement />} />
      </Routes>
    </Router>
  );
}
```

## Struktur Data

### Format Data Basis Pengetahuan
```javascript
{
  id: 1,                                    // Unique identifier
  type: 'Terminologi Bisnis',              // Tipe pengetahuan
  term: 'ROI (Return on Investment)',      // Istilah/kata kunci
  description: 'Rasio keuntungan atau...'  // Deskripsi lengkap
}
```

### Daftar Tipe Pengetahuan
```javascript
const knowledgeTypes = [
  'Terminologi Bisnis',
  'Kata Kunci SQL', 
  'Metrik Bisnis',
  'Konsep Analitik',
  'Definisi Data'
];
```

## Fungsionalitas

### 1. Menambah Data Baru
- Klik tombol "ADD NEW +"
- Isi form di sidebar yang muncul
- Pilih tipe pengetahuan dari dropdown
- Masukkan istilah dan deskripsi
- Klik "Submit"

### 2. Pencarian Data
- Gunakan kolom pencarian di kanan atas
- Pencarian bekerja pada semua field (tipe, istilah, deskripsi)
- Filter real-time tanpa perlu submit

### 3. Melihat Data
- Data ditampilkan dalam tabel dengan kolom:
  - No (urutan)
  - Tipe Pengetahuan (dengan badge warna)
  - Istilah/Kata Kunci
  - Deskripsi
  - Aksi (menu untuk edit/delete)

## Customization

### 1. Menambah Tipe Pengetahuan Baru
```javascript
const knowledgeTypes = [
  'Terminologi Bisnis',
  'Kata Kunci SQL',
  'Metrik Bisnis',
  'Konsep Analitik',
  'Definisi Data',
  'Tipe Baru Anda'  // Tambahkan di sini
];
```

### 2. Mengubah Warna Badge
Edit CSS untuk menambah style badge baru:
```css
.type-badge.tipe-baru-anda {
  background: #f3e8ff;
  color: #7c3aed;
}
```

### 3. Mengintegrasikan dengan API
```javascript
// Contoh integrasi dengan API backend
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await axios.post('/api/knowledge', formData);
    setKnowledgeData(prev => [...prev, response.data]);
    // ... reset form
  } catch (error) {
    console.error('Error saving knowledge:', error);
  }
};
```

## Dependencies
- **React** (18+)
- **lucide-react** - untuk icons
- **CSS custom** - untuk styling

## File Structure
```
src/component/
├── KnowledgeManagement.jsx      # Komponen utama
├── KnowledgeManagement.css      # Styling
└── KnowledgeManagementDemo.jsx  # Contoh penggunaan
```

## Future Enhancements
- [ ] Implementasi edit data
- [ ] Implementasi delete data
- [ ] Integrasi dengan API backend
- [ ] Export/Import data
- [ ] Bulk operations
- [ ] Advanced filtering
- [ ] Pagination untuk data besar
- [ ] Drag & drop reordering

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+