import { Controller, Get, Query, Param } from '@nestjs/common'
import { MapService } from './map.service'

@Controller('map')
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get('pins')
  getPins(
    @Query('minLat') minLat: string,
    @Query('maxLat') maxLat: string,
    @Query('minLng') minLng: string,
    @Query('maxLng') maxLng: string,
  ) {
    return this.mapService.getPins({
      minLat: parseFloat(minLat),
      maxLat: parseFloat(maxLat),
      minLng: parseFloat(minLng),
      maxLng: parseFloat(maxLng),
    })
  }

  @Get('hazard-layers/:type')
  getHazardLayer(@Param('type') type: string) {
    return this.mapService.getHazardLayer(type)
  }

  @Get('zonal-value')
  getZonalValue(
    @Query('city') city: string,
    @Query('province') province: string,
  ) {
    return this.mapService.getZonalValue(city, province)
  }
}
