# 03. 데이터 구조 (Firestore)

## 대원칙
- **공개/비공개는 문서 단위로 분리한다.** Firestore 보안 규칙은 필드 단위로 읽기를 막을 수 없다.
- 공개 데이터는 비공개 원본에서 **Cloud Function이 복사**한다. 클라이언트가 공개 컬렉션에 직접 쓰지 않는다.
- 날짜 키는 `YYYY-MM-DD` (사용자 현지 날짜).

## 컬렉션 구조
```
users/{uid}                         # 비공개: 본인만 읽기/쓰기
  ├─ private/profile                # 생년월일시, 음양력, 성별, 실명(선택), 출생지 시간대
  ├─ private/settings               # 언어, 테마, 공개 범위, 일기 기본 공개, 일기 AI 허용
  ├─ analyses/{type}                # mbti | saju | palm | zodiac | blood | name | face
  ├─ stats/current                  # 10개 스탯, 신뢰도, 분석별 기여도
  ├─ reports/{version}              # AI 종합 보고서 버전별
  ├─ daily/{date}                   # 개인 운세 캐시
  ├─ diary/{date}                   # 한 줄 일기 원본 (공개 여부와 무관하게 여기가 원본)
  ├─ chats/{chatId}/messages/{id}   # AI 대화
  ├─ memory/{id}                    # AI 기억 요약 (사용자 열람·삭제 가능)
  └─ streak/current                 # 연속 출석

publicProfiles/{uid}                # 공개: 로그인 사용자 읽기 / 쓰기는 함수만
publicDiary/{uid}_{date}            # 공개 일기 사본 / 쓰기는 함수만
  └─ hearts/{likerUid}              # 공감
reports_moderation/{id}             # 신고 (P1)

daily/{date}/{lang}/{category}      # 공용 운세 (zodiac | blood | animal | mbti)
dailyMeta/{date}                    # 일진, 음력, 생성 상태
dayMasterDaily/{date}/{lang}/{stem} # 일간 10종 × 오늘 일진 미리 생성분
tojeong/{uid}_{year}                # 토정비결 (본인만)
stats_admin/{date}                  # 어드민 집계
backupPool/{lang}/{category}/{id}   # AI 실패 시 예비 문장

connections/{edgeId}                # 인연선
```

## 주요 문서 예시

### users/{uid}/private/profile
```json
{
  "birthDate": "1990-03-15",
  "calendar": "solar",
  "isLeapMonth": false,
  "birthTime": "14:30",
  "birthTimeUnknown": false,
  "gender": "female",
  "bloodType": "A",
  "birthTimezone": "Asia/Seoul",
  "birthDateChangeCount": 0
}
```

### users/{uid}/diary/{date}
```json
{
  "date": "2026-10-16",
  "text": "오랜만에 바다를 보러 갔다.",
  "mood": "calm",
  "visibility": "private",
  "fortuneSnapshot": { "total": 82, "summary": "협업이 빛나는 날" },
  "createdAt": "...",
  "updatedAt": "..."
}
```
- `visibility`: `private` | `public`
- `mood`: `great` | `good` | `calm` | `low` | `tired` (`[자체 설계]`)
- `fortuneSnapshot`: 작성 시점 운세 요약 저장 (나중에 운세가 재생성돼도 기록 유지)

### publicDiary/{uid}_{date}
```json
{
  "uid": "abc",
  "nickname": "별빛",
  "avatar": "...",
  "date": "2026-10-16",
  "text": "오랜만에 바다를 보러 갔다.",
  "mood": "calm",
  "lang": "ko",
  "heartCount": 3,
  "hidden": false
}
```
**동기화 규칙 (Cloud Function `onDiaryWrite`)**
- 원본 `visibility == public` → 공개 사본 생성/갱신
- `private`로 변경 또는 원본 삭제 → 공개 사본 **즉시 삭제** (하트 포함)
- 신고 누적·어드민 숨김 → `hidden: true` (원본은 유지)
- 생년월일·운세 점수 등 다른 정보는 공개 사본에 넣지 않음

### users/{uid}/stats/current
```json
{
  "stats": { "leadership": 72, "drive": 81, "analysis": 64, "intuition": 77, "creativity": 69,
             "empathy": 58, "sociability": 45, "stability": 52, "adventure": 74, "charisma": 66 },
  "completeness": 70,
  "contributions": { "mbti": 30, "saju": 30, "zodiac": 10 },
  "vector": [0.72, 0.81, 0.64, 0.77, 0.69, 0.58, 0.45, 0.52, 0.74, 0.66],
  "updatedAt": "..."
}
```
- `vector`는 `publicProfiles`에도 복사 (매칭 후보 검색용, 공개 동의 시)

### daily/{date}/{lang}/{category}
```json
{
  "items": {
    "aquarius": {
      "summary": "새로운 제안이 기회로 이어지는 날이에요.",
      "detail": "...",
      "scores": { "total": 82, "love": 70, "money": 65, "work": 90 },
      "lucky": { "color": "teal", "number": 7, "direction": "east", "item": "watch" }
    }
  },
  "source": "ai",
  "generatedAt": "..."
}
```

## 보안 규칙 요지
```
users/{uid}/**            : read, write → request.auth.uid == uid
                            (단 stats, reports, daily, memory 쓰기는 함수만 → 클라이언트 write 금지)
publicProfiles/{uid}      : read → 로그인 사용자 / write → 금지(함수만)
publicDiary/{id}          : read → 로그인 사용자 && hidden == false / write → 금지(함수만)
publicDiary/{id}/hearts/{likerUid} : create/delete → request.auth.uid == likerUid
daily/**, dailyMeta/**    : read → 로그인 사용자 / write → 금지
stats_admin/**, reports_moderation/** : read → admin 클레임
```
- 일기 `text` 길이 100자 이하를 규칙에서도 검사

## 인덱스
- `publicDiary`: `date desc` + `lang`, `hidden`
- `publicProfiles.vector`: 벡터 인덱스 (10차원)
