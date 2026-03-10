/**
 * 대본 생성기
 * Claude CLI 사용 (Max 구독)
 */

import { runClaude } from "@/lib/claude-cli";
import {
  buildScriptSystemPrompt,
  buildScriptUserPrompt,
  PULLING_CONTENT_EXTRA,
  KEYCONTENT_EXTRA,
} from "@/lib/prompts/script-prompts";
import { formatProductsInfo, type ProductKey } from "@/lib/generators/config";
import type { Topic } from "@/lib/generators/topic-generator";
import gftcKnowledge from "@/data/gftc-knowledge.json";
import jueonkyuStyle from "@/data/jueonkyu-style.json";

export async function generateScript(params: {
  selectedTopic: Topic;
  contentType: string;
  cta: ProductKey;
}): Promise<string> {
  const productsInfo = formatProductsInfo(params.cta);

  let system = buildScriptSystemPrompt({
    gftcKnowledge: JSON.stringify(gftcKnowledge, null, 2),
    jueonkyuStyle: JSON.stringify(jueonkyuStyle, null, 2),
    productsInfo,
  });

  if (params.contentType === "키") {
    system += KEYCONTENT_EXTRA;
  } else {
    system += PULLING_CONTENT_EXTRA;
  }

  const userPrompt = buildScriptUserPrompt({
    selectedTopic: JSON.stringify(params.selectedTopic, null, 2),
    contentType: params.contentType,
  });

  const fullPrompt = `${system}\n\n${userPrompt}`;

  return runClaude({
    prompt: fullPrompt,
    timeout: 180_000,
  });
}
