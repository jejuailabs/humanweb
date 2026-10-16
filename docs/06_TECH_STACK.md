# 06. 기술 스택과 환경

## 스택
| 영역 | 선택 | 비고 |
|---|---|---|
| 프론트 | Next.js (App Router) + TypeScript | PWA, 모바일 우선 |
| 배포 | Vercel | |
| 인증 | Firebase Auth | 구글·애플 기본, 카카오는 커스텀 토큰 `[확인 필요]` |
| DB | Cloud Firestore | 공개/비공개 문서 분리 |
| 파일 | Firebase Storage | 손금 사진 (본인만, 분석 후 삭제 기본) |
| 서버 로직 | Cloud Functions (2세대) | 스케줄러, 트리거, AI 호출 |
| AI | Gemini (Firebase AI Logic / Vertex AI) 또는 Claude·GPT API | 모델 선정 `[미정]`. 어떤 경우든 서버에서 호출 |
| 다국어 | next-intl | |
| 스타일 | Tailwind CSS + CSS 변수 토큰 | `07_I18N_THEME.md` |
| 차트 | Recharts (레이더) | |
| 네트워크 그래프 | react-force-graph 또는 sigma.js (WebGL) | 선정 `[미정]` |
| 분석 | GA4 (+ BigQuery 연동 `[나중에]`) | |
| 만세력 | 라이브러리 선정 `[확인 필요]` | 정확도 검증 필수 (테스트 케이스: 절기 경계일, 윤달, 자시) |

## 폴더 구조
```
/app
  /[locale]
    /(main)
      /page.tsx              홈(종합 대시보드)
      /today/page.tsx        데일리 대시보드
      /today/[date]/page.tsx 지난 날짜
      /analyze/...           분석 허브·각 분석
      /map/page.tsx          네트워크 지도
      /diary/page.tsx        한 줄 일기장
      /diary/explore/page.tsx 공개 일기 둘러보기
      /chat/page.tsx         AI 대화
      /me/...                마이페이지·설정
    /onboarding/...
    /admin/...               어드민 (admin 클레임 필요)
/components
  /ui                        버튼, 카드 등 기본
  /charts                    레이더, 점수 링
  /diary                     일기 입력 시트, 달력, 피드 카드
/lib
  /firebase                  클라이언트 초기화
  /saju                      만세력·일진·십신 계산 (순수 함수, 테스트 필수)
  /stats                     스탯 계산 (순수 함수, 05 문서 식 그대로)
  /fortune                   시드 점수, 키워드 풀
/messages                    ko.json, en.json ...
/i18n                        next-intl 라우팅·요청 설정 (언어는 next/root-params로 결정)
/proxy.ts                    언어 감지·리다이렉트 (Next.js 16: middleware → proxy)
/functions
  /src
    generateDaily.ts         매일 00:00 KST
    onAnalysisWrite.ts       스탯·보고서 재계산
    onDiaryWrite.ts          공개 일기 동기화
    chat.ts                  AI 대화 (callable)
    palm.ts                  손금 분석 (callable)
    aggregateStats.ts        어드민 집계 (매일)
    /prompts                 프롬프트 템플릿 (언어 공통 + 용어집)
    /validators              JSON 스키마, 금지어 사전
/firestore.rules
/storage.rules
```

## 환경 분리
- Firebase 프로젝트 2개: `yeon-dev`, `yeon-prod`
- Vercel: Preview → dev, Production → prod
- 비밀값: AI API 키는 Functions 시크릿(Secret Manager). Next.js 클라이언트 환경변수에 절대 넣지 않음

## 테스트 필수 대상
- `/lib/saju`: 알려진 날짜의 일진·팔자 정답표와 대조
- `/lib/stats`: 05 문서 표의 입력→출력 예시
- `firestore.rules`: 에뮬레이터로 공개/비공개 접근 테스트 (특히 일기)

## PWA 제약
- iOS 웹 푸시는 홈 화면 추가 후에만 동작 (iOS 16.4+) `[확인 필요]`
- 카메라(손금)는 getUserMedia로 가능하나 초점·조명 제어 한계 → 반응이 좋으면 Capacitor/Expo 전환 검토
