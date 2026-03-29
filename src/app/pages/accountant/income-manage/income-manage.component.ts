// // import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormsModule } from '@angular/forms';
// // import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
// // import { AccountsService, Income } from '../services/accounts.service';
// // import Swal from '../../../swal';

// // @Component({
// //   selector: 'app-income-manage',
// //   standalone: true,
// //   imports: [CommonModule, FormsModule, BreadcrumbComponent],
// //   templateUrl: './income-manage.component.html',
// //   styleUrl: './income-manage.component.css'
// // })
// // export class IncomeManageComponent implements OnInit {
// //   title = 'Income Management';
// //   incomeList: Income[] = [];
// //   filteredList: Income[] = [];
// //   totalIncome = 0;

// //   // Modal state
// //   showModal = false;
// //   isEditMode = false;
// //   currentIncome: Partial<Income> = {};

// //   // Filters
// //   filterSource = '';
// //   filterCampus = '';
// //   filterDateFrom = '';
// //   filterDateTo = '';

// //   // Dropdown options
// //   sources = ['Fee', 'Donation', 'Misc'];
// //   paymentMethods = ['Cash', 'Bank', 'Cheque', 'Online'];
// //   campuses = ['Main Campus', 'Branch Campus'];

// //   constructor(private accountsService: AccountsService) {}

// //   ngOnInit(): void {
// //     this.loadIncomeList();
// //   }

// //   loadIncomeList(): void {
// //     this.accountsService.getIncomeList().subscribe({
// //       next: (data) => {
// //         this.incomeList = data;
// //         this.applyFilters();
// //       },
// //       error: (err) => {
// //         console.error('Error loading income:', err);
// //         Swal.fire('Error', 'Failed to load income list', 'error');
// //       }
// //     });
// //   }

// //   applyFilters(): void {
// //     this.filteredList = this.incomeList.filter(income => {
// //       const matchSource = !this.filterSource || income.source === this.filterSource;
// //       const matchCampus = !this.filterCampus || income.campus === this.filterCampus;
// //       const matchDateFrom = !this.filterDateFrom || income.date >= this.filterDateFrom;
// //       const matchDateTo = !this.filterDateTo || income.date <= this.filterDateTo;
// //       return matchSource && matchCampus && matchDateFrom && matchDateTo;
// //     });
// //     this.totalIncome = this.filteredList.reduce((sum, i) => sum + i.amount, 0);
// //   }

// //   openAddModal(): void {
// //     this.isEditMode = false;
// //     this.currentIncome = {
// //       date: new Date().toISOString().split('T')[0],
// //       source: 'Fee',
// //       paymentMethod: 'Cash',
// //       campus: 'Main Campus',
// //       receivedBy: 'Admin'
// //     };
// //     this.showModal = true;
// //   }

// //   openEditModal(income: Income): void {
// //     this.isEditMode = true;
// //     this.currentIncome = { ...income };
// //     this.showModal = true;
// //   }

// //   closeModal(): void {
// //     this.showModal = false;
// //     this.currentIncome = {};
// //   }

// //   saveIncome(): void {
// //     if (!this.validateForm()) return;

// //     if (this.isEditMode && this.currentIncome.id) {
// //       this.accountsService.updateIncome(this.currentIncome.id, this.currentIncome).subscribe({
// //         next: () => {
// //           Swal.fire('Success', 'Income updated successfully', 'success');
// //           this.loadIncomeList();
// //           this.closeModal();
// //         },
// //         error: (err) => {
// //           console.error('Error updating income:', err);
// //           Swal.fire('Error', 'Failed to update income', 'error');
// //         }
// //       });
// //     } else {
// //       this.accountsService.addIncome(this.currentIncome).subscribe({
// //         next: () => {
// //           Swal.fire('Success', 'Income added successfully', 'success');
// //           this.loadIncomeList();
// //           this.closeModal();
// //         },
// //         error: (err) => {
// //           console.error('Error adding income:', err);
// //           Swal.fire('Error', 'Failed to add income', 'error');
// //         }
// //       });
// //     }
// //   }

// //   deleteIncome(income: Income): void {
// //     Swal.fire({
// //       title: 'Are you sure?',
// //       text: `Delete income record: ${income.description}?`,
// //       icon: 'warning',
// //       showCancelButton: true,
// //       confirmButtonColor: '#d33',
// //       cancelButtonColor: '#3085d6',
// //       confirmButtonText: 'Yes, delete it!'
// //     }).then((result) => {
// //       if (result.isConfirmed) {
// //         this.accountsService.deleteIncome(income.id).subscribe({
// //           next: () => {
// //             Swal.fire('Deleted!', 'Income record has been deleted.', 'success');
// //             this.loadIncomeList();
// //           },
// //           error: (err) => {
// //             console.error('Error deleting income:', err);
// //             Swal.fire('Error', 'Failed to delete income', 'error');
// //           }
// //         });
// //       }
// //     });
// //   }

// //   validateForm(): boolean {
// //     if (!this.currentIncome.description || !this.currentIncome.amount) {
// //       Swal.fire('Validation Error', 'Please fill all required fields', 'warning');
// //       return false;
// //     }
// //     if (this.currentIncome.amount <= 0) {
// //       Swal.fire('Validation Error', 'Amount must be greater than 0', 'warning');
// //       return false;
// //     }
// //     return true;
// //   }

// //   exportData(): void {
// //     Swal.fire('Export', 'Exporting income data to PDF...', 'success');
// //   }

// //   formatCurrency(amount: number): string {
// //     return new Intl.NumberFormat('en-PK', {
// //       style: 'currency',
// //       currency: 'PKR',
// //       minimumFractionDigits: 0
// //     }).format(amount);
// //   }

// //   getSourceBadgeClass(source: string): string {
// //     const classes: { [key: string]: string } = {
// //       'Fee': 'bg-primary-focus text-primary-600',
// //       'Donation': 'bg-success-focus text-success-600',
// //       'Misc': 'bg-info-focus text-info-600'
// //     };
// //     return `${classes[source] || 'bg-secondary-focus text-secondary-600'} px-12 py-4 radius-4 fw-medium text-sm`;
// //   }
// // }

// import { Component, OnInit } from '@angular/core';
// import { AccountsService, Income } from '../services/accounts.service';
// import Swal from '../../../swal';

// @Component({
//   selector: 'app-income-manage',
//   templateUrl: './income-manage.component.html',
//   styleUrls: ['./income-manage.component.css']
// })
// export class IncomeManageComponent implements OnInit {
//   title = 'Income Management';
//   incomeList: Income[] = [];
//   filteredList: Income[] = [];
//   totalIncome = 0;

//   showModal = false;
//   isEditMode = false;
//   currentIncome: Partial<Income> = {};

//   filterSource = '';
//   filterCampus = '';
//   filterDateFrom = '';
//   filterDateTo = '';

//   sources = ['Fee', 'Donation', 'Misc'];
//   paymentMethods = ['Cash', 'Bank', 'Cheque', 'Online'];
//   campuses = ['Main Campus', 'Branch Campus'];

//   constructor(private accountsService: AccountsService) {}

//   ngOnInit(): void {
//     this.loadIncomeList();
//   }

//   loadIncomeList(): void {
//     this.accountsService.getIncomeList().subscribe({
//       next: (data) => {
//         this.incomeList = data;
//         this.applyFilters();
//       },
//       error: (err) => {
//         console.error(err);
//         Swal.fire('Error', 'Failed to load income list', 'error');
//       }
//     });
//   }

//   applyFilters(): void {
//     this.filteredList = this.incomeList.filter(income => {
//       const matchSource = !this.filterSource || income.source === this.filterSource;
//       const matchCampus = !this.filterCampus || income.campus === this.filterCampus;
//       const matchDateFrom = !this.filterDateFrom || income.date >= this.filterDateFrom;
//       const matchDateTo = !this.filterDateTo || income.date <= this.filterDateTo;
//       return matchSource && matchCampus && matchDateFrom && matchDateTo;
//     });
//     this.totalIncome = this.filteredList.reduce((sum, i) => sum + i.amount, 0);
//   }

//   openAddModal(): void {
//     this.isEditMode = false;
//     this.currentIncome = {
//       date: new Date().toISOString().split('T')[0],
//       source: 'Fee',
//       paymentMethod: 'Cash',
//       campus: 'Main Campus',
//       receivedBy: 'Admin'
//     };
//     this.showModal = true;
//   }

//   openEditModal(income: Income): void {
//     this.isEditMode = true;
//     this.currentIncome = { ...income };
//     this.showModal = true;
//   }

//   closeModal(): void {
//     this.showModal = false;
//     this.currentIncome = {};
//   }

//   saveIncome(): void {
//     if (!this.validateForm()) return;

//     if (this.isEditMode && this.currentIncome.id) {
//       this.accountsService.updateIncome(this.currentIncome.id, this.currentIncome).subscribe({
//         next: () => {
//           Swal.fire('Success', 'Income updated successfully', 'success');
//           this.loadIncomeList();
//           this.closeModal();
//         },
//         error: () => Swal.fire('Error', 'Failed to update income', 'error')
//       });
//     } else {
//       this.accountsService.addIncome(this.currentIncome).subscribe({
//         next: () => {
//           Swal.fire('Success', 'Income added successfully', 'success');
//           this.loadIncomeList();
//           this.closeModal();
//         },
//         error: () => Swal.fire('Error', 'Failed to add income', 'error')
//       });
//     }
//   }

//   deleteIncome(income: Income): void {
//     Swal.fire({
//       title: 'Are you sure?',
//       text: `Delete income record: ${income.description}?`,
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonColor: '#d33',
//       cancelButtonColor: '#3085d6',
//       confirmButtonText: 'Yes, delete it!'
//     }).then(result => {
//       if (result.isConfirmed) {
//         this.accountsService.deleteIncome(income.id).subscribe({
//           next: () => {
//             Swal.fire('Deleted!', 'Income record deleted.', 'success');
//             this.loadIncomeList();
//           },
//           error: () => Swal.fire('Error', 'Failed to delete income', 'error')
//         });
//       }
//     });
//   }

//   validateForm(): boolean {
//     if (!this.currentIncome.description || !this.currentIncome.amount) {
//       Swal.fire('Validation Error', 'Please fill all required fields', 'warning');
//       return false;
//     }
//     if (this.currentIncome.amount <= 0) {
//       Swal.fire('Validation Error', 'Amount must be greater than 0', 'warning');
//       return false;
//     }
//     return true;
//   }

//   exportData(): void {
//     Swal.fire('Export', 'Exporting income data...', 'success');
//   }

//   formatCurrency(amount: number): string {
//     return new Intl.NumberFormat('en-PK', {
//       style: 'currency',
//       currency: 'PKR',
//       minimumFractionDigits: 0
//     }).format(amount);
//   }

//   getSourceBadgeClass(source: string): string {
//     const classes: { [key: string]: string } = {
//       'Fee': 'bg-primary-focus text-primary-600',
//       'Donation': 'bg-success-focus text-success-600',
//       'Misc': 'bg-info-focus text-info-600'
//     };
//     return `${classes[source] || 'bg-secondary-focus text-secondary-600'} px-12 py-4 radius-4 fw-medium text-sm`;
//   }
// }


import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { AccountsService, Income } from '../../../services/accounts.service';
import Swal from '../../../swal';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { AuthService } from '../../../SecurityModels/auth.service';
import { finalize } from 'rxjs';
import { PopupService } from '../../../services/popup.service';

@Component({
  selector: 'app-income-manage',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  templateUrl: './income-manage.component.html',
  styleUrls: ['./income-manage.component.css']
})
export class IncomeManageComponent implements OnInit {
  title = 'Income Management';
  incomeList: Income[] = [];
  filteredList: Income[] = [];
  totalIncome = 0;

  showModal = false;
  isEditMode = false;
  currentIncome: Partial<Income> = {};

  filterSource = '';
  filterDateFrom = '';
  filterDateTo = '';
  sources = ['Fee', 'Donation', 'Misc'];
  paymentMethods = ['Cash', 'Bank', 'Cheque', 'Online'];
  showViewModal = false;
  selectedIncome: Income | null = null;

  // ── Pagination State ──
  currentPage = 1;
  rowsPerPage = 10;
  pageSizeOptions = [5, 10, 25, 50, 100];

  loading = false;
  isProcessing = false;

  constructor(
    private accountsService: AccountsService,
    private authService: AuthService,
    private popup: PopupService
  ) { }

  // ── Helpers ──
  closeFeedback() { }

  ngOnInit(): void {
    this.loadIncomeList();
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  loadIncomeList(): void {
    this.loading = true;
    this.accountsService.getIncomeList().pipe(finalize(() => this.loading = false)).subscribe({
      next: (data) => {
        this.incomeList = data;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error loading income records:', err);
        this.incomeList = [];
        this.applyFilters();
        this.popup.error('Load Error', 'Failed to synchronize income records.');
      }
    });
  }

  applyFilters(): void {
    this.filteredList = this.incomeList.filter(income => {
      const matchSource = !this.filterSource || income.source === this.filterSource;
      const matchDateFrom = !this.filterDateFrom || income.date >= this.filterDateFrom;
      const matchDateTo = !this.filterDateTo || income.date <= this.filterDateTo;
      return matchSource && matchDateFrom && matchDateTo;
    });
    this.totalIncome = this.filteredList.reduce((sum, i) => sum + i.amount, 0);
    this.currentPage = 1; // Reset to first page when filters change
  }

  // ── Pagination Getters ──
  get pagedList(): Income[] {
    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredList.slice(startIndex, startIndex + this.rowsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredList.length / this.rowsPerPage) || 1;
  }

  get pageNumbers(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    return pages;
  }

  get paginationStart(): number {
    return this.filteredList.length === 0 ? 0 : (this.currentPage - 1) * this.rowsPerPage + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.rowsPerPage, this.filteredList.length);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.currentIncome = {
      date: new Date().toISOString().split('T')[0],
      source: 'Fee',
      paymentMethod: 'Cash',
      receivedBy: 'Admin'
    };
    this.showModal = true;
  }

  openEditModal(income: Income): void {
    this.isEditMode = true;
    this.currentIncome = { ...income };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.currentIncome = {};
  }
  openViewModal(income: Income) {
    this.selectedIncome = income; this.showViewModal = true;
  }
  closeViewModal() { this.showViewModal = false; }

  saveIncome(): void {
    if (!this.validateForm()) return;

    this.isProcessing = true;
    this.popup.loading('Saving income record...');

    if (this.isEditMode && this.currentIncome.id) {
      this.accountsService.updateIncome(this.currentIncome.id, this.currentIncome)
        .pipe(finalize(() => {
          this.isProcessing = false;
          this.popup.closeLoading();
        }))
        .subscribe({
          next: () => {
            this.popup.success('Success!', 'Income record updated.');
            this.loadIncomeList();
            this.closeModal();
          },
          error: () => this.popup.error('Update Failed', 'Could not update income record.')
        });
    } else {
      this.accountsService.addIncome(this.currentIncome)
        .pipe(finalize(() => {
          this.isProcessing = false;
          this.popup.closeLoading();
        }))
        .subscribe({
          next: () => {
            this.popup.success('Success!', 'Income record added.');
            this.loadIncomeList();
            this.closeModal();
          },
          error: () => this.popup.error('Save Failed', 'Could not add income record.')
        });
    }
  }

  confirmDelete(income: Income) {
    this.popup.confirm(
      'Are you sure?',
      `Do you want to delete the income record for "${income.description}"?`
    ).then(isConfirmed => {
      if (isConfirmed) {
        this.executeDelete(income.id!);
      }
    });
  }

  executeDelete(id: number) {
    this.isProcessing = true;
    this.popup.loading('Deleting income record...');
    this.accountsService.deleteIncome(id)
      .pipe(finalize(() => {
        this.isProcessing = false;
        this.popup.closeLoading();
      }))
      .subscribe({
        next: () => {
          this.popup.success('Deleted!', 'The record has been removed.');
          this.loadIncomeList();
        },
        error: () => this.popup.error('Delete Failed', 'Failed to delete the record.')
      });
  }

  validateForm(): boolean {
    if (!this.currentIncome.description || !this.currentIncome.amount) {
      this.popup.warning('Validation Required', 'Please fill all mandatory fields.');
      return false;
    }
    if (this.currentIncome.amount <= 0) {
      this.popup.warning('Invalid Amount', 'Amount must be greater than zero.');
      return false;
    }
    return true;
  }

  exportData(): void {
    if (!this.filteredList || this.filteredList.length === 0) {
      this.popup.warning('No Data', 'No records found to export.');
      return;
    }

    this.isProcessing = true;
    this.popup.loading('Extracting income report...');
    setTimeout(() => {
      try {
        const headers = ['ID', 'Date', 'Source', 'Description', 'Campus', 'Payment Method', 'Received By', 'Amount (PKR)'];
        const csvRows = [headers.join(',')];

        this.filteredList.forEach(income => {
          const row = [
            `"${income.id}"`,
            `"${new Date(income.date).toLocaleDateString()}"`,
            `"${income.source || ''}"`,
            `"${income.description || ''}"`,
            `"${income.campus || ''}"`,
            `"${income.paymentMethod || ''}"`,
            `"${income.receivedBy || ''}"`,
            `"${income.amount}"`
          ];
          csvRows.push(row.join(','));
        });

        csvRows.push(`"","","","","","","TOTAL","${this.totalIncome}"`);

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        
        const timestamp = new Date().toISOString().split('T')[0];
        link.setAttribute("download", `Income_Report_${timestamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.popup.closeLoading();
        this.popup.success('Report Ready!', 'Your export is complete.');
      } catch (err) {
        console.error('Export failed:', err);
        this.isProcessing = false;
        this.popup.closeLoading();
        this.popup.error('Export Error', 'Failed to generate report.');
      }
    }, 800);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  getSourceBadgeClass(source: string): string {
    const classes: { [key: string]: string } = {
      'Fee': 'bg-primary-focus text-primary-600',
      'Donation': 'bg-success-focus text-success-600',
      'Misc': 'bg-info-focus text-info-600'
    };
    return `${classes[source] || 'bg-secondary-focus text-secondary-600'} px-12 py-4 radius-4 fw-medium text-sm`;
  }
}


