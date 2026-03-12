/// <reference types="jasmine" />
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AccountsService, Income, Expense } from './accounts.service';

describe('AccountsService', () => {
    let service: AccountsService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [AccountsService]
        });
        service = TestBed.inject(AccountsService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should fetch income list', () => {
        const dummyIncomes: Income[] = [
            { id: 1, date: '2023-01-01', source: 'Fee', description: 'Test', amount: 100, paymentMethod: 'Cash', receivedBy: 'Admin', campus: 'Main', createdAt: '2023' }
        ];

        service.getIncomeList().subscribe(incomes => {
            expect(incomes.length).toBe(1);
            expect(incomes).toEqual(dummyIncomes);
        });

        const req = httpMock.expectOne('https://localhost:7225/api/GeneralIncomes');
        expect(req.request.method).toBe('GET');
        expect(req.request.headers.has('Authorization')).toBeTrue();
        req.flush(dummyIncomes);
    });

    it('should add an expense', () => {
        const newExpense: Partial<Expense> = { description: 'New Bill', amount: 50 };
        const returnedExpense: Expense = {
            id: 1, date: '2023-01-01', expenseType: 'Bill', description: 'New Bill', amount: 50, paymentMethod: 'Cash', paidTo: 'Vendor', approvedBy: 'Admin', campus: 'Main', createdAt: '2023'
        };

        service.addExpense(newExpense).subscribe(expense => {
            expect(expense.amount).toBe(50);
        });

        const req = httpMock.expectOne('https://localhost:7225/api/GeneralExpenses');
        expect(req.request.method).toBe('POST');
        expect(req.request.headers.has('Authorization')).toBeTrue();
        req.flush(returnedExpense);
    });
});
