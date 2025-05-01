import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                type: 'postgres',
                url: configService.get<string>('DATABASE_URL'),
                ssl: {
                    rejectUnauthorized: false,
                },
                autoLoadEntities: true,
                synchronize: true, // ⚠️ set to false in production
            }),
        }),
    ],
})
export class DatabaseModule { }
