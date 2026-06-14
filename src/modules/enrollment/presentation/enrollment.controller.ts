import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { RegisterEnrollmentUseCase } from '../application/register-enrollment.use-case'
import { GetEnrollmentTracesUseCase } from '../application/get-enrollment-traces.use-case'
import { GetEnrollmentTraceByIdUseCase } from '../application/get-enrollment-trace-by-id.use-case'
import type { EnrollmentInput } from '../domain/ports/enrollment.repository'

@Controller('v1/customer')
export class EnrollmentController {
  constructor(
    private readonly registerEnrollment: RegisterEnrollmentUseCase,
    private readonly getEnrollmentTraces: GetEnrollmentTracesUseCase,
    private readonly getEnrollmentTraceById: GetEnrollmentTraceByIdUseCase,
  ) {}

  @Post('enrollment')
  register(@Body() body: EnrollmentInput) {
    return this.registerEnrollment.execute(body)
  }

  @Get('enrollment-traces')
  list() {
    return this.getEnrollmentTraces.execute()
  }

  @Get('enrollment-traces/:transactionId')
  getById(@Param('transactionId') transactionId: string) {
    return this.getEnrollmentTraceById.execute(transactionId)
  }
}
