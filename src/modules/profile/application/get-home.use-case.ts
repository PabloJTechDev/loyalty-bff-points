import { Inject, Injectable } from '@nestjs/common'
import { PROFILE_REPOSITORY } from '../domain/ports/profile.repository'
import type {
  IProfileRepository,
  HomeResponseDto,
} from '../domain/ports/profile.repository'

@Injectable()
export class GetHomeUseCase {
  constructor(
    @Inject(PROFILE_REPOSITORY) private readonly profile: IProfileRepository,
  ) {}

  execute(): Promise<HomeResponseDto> {
    return this.profile.getHome()
  }
}
