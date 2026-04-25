import { ApiProperty } from '@nestjs/swagger';

export class ExtractTextResponseDto {
    @ApiProperty({ description: 'Извлеченный текст из документа' })
    text: string;

    @ApiProperty({ description: 'Количество символов' })
    length: number;
}