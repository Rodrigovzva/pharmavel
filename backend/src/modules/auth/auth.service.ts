import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { Usuario } from '../../entities/usuario.entity';
import { Auditoria } from '../../entities/auditoria.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly maxLoginAttempts = 5;
  private readonly lockoutTime = 15 * 60 * 1000; // 15 minutos
  private loginAttempts = new Map<string, { count: number; lockUntil: number }>();

  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Auditoria)
    private auditoriaRepository: Repository<Auditoria>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usuarioRepository.findOne({
      where: { username },
      relations: ['rol', 'rol.permisos'],
    });

    if (!user || !user.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar bloqueo por intentos fallidos
    const attempts = this.loginAttempts.get(username);
    if (attempts && attempts.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((attempts.lockUntil - Date.now()) / 60000);
      throw new UnauthorizedException(
        `Cuenta bloqueada. Intente nuevamente en ${minutesLeft} minutos`,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.recordFailedAttempt(username);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Resetear intentos fallidos
    this.loginAttempts.delete(username);

    // Actualizar último acceso
    user.ultimo_acceso = new Date();
    await this.usuarioRepository.save(user);

    // Registrar auditoría
    await this.registrarAuditoria(user.id, 'LOGIN', 'AUTH', 'Inicio de sesión exitoso');

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto, ipAddress: string, userAgent: string) {
    const user = await this.validateUser(loginDto.username, loginDto.password);

    const payload = {
      username: user.username,
      sub: user.id,
      rol: user.rol?.nombre,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'refresh-secret'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      },
    );

    // Guardar refresh token
    await this.usuarioRepository.update(user.id, { refresh_token: refreshToken });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol: user.rol,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'refresh-secret'),
      });

      const user = await this.usuarioRepository.findOne({
        where: { id: payload.sub, refresh_token: refreshToken },
        relations: ['rol'],
      });

      if (!user || !user.activo) {
        throw new UnauthorizedException('Token inválido');
      }

      const newPayload = {
        username: user.username,
        sub: user.id,
        rol: user.rol?.nombre,
      };

      const accessToken = this.jwtService.sign(newPayload);

      return {
        access_token: accessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usuarioRepository.findOne({
      where: { username: registerDto.username },
    });

    if (existingUser) {
      throw new BadRequestException('El usuario ya existe');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = this.usuarioRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    await this.usuarioRepository.save(user);

    const { password: _, ...result } = user;
    return result;
  }

  async logout(userId: number) {
    await this.usuarioRepository.update(userId, { refresh_token: null });
    await this.registrarAuditoria(userId, 'LOGOUT', 'AUTH', 'Cierre de sesión');
    return { message: 'Sesión cerrada exitosamente' };
  }

  private recordFailedAttempt(username: string) {
    const attempts = this.loginAttempts.get(username) || { count: 0, lockUntil: 0 };

    attempts.count += 1;

    if (attempts.count >= this.maxLoginAttempts) {
      attempts.lockUntil = Date.now() + this.lockoutTime;
    }

    this.loginAttempts.set(username, attempts);
  }

  private async registrarAuditoria(
    usuarioId: number,
    accion: string,
    modulo: string,
    descripcion: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const auditoria = this.auditoriaRepository.create({
      usuario_id: usuarioId,
      accion,
      modulo,
      descripcion,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    await this.auditoriaRepository.save(auditoria);
  }
}
