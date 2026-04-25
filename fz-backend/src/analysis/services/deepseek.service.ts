// src/modules/analysis/services/deepseek.service.ts

import * as fs from 'fs';

import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import OpenAI from "openai";

import {
    DeepSeekRequest,
    //DeepSeekResponse,
    DeepSeekMessage,
    UploadedFile,
} from '../interfaces/deepseek-response.interface';

const FormData = require('form-data');

@Injectable()
export class DeepSeekService {
    private readonly logger = new Logger(DeepSeekService.name);
    private readonly apiKey: string;
    private readonly apiUrl: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.apiKey = this.configService.get<string>('DEEPSEEK_API_KEY') ?? '';
        this.apiUrl =
            this.configService.get<string>('DEEPSEEK_API_URL') || 'https://api.deepseek.com/v1';

        if (!this.apiKey) {
            this.logger.error('DEEPSEEK_API_KEY not set in environment variables');
        }
    }

    async chatCompletion(request: DeepSeekRequest): Promise<string> {
        try {

            this.logger.log(`DeepSeek api url: ${this.apiUrl}/chat/completions`);

            const openai = new OpenAI({
                baseURL: 'https://api.deepseek.com',
                apiKey: this.apiKey,
            });


            const response = await openai.chat.completions.create({
                messages: request.messages,
                model: "deepseek-v4-flash",
                temperature: 0.0,
                max_tokens: 384000,
                response_format: { type: "json_object" },
                // ✅ Для deepseek-reasoner
                thinking: { type: "enabled" },
                reasoning_effort: "high",
                stream: false,
            } as any);

            // ✅ Вывод информации о токенах
            this.logger.log('=== TOKEN USAGE ===');
            this.logger.log('Prompt tokens (входные):', response.usage?.prompt_tokens);
            this.logger.log('Completion tokens (выходные):', response.usage?.completion_tokens);
            this.logger.log('Total tokens (всего):', response.usage?.total_tokens);
            this.logger.log('Finish reason:', response.choices[0]?.finish_reason);

            // Детализация для thinking mode
            if (response.usage?.completion_tokens_details) {
                this.logger.log('Reasoning tokens (мысли):', response.usage.completion_tokens_details.reasoning_tokens);
                this.logger.log('Accepted tokens (принятые):', response.usage.completion_tokens_details.accepted_prediction_tokens);
                this.logger.log('Rejected tokens (отклоненные):', response.usage.completion_tokens_details.rejected_prediction_tokens);
            }
            /**const response = await firstValueFrom(
                this.httpService.post<DeepSeekResponse>(
                    `${this.apiUrl}/chat/completions`,
                    {
                        model: request.model,
                        messages: request.messages,
                        temperature: request.temperature ?? 0.0,
                        max_tokens: request.max_tokens ?? 16384,
                        response_format: { type: "json_object" },
                        ...(request.reasoning_effort && { reasoning_effort: request.reasoning_effort }),
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json',
                        },
                    },
                ),
            );*/

            //const content = response.data.choices[0]?.message?.content;
            const content = response.choices[0].message.content
            if (!content) {
                throw new Error('Empty response from DeepSeek API');
            }

            this.logger.log(`DeepSeek response: ${content} `);
            return content;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`DeepSeek API error: ${errorMessage}`);
            throw new HttpException(`DeepSeek API error: ${errorMessage}`, HttpStatus.BAD_GATEWAY);
        }
    }

    async uploadFile(filePath: string, fileName: string): Promise<UploadedFile> {
        try {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(filePath));
            formData.append('purpose', 'assistants');

            const response = await firstValueFrom(
                this.httpService.post(`${this.apiUrl}/file/upload_file`, formData, {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        ...formData.getHeaders(),
                    },
                }),
            );

            this.logger.debug(`File uploaded: ${fileName}, ID: ${response.data.id}`);

            return {
                fileId: response.data.id,
                fileName: fileName,
                bytes: response.data.bytes,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`File upload error: ${errorMessage}`);
            throw new HttpException(
                `Failed to upload file to DeepSeek: ${errorMessage}`,
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    async chatWithFile(
        fileId: string,
        prompt: string,
        model: string = 'deepseek-v3.2-exp',
    ): Promise<string> {
        // ✅ Теперь тип role явно указан как литерал
        const messages: DeepSeekMessage[] = [
            {
                role: 'user', // ← TypeScript понимает как тип 'user'
                content: `[file id: ${fileId}] ${prompt}`,
            },
        ];

        return this.chatCompletion({
            model,
            messages,
            temperature: 0.0,
            max_tokens: 8192,
        });
    }
}
