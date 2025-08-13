import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDto } from './dto/user.dto';
import { plainToInstance } from 'class-transformer';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}
  create(createUserDto: CreateUserDto): User {
    return this.userRepo.create(createUserDto);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    const user = await this.userRepo.findOne({ where: { id } });
    // 2. 如果用户不存在，抛出异常
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepo.save(user);
    return this.toUserDto(updatedUser);
  }

  async remove(id: string): Promise<boolean> {
    const deleteResult: DeleteResult = await this.userRepo.delete(id);
    if (deleteResult.affected === 0) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return true;
  }

  async findById(id: string): Promise<UserDto | null> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (user) {
      return this.toUserDto(user);
    } else {
      return null;
    }
  }

  async findByGoogleSub(google_sub: string): Promise<UserDto | null> {
    const user = await this.userRepo.findOne({ where: { google_sub } });
    if (user) {
      return this.toUserDto(user);
    } else {
      return null;
    }
  }

  toUserDto(user: User): UserDto {
    return plainToInstance(UserDto, user, { excludeExtraneousValues: true });
  }
}
