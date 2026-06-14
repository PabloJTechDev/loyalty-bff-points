import { Inject, Injectable } from '@nestjs/common'
import {
  ENROLLMENT_REPOSITORY,
} from '../domain/ports/enrollment.repository'
import type {
  IEnrollmentRepository,
  EnrollmentInput,
  EnrollmentReceiptDto,
} from '../domain/ports/enrollment.repository'

@Injectable()
export class RegisterEnrollmentUseCase {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY) private readonly enrollment: IEnrollmentRepository,
  ) {}

  execute(input: EnrollmentInput): Promise<EnrollmentReceiptDto> {
    return this.enrollment.register(input)
  }
}
