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

export default SweetAlert;
