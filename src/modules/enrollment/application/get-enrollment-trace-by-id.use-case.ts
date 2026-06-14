import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { ENROLLMENT_REPOSITORY } from '../domain/ports/enrollment.repository'
import type {
  IEnrollmentRepository,
  EnrollmentTraceDetailsDto,
} from '../domain/ports/enrollment.repository'

@Injectable()
export class GetEnrollmentTraceByIdUseCase {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY) private readonly enrollment: IEnrollmentRepository,
  ) {}

  async execute(transactionId: string): Promise<EnrollmentTraceDetailsDto> {
    const result = await this.enrollment.getByTransactionId(transactionId)

    if (!result) {
      throw new NotFoundException(
        `Enrollment trace not found for transactionId ${transactionId}`,
      )
    }

    return result
  }
}
