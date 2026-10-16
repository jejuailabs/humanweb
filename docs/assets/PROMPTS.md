# 생성 기록

모델: Higgsfield `gpt_image_2_5`, quality `medium`, resolution `1k`. 생성일 2026-10-16. 모두 채택.
변환: WebP (배경 900px, 카드 600px, 아이콘 320px 정사각·여백 자동 자르기).

| 파일 (`public/assets/`) | 비율 | job id | 프롬프트 요지 |
|---|---|---|---|
| `bg/home-hero.webp` | 4:5 | c8730e2c-4b47-45a2-a327-1dcc40117f1c | 밤하늘, 오른쪽 위 금빛 초승달, 별자리 선, 보라 성운, 아래 소나무 실루엣 |
| `bg/home-fortune.webp` | 16:9 | dd7a943f-6557-4c98-b6a1-fef3933ae8dc | 달밤 호수, 먼 산, 오른쪽 정자와 등불, 왼쪽은 글자 자리 |
| `bg/today-hero.webp` | 2:3 | 13bf0306-7e35-49fb-ac07-35872a88fa6d | 밤 산수화, 왼쪽 정자, 오른쪽 폭포·호수, 보름달, 금빛 구름 |
| `bg/today-crane.webp` | 4:3 | f2960d6b-50c3-4322-bf04-f5153d5581c1 | 보름달 앞을 나는 학, 금빛 구름, 오른쪽 배치 |
| `bg/today-plum.webp` | 16:9 | 35378bb7-2bbb-45fe-8eb2-996f47196ed9 | 오른쪽에서 들어오는 매화 가지, 옅은 창살 원 |
| `analysis/card-mbti.webp` | 3:4 | d1b7c783-1676-47a0-b98b-c4bee22ba469 | 별로 이루어진 옆얼굴과 초승달 |
| `analysis/card-saju.webp` | 3:4 | 9fcae552-617d-4915-958a-67e19a8706bf | 네 개의 금빛 원과 별, 오행 기호 문장 |
| `analysis/card-palm.webp` | 3:4 | e6fa7f6c-cd0d-4cbd-9b4a-75753fbcc2a3 | 별자리 선이 그려진 빛나는 손바닥 |
| `analysis/hero-moon.webp` | 1:1 | 653f57c6-7b9f-449a-9b61-e0376b607417 | 궤도 고리를 두른 초승달, 보라 구름 |
| `analysis/icon-mbti.webp` | 1:1 | 1c8c08ed-b04d-4036-8157-ce7fbd115f8e | 행성과 궤도 |
| `analysis/icon-saju.webp` | 1:1 | 1fc61d0e-bf00-4c55-bdd4-fc5008b81bbf | 마름모 네 원과 별, 원 테두리 |
| `analysis/icon-palm.webp` | 1:1 | ffcfb5e0-70b6-4912-b0b5-0e1082ac6985 | 보라 선 손바닥, 초승달 |
| `analysis/icon-zodiacBlood.webp` | 1:1 | d3c0a03b-e6da-4051-8c86-f7ed09f53ac1 | 초승달 별자리와 붉은 물방울 |
| `analysis/icon-tojeong.webp` | 1:1 | 81ac1a86-6223-40f9-a871-972fd9b9dad7 | 펼친 책에서 떠오르는 별과 달 |
| `analysis/icon-face.webp` | 1:1 | 53f3cb6e-62d6-4458-9452-124b9076406d | 한 줄로 그린 옆얼굴 |
| `analysis/icon-name.webp` | 1:1 | b6f4a569-f530-426a-a18b-81c9d530b2f9 | 원 안의 육각별, 가운데 별 |

공통 스타일 문구: deep navy (#0B0E1A), violet nebula, warm gold glow, painterly, celestial. 항상 `No text, no letters, no watermark`.

## 메모
- `background: "transparent"` 옵션은 무시됐다(검은 바탕에 흰 빛으로 나옴, job c2424513 폐기). 아이콘은 남색 바탕으로 생성해 원형으로 잘라 쓴다.
- 동시 요청은 4개씩. 12개를 한 번에 보내면 429(rate limit)로 대부분 거절된다(거절분은 과금 없음).
