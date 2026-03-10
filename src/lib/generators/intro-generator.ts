/**
 * 차설식 도입부(헤드) 생성기
 * Claude CLI 사용 (Max 구독)
 */

import { runClaude } from "@/lib/claude-cli";
import {
  buildIntroPrompt,
  NUM_EXAMPLES,
  type IntroExample,
} from "@/lib/prompts/intro-prompts";
import chasulIntros from "@/data/chasul-intros.json";

function randomSample<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

export async function generateIntro(params: {
  content: string;
  styleNote?: string;
}): Promise<string> {
  const intros = chasulIntros as IntroExample[];

  if (intros.length === 0) {
    throw new Error("도입부 트레이닝 데이터가 없습니다.");
  }

  const examples = randomSample(intros, NUM_EXAMPLES);

  const prompt = buildIntroPrompt({
    content: params.content,
    examples,
    styleNote: params.styleNote,
  });

  const result = await runClaude({
    prompt,
    timeout: 180_000,
  });

  return result.trim();
}
