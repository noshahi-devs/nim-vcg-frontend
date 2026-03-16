import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CampusService } from '../../../services/campus.service';
import { Campus } from '../../../Models/campus';
import Swal from '../../../swal';

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
        Swal.fire({
            title: 'Saving Campus...',
            text: 'Please wait while we process the request.',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        if (this.isEditMode) {
            this.campusService.updateCampus(this.selectedCampus).subscribe({
                next: () => {
                    Swal.close();
                    Swal.fire({ icon: 'success', title: 'Updated!', timer: 1500, showConfirmButton: false });
                    this.loadCampuses();
                    this.closeModal();
                },
                error: (err) => {
                    Swal.close();
                    console.error('Error updating campus', err);
                    Swal.fire('Error', 'Failed to update campus', 'error');
                }
            });
        } else {
            this.campusService.createCampus(this.selectedCampus).subscribe({
                next: () => {
                    Swal.close();
                    Swal.fire({ icon: 'success', title: 'Saved!', timer: 1500, showConfirmButton: false });
                    this.loadCampuses();
                    this.closeModal();
                },
                error: (err) => {
                    Swal.close();
                    console.error('Error creating campus', err);
                    Swal.fire('Error', 'Failed to create campus', 'error');
                }
            });
        }
    }

    deleteCampus(id: number) {
        Swal.fire({
            title: 'Delete Campus?',
            text: 'Are you sure you want to delete this campus?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Delete',
            confirmButtonColor: '#d33',
            cancelButtonText: 'Cancel'
        }).then(result => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Deleting...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading()
                });
                this.campusService.deleteCampus(id).subscribe({
                    next: () => {
                        Swal.close();
                        Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1500, showConfirmButton: false });
                        this.loadCampuses();
                    },
                    error: (err) => {
                        Swal.close();
                        console.error('Error deleting campus', err);
                        Swal.fire('Error', 'Failed to delete campus', 'error');
                    }
                });
            }
        });
    }
}
