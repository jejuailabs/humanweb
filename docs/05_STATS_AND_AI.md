# 05. 스탯 · AI 종합 보고서 · AI 대화

> 이 문서의 매핑과 계산식은 모두 `[자체 설계]`다. MBTI·사주·손금을 숫자로 통합하는 공인된 방법은 없다. 일관되고 설명 가능한 것을 목표로 한다.

## 1. 스탯 10개
| key | 이름 | 의미 |
|---|---|---|
| leadership | 리더십 | 방향을 정하고 이끄는 힘 |
| drive | 추진력 | 결정한 걸 밀고 나가는 힘 |
| analysis | 분석력 | 논리적으로 따지고 구조화하는 힘 |
| intuition | 직관력 | 보이지 않는 흐름을 읽는 감각 |
| creativity | 창의성 | 새로운 것을 떠올리는 힘 |
| empathy | 공감력 | 타인의 감정을 헤아리는 힘 |
| sociability | 사교성 | 관계를 넓히는 힘 |
| stability | 안정성 | 꾸준함과 균형을 지키는 힘 |
| adventure | 모험심 | 변화와 도전을 즐기는 성향 |
| charisma | 카리스마 | 존재감과 영향력 |

## 2. 계산
```
stat_k = Σ (w_s × score_{s,k}) / Σ w_s     (s = 완료한 분석)
completeness = Σ w_s (완료한 분석)          (0~100)
```
| 분석 s | 기본 가중치 w_s |
|---|---|
| mbti | 30 |
| saju | 30 |
| palm | 15 |
| zodiac | 10 |
| blood | 5 |
| name | 5 (P2) |
| face | 5 (P2) |

- 결과는 0~100 정수로 반올림, 최소 10 / 최대 95로 클램프 (극단값 방지)
- 분석이 추가·변경될 때만 재계산 (Cloud Function `onAnalysisWrite`)
- 신뢰도 < 40이면 차트 반투명 + "분석을 더 하면 정확해져요"

### 2-1. MBTI → 스탯
입력: 축별 성향 점수 E, N, T, J (0~100). 유형만 입력 시 해당 쪽 70, 반대쪽 30.
| 스탯 | 식 |
|---|---|
| leadership | 0.4E + 0.3T + 0.3J |
| drive | 0.5J + 0.3E + 0.2T |
| analysis | 0.6T + 0.4N |
| intuition | 0.7N + 0.3(100−T) |
| creativity | 0.6N + 0.4(100−J) |
| empathy | 0.7(100−T) + 0.3E |
| sociability | 0.8E + 0.2(100−T) |
| stability | 0.6J + 0.4(100−N) |
| adventure | 0.5(100−J) + 0.3N + 0.2E |
| charisma | 0.6E + 0.4T |

### 2-2. 사주 → 스탯
입력: 팔자 8글자(시간 모름이면 6글자)의 오행 비율 r(목·화·토·금·수, 합 1), 십신 분포.

**기본 점수**: `score_k = 50 + 150 × (Σ 연결 오행 비율 / 연결 오행 수 − 0.2)` → 10~95 클램프
| 스탯 | 연결 오행 |
|---|---|
| creativity, adventure | 목 |
| sociability, charisma | 화 |
| stability | 토 |
| analysis, leadership | 금 |
| intuition, empathy | 수 |
| drive | 목·화 |

**십신 보정** (해당 십신이 2개 이상이면 +8, 0개면 −5)
| 십신 | 보정 스탯 |
|---|---|
| 비겁 | drive |
| 식상 | creativity, sociability |
| 재성 | drive, stability |
| 관성 | leadership, stability |
| 인성 | analysis, intuition, empathy |

### 2-3. 손금 → 스탯
AI 이미지 분석이 아래 특징을 0~100으로 반환 (JSON). 신뢰도 낮은 사진은 재촬영 요청.
| 특징 | 스탯 |
|---|---|
| 두뇌선 길이·선명도 | analysis |
| 두뇌선 곡률(아래로 휨) | creativity, intuition |
| 감정선 선명도·길이 | empathy |
| 운명선 선명도 | drive, stability |
| 생명선 선명도 | stability |
| 태양선 유무 | charisma |
| 손가락 길이 비율 등 | leadership, adventure |
특징이 없는 스탯은 50.

### 2-4. 별자리 → 스탯 (4원소)
| 원소 | +20 | +10 | 나머지 |
|---|---|---|---|
| 불 | adventure, charisma | drive, leadership | 50 |
| 흙 | stability, drive | analysis | 50 |
| 공기 | sociability, analysis | creativity | 50 |
| 물 | empathy, intuition | creativity | 50 |

### 2-6. 관상 → 스탯 `[자체 설계]`
AI가 인상 특징 6개를 0~100으로 반환: 이마(forehead)→analysis, 이마·눈빛 평균→intuition, 눈썹(brows)→leadership, 눈썹·턱 평균→drive, 눈빛(eyes)→empathy, 콧대(nose)→stability, 콧대·턱 평균→charisma, 입꼬리(mouth)→sociability, 턱선(jaw)→adventure, creativity 50.

### 2-7. 이름 → 스탯 `[자체 설계]`
초성 발음오행 비율을 사주 기본 점수 식(2-2, 십신 보정 없음)에 그대로 넣는다.

### 2-5. 혈액형 → 스탯
통속적 성격론 기반, 가중치 최소. A: stability·empathy +10 / B: creativity·adventure +10 / O: leadership·sociability +10 / AB: analysis·intuition +10. 나머지 50.
> 혈액형 성격론은 과학적 근거가 없다는 점을 상세 화면에 짧게 고지.

## 3. AI 종합 보고서
- **생성 시점**: 분석 추가/변경 후 스탯 재계산 완료 시 → `reports/{version}`
- **입력**: 스탯, 신뢰도, 분석별 요약 (MBTI 유형·축 점수, 사주 일간·오행 분포·십신, 손금 특징, 별자리, 혈액형). 생년월일 원본·실명 제외.
- **구성 (JSON 섹션)**
  1. `title` 한 줄 타이틀
  2. `identity` 핵심 정체성 3~4문장
  3. `strengths[3]` 상위 스탯 + 근거
  4. `growth[2]` 성장 포인트 (약점이 아니라 "이렇게 하면 더 빛나는")
  5. `workStyle` 일하는 방식
  6. `relationStyle` 친구·동료·연인 관계
  7. `goodMatch` 잘 맞는 유형 (네트워크 단계와 연결)
  8. `crossInsights[]` **체계 간 일치와 차이** — 서비스 차별점
     예) "MBTI는 내향형인데 사주는 화(火)가 강해요. 평소엔 조용하지만 확신 있는 주제에선 강하게 드러나는 타입일 수 있어요."
- 이전 버전 열람 가능 ("나는 이렇게 선명해졌다")
- 일기 반영: `diaryForAI == true`일 때만 최근 30일 일기 요약을 참고 (P2)

## 4. 나를 아는 AI 대화 (P1)
### 컨텍스트 (매 요청 시스템 프롬프트에 포함)
```
[사용자 프로필 요약]
닉네임, 언어
스탯 10개 + 신뢰도
MBTI 유형, 사주 일간·오행 분포 요약, 별자리, 혈액형, 손금 요약
최신 보고서: title, identity, strengths, growth
오늘의 운세: 총운, 요약, 데일리 스탯 보정
[기억] memory 상위 N개 (최근·중요도순)
[일기] diaryForAI == true 일 때만 최근 7일 한 줄
```
**넣지 않는 것**: 생년월일 원본, 태어난 시간, 실명, 사진, 비공개 설정된 원본 데이터

### 기억
- 대화 종료(또는 N턴마다) → AI가 "기억할 만한 사실" 1~3개 요약 → `memory/{id}` (`text`, `createdAt`, `importance`)
- 사용자는 "AI 기억" 화면에서 전체 보기·개별 삭제·전체 삭제
- 삭제된 기억은 다음 대화부터 반영 안 됨

### AI 대화 규칙 (시스템 프롬프트)
- YEON의 말투 (존댓말, 따뜻하고 담백)
- 프로필을 근거로 맞춤 조언하되, 단정하지 말고 제안형으로 ("~해보는 건 어때요")
- 건강·사고·수명·투자 결과를 예언하지 않음
- 중요한 결정(퇴사, 이별, 투자 등)을 대신 내리지 않음. 생각 정리를 돕는 역할
- 위기 신호(자해·극단적 생각 등) 감지 시: 공감 → 전문 도움·상담 기관 안내 (언어·국가별 연락처 목록은 `[확인 필요]`)
- 운세·성향 분석은 재미와 자기 탐색용임을 필요 시 자연스럽게 언급

### 제한
- 하루 대화 횟수 제한 (초기값 20회 `[자체 설계]`, 어드민에서 조정). 유료 연계 `[나중에]`
- 대화 컨텍스트 길이 제한: 최근 20턴 + 요약

### 예시
> 나: 요즘 일이 손에 안 잡혀요.
> AI: 추진력은 높은데 안정성이 낮은 편이라, 목표가 흐려지면 에너지가 빨리 꺼지는 타입일 수 있어요. 지난번에 말씀하신 이직 고민 때문일까요? 오늘은 직관력이 올라가는 날이니, 떠오르는 걸 그냥 적어보는 것부터 해보면 어때요?
