import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CampusService } from '../../../services/campus.service';
import { Campus } from '../../../Models/campus';

@Component({
    selector: 'app-campus-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './campus-management.component.html',
    styleUrl: './campus-management.component.css',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CampusManagementComponent implements OnInit {
    campuses: Campus[] = [];
    selectedCampus: Campus = this.getEmptyCampus();
    isEditMode = false;
    showModal = false;

    constructor(private campusService: CampusService) { }

    ngOnInit(): void {
        this.loadCampuses();
    }

    loadCampuses() {
        this.campusService.getCampuses().subscribe({
            next: (data) => this.campuses = data,
            error: (err) => console.error('Error loading campuses', err)
        });
    }

    getEmptyCampus(): Campus {
        return {
            campusId: 0,
            campusName: '',
            campusCode: '',
            address: '',
            contactNumber: '',
            email: '',
            isActive: true
        };
    }

    openAddModal() {
        this.isEditMode = false;
        this.selectedCampus = this.getEmptyCampus();
        this.showModal = true;
    }

    openEditModal(campus: Campus) {
        this.isEditMode = true;
        this.selectedCampus = { ...campus };
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
    }

    saveCampus() {
        if (this.isEditMode) {
            this.campusService.updateCampus(this.selectedCampus).subscribe({
                next: () => {
                    this.loadCampuses();
                    this.closeModal();
                },
                error: (err) => console.error('Error updating campus', err)
            });
        } else {
            this.campusService.createCampus(this.selectedCampus).subscribe({
                next: () => {
                    this.loadCampuses();
                    this.closeModal();
                },
                error: (err) => console.error('Error creating campus', err)
            });
        }
    }

    deleteCampus(id: number) {
        if (confirm('Are you sure you want to delete this campus?')) {
            this.campusService.deleteCampus(id).subscribe({
                next: () => this.loadCampuses(),
                error: (err) => console.error('Error deleting campus', err)
            });
        }
    }
}
