// src/auth/auth.service.ts
import {
    Injectable,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';

import { User } from '../../users/entities/user.entity';
import { AuthToken } from '../entities/auth.entity';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,

        @InjectRepository(AuthToken)
        private authRepository: Repository<AuthToken>,

        private jwtService: JwtService,
    ) { }

    // 🔐 User validation using Argon2
    async validateUser(email: string, password: string): Promise<User> {
        const user = await this.usersRepository.findOne({ where: { email } });
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await argon2.verify(user.password, password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return user;
    }

    // 📝 Registration with token generation
    async register(registerDto: RegisterDto) {
        const existingUser = await this.usersRepository.findOne({
            where: { email: registerDto.email },
        });

        if (existingUser) {
            throw new ConflictException('Email already in use');
        }

        const hashedPassword = await argon2.hash(registerDto.password);

        const newUser = this.usersRepository.create({
            ...registerDto,
            password: hashedPassword,
        });

        const savedUser = await this.usersRepository.save(newUser);

        const tokens = await this.generateAndSaveTokens(savedUser.id, savedUser.roleId);

        return tokens;
    }

    // 🔑 Login with token generation
    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);

        const tokens = await this.generateAndSaveTokens(user.id, user.roleId);

        return tokens;
    }

    // 🧠 Token generation logic
    private async generateAndSaveTokens(userId: number, roleId: number) {
        const payload = { sub: userId, roleId };

        const accessToken = await this.jwtService.signAsync(payload, {
            expiresIn: '15m',
        });

        const refreshToken = await this.jwtService.signAsync(payload, {
            expiresIn: '7d',
        });

        const authRecord = this.authRepository.create({
            userId,
            roleId,
            accessToken,
            refreshToken,
        });

        await this.authRepository.save(authRecord);

        return {
            accessToken,
            refreshToken,
        };
    }
}
