import { IsEmail, IsNotEmpty, MinLength, IsNumber } from 'class-validator';

export class RegisterDto {
    @IsNotEmpty({ message: 'Name is required' })
    name: string;

    @IsEmail({}, { message: 'Email must be valid' })
    email: string;

    @MinLength(6, { message: 'Password must be at least 6 characters' })
    password: string;

    @IsNumber({}, { message: 'roleId must be a number' })
    roleId: number;
}
