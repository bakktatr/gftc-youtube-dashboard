import { NextResponse } from "next/server";
import { generateScript } from "@/lib/generators/script-generator";
import type { Topic } from "@/lib/generators/topic-generator";
import type { ProductKey } from "@/lib/generators/config";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { selectedTopic, contentType, cta } = body as {
      selectedTopic: Topic;
      contentType: string;
      cta: ProductKey;
    };

    if (!selectedTopic) {
      return NextResponse.json(
        { success: false, error: "주제가 선택되지 않았습니다." },
        { status: 400 }
      );
    }

    const script = await generateScript({
      selectedTopic,
      contentType: contentType || "풀링",
      cta: cta || "lead_magnet",
    });

    return NextResponse.json({ success: true, script });
  } catch (error) {
    console.error("대본 생성 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "대본 생성 실패",
      },
      { status: 500 }
    );
  }
}
