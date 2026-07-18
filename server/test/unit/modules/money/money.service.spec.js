"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const money_service_1 = require("../../../../src/modules/money/money.service");
const drizzle_provider_1 = require("../../../../src/common/database/drizzle.provider");
const setup_1 = require("../../../setup");
jest.mock('../../../../src/common/database/drizzle.provider', () => ({
    DRIZZLE: 'DRIZZLE',
    drizzleProvider: { provide: 'DRIZZLE', useFactory: () => (0, setup_1.getTestDb)() },
}), { virtual: true });
describe('MoneyService', () => {
    let service;
    let db;
    beforeAll(() => { db = (0, setup_1.getTestDb)(); });
    beforeEach(() => { (0, setup_1.resetTestDb)(); });
    it('should be defined', async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [money_service_1.MoneyService, { provide: drizzle_provider_1.DRIZZLE, useValue: db }],
        }).compile();
        service = module.get(money_service_1.MoneyService);
        expect(service).toBeDefined();
    });
});
