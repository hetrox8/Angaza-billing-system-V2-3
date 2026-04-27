import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
  const payload = {
    email: user.email,
    sub: user.id,
    role: user.role,
    companyId: user.company?.id, // Add company ID to payload
  };
  return {
    accessToken: this.jwtService.sign(payload),
    refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
    user,
  };
}

  async register(registerDto: any) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);
    const user = this.usersRepository.create({
      ...registerDto,
      passwordHash: hashedPassword,
    });
    return this.usersRepository.save(user);
  }
}