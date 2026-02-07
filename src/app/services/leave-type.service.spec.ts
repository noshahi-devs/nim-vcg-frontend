import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LeaveTypeService, LeaveTypeMaster } from './leave-type.service';

describe('LeaveTypeService', () => {
    let service: LeaveTypeService;
    let httpMock: HttpTestingController;
    const apiUrl = 'https://localhost:7225/api/LeaveTypes';

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [LeaveTypeService]
        });
        service = TestBed.inject(LeaveTypeService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify(); // Ensure no open requests are pending
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should retrieve leave types via GET', () => {
        const dummyLeaveTypes: LeaveTypeMaster[] = [
            { leaveTypeMasterId: 1, leaveTypeName: 'Sick', description: 'Sick leave', maxDaysAllowed: 10, isPaid: true, isActive: true },
            { leaveTypeMasterId: 2, leaveTypeName: 'Casual', description: 'Casual leave', maxDaysAllowed: 12, isPaid: true, isActive: true }
        ];

        service.getLeaveTypes().subscribe(types => {
            expect(types.length).toBe(2);
            expect(types).toEqual(dummyLeaveTypes);
        });

        const request = httpMock.expectOne(apiUrl);
        expect(request.request.method).toBe('GET');
        request.flush(dummyLeaveTypes);
    });

    it('should retrieve a single leave type via GET', () => {
        const dummyLeaveType: LeaveTypeMaster = { leaveTypeMasterId: 1, leaveTypeName: 'Sick', description: 'Sick leave', maxDaysAllowed: 10, isPaid: true, isActive: true };

        service.getLeaveType(1).subscribe(type => {
            expect(type).toEqual(dummyLeaveType);
        });

        const request = httpMock.expectOne(`${apiUrl}/1`);
        expect(request.request.method).toBe('GET');
        request.flush(dummyLeaveType);
    });

    it('should create a leave type via POST', () => {
        const newLeaveType: LeaveTypeMaster = { leaveTypeMasterId: 3, leaveTypeName: 'Annual', description: 'Annual leave', maxDaysAllowed: 20, isPaid: true, isActive: true };

        service.createLeaveType(newLeaveType).subscribe(type => {
            expect(type).toEqual(newLeaveType);
        });

        const request = httpMock.expectOne(apiUrl);
        expect(request.request.method).toBe('POST');
        expect(request.request.body).toEqual(newLeaveType);
        request.flush(newLeaveType);
    });

    it('should update a leave type via PUT', () => {
        const updatedLeaveType: LeaveTypeMaster = { leaveTypeMasterId: 1, leaveTypeName: 'Sick', description: 'Updated Sick leave', maxDaysAllowed: 15, isPaid: true, isActive: true };

        service.updateLeaveType(1, updatedLeaveType).subscribe(() => {
            // Expect no value, just completion
        });

        const request = httpMock.expectOne(`${apiUrl}/1`);
        expect(request.request.method).toBe('PUT');
        expect(request.request.body).toEqual(updatedLeaveType);
        request.flush(null); // No content
    });

    it('should delete a leave type via DELETE', () => {
        service.deleteLeaveType(1).subscribe(() => {
            // Expect no value, just completion
        });

        const request = httpMock.expectOne(`${apiUrl}/1`);
        expect(request.request.method).toBe('DELETE');
        request.flush(null); // No content
    });
});
