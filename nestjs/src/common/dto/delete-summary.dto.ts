// src/common/dto/delete-summary.dto.ts (或你喜歡的路徑)
import { ApiProperty } from '@nestjs/swagger';

export class DeleteSummary {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    type: Boolean,
    example: true, // 可選：提供一個範例值
  })
  ok: boolean;

  @ApiProperty({
    description: 'List of IDs deleted by the operation',
    type: [String], // 表示這是一個字符串陣列
    example: ['uuid1', 'uuid2'], // 可選：提供一個範例值
  })
  deletedEntityIds: string[];
}
