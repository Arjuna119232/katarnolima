/**
 * KATARNOLIMA — pages/admin/shared/modal.js
 * Dialog kustom (alert/konfirmasi) bersama seluruh fitur admin.
 * Menyediakan: window.showModal({ title, desc, icon, type: 'alert'|'confirm', onYes })
 */

window.showModal = function({ title = 'Info', desc = '', icon = '📢', type = 'alert', onYes = null }) {
  const modal = document.getElementById('appCustomModal');
  const elTitle = document.getElementById('modalTitle');
  const elDesc = document.getElementById('modalDesc');
  const elIcon = document.getElementById('modalIcon');
  const elBtns = document.getElementById('modalButtons');
  const btnCloseX = document.getElementById('modalCloseX');

  if(!modal) return;
  if(elTitle) elTitle.textContent = title;
  if(elDesc) elDesc.textContent = desc;
  if(elIcon) elIcon.textContent = icon;

  modal.classList.add('show');

  const closeIt = () => { modal.classList.remove('show'); };

  if(btnCloseX) btnCloseX.onclick = closeIt;
  modal.onclick = (e) => { if(e.target === modal) closeIt(); };

  if (type === 'confirm') {
    elBtns.innerHTML = `
      <button class="btn btn-outline" style="flex:1;" id="modalBtnNo">Tidak</button>
      <button class="btn btn-primary" style="flex:1;" id="modalBtnYes">Iya</button>
    `;
    const btnNo = document.getElementById('modalBtnNo');
    const btnYes = document.getElementById('modalBtnYes');
    if(btnNo) btnNo.onclick = closeIt;
    if(btnYes) btnYes.onclick = () => { closeIt(); if(onYes) onYes(); };
  } else {
    elBtns.innerHTML = `<button class="btn btn-primary" style="width:100%;" id="modalBtnOk">OK</button>`;
    const btnOk = document.getElementById('modalBtnOk');
    if(btnOk) btnOk.onclick = closeIt;
  }
};
