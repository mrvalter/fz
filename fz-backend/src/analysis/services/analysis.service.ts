// src/modules/analysis/services/analysis.service.ts

import { Injectable, Logger } from '@nestjs/common';

import { FinalResultDto } from '../dto/final-result.dto';
import { StartAnalysisDto } from '../dto/start-analysis.dto';
import { AnalysisProgress } from '../interfaces/analysis.interface';
import { Stage1ExtractService } from './stage1-extract.service';
//import { type Stage2ApplyService } from './stage2-apply.service';

@Injectable()
export class AnalysisService {
    private readonly logger = new Logger(AnalysisService.name);
    private progressStore: Map<string, AnalysisProgress> = new Map();

    constructor(
        private readonly stage1Extract: Stage1ExtractService,
        //private readonly stage2Apply: Stage2ApplyService,
    ) { }

    async startAnalysis(dto: StartAnalysisDto): Promise<{ projectId: string; status: string, error?: string }> {
        const { projectId, stage1Model, stage2Model, reasoningEffort } = dto;

        // Устанавливаем значения по умолчанию, если они не переданы
        const effectiveStage1Model = stage1Model ?? 'deepseek-v3.2-exp';
        const effectiveStage2Model = stage2Model ?? 'deepseek-v3.1';
        const effectiveReasoningEffort = reasoningEffort ?? 'medium';

        this.logger.log(`Starting analysis for project ${projectId}`);

        this.logger.debug(
            `Using models: stage1=${effectiveStage1Model}, stage2=${effectiveStage2Model}, reasoning=${effectiveReasoningEffort}`,
        );

        this.progressStore.set(projectId, {
            projectId,
            status: 'pending',
            stage: 'stage1',
        });

        try {

            await this.processAnalysisStage1(projectId, effectiveStage1Model);
            return { projectId, status: 'processing' };

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            this.logger.error(`Analysis failed for ${projectId}: ${errorMessage}`);
            this.progressStore.set(projectId, {
                projectId,
                status: 'failed',
                stage: null,
                error: errorMessage,
            });

            return { projectId, status: 'error', error: errorMessage };
        };
    }

    async getProgress(projectId: string): Promise<AnalysisProgress | null> {
        return this.progressStore.get(projectId) || null;
    }

    private async processAnalysisStage1(
        projectId: string,
        stage1Model: string,
    ): Promise<void> {

        this.updateProgress(projectId, 'extracting', 'stage1');

        const stage1Result = await this.stage1Extract.extractChanges(projectId, stage1Model);

        if (!stage1Result.success || stage1Result.changes.length === 0) {
            throw new Error(`Stage 1 failed: ${stage1Result.error || 'No changes found'}`);
        }

        this.logger.log(`Stage 1 complete: ${stage1Result.changes.length} changes extracted`);

        this.updateProgress(projectId, 'applying', 'stage2', {
            totalChanges: stage1Result.changes.length,
            completedChanges: 0,
        });

        /*const stage2Result = await this.stage2Apply.applyChanges(
          projectId,
          stage1Result.changes,
          stage2Model,
          reasoningEffort,
        );
    
        const finalLaw = this.assembleFinalLaw(stage2Result.changes);
    
        const finalResult: FinalResultDto = {
          projectId,
          changes: stage2Result.changes,
          finalLaw,
          statistics: {
            totalChanges: stage2Result.changes.length,
            articlesModified: stage2Result.changes.filter((c) => c.success).length,
            processingTimeMs: Date.now() - startTime,
            tokensUsed: {
              stage1: stage1Result.tokensUsed,
              stage2: stage2Result.tokensUsed,
              total: stage1Result.tokensUsed + stage2Result.tokensUsed,
            },
          },
        };
    
        this.updateProgress(projectId, 'completed', null, undefined, finalResult);
        this.logger.log(
          `Analysis complete for ${projectId} in ${finalResult.statistics.processingTimeMs}ms`,
        );*/
    }

    private updateProgress(
        projectId: string,
        status: AnalysisProgress['status'],
        stage: AnalysisProgress['stage'],
        extra?: Partial<AnalysisProgress>,
        result?: FinalResultDto,
    ): void {
        const current = this.progressStore.get(projectId) || {
            projectId,
            status: 'pending',
            stage: null,
        };

        this.progressStore.set(projectId, {
            ...current,
            status,
            stage,
            ...extra,
            result: result || current.result,
        } as AnalysisProgress);
    }
}
