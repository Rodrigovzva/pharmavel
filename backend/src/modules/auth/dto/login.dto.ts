import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'Rvel' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: '8080Ipv6**' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
