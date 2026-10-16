# 07. 다국어와 테마

## 다국어
- 라이브러리: next-intl. 주소: `/ko/...`, `/en/...`
- 초기 언어: **ko, en** (P0). ja, zh는 `[미정]`
- 첫 접속: 기기 언어 → 지원 언어면 선택, 아니면 en
- 모든 UI 문구는 `/messages/{lang}.json`. 컴포넌트에 문자열 금지
- 날짜·숫자 포맷은 Intl API 사용

### 콘텐츠 원칙
- **운세·보고서·대화는 번역하지 않고 언어별로 생성.** 점수·재료는 공통, 문장만 언어별
- 용어집(`00_OVERVIEW.md`)을 모든 프롬프트에 주입
- 언어권별 데일리 탭 순서 설정
| 언어 | 기본 탭 순서 `[자체 설계]` |
|---|---|
| ko | 내 운세, 별자리, 띠, 혈액형, MBTI |
| en | Zodiac, MBTI, My Fortune, Animal, Blood |
- 공개 일기 피드는 기본적으로 **내 언어의 일기만** 노출 (설정에서 전체 보기 가능)

### 시간대
- 데일리 콘텐츠 "오늘" = 사용자 기기 현지 날짜
- 일진은 날짜 기준이므로 같은 날짜면 동일
- 사주 계산 시 출생지 시간대 반영 방식(진태양시 보정 여부) `[미정]` `[확인 필요]` — 명리학 내부에서도 견해가 갈림. 정한 기준을 사주 상세 화면에 명시
- 구현 기준(2026-10-16): 진태양시 보정 안 함, 자시는 23시부터 다음 날 일주, 절기 기준 월주·입춘 기준 연주, 띠는 설날 기준 `[자체 설계]` (`lib/saju`)

## 테마
- 모드: `system`(기본) | `light` | `dark`. 설정은 `private/settings` + localStorage(로그인 전)
- 구현: `<html data-theme>` + CSS 변수. Tailwind는 변수를 참조

### 색상 토큰 (초안)
| 토큰 | Dark | Light | 용도 |
|---|---|---|---|
| `--bg` | #0B0E1A | #FAF7F0 | 배경 |
| `--surface` | rgba(255,255,255,0.06) | rgba(255,255,255,0.75) | 글래스 카드 |
| `--border` | rgba(255,255,255,0.10) | rgba(20,20,40,0.08) | 테두리 |
| `--text` | #ECEAF6 | #1C1A2E | 본문 |
| `--text-muted` | #9A97B5 | #6B6880 | 보조 |
| `--primary` | #8B7CF6 | #6D5AE6 | 보라 포인트 |
| `--gold` | #E8C468 | #B8912F | 완료·강조 |
| `--fate-red` | #FF4D5E | #E0283B | **특별한 인연·빨간 선 전용** |
| `--line-strong` | rgba(232,196,104,0.9) | rgba(184,145,47,0.9) | 진한 선 |
| `--line-faint` | rgba(255,255,255,0.18) | rgba(28,26,46,0.15) | 흐린 선 |

- 명도 대비 WCAG AA 확인 `[확인 필요]` (특히 라이트 모드 골드 텍스트)
- `--fate-red`는 다른 용도(에러 등)에 쓰지 않는다. 에러는 별도 `--danger`
- 구현에서 추가한 토큰 (값은 `app/globals.css`):
  - 면·선: `--bg-deep`, `--surface-strong`, `--border-strong`, `--track`(막대 바탕), `--nav-bg`
  - 강조: `--primary-deep`, `--gold-soft`, `--on-accent`(보라·빨강 채움 위 글자), `--danger`
  - 빛: `--glow`, `--glow-gold`, `--glow-violet`, `--star`, `--nebula`
  - 점수 막대: `--love`, `--money`, `--work` / 오행: `--wood`, `--fire`, `--earth`, `--metal`, `--water`
- Tailwind 색 이름: `bg`, `surface`, `surface-strong`, `border`, `border-strong`, `text`, `muted`, `primary`, `primary-deep`, `gold`, `gold-soft`, `fate-red`, `danger`, `on-accent`, `nav`, `track`
- 공통 클래스: `.starfield`(별가루 배경), `.glass`(글래스 카드), `.glass-gold`·`.glass-violet`(빛나는 테두리)

### 글꼴
| 용도 | 글꼴 | Tailwind |
|---|---|---|
| 로고 | Cinzel | `font-logo` |
| 제목·숫자 | Cormorant Garamond(라틴) + Noto Serif KR(한글) | `font-display` |
| 본문 | Noto Sans KR | 기본 |

- Google Fonts를 `<link>`로 불러온다. `next/font/google`은 Next 16.4 Turbopack(Windows)에서 빌드가 실패해 쓰지 않는다.
