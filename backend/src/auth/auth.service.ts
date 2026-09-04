import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { db } from '../prisma/db.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await db.orm.public.User.first({
      email: dto.email,
    });

    if (existingUser) {
      throw new ConflictException(
        'Email already registered',
      );
    }

    const hashedPassword = await bcrypt.hash(
      dto.password,
      10,
    );

    const user = await db.orm.public.User.create({
      email: dto.email,
      password: hashedPassword,
    });

    return {
      id: user.id,
      email: user.email,
    };
  }

  async login(dto: LoginDto) {
    const user = await db.orm.public.User.first({
      email: dto.email,
    });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken =
      await this.jwtService.signAsync(payload);

    const refreshToken =
      await this.jwtService.signAsync(payload, {
        expiresIn: '7d',
      });

    const refreshTokenHash =
      await bcrypt.hash(refreshToken, 10);

    await db.orm.public.User.where({
      id: user.id,
    }).update({
      refreshTokenHash,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException(
        'Refresh token is required',
      );
    }

    let payload: {
      sub: number;
      email: string;
      role: string;
    };

    try {
      payload =
        await this.jwtService.verifyAsync(refreshToken);
    } catch {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    const user = await db.orm.public.User.first({
      id: payload.sub,
    });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    const tokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );

    if (!tokenMatches) {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    const newPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const newAccessToken =
      await this.jwtService.signAsync(newPayload);

    const newRefreshToken =
      await this.jwtService.signAsync(newPayload, {
        expiresIn: '7d',
      });

    const newRefreshTokenHash =
      await bcrypt.hash(newRefreshToken, 10);

    await db.orm.public.User.where({
      id: user.id,
    }).update({
      refreshTokenHash: newRefreshTokenHash,
    });

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }
}