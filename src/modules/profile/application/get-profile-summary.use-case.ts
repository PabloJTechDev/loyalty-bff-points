import { Inject, Injectable } from '@nestjs/common'
import { PROFILE_REPOSITORY } from '../domain/ports/profile.repository'
import type {
  IProfileRepository,
  ProfileSummaryQuery,
  ProfileSummaryResponseDto,
} from '../domain/ports/profile.repository'

@Injectable()
export class GetProfileSummaryUseCase {
  constructor(
    @Inject(PROFILE_REPOSITORY) private readonly profile: IProfileRepository,
  ) {}

  execute(query: ProfileSummaryQuery): Promise<ProfileSummaryResponseDto> {
    return this.profile.getProfileSummary(query)
  }
}
