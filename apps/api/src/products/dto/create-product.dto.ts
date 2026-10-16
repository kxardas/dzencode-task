import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

function trim({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateProductDto {
  @IsInt()
  @Min(1)
  @Max(4294967295)
  orderId: number;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  type: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  serialNumber: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  isNew?: boolean;

  @Transform(trim)
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(10000)
  specification?: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || null : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    require_tld: false,
    disallow_auth: true,
  })
  photo?: string | null;

  @Matches(/^[1-9]\d{3}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  warrantyStart: string;

  @Matches(/^[1-9]\d{3}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  warrantyEnd: string;

  @Transform(trim)
  @IsString()
  @Matches(/^\d{1,10}(\.\d{1,2})?$/)
  priceUSD: string;

  @Transform(trim)
  @IsString()
  @Matches(/^\d{1,10}(\.\d{1,2})?$/)
  priceUAH: string;
}
