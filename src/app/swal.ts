import Swal from 'sweetalert2/dist/sweetalert2.esm.all.js';

const SweetAlert = Swal.mixin({
  buttonsStyling: false,
  backdrop: 'rgba(15, 23, 42, 0.48)',
  confirmButtonColor: '#F4C430',
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
 * Premium Wavy Alert (e.g. Task Fail) - Enhanced Outstanding Version
 */
export const WavyAlert = (title: string, message: string, type: 'error' | 'success' | 'warning' = 'error') => {
  const icon = type === 'error' ? 'solar:danger-bold' : (type === 'success' ? 'solar:check-circle-bold' : 'solar:notification-lines-bold');
  const color = type === 'error' ? '#800000' : (type === 'success' ? '#10b981' : '#f59e0b');
  const lightColor = type === 'error' ? '#a52a2a' : (type === 'success' ? '#34d399' : '#fbbf24');

  return SweetAlert.fire({
    html: `
      <div class="nim-wavy-container-enhanced">
        <div class="nim-wavy-header-enhanced" style="background: linear-gradient(135deg, ${color} 0%, ${lightColor} 100%)">
          <div class="nim-wavy-particles"></div>
          <div class="nim-wavy-icon-circle-enhanced" style="box-shadow: 0 15px 35px ${color}40, 0 0 0 3px ${color}20">
            <iconify-icon icon="${icon}" style="color: ${color}"></iconify-icon>
          </div>
          <div class="nim-wavy-shimmer"></div>
        </div>
        <div class="nim-wavy-content-enhanced">
          <h2 class="nim-wavy-title-enhanced">${title}</h2>
          <p class="nim-wavy-message-enhanced">${message}</p>
          <div class="nim-wavy-status-indicator">
            <div class="status-dot" style="background: ${color}"></div>
            <span style="color: ${color}">Authentication Required</span>
          </div>
        </div>
      </div>
    `,
    customClass: {
      popup: 'nim-swal-wavy-enhanced',
      actions: 'nim-wavy-actions-enhanced',
      confirmButton: 'nim-wavy-btn nim-wavy-btn-primary-enhanced',
      cancelButton: 'nim-wavy-btn nim-wavy-btn-secondary-enhanced'
    },
    buttonsStyling: false,
    showConfirmButton: true,
    showCancelButton: true,
    confirmButtonText: '🔄 Retry',
    cancelButtonText: '✖ Close',
    reverseButtons: true, // Puts Retry on the right, Close on the left in some environments, but flex order determines it.
    allowOutsideClick: false,
    allowEscapeKey: true,
    timer: 5000,
    timerProgressBar: true,
    didOpen: (popup) => {
      // Apply dynamic colors to native confirm button
      const retryBtn = SweetAlert.getConfirmButton();
      if (retryBtn) {
        const btnBgFrom = type === 'error' ? '#F4C430' : color;
        const btnBgTo = type === 'error' ? '#FDE68A' : lightColor;
        const btnShadow = type === 'error' ? 'rgba(244, 196, 48, 0.4)' : `${color}40`;

        retryBtn.style.background = `linear-gradient(135deg, ${btnBgFrom} 0%, ${btnBgTo} 100%)`;
        retryBtn.style.color = type === 'error' ? '#800000' : '#fff';
        retryBtn.style.textShadow = type === 'error' ? 'none' : '0 1px 2px rgba(0,0,0,0.2)';
        retryBtn.style.boxShadow = `0 8px 25px ${btnShadow}`;
      }

      // Apply dynamic colors to native cancel button
      const closeBtn = SweetAlert.getCancelButton();
      if (closeBtn) {
        closeBtn.style.color = '#800000';
        closeBtn.style.borderColor = '#800000';
      }

      // Add entrance animations
      popup.classList.add('nim-wavy-entrance');
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
      </div>
    `,
    customClass: {
      popup: 'nim-welcome-premium',
      confirmButton: 'nim-welcome-btn',
      actions: 'nim-welcome-actions'
    },
    showConfirmButton: true,
    confirmButtonText: '🚀 Launch Dashboard',
    showCloseButton: true,
    buttonsStyling: false,
    allowOutsideClick: false,
    returnFocus: false,
    focusConfirm: false,
    timer: 6000,
    timerProgressBar: true
  });
};

export default SweetAlert;
