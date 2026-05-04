import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExamScheduleService } from '../../../services/exam-schedule.service';
import { ExamScheduleVm } from '../../../Models/exam-schedule-vm';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { AuthService } from '../../../SecurityModels/auth.service';
import { finalize } from 'rxjs';
import { PopupService } from '../../../services/popup.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DatePipe } from '@angular/common';
import { SettingsService } from '../../../services/settings.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-exam-schedule',
  standalone: true,
  templateUrl: './exam-schedule.component.html',
  styleUrls: ['./exam-schedule.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BreadcrumbComponent],
  providers: [DatePipe]
})
export class ExamScheduleComponent implements OnInit {
  title = "Exam Schedule";

  examSchedules: ExamScheduleVm[] = [];
  filteredExamSchedules: ExamScheduleVm[] = [];
  paginatedExamSchedules: ExamScheduleVm[] = [];
  years: string[] = [];

  rowsPerPage = 10;
  currentPage = 1;
  totalPages = 1;
  searchTerm = "";
  yearFilter = "";
  loading = false;

  form!: FormGroup;
  showAddEditDialog = false;
  showViewDialog = false;
  isEditMode = false;
  selectedSchedule: ExamScheduleVm | null = null;
  public Math: any = Math;
  today: Date = new Date();
  schoolInfo: any = {};
  apiBaseUrl = environment.apiBaseUrl;


  isProcessing = false;
  scheduleToDelete: ExamScheduleVm | null = null;

  constructor(
    private service: ExamScheduleService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef,
    private datePipe: DatePipe,
    private settingsService: SettingsService,
    private popup: PopupService
  ) { }

  ngOnInit(): void { this.initForm(); this.loadExamSchedules(); this.loadSchoolInfo(); }

  // Modals handled by PopupService

  initForm() {
    this.form = new FormGroup({
      examScheduleId: new FormControl(0),
      examScheduleName: new FormControl('', Validators.required),
      startDate: new FormControl('', Validators.required),
      endDate: new FormControl('', Validators.required),
      examYear: new FormControl('', Validators.required)
    });
  }

  loadExamSchedules() {
    this.loading = true;
    this.service.GetExamSchedules()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res) => { 
          this.examSchedules = res || []; 
          this.extractYears();
          this.filteredExamSchedules = [...this.examSchedules]; 
          this.updatePagination(); 
        },
        error: (err) => { console.error(err); this.examSchedules = []; this.filteredExamSchedules = []; this.updatePagination(); }
      });
  }

  loadSchoolInfo(): void {
    this.settingsService.getSchoolInfo().subscribe(info => {
      this.schoolInfo = info;
    });
  }

  getSchoolLogo(): string {
    if (this.schoolInfo && this.schoolInfo.logoUrl) {
      if (this.schoolInfo.logoUrl.startsWith('http')) return this.schoolInfo.logoUrl;
      return `${this.apiBaseUrl}/${this.schoolInfo.logoUrl}`;
    }
    return window.location.origin + '/assets/img/vision_logo.png';
  }

  extractYears() {
    const yearSet = new Set<string>();
    this.examSchedules.forEach(sch => {
      if (sch.examYear) yearSet.add(sch.examYear.toString());
    });
    this.years = Array.from(yearSet).sort((a, b) => b.localeCompare(a));
  }

  searchExamSchedules() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.examSchedules];

    // Search filter
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(sch => 
        sch.examScheduleName?.toLowerCase().includes(term) ||
        sch.examYear?.toString().toLowerCase().includes(term)
      );
    }

    // Year filter
    if (this.yearFilter && this.yearFilter !== '') {
      filtered = filtered.filter(sch => sch.examYear?.toString() === this.yearFilter);
    }

    this.filteredExamSchedules = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExamSchedules.length / this.rowsPerPage) || 1;
    const start = (this.currentPage - 1) * this.rowsPerPage;
    this.paginatedExamSchedules = this.filteredExamSchedules.slice(start, start + this.rowsPerPage);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page; this.updatePagination();
  }

  openAddDialog() {
    this.isEditMode = false;
    this.form.reset({ examScheduleId: 0, examYear: new Date().getFullYear().toString() });
    this.showAddEditDialog = true;
  }

  openEditDialog(schedule: ExamScheduleVm) {
    this.isEditMode = true;
    this.form.patchValue({
      ...schedule,
      startDate: schedule.startDate ? new Date(schedule.startDate).toISOString().split('T')[0] : '',
      endDate: schedule.endDate ? new Date(schedule.endDate).toISOString().split('T')[0] : ''
    });
    this.showAddEditDialog = true;
  }

  openViewDialog(schedule: ExamScheduleVm) { this.selectedSchedule = schedule; this.showViewDialog = true; }

  saveExamSchedule() {
    if (this.form.invalid) { this.popup.error('Error', 'Please fill all required fields'); return; }
    const payload = this.form.value;
    const request = this.isEditMode ? this.service.UpdateExamSchedule(payload) : this.service.SaveExamSchedule(payload);
    this.isProcessing = true;
    this.closeDialog();

    request.pipe(finalize(() => this.isProcessing = false)).subscribe({
      next: () => {
        this.popup.success('Success', `Schedule ${this.isEditMode ? 'updated' : 'saved'} successfully`);
        this.loadExamSchedules();
      },
      error: (err) => { console.error(err); this.popup.error('Error', 'Failed to save schedule'); }
    });
  }

  confirmDelete(schedule: ExamScheduleVm) {
    this.popup.confirm('Delete Schedule?', `Are you sure you want to delete "${schedule.examScheduleName}"?`).then(confirmed => {
      if (confirmed) {
        this.popup.loading('Deleting schedule...');
        this.service.DeleteExamSchedule(schedule.examScheduleId)
          .subscribe({
            next: () => {
              this.popup.deleted('Schedule');
              this.loadExamSchedules();
            },
            error: (err) => {
              console.error(err);
              this.popup.error('Error', 'Failed to delete schedule.');
            }
          });
      }
    });
  }

  getDaysDifference(startDate: any, endDate: any): number {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate); const end = new Date(endDate);
    return Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  printSchedule(schedule: ExamScheduleVm) {
    this.popup.loading('Preparing print view...');
    this.service.GetExamScheduleById(schedule.examScheduleId)
      .pipe(finalize(() => this.popup.closeLoading()))
      .subscribe({
        next: (fullSchedule) => {
          this.executeIframePrint(fullSchedule || schedule);
        },
        error: (err) => {
          console.error(err);
          this.executeIframePrint(schedule);
        }
      });
  }

  private executeIframePrint(sch: ExamScheduleVm) {
    const printWindow = document.createElement('iframe');
    printWindow.style.position = 'fixed';
    printWindow.style.right = '0';
    printWindow.style.bottom = '0';
    printWindow.style.width = '0';
    printWindow.style.height = '0';
    printWindow.style.border = '0';
    document.body.appendChild(printWindow);

    const doc = printWindow.contentWindow?.document;
    if (!doc) return;

    const todayStr = this.datePipe.transform(new Date(), 'dd MMM yyyy hh:mm a') || '';
    const startDateStr = this.datePipe.transform(sch.startDate, 'dd MMM') || 'N/A';
    const endDateStr = this.datePipe.transform(sch.endDate, 'dd MMM yyyy') || 'N/A';

    let standardsHtml = '';
    (sch.examScheduleStandards || []).forEach(std => {
      let subjectsHtml = '';
      (std.examSubjects || []).forEach(ex => {
        subjectsHtml += `
          <tr>
            <td>${this.datePipe.transform(ex.examDate, 'dd-MM-yyyy')}</td>
            <td><strong>${this.datePipe.transform(ex.examDate, 'EEEE')}</strong></td>
            <td><strong>${ex.subjectName}</strong><br><small>${ex.examTypeName}</small></td>
            <td style="font-family: monospace;">${ex.examStartTime} - ${ex.examEndTime}</td>
          </tr>
        `;
      });

      standardsHtml += `
        <div style="margin-bottom: 40px; break-inside: avoid;">
          <h3 style="border-left: 5px solid var(--primary-color); padding-left: 10px; text-transform: uppercase;">Class: ${std.standardName}</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="border: 1px solid #cbd5e1; padding: 10px; text-align: left;">Date</th>
                <th style="border: 1px solid #cbd5e1; padding: 10px; text-align: left;">Day</th>
                <th style="border: 1px solid #cbd5e1; padding: 10px; text-align: left;">Subject</th>
                <th style="border: 1px solid #cbd5e1; padding: 10px; text-align: left;">Timing</th>
              </tr>
            </thead>
            <tbody>
              ${subjectsHtml || '<tr><td colspan="4" style="text-align:center; padding: 20px;">No subjects scheduled.</td></tr>'}
            </tbody>
          </table>
        </div>
      `;
    });

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Datesheet - ${sch.examScheduleName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #000; padding: 20px; }
            h1 { color: var(--primary-color); margin: 0; font-size: 28px; }
            .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 20px; margin-bottom: 30px; }
            .title-strap { background: #f1f5f9; padding: 15px; text-align: center; border-radius: 8px; margin-bottom: 40px; }
            table td, table th { border: 1px solid #e2e8f0; padding: 10px; font-size: 13px; }
            @page { size: A4 portrait; margin: 15mm; }
            .footer { margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; font-size: 10px; color: #666; text-align: center; }
            .signature-row { display: flex; justify-content: space-around; margin-top: 40px; margin-bottom: 60px; }
            .sig-box { border-bottom: 1.5px solid #000; width: 150px; text-align: center; font-weight: bold; padding-top: 40px; font-size: 12px; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header">
            <div style="margin-bottom: 10px;">
              <img src="${this.getSchoolLogo()}" style="height: 60px; width: auto;">
            </div>
            <h1>${this.schoolInfo.instituteName || 'VISION COLLEGE GOJRA'}</h1>
            <p>${this.schoolInfo.instituteAddress || 'Quality Education for a Brighter Future'}</p>
            <p><strong>Academic Session: ${sch.examYear || 'N/A'}</strong></p>
          </div>
          <div class="title-strap">
            <h2 style="margin:0; font-size: 18px;">EXAMINATION DATESHEET: ${sch.examScheduleName.toUpperCase()}</h2>
            <p style="margin: 5px 0 0; font-size: 12px;">Duration: ${startDateStr} - ${endDateStr}</p>
          </div>
          <div class="content">
            ${standardsHtml || '<p style="text-align:center;">No schedule details available.</p>'}
          </div>
          <div class="signature-row">
            <div class="sig-box">Examination Controller</div>
            <div class="sig-box">Principal Signature</div>
          </div>
          <div class="footer">
            Generated on ${todayStr} | System: Vision College Gojra Enterprise
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Cleanup after print dialog closes
    setTimeout(() => {
      document.body.removeChild(printWindow);
    }, 2000);
  }

  downloadPDF(schedule: ExamScheduleVm) {
    this.popup.loading('Generating PDF...');
    this.service.GetExamScheduleById(schedule.examScheduleId)
      .pipe(finalize(() => this.popup.closeLoading()))
      .subscribe({
        next: (fullSchedule) => {
          this.executeManualPDF(fullSchedule || schedule);
        },
        error: (err) => {
          console.error(err);
          this.executeManualPDF(schedule);
        }
      });
  }

  private executeManualPDF(sch: ExamScheduleVm) {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = this.getSchoolLogo();
    
    img.onload = () => {
      this.generatePDFWithImage(sch, img);
    };

    img.onerror = () => {
      console.warn('Failed to load logo, generating PDF without it.');
      this.generatePDFWithImage(sch, null);
    };
  }

  private generatePDFWithImage(sch: ExamScheduleVm, img: HTMLImageElement | null) {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const todayStr = this.datePipe.transform(new Date(), 'dd MMM yyyy hh:mm a') || '';
      
      let currentY = 20;

      // Add Logo if available
      if (img) {
        doc.addImage(img, 'PNG', 90, 10, 30, 20); // Center logo (105 - 15)
        currentY = 40;
      }

      doc.setFontSize(22);
      doc.setTextColor(128, 0, 0); 
      doc.text(this.schoolInfo.instituteName || 'VISION COLLEGE GOJRA', 105, currentY, { align: 'center' });
      currentY += 10;
      
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text(`DATESHEET: ${sch.examScheduleName.toUpperCase()}`, 105, currentY, { align: 'center' });
      currentY += 10;

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Duration: ${this.datePipe.transform(sch.startDate, 'dd MMM')} - ${this.datePipe.transform(sch.endDate, 'dd MMM yyyy')}`, 105, currentY, { align: 'center' });
      currentY += 15;

      (sch.examScheduleStandards || []).forEach(std => {
        // ... (rest of autotable logic)
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);
        doc.text(`Class: ${std.standardName}`, 15, currentY);
        currentY += 5;

        const subjects = (std.examSubjects || []).map(ex => [
          this.datePipe.transform(ex.examDate, 'dd-MM-yyyy') || '',
          this.datePipe.transform(ex.examDate, 'EEEE') || '',
          ex.subjectName,
          `${ex.examStartTime}-${ex.examEndTime}`
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [['Date', 'Day', 'Subject', 'Timing']],
          body: subjects,
          theme: 'grid',
          headStyles: { fillColor: [128, 0, 0] },
          margin: { left: 15, right: 15 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;

        // Check for page break
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
      });

      // Signature section
      if (currentY > 240) {
        doc.addPage();
        currentY = 30;
      }
      
      doc.setFontSize(10);
      doc.setDrawColor(0);
      doc.line(30, currentY + 20, 80, currentY + 20);
      doc.text('Examination Controller', 55, currentY + 25, { align: 'center' });
      
      doc.line(130, currentY + 20, 180, currentY + 20);
      doc.text('Principal Signature', 155, currentY + 25, { align: 'center' });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Generated on ${todayStr} | System: Vision College Gojra Enterprise`, 105, 285, { align: 'center' });

      // Manual Blob Download
      const blob = doc.output('blob');
      const fileName = `datesheet_${sch.examScheduleName.replace(/\s+/g, '_')}.pdf`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      this.popup.success('Exported!', 'PDF has been downloaded.');
    } catch (err) {
      console.error(err);
      this.popup.error('Error', 'PDF generation failed.');
    }
  }

  closeDialog() { this.showAddEditDialog = false; this.showViewDialog = false; this.selectedSchedule = null; this.form.reset(); }

}
