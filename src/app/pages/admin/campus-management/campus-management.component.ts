import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CampusService } from '../../../services/campus.service';
import { Campus } from '../../../Models/campus';
import { PopupService } from '../../../services/popup.service';
import { finalize } from 'rxjs';

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
    isProcessing = false;

    constructor(
        private campusService: CampusService,
        private popup: PopupService
    ) { }

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
        if (!this.selectedCampus.campusName || !this.selectedCampus.campusCode) {
            this.popup.warning('Validation Required', 'Please fill in mandatory fields (Name and Code).');
            return;
        }

        this.isProcessing = true;
        this.popup.loading('Synchronizing campus registry...');

        if (this.isEditMode) {
            this.campusService.updateCampus(this.selectedCampus).pipe(
                finalize(() => {
                    this.isProcessing = false;
                    this.popup.closeLoading();
                })
            ).subscribe({
                next: () => {
                    this.popup.success('Registry Updated!', `Campus "${this.selectedCampus.campusName}" has been updated.`);
                    this.loadCampuses();
                    this.closeModal();
                },
                error: (err) => {
                    console.error('Error updating campus', err);
                    this.popup.error('Update Failed', 'Failed to update campus record.');
                }
            });
        } else {
            this.campusService.createCampus(this.selectedCampus).pipe(
                finalize(() => {
                    this.isProcessing = false;
                    this.popup.closeLoading();
                })
            ).subscribe({
                next: () => {
                    this.popup.success('Registry Saved!', `New campus "${this.selectedCampus.campusName}" has been registered.`);
                    this.loadCampuses();
                    this.closeModal();
                },
                error: (err) => {
                    console.error('Error creating campus', err);
                    this.popup.error('Save Failed', 'Failed to create new campus record.');
                }
            });
        }
    }

    deleteCampus(id: number) {
        const campus = this.campuses.find(c => c.campusId === id);
        const name = campus ? campus.campusName : 'this campus';

        this.popup.confirm('Delete Campus?', `Are you sure you want to remove "${name}" registry?`).then(result => {
            if (result) {
                this.isProcessing = true;
                this.popup.loading('Purging campus registry...');
                this.campusService.deleteCampus(id).pipe(
                    finalize(() => {
                        this.isProcessing = false;
                        this.popup.closeLoading();
                    })
                ).subscribe({
                    next: () => {
                        this.popup.success('Registry Deleted!', 'The campus has been removed from the system.');
                        this.loadCampuses();
                    },
                    error: (err) => {
                        console.error('Error deleting campus', err);
                        this.popup.error('Purge Failed', 'Failed to delete campus registry.');
                    }
                });
            }
        });
    }
}
