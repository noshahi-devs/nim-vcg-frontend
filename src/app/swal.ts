import Swal from 'sweetalert2/dist/sweetalert2.esm.all.js';

const SweetAlert = Swal.mixin({
  buttonsStyling: false,
  backdrop: 'rgba(15, 23, 42, 0.55)',
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
 * Premium Wavy Alert — buttons live inside the custom HTML.
 * Returns Promise<{ isConfirmed: boolean }> resolved when popup is dismissed.
 */
export const WavyAlert = (
  title: string,
  message: string,
  type: 'error' | 'success' | 'warning' = 'error'
): Promise<{ isConfirmed: boolean }> => {
  const icon =
    type === 'error'
      ? 'solar:danger-bold'
      : type === 'success'
        ? 'solar:check-circle-bold'
        : 'solar:notification-lines-bold';
  const color =
    type === 'error' ? 'var(--primary-color)' : type === 'success' ? '#10b981' : '#f59e0b';
  const lightColor =
    type === 'error' ? 'var(--primary-light)' : type === 'success' ? '#34d399' : '#fbbf24';

  return new Promise((resolve) => {
    let settled = false;
    const finish = (confirmed: boolean) => {
      if (!settled) {
        settled = true;
        resolve({ isConfirmed: confirmed });
      }
    };

    Swal.fire({
      html: `
        <div class="nim-wavy-container-enhanced">
          <div class="nim-wavy-header-enhanced"
               style="background: linear-gradient(135deg, ${color} 0%, ${lightColor} 100%)">
            <div class="nim-wavy-particles"></div>
            <div class="nim-wavy-icon-circle-enhanced"
                 style="box-shadow: 0 15px 35px ${color}40, 0 0 0 3px ${color}20">
              <iconify-icon icon="${icon}" style="color:${color}"></iconify-icon>
            </div>
            <div class="nim-wavy-shimmer"></div>
          </div>
          <div class="nim-wavy-content-enhanced">
            <h2 class="nim-wavy-title-enhanced">${title}</h2>
            <p class="nim-wavy-message-enhanced">${message}</p>
            <div class="nim-wavy-status-indicator">
              <div class="status-dot" style="background:${color}"></div>
              <span style="color:${color}">Authentication Required</span>
            </div>
            <div class="nim-wavy-actions-enhanced">
              <button type="button" class="nim-wavy-btn nim-wavy-btn-secondary-enhanced" id="nim-close-btn">
                <iconify-icon icon="solar:close-circle-bold" style="font-size:18px;"></iconify-icon>
                Close
              </button>
              <button type="button" class="nim-wavy-btn nim-wavy-btn-primary-enhanced" id="nim-retry-btn">
                <iconify-icon icon="solar:restart-bold" style="font-size:18px;"></iconify-icon>
                Retry
              </button>
            </div>
          </div>
        </div>
      `,
      customClass: {
        popup: 'nim-swal-wavy-enhanced',
        htmlContainer: 'nim-wavy-html-no-pad'
      },
      buttonsStyling: false,
      showConfirmButton: false,
      showCancelButton: false,
      allowOutsideClick: true,
      allowEscapeKey: true,
      didOpen: (popup) => {
        popup.querySelector('#nim-close-btn')?.addEventListener('click', () => {
          Swal.close();
          finish(false);
        });
        popup.querySelector('#nim-retry-btn')?.addEventListener('click', () => {
          Swal.close();
          finish(true);
        });
      },
      didDestroy: () => {
        // Catches ESC / outside-click dismissals
        finish(false);
      }
    });
  });
};

/**
 * Premium Welcome Access Popup — shown on the dashboard after successful login.
 */
export const WelcomeAccessPopup = (userName: string, role: string) => {
  return SweetAlert.fire({
    html: `
      <div class="nim-welcome-header">
        <div class="nim-welcome-logo">
          <img src="assets/images/Vision College emblem design.png"
               alt="Vision College"
               style="width:100%;height:100%;object-fit:contain;">
        </div>
      </div>
      <div class="nim-welcome-body">
        <div class="nim-welcome-role">
          <iconify-icon icon="solar:shield-user-bold-duotone"
                        style="font-size:14px;"></iconify-icon>
          ${role} Access Granted
        </div>
        <div class="nim-welcome-title">Welcome Back!</div>
        <p class="nim-welcome-subtitle">${userName}</p>
        <div class="nim-welcome-card">
          <p style="color:#6b7280;font-size:13px;margin:0;line-height:1.5;">
            Authenticated to the
            <strong style="color:var(--primary-color);">Vision College System</strong>.
            Your portal is ready.
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
    confirmButtonText: '&#x1F680; Go to Dashboard',
    showCloseButton: true,
    buttonsStyling: false,
    allowOutsideClick: true,
    returnFocus: false,
    focusConfirm: false,
    timer: 5000,
    timerProgressBar: true
  });
};

export default SweetAlert;
