/**
 * KATARNOLIMA — pages/detail-berita.js
 * Logika halaman «detail-berita» — modul (Firebase/data).
 */

// @ts-nocheck
import { app } from "../services/firebase.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = getFirestore(app);

async function loadArticleDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const container = document.getElementById('article-container');

    if (!id) {
        container.innerHTML = `
            <div class="state-box">
                <span class="state-icon">⚠️</span>
                <div style="font-weight:800; color:var(--ink-900); margin-bottom:6px;">ID Artikel Tidak Ditemukan</div>
                <p style="margin-bottom:16px;">Silakan pilih berita yang ingin Anda baca melalui halaman daftar berita.</p>
                <a href="javascript:void(0)" onclick="goToBeritaRW()" class="btn-return">Kembali ke Berita RW</a>
            </div>`;
        return;
    }

    try {
        const docRef = doc(db, "berita_rw05", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            container.innerHTML = `
                <div class="state-box">
                    <span class="state-icon">📭</span>
                    <div style="font-weight:800; color:var(--ink-900); margin-bottom:6px;">Artikel Tidak Ditemukan</div>
                    <p style="margin-bottom:16px;">Berita ini mungkin telah dihapus oleh pengurus RW 05.</p>
                    <a href="javascript:void(0)" onclick="goToBeritaRW()" class="btn-return">Kembali ke Berita RW</a>
                </div>`;
            return;
        }

        const d = docSnap.data();
        document.title = `${d.judul || 'Detail Berita'} - KATARNOLIMA RW 05`;

        const imageHtml = d.fotoBase64 
            ? `<div class="article-image-wrap"><img src="${d.fotoBase64}" class="article-image" alt="Dokumentasi Berita"></div>` 
            : '';
        const ikonKat = d.ikon || '🌸';
        const katLabel = d.kategoriLabel || 'Informasi Warga';

        container.innerHTML = `
            <div class="kicker"><span>${ikonKat}</span> <span>${katLabel}</span></div>
            <h1 class="title">${escapeHtml(d.judul || 'Tanpa Judul')}</h1>
            <div class="meta-info">
                <span class="meta-item">📅 ${d.tanggal || '-'}</span>
                ${d.lokasi ? `<span class="meta-item">📍 ${escapeHtml(d.lokasi)}</span>` : ''}
                <span class="meta-item">✍️ ${escapeHtml(d.penulis || 'Pengurus RW 05')}</span>
            </div>
            ${imageHtml}
            <div class="article-content">${escapeHtml(d.isi || 'Tidak ada konten deskripsi.')}</div>

            <div class="action-footer">
                <a href="javascript:void(0)" onclick="goToBeritaRW()" class="btn-return">← Kembali ke Daftar Berita</a>
            </div>
        `;
    } catch (error) {
        console.error("Gagal memuat detail berita:", error);
        container.innerHTML = `
            <div class="state-box">
                <span class="state-icon">❌</span>
                <div style="font-weight:800; color:var(--ink-900); margin-bottom:6px;">Gagal Memuat Berita</div>
                <p style="margin-bottom:16px;">Periksa koneksi internet Anda lalu coba lagi.</p>
                <a href="javascript:void(0)" onclick="goToBeritaRW()" class="btn-return">Kembali ke Berita RW</a>
            </div>`;
    }
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}

document.addEventListener('DOMContentLoaded', loadArticleDetail);
