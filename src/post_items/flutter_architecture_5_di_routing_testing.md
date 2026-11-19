---
title: 'DI·라우팅·테스트, 그리고 이 구조가 AI 와 일할 때 준 것'
author: jack
date: 2026. 11. 18.
published: false
description: '문서와 달리 손으로 등록하던 DI, navigator 가 셋인 go_router 의 함정, 패키지를 따라 나뉜 테스트를 보고, 6개 패키지 구조가 AI 에이전트와 일할 때 무엇을 돕고 무엇을 막았는지로 시리즈를 닫아요.'
series: flutter-architecture
seriesOrder: 5
tags: [Flutter, Architecture, Testing, AI]
---

## 들어가며: 문서에는 코드 생성, 코드에는 손으로 쓴 등록 265곳

「Flutter 앱을 6개 패키지로 나눈 이유」 시리즈의 마지막 편이에요. [1편](/posts/flutter_architecture_1_monorepo)에서 6개 패키지의 지도를 그렸고, 2~4편에서는 "이메일 수신 설정" 화면을 따라 데이터 흐름, `Result`, BLoC 을 봤어요. 이번 편은 그 조각들을 **조립하는 쪽**이에요. 누가 구현을 끼우고(DI), 누가 화면을 띄우고(라우팅), 무엇이 동작을 못 박는지(테스트)요.

출발점은 저장소 루트 문서의 한 줄이었어요.

```markdown
- DI: get_it + injectable
```

injectable 은 클래스에 `@injectable` 같은 어노테이션을 붙이면 등록 코드를 **자동으로 생성**해 주는 패키지예요. 그런데 저장소에는 injectable 이 만드는 생성 파일(`*.config.dart`)이 하나도 없어요. 대신 **등록 코드를 손으로 쓴 파일 두 개**가 있어요. 합쳐서 1,931줄, `register` 호출은 **265곳**이에요.

이 편은 그 어긋남에서 시작해서, 시리즈 전체를 한 질문으로 닫아요. **이 구조는 AI 에이전트와 일할 때 무엇을 줬고, 무엇을 막았나.**

이런 분께 도움이 될 거예요.

- get_it 에 injectable 같은 코드 생성을 붙일지 고민 중인 분
- go_router 의 `ShellRoute` 안에서 백키·바텀시트·`await` 가 이상하게 동작한 적이 있는 분
- 여러 패키지로 나눈 앱을 AI 코딩 에이전트와 함께 고치고 있는 분

숫자는 2026년 11월 18일 main 기준이고, 버전은 Flutter 3.47.4, go_router 14.8.1, get_it 8.3.0, flutter_bloc 8.1.6 이에요.

## injectable 은 한 번도 쓰인 적이 없었다

처음에는 "예전에 injectable 을 쓰다가 손으로 바꿨겠지"라고 생각했어요. 그래서 모든 브랜치의 이력에서 어노테이션을 찾았어요.

```bash
git log --all -S'@injectable' -- '*.dart'
git log --all -S'@lazySingleton' -- '*.dart'
git log --all -S'injection.config' -- '*.dart'
```

**세 검색 모두 0건이었어요.** injectable 은 이 저장소에서 한 번도 쓰인 적이 없었어요. 그럼 문서의 그 줄은 어디서 왔을까요?

| 날짜 | 무슨 일 | DI 파일 |
|---|---|---|
| 2025-11-20 | 동료가 뼈대 커밋에서 `get_it`·`injectable`·`injectable_generator` 를 의존에 추가. **같은 커밋에서 DI 파일은 손으로 작성** | 82줄, 등록 8곳 |
| 2026-01-21 | 제가 `CLAUDE.md` 에 "Tech Stack" 절을 만들며 `DI: get_it + injectable` 을 적음 | 213줄, 37곳 |
| 2026-06-12 | 문서를 나누며 `docs/architecture.md` 에 "get_it + injectable(코드 생성)" 으로 옮김 | 417줄, 74곳 |
| 2026-11-04 | 코드 생성기를 새 Dart 문법에 맞추려고 `injectable` 을 2.x → 3.x 로 올림 | — |
| 2026-11-18 | 지금 | 2개 파일 1,931줄, **265곳** |


<figure>
	<img src="/posts/flutter_architecture_5_di_routing_testing/fig-1-doc-vs-code.webp" alt="의존 목록에는 2025-11-20 에 injectable 이 추가되고 2026-11-04 에 2.x 에서 3.x 로 올라갔고, 문서는 DI: get_it + injectable 에서 get_it + injectable(코드 생성)으로 바뀌었지만, 손으로 쓴 등록은 8곳에서 265곳으로 늘었고 @injectable 은 0건이다" width="1600" height="1000" loading="lazy" />
	<figcaption>문서와 의존 목록이 injectable 을 말하는 동안, 코드는 처음부터 손으로 등록했어요.</figcaption>
</figure>

여기서 볼 건 세 가지예요. 첫째, **의존 목록에는 있었지만 코드는 첫날부터 손으로 썼어요.** 둘째, 문서 한 줄은 제가 DI 코드를 건드리지 않은 QA 수정 커밋에서 적었어요. `[확인 필요: 2026-01 에 Tech Stack 을 적을 때 의존 목록을 보고 썼는지]` 셋째, 그 줄은 나중에 **"(코드 생성)"이라는 설명까지 붙어** 옮겨졌어요. 틀린 문장이 정리 작업을 거치며 더 단정적으로 변했어요.

쓰지 않는 패키지를 **새 문법에 맞추려고 업그레이드**까지 했어요. `entity` 패키지 문서의 "모델은 json_serializable" 도 같은 경우예요. 모델의 `fromJson` 은 전부 손으로 써요. **의존 목록을 보고 쓴 문서는 의존 목록만큼만 정확했어요.**

## 손으로 등록해서 얻은 것과 잃은 것

이메일 수신 설정의 등록은 이래요. `usecase` 의 인터페이스에 `network` 의 구현을 끼우는 곳이에요.

```dart
// app/lib/system/di/configurations.dart
getIt.registerLazySingleton<EmailPreferenceDataSource>(
  () => EmailPreferenceDataSourceImpl(baseNetwork: getIt<BaseNetwork>(instanceName: 'apiNetwork')),
);
// ...
getIt.registerLazySingleton<EmailPreferenceUseCase>(
  () => EmailPreferenceUseCase(dataSource: getIt<EmailPreferenceDataSource>()),
);
```

### 얻은 것: DI 컨테이너를 아는 패키지는 `app` 하나

`get_it` 을 의존에 적은 패키지는 **`app` 하나뿐**이에요. 나머지 패키지의 `lib/` 에는 `get_it` import 가 0줄이에요. BLoC 과 UseCase 는 필요한 것을 **생성자로 받기만** 해요. 그래서 `presenter/test` 와 `usecase/test` 에서 `getIt` 에 무언가를 등록하는 파일도 **0개**예요. BLoC 테스트는 가짜 UseCase 를 생성자에 넣으면 끝이에요.

injectable 을 썼다면 어노테이션 때문에 `presenter` 와 `usecase` 도 injectable 을 알아야 했을 거예요. 손으로 등록하니 **DI 라는 개념이 `app` 밖으로 새지 않았어요.** 다만 이걸 노리고 손으로 썼다는 기록은 없어요. `[확인 필요: 처음에 손으로 등록한 이유]`

### 잃은 것: 실패가 런타임에 나고, 한 파일이 길목이 된다

등록을 빠뜨려도 컴파일은 돼요. 그 타입을 처음 꺼내는 화면을 열 때 에러가 나요. 등록 전체를 한 번씩 꺼내 보는 테스트는 찾지 못했어요.

부팅 중이면 더 아파요. 초기화에 `await` 가 필요한 것은 **비동기 싱글턴**으로 등록하는데, get_it 8.3.0 에는 이런 성질이 있어요.

> **헷갈리기 쉬운 것: `isRegistered` 가 true 인데 꺼내면 죽는다**
>
> 비동기 싱글턴이 아직 준비되지 않았어도 `getIt.isRegistered<T>()` 는 **true** 예요. 같은 상태에서 `getIt<T>()` 는 `StateError` 를 던져요. `Error` 라서 `on Exception catch` 로는 잡히지 않아요.

동료가 첫 화면이 영영 안 뜨는 문제를 고치면서 이걸 만났어요. 싱글턴 준비를 기다리는 단계에 상한이 없었거든요. 그래서 싱글턴마다 **8초 상한**을 두고 넘으면 준비 안 된 채로 진행하게 했고, 부팅 경로의 `getIt` 접근은 전부 던지지 않는 함수 하나로 감쌌어요.

```dart
// app/lib/system/di/safe_get.dart
T? safeGet<T extends Object>() {
  try {
    if (!getIt.isRegistered<T>()) return null;
    return getIt<T>();
  } on Object catch (error) {
    debugPrint('safeGet<$T> failed: $error');
    return null;
  }
}
```

`on Object` 로 `Error` 까지 잡는 게 핵심이에요. 로그를 남기려던 `getIt` 접근이 던져서 **방어 코드가 라우팅을 멈추고 스플래시에 가둔** 일이 실제로 있었거든요.

두 번째 비용은 파일 크기예요.

| 시점 | 줄 수 | 등록 수 |
|---|---|---|
| 2026-03-01 | 240 | 40 |
| 2026-09-01 | 934 | 120 |
| 2026-11-18 | 1,656 + 275 | 227 + 38 |

여기서 볼 건 **2026년 6월 이후 등록 수가 세 배 넘게 늘었다**는 점이에요(6월 1일 71곳). `configurations.dart` 를 고친 커밋은 227개예요. 기능마다 줄을 더하니 이 파일은 **모든 기능이 지나가는 길목**이 됐고, 이게 진짜 문제가 된 건 AI 에이전트 여럿이 동시에 일할 때였어요. 뒤에서 다시 볼게요.

### 그럼 injectable 로 바꿔야 할까

기준은 셋이었어요. **누락 사고가 잦나**(저희는 드물었고, 사고는 대부분 코드 생성이 풀지 못하는 부팅 순서 문제였어요), **등록 순서에 의미가 있나**(토큰 갱신용 네트워크 → 데이터 소스 → 일반 API 네트워크 순서가 손으로 쓴 코드에 그대로 보여요), **어노테이션이 다른 패키지로 새도 되나**(저희는 `app` 밖에 DI 가 없다는 성질에 기대요). 그래서 지금은 바꾸지 않고, **문서에서 "injectable" 을 지우고 쓰지 않는 의존을 빼기로** 했어요. 등록이 순서와 무관한 단순 바인딩이 대부분이고 누락이 잦은 저장소라면 답이 반대일 거예요.

## BLoC 은 화면이 아니라 라우트 빌더가 만든다

DI 에서 꺼낸 UseCase 가 BLoC 에 들어가는 자리는 규칙 한 줄로 정해져 있어요.

```markdown
15. BlocProvider 는 `{feature}_page_route.dart` route builder 에서 주입, Page 는 `context.read` 만
```

```dart
// app/lib/feat/notifications/email_preference_page_route.dart
static Future<void> push(BuildContext context) {
  return Navigator.of(context).push<void>(
    MaterialPageRoute<void>(
      builder: (_) => BlocProvider<EmailPreferenceBloc>(
        create: (_) => EmailPreferenceBloc(emailPreferenceUseCase: getIt<EmailPreferenceUseCase>())
          ..add(const EmailPreferenceLoadEvent()),
        child: const EmailPreferencePage(),
      ),
    ),
  );
}
```

화면은 `getIt` 도 BLoC 생성자도 몰라요. 위에서 내려온 BLoC 을 읽기만 해요. 그래서 화면 테스트는 **진짜 BLoC 대신 가짜를 끼울** 수 있어요.

라우트 빌더 148개 중 134개는 go_router 의 `GoRoute` 를 돌려주고, 이메일 설정처럼 `Navigator` 로 직접 미는 건 6개예요. 어느 쪽이든 **BLoC 을 만드는 곳은 라우트 빌더**예요.

### 예외: 앱 전체가 쓰는 BLoC 은 다시 만들지 않는다

이 규칙을 그대로 따르다 사고가 난 적이 있어요. 언어 설정의 라우트 빌더가 앱 최상단에 이미 있던 `LanguageBloc` 을 **하나 더 만들어서**, 화면의 이벤트를 사본이 먹었어요. 자세한 경위는 [4편](/posts/flutter_architecture_4_bloc_viewmodel)에 적었어요.

그래서 §15 의 정확한 범위는 이래요. **그 화면 전용 BLoC 은 라우트 빌더에서 만들고, 앱 최상단에 있는 BLoC(지금 8개)은 다시 만들지 않는다.**

## go_router 의 navigator 는 하나가 아니다

라우팅 함정은 구조 하나를 알아야 풀려요. 저희 홈 화면은 **navigator 세 겹 안쪽**에 있어요.

```text
루트 navigator
 └─ ShellRoute navigator ── 탭 화면들이 공유하는 BLoC 8개를 여기서 주입
     └─ StatefulShellRoute.indexedStack 의 탭별 navigator ── 홈을 비롯한 각 탭
```

이 글에서는 셋을 **루트**, **셸**, **탭** navigator 라고 부를게요. 문제는 여러 기능이 **"navigator 는 하나"라고 가정하는 지점**이에요.

| 함정 | 증상 | 지금 규칙 |
|---|---|---|
| **커스텀 백 처리 화면을 셸 아래에 둠** | Android predictive back 에서 백키에 **앱이 종료** | 루트 직속에 등록(§17) |
| **루트에 띄운 바텀시트를 `context.pop()` 으로 닫음** | 깊은 탭에서만 시트가 **안 닫힘** | `Navigator.of(context, rootNavigator: true).pop()` |
| **셸 `pageBuilder` 페이지에 key 없음** | 리다이렉트 순간 GlobalKey 충돌로 **셸 전체 빌드 실패**. `builder` 와 달리 `pageBuilder` 에는 go_router 가 key 를 넣어 주지 않음 | `key: state.pageKey` |
| **살아 있는 탭에 `extra` 로 값 전달** | 두 번째 진입부터 값이 **조용히 무시** | 탭의 BLoC 에 이벤트로 신호 |
| **탭 화면에서 루트의 `RouteObserver` 구독** | 위에 화면이 덮여도 콜백이 **안 옴** | 그 순간의 `topRoute` 조회 |
| **`pushReplacement` 가 낀 경로를 `await`** | `await` 가 **끝나지 않아** 재조회가 안 돎 | 화면 간 갱신은 이벤트 버스로 |

여기서 볼 건 **여섯 개 중 다섯 개가 에러 없이 조용히 실패한다**는 점이에요. 원인은 매번 "이 코드는 어느 navigator 를 보고 있나"였어요. 두 개만 자세히 볼게요.


<figure>
	<img src="/posts/flutter_architecture_5_di_routing_testing/fig-2-navigator-layers.webp" alt="루트 navigator 안에 셸 navigator, 그 안에 탭 navigator 가 있다. 홈에서 context.pop() 은 루트의 바텀시트를 닫지 못하고 rootNavigator: true 로 닫아야 하며, 셸 아래의 커스텀 백 처리 화면은 루트 직속으로 옮긴다" width="1600" height="1000" loading="lazy" />
	<figcaption>navigator 가 세 겹이라, 함정마다 원인은 이 코드가 어느 navigator 를 보고 있느냐였어요. 그냥 <code>context.pop()</code> 하면 가장 가까운 탭 navigator 에서 멈춰요.</figcaption>
</figure>

### 백키를 눌렀더니 앱이 꺼졌다

Android 의 predictive back(뒤로 가기 미리 보기)을 켜면, 프레임워크는 "지금 누가 백을 처리하나"를 미리 알아야 해요. 그런데 셸 안쪽 라우트의 신호가 **루트까지 모이지 않아서**, Android 가 아무도 처리하지 않는다고 판단하고 액티비티를 내렸어요. 화면의 `PopScope` 는 멀쩡히 붙어 있어서 원인 찾기가 어려웠어요.

해법은 **등록 위치를 옮기는 것**이었어요. 셸의 손자 라우트는 `parentNavigatorKey: rootNavigatorKey` 로 올리고, 셸의 직속 자식은 그게 허용되지 않아 루트 라우트 목록으로 옮겼어요. predictive back 을 전역으로 끄거나 백 신호를 루트로 직접 전달하는 위젯도 검토했지만, 앞은 OS 의 백 제스처 애니메이션을, 뒤는 go_router 업그레이드 안정성을 내줘야 했어요. **등록 위치만 바꾸면 되는 문제에 비해 둘 다 비쌌어요.**

팀 관련 화면 몇 개는 아직 셸 아래에 있어서, 목록을 `app` 패키지 문서에 적고 **"손대는 김에 함께 옮긴다"**로 줄여 가요.

### `await` 가 영영 끝나지 않았다

"화면을 띄우고, 돌아오면 다시 불러온다"는 흔한 코드예요.

```dart
// 단순화한 예시
await context.pushNamed(CreatePage.routeName);
bloc.add(const ReloadEvent()); // 돌아오면 재조회
```

`CreatePage` 가 끝나고 `pushReplacementNamed` 로 완료 화면으로 바꾸면 문제가 생겨요. go_router 14.8.1 의 `pushReplacement` 는 마지막 라우트를 지우고 **새 completer** 로 push 해요. 지워진 라우트의 completer 는 완료되지 않아서, 처음 `await` 는 **영원히 기다려요.**

챌린지 개설 → 개설 완료 흐름에서 목록이 갱신되지 않는 버그로 나타났어요. 그래서 기준을 바꿨어요. **서버 상태를 바꾼 뒤 다른 화면을 갱신하는 일은 navigation 의 `await` 에 기대지 않는다.** UseCase 가 이벤트를 발행하고, 관심 있는 BLoC 이 구독해서 재조회해요.

## 테스트는 패키지를 따라 스펙이 된다

계층별 스펙 폴더의 테스트 파일 수예요.

| 위치 | 무엇의 스펙 | 테스트 파일 |
|---|---|---|
| `entity/test/models` | 서버 JSON 필드 매핑 | 217 |
| `usecase/test/feat` | 비즈니스 규칙 | 177 |
| `presenter/test/blocs` | 이벤트에 따른 상태 전이 | 311 |
| `network/test/data_source` | 요청과 응답 변환 | 91 |
| `app/test/feat` | 화면이 상태를 그리는 방식 | 736 |


<figure>
	<img src="/posts/flutter_architecture_5_di_routing_testing/fig-3-test-spec-map.webp" alt="패키지 지도 위의 테스트 폴더. app 의 test/feat 736개, presenter 의 test/blocs 311개, usecase 의 test/feat 177개, network 의 test/data_source 91개, entity 의 test/models 217개가 각 계층의 스펙이다" width="1600" height="900" loading="lazy" />
	<figcaption>테스트 폴더가 패키지를 따라 나뉘어 있어서, 고칠 곳의 스펙을 어디서 읽을지 정해져 있어요.</figcaption>
</figure>

이 폴더들을 **스펙**이라 부르는 데는 규칙이 붙어 있어요. **기존 기능을 고칠 때는 구현보다 관련 테스트를 먼저 읽는다**(§21). 코드는 "지금 어떻게 동작하나"를, 테스트는 "어떻게 동작해야 하나"를 말하니까요.

이메일 수신 설정은 세 층으로 못 박혀 있어요. **모델 테스트**(58줄)는 `snake_case` 필드 매핑을, **BLoC 테스트**(157줄)는 토글 실패 시 되돌림을, **화면 테스트**(150줄)는 전체 수신을 끄면 주제가 잠기는지를 봐요. BLoC 테스트는 가짜 UseCase 를 생성자로, 화면 테스트는 가짜 BLoC 을 `BlocProvider.value` 로 넣어요.

```dart
// app/test/feat/notifications/email_preference_page_test.dart
await tester.pumpWidget(
  localizedTestApp(
    home: MultiBlocProvider(
      providers: [
        BlocProvider<EmailPreferenceBloc>.value(value: bloc), // MockBloc
        BlocProvider<NetworkStatusBloc>.value(value: networkStatusBloc),
      ],
      child: const EmailPreferencePage(),
    ),
  ),
);
```

여기서 볼 건 **화면 테스트에 `getIt` 이 없다**는 점이에요. 라우트 빌더 규칙과 `app` 에만 DI 가 있는 구조가 테스트를 이렇게 단순하게 만들어요. 반대로 `app/test` 에는 `getIt` 에 가짜를 등록하거나 초기화하는 파일도 177개 있어요. 위젯이 BLoC 을 거치지 않고 UseCase 를 직접 꺼내는 곳(2편의 78개 파일)이 그만큼 테스트 준비를 무겁게 만들어요. **경계가 새는 곳은 테스트 준비 코드에서 먼저 티가 나요.**

맹점도 있어요. 화면 테스트가 **라우트와 똑같이 BlocProvider 를 만들면**, 앞의 언어 설정처럼 라우트가 최상단 BLoC 을 가리는 실수는 못 잡아요. 그래서 라우팅 계약은 실제 라우트 객체를 테스트용 GoRouter 에 붙이는 테스트로 `app/test/router` 에 모아 뒀어요(18개 파일).

### `dart test` 를 쓰지 않는 이유

`entity` 와 `usecase` 도 **`flutter test` 로만** 돌려요. 일부 테스트가 간접적으로 `package:flutter` 를 끌어오는데, `dart test` 는 여러 파일을 **한 묶음으로 컴파일**해서 한 파일이 깨지면 멀쩡한 파일까지 **빈 메시지로 "Failed to load"** 가 돼요. 2026년 8월에 하나씩은 통과하고 디렉토리로는 40여 개가 실패하는 이 모양을 "원래 있던 환경 문제"로 잘못 판정한 적이 있어요. `flutter test` 로 바꾸니 전부 통과했어요. 그래서 규칙이 하나 생겼어요. **빈 메시지 실패가 무더기로 나오면 회귀보다 러너를 먼저 의심한다.**

### 위젯 테스트가 조용히 통과하는 자리

저희가 밟은 위젯 테스트 함정은 공통점이 있어요. **실패하지 않고 틀린 값으로 통과해요.**

| 함정 | 무엇이 틀어지나 |
|---|---|
| 테스트 기본 폰트는 글자가 전부 정사각형 | 11자 문구 폭이 실제 64.45px 대신 **132px**. 앱 폰트를 `FontLoader` 로 올려야 함 |
| 번역 없는 `MaterialApp` 으로 감쌈 | 문구 자리에 훨씬 긴 대체 문자열이 그려져 **텍스트 높이가 달라짐** |
| 한 테스트에서 여러 폭·배율을 순회 | 오버플로우는 **RenderObject 하나당 한 번만** 보고됨. 32조합이 전부 통과로 읽힘 |

여기서 볼 건 **세 개 모두 초록색으로 끝난다**는 점이에요. 그래서 텍스트 폭이나 높이를 재는 테스트는 실제 폰트와 번역을 먼저 올리는 걸 기본으로 해요.

## 이 구조가 AI 에이전트에게 준 것

이제 시리즈의 마지막 질문이에요. 저는 올해 코드 대부분을 AI 코딩 에이전트(Claude Code)와 함께 썼어요. 이 구조는 AI 를 염두에 두고 만든 게 아니지만, 몇 가지는 꽤 도움이 됐어요. 에이전트가 규칙 문서를 언제 읽고 어떻게 예산 안에 두는지는 [AI 에이전트에게 규칙을 읽히는 법](/posts/ai_agent_harness)에서 다뤘으니, 여기서는 **패키지 구조** 쪽에서만 볼게요.

### 1. 찾는 범위가 패키지 이름으로 좁혀진다

"토글이 실패하면 어떻게 되돌리나"를 물으면 볼 곳은 `presenter` 의 BLoC 폴더 하나예요. "서버 필드가 안 들어온다"면 `entity` 의 모델과 그 테스트예요. **질문의 종류가 곧 패키지**라서 저장소 전체를 훑을 일이 줄어요. 파일 이름 규칙(`*_page_route.dart`, `*_bloc.dart`, 파일당 public 클래스 하나) 덕분에 기능 이름 하나로 파일 이름을 **추측해서 맞힐 수 있어요.**

### 2. 규칙이 패키지 경계를 따라 나뉘어 로드된다

규칙 문서도 패키지마다 있고, 에이전트는 **그 디렉토리 파일을 다룰 때만** 읽어요. `presenter` 문서에는 BLoC 의 함정만, `network` 문서에는 데이터 계층의 규칙만 있어요. **규칙이 패키지 책임과 같은 모양으로 나뉘는** 거예요. 폴더로만 나눴다면 "이 규칙은 어디 두나"부터 정해야 했을 거예요. 크기를 보면 `app` 문서(10,606 B)가 나머지 다섯 개를 합친 것(6,840 B)보다 커요. 앞의 navigator 함정들처럼 **함정이 화면 패키지에 가장 많이 모여 있어요.**

### 3. 테스트 위치가 "먼저 읽을 것"을 정해 준다

에이전트는 코드를 읽으면 "지금 이렇게 동작하니 이게 의도"라고 받아들이기 쉬워요. 테스트 폴더가 패키지마다 같은 이름으로 있으니, §21 은 **"같은 패키지의 `test/` 에서 같은 이름을 찾아 먼저 읽어라"**라는 기계적으로 따를 수 있는 지시가 돼요. 이 규칙을 정한 2026년 6월의 첫 ADR 도 이유가 AI 였어요. **AI 세션이 만든 코드의 "왜"가 개인 머신의 메모리에만 남아 다른 세션이 재사용할 수 없었다.**

## 같은 구조가 AI 에이전트를 막은 곳

### 1. 기능 하나가 다섯 패키지를 지나간다

1편에서 기능 커밋의 **52% 가 패키지 3개 이상**을 고쳤다고 했어요. 에이전트가 들고 있어야 할 맥락도, 검증 범위도 그만큼 넓어요. `usecase` 의 sealed 이벤트에 하위 타입을 하나 더하면, 그 이벤트를 `switch` 로 빠짐없이 나누던 **다른 패키지의 BLoC** 이 깨져요. 고친 디렉토리만 분석하면 놓쳐서 "디렉토리가 아니라 패키지 전체를 분석한다"는 규칙이 생겼어요.

### 2. 공유 파일이 병렬 작업의 충돌 지점이 된다

가장 크게 부딪힌 건 **에이전트 여럿을 동시에 돌릴 때**였어요. 올해 10월 소셜 탭을 만들면서 기능을 21개 작업 단위로 나누고 11개 묶음으로 병렬 구현했어요. 작업 단위마다 에이전트가 각자의 git worktree 에서 구현하고 PR 을 올렸어요.

서로 다른 화면을 만들어도 **모두가 손대야 하는 파일**이 있었어요. DI 등록 파일, 패키지마다 있는 barrel, 라우트 목록이에요. 앞의 "길목"이 병렬 작업에서는 머지 충돌로 터져요.

해법은 코드가 아니라 **파일 배치**였어요. 첫 묶음이 소셜 전용 DI 파일, 소셜 전용 barrel 네 개, 소셜 전용 라우트 목록을 따로 만들고, 작업 단위별 **슬롯 주석**을 미리 넣었어요.

```dart
// app/lib/system/di/social_dependencies.dart
// 각 작업은 자기 슬롯 주석 바로 아래에만 줄을 추가한다 — 슬롯 주석이 병렬 머지의 경계다.
void registerSocialDataSources() {
  // [slot-03] relation
  getIt.registerLazySingleton<SocialRelationDataSource>(/* ... */);
  // [slot-04] feed
  getIt.registerLazySingleton<SocialFeedDataSource>(/* ... */);
  // ...
}
```

그리고 **원래의 DI 파일과 barrel 은 첫 묶음 이후 아무도 고치지 않는다**고 정했어요. 슬롯 주석 사이에 고정된 줄이 있으니, 두 작업이 각자 자기 슬롯 아래에 줄을 더해도 git 의 3-way merge 가 알아서 합쳐요. 이 파일에는 지금 슬롯 주석이 22개 있어요. 그래도 개발용 데모 페이지의 import 줄처럼 같은 자리에 몰리는 곳은 남아서, 머지 전 rebase 후 재검증 단계를 뒀어요.


<figure>
	<img src="/posts/flutter_architecture_5_di_routing_testing/fig-4-slot-merge.webp" alt="에이전트 셋이 각자 worktree 에서 configurations.dart 의 같은 자리를 고치면 머지 충돌이 나고, social_dependencies.dart 의 슬롯 주석 아래에 각자 줄을 더하면 3-way merge 로 합쳐진다" width="1600" height="900" loading="lazy" />
	<figcaption>모두가 고치는 파일을 나누고 슬롯 주석을 미리 박아 두니, 병렬 작업이 충돌 없이 합쳐졌어요.</figcaption>
</figure>

여기서 배운 건 이거예요. **사람이 순서대로 일할 때 장점이던 "한 파일에 모아 두기"가, 에이전트가 동시에 일하면 충돌 지점이 됐어요.** 구조의 장단점은 일하는 방식에 따라 뒤집혀요.

### 3. 낡은 문서는 에이전트에게 더 위험하다

사람은 DI 파일을 한 번 열면 "get_it + injectable" 이 틀렸다는 걸 알아요. 에이전트는 **매 세션 그 문서를 먼저 읽고 사실로 깔고 시작**해요. `@injectable` 을 붙이자고 제안할 조건이 1년 내내 갖춰져 있었던 거예요. `[확인 필요: 에이전트가 injectable 어노테이션이나 build_runner 를 제안한 사례]` 문서가 낡는 문제는 [하네스 글](/posts/ai_agent_harness)에서 다뤘고, 구조 관점에서 덧붙일 건 하나예요. **패키지마다 문서를 나누면 낡을 수 있는 곳도 패키지 수만큼 늘어나요.**

## 마치며: 구조는 사람보다 에이전트가 더 문자 그대로 읽는다

이 편은 "문서에는 injectable, 코드에는 손으로 쓴 등록"이라는 어긋남에서 시작했어요. 답은 싱거웠지만, 그 어긋남이 1년을 살아남은 이유를 따라가다 시리즈의 결론에 닿았어요.

다섯 편 동안 본 패키지 경계, barrel, 라우트 빌더, 패키지별 테스트 폴더와 규칙 문서는 모두 **"어디에 무엇이 있는가"를 이름과 위치로 말해 주는 장치**였어요. 사람은 그 장치가 조금 틀려도 눈치로 메워요. 에이전트는 **문자 그대로** 따라가요. 그래서 구조가 맞으면 사람보다 빨리 길을 찾고, 구조가 틀리면 사람보다 자신 있게 틀린 길로 가요.

AI 와 일하는 저장소에서 구조 문서는 설명이 아니라 지시입니다.

여러분의 저장소에서도 확인해 보세요.

- 문서의 기술 스택 목록을 열고, 각 항목이 **실제 코드에서 쓰이는 곳**을 하나씩 찾아보세요. 의존 목록에만 있는 항목이 있나요?
- 여러 기능이 **함께 손대는 파일**(DI 등록, barrel, 라우트 목록)을 세어 보세요. 두 작업이 동시에 고치면 어떻게 되나요?
- 화면 테스트 하나를 골라, **실제 라우트와 같은 방식**으로 BLoC 을 주입하는지 보세요. 같다면, 라우트의 실수를 그 테스트가 잡을 수 있나요?

### 시리즈 안내

1. [모노레포 지도: 왜 패키지를 6개로 나눴나](/posts/flutter_architecture_1_monorepo) — 경계를 실제로 지키는 건 컴파일러가 아니라 린트였다
2. [데이터 한 사이클](/posts/flutter_architecture_2_data_flow) — 토글 하나가 화면에서 서버까지 갔다 오는 길과, 경계가 새는 곳
3. [Result 와 ROP](/posts/flutter_architecture_3_result) — 예외 대신 실패를 값으로 넘기기
4. [BLoC 을 ViewModel 로](/posts/flutter_architecture_4_bloc_viewmodel) — 상태·이벤트·사이드 이펙트를 나누는 기준
5. **DI·라우팅·테스트, 그리고 이 구조가 AI 와 일할 때 준 것** (이 글)

BLoC 이벤트가 겹칠 때의 처리는 [BLoC 이벤트 겹침 리팩토링](/posts/bloc_concurrency_refactor)에서 따로 다뤘어요.

## 참고 자료

- [get_it](https://pub.dev/packages/get_it) — 8.3.0 기준. 비동기 싱글턴은 `isReady` 로 준비를 기다린다
- [go_router](https://pub.dev/packages/go_router) — 14.8.1 기준. `ShellRoute`, `StatefulShellRoute`, `pushReplacement`
- [Android predictive back](https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture) — 뒤로 가기 제스처 미리 보기
- [Flutter: Android predictive back 변경 안내](https://docs.flutter.dev/release/breaking-changes/android-predictive-back) — `PopScope` 와 `canPop`
