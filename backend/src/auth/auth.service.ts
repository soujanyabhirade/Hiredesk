import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import {
  createHash,
  randomBytes,
  randomUUID,
} from 'node:crypto';

import { db } from '../prisma/db.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ProvisionUserDto } from './dto/provision-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { ActivateUserDto } from './dto/activate-user.dto.js';

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

    if (user.status && user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
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

    return this.issueTokens(user);
  }

  getGoogleAuthorizationUrl() {
    const clientId = process.env['GOOGLE_CLIENT_ID'];
    const redirectUri = process.env['GOOGLE_REDIRECT_URI'];

    if (!clientId || !redirectUri) {
      throw new NotFoundException('Google OAuth is not configured');
    }

    const state = this.jwtService.sign(
      { provider: 'google' },
      { expiresIn: '10m' },
    );
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'offline',
      prompt: 'select_account',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async loginWithGoogle(code: string, state: string) {
    const clientId = process.env['GOOGLE_CLIENT_ID'];
    const clientSecret = process.env['GOOGLE_CLIENT_SECRET'];
    const redirectUri = process.env['GOOGLE_REDIRECT_URI'];

    if (!clientId || !clientSecret || !redirectUri) {
      throw new NotFoundException('Google OAuth is not configured');
    }

    try {
      await this.jwtService.verifyAsync(state);
    } catch {
      throw new UnauthorizedException('Invalid Google OAuth state');
    }

    const tokenResponse = await fetch(
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      },
    );

    if (!tokenResponse.ok) {
      throw new UnauthorizedException('Google authorization failed');
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
    };
    if (!tokenData.access_token) {
      throw new UnauthorizedException('Google authorization token missing');
    }

    const profileResponse = await fetch(
      'https://openidconnect.googleapis.com/v1/userinfo',
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      },
    );

    if (!profileResponse.ok) {
      throw new UnauthorizedException('Google profile lookup failed');
    }

    const profile = (await profileResponse.json()) as {
      email?: string;
      email_verified?: boolean;
      name?: string;
    };

    if (!profile.email || profile.email_verified !== true) {
      throw new UnauthorizedException('A verified Google email is required');
    }

    const user = await db.orm.public.User.first({
      email: profile.email,
    });

    if (!user) {
      throw new NotFoundException(
        'No HireDesk account exists for this Google email',
      );
    }

    if (user.status && user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    return this.issueTokens(user);
  }

  private async issueTokens(user: {
    id: number;
    email: string;
    role: string;
  }) {
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

  async listUsers() {
    const users = await db.orm.public.User.all();

    return users.map(({ password, refreshTokenHash, activationTokenHash, activationExpiresAt, ...user }) => user);
  }

  async provisionUser(dto: ProvisionUserDto) {
    const existingUser = await db.orm.public.User.first({
      email: dto.email,
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const activationToken = randomBytes(32).toString('hex');
    const activationTokenHash = createHash('sha256')
      .update(activationToken)
      .digest('hex');
    const activationExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ).toISOString();

    const user = await db.orm.public.User.create({
      name: dto.name,
      email: dto.email,
      password: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
      role: dto.role,
      status: 'PENDING',
      activationTokenHash,
      activationExpiresAt,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      activationToken,
      activationExpiresAt,
    };
  }

  async updateUser(id: number, dto: UpdateUserDto, currentUserId: number) {
    if (id === currentUserId) {
      throw new ForbiddenException('Users cannot change their own role or status');
    }

    const user = await db.orm.public.User.first({ id });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (user.role === 'ADMIN' && (dto.role !== undefined && dto.role !== 'ADMIN' || dto.status === 'DISABLED')) {
      const admins = (await db.orm.public.User.all()).filter(
        (candidate) => candidate.role === 'ADMIN' && candidate.status === 'ACTIVE',
      );

      if (admins.length <= 1) {
        throw new ConflictException('The last active admin cannot be removed or disabled');
      }
    }

    const updated = await db.orm.public.User.where({ id }).update({
      ...(dto.role !== undefined ? { role: dto.role } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
    });

    const refreshed = await db.orm.public.User.first({ id });
    return refreshed ? {
      id: refreshed.id,
      name: refreshed.name,
      email: refreshed.email,
      role: refreshed.role,
      status: refreshed.status,
    } : updated;
  }

  async activate(dto: ActivateUserDto) {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const users = await db.orm.public.User.all();
    const user = users.find(
      (candidate) => candidate.activationTokenHash === tokenHash,
    );

    if (!user || !user.activationExpiresAt || new Date(user.activationExpiresAt).getTime() < Date.now()) {
      throw new UnauthorizedException('Activation token is invalid or expired');
    }

    const password = await bcrypt.hash(dto.password, 10);
    await db.orm.public.User.where({ id: user.id }).update({
      password,
      status: 'ACTIVE',
      activationTokenHash: null,
      activationExpiresAt: null,
    });

    return { message: 'Account activated successfully' };
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
      !user.refreshTokenHash ||
      (user.status && user.status !== 'ACTIVE')
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