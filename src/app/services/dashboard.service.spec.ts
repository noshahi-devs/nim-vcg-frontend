/// <reference types="jasmine" />
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DashboardService, DashboardStats } from './dashboard.service';

describe('DashboardService', () => {
    let service: DashboardService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [DashboardService]
        });
        service = TestBed.inject(DashboardService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should fetch dashboard stats', () => {
        const dummyStats: DashboardStats = {
            totalStudents: 100,
            totalTeachers: 10,
            totalClasses: 5,
            incomeThisMonth: 5000,
            expenseThisMonth: 2000
        };

        service.getStats().subscribe(stats => {
            expect(stats.totalStudents).toBe(100);
            expect(stats.incomeThisMonth).toBe(5000);
        });

        const req = httpMock.expectOne('https://localhost:7225/api/Dashboard/stats');
        expect(req.request.method).toBe('GET');
        req.flush(dummyStats);
    });
});
