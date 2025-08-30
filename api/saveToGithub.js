// Handler default Vercel untuk serverless function.
// File ini harus ditempatkan di dalam folder /api di proyek Anda.
export default async function handler(request, response) {
    // 1. Konfigurasi (Sesuaikan jika perlu, tapi ini sudah sesuai permintaan Anda)
    const GITHUB_USERNAME = 'donifi2805';
    const GITHUB_REPO = 'suratijin';
    
    // 2. Ambil token dari Vercel Environment Variables (CARA YANG AMAN)
    // Anda HARUS mengatur ini di dasbor Vercel Anda.
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    // --- Logika Inti ---

    // Hanya izinkan request metode POST dari frontend Anda
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Metode tidak diizinkan. Harap gunakan POST.' });
    }

    // Pastikan token sudah diatur di Vercel
    if (!GITHUB_TOKEN) {
         return response.status(500).json({ message: 'Kesalahan Server: GITHUB_TOKEN belum diatur di Environment Variables Vercel.' });
    }

    try {
        const { fileName, content } = request.body;

        // Validasi input dari frontend
        if (!fileName || !content) {
            return response.status(400).json({ message: 'Input tidak valid. `fileName` dan `content` wajib diisi.' });
        }
        
        // GitHub API memerlukan konten dalam format base64
        const contentBase64 = Buffer.from(content).toString('base64');

        // URL endpoint API GitHub untuk membuat/memperbarui file
        const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${fileName}`;

        // Data yang akan dikirim ke GitHub API
        const payload = {
            message: `[Bot] Menambahkan/Memperbarui file: ${fileName}`, // Pesan commit
            content: contentBase64,
            committer: {
                name: 'Generator Dokumen Otomatis',
                email: 'bot@profaskes.id',
            },
        };

        // Lakukan request ke GitHub API menggunakan token yang aman
        const githubResponse = await fetch(GITHUB_API_URL, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Vercel-Serverless-Function'
            },
            body: JSON.stringify(payload),
        });

        const result = await githubResponse.json();

        // Jika GitHub mengembalikan error
        if (!githubResponse.ok) {
            // Memberikan pesan error yang lebih spesifik
            const errorMessage = result.message || 'Terjadi kesalahan saat berkomunikasi dengan GitHub API.';
            console.error('GitHub API Error:', result);
            return response.status(githubResponse.status).json({ message: `GitHub Error: ${errorMessage}` });
        }

        // Jika berhasil, kirim kembali respons sukses ke frontend
        return response.status(200).json({ 
            message: 'File berhasil disimpan ke GitHub!',
            fileUrl: result.content.html_url // URL file yang baru dibuat di GitHub
        });

    } catch (error) {
        console.error('Internal Server Error:', error);
        return response.status(500).json({ message: error.message || 'Terjadi kesalahan tak terduga di server.' });
    }
}

