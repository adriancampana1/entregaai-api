import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../service/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('admin/login')
  async adminLogin(@Body() loginDto: { username: string; password: string }) {
    const user = await this.authService.validateAdmin(
      loginDto.username,
      loginDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return this.authService.login(user, true);
  }

  @Post('driver/login')
  async driverLogin(
    @Body() loginDto: { driverId: number; phoneLastDigits: string },
  ) {
    const user = await this.authService.validateDriver(
      loginDto.driverId,
      loginDto.phoneLastDigits,
    );

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return this.authService.login(user);
  }
}
