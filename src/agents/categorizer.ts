import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { getAllCategories } from "@/actions/video-actions";

export interface CategorizerResult {
  success: boolean;
  categorized: number;
  skipped: number;
  errors: string[];
}

interface CategoryPrediction {
  category: string;
  confidence: number;
}

// 기존 영상 제목-카테고리 매핑 (few-shot 예시)
const FEW_SHOT_EXAMPLES = [
  { title: "비트코인, 불안해하지마세요. 2026년 정확히 '이때' 반등나옵니다", category: "비트 시황" },
  { title: "나스닥, 전 분명 말씀드렸습니다.", category: "나스닥 시황" },
  { title: "금, 저라면 여기까지 '롱', 이때부터 '숏'", category: "골드 시황" },
  { title: "이동평균선, '이것'까지 알아야 수익냅니다", category: "매매기법" },
  { title: "차트의 기본 이동평균선, 평생 써먹는 초간단 매매법", category: "매매기법(현강)" },
  { title: "이 방법으로도 수익 못내면 투자 접으세요. 성공률 00% 매매기법", category: "매매기법(리메이크)" },
  { title: "차트 분석 방법은 이 영상 하나로 종결합니다.", category: "실력 입증" },
  { title: "한국만 해외 거래소 전면차단? 진실을 알려드립니다", category: "정보성" },
  { title: "2026년 투자로 성공하려면 반드시 알아야 되는 것", category: "인사이트" },
  { title: "100시간 동안 트레이딩만으로 살아보기", category: "삼시세끼" },
  { title: "제 2의 월급, 이 매매기법으로 만들었습니다", category: "모음집" },
  { title: "거래량 보는 법, 확실하게 모르면 손실납니다", category: "팟캐스트" },
];

/**
 * Categorizer Agent
 *
 * Claude AI를 사용하여 영상 제목을 분석하고 카테고리를 자동 분류하는 에이전트
 * - 수동으로 카테고리가 지정된 영상은 건너뜀
 * - 신뢰도(confidence)를 함께 저장
 * - 낮은 신뢰도 항목은 대시보드에서 수동 확인 유도
 */
export async function runCategorizer(): Promise<CategorizerResult> {
  const result: CategorizerResult = {
    success: false,
    categorized: 0,
    skipped: 0,
    errors: [],
  };

  console.log("🤖 Categorizer Agent 시작...");

  try {
    // Anthropic API 키 확인
    const settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });

    const apiKey = settings?.anthropicKey || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      result.errors.push(
        "Anthropic API 키가 설정되지 않았습니다. Settings 페이지에서 설정해주세요."
      );
      return result;
    }

    const client = new Anthropic({ apiKey });

    // 카테고리가 없거나, 수동 지정이 아닌 영상들 가져오기
    const uncategorizedVideos = await prisma.video.findMany({
      where: {
        OR: [
          { category: null },
          { categoryManual: false, category: { not: null } },
        ],
      },
      orderBy: { publishedAt: "desc" },
    });

    // 수동 지정된 영상 수 카운트
    const manualCount = await prisma.video.count({
      where: { categoryManual: true },
    });
    result.skipped = manualCount;

    if (uncategorizedVideos.length === 0) {
      console.log("✅ 모든 영상이 이미 분류되어 있습니다.");
      result.success = true;
      return result;
    }

    console.log(
      `📊 ${uncategorizedVideos.length}개 영상 분류 시작 (수동 지정 ${manualCount}개 건너뜀)`
    );

    // DB에서 카테고리 목록 가져오기
    const dbCategories = await getAllCategories();
    const categoryNames = dbCategories.map((c) => c.name);

    // 배치로 분류 (한 번에 10개씩)
    const batchSize = 10;
    for (let i = 0; i < uncategorizedVideos.length; i += batchSize) {
      const batch = uncategorizedVideos.slice(i, i + batchSize);
      const titles = batch.map((v) => v.title);

      try {
        const predictions = await classifyTitles(client, titles, categoryNames);

        for (let j = 0; j < batch.length; j++) {
          const video = batch[j];
          const prediction = predictions[j];

          if (prediction) {
            await prisma.video.update({
              where: { id: video.id },
              data: {
                category: prediction.category,
                categoryConfidence: prediction.confidence,
                categoryManual: false,
              },
            });
            result.categorized++;
            console.log(
              `  ✅ "${video.title.substring(0, 30)}..." → ${prediction.category} (${Math.round(prediction.confidence * 100)}%)`
            );
          }
        }
      } catch (error) {
        const errMsg = `배치 ${i / batchSize + 1} 분류 실패: ${error}`;
        console.error(`  ❌ ${errMsg}`);
        result.errors.push(errMsg);
      }

      // Rate limiting
      if (i + batchSize < uncategorizedVideos.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    result.success = result.errors.length === 0;
    console.log(
      `\n✅ Categorizer 완료: ${result.categorized}개 분류, ${result.skipped}개 건너뜀`
    );
  } catch (error) {
    const errMsg = `Categorizer 오류: ${error}`;
    console.error(`❌ ${errMsg}`);
    result.errors.push(errMsg);
  }

  return result;
}

/**
 * Claude API를 사용하여 영상 제목들을 카테고리로 분류
 */
async function classifyTitles(
  client: Anthropic,
  titles: string[],
  categoryNames: string[]
): Promise<CategoryPrediction[]> {
  const fewShotText = FEW_SHOT_EXAMPLES.map(
    (ex) => `제목: "${ex.title}" → 카테고리: ${ex.category}`
  ).join("\n");

  const categoriesList = categoryNames.join(", ");

  const titlesText = titles
    .map((t, i) => `${i + 1}. "${t}"`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 2048,
    system: `당신은 유튜브 투자/트레이딩 채널의 영상 카테고리를 분류하는 전문가입니다.

사용 가능한 카테고리: ${categoriesList}

각 카테고리의 특징:
- 비트 시황: 비트코인 시장 분석, 전망, 대응 전략
- 나스닥 시황: 나스닥 시장 분석, 전망
- 골드 시황: 금 시장 분석, 전망
- 매매기법: 트레이딩 기법, 분석 방법론 교육
- 매매기법(현강): 현재 강의 형태의 매매기법 교육
- 매매기법(리메이크): 기존 인기 매매기법 영상을 리메이크한 것
- 실력 입증: 실제 매매 실적, 수익 인증
- 정보성: 투자 관련 뉴스, 정보, 일반 지식
- 인사이트: 투자 철학, 마인드셋, 깊은 통찰
- 삼시세끼: 트레이딩으로 생활하는 컨텐츠
- 모음집: 여러 매매기법/팁을 모아놓은 영상
- 팟캐스트: 팟캐스트 형식의 대화형 컨텐츠

기존 분류 예시:
${fewShotText}

응답 형식 (반드시 JSON 배열로):
[{"index": 1, "category": "카테고리명", "confidence": 0.95}, ...]

confidence는 0~1 사이의 값으로, 분류 확신도를 나타냅니다.`,
    messages: [
      {
        role: "user",
        content: `다음 영상 제목들의 카테고리를 분류해주세요:\n\n${titlesText}`,
      },
    ],
  });

  // 응답에서 JSON 추출
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("응답에서 텍스트를 찾을 수 없습니다.");
  }

  const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("응답에서 JSON을 파싱할 수 없습니다.");
  }

  const parsed = JSON.parse(jsonMatch[0]) as Array<{
    index: number;
    category: string;
    confidence: number;
  }>;

  // 결과를 제목 순서에 맞게 정렬
  const predictions: CategoryPrediction[] = titles.map((_, i) => {
    const match = parsed.find((p) => p.index === i + 1);
    if (match && categoryNames.includes(match.category)) {
      return {
        category: match.category,
        confidence: Math.min(Math.max(match.confidence, 0), 1),
      };
    }
    return { category: "정보성", confidence: 0.3 }; // fallback
  });

  return predictions;
}
