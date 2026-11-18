---
title: '연타 테스트를 사람 대신: WDA 와 Semantics ID 로 실기기 QA'
author: jack
date: 2026. 11. 18.
published: false
description: 'Flutter 앱을 실기기 iPhone 에서 AI 에이전트가 직접 조작하게 만들고, 접근성 트리에 ID 를 붙여 비용을 줄이고, 40ms 간격 연타까지 재현한 기록이에요.'
tags: [Flutter, iOS, QA, WebDriverAgent, Accessibility, AI]
---

## 들어가며: 실기기 확인만 사람 손에 남아 있었다

저는 Flutter 로 웰니스 앱을 만들고, 서버(Django·FastAPI)까지 맡고 있어요. 코드는 대부분 Claude Code 같은 AI 에이전트와 함께 써요. 테스트 작성, 빌드, 로그 분석까지 에이전트에게 넘겼는데, **마지막까지 사람 손에 남은 일이 실기기 확인**이었어요. 폰을 들고 화면을 눌러 보는 일이요.

특히 귀찮은 게 **연타 확인**이었어요. 「구매 버튼을 빠르게 세 번 눌러도 코인이 한 번만 빠지는가」 같은 확인이에요. 사람이 손으로 하면 누를 때마다 간격이 다르고, 결과를 기록하는 것도 일이에요. [지난 글](/posts/bloc_concurrency_refactor)에서 BLoC 의 연타 방지 코드를 49곳 옮겼는데, 이걸 손으로 전부 눌러 볼 수는 없었어요.

그래서 **에이전트가 실기기 iPhone 을 직접 조작하게** 만들었어요. 이 글은 그 과정에서 바뀐 판단 세 가지를 따라가요.

- 에이전트에게 화면을 주면 **스크린샷을 읽느라 비용이 커져요.** 접근성 트리에 ID 를 붙여 이걸 줄였어요. 그런데 ID 만 붙여서는 에이전트가 거의 쓰지 않았어요.
- **탭을 세 번 부르는 건 연타가 아니었어요.** 요청 하나에 탭 세 번을 담아야 했어요.
- 실기기는 **같은 에러 문구로 다른 원인**을 숨겨요. Xcode 버전 차이가 그랬어요.

이런 분께 도움이 될 거예요.

- AI 에이전트에게 모바일 앱 QA 를 맡겨 보고 싶은데, 시뮬레이터가 아니라 **실기기**에서 하고 싶은 분
- Flutter 앱의 접근성 트리가 실제로 어떻게 보이는지 궁금한 분
- 연타·중복 요청 방지 코드를 사람 손 없이 확인하고 싶은 분

## 배경: WDA 는 기기 안에서 도는 HTTP 서버다

iOS 실기기를 바깥에서 조작하는 방법은 생각보다 적어요. 제가 써 본 것들을 먼저 정리할게요.

| 방법 | 할 수 있는 것 | 이번에 안 맞았던 점 |
|---|---|---|
| Dart VM Service | 위젯 트리·렌더 트리 덤프, 예외 읽기 | **탭·스크롤 같은 입력은 넣을 수 없어요.** Android 는 `adb shell input tap` 으로 우회하지만 iOS 실기기는 우회 수단이 없었어요 |
| Patrol (Flutter E2E) | Dart 로 쓴 통합 테스트를 실기기에서 실행 | iOS 는 Xcode 에서 UI 테스트 타깃을 **손으로** 만들어야 해요. PoC 를 그 단계에서 멈춰 뒀어요 |
| WebDriverAgent(WDA) | 기기 안에서 HTTP 서버를 띄우고 탭·스와이프·스크린샷·접근성 트리를 제공 | — |

WDA 는 Appium 프로젝트가 관리하는 XCTest 기반 서버예요. `xcodebuild test` 로 기기에 러너를 올리면, 기기 안에서 8100 포트로 HTTP 요청을 받아요. 그래서 **curl 만 있으면 기기를 조작**할 수 있어요.

```bash
# 한 번: WDA 러너를 기기에 올리고 띄워 둔다
git clone --depth 1 https://github.com/appium/WebDriverAgent.git ~/WebDriverAgent
xcodebuild -project ~/WebDriverAgent/WebDriverAgent.xcodeproj -scheme WebDriverAgentRunner \
  -destination 'platform=iOS,id=(기기 UDID)' -allowProvisioningUpdates \
  DEVELOPMENT_TEAM=(서명 팀) CODE_SIGN_STYLE=Automatic \
  PRODUCT_BUNDLE_IDENTIFIER=com.example.qa.WebDriverAgentRunner test
```

기기와 Mac 이 같은 Wi-Fi 에 있으면 `http://(기기 IP):8100` 으로 바로 붙어요. USB 로 붙이려면 go-ios 의 터널(`ios tunnel start --userspace`)과 포트 포워드(`ios forward 8100 8100`)를 띄워 두면 돼요. 이 둘의 차이가 뒤에서 한 번 중요해져요.

> 처음 출발점은 mobile-mcp 를 기준으로 쓴 QA 킷이었어요. 이 저장소에서는 mobile-mcp 대신 WDA 를 직접 감싼 셸 스크립트로 바꿨어요. [확인 필요: mobile-mcp 대신 WDA 직접 호출을 고른 이유]

## 도구: 명령 여덟 개짜리 셸 스크립트

에이전트에게 줄 도구는 일부러 작게 만들었어요. `ios_qa.sh` 하나에 `status`·`restart`·`shot`·`tree`·`tap`·`swipe`·`type`·`home` 이 전부예요. 사람이 폰을 만질 때 하는 일(보고, 누르고, 밀고, 치고)만 있어요.

탭은 WDA 의 탭 API 를 한 번 부르는 게 전부예요.

```bash
post() { curl -sf -m 60 -X POST "$WDA$1" -H 'Content-Type: application/json' -d "${2:-{\}}"; }

case "$cmd" in
  tap)
    sid=$(session)
    post "/session/$sid/wda/tap" "{\"x\":${1:?X},\"y\":${2:?Y}}" >/dev/null
    echo "tapped ($1,$2)"
    ;;
```

핵심은 `tree` 예요. WDA 의 `/source` 가 돌려주는 접근성 트리를 걸러서, 에이전트가 읽기 좋은 한 줄 목록으로 바꿔요.

```python
# ios_qa.sh tree — WDA /source?format=json 을 한 줄 목록으로 (줄임)
def walk(node):
    ident = node.get("rawIdentifier") or ""
    label = (node.get("label") or "").replace("\n", " / ")
    kind = node.get("type", "").replace("XCUIElementType", "")
    if visible and (ident or label):
        cx = round(rect["x"] + rect["width"] / 2); cy = round(rect["y"] + rect["height"] / 2)
        rows.append(f"{kind:<12} id={ident or '-':<34} center=({cx},{cy}) label=\"{label[:80]}\"")
    for child in node.get("children") or []:
        walk(child)
```

여기서 볼 건 `id=` 열이에요. 접근성 요소에 identifier 가 있으면 여기에 나와요. 에이전트는 이 목록에서 요소를 찾고, `center` 좌표를 `tap` 에 넘겨요.

처음엔 Flutter 앱의 접근성 트리를 WDA 가 읽으려면 앱 쪽에서 시맨틱스를 강제로 켜야 할 줄 알았어요. 그런데 실기기에서 해 보니 **플래그 없이도 WDA 가 트리를 조회하면 Flutter 시맨틱스가 켜졌어요.** 앱 코드는 건드릴 필요가 없었어요.

앱은 **profile 빌드**로 설치했어요. debug 빌드는 디버거 없이 다시 띄울 수 없어서, 회차마다 `restart` 로 앱을 새로 띄워야 하는 측정에 맞지 않았어요.

## 에이전트는 트리 대신 스크린샷을 읽고 있었다

도구를 주고 시나리오 세 개를 돌려 봤어요. 결과는 통과였어요. 그런데 에이전트가 일하는 모습을 보니 이상했어요. **탭할 때마다 스크린샷을 찍고 이미지를 읽고 있었어요.** 이미지를 읽을수록 턴과 토큰이 늘어요.

이유는 트리에 있었어요. 챌린지 알람 설정 화면의 트리예요.

```text
StaticText   id=-        center=(196,84)  label="챌린지 알람"
StaticText   id=-        center=(166,178) label="알람 받기"
StaticText   id=-        center=(196,232) label="요일"
Button       id=-        center=(56,268)  label="월"
...
Button       id=-        center=(196,782) label="저장하기"
```

여기서 볼 건 **「알람 받기」 토글이 없다**는 거예요. 글자만 있고 스위치는 트리에서 사라졌어요. 뒤로가기 버튼도 없어요. 에이전트는 트리로 찾을 수 없으니 스크린샷에서 스위치 위치를 눈으로 추정할 수밖에 없었어요.

다른 화면은 반대로 **너무 많이 합쳐져** 있었어요. 챌린지 상세의 인증 규칙 카드는 카드 전체가 버튼 하나였어요. 라벨에 규칙 문장이 전부 들어가 있었고, 그 안의 「인증 규칙 자세히」 링크는 따로 잡히지 않았어요.

원인은 공용 탭 위젯이었어요. 이 화면들의 탭 영역은 모두 `SocialTapTarget` 을 거쳐 맨 `GestureDetector` 로 끝나는데, 이 위젯은 **접근성 노드 경계를 만들지 않아요.** 그래서 탭 영역이 주변 글자와 한 덩어리가 되거나, 직접 그린 스위치처럼 아예 트리에서 빠졌어요.

이건 QA 도구만의 문제가 아니었어요. **VoiceOver 도 같은 트리를 읽어요.** 에이전트가 못 찾는 버튼은 화면 낭독기 사용자도 못 찾는다는 뜻이었어요.

## Semantics ID 붙이기: 레이아웃은 그대로, 트리만 바꾼다

그래서 시나리오가 지나는 화면에 **접근성 노드와 identifier** 를 붙였어요. Flutter 의 `Semantics` 위젯에는 `identifier` 속성이 있고, iOS 에서는 이게 `accessibilityIdentifier` 로 나가요. WDA 트리의 `id=` 열에 보이는 값이 이거예요.

붙이는 코드는 래퍼 하나로 통일했어요.

```dart
/// Semantics identifier 를 붙이는 공통 래퍼 — 접근성 트리만 바꾸고 레이아웃·동작은 바꾸지 않는다.
class TestId extends StatelessWidget {
  const TestId(this.id, {required this.child, this.merge = true, this.label, super.key});

  final String id;
  final Widget child;
  final bool merge;
  final String? label;

  @override
  Widget build(BuildContext context) {
    if (merge) return MergeSemantics(child: Semantics(identifier: id, label: label, child: child));
    return Semantics(identifier: id, label: label, container: true, explicitChildNodes: true, child: child);
  }
}

extension TestIdX on Widget {
  Widget semId(SemId id, {bool merge = true, String? label}) =>
      TestId(id.value, merge: merge, label: label, child: this);
}
```

여기서 볼 건 `merge` 하나예요. 이 글에서는 두 경우를 이렇게 부를게요.

- **누를 대상이 하나인 요소**(버튼, 토글)는 `merge: true` 예요. `MergeSemantics` 가 자식의 라벨과 역할을 한 노드로 합쳐요. 이 `MergeSemantics` 가 그동안 없던 **노드 경계** 역할을 해서, 카드 안 링크가 카드에서 떨어져 나와요.
- **안에 다른 탭 대상이 있는 컨테이너**(카드, 시트, 화면 전체)는 `merge: false` 예요. 여기서 합쳐 버리면 **안쪽 버튼이 트리에서 사라져요.** 처음 문제를 반대 방향으로 다시 만드는 셈이에요.

알람 화면에는 이렇게 붙였어요.

```dart
Semantics(
  toggled: _isEnabled,
  child: BasicSwitch(value: _isEnabled, onChanged: _onToggle),
).semId(ChallengeAlarmIds.enabledToggle, label: Lang.get('social_challenge_alarm_enable')),
// ...
).semId(ChallengeAlarmIds.saveButton),
// ...
).semId(ChallengeAlarmIds.screen, merge: false);
```

같은 화면의 트리가 이렇게 바뀌었어요.

```text
Other        id=challenge_alarm_screen          center=(196,426)
Button       id=common_back_button              center=(28,84)
StaticText   id=-                               center=(166,178) label="알람 받기"
Switch       id=challenge_alarm_enabled_toggle  center=(327,178) label="알람 받기"
...
Button       id=challenge_alarm_save_button     center=(196,782) label="저장하기"
```

**스위치와 뒤로가기가 트리에 나타났어요.** 화면에 보이는 것은 하나도 바뀌지 않았어요. 문구, 레이아웃, 동작은 그대로고, 접근성 트리만 바뀌었어요.

ID 는 화면별 클래스에만 정의했어요. 이름은 `{화면}_{요소}_{역할}` 소문자 스네이크 케이스로 정했고, ID 마다 **에이전트가 읽을 한국어 설명**을 붙였어요.

```dart
static const enabledToggle = SemId(
  'challenge_alarm_enabled_toggle',
  '「알람 받기」 켜기/끄기 토글. 켜짐 여부는 toggled(value) 로 읽힌다. 끄면 요일·시간 영역이 흐려지고 눌리지 않는다',
);
```

이 정의에서 Markdown 카탈로그(`docs/qa/semantic_ids.md`)를 생성하는 스크립트도 만들었어요. 이 카탈로그가 뒤에서 결정적인 역할을 해요.

## 측정: ID 만 붙여서는 쓰지 않았다

효과를 감으로 말하고 싶지 않아서 측정했어요. 조건은 세 가지였어요.

| 조건 | 앱 | 에이전트 프롬프트 |
|---|---|---|
| before | identifier 0개 | 시나리오만 |
| after_tree | identifier **38개**(시나리오 화면) | before 와 같음 |
| after_docs | after_tree 와 같은 빌드 | + 카탈로그의 identifier 로 찾으라는 **한 줄** |

시나리오는 세 개예요. A 는 챌린지 상세에서 「인증 규칙 자세히」 열기, B 는 알람 끄고 켜기, C 는 챌린지 개설 중 종류 바꾸기예요. 조건·시나리오마다 5회씩, 모두 45회를 돌렸어요. 에이전트는 `claude -p` 로 띄우고 모델을 고정했어요(`claude-sonnet-5-5`). 허용 도구는 `ios_qa.sh` 와 이미지 읽기뿐이에요. 회차마다 앱을 재시작하고 화면을 녹화했어요.

after_docs 에 넣은 한 줄은 이거예요.

```text
- UI 요소는 docs/qa/semantic_ids.md 의 identifier(tree 의 id= 열)로 찾는다. 화면 문구나 스크린샷 좌표 추정보다
  우선한다. 스크린샷은 identifier 로 판정할 수 없는 시각적 확인이 필요할 때만 쓴다.
```

결과는 회차 중앙값이에요(2026-11-06, iPhone 15, Wi-Fi 연결 WDA). 비용은 에이전트 실행의 API 요금이에요.

| 시나리오 | 지표 | before | after_tree | after_docs |
|---|---|---:|---:|---:|
| A | 비용 | $0.259 | $0.207 | **$0.202** (−22%) |
| | 소요 시간 | 93.9초 | 80.9초 | **79.4초** (−15%) |
| | 턴 수 | 22 | 17 | **14** |
| | 스크린샷 보기 | 10 | 3 | **1** |
| B | 비용 | $0.280 | $0.191 | **$0.172** (−39%) |
| | 소요 시간 | 81.9초 | 73.4초 | **69.0초** (−16%) |
| | 턴 수 | 26 | 16 | **15** |
| | 스크린샷 보기 | 12 | 2 | **1** |
| C | 비용 | $0.213 | $0.228 | $0.221 (+4%) |
| | 소요 시간 | 91.1초 | 93.1초 | 97.7초 (+7%) |
| | 턴 수 | 18 | 19 | 17 |
| | 스크린샷 보기 | 1 | 1 | 0 |

이 표에서 볼 건 세 가지예요.

첫째, **성공률은 처음부터 문제가 아니었어요.** 세 조건 45회가 모두 통과했어요. 차이는 정확도가 아니라 **비용과 시간**에서 났어요.

둘째, **효과는 트리에서 요소가 안 보이던 화면(A·B)에만 있었어요.** 스크린샷 보기가 10회·12회에서 1회로 줄었어요. C 는 선택지가 원래부터 라벨이 붙은 버튼으로 트리에 잘 보이던 화면이라, ID 를 붙여도 달라지지 않았어요. +4%·+7% 는 회차 사이 편차 범위로 봤어요.

셋째가 제 가정을 깼어요. 저는 **ID 를 붙이면 에이전트가 알아서 쓸 줄** 알았어요. 그런데 after_tree 에서 에이전트가 ID 로 검색한 횟수는 회차당 0~5번이었고, C 에서는 0번이었어요. **카탈로그 안내 한 줄을 넣자 15회 모두 카탈로그를 먼저 읽고, 회차당 3~14번 ID 로 요소를 찾았어요.**

비용 차이가 어디서 나는지는 회차별 전략을 보면 보여요. 에이전트는 회차마다 「스크린샷만 보며 진행」(S)과 「트리 위주」(T) 중 하나로 갈렸어요.

| 조건 | A | B | C |
|---|---|---|---|
| before | SSSST | TTSSS | TTTTT |
| after_tree | TTTST | TTTTT | TTTTT |
| after_docs | TTTTT | TTTTT | TTTTT |

before 의 A·B 는 10회 중 7회가 S 였어요. S 회차는 탭마다 캡처를 찍어 이미지를 읽으니 턴과 토큰이 늘어요. **비용 차이의 대부분은 이 비율에서 나왔어요.**

이 측정에는 한계가 있어요.

- **표본이 작아요.** 조건·시나리오마다 5회예요.
- before 에서 S 와 T 가 갈린 건 ID 와 상관없이 일어났어요. after_tree 에서 T 가 늘어난 게 ID 덕인지 우연인지는 이 표본으로 가를 수 없어요. after_docs 는 안내 문구가 T 를 직접 유도해요.
- **탭은 여전히 좌표예요.** `ios_qa.sh` 에 ID 로 탭하는 명령이 없어서, ID 로 찾은 요소의 중심 좌표를 다시 탭해요.

## 연타: tap 을 세 번 부르는 건 연타가 아니다

측정 뒤 열흘쯤 지나서 이 도구를 다시 꺼냈어요. [BLoC 연타 방지 코드를 옮긴 PR](/posts/bloc_concurrency_refactor)을 실기기에서 확인하려고요. 확인할 건 두 가지였어요. **요청이 진행 중일 때 연타해도 요청이 한 번만 처리되는가**, 그리고 **끝난 뒤에는 다시 눌리는가(먹통이 아닌가)**.

처음엔 `tap` 을 세 번 부르면 되는 줄 알았어요. 그리고 연타가 요청 진행 중에 들어가지 않을까 봐, 기기의 Network Link Conditioner 로 네트워크를 일부러 느리게 만들 생각까지 했어요.

그런데 느린 건 WDA 가 아니라 **스크립트 구조**였어요. 지금 `tap` 은 탭 한 번마다 HTTP 요청을 한 번 보내요. 탭마다 HTTP 왕복과 XCTest 처리 시간이 쌓이니, 두 번째 탭이 들어갈 때쯤엔 첫 요청이 이미 끝나 있을 수 있어요. [확인 필요: `tap` 한 번의 왕복 시간 실측값] 그러면 연타를 해도 가드가 시험되지 않아요.

WDA 는 W3C WebDriver 표준의 actions API(`POST /session/{id}/actions`)를 지원해요. 손가락 하나의 움직임을 **누르기·쉬기·떼기의 순서로 한 요청에 담아** 보내면, 기기 안에서 그 순서대로 실행돼요. 그래서 `multitap` 명령을 하나 더했어요.

```bash
  multitap)  # multitap X Y [N=3] [GAP_MS=40] — W3C actions 한 요청으로 N번 연타
    sid=$(session)
    body=$(python3 -c '
import json,sys
x,y,n,gap=int(float(sys.argv[1])),int(float(sys.argv[2])),int(sys.argv[3]),int(sys.argv[4])
acts=[{"type":"pointerMove","duration":0,"x":x,"y":y}]
for i in range(n):
    acts+=[{"type":"pointerDown","button":0},{"type":"pause","duration":20},{"type":"pointerUp","button":0}]
    if i<n-1: acts.append({"type":"pause","duration":gap})
print(json.dumps({"actions":[{"type":"pointer","id":"finger","parameters":{"pointerType":"touch"},"actions":acts}]}))
' "${1:?X}" "${2:?Y}" "${3:-3}" "${4:-40}")
    post "/session/$sid/actions" "$body" >/dev/null
    echo "multitapped ($1,$2) x${3:-3} gap ${4:-40}ms"
    ;;
```

여기서 볼 건 `pause` 두 개예요. 한 번 누르고 20ms 뒤에 떼고, 40ms 쉬고 다시 눌러요. 탭 사이 간격이 HTTP 왕복이 아니라 **기기 안의 타이밍**으로 정해져요. Network Link Conditioner 는 필요 없었어요.

에이전트에게 준 지침은 짧았어요. 연타 확인은 반드시 `multitap` 으로 하고, 직전·직후 시각을 적고, 실제 결제 시트가 뜨면 즉시 취소하라고요. 시나리오별로 **PASS 기준을 화면에서 판정할 수 있는 형태**로 썼어요. 예를 들면 「코인이 1개 가격만큼만 줄고, 아이템이 1개만 늘었다. 이어서 일반 `tap` 하면 다시 구매된다」예요.

결과는 이랬어요(2026-11-17, iPhone 15, dev profile 빌드, 3연타·40ms).

| 흐름 | 결과 | 화면에서 본 것 |
|---|---|---|
| 아이템 구매 | PASS | 3연타에 코인 100 만 차감, 보유 1개. 이어서 일반 탭으로 다시 구매됨 |
| 팀 자동 배정 | PASS | 배정 1회, 모달 1회 닫힘, 완료 토스트 1개 |
| 댓글 게시 | PASS | 댓글 1개, 입력칸 비워짐. 이어서 일반 전송 정상 |
| DM 전송 | PASS | 메시지 1개. 이어서 일반 전송 정상 |
| 걸음 상세 과거 그래프 더 보기 | PASS | 빠르게 넘겨 과거 끝까지 이어 불러옴, 날짜 중복·남은 로딩 없음 |
| 러닝 시작 | PASS | 카운트다운 1회, 기록 화면 1개, 시간이 1초씩 정상 증가 |
| 루틴 편집 저장 | PASS | 편집 화면이 **한 번만** 닫히고 홈으로 복귀 |

마지막 줄은 특히 의미가 있었어요. 루틴 편집 저장은 예전에 **저장 요청이 두 번 나가 화면을 두 번 닫다가 크래시**가 난 곳이에요. 그 경로가 실기기에서 재현되지 않았어요.

다만 이 판정에는 한계가 있어요. **요청 횟수를 직접 세지는 못했어요.** 앱 안의 네트워크 로그는 개발자 화면에서 켜는데, 이 화면은 debug 빌드거나 서버에 등록된 테스트 기기에서만 열려요. profile 빌드에서는 열리지 않았어요. 그래서 판정은 코인, 개수, 토스트 같은 **화면 결과** 기준이에요. 그리고 팀 목록 더 보기, 체중·수면 상세 더 보기는 테스트 계정에 데이터가 모자라 확인하지 못했어요.

## 실기기가 거는 함정들

도구보다 시간이 더 든 건 실기기 쪽이었어요. 겪은 순서대로 적을게요.

### 같은 에러 문구, 다른 원인: automation mode 타임아웃

WDA 러너를 띄우다 `Timed out while enabling automation mode` 로 실패했어요. 이 문구는 처음 보는 게 아니었어요. 재부팅 뒤 **기기가 잠겨 있거나, 설정 > 개발자 > UI 자동화가 꺼져 있을 때** 나는 에러로 기록해 뒀거든요.

그래서 기록대로 했어요. 잠금을 풀고, 자동 잠금을 「안 함」으로 바꾸고, UI 자동화를 껐다 켰어요. **세 번 연속 같은 에러**가 났어요.

그제야 버전을 비교했어요.

```bash
xcodebuild -version                                  # 로컬 Xcode
xcrun devicectl device info details --device (UDID) | grep osVersionNumber   # 기기 iOS
```

| | Xcode 26.3 으로 WDA |
|---|---|
| iPhone 16 (iOS 27.0.1) | 며칠 전 정상 동작 |
| iPhone 15 (iOS 27.2.1) | automation mode 타임아웃 3회 |

**기기 iOS 가 로컬 Xcode 보다 새로웠어요.** Xcode 를 27.2 로 올리고 라이선스 동의(`sudo xcodebuild -license accept`)까지 마치자, 바로 WDA 서버 주소가 떴어요. 새 Xcode 가 있는지는 `softwareupdate --list` 에 같은 버전의 Command Line Tools 가 올라왔는지로 먼저 짐작할 수 있었어요.

시간을 쓴 이유는 **에러 문구가 같았기 때문**이에요. 그래서 지금은 순서를 정해 뒀어요. 잠금 해제와 UI 자동화 재설정 뒤에도 이 에러가 나면, 바로 두 버전을 비교해요.

### 비행기 모드를 켜면 Wi-Fi 로 붙은 WDA 가 끊긴다

다른 조사에서 오프라인 상태를 만들어야 했어요. 비행기 모드를 WDA 로 켜려고, 대상 번들을 설정 앱(`com.apple.Preferences`)으로 바꿔서 같은 스크립트로 조작했어요. 설정 앱은 비행기 모드 스위치에도 identifier 가 붙어 있어서 트리에서 바로 찾을 수 있었어요.

```text
Switch  id=com.apple.settings.airplaneMode  center=(201,320) size=370x53 label="에어플레인 모드" [value=0]
```

여기서 함정이 둘 있었어요.

첫째, **비행기 모드를 켜는 순간 Wi-Fi 도 꺼져요.** Wi-Fi 로 붙은 WDA 는 그 순간 연결이 끊겨서, 다시 끄는 명령을 보낼 수 없어요. 그래서 켜기 전에 go-ios 터널과 포트 포워드로 **USB 연결로 바꿨어요.**

둘째, **트리가 준 중심 좌표를 탭해도 스위치가 안 바뀌었어요.** 이 Switch 노드는 폭이 370pt 인 행 전체였고, 중심(201,320)은 라벨 근처였어요. 탭 뒤에도 `[value=0]` 그대로였어요. 오른쪽 끝 스위치 손잡이 쪽(340,320)을 탭하자 `[value=1]` 로 바뀌었어요. **`tree` 에 `[value=…]` 를 같이 찍어 둔 덕분에** 탭이 먹었는지를 화면 캡처 없이 바로 확인할 수 있었어요.

### 그 밖에 기록해 둔 것

| 증상 | 원인·대응 |
|---|---|
| `tree` 가 요소를 하나도 못 찾고 배너만 돌려줌 | 측정 중 **푸시 배너**가 뜨면 트리가 배너만 반환해요. 측정할 땐 방해 금지 모드를 켜요 |
| 하단 탭바 ID 가 갑자기 사라짐 | iOS 26 에서 탭바를 네이티브 Liquid Glass 탭바로 바꾸자 Flutter 바깥이 됐어요. 같은 ID 를 채널로 넘겨 `UITabBarItem.accessibilityIdentifier` 에 넣었어요. WDA 는 이 탭바를 `isVisible=0` 으로 줘서, `tree` 에서 TabBar 하위는 보이는 것으로 취급하게 고쳤어요 |
| 특정 입력칸에 `type` 하면 앱이 종료됨 | 크래시 로그가 남지 않았고, 손으로 치면 정상이었어요. 원인은 못 찾았어요. 그 단계는 사람이 해요 |
| USB 를 뽑으면 WDA 러너가 같이 종료됨 | Wi-Fi 로 `xcodebuild test` 를 다시 띄워요 |
| 위젯 테스트에서 `node.identifier` 로 ID 가 안 찾아짐 | `MergeSemantics` 로 붙인 ID 는 상위 노드로 합쳐져요. 합쳐지기 전 노드의 `getSemanticsData()` 로 찾아야 해요 |

## 어디까지 ID 를 붙이나

측정 결과를 보고 규칙을 두 단계로 나눴어요. **노드와 ID 는 같은 게 아니라서요.**

| 단계 | 대상 | 이유 |
|---|---|---|
| **접근성 노드** | 새로 만드는 **모든** 탭 영역·토글·칩 | 노드가 없으면 버튼이 옆 글자와 한 덩어리가 되거나 트리에서 사라져요. VoiceOver 도 같은 트리를 읽어요 |
| **Semantics ID** | **QA 시나리오가 지나는** 요소만 | ID 는 이름표일 뿐이에요. 글자 라벨로 이미 잘 잡히는 화면(C)은 ID 를 붙여도 효과가 없었어요 |

노드 쪽은 화면마다 손으로 고치지 않고 **공용 위젯에 선택형 인자**를 열었어요. 탭 공용 위젯에 `semanticIdentifier`·`semanticLabel`·`toggled`·`selected`·`container` 를 받게 했어요. **인자를 넘기지 않으면 위젯 트리와 시맨틱스가 이전과 똑같아요.** 이걸 트리 덤프 비교 테스트로 고정했어요. 그래서 기존 호출부 451곳은 건드리지 않았어요.

예외도 하나 있었어요. 소셜 탭 영역 위젯에는 노드 경계(`container: true`)를 기본으로 넣었어요. 그러면 카드 안 링크가 따로 읽히니, **VoiceOver 가 읽는 단위가 바뀌어요.** 이건 화면 변화가 없어도 사용자 경험이 바뀌는 변경이라 따로 표시했어요. [확인 필요: VoiceOver 실기기 확인 결과]

ID 를 붙일지 판별하는 기준은 한 문장으로 정리했어요.

**`tree` 를 찍었을 때 누르려는 요소가 그 이름의 버튼·스위치로 따로 보이면 ID 는 필요 없고, 글자로만 보이거나 없으면 노드부터 만든다.**

## 마치며: 에이전트가 읽는 화면은 접근성 트리다

처음엔 에이전트에게 폰을 쥐여 주면 사람처럼 화면을 보고 누를 거라고 생각했어요. 실제로 그렇게 했고, 그게 문제였어요. **사람처럼 화면을 보는 건 에이전트에게 가장 비싼 방법이었어요.** 트리에 요소가 제대로 보이자 스크린샷 보기가 10회에서 1회로 줄었어요.

그리고 트리를 고치는 일은 결국 **접근성을 고치는 일**이었어요. QA 비용을 줄이려고 시작했는데, 고친 결과는 화면 낭독기 사용자가 쓰는 트리에도 그대로 들어갔어요.

이번에 배운 걸 하나로 줄이면 이거예요.

**도구를 줬다고 쓰는 게 아니고, 쓰라고 말해야 쓴다.**

ID 38개를 붙여도 에이전트는 거의 쓰지 않았어요. 카탈로그를 읽으라는 한 줄이 들어가자 15회 모두 썼어요. 연타도 같았어요. WDA 에는 처음부터 actions API 가 있었는데, 제가 만든 `tap` 이 그걸 쓰지 않고 있었어요.

에이전트에게 실기기 QA 를 맡겨 볼 생각이라면, 먼저 세 가지를 확인해 보세요.

1. **확인하려는 화면의 접근성 트리를 한 번 찍어 보셨나요?** WDA `/source` 나 Xcode Accessibility Inspector 로요. 누르려는 버튼이 글자로만 보이거나 없다면, 에이전트는 스크린샷을 읽게 돼요.
2. **에이전트 프롬프트에 「무엇으로 찾으라」가 적혀 있나요?** ID 카탈로그든 라벨 목록이든, 쓰라고 적지 않으면 쓰지 않아요.
3. **연타 확인이 탭 API 를 여러 번 부르는 방식인가요?** 그렇다면 두 번째 탭이 요청이 끝난 뒤에 들어가고 있을 수 있어요.

## 참고 자료

- Appium, [WebDriverAgent](https://github.com/appium/WebDriverAgent) — 기기 안에서 도는 XCTest 기반 WebDriver 서버 [확인 필요: 사용한 WDA 커밋·버전]
- W3C, [WebDriver — Actions](https://www.w3.org/TR/webdriver2/#actions) — `pointerDown`·`pause`·`pointerUp` 으로 입력 순서를 한 요청에 담는 표준
- Flutter API, [`Semantics.identifier`](https://api.flutter.dev/flutter/widgets/Semantics/identifier.html) — iOS 에서 `accessibilityIdentifier` 로 나가는 값
- [go-ios](https://github.com/danielpaulus/go-ios) — USB 터널·포트 포워드 [확인 필요: 사용한 go-ios 버전]
- 기준 환경: iPhone 15(iOS 27.2.1), iPhone 16(iOS 27.0.1), Xcode 26.3 → 27.2(로컬), Flutter 3.47.4, 측정 에이전트 `claude-sonnet-5-5`
