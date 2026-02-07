import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PaymentGatewayService, PaymentGatewaySetting } from './payment-gateway.service';

describe('PaymentGatewayService', () => {
    let service: PaymentGatewayService;
    let httpMock: HttpTestingController;
    const apiUrl = 'https://localhost:7225/api/PaymentGateways';

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [PaymentGatewayService]
        });
        service = TestBed.inject(PaymentGatewayService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should retrieve gateways', () => {
        const dummyGateways: PaymentGatewaySetting[] = [
            { id: 1, gatewayName: 'Stripe', apiKey: 'pk_test', secretKey: 'sk_test', isActive: true, isTestMode: true }
        ];

        service.getGateways().subscribe(gwt => {
            expect(gwt.length).toBe(1);
            expect(gwt).toEqual(dummyGateways);
        });

        const request = httpMock.expectOne(apiUrl);
        expect(request.request.method).toBe('GET');
        request.flush(dummyGateways);
    });

    it('should update gateway', () => {
        const gateway: PaymentGatewaySetting = { id: 1, gatewayName: 'Stripe', apiKey: 'pk_live', secretKey: 'sk_live', isActive: true, isTestMode: false };

        service.updateGateway(1, gateway).subscribe(res => {
            expect(res).toBeNull();
        });

        const request = httpMock.expectOne(`${apiUrl}/1`);
        expect(request.request.method).toBe('PUT');
        request.flush(null);
    });
});
