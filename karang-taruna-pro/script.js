// @ts-nocheck
document.addEventListener('DOMContentLoaded', function() {
  var hamburger = document.querySelector('.hamburger');
  var nav = document.querySelector('nav');
  hamburger.addEventListener('click', function() {
    nav.classList.toggle('mobile-open');
    hamburger.textContent = nav.classList.contains('mobile-open')? '✕' : '☰';
  });
  document.querySelectorAll('nav a').forEach(function(link) {
    link.addEventListener('click', function() {
      nav.classList.remove('mobile-open');
      hamburger.textContent = '☰';
    });
  });
  var modal = document.getElementById('universal-modal');
  var modalTitle = document.getElementById('modal-title');
  var modalBody = document.getElementById('modal-body');
  var modalClose = document.getElementById('modal-close');
  function openModal(title, body) {
    modalTitle.textContent = title;
    modalBody.innerHTML = body;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', function(e) { if(e.target === modal) closeModal(); });
  document.addEventListener('keydown', function(e) { if(e.key === 'Escape') closeModal(); });
  var contents = {
    pengumuman: {
      title: 'Info Iuran Naik - Oktober 2026',
      body: '<div style="display:flex;gap:12px;margin-bottom:16px;"><img src="img/logo-resmi-karang-taruna.jpg" style="width:48px;height:48px;border-radius:50%;background:#000;border:2px solid #fbbf24;padding:2px;"><div><b>KATARNOLIMA RW 05</b><br><span style="font-size:12px;color:#64748b;">Pengumuman Resmi</span></div></div><p style="font-weight:700;">Penyesuaian Iuran Warga</p><p style="font-size:14px;color:#475569;margin-top:8px;line-height:1.6;">Mulai Oktober 2026:<br>Kebersihan: Rp 20.000 jadi <b>Rp 25.000</b><br>Keamanan: Rp 15.000 jadi <b>Rp 20.000</b><br>Total: <b>Rp 45.000 / KK / bulan</b></p><a href="https://wa.me/6289673580756?text=Halo%20Kak%20Arjuna%20tanya%20iuran%20naik" target="_blank" style="margin-top:14px;display:inline-block;background:#090d16;color:white;padding:12px 20px;border-radius:100px;font-weight:700;text-decoration:none;">Tanya Humas WA</a>'
    },
    siskamling: {
      title: 'Jadwal Siskamling - RT01 Senin',
      body: '<p style="font-size:13px;color:#64748b;margin-bottom:12px;">Jadwal jaga malam RW 05</p><div style="display:flex;flex-direction:column;gap:8px;"><div style="padding:12px;background:#fffbeb;border-radius:12px;border:2px solid #fbbf24;display:flex;justify-content:space-between;"><div><b>Senin - RT01</b></div><span style="color:#d97706;font-weight:800;">20:00-04:00</span></div><div style="padding:12px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;display:flex;justify-content:space-between;"><div><b>Selasa - RT02</b></div><span>20:00-04:00</span></div><div style="padding:12px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;display:flex;justify-content:space-between;"><div><b>Rabu - RT03</b></div><span>20:00-04:00</span></div><div style="padding:12px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;display:flex;justify-content:space-between;"><div><b>Kamis - RT04</b></div><span>20:00-04:00</span></div></div>'
    },
    kas: {
      title: 'Laporan Kas - Dikosongkan',
      body: '<div style="text-align:center;padding:16px;"><p style="font-weight:700;">Laporan Kas Dikosongkan Dulu</p><p style="font-size:13px;color:#64748b;margin-top:6px;">Hubungi Bendahara Bang Idam via Humas.</p></div><a href="https://wa.me/6289673580756?text=Tanya%20laporan%20kas%20RW05" target="_blank" style="display:block;text-align:center;background:#090d16;color:white;padding:12px;border-radius:100px;font-weight:700;text-decoration:none;">Hubungi Bendahara</a>'
    },
    agenda1: { title: 'Kerja Bakti 21 Sep', body: '<p>21 Sep 2026 - 07:00 WIB<br>Lapangan RW 05<br><br>Bersih-bersih lingkungan, bawa alat kebersihan.</p><a href="https://wa.me/6289673580756?text=Ikut%20kerja%20bakti%2021%20Sep" target="_blank" style="margin-top:10px;display:inline-block;background:#22c55e;color:white;padding:10px 18px;border-radius:100px;font-weight:700;text-decoration:none;">Ikut</a>' },
    agenda2: { title: 'Rapat Maulid 28 Sep', body: '<p>28 Sep 2026 - 20:00 WIB<br>Balai Warga RW 05<br><br>Rapat persiapan Maulid Nabi dan HUT KATARNOLIMA.</p>' },
    agenda3: { title: 'Santunan Anak Yatim', body: '<p>04 Okt 2026<br>Masjid Al-Huda<br><br>Kolaborasi DKM. Penyaluran santunan.</p>' }
  };
  document.querySelectorAll('[data-modal]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      var key = btn.getAttribute('data-modal');
      if(contents[key]) openModal(contents[key].title, contents[key].body);
    });
  });
});