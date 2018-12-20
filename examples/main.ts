import { ApplicationContext } from './app.context';

async function bootstrap() {
    const app = await ApplicationContext();
    await app.listen(process.env.APP_PORT);

    console.log(`App started at port ${process.env.APP_PORT}`);
}

bootstrap();