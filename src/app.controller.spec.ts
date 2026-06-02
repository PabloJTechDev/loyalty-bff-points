import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(() => {
    const appService = {
      getHealth: jest.fn().mockReturnValue({
        status: 'ok',
        service: 'bff-customer',
      }),
      getReadiness: jest.fn().mockResolvedValue({ status: 'ready' }),
    } as unknown as AppService;

    appController = new AppController(appService);
  });

  describe('health', () => {
    it('should return service health', () => {
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        service: 'bff-customer',
      });
    });
  });
});
