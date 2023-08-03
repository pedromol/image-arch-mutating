import { Controller, Post, Body } from '@nestjs/common';
import { MutateService } from './mutate.service';
import { AdmissionDto, AdmissionResponseDto } from './dto/mutate.dto';

@Controller()
export class MutateController {
  constructor(private readonly mutateService: MutateService) {}

  @Post('/mutate')
  async mutate(@Body() body: AdmissionDto): Promise<AdmissionResponseDto> {
    return this.mutateService.mutate(body);
  }
}
