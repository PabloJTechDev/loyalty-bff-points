import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { RegisterPasswordChangeUseCase } from '../application/register-password-change.use-case'
import { GetPasswordChangeByIdUseCase } from '../application/get-password-change-by-id.use-case'
import { RegisterLoginUseCase } from '../application/register-login.use-case'
import { GetLoginByIdUseCase } from '../application/get-login-by-id.use-case'
import type { PasswordChangeInput, LoginInput } from '../domain/ports/auth.repository'

@Controller('v1/customer')
export class AuthController {
  constructor(
    private readonly registerPasswordChange: RegisterPasswordChangeUseCase,
    private readonly getPasswordChangeById: GetPasswordChangeByIdUseCase,
    private readonly registerLogin: RegisterLoginUseCase,
    private readonly getLoginById: GetLoginByIdUseCase,
  ) {}

  @Post('password-change')
  registerPasswordChangeHandler(@Body() body: PasswordChangeInput) {
    return this.registerPasswordChange.execute(body)
  }

  @Get('password-change-traces/:requestId')
  getPasswordChange(@Param('requestId') requestId: string) {
    return this.getPasswordChangeById.execute(requestId)
  }

  @Post('login')
  registerLoginHandler(@Body() body: LoginInput) {
    return this.registerLogin.execute(body)
  }

  @Get('login-traces/:loginId')
  getLogin(@Param('loginId') loginId: string) {
    return this.getLoginById.execute(loginId)
  }
}
