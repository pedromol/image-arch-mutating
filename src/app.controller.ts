import { Controller, Post, Body, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AdmissionDto, AdmissionResponseDto } from './adminission.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/health')
  async getHealth(): Promise<void> {
    return Promise.resolve();
  }

  @Post('/mutate')
  async mutate(@Body() body: AdmissionDto): Promise<AdmissionResponseDto> {
    return this.appService.mutate(body);
  }
}
