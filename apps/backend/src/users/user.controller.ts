import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { UserService, CreateUserInput, UpdateUserInput } from '../services/user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUsers() {
    const users = await this.userService.getUsers();
    return { success: true, data: users };
  }

  @Get('roles')
  async getRoles() {
    const roles = await this.userService.getRoles();
    return { success: true, data: roles };
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.userService.getUserById(id);
    return { success: true, data: user };
  }

  @Post()
  async createUser(@Body() createUserInput: CreateUserInput) {
    const user = await this.userService.createUser(createUserInput);
    return { success: true, data: user };
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() updateUserInput: UpdateUserInput) {
    const user = await this.userService.updateUser(id, updateUserInput);
    return { success: true, data: user };
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    await this.userService.deleteUser(id);
    return { success: true, data: true };
  }
}
