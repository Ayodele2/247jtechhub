
import { Controller, Get } from '@nestjs/common';

@Controller('api/v1')
export class AppController {
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: '247-vtu-backend',
    };
  }
}
