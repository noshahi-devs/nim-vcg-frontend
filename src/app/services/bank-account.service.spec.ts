import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BankAccountService, BankAccount } from './bank-account.service';

describe('BankAccountService', () => {
    let service: BankAccountService;
    let httpMock: HttpTestingController;
    const apiUrl = 'http://localhost:5257/api/BankAccounts';

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [BankAccountService]
        });
        service = TestBed.inject(BankAccountService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should retrieve bank accounts', () => {
        const dummyAccounts: BankAccount[] = [
            { bankAccountId: 1, accountName: 'Main', accountNumber: '123', bankName: 'HBL', accountType: 'Current', balance: 1000, isActive: true },
            { bankAccountId: 2, accountName: 'Cash', accountNumber: '000', bankName: 'Cash', accountType: 'Cash', balance: 500, isActive: true }
        ];

        service.getBankAccounts().subscribe(accs => {
            expect(accs.length).toBe(2);
            expect(accs).toEqual(dummyAccounts);
        });

        const request = httpMock.expectOne(apiUrl);
        expect(request.request.method).toBe('GET');
        request.flush(dummyAccounts);
    });

    it('should create an account', () => {
        const newAcc: BankAccount = { bankAccountId: 3, accountName: 'New', accountNumber: '999', bankName: 'Meezan', accountType: 'Current', balance: 0, isActive: true };

        service.createBankAccount(newAcc).subscribe(acc => {
            expect(acc).toEqual(newAcc);
        });

        const request = httpMock.expectOne(apiUrl);
        expect(request.request.method).toBe('POST');
        request.flush(newAcc);
    });
});
