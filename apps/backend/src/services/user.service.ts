import { BaseService } from './base.service';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

export interface CreateUserInput {
  email: string;
  password?: string;
  name?: string;
  phone?: string;
  referralCode?: string;
  roleId?: string;
  baseSalary?: string | number | null;
  isActive?: boolean;
}

export interface UpdateUserInput {
  email?: string;
  password?: string;
  name?: string;
  phone?: string;
  referralCode?: string;
  roleId?: string;
  baseSalary?: string | number | null;
  isActive?: boolean;
}

export class UserService extends BaseService {
  async getUsers() {
    return this.prisma.user.findMany({
      include: {
        role: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true }
            }
          }
        },
        permissions: {
          include: { permission: true }
        }
      },
    });
  }

  async createUser(data: CreateUserInput) {
    // Check if email exists
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('Email đã được sử dụng');

    // Check referralCode
    if (data.referralCode) {
      const codeExists = await this.prisma.user.findUnique({ where: { referralCode: data.referralCode } });
      if (codeExists) throw new Error('Mã Referral đã tồn tại');
    }

    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : await bcrypt.hash('123456', 10);

    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        phone: data.phone,
        referralCode: data.referralCode || null,
        roleId: data.roleId || null,
        baseSalary: data.baseSalary ? new Prisma.Decimal(data.baseSalary) : null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  async updateUser(id: string, data: UpdateUserInput) {
    if (data.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: data.email, id: { not: id } }
      });
      if (existing) throw new Error('Email đã được sử dụng');
    }

    if (data.referralCode) {
      const codeExists = await this.prisma.user.findFirst({
        where: { referralCode: data.referralCode, id: { not: id } }
      });
      if (codeExists) throw new Error('Mã Referral đã tồn tại');
    }

    const updateData: Prisma.UserUpdateInput = {};
    if (data.email !== undefined) updateData.email = data.email;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.referralCode !== undefined) updateData.referralCode = data.referralCode || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.baseSalary !== undefined) updateData.baseSalary = data.baseSalary ? new Prisma.Decimal(data.baseSalary) : null;
    
    // Typecast roleId if present because Prisma expects a connect object for relation fields in UpdateInput
    if (data.roleId !== undefined) {
      (updateData as Prisma.UserUncheckedUpdateInput).roleId = data.roleId || null;
    }

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (user?.email === 'admin' || user?.email === 'admin@viettung.vn' || user?.email === 'admin@viettung.online') {
      throw new Error('Không thể xóa tài khoản Admin Root');
    }
    return this.prisma.user.delete({ where: { id } });
  }

  async changePassword(userId: string, oldPass: string, newPass: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Không tìm thấy người dùng');
    
    const isValid = await bcrypt.compare(oldPass, user.password);
    if (!isValid) throw new Error('Mật khẩu cũ không chính xác');
    
    const hashed = await bcrypt.hash(newPass, 10);
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed }
    });
  }

  async getRoles() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
