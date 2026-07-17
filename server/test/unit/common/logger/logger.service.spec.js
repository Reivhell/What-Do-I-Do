"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const logger_service_1 = require("../../../../src/common/logger/logger.service");
const mockPinoLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    flush: jest.fn(),
    child: jest.fn().mockReturnThis(),
    level: 'debug',
};
jest.mock('pino', () => jest.fn(() => mockPinoLogger), { virtual: true });
jest.mock('fs', () => ({
    existsSync: jest.fn(() => true),
    mkdirSync: jest.fn(),
}));
describe('LoggerService', () => {
    let service;
    beforeEach(async () => {
        jest.clearAllMocks();
        const module = await testing_1.Test.createTestingModule({
            providers: [logger_service_1.LoggerService],
        }).compile();
        service = module.get(logger_service_1.LoggerService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    it('should log error', () => {
        service.error('test error', 'TestContext', { key: 'val' });
        expect(mockPinoLogger.error).toHaveBeenCalled();
    });
    it('should log info', () => {
        service.info('test info', 'TestContext');
        expect(mockPinoLogger.info).toHaveBeenCalled();
    });
    it('should log warn', () => {
        service.warn('test warn', 'TestContext');
        expect(mockPinoLogger.warn).toHaveBeenCalled();
    });
});
