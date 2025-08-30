// Pustaka untuk berkomunikasi dengan GitHub API
const { Octokit } = require("@octokit/rest");

// Inisialisasi Octokit dengan token yang akan kita dapatkan dari Vercel Environment Variables
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Fungsi utama yang akan dijalankan Vercel
module.exports = async (req, res) => {
  // Hanya izinkan metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Atur header untuk mengizinkan permintaan dari domain mana pun (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Vercel otomatis menangani permintaan pre-flight OPTIONS
  if (req.method === 'OPTIONS') {
      return res.status(200).end();
  }

  try {
    const { fileName, fileContent } = req.body;

    if (!fileName || !fileContent) {
      return res.status(400).json({ message: 'fileName dan fileContent diperlukan' });
    }

    // Ubah konten menjadi format base64 yang dibutuhkan GitHub API
    const contentEncoded = Buffer.from(fileContent).toString('base64');

    // GANTI DENGAN USERNAME DAN NAMA REPO ANDA
    const REPO_OWNER = 'donifi2805'; 
    const REPO_NAME = 'NAMA_REPOSITORI_PUBLIK_ANDA';
    
    // Lokasi penyimpanan file di dalam repo
    const filePath = `verifications/${fileName}`;

    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: filePath,
      message: `[Otomatis] Menambahkan dokumen verifikasi: ${fileName}`,
      content: contentEncoded,
      committer: {
        name: 'Generator Bot',
        email: 'bot@example.com',
      },
    });

    res.status(200).json({ message: `File berhasil disimpan ke ${filePath}` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan saat menyimpan ke GitHub', error: error.message });
  }
};
```

**Catatan:** Pastikan untuk mengganti `NAMA_PENGGUNA_GITHUB_ANDA` dan `NAMA_REPOSITORI_PUBLIK_ANDA` di dalam kode di atas.

#### Langkah 4: Modifikasi `index.html` Anda

Sekarang, kita perlu memodifikasi frontend Anda untuk menambahkan tombol baru dan logika untuk memanggil Fungsi Serverless.

1.  **Tambahkan Tombol Baru:** Di bawah tombol "Buat Halaman & QR Code", tambahkan tombol ini:

    ```html
    <button type="button" id="saveToGithubBtn" class="w-full mt-2 bg-gray-800 text-white font-bold py-3 px-4 rounded-md hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-300 flex items-center justify-center space-x-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
        <span>Simpan ke GitHub</span>
    </button>
    ```

2.  **Tambahkan JavaScript Baru:** Di dalam tag `<script>` Anda, di bagian `// --- LOGIKA UTAMA APLIKASI GENERATOR ---`, tambahkan kode ini:

    ```javascript
    // ... (di dalam event listener DOMContentLoaded)

    const saveToGithubBtn = document.getElementById('saveToGithubBtn');

    // Fungsi untuk menyimpan file ke GitHub via Serverless Function
    async function saveFileToGithub() {
        // Ambil data dari form
        const formData = new FormData(form);
        const fileName = formData.get('fileName').trim();
        const data = {
            fileName: fileName,
            documentId: formData.get('documentId').trim(),
            letterNumber: formData.get('letterNumber').trim(),
            letterDate: formatDate(formData.get('letterDate')),
            creationTimestamp: formatDateTime(formData.get('creationTimestamp')),
            signerName: formData.get('signerName').trim(),
        };

        if (!fileName) {
            showNotification('Nama File HTML tidak boleh kosong!');
            return;
        }

        // Dapatkan konten HTML lengkap
        const generatedHtml = getHtmlTemplate(data);
        
        // Ubah state tombol menjadi loading
        saveToGithubBtn.disabled = true;
        saveToGithubBtn.innerHTML = `
            <svg class="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Menyimpan...`;

        try {
            // Panggil Fungsi Serverless kita
            const response = await fetch('/api/saveToGithub', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fileName: fileName,
                    fileContent: generatedHtml,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Gagal menyimpan file.');
            }
            
            showNotification(`Sukses! File disimpan ke GitHub.`, 'success');

        } catch (error) {
            console.error('Error saat menyimpan ke GitHub:', error);
            showNotification(error.message, 'error');
        } finally {
            // Kembalikan state tombol ke semula
            saveToGithubBtn.disabled = false;
            saveToGithubBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                <span>Simpan ke GitHub</span>`;
        }
    }
    
    // Tambahkan event listener ke tombol baru
    saveToGithubBtn.addEventListener('click', saveFileToGithub);
    
    // Modifikasi fungsi showNotification agar bisa menampilkan pesan sukses
    function showNotification(message, type = 'error') {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        notification.className = `fixed top-5 right-5 ${bgColor} text-white py-2 px-4 rounded-lg shadow-lg transition-transform transform translate-x-full`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animasi masuk
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 10);
        
        // Hilangkan setelah beberapa detik
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
