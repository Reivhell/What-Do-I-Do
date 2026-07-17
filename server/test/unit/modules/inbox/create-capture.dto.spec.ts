import { CreateCaptureDto } from '../../../../src/modules/inbox/dto/create-capture.dto';

describe('CreateCaptureDto', () => {
  it('should create with optional fields undefined', () => {
    const dto = new CreateCaptureDto();
    expect(dto.rawText).toBeUndefined();
    expect(dto.source).toBeUndefined();
    expect(dto.tags).toBeUndefined();
  });

  it('should allow property assignment', () => {
    const dto = new CreateCaptureDto();
    dto.rawText = 'Buy groceries on the way home';
    dto.source = 'manual';
    dto.tags = ['shopping', 'errand'];

    expect(dto.rawText).toBe('Buy groceries on the way home');
    expect(dto.source).toBe('manual');
    expect(dto.tags).toEqual(['shopping', 'errand']);
  });

  it('should allow voice source and empty tags', () => {
    const dto = new CreateCaptureDto();
    dto.rawText = 'Remind me to call dentist';
    dto.source = 'voice';
    dto.tags = [];

    expect(dto.rawText).toBe('Remind me to call dentist');
    expect(dto.source).toBe('voice');
    expect(dto.tags).toEqual([]);
  });

  it('should allow share_intent source without tags', () => {
    const dto = new CreateCaptureDto();
    dto.rawText = 'https://example.com/article';
    dto.source = 'share_intent';

    expect(dto.rawText).toBe('https://example.com/article');
    expect(dto.source).toBe('share_intent');
    expect(dto.tags).toBeUndefined();
  });
});
