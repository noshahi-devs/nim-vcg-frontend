// // import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormsModule } from '@angular/forms';
// // import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
// // import { AccountsService, Income } from '../services/accounts.service';
// // import Swal from 'sweetalert2';

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
// import Swal from 'sweetalert2';

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
import { AccountsService, Income } from '../services/accounts.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

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
  filterCampus = '';
  filterDateFrom = '';
  filterDateTo = '';

  sources = ['Fee', 'Donation', 'Misc'];
  paymentMethods = ['Cash', 'Bank', 'Cheque', 'Online'];
  campuses = ['Main Campus', 'Branch Campus'];

  constructor(private accountsService: AccountsService) {}

  ngOnInit(): void {
    this.loadIncomeList();
  }

  loadIncomeList(): void {
    this.accountsService.getIncomeList().subscribe({
      next: (data) => {
        this.incomeList = data;
        this.applyFilters();
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'Failed to load income list', 'error');
      }
    });
  }

  applyFilters(): void {
    this.filteredList = this.incomeList.filter(income => {
      const matchSource = !this.filterSource || income.source === this.filterSource;
      const matchCampus = !this.filterCampus || income.campus === this.filterCampus;
      const matchDateFrom = !this.filterDateFrom || income.date >= this.filterDateFrom;
      const matchDateTo = !this.filterDateTo || income.date <= this.filterDateTo;
      return matchSource && matchCampus && matchDateFrom && matchDateTo;
    });
    this.totalIncome = this.filteredList.reduce((sum, i) => sum + i.amount, 0);
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.currentIncome = {
      date: new Date().toISOString().split('T')[0],
      source: 'Fee',
      paymentMethod: 'Cash',
      campus: 'Main Campus',
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

  saveIncome(): void {
    if (!this.validateForm()) return;

    if (this.isEditMode && this.currentIncome.id) {
      this.accountsService.updateIncome(this.currentIncome.id, this.currentIncome).subscribe({
        next: () => {
          Swal.fire('Success', 'Income updated successfully', 'success');
          this.loadIncomeList();
          this.closeModal();
        },
        error: () => Swal.fire('Error', 'Failed to update income', 'error')
      });
    } else {
      this.accountsService.addIncome(this.currentIncome).subscribe({
        next: () => {
          Swal.fire('Success', 'Income added successfully', 'success');
          this.loadIncomeList();
          this.closeModal();
        },
        error: () => Swal.fire('Error', 'Failed to add income', 'error')
      });
    }
  }

  deleteIncome(income: Income): void {
    Swal.fire({
      title: 'Are you sure?',
      text: `Delete income record: ${income.description}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then(result => {
      if (result.isConfirmed) {
        this.accountsService.deleteIncome(income.id).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Income record deleted.', 'success');
            this.loadIncomeList();
          },
          error: () => Swal.fire('Error', 'Failed to delete income', 'error')
        });
      }
    });
  }

  validateForm(): boolean {
    if (!this.currentIncome.description || !this.currentIncome.amount) {
      Swal.fire('Validation Error', 'Please fill all required fields', 'warning');
      return false;
    }
    if (this.currentIncome.amount <= 0) {
      Swal.fire('Validation Error', 'Amount must be greater than 0', 'warning');
      return false;
    }
    return true;
  }

  exportData(): void {
    Swal.fire('Export', 'Exporting income data...', 'success');
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
