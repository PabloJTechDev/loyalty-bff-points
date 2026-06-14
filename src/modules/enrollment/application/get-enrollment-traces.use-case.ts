import { Inject, Injectable } from '@nestjs/common'
import { ENROLLMENT_REPOSITORY } from '../domain/ports/enrollment.repository'
import type {
  IEnrollmentRepository,
  EnrollmentTraceListResponseDto,
} from '../domain/ports/enrollment.repository'

@Injectable()
export class GetEnrollmentTracesUseCase {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY) private readonly enrollment: IEnrollmentRepository,
  ) {}

  execute(): EnrollmentTraceListResponseDto {
    return this.enrollment.list()
  }
}
