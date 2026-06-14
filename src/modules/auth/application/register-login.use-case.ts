import { Inject, Injectable } from '@nestjs/common'
import { AUTH_REPOSITORY } from '../domain/ports/auth.repository'
import type {
  IAuthRepository,
  LoginInput,
  LoginReceiptDto,
} from '../domain/ports/auth.repository'

@Injectable()
export class RegisterLoginUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly auth: IAuthRepository,
  ) {}

  execute(input: LoginInput): Promise<LoginReceiptDto> {
    return this.auth.registerLogin(input)
  }
}
