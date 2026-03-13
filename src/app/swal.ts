import Swal from 'sweetalert2/dist/sweetalert2.esm.all.js';

const SweetAlert = Swal.mixin({
  buttonsStyling: false,
  backdrop: 'rgba(15, 23, 42, 0.48)',
  confirmButtonColor: '#486cea',
  cancelButtonColor: '#64748b',
  showClass: {
    popup: 'nim-swal-show'
  },
  hideClass: {
    popup: 'nim-swal-hide'
  },
  customClass: {
    popup: 'nim-swal-popup',
    title: 'nim-swal-title',
    htmlContainer: 'nim-swal-html',
    actions: 'nim-swal-actions',
    confirmButton: 'nim-swal-btn nim-swal-confirm',
    cancelButton: 'nim-swal-btn nim-swal-cancel',
    denyButton: 'nim-swal-btn nim-swal-deny',
    closeButton: 'nim-swal-close'
  }
});

export const ToastSwal = SweetAlert.mixin({
  toast: true,
  position: 'top-end',
  timer: 3200,
  timerProgressBar: true,
  showConfirmButton: false,
  customClass: {
    popup: 'nim-swal-toast',
    title: 'nim-swal-toast-title',
    htmlContainer: 'nim-swal-toast-html'
  }
});

/**
 * Premium Wavy Alert (e.g. Task Fail)
 */
export const WavyAlert = (title: string, message: string, type: 'error' | 'success' | 'warning' = 'error') => {
  const icon = type === 'error' ? 'solar:danger-bold' : (type === 'success' ? 'solar:check-circle-bold' : 'solar:notification-lines-bold');
  const color = type === 'error' ? '#ef4444' : (type === 'success' ? '#10b981' : '#f59e0b');

  return SweetAlert.fire({
    html: `
      <div class="nim-wavy-container">
        <div class="nim-wavy-header" style="background-color: ${color}">
          <div class="nim-wavy-icon-circle" style="box-shadow: 0 10px 25px ${color}33">
            <iconify-icon icon="${icon}" style="color: ${color}"></iconify-icon>
          </div>
        </div>
        <div class="nim-wavy-content">
          <h2 class="nim-wavy-title">${title}</h2>
          <p class="nim-wavy-message">${message}</p>
        </div>
      </div>
    `,
    customClass: {
      popup: 'nim-swal-wavy',
      actions: 'nim-wavy-actions',
      confirmButton: 'nim-wavy-btn nim-wavy-btn-primary',
      cancelButton: 'nim-wavy-btn nim-wavy-btn-secondary'
    },
    buttonsStyling: false,
    showCancelButton: true,
    confirmButtonText: 'Retry',
    cancelButtonText: 'Close',
    reverseButtons: true,
    didOpen: (popup) => {
      // Apply the specific colors to buttons via JS as well if needed to match the 'type'
      const confirmBtn = popup.querySelector('.nim-wavy-btn-primary') as HTMLElement;
      if (confirmBtn) confirmBtn.style.backgroundColor = color;
    }
  });
};

/**
 * Premium Welcome Access Popup (V3)
 */
export const WelcomeAccessPopup = (userName: string, role: string) => {
  return SweetAlert.fire({
    html: `
      <div class="nim-welcome-header">
        <div class="nim-welcome-logo">
          <img src="assets/images/Vision College emblem design.png" alt="Vision College" style="width:100%;height:100%;object-fit:contain;">
        </div>
      </div>
      <div class="nim-welcome-body">
        <div class="nim-welcome-role">
          <iconify-icon icon="solar:shield-user-bold-duotone" style="font-size:14px;"></iconify-icon>
          ${role} Access Granted
        </div>
        <div class="nim-welcome-title">Welcome Back!</div>
        <p class="nim-welcome-subtitle">${userName}</p>
        <div class="nim-welcome-card">
          <p style="color:#6b7280;font-size:13px;margin:0;line-height:1.5;">
            Authenticated to the <strong style="color:#800000;">Vision College System</strong>. Your portal is ready.
          </p>
        </div>
        <button class="nim-welcome-btn swal2-confirm" onclick="Swal.clickConfirm()">
          🚀 Launch Dashboard
        </button>
      </div>
    `,
    customClass: {
      popup: 'nim-welcome-premium',
    },
    showConfirmButton: false,
    showCloseButton: true,
    buttonsStyling: false,
    allowOutsideClick: false,
  });
};

export default SweetAlert;
