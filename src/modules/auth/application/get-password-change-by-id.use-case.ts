import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { AUTH_REPOSITORY } from '../domain/ports/auth.repository'
import type {
  IAuthRepository,
  PasswordChangeTraceDetailsDto,
} from '../domain/ports/auth.repository'

@Injectable()
export class GetPasswordChangeByIdUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly auth: IAuthRepository,
  ) {}

  async execute(requestId: string): Promise<PasswordChangeTraceDetailsDto> {
    const result = await this.auth.getPasswordChangeByRequestId(requestId)

    if (!result) {
      throw new NotFoundException(
        `Password change trace not found for requestId ${requestId}`,
      )
    }

    return result
  }
}
