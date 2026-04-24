import { SYSTEM_PROMPT_STAGE2 } from './system-prompts';

export const STAGE2_APPLY_PROMPT = (oldArticleText: string, newArticleText: string) => `
${SYSTEM_PROMPT_STAGE2}

СТАРАЯ ВЕРСИЯ СТАТЬИ (которую нужно заменить):
---
${oldArticleText}
---

НОВЫЙ ТЕКСТ (какой должна стать статья):
---
${newArticleText}
---

Правила:
1. Сохрани нумерацию глав, статей, пунктов и подпунктов.
2. Не добавляй комментарии, пояснения или примечания.
3. Не меняй форматирование без необходимости.
4. Верни ТОЛЬКО JSON с полным и обновлённым текстом статьи.

ФОРМАТ ВЫВОДА:
{
  "updatedArticle": "полный текст статьи после применения изменений"
}
`;
