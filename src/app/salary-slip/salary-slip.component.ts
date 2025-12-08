import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

interface StaffMember {
  id: number;
  staffId: string;
  name: string;
  role: string;
  department: string;
  fixedSalary: number;
}

interface SalaryRecord {
  id: number;
  staffId: string;
  staffName: string;
  role: string;
  month: string;
  date: string;
  fixedSalary: number;
  bonus: number;
  deduction: number;
  netSalary: number;
  status: string;
}

@Component({
  selector: 'app-salary-slip',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './salary-slip.component.html',
  styleUrl: './salary-slip.component.css'
})
export class SalarySlipComponent implements OnInit {
  title = 'Salary Paid Slips';

  // Search
  searchQuery: string = '';
  selectedMonth: string = '';
  
  // Staff List for dropdown
  staffList: StaffMember[] = [];
  filteredStaffList: StaffMember[] = [];
  showDropdown: boolean = false;
  
  // Form Fields (for compatibility with HTML)
  staffId: string = '';
  staffName: string = '';
  staffRole: string = '';
  salaryMonth: string = '';
  salaryDate: string = '';
  fixedSalary: number = 0;
  bonus: number = 0;
  deduction: number = 0;
  searchRecordQuery: string = '';
  
  // Salary Records
  salaryRecords: SalaryRecord[] = [];
  
  // Pagination
  itemsPerPage: number = 9;
  currentPage: number = 1;
  
  // Selected slip for printing
  selectedSlip: SalaryRecord | null = null;

  ngOnInit(): void {
    this.setCurrentMonth();
    this.generateDummyStaff();
    this.loadSalaryRecords();
  }

  setCurrentMonth(): void {
    const today = new Date();
    this.selectedMonth = today.toISOString().substring(0, 7);
    this.salaryMonth = today.toISOString().substring(0, 7);
    this.salaryDate = today.toISOString().split('T')[0];
  }

  generateDummyStaff(): void {
    this.staffList = [
      { id: 1, staffId: 'EMP-0001', name: 'Ali Hassan', role: 'Teacher', department: 'Teaching', fixedSalary: 50000 },
      { id: 2, staffId: 'EMP-0002', name: 'Sara Ahmed', role: 'Principal', department: 'Administration', fixedSalary: 80000 },
      { id: 3, staffId: 'EMP-0003', name: 'Usman Khan', role: 'IT Manager', department: 'IT', fixedSalary: 60000 },
      { id: 4, staffId: 'EMP-0004', name: 'Ayesha Malik', role: 'Accountant', department: 'Accounts', fixedSalary: 45000 },
      { id: 5, staffId: 'EMP-0005', name: 'Bilal Raza', role: 'Teacher', department: 'Teaching', fixedSalary: 48000 },
      { id: 6, staffId: 'EMP-0006', name: 'Fatima Noor', role: 'Librarian', department: 'Library', fixedSalary: 35000 },
      { id: 7, staffId: 'EMP-0007', name: 'Hamza Tariq', role: 'Driver', department: 'Transport', fixedSalary: 30000 },
      { id: 8, staffId: 'EMP-0008', name: 'Zainab Riaz', role: 'Teacher', department: 'Teaching', fixedSalary: 52000 },
      { id: 9, staffId: 'EMP-0009', name: 'Abdullah Iqbal', role: 'Vice Principal', department: 'Administration', fixedSalary: 70000 },
      { id: 10, staffId: 'EMP-0010', name: 'Maryam Khalid', role: 'Teacher', department: 'Teaching', fixedSalary: 49000 }
    ];
  }

  onSearchChange(): void {
    if (this.searchQuery.trim() === '') {
      this.filteredStaffList = [];
      this.showDropdown = false;
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredStaffList = this.staffList.filter(staff =>
      staff.name.toLowerCase().includes(query) ||
      staff.staffId.toLowerCase().includes(query) ||
      staff.role.toLowerCase().includes(query)
    );
    this.showDropdown = this.filteredStaffList.length > 0;
  }

  selectStaff(staff: StaffMember): void {
    this.staffId = staff.staffId;
    this.staffName = staff.name;
    this.staffRole = staff.role;
    this.fixedSalary = staff.fixedSalary;
    this.searchQuery = staff.name;
    this.showDropdown = false;
  }

  get netSalary(): number {
    return this.fixedSalary + this.bonus - this.deduction;
  }

  saveSalary(): void {
    if (!this.staffId || !this.salaryMonth || !this.salaryDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please select a staff member and fill all required fields.',
        confirmButtonColor: '#800020'
      });
      return;
    }

    const newRecord: SalaryRecord = {
      id: this.salaryRecords.length + 1,
      staffId: this.staffId,
      staffName: this.staffName,
      role: this.staffRole,
      month: this.salaryMonth,
      date: this.salaryDate,
      fixedSalary: this.fixedSalary,
      bonus: this.bonus,
      deduction: this.deduction,
      netSalary: this.netSalary,
      status: 'Paid'
    };

    this.salaryRecords.unshift(newRecord);

    Swal.fire({
      icon: 'success',
      title: 'Salary Saved!',
      text: `Salary for ${this.staffName} has been saved successfully.`,
      timer: 2000,
      showConfirmButton: false
    });

    this.resetForm();
  }

  resetForm(): void {
    this.searchQuery = '';
    this.staffId = '';
    this.staffName = '';
    this.staffRole = '';
    this.fixedSalary = 0;
    this.bonus = 0;
    this.deduction = 0;
    this.setCurrentMonth();
  }

  loadSalaryRecords(): void {
    const staffData = [
      { staffId: 'EMP-0001', name: 'Ali Hassan', role: 'Teacher', fixedSalary: 50000 },
      { staffId: 'EMP-0002', name: 'Sara Ahmed', role: 'Principal', fixedSalary: 80000 },
      { staffId: 'EMP-0003', name: 'Usman Khan', role: 'IT Manager', fixedSalary: 60000 },
      { staffId: 'EMP-0004', name: 'Ayesha Malik', role: 'Accountant', fixedSalary: 45000 },
      { staffId: 'EMP-0005', name: 'Bilal Raza', role: 'Teacher', fixedSalary: 48000 },
      { staffId: 'EMP-0006', name: 'Fatima Noor', role: 'Librarian', fixedSalary: 35000 },
      { staffId: 'EMP-0007', name: 'Hamza Tariq', role: 'Driver', fixedSalary: 30000 },
      { staffId: 'EMP-0008', name: 'Zainab Riaz', role: 'Teacher', fixedSalary: 52000 },
      { staffId: 'EMP-0009', name: 'Abdullah Iqbal', role: 'Vice Principal', fixedSalary: 70000 },
      { staffId: 'EMP-0010', name: 'Maryam Khalid', role: 'Teacher', fixedSalary: 49000 }
    ];

    const months = ['2024-11', '2024-10', '2024-09'];
    this.salaryRecords = [];
    
    staffData.forEach((staff, index) => {
      months.forEach((month, mIndex) => {
        const bonus = Math.floor(Math.random() * 5000);
        const deduction = Math.floor(Math.random() * 2000);
        this.salaryRecords.push({
          id: this.salaryRecords.length + 1,
          staffId: staff.staffId,
          staffName: staff.name,
          role: staff.role,
          month: month,
          date: `${month}-${25 - mIndex}`,
          fixedSalary: staff.fixedSalary,
          bonus: bonus,
          deduction: deduction,
          netSalary: staff.fixedSalary + bonus - deduction,
          status: 'Paid'
        });
      });
    });
  }

  get filteredRecords(): SalaryRecord[] {
    // Show cards only when staff is searched
    if (this.searchQuery.trim() === '') {
      return []; // Return empty array when no search query
    }

    const query = this.searchQuery.toLowerCase();
    const filtered = this.salaryRecords.filter(r =>
      r.staffName.toLowerCase().includes(query) ||
      r.staffId.toLowerCase().includes(query) ||
      r.role.toLowerCase().includes(query)
    );

    // Group by staffId and get only the latest record for each staff
    const latestRecords = new Map<string, SalaryRecord>();
    filtered.forEach(record => {
      const existing = latestRecords.get(record.staffId);
      if (!existing || new Date(record.date) > new Date(existing.date)) {
        latestRecords.set(record.staffId, record);
      }
    });

    return Array.from(latestRecords.values());
  }

  get paginatedRecords(): SalaryRecord[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredRecords.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredRecords.length / this.itemsPerPage);
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get paginationStart(): number {
    return this.filteredRecords.length === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get paginationEnd(): number {
    const end = this.currentPage * this.itemsPerPage;
    return end > this.filteredRecords.length ? this.filteredRecords.length : end;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getMonthName(monthStr: string): string {
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  getProfileInitials(name: string): string {
    const names = name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  getStaffSalaryHistory(staffId: string): SalaryRecord[] {
    return this.salaryRecords.filter(r => r.staffId === staffId).sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }

  printDetailedReceipt(slip: SalaryRecord): void {
    this.selectedSlip = slip;
    setTimeout(() => {
      const printContent = document.getElementById('detailed-receipt');
      const originalContent = document.body.innerHTML;
      
      if (printContent) {
        document.body.innerHTML = printContent.innerHTML;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload();
      }
    }, 100);
  }

  printThermalReceipt(slip: SalaryRecord): void {
    this.selectedSlip = slip;
    setTimeout(() => {
      const printContent = document.getElementById('thermal-receipt');
      const originalContent = document.body.innerHTML;
      
      if (printContent) {
        document.body.innerHTML = printContent.innerHTML;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload();
      }
    }, 100);
  }

  deleteSalaryRecord(id: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this salary record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#800020',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.salaryRecords = this.salaryRecords.filter(r => r.id !== id);
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Salary record has been deleted.',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  }

  // Keep old chart code for compatibility
  enrollmentChart;
  areaChart;
  dailyIconBarChart;
  constructor() {
    this.enrollmentChart = this.createChartTwo('#487FFF', "");
    this.areaChart = this.createChart('#FF9F29');
    this.dailyIconBarChart = {
      series: [{
          name: "Sales",
          data: [{
              x: 'Mon',
              y: 20,
          }, {
              x: 'Tue',
              y: 40,
          }, {
              x: 'Wed',
              y: 20,
          }, {
              x: 'Thur',
              y: 30,
          }, {
              x: 'Fri',
              y: 40,
          }, {
              x: 'Sat',
              y: 35,
          }]
      }],
      chart: {
          type: 'bar',
          width: 164,
          height: 80,
          sparkline: {
            enabled: true // Remove whitespace
          },
          toolbar: {
              show: false
          }
      },
      plotOptions: {
          bar: {
              borderRadius: 6,
              horizontal: false,
              columnWidth: 14,
          }
      },
      dataLabels: {
          enabled: false
      },
    states: {
        hover: {
        filter: {
            type: 'none'
            }
        }
    },
      fill: {
          type: 'gradient',
          colors: ['#E3E6E9'], // Set the starting color (top color) here
          gradient: {
              shade: 'light', // Gradient shading type
              type: 'vertical',  // Gradient direction (vertical)
              shadeIntensity: 0.5, // Intensity of the gradient shading
              gradientToColors: ['#E3E6E9'], // Bottom gradient color (with transparency)
              inverseColors: false, // Do not invert colors
              opacityFrom: 1, // Starting opacity
              opacityTo: 1,  // Ending opacity
              stops: [0, 100],
          },
      },
      grid: {
          show: false,
          borderColor: '#D1D5DB',
          strokeDashArray: 1, // Use a number for dashed style
          position: 'back',
      },
      xaxis: {
            labels: {
                show: false // Hide y-axis labels
            },
            type: 'category',
            categories: ['Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat']
      },
      yaxis: {
          labels: {
            show: false,
              formatter: function (value) {
                  return (value / 1000).toFixed(0) + 'k';
              }
          }
      },
      tooltip: {
          y: {
              formatter: function (value) {
                  return value / 1000 + 'k';
              }
          }
      }
    };

  }

  createChartTwo(color1, color2) {
    return {
      series: [{
        name: 'series2',
        data: [20000, 45000, 30000, 50000, 32000, 40000, 30000, 42000, 28000, 34000, 38000, 26000]
      }],
      legend: {
        show: false
      },
      chart: {
        type: 'area',
        width: '100%',
        height: 240,
        toolbar: {
          show: false
        },
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'straight',
        width: 3,
        colors: [color1], // Use two colors for the lines
        lineCap: 'round'
      },
      grid: {
        show: true,
        borderColor: '#D1D5DB',
        strokeDashArray: 1,
        position: 'back',
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        },
        row: {
          colors: undefined,
          opacity: 0.5
        },
        column: {
          colors: undefined,
          opacity: 0.5
        },
        padding: {
          top: -20,
          right: 0,
          bottom: 0,
          left: 0
        },
      },
      fill: {
        type: 'gradient',
        colors: [color1], // Use two colors for the gradient
        // gradient: {
        //     shade: 'light',
        //     type: 'vertical',
        //     shadeIntensity: 0.5,
        //     gradientToColors: [`${color1}`, `${color2}00`], // Bottom gradient colors with transparency
        //     inverseColors: false,
        //     opacityFrom: .6,
        //     opacityTo: 0.3,
        //     stops: [0, 100],
        // },
        gradient: {
          shade: 'light',
          type: 'vertical',
          shadeIntensity: 0.5,
          gradientToColors: [undefined, `${color2}00`], // Apply transparency to both colors
          inverseColors: false,
          opacityFrom: [0.4, 0.4], // Starting opacity for both colors
          opacityTo: [0.1, 0.1], // Ending opacity for both colors
          stops: [0, 100],
        },
      },
      markers: {
        colors: [color1], // Use two colors for the markers
        strokeWidth: 3,
        size: 0,
        hover: {
          size: 10
        }
      },
      xaxis: {
        
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        tooltip: {
          enabled: false
        },
        labels: {
          formatter: function (value) {
            return value;
          },
          style: {
            fontSize: "12px"
          }
        }
      },
      yaxis: {
        labels: {
          // formatter: function (value) {
          //     return "$" + value + "k";
          // },
          style: {
            fontSize: "12px"
          }
        },
      },
      tooltip: {
        x: {
          format: 'dd/MM/yy HH:mm'
        }
      }
    };
  }

   createChart( chartColor) {

    let currentYear = new Date().getFullYear();

    return {
        series: [
            {
                name: 'series1',
                data: [0, 10, 8, 25, 15, 26, 13, 35, 15, 39, 16, 46, 42],
            },
        ],
        chart: {
            type: 'area',
            width: 164,
            height: 72,

            sparkline: {
                enabled: true // Remove whitespace
            },

            toolbar: {
                show: false
            },
            padding: {
                left: 0,
                right: 0,
                top: 0,
                bottom: 0
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth',
            width: 2,
            colors: [chartColor],
            lineCap: 'round'
        },
        grid: {
            show: true,
            borderColor: 'transparent',
            strokeDashArray: 0,
            position: 'back',
            xaxis: {
                lines: {
                    show: false
                }
            },   
            yaxis: {
                lines: {
                    show: false
                }
            },  
            row: {
                colors: undefined,
                opacity: 0.5
            },  
            column: {
                colors: undefined,
                opacity: 0.5
            },  
            padding: {
                top: -3,
                right: 0,
                bottom: 0,
                left: 0
            },  
        },
        fill: {
            type: 'gradient',
            colors: [chartColor], // Set the starting color (top color) here
            gradient: {
                shade: 'light', // Gradient shading type
                type: 'vertical',  // Gradient direction (vertical)
                shadeIntensity: 0.5, // Intensity of the gradient shading
                gradientToColors: [`${chartColor}00`], // Bottom gradient color (with transparency)
                inverseColors: false, // Do not invert colors
                opacityFrom: .8, // Starting opacity
                opacityTo: 0.3,  // Ending opacity
                stops: [0, 100],
            },
        },
        // Customize the circle marker color on hover
        markers: {
            colors: [chartColor],
            strokeWidth: 2,
            size: 0,
            hover: {
            size: 8
            }
        },
        xaxis: {
            labels: {
                show: false
            },
            categories: [`Jan ${currentYear}`, `Feb ${currentYear}`, `Mar ${currentYear}`, `Apr ${currentYear}`, `May ${currentYear}`, `Jun ${currentYear}`, `Jul ${currentYear}`, `Aug ${currentYear}`, `Sep ${currentYear}`, `Oct ${currentYear}`, `Nov ${currentYear}`, `Dec ${currentYear}`],
            tooltip: {
                enabled: false,
            },
        },
        yaxis: {
            labels: {
                show: false
            }
        },
        tooltip: {
            x: {
                format: 'dd/MM/yy HH:mm'
            },
        },
    };
    }


}
