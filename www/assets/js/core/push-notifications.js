/**
 * KATARNOLIMA — core/push-notifications.js (v2)
 * Izin & registrasi notifikasi push (Capacitor di APK, Web Notification di browser).
 * 
 * Fitur baru:
 * - Simpan token FCM ke Firestore di users_profile/{uid}/fcmTokens
 * - Subscribe otomatis ke topik "all-warga"
 * - Admin (yang login via auth-gate) subscribe ke topik "admin-aduan"
 */

document.addEventListener('DOMContentLoaded', function () {

  // Helper: Simpan token FCM ke Firestore
  async function simpanTokenKeFirestore(uid, token) {
    try {
      const { app } = await import('../services/firebase.js');
      const { getFirestore, doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
      const db = getFirestore(app);

      // Update field fcmTokens.{token} dengan timestamp
      await setDoc(doc(db, 'users_profile', uid), {
        fcmTokens: {
          [token]: {
            updatedAt: new Date().toISOString(),
            platform: window.Capacitor ? 'android' : 'web'
          }
        },
        lastSeen: serverTimestamp()
      }, { merge: true });

      console.log('✅ Token FCM tersimpan ke Firestore:', uid);
      return true;
    } catch (err) {
      console.error('❌ Gagal simpan token ke Firestore:', err);
      return false;
    }
  }

  // Helper: Ambil uid dari session / auth
  async function getUid() {
    // Cek admin session dulu
    try {
      const sess = JSON.parse(localStorage.getItem('rw05_admin_session') || 'null');
      if (sess && sess.uid) return sess.uid;
    } catch (e) {}

    // Kalau bukan admin, cek Firebase Auth (user biasa login lewat sini)
    try {
      const { auth } = await import('../services/firebase.js');
      const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
      return await new Promise((resolve) => {
        const unsub = onAuthStateChanged(auth, (user) => {
          unsub();
          resolve(user ? user.uid : null);
        });
        setTimeout(() => { unsub(); resolve(null); }, 3000);
      });
    } catch (e) {
      return null;
    }
  }

  // CATATAN: Subscribe topik FCM akan diimplementasikan via Cloud Function
  // (untuk keamanan, Server Key tidak boleh ada di frontend).
  // Sementara: token disimpan ke Firestore, admin bisa kirim notif via Console.

  // Fungsi utama: minta izin & daftarkan token
  async function mintaIzinNotifikasiAman() {
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.PushNotifications) {
        const push = window.Capacitor.Plugins.PushNotifications;

        // Listener registrasi — dipasang SEKALI saja
        if (!window.__rw05_push_listener_installed) {
          push.addListener('registration', async (token) => {
            console.log('✅ Token FCM Capacitor Android:', token.value);
            localStorage.setItem('rw05_fcm_token', token.value);

            // 1. Simpan ke Firestore
            const uid = await getUid();
            if (uid) {
              await simpanTokenKeFirestore(uid, token.value);
            } else {
              console.warn('⚠️ uid tidak ditemukan, token hanya disimpan di localStorage');
            }

          });

          push.addListener('registrationError', (err) => {
            console.error('❌ Registrasi FCM gagal:', err);
          });

          push.addListener('pushNotificationReceived', (notification) => {
            console.log('📩 Notifikasi Masuk (Foreground):', notification);
          });

          push.addListener('pushNotificationActionPerformed', (action) => {
            console.log('👆 Notifikasi diklik:', action);
            const data = action.notification.data || {};
            if (data.url) {
              window.location.href = data.url;
            }
          });

          window.__rw05_push_listener_installed = true;
        }

        // Minta izin
        let status = await push.checkPermissions();
        if (status.receive !== 'granted') {
          status = await push.requestPermissions();
        }
        if (status.receive === 'granted') {
          await push.register();
        }
      } else if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    } catch (err) {
      console.warn('Izin notifikasi dilewati:', err);
    }
  }

  // Jalankan setelah 1.5 detik (beri waktu app init)
  setTimeout(mintaIzinNotifikasiAman, 1500);
});
