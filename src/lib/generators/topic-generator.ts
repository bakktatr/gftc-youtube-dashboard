/**
 * 주제 추천 생성기
 * Claude CLI 사용 (Max 구독)
 */

import { runClaudeJson } from "@/lib/claude-cli";
import {
  TOPIC_SUGGESTION_SYSTEM,
  buildTopicSuggestionPrompt,
} from "@/lib/prompts/topic-prompts";
import { formatProductsInfo, type ProductKey } from "@/lib/generators/config";
import gftcKnowledge from "@/data/gftc-knowledge.json";

export interface Topic {
  topic_number: number;
  content_type: string;
  title_ideas: string[];
  thumbnail_concept: string;
  target_emotion: string;
  brief_description: string;
  sales_funnel_role: string;
}

export async function suggestTopics(params: {
  existingTitles: string[];
  userInput: string;
  cta: ProductKey;
}): Promise<Topic[]> {
  const titlesText =
    params.existingTitles.length > 0
      ? params.existingTitles
          .slice(0, 50)
          .map((t, i) => `${i + 1}. ${t}`)
          .join("\n")
      : "(없음)";

  const productsInfo = formatProductsInfo(params.cta);

  const userPrompt = buildTopicSuggestionPrompt({
    gftcKnowledge: JSON.stringify(gftcKnowledge, null, 2),
    existingTitles: titlesText,
    productsInfo,
    userInput: params.userInput || "(사용자 입력 없음)",
  });

  const fullPrompt = `${TOPIC_SUGGESTION_SYSTEM}\n\n${userPrompt}`;

  return runClaudeJson<Topic[]>({
    prompt: fullPrompt,
    timeout: 180_000,
  });
}
