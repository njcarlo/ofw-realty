import 'reflect-metadata'
import * as dotenv from 'dotenv'
dotenv.config()
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors({ origin: process.env.ALLOWED_ORIGINS?.split(',') })
  await app.listen(3001)
  console.log('API running on http://localhost:3001')
}
bootstrap()
