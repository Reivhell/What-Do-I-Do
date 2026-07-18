"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const settings_service_1 = require("../../../../src/modules/settings/settings.service");
const drizzle_provider_1 = require("../../../../src/common/database/drizzle.provider");
const setup_1 = require("../../../setup");
jest.mock('../../../../src/common/database/drizzle.provider', () => ({
    DRIZZLE: 'DRIZZLE',
    drizzleProvider: { provide: 'DRIZZLE', useFactory: () => (0, setup_1.getTestDb)() },
}), { virtual: true });
describe('SettingsService', () => {
    let service;
    let db;
    let testUser;
    beforeAll(() => { db = (0, setup_1.getTestDb)(); });
    beforeEach(() => {
        (0, setup_1.resetTestDb)();
        testUser = (0, setup_1.createTestUser)(db);
    });
    it('should be defined', async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [settings_service_1.SettingsService, { provide: drizzle_provider_1.DRIZZLE, useValue: db }],
        }).compile();
        service = module.get(settings_service_1.SettingsService);
        expect(service).toBeDefined();
    });
    it('should get PIN settings (disabled by default)', async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [settings_service_1.SettingsService, { provide: drizzle_provider_1.DRIZZLE, useValue: db }],
        }).compile();
        service = module.get(settings_service_1.SettingsService);
        const settings = await service.getPinSettings(testUser.id);
        expect(settings.enabled).toBe(false);
        expect(settings.autoLockMinutes).toBe(5);
    });
    it('should set and verify PIN', async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [settings_service_1.SettingsService, { provide: drizzle_provider_1.DRIZZLE, useValue: db }],
        }).compile();
        service = module.get(settings_service_1.SettingsService);
        await service.setPin(testUser.id, '1234');
        const valid = await service.verifyPin(testUser.id, '1234');
        expect(valid).toBe(true);
        const invalid = await service.verifyPin(testUser.id, 'wrong');
        expect(invalid).toBe(false);
    });
});
