import { envs } from './config/envs';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as morgan from 'morgan';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('Payments-MS');
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: envs.natsServers,
    },
  });
  await app.startAllMicroservices();

  app.use(morgan('dev'));
  await app.listen(envs.port);
  logger.log(`Payments Microservice running on port: ${envs.port}`);
}
bootstrap();
