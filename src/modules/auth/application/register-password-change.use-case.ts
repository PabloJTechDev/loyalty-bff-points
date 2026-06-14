import { Inject, Injectable } from '@nestjs/common'
import { AUTH_REPOSITORY } from '../domain/ports/auth.repository'
import type {
  IAuthRepository,
  PasswordChangeInput,
  PasswordChangeReceiptDto,
} from '../domain/ports/auth.repository'

@Injectable()
export class RegisterPasswordChangeUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly auth: IAuthRepository,
  ) {}

  execute(input: PasswordChangeInput): Promise<PasswordChangeReceiptDto> {
    return this.auth.registerPasswordChange(input)
  }
}
