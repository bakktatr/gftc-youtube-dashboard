import { NextResponse } from "next/server";
import { generateIntro } from "@/lib/generators/intro-generator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, styleNote } = body as {
      content: string;
      styleNote?: string;
    };

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: "본문 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    const intro = await generateIntro({
      content,
      styleNote,
    });

    return NextResponse.json({ success: true, intro });
  } catch (error) {
    console.error("도입부 생성 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "도입부 생성 실패",
      },
      { status: 500 }
    );
  }
}
