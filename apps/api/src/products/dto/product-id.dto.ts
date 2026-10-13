import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class ProductIdDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4294967295)
  id: number;
}
