/**
 * Meta 광고 컨셉 생성기 — 4-에이전트 순차 파이프라인
 * Claude CLI 사용 (Max 구독)
 * 원본: meta-ad-automation/modules/concept_generator.py
 */

import { runClaudeJson, saveTempImage, removeTempFile } from "@/lib/claude-cli";
import {
  AGENT1_SYSTEM,
  buildAgent1UserPrompt,
  AGENT2_SYSTEM,
  buildAgent2UserPrompt,
  AGENT3_SYSTEM,
  buildAgent3UserPrompt,
  AGENT4_SYSTEM,
  buildAgent4UserPrompt,
} from "@/lib/prompts/ad-prompts";

// ── 타입 정의 ──────────────────────────────────────────────

export interface TextOverlay {
  position: string;
  text: string;
  style: string;
}

export interface AdConcept {
  id: number;
  name: string;
  hook: string;
  body: string;
  cta: string;
  visual_description_ko: string;
  hormozi_principle: string;
  visual_hook_type: string;
  visual_hook_type_ko: string;
  image_composition_ko: string;
  text_overlay: TextOverlay[];
  prompts: {
    square_1080x1080: string;
    story_1080x1920: string;
    landscape_1200x628: string;
  };
  image_prompt_en: string;
}

export interface AdConceptResult {
  product_summary: string;
  concepts: AdConcept[];
}

export interface GenerateAdConceptsOptions {
  imageBase64: string;
  knowledgeBase?: string;
  extraContext?: string;
  adLanguage?: string;
}

// ── 메인 함수 ──────────────────────────────────────────────

export async function generateAdConcepts(
  options: GenerateAdConceptsOptions
): Promise<AdConceptResult> {
  const {
    imageBase64,
    knowledgeBase = "",
    extraContext = "",
    adLanguage = "한국어",
  } = options;

  const kbText = knowledgeBase ? knowledgeBase.slice(0, 40000) : "없음";
  const extra = extraContext || "없음";

  // 이미지를 임시 파일로 저장 (CLI Vision용)
  const imgPath = await saveTempImage(imageBase64);

  try {
    // ── Agent 1: 랜딩페이지 분석가 (Vision) ─────────────────

    const agent1Prompt = `${AGENT1_SYSTEM}\n\n랜딩페이지 이미지 경로: ${imgPath}\n이 이미지를 읽고 분석해주세요.\n\n${buildAgent1UserPrompt()}`;

    const analysis = await runClaudeJson<Record<string, unknown>>({
      prompt: agent1Prompt,
      timeout: 180_000,
    });

    // ── Agent 2: 크리에이티브 전략가 ────────────────────────

    const analysisStr = JSON.stringify(analysis, null, 2);

    const agent2Prompt = `${AGENT2_SYSTEM}\n\n${buildAgent2UserPrompt({
      analysisJson: analysisStr,
      knowledgeBase: kbText,
      extraContext: extra,
    })}`;

    const strategy = await runClaudeJson<{
      concepts: Array<{
        id: number;
        name: string;
        hormozi_principle: string;
        visual_direction: string;
        [key: string]: unknown;
      }>;
    }>({
      prompt: agent2Prompt,
      timeout: 90_000,
    });

    // ── Agent 3: 카피라이터 ────────────────────────────────

    const strategyStr = JSON.stringify(strategy, null, 2);

    const agent3Prompt = `${AGENT3_SYSTEM}\n\n${buildAgent3UserPrompt({
      analysisJson: analysisStr,
      strategyJson: strategyStr,
      adLanguage,
    })}`;

    const copyResult = await runClaudeJson<{
      concepts: Array<{
        id: number;
        hook: string;
        body: string;
        cta: string;
      }>;
    }>({
      prompt: agent3Prompt,
      timeout: 90_000,
    });

    // ── Agent 4: 프롬프트 엔지니어 ────────────────────────

    const copyStr = JSON.stringify(copyResult, null, 2);

    const agent4Prompt = `${AGENT4_SYSTEM}\n\n${buildAgent4UserPrompt({
      analysisJson: analysisStr,
      strategyJson: strategyStr,
      copyJson: copyStr,
    })}`;

    const promptsResult = await runClaudeJson<{
      concepts: Array<{
        id: number;
        visual_hook_type: string;
        visual_hook_type_ko: string;
        image_composition_ko: string;
        text_overlay: TextOverlay[];
        prompts: {
          square_1080x1080: string;
          story_1080x1920: string;
          landscape_1200x628: string;
        };
      }>;
    }>({
      prompt: agent4Prompt,
      timeout: 300_000,
    });

    // ── 최종 조립 ─────────────────────────────────────────

    return assembleOutput(analysis, strategy, copyResult, promptsResult);
  } finally {
    await removeTempFile(imgPath);
  }
}

// ── 조립 함수 ──────────────────────────────────────────────

function assembleOutput(
  analysis: Record<string, unknown>,
  strategy: {
    concepts: Array<{
      name: string;
      hormozi_principle: string;
      visual_direction: string;
      [key: string]: unknown;
    }>;
  },
  copyResult: {
    concepts: Array<{
      hook: string;
      body: string;
      cta: string;
    }>;
  },
  promptsResult: {
    concepts: Array<{
      visual_hook_type: string;
      visual_hook_type_ko: string;
      image_composition_ko: string;
      text_overlay: TextOverlay[];
      prompts: {
        square_1080x1080: string;
        story_1080x1920: string;
        landscape_1200x628: string;
      };
    }>;
  }
): AdConceptResult {
  const concepts: AdConcept[] = [];

  for (let i = 0; i < 3; i++) {
    const brief = strategy.concepts[i];
    const copyData = copyResult.concepts[i];
    const promptData = promptsResult.concepts[i];
    const prompts = promptData?.prompts || {
      square_1080x1080: "",
      story_1080x1920: "",
      landscape_1200x628: "",
    };

    concepts.push({
      id: i + 1,
      name: brief?.name || `컨셉 ${i + 1}`,
      hook: copyData?.hook || "",
      body: copyData?.body || "",
      cta: copyData?.cta || "",
      visual_description_ko: brief?.visual_direction || "",
      hormozi_principle: brief?.hormozi_principle || "",
      visual_hook_type: promptData?.visual_hook_type || "",
      visual_hook_type_ko: promptData?.visual_hook_type_ko || "",
      image_composition_ko: promptData?.image_composition_ko || "",
      text_overlay: promptData?.text_overlay || [],
      prompts,
      image_prompt_en: prompts.square_1080x1080 || "",
    });
  }

  return {
    product_summary: (analysis.product_summary as string) || "",
    concepts,
  };
}
