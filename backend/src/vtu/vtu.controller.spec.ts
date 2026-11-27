
import { VtuController } from './vtu.controller';
import { VtuService } from './vtu.service';

describe('VtuController', () => {
  let controller: VtuController;

  const vtuServiceMock = {
    purchaseAirtime: jest.fn(),
    purchaseData: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new VtuController(
      vtuServiceMock as unknown as VtuService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
