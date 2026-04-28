import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['company', 'notifications', 'auditLogs', 'createdVouchers'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['company'],
    });
  }

  async findAll(companyId?: number): Promise<User[]> {
    const options: any = {
      relations: ['company'],
      order: { createdAt: 'DESC' },
    };
    if (companyId) {
      options.where = { companyId };
    }
    return this.usersRepository.find(options);
  }

  async update(id: number, updateData: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    Object.assign(user, updateData);
    return this.usersRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    await this.usersRepository.delete(id);
  }
}
