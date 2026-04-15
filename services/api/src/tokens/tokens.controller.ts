import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common'
import { TokensService } from './tokens.service'
import { JwtGuard } from '../auth/jwt.guard'
import { RolesGuard, Roles } from '../auth/roles.guard'

@Controller('tokens')
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Get()
  list() {
    return this.tokensService.listTokenizedProperties()
  }

  @Get('my-holdings')
  @UseGuards(JwtGuard)
  myHoldings(@Request() req: any) {
    return this.tokensService.getMyHoldings(req.user.id)
  }

  @Post(':id/buy')
  @UseGuards(JwtGuard)
  buy(@Param('id') id: string, @Body() body: { shares: number }, @Request() req: any) {
    return this.tokensService.buyShares(id, req.user.id, body.shares)
  }

  @Post(':id/distribute')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('admin', 'broker_admin')
  distribute(@Param('id') id: string, @Request() req: any) {
    return this.tokensService.distributeIncome(id, req.user.id)
  }
}
