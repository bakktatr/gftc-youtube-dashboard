/**
 * 주제 추천용 프롬프트
 * gftc-script-generator/prompts/topic_prompts.py에서 포팅
 */

export const TOPIC_SUGGESTION_SYSTEM = `당신은 YouTube 콘텐츠 전략가입니다.
투자/트레이딩 교육 채널의 영상 주제를 기획하는 전문가로서,
주언규의 '역순 기획' 방식(제목/썸네일 먼저 → 내용은 나중)을 철저히 따릅니다.

핵심 원칙:
1. 시청자가 클릭할 수밖에 없는 제목/썸네일부터 설계
2. '풀링 콘텐츠'(유입용)와 '키 콘텐츠'(수익화)를 명확히 구분
3. 대중의 결핍과 욕망을 겨냥한 주제 선정
4. 구체적인 숫자와 현실적인 스토리를 활용`;

export function buildTopicSuggestionPrompt(params: {
  gftcKnowledge: string;
  existingTitles: string;
  productsInfo: string;
  userInput: string;
}): string {
  return `아래 정보를 바탕으로, 글로벌트레이더협회(GFTC) 채널에 올릴 영상 주제 3개를 추천해주세요.

## GFTC 채널 전문 분야:
${params.gftcKnowledge}

## 기존 GFTC 영상 제목 목록 (중복 방지용):
${params.existingTitles}

## 판매 상품 정보:
${params.productsInfo}

## 사용자 입력 (선택):
${params.userInput}

## 추천 규칙:
1. 3개 주제 중 최소 2개는 '풀링 콘텐츠'(조회수 극대화), 1개는 '키 콘텐츠'(수익화)
2. 각 주제에 대해 반드시 제목/썸네일 아이디어를 먼저 제시 (역순 기획)
3. 주언규 스타일의 자극적이고 구체적인 숫자가 포함된 제목
4. 대중이 무의식적으로 클릭할 수밖에 없는 호기심/공감 요소

## 출력 형식 (JSON):
각 주제에 대해 다음 정보를 포함:
\`\`\`json
[
  {
    "topic_number": 1,
    "content_type": "풀링" 또는 "키",
    "title_ideas": ["제목 아이디어 1", "제목 아이디어 2", "제목 아이디어 3"],
    "thumbnail_concept": "썸네일 구성 아이디어",
    "target_emotion": "타겟 감정 (호기심/공감/불안/욕망 등)",
    "brief_description": "영상 방향 간략 설명",
    "sales_funnel_role": "세일즈 퍼널에서의 역할 설명"
  }
]
\`\`\``;
}
