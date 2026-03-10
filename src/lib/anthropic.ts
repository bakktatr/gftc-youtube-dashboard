import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

/**
 * Settings DB 또는 환경변수에서 API 키를 가져와 Anthropic 클라이언트를 생성합니다.
 * 기존 categorizer.ts와 동일한 패턴.
 */
export async function getAnthropicClient(): Promise<Anthropic> {
  const settings = await prisma.settings.findUnique({
    where: { id: "default" },
  });

  const apiKey = settings?.anthropicKey || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Anthropic API 키가 설정되지 않았습니다. Settings에서 설정해주세요."
    );
  }

  return new Anthropic({ apiKey });
}
