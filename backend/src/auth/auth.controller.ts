import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ActivateUserDto } from './dto/activate-user.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('google')
  google() {
    return { authorization_url: this.authService.getGoogleAuthorizationUrl() };
  }

  @Get('google/callback')
  googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    return this.authService.loginWithGoogle(code, state);
  }

  @Post('refresh')
  refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Post('activate')
  activate(@Body() dto: ActivateUserDto) {
    return this.authService.activate(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: { user: { sub: number; email: string; role: string } }) {
    return request.user;
  }

}