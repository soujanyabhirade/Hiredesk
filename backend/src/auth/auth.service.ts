import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import {
  createHash,
  randomUUID,
} from 'node:crypto';

import { db } from '../prisma/db.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser =
      await db.orm.public.User.first({
        email: dto.email,
      });

    if (existingUser) {
      throw new ConflictException(
        'Email already registered',
      );
    }

    const hashedPassword =
      await bcrypt.hash(dto.password, 10);

    const user =
      await db.orm.public.User.create({
        email: dto.email,
        password: hashedPassword,
      });

    return {
      id: user.id,
      email: user.email,
    };
  }

  async login(dto: LoginDto) {
    const user =
      await db.orm.public.User.first({
        email: dto.email,
      });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const passwordMatches =
      await bcrypt.compare(
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
      await this.jwtService.signAsync(
        payload,
      );

    const refreshToken =
      await this.jwtService.signAsync(
        payload,
        {
          expiresIn: '7d',
          jwtid: randomUUID(),
        },
      );

    const refreshTokenDigest =
      createHash('sha256')
        .update(refreshToken)
        .digest('hex');

    const refreshTokenHash =
      await bcrypt.hash(
        refreshTokenDigest,
        10,
      );

    await db.orm.public.User
      .where({
        id: user.id,
      })
      .update({
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
        await this.jwtService.verifyAsync(
          refreshToken,
        );
    } catch {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    const user =
      await db.orm.public.User.first({
        id: payload.sub,
      });

    if (
      !user ||
      !user.refreshTokenHash
    ) {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    const refreshTokenDigest =
      createHash('sha256')
        .update(refreshToken)
        .digest('hex');

    const tokenMatches =
      await bcrypt.compare(
        refreshTokenDigest,
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
      await this.jwtService.signAsync(
        newPayload,
      );

    const newRefreshToken =
      await this.jwtService.signAsync(
        newPayload,
        {
          expiresIn: '7d',
          jwtid: randomUUID(),
        },
      );

    const newRefreshTokenDigest =
      createHash('sha256')
        .update(newRefreshToken)
        .digest('hex');

    const newRefreshTokenHash =
      await bcrypt.hash(
        newRefreshTokenDigest,
        10,
      );

    await db.orm.public.User
      .where({
        id: user.id,
      })
      .update({
        refreshTokenHash:
          newRefreshTokenHash,
      });

    const updatedUser =
      await db.orm.public.User.first({
        id: user.id,
      });

    if (
      !updatedUser ||
      !updatedUser.refreshTokenHash
    ) {
      throw new UnauthorizedException(
        'Refresh token rotation failed',
      );
    }

    const newTokenDigest =
      createHash('sha256')
        .update(newRefreshToken)
        .digest('hex');

    const newTokenMatches =
      await bcrypt.compare(
        newTokenDigest,
        updatedUser.refreshTokenHash,
      );

    if (!newTokenMatches) {
      throw new UnauthorizedException(
        'Refresh token rotation failed',
      );
    }

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }
}