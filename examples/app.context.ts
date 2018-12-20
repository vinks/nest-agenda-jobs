import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';

let context = null;
export const ApplicationContext = async () => {
  if (!context) {
    const app = express();
    context = await NestFactory.create(AppModule, app);
  }
  return context;
};