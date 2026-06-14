import { Controller, Get, Query } from '@nestjs/common'
import { GetHomeUseCase } from '../application/get-home.use-case'
import { GetProfileSummaryUseCase } from '../application/get-profile-summary.use-case'
import type { ProfileSummaryQuery } from '../domain/ports/profile.repository'

@Controller('v1/customer')
export class ProfileController {
  constructor(
    private readonly getHome: GetHomeUseCase,
    private readonly getProfileSummary: GetProfileSummaryUseCase,
  ) {}

  @Get('home')
  home() {
    return this.getHome.execute()
  }

  @Get('profile-summary')
  profileSummary(@Query() query: ProfileSummaryQuery) {
    return this.getProfileSummary.execute(query)
  }
}
