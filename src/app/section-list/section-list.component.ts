import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

declare var bootstrap: any;

@Component({
  selector: 'app-section-list',
  standalone: true,
  imports: [BreadcrumbComponent, FormsModule, RouterLink, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './section-list.component.html',
  styleUrls: ['./section-list.component.css']
})
export class SectionListComponent implements OnInit, AfterViewInit {
  title = 'Section List';
  searchTerm = '';
  filterClass = '';
  sectionToDelete: any = null;

  classes = ['9', '10', '11', '12'];
  private readonly STORAGE_KEY = 'sectionList';

  sectionList: any[] = [];

  ngOnInit(): void {
    const savedData = this.loadSectionsFromStorage();
    if (savedData && savedData.length > 0) {
      this.sectionList = savedData;
    } else {
      this.saveSectionsToStorage();
      this.sectionList = this.loadSectionsFromStorage() || [];
    }
  }

  loadSectionsFromStorage(): any[] | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  saveSectionsToStorage(): void {
    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify([
        {
          id: 1,
          sectionName: 'Section A - Class 10',
          class: '10',
          section: 'A',
          teacher: 'Sir Ahmed',
          totalStudents: 35,
          roomNo: 'R-101',
          image: 'assets/images/user-grid/user-grid-img2.png'
        },
        {
          id: 2,
          sectionName: 'Section B - Class 10',
          class: '10',
          section: 'B',
          teacher: 'Miss Sana',
          totalStudents: 30,
          roomNo: 'R-102',
          image: 'assets/images/user-grid/user-grid-img3.png'
        },
        {
          id: 3,
          sectionName: 'Section A - Class 9',
          class: '9',
          section: 'A',
          teacher: 'Sir Bilal',
          totalStudents: 28,
          roomNo: 'R-201',
          image: 'assets/images/user-grid/user-grid-img2.png'
        }
      ])
    );
  }

  get filteredSectionList() {
    let list = this.sectionList;
    if (this.filterClass) list = list.filter(s => s.class === this.filterClass);
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      list = list.filter(s =>
        s.sectionName.toLowerCase().includes(search) ||
        s.teacher.toLowerCase().includes(search) ||
        s.roomNo.toLowerCase().includes(search)
      );
    }
    return list;
  }

  confirmDelete(sectionItem: any) {
    this.sectionToDelete = sectionItem;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
  }

  deleteSection() {
    if (this.sectionToDelete) {
      this.sectionList = this.sectionList.filter(s => s.id !== this.sectionToDelete.id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.sectionList));
      this.sectionToDelete = null;
    }
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
    modal.hide();
  }

  ngAfterViewInit() {}
}
