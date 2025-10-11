import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {

  @Get('health')
  healthcheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: '[rosreestr-extracts] api-gateway service',
    };
  }
}
