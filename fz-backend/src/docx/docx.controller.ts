import {
    Controller,
    Post,
    BadRequestException,
    Req
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { DocxService } from './docx.service';
import { ExtractTextResponseDto } from './dto/extract-text.dto';
import { FastifyRequest } from 'fastify';

// Кастомный интерфейс для файла в Fastify
interface FastifyFile {
    filename: string;
    mimetype: string;
    file: any;
    value?: Buffer;
    fields?: any;
    fieldname: string;
    encoding: string;
    toBuffer: () => Promise<Buffer>;
}

@ApiTags('documents')
@Controller('docx')
export class DocxController {
    constructor(private readonly docxService: DocxService) { }

    @Post('extract')
    @ApiOperation({ summary: 'Извлечь текст из DOCX файла' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'DOCX файл для обработки',
                },
            },
        },
    })
    async extractText(@Req() request: FastifyRequest): Promise<ExtractTextResponseDto> {
        const data = await request.file();

        if (!data) {
            throw new BadRequestException('Файл не был загружен');
        }

        const file = data as FastifyFile;

        // Проверка MIME типа
        if (file.mimetype !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            throw new BadRequestException('Поддерживаются только файлы формата DOCX');
        }

        // Получаем Buffer из файла
        const buffer = await file.toBuffer();

        // Извлекаем текст
        const text = await this.docxService.extractTextFromBuffer(buffer);

        return {
            text,
            length: text.length,
        };
    }
}