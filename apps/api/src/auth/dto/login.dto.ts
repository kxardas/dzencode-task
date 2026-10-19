import { IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @Length(1, 100)
  @Matches(/^[\w.@-]+$/)
  username!: string;

  @IsString()
  @Length(1, 128)
  password!: string;
}
