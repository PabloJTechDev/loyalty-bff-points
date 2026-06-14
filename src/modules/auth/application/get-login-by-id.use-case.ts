import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { AUTH_REPOSITORY } from '../domain/ports/auth.repository'
import type {
  IAuthRepository,
  LoginTraceDetailsDto,
} from '../domain/ports/auth.repository'

@Injectable()
export class GetLoginByIdUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly auth: IAuthRepository,
  ) {}

  async execute(loginId: string): Promise<LoginTraceDetailsDto> {
    const result = await this.auth.getLoginByLoginId(loginId)

    if (!result) {
      throw new NotFoundException(`Login trace not found for loginId ${loginId}`)
    }

    return result
  }
}
