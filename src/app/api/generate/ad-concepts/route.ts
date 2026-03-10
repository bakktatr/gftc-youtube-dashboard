/**
 * Meta 광고 컨셉 생성 API
 * POST: 4-에이전트 순차 실행으로 3개 광고 컨셉 생성
 */

import { NextRequest, NextResponse } from "next/server";
import { generateAdConcepts } from "@/lib/generators/ad-concept-generator";
import {
  captureScreenshot,
  prepareImageForClaude,
  prepareBase64ImageForClaude,
} from "@/lib/landing-page";

/** 4-에이전트 체인은 2~5분 소요 */
export const maxDuration = 300; // 5분

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      url,
      imageBase64,
      knowledgeBase,
      extraContext,
      adLanguage,
    } = body as {
      url?: string;
      imageBase64?: string;
      knowledgeBase?: string;
      extraContext?: string;
      adLanguage?: string;
    };

    if (!url && !imageBase64) {
      return NextResponse.json(
        { success: false, error: "URL 또는 이미지를 제공해주세요." },
        { status: 400 }
      );
    }

    // 이미지 준비
    let finalBase64: string;

    if (url) {
      // URL → Playwright 스크린샷 → base64
      const screenshotBuffer = await captureScreenshot(url);
      finalBase64 = prepareImageForClaude(screenshotBuffer);
    } else {
      // 직접 업로드된 base64 → 리사이즈
      finalBase64 = await prepareBase64ImageForClaude(imageBase64!);
    }

    // 4-에이전트 체인 실행
    const result = await generateAdConcepts({
      imageBase64: finalBase64,
      knowledgeBase,
      extraContext,
      adLanguage,
    });

    return NextResponse.json({
      success: true,
      productSummary: result.product_summary,
      concepts: result.concepts,
    });
  } catch (error) {
    console.error("광고 컨셉 생성 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "광고 컨셉 생성에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
