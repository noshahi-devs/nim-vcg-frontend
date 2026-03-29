import { Injectable } from '@angular/core';
import SweetAlert from '../swal';

@Injectable({ providedIn: 'root' })
export class PopupService {

  // ─── Success / Saved / Updated / Deleted ──────────────────────────────────────
  success(title = 'Done!', message = '') {
    SweetAlert.fire({
      html: this._buildFeedback('success', title, message),
      ...this._resultOptions('success', 'Got it'),
      timer: 2800,
      timerProgressBar: true,
    });
  }

  saved(entity = 'Record') {
    SweetAlert.fire({
      html: this._buildFeedback('success', `${entity} Saved!`, 'Your changes have been saved successfully.'),
      ...this._resultOptions('success', 'Ok'),
      timer: 2800,
      timerProgressBar: true,
    });
  }

  updated(entity = 'Record') {
    SweetAlert.fire({
      html: this._buildFeedback('success', `${entity} Updated!`, 'Changes applied and saved successfully.'),
      ...this._resultOptions('success', 'Ok'),
      timer: 2800,
      timerProgressBar: true,
    });
  }

  deleted(entity = 'Record') {
    SweetAlert.fire({
      html: this._buildFeedback('success', `${entity} Deleted!`, 'The record has been permanently removed.'),
      ...this._resultOptions('success', 'Ok'),
      timer: 2800,
      timerProgressBar: true,
    });
  }

  // ─── Error ──────────────────────────────────────────────────────────────────
  error(title = 'Something went wrong', message = 'Please try again.') {
    SweetAlert.fire({
      html: this._buildFeedback('error', title, message),
      ...this._resultOptions('error', 'Ok'),
      timer: undefined,
    });
  }

  deleteError(entityName: string, reason?: string) {
    const msg = reason || `Cannot delete because it still has linked records. Please remove those first.`;
    SweetAlert.fire({
      html: this._buildFeedback('error', 'Cannot Delete', msg),
      ...this._resultOptions('error', 'Ok'),
      timer: undefined,
    });
  }

  // ─── Warning (Validation) ───────────────────────────────────────────────────
  warning(message = 'Check your input.', title = 'Form Incomplete') {
    SweetAlert.fire({
      html: this._buildFeedback('warning', title, message),
      ...this._resultOptions('warning', 'Ok'),
      timer: undefined,
    });
  }

  // ─── Confirmation Dialog ───────────────────────────────────────────────────
  confirm(
    title = 'Delete?',
    text = 'This action cannot be undone.',
    confirmText = 'Delete',
    cancelText = 'Cancel',
    type: 'danger' | 'success' | 'warning' | 'info' | 'primary' = 'danger'
  ): Promise<boolean> {
    
    // Default to danger (delete)
    let ringClass = 'danger-ring';
    let mainIcon = 'solar:trash-bin-minimalistic-bold-duotone';
    let btnIcon = 'solar:trash-bin-trash-bold-duotone';
    let confirmBtnClass = 'pm-btn pm-danger';

    if (type === 'primary') {
      ringClass = 'danger-ring'; // Maroon theme
      mainIcon = 'solar:question-square-bold-duotone';
      btnIcon = 'solar:check-circle-bold';
      confirmBtnClass = 'pm-btn pm-danger'; // Maroon button
    } else if (type === 'success') {
      ringClass = 'success-ring';
      mainIcon = 'solar:question-square-bold-duotone';
      btnIcon = 'solar:diskette-bold-duotone';
      confirmBtnClass = 'pm-btn pm-success-btn';
    } else if (type === 'warning') {
      ringClass = 'warning-ring';
      mainIcon = 'solar:shield-warning-bold-duotone';
      btnIcon = 'solar:check-square-bold';
      confirmBtnClass = 'pm-btn pm-warning-btn';
    } else if (type === 'info') {
      ringClass = 'info-ring';
      mainIcon = 'solar:info-circle-bold-duotone';
      btnIcon = 'solar:check-square-bold';
      confirmBtnClass = 'pm-btn pm-success-btn';
    }

    return SweetAlert.fire({
      html: `
        <div class="pm-icon-ring ${ringClass}">
          <iconify-icon icon="${mainIcon}" style="font-size:2.4rem;color:#fff;"></iconify-icon>
        </div>
        <h3 class="pm-title">${title}</h3>
        <p class="pm-subtitle">${text}</p>`,
      showCancelButton: true,
      confirmButtonText: `<iconify-icon icon="${btnIcon}"></iconify-icon> ${confirmText}`,
      cancelButtonText: cancelText,
      reverseButtons: true,
      focusCancel: true,
      buttonsStyling: false,
      customClass: {
        popup: 'pm-modal-popup',
        confirmButton: confirmBtnClass,
        cancelButton: 'pm-btn pm-cancel',
        actions: 'pm-actions',
      },
    }).then(r => r.isConfirmed);
  }

  // ─── Loading ─────────────────────────────────────────────────────────────────
  loading(message = 'Processing request...') {
    SweetAlert.fire({
      html: `
        <div class="nim-loading-wrap">
          <div class="nim-loader-rings">
            <div class="nim-loader-ring r1"></div>
            <div class="nim-loader-ring r2"></div>
            <div class="nim-loader-ring r3"></div>
            <div class="nim-loader-core">
              <iconify-icon icon="solar:settings-bold-duotone" style="font-size:1.8rem;color:#800000;" class="nim-spin-icon"></iconify-icon>
            </div>
          </div>
          <h3 class="pm-title" style="margin-top: 10px; font-size:1.25rem !important; margin-bottom: 0 !important;">${message}</h3>
          <div class="nim-loading-dots">
            <span></span><span></span><span></span>
          </div>
        </div>`,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      showCancelButton: false,
      buttonsStyling: false,
      customClass: {
        popup: 'pm-modal-popup',
      },
    });
  }

  closeLoading() { SweetAlert.close(); }

  // ═══════════════ PRIVATE BUILDERS ════════════════════════════════════════════

  private _resultOptions(type: 'success' | 'error' | 'warning', btnText: string) {
    let btnClass = 'pm-success-btn';
    if (type === 'error') btnClass = 'pm-error-btn';
    if (type === 'warning') btnClass = 'pm-warning-btn';

    return {
      showConfirmButton: true,
      showCancelButton: false,
      allowOutsideClick: true,
      buttonsStyling: false,
      confirmButtonText: `<iconify-icon icon="solar:check-square-bold" style="font-size:1.1rem; vertical-align: middle;"></iconify-icon> <span style="margin-left:4px;">${btnText}</span>`,
      customClass: {
        popup: 'pm-modal-popup',
        timerProgressBar: 'swal2-timer-progress-bar',
        confirmButton: `pm-btn pm-Ok ${btnClass}`,
        actions: 'pm-actions',
      },
    };
  }

  private _buildFeedback(type: 'success' | 'error' | 'warning', title: string, message: string) {
    let icon = 'solar:check-circle-bold-duotone';
    let ringClass = 'success-ring';

    if (type === 'error') {
      icon = 'solar:danger-bold-duotone';
      ringClass = 'danger-ring';
    } else if (type === 'warning') {
      icon = 'solar:shield-warning-bold-duotone'; // Wait, screenshot had exclamation "solar:danger-bold-duotone"
      icon = 'solar:danger-bold-duotone'; // Match screenshot exactly for Form Incomplete
      ringClass = 'warning-ring';
    }

    return `
      <div class="pm-sparkles">
        <span class="pm-sparkle sp1"></span>
        <span class="pm-sparkle sp2"></span>
        <span class="pm-sparkle sp3"></span>
      </div>
      <div class="pm-icon-ring ${ringClass}">
        <iconify-icon icon="${icon}" style="font-size:2.8rem;color:#fff;"></iconify-icon>
      </div>
      <h3 class="pm-title">${title}</h3>
      ${message ? `<p class="pm-subtitle">${message}</p>` : ''}`;
  }
}
