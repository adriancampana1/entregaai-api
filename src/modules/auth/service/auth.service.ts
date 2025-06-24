/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/shared/infra/database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateAdmin(name: string, password: string) {
    const admin = await this.prisma.admin.findFirst({
      where: {
        nome: name,
      },
    });

    if (admin && (await bcrypt.compare(password, admin.senha))) {
      const { senha, ...result } = admin;
      return result;
    }
    return null;
  }

  async validateDriver(id: number, phoneLastDigits: string) {
    const driver = await this.prisma.entregador.findFirst({
      where: {
        id,
      },
    });

    if (driver && driver.telefone) {
      const lastFourDigits = driver.telefone.slice(-4);

      if (lastFourDigits === phoneLastDigits) {
        return driver;
      }
      return null;
    }
  }

  login(user: any, isAdmin = false) {
    const payload = {
      name: user.nome,
      sub: user.id,
      role: isAdmin ? 'admin' : 'driver',
    };

    return {
      access_token: this.jwtService.sign(payload),
      role: payload.role,
      userId: payload.sub,
      name: payload.name,
    };
  }
}
