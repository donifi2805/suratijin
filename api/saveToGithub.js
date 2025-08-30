// Handler default Vercel untuk serverless function.
export default async function handler(request, response) {
    // --- Langkah Debugging ---
    // Log ini akan muncul di Vercel Logs untuk membantu kita melihat masalahnya.
    console.log("Function 'saveToGithub' dipanggil.");
    
    // Kita akan cek apakah GITHUB_TOKEN ada dan hanya menampilkan beberapa karakter pertamanya
    // demi keamanan, agar tidak mengekspos seluruh token di log.
    if (process.env.GITHUB_TOKEN) {
        console.log("GITHUB_TOKEN ditemukan. Awal token:", process.env.GITHUB_TOKEN.substring(0, 7));
    } else {
        console.error("KRUSIAL: GITHUB_TOKEN tidak ditemukan di Environment Variables!");
    }
    // --- Akhir Langkah Debugging ---


    // 1. Konfigurasi
    const GITHUB_USERNAME = 'donifi2805';
    const GITHUB_REPO = 'suratijin';
    
    // 2. Ambil token dari Vercel Environment Variables
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    // --- Logika Inti ---
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Metode tidak diizinkan. Harap gunakan POST.' });
    }

    // Pindahkan pengecekan ini ke atas agar lebih cepat gagal jika token tidak ada
    if (!GITHUB_TOKEN) {
         return response.status(500).json({ message: 'Kesalahan Server: GITHUB_TOKEN belum diatur atau tidak terbaca oleh deployment ini. Coba redeploy.' });
    }

    try {
        const { fileName, content } = request.body;
        if (!fileName || !content) {
            return response.status(400).json({ message: 'Input tidak valid. `fileName` dan `content` wajib diisi.' });
        }
        
        const contentBase64 = Buffer.from(content).toString('base64');
        const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${fileName}`;

        const payload = {
            message: `[Bot] Menambahkan/Memperbarui file: ${fileName}`,
            content: contentBase64,
            committer: {
                name: 'Generator Dokumen Otomatis',
                email: 'bot@profaskes.id',
            },
        };

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
        if (!githubResponse.ok) {
            const errorMessage = result.message || 'Terjadi kesalahan saat berkomunikasi dengan GitHub API.';
            console.error('GitHub API Error:', result);
            return response.status(githubResponse.status).json({ message: `GitHub Error: ${errorMessage}` });
        }

        return response.status(200).json({ 
            message: 'File berhasil disimpan ke GitHub!',
            fileUrl: result.content.html_url 
        });

    } catch (error) {
        console.error('Internal Server Error:', error);
        return response.status(500).json({ message: error.message || 'Terjadi kesalahan tak terduga di server.' });
    }
}
