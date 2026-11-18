---
title: 'Flutter 앱의 탭바만 iOS 네이티브로: Liquid Glass 를 PlatformView 로 붙이기'
author: jack
date: 2026. 11. 18.
published: false
description: 'Flutter 로 흉내 내던 유리 탭바를 iOS 26 시스템 UITabBar 로 바꿨어요. 화면은 Flutter 에 두고 탭바 한 장만 PlatformView 로 띄우면서 겪은 제스처 경쟁, 선택 어긋남, 시스템 배지를 버린 이유를 정리했어요.'
tags: [iOS, Flutter, PlatformView, UIKit, Liquid Glass, UITabBar]
---

## 들어가며: 앱을 다시 쓰기 전에, 탭바 한 장만

저는 Flutter 로 웰니스 앱을 만들고, 앱에 붙는 서버(Django·FastAPI)도 함께 맡고 있어요.

iOS 26 이 나오고 나서 이런 이야기가 나왔어요. **"iOS 에서는 앱이 iOS 답지 않아 보인다. 네이티브로 다시 써야 하지 않을까?"** 시스템 앱들은 모두 **Liquid Glass** 로 바뀌었는데, 저희 앱의 하단 탭바는 Flutter 로 그린 유리 흉내였거든요.

전면 재작성은 큰 결정이에요. 그래서 먼저 질문 하나를 확인해 보기로 했어요. **"iOS 다움의 차이가 화면 전체에 퍼져 있나, 아니면 시스템 부품 몇 개에 몰려 있나?"** 몰려 있다면 그 부품만 네이티브로 바꾸면 돼요. 가장 눈에 띄는 부품이 탭바였어요.

이 글은 **화면은 전부 Flutter 에 두고, 하단 탭바 한 장만 UIKit `UITabBar` 로 바꿔 PlatformView 로 띄운** 과정이에요. 처음엔 "네이티브 뷰를 하나 띄우고 채널로 탭 번호만 주고받으면 끝"이라고 생각했어요. 실제로는 탭이 안 먹고, 빠르게 누르면 선택 표시와 화면이 어긋나고, 출시 뒤에는 시스템 배지가 아이콘을 덮었어요.

이런 분께 도움이 될 거예요.

- Flutter 앱인데 iOS 26 에서 **시스템 컴포넌트 모양**을 그대로 쓰고 싶은 분
- PlatformView 를 붙였는데 **터치가 네이티브로 안 가거나 상태가 어긋나는** 분
- `UITabBarItem.badgeValue` 로 **숫자 없는 점**을 그리려는 분

다룰 키워드는 **`UiKitView`, 채널 계약, `EagerGestureRecognizer`, 선택 재확정, 레드닷 오버레이** 예요.

## 배경: 흉내 낸 유리와 시스템 유리

기존 탭바는 Flutter 패키지(`liquid_glass_renderer`)로 그렸어요. 그런데 실제 굴절 셰이더 경로는 애니메이션 마지막 프레임에서 좌표가 갱신되지 않는 문제가 있어서, **`fake: true` 로 `BackdropFilter`(blur 25) 하나만 쓰는 흉내 유리**를 쓰고 있었어요. 반투명하고 흐릿하긴 하지만, 시스템 탭바처럼 굴절하거나 선택 항목에 렌즈가 생기지는 않아요.

반대로 시스템 탭바는 거의 공짜로 Liquid Glass 가 돼요. Apple 의 [Adopting Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass) 문서는 이렇게 말해요(2026-11-18 확인).

> In system frameworks, standard components like bars, sheets, popovers, and controls automatically adopt this material.
>
> (시스템 프레임워크의 막대, 시트, 팝오버, 컨트롤 같은 표준 컴포넌트는 이 재질을 자동으로 입어요.)

그리고 그 효과는 **최신 Xcode 로 다시 빌드할 때** 적용된다고 적혀 있어요. 정리하면, Flutter 는 이 재질을 그릴 수 없고, UIKit 은 표준 부품만 쓰면 알아서 그려 줘요. 그렇다면 **Flutter 화면 위에 UIKit 부품을 하나 얹으면** 되지 않을까 싶었어요.

Flutter 에서 iOS 네이티브 뷰를 얹는 방법이 PlatformView(`UiKitView`)예요. Flutter 문서([Hosting native iOS views](https://docs.flutter.dev/platform-integration/ios/platform-views), 2026-11-18 확인)는 두 가지를 분명히 해요. **iOS 는 Hybrid composition 만 쓰고**(네이티브 `UIView` 가 실제 뷰 계층에 붙어요), **PlatformView 에는 성능 비용이 따른다**는 거예요. 성능은 뒤에서 직접 재 볼게요.

## 첫 설계: SwiftUI 로 유리 바를 직접 그렸다

처음 만든 시제품은 `UITabBar` 가 아니었어요. **SwiftUI 의 `glassEffect` 로 탭바 모양을 직접 그려** `UIHostingController` 에 담고, 그 뷰를 PlatformView 로 띄웠어요. Flutter 탭바와 같은 크기·여백을 맞추기 쉬울 거라고 생각했거든요.

여기서 첫 함정이 **안전 영역**이었어요. 호스팅 컨트롤러가 safe area 를 받으면, Flutter 가 이미 계산한 하단 여백 위에 **홈 인디케이터 높이가 한 번 더** 붙었어요. 그래서 시제품에서는 safe area 를 끄고 여백을 Dart 쪽 계산(24pt)과 맞춰 직접 줬어요.

```swift
// 하단 여백은 Dart 쪽 높이 계산(24)과 맞춰 직접 준다. safe area 를 받으면 홈 인디케이터 높이가 이중으로 붙는다.
hosting.safeAreaRegions = []
```

시뮬레이터(iPhone 17 Pro, iOS 26.3)에서 띄워 보니 유리 바는 잘 나왔어요. 그런데 화면을 보고 바로 알았어요. **제가 원한 건 "유리처럼 생긴 바"가 아니라 "설정 앱에 있는 그 탭바"였어요.** 직접 그린 유리는 결국 또 하나의 흉내였어요. 선택 렌즈, 눌렀을 때의 반응, 다크 재질 같은 세부를 다시 따라 그려야 했고요.

그래서 한 시간 만에 **시스템 `UITabBar` 로 교체**했어요. 외형은 시스템에 맡기고 세 가지만 정했어요.

- **다크 고정**: 앱 화면이 어두워서, 라이트 재질이면 밝은 유리 위에 흰 아이콘이 묻혀요.
- **틴트**: 선택 아이콘을 앱의 라임색(`#CDF246`)으로.
- **선택 버블**: 다크 기본 버블(회색)이 라임 아이콘과 따로 놀아서, 버블에 라임을 25% 섞었어요.

```swift
tabBar.overrideUserInterfaceStyle = .dark
tabBar.tintColor = tintColor
let appearance = tabBar.standardAppearance.copy()
appearance.selectionIndicatorTintColor = tintColor.withAlphaComponent(0.25)
tabBar.standardAppearance = appearance
tabBar.scrollEdgeAppearance = appearance
```

`UITabBar` 로 바꾸자 안전 영역 문제도 다른 모양이 됐어요. 높이를 시스템이 정하거든요. 그래서 **탭바를 Dart 가 준 영역의 아래쪽에만 붙이고, 위쪽 남는 공간은 투명**으로 뒀어요. 코드 주석상 시스템이 정하는 높이에는 홈 인디케이터 영역이 포함돼요.

```swift
NSLayoutConstraint.activate([
    tabBar.leadingAnchor.constraint(equalTo: containerView.leadingAnchor),
    tabBar.trailingAnchor.constraint(equalTo: containerView.trailingAnchor),
    tabBar.bottomAnchor.constraint(equalTo: containerView.bottomAnchor),
])
```

여기서 볼 건 **top 제약이 없다**는 점이에요. Dart 는 글자 배율을 반영한 "넉넉한 상자"를 주고, 네이티브는 그 바닥에 시스템 높이로 붙어요. 둘이 서로의 높이를 정확히 맞추려 하지 않으니, 높이 계산이 어긋나도 바가 잘리지는 않아요.

## 경계 긋기: 네이티브는 그리고, 판단은 Dart 가 한다

이제 Dart 와 Swift 가 무엇을 나눠 가질지 정해야 했어요. 기준은 하나였어요. **탭바 말고는 아무것도 바꾸지 않는다.** 탭을 눌렀을 때 어느 화면으로 갈지, 같은 탭을 다시 누르면 맨 위로 스크롤할지, 연타를 막을지는 이미 Dart 의 하단 탭바 위젯과 라우터(`go_router` 의 `goBranch`)가 알고 있었어요. 이걸 Swift 로 옮기면 iOS 와 Android 가 다른 규칙을 갖게 돼요.

그래서 역할을 이렇게 나눴어요.

| | 맡는 일 |
|---|---|
| **Dart** | 무엇을 그릴지(항목·선택·배지) 정하고, 탭 이벤트를 받아 이동을 판단 |
| **Swift** | 받은 상태대로 `UITabBar` 를 그리고, 눌린 칸 번호만 통지 |

채널은 PlatformView 하나당 하나예요. 이름 뒤에 뷰 ID 를 붙여요. 방향별로 메서드가 하나씩이에요.

| 방향 | 메서드 | 인자 |
|---|---|---|
| Dart → Swift | `update` | 전체 상태 (생성 시에는 `creationParams` 로 같은 형식) |
| Swift → Dart | `onTap` | 눌린 칸 번호(`int`) |

상태의 모양은 Dart 위젯의 주석에 계약으로 적어 뒀어요. 한쪽만 고쳐도 다른 쪽이 주석만 보고 맞출 수 있게요.

```dart
/// 채널 계약(`update` 인자·creationParams): `{selectedIndex: int, textScale: double, items: [{label, icon, iconSize,
/// badgeCount, hasRedDot, identifier}]}`.
class NativeGlassTabBar extends StatefulWidget {
  static const String _viewType = 'app/native_glass_tab_bar';
  // ...
}
```

`icon` 은 이미지 경로가 아니라 **`Assets.xcassets` 의 이미지셋 이름**이에요. 탭 아이콘 SVG 를 템플릿 렌더링으로 iOS 에셋에 따로 넣어 두고, Swift 는 `UIImage(named:)` 로 꺼내요. 템플릿이라 선택 색은 시스템이 틴트로 칠해요.

여기서 독자가 궁금해할 만한 게 있어요. **"매번 전체 상태를 보내면 낭비 아닌가?"** 탭바 상태는 항목 6개 남짓이라 작아요. 대신 같은 상태를 두 번 보내지 않게 했어요. 중첩 `List` 라 `==` 로 비교가 안 돼서, 문자열로 바꿔 비교해요.

```dart
void _sendStateIfChanged() {
  final channel = _channel;
  if (channel == null) return;
  final state = _buildState(_currentTextScale());
  if (state.toString() == _lastSentState) return;
  _lastSentState = state.toString();
  channel.invokeMethod<void>('update', state);
}
```

이 함수를 부르는 곳이 세 군데예요. 위젯 인자가 바뀔 때(`didUpdateWidget`), 글자 배율이 바뀔 때(`didChangeDependencies`, 위젯 인자는 그대로라 `didUpdateWidget` 이 안 와요), 그리고 **뷰가 막 만들어졌을 때**예요.

마지막 것은 리뷰에서 나온 지적이었어요. `creationParams` 는 **첫 `build` 시점의 값**이에요. 그런데 네이티브 뷰가 실제로 만들어지는 건 그보다 늦어요. 그 사이에 배지 수나 선택이 바뀌면 `_channel` 이 아직 `null` 이라 `update` 가 버려지고, 네이티브는 옛 상태로 남아요. 그래서 `onPlatformViewCreated` 에서 마지막 전송 기록을 지우고 한 번 더 보내요.

```dart
void _handlePlatformViewCreated(int viewId) {
  _channel = MethodChannel('${NativeGlassTabBar._viewType}_$viewId')
    ..setMethodCallHandler((call) async {
      if (call.method == 'onTap' && call.arguments is int) {
        widget.onTap(call.arguments as int);
      }
    });
  // creationParams 는 첫 build 시점 값이라, 뷰 생성 전에 바뀐 선택·뱃지를 한 번 더 보낸다.
  _lastSentState = '';
  _sendStateIfChanged();
}
```

Swift 쪽에도 작은 규칙이 하나 있어요. **항목 구성(라벨 목록)이 같으면 `UITabBarItem` 을 다시 만들지 않아요.** `setItems` 로 갈아끼우면 선택 애니메이션이 끊기거든요. 나중에 조건에 따라 탭 한 칸이 다른 탭으로 바뀌는 기능이 붙었을 때도, 라벨이 달라지는 그 순간에만 항목을 새로 만들면 됐어요.

## 막힌 지점 1: 탭이 안 먹는다

`UITabBar` 로 바꾸고 처음 띄웠을 때, **유리는 예쁘게 나오는데 탭을 눌러도 아무 일이 없었어요.**

원인은 Flutter 쪽 제스처 경쟁이었어요. 앱의 공용 Scaffold 는 화면 아무 데나 누르면 키보드를 내리려고 **탭 인식기를 하나 감싸 두고** 있어요. PlatformView 위의 터치도 Flutter 의 제스처 경쟁(gesture arena)을 먼저 거치는데, 이 경쟁에서 **Scaffold 의 탭 인식기가 이기면 터치가 네이티브 뷰까지 가지 않아요.**

해결은 `UiKitView` 에 **`EagerGestureRecognizer`** 를 주는 거였어요. 손가락이 닿는 즉시 이 뷰가 제스처를 가져가요.

```dart
UiKitView(
  viewType: NativeGlassTabBar._viewType,
  creationParams: _buildState(textScale),
  creationParamsCodec: const StandardMessageCodec(),
  onPlatformViewCreated: _handlePlatformViewCreated,
  // 공용 Scaffold 의 키보드 내리기 탭 인식기가 제스처 경쟁에서 이겨 네이티브로 터치가 안 간다.
  gestureRecognizers: const {Factory<OneSequenceGestureRecognizer>(EagerGestureRecognizer.new)},
)
```

탭바는 스크롤이나 드래그를 Flutter 와 나눠 쓸 일이 없어서, 모든 제스처를 네이티브가 가져가도 잃는 게 없었어요. **스크롤 가능한 네이티브 뷰라면 이렇게 하면 안 돼요.** 그때는 필요한 인식기 종류만 넘겨야 해요.

## 막힌 지점 2: 빠르게 누르면 선택과 화면이 어긋난다

탭이 먹기 시작하자 다음 문제가 보였어요. **탭을 빠르게 연달아 누르면, 탭바는 C 탭이 선택돼 있는데 화면은 B 탭에 머물렀어요.** 그 상태가 다음 탭을 누를 때까지 계속됐어요.

원인은 기존 Flutter 탭바의 연타 방지였어요. Flutter 탭바는 **마지막 탭에서 500ms 안에 들어온 탭을 모두 무시**해요. Flutter 탭바에서는 무시된 탭이 아무 흔적도 남기지 않아요. 선택 표시도 Dart 상태로 그리니까요.

`UITabBar` 는 달라요. **누르는 순간 UIKit 이 스스로 선택을 옮겨요.** Dart 는 그 탭을 무시했으니 상태가 그대로이고, 상태가 그대로이니 `update` 도 보내지 않아요. 결국 네이티브 선택만 C 로 가 있고 화면은 B 에 남아요.

### 첫 시도: 콜백 안에서 선택을 되돌린다

처음엔 "선택은 Dart 가 확정한 값만 따른다"로 고쳤어요. `didSelect` 가 오면 마지막으로 확정된 칸으로 즉시 되돌리고, 실제 이동은 Dart 의 `update` 로 받는 방식이에요.

```swift
func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
    applySelection(confirmedSelectedIndex) // Dart 가 확정한 칸으로 되돌린다
    channel.invokeMethod("onTap", arguments: item.tag)
}
```

논리적으로는 맞아 보였어요. 그런데 고쳐지지 않았어요. 로그를 찍어 보니 **iOS 26 의 `UITabBar` 는 콜백 안에서 선택을 되돌려도, 선택 애니메이션이 끝날 즈음(약 0.6초 뒤) 탭한 항목으로 선택을 다시 확정**했어요. 렌즈가 탭한 자리로 미끄러지는 애니메이션이 진행 중이라, 중간에 바꾼 값을 애니메이션 끝에 덮어쓰는 것으로 보여요. 이 재확정은 제가 찾아본 Apple 문서에 적혀 있지 않았고, 디버그 로그로 확인한 동작이에요(iOS 26.x 기준).

### 다시 세운 규칙: 다른 탭 전환은 무조건 받는다

UIKit 의 선택을 거스를 수 없다면, Dart 가 맞추는 수밖에 없어요. 그래서 규칙을 바꿨어요.

> **네이티브 경로에서는 다른 탭으로의 전환을 절대 무시하지 않는다. 연타 방지는 같은 탭 재선택에만 건다.**

같은 탭을 다시 누르면 맨 위로 스크롤하는 동작이 있어서, 이건 여전히 중복을 막아야 했어요. 기준 시각도 "마지막 탭"이 아니라 **"마지막 재선택"** 으로 바꿨어요. 그래야 다른 탭으로 옮긴 직후의 재선택은 막히지 않아요.

```dart
void _handleNativeTap(int index) {
  final now = DateTime.now();
  final isReselect = index == _selectedSlot;
  final isRapidReselect =
      isReselect &&
      _lastReselectTime != null &&
      now.difference(_lastReselectTime!) <= const Duration(milliseconds: 500);

  if (isRapidReselect) return;
  widget.onTap?.call(widget.items[index]);
  _lastReselectTime = isReselect ? now : null;
}
```

Swift 의 되돌리기 코드는 지웠어요. 지금 `didSelect` 는 칸 번호를 알리기만 해요.

여기서 얻은 원칙은 이거예요. **상태의 주인이 둘이면, 한쪽은 다른 쪽을 거절할 수 없어야 한다.** `UITabBar` 는 선택을 스스로 바꾸는 부품이라, Dart 가 "그 탭은 무시할게"라고 할 수 있는 자리가 없었어요. Flutter 탭바와 네이티브 탭바가 같은 `onTap` 을 받지만, 연타 처리 함수는 따로 두게 된 이유예요.

## 성능: PlatformView 하나의 값

PlatformView 에 성능 비용이 있다는 건 문서에도 있었어요. 그래서 기본값을 켜기 전에 **profile 빌드에서 홈 화면을 스크롤하며** 켠 빌드(ON)와 끈 빌드(OFF)를 비교했어요. 빌드별로 한 번씩 쟀어요.

**iPhone 15 (60Hz, iOS 26.6.1)**, Flutter 타임라인 약 50초 녹화:

| 항목 | OFF | ON |
|---|---|---|
| UI 스레드 중앙값 / p99 | 1.64 / 2.31ms | 1.96 / 2.90ms |
| Raster 중앙값 / p99 | 3.39 / 4.30ms | 2.91 / 4.03ms |
| 네이티브 합성 평균 / p99 | — | 0.38 / 1.14ms |
| 16.7ms 넘은 프레임 | 0 / 2,421 | 0 / 2,088 |

**iPhone 16 Pro (120Hz)**, 같은 방식:

| 항목 | OFF | ON |
|---|---|---|
| UI 스레드 중앙값 / p99 | 1.07 / 2.63ms | 2.40 / 3.30ms |
| Raster 중앙값 / p99 | 3.34 / 5.26ms | 2.32 / 3.34ms |
| 네이티브 합성 중앙값 / p99 | — | 0.36 / 0.71ms |
| 8.3ms 넘은 프레임 | 7 | 3 |

여기서 볼 건 두 가지예요. **UI 스레드는 조금 늘고, Raster 는 줄었어요.** Raster 가 준 건 흉내 유리의 `BackdropFilter`(blur 25)가 빠진 몫으로 추정해요(따로 분리해 재지는 않았어요). 그리고 **네이티브 합성(`PlatformViewsController::PerformSubmit`) 비용은 p99 로도 1ms 남짓**이었어요.

Xcode Instruments 의 Animation Hitches 로 iOS 합성 단계까지 봐도 두 기기 모두 **hitch 는 0건**이었어요.

한계도 있어요. 측정은 빌드마다 **1회**였고 홈 화면만 쟀어요. iPhone 16 Pro 의 ON 녹화에서는 약 8초 동안 화면에 표시된 프레임이 초당 85~92 로 떨어진 구간이 있었는데, 같은 빌드의 Flutter 타임라인은 120fps 를 유지하고 있었어요. 스크롤 속도 차이인지, 녹화 부하인지, 합성 비용인지는 한 번의 측정으로 가를 수 없어서 원인 미확인으로 남겼어요. ON 빌드에서 UI 269ms 프레임이 한 번 나온 것도 마찬가지예요.

## 폴백: iOS 26 미만과 Android 는 그대로

이 앱의 최소 배포 버전은 iOS 15.6 이에요. Liquid Glass 탭바는 iOS 26 부터라서, 그 아래와 Android 는 기존 Flutter 탭바를 그대로 써요. 판정은 Dart 에서 한 번만 해요.

```dart
static final bool isSupported = Platform.isIOS && (_iosMajorVersion() ?? 0) >= 26;

// Platform.operatingSystemVersion 은 iOS 에서 "Version 26.0 (Build 23A341)" 형태다.
static int? _iosMajorVersion() {
  final match = RegExp(r'(\d+)').firstMatch(Platform.operatingSystemVersion);
  return match == null ? null : int.tryParse(match.group(1)!);
}
```

버전을 읽지 못하면 `0` 으로 보고 Flutter 탭바로 떨어져요. **모르면 옛길로** 가는 쪽이 안전해서예요.

켜고 끄는 스위치도 두 개 뒀어요.

- **개발자 화면 토글**: 실기기에서 바로 ON/OFF 비교. 앱을 다시 켜면 기본값으로 돌아와요.
- **`--dart-define=NATIVE_TAB_BAR=false`**: profile 빌드 성능 비교용. profile 빌드에서는 개발자 화면을 열기 어려워서 빌드 인자로 정해요.

시제품은 기본 OFF 로 시작했고, 측정을 마친 뒤 기본값을 ON 으로 바꿨어요. 그 상태로 개발용 빌드에서 몇 주 동안 써 보면서 탭 전환, 배지, 튜토리얼·토스트처럼 Flutter 가 바 위에 그리는 요소가 제대로 겹치는지 지켜봤어요. 눈에 띄는 문제가 없어서 **iOS 26 이상 기본 ON** 으로 출시 브랜치에 반영했어요.

## 출시 뒤 1: QA 자동화가 탭을 못 찾는다

기본 ON 으로 바꿔 출시 브랜치에 반영한 날, iPhone 에서 돌리던 **UI 자동화 스크립트가 하단 탭을 찾지 못했어요.** 자동화는 Flutter 위젯의 Semantics 식별자(`main_tab_home` 같은 값)로 탭을 찾고 있었는데, 탭바가 네이티브로 바뀌면서 그 Semantics 노드가 사라졌거든요.

고치는 건 간단했어요. 채널 계약에 `identifier` 를 더하고, Swift 에서 **`UITabBarItem.accessibilityIdentifier`** 에 같은 값을 넣었어요. Flutter 탭바와 네이티브 탭바가 **같은 식별자**를 갖게 되니, 자동화 스크립트는 어느 쪽 탭바든 똑같이 찾아요.

하나 덧붙이면, 자동화 도구(WebDriverAgent)는 PlatformView 안의 `UITabBar` 를 보이지 않는 요소(`isVisible=0`)로 보고했어요. 그래서 스크립트 쪽에서 탭바 아래 요소는 보이는 것으로 취급하게 따로 맞췄어요.

이 일로 배운 건, **PlatformView 로 바꾸면 화면에서 Flutter 위젯 트리가 그 영역만큼 사라진다**는 거예요. 접근성, 테스트, 계측처럼 위젯 트리에 기대던 것들이 함께 빠져요.

## 출시 뒤 2: 시스템 배지가 아이콘을 덮는다

이 글을 쓰게 된 직접적인 계기가 이 문제예요.

하단 탭에 **숫자 없는 빨간 점(레드닷)** 을 찍는 기능이 붙었어요. 아직 안 해 본 기능으로 사용자를 이끄는 표시예요. Flutter 탭바에는 이미 지름 6pt 의 점 위젯이 있었어요. 네이티브 쪽은 채널 계약에 `hasRedDot` 을 더하고, 이렇게 그렸어요.

```swift
// 빈 문자열 badgeValue 는 숫자 없는 점으로 그려진다.
tabBar.items?[index].badgeValue = badgeCount > 0 ? "\(min(badgeCount, 99))" : (hasRedDot ? "" : nil)
```

`badgeValue` 에 빈 문자열을 넣으면 숫자 없는 배지가 나와요. 여기까지는 맞았어요. 그런데 실기기(iPhone 15, iOS 26)에서 보니 **그 "점"은 숫자 배지와 같은 크기, 약 18pt 의 빨간 원이었어요.** 아이콘을 절반쯤 덮었어요.

Apple 문서([`badgeValue`](https://developer.apple.com/documentation/uikit/uitabbaritem/badgevalue), 2026-11-18 확인)는 "배지가 표시할 텍스트"이고 기본값이 `nil` 이라고만 해요. **빈 문자열일 때 크기가 어떻게 되는지는 적혀 있지 않아요.** 크기를 줄이는 공개 API 도 찾지 못했어요. 시스템 배지로는 6pt 점을 만들 수 없었어요.

그래서 **점에는 시스템 배지를 쓰지 않고, 6pt 점을 직접 그리기로** 했어요. 숫자 배지(채팅 안 읽음 수)는 그대로 시스템 배지예요. 숫자 배지는 원래 그 크기가 맞으니까요.

직접 그리기로 하자 질문이 세 개 생겼어요. 어디에 얹나, 아이콘 위치는 어떻게 아나, 언제 위치를 맞추나.

### 어디에 얹나: 아이콘 뷰 안이 아니라 그 위

처음엔 점 뷰를 아이콘 이미지 뷰의 자식으로 넣으면 위치가 저절로 따라올 거라 생각했어요. 실기기에서 보니 **점이 빨간색이 아니라 아이콘 색(라임·흰색)으로 칠해졌어요.** 시스템이 아이콘 내용 전체를 틴트로 칠하는데, 그 안에 넣은 점까지 함께 칠한 거예요.

그래서 점은 **탭바 밖, 탭바를 담은 컨테이너 뷰에 얹고 위치만 아이콘에 맞춰요.** 탭바 계층 밖이라 틴트가 닿지 않아요.

### 아이콘 위치는 어떻게 아나: 에셋 이름으로 찾는다

`UITabBarItem` 은 뷰가 아니라서 아이콘의 화면 위치를 알려 주지 않아요. 탭바의 하위 뷰를 뒤져서 아이콘 이미지 뷰를 찾아야 했어요. 단서는 **`UIImage(named:)` 로 만든 이미지가 그 이름을 `accessibilityIdentifier` 로 갖는다**는 점이었어요. 채널로 받은 아이콘 이름이 곧 찾을 열쇠예요.

함정이 하나 더 있었어요. **iOS 26 탭바는 한 항목의 아이콘을 두 벌 그려요.** 평소 아이콘과 선택 렌즈 안의 아이콘이에요. 둘 다 같은 이름을 가지니, 그냥 찾으면 점이 두 개 생겨요. 그래서 **같은 가로 중심에는 한 번만** 달아요.

```swift
private func layoutRedDots() {
    var frames: [CGRect] = []
    var placed: Set<Int> = []
    for iconView in descendants(of: tabBar).compactMap({ $0 as? UIImageView }) {
        let name = iconView.accessibilityIdentifier ?? iconView.image?.accessibilityIdentifier
        guard let name, redDotIconNames.contains(name) else { continue }
        let icon = iconView.convert(iconView.bounds, to: containerView)
        guard icon.width > 0, icon.height > 0, containerView.bounds.contains(icon) else { continue }
        guard placed.insert(Int(icon.midX.rounded())).inserted else { continue } // 두 벌 중 한 번만
        frames.append(CGRect(
            x: icon.maxX + redDotOutset - redDotSize,  // 오른쪽 위에서 2pt 바깥
            y: icon.minY - redDotOutset,
            width: redDotSize,                          // 6pt
            height: redDotSize
        ))
    }
    // ... frames 개수에 맞춰 점 뷰를 더하거나 빼고, frame 을 옮긴다
}
```

위치 규칙(지름 6pt, 아이콘 오른쪽 위에서 2pt 바깥)은 Flutter 탭바의 점과 같게 맞췄어요. Flutter 쪽은 `Positioned(right: -2, top: -2, child: RedDot())` 이에요.

여기서 분명히 해 둘 게 있어요. **탭바의 하위 뷰 계층은 Apple 의 공개 계약이 아니에요.** iOS 업데이트로 구조가 바뀌면 아이콘을 못 찾을 수 있어요. 그때의 정책을 미리 정했어요. **못 찾으면 점 없이 지나가요.** 큰 배지로 되돌리지도, 엉뚱한 자리에 그리지도 않아요. 점은 "있으면 좋은" 안내라서, 사라지는 쪽이 아이콘을 덮는 쪽보다 낫다고 판단했어요.

### 언제 위치를 맞추나: 배치가 끝난 뒤, 두 번

아이콘 위치는 탭바가 배치를 마쳐야 정해져요. `update` 를 받은 그 자리에서 찾으면 아직 0 크기이거나 옛 위치예요. 게다가 탭을 바꾸면 **선택 렌즈가 미끄러지는 동안 아이콘이 흔들려요.** 그래서 위치를 두 번 맞춰요.

```swift
private func scheduleRedDotLayout() {
    DispatchQueue.main.async { [weak self] in self?.layoutRedDots() }                     // 이번 런루프 끝
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { [weak self] in self?.layoutRedDots() } // 애니메이션 끝 즈음
}
```

`update` 를 받을 때와 탭이 선택될 때 이 함수를 불러요. 회전이나 크기 변경도 있으니, 컨테이너 뷰의 `layoutSubviews` 에서도 다시 맞춰요.

그런데 이렇게 하면 **무한 반복**이 생길 수 있어요. 점 뷰를 컨테이너에 더하거나 빼면 컨테이너가 다시 배치되고, 그러면 `layoutSubviews` 가 또 불려요. 그래서 **점 개수가 바뀔 때만 뷰를 더하고 빼고, 나머지는 `frame` 만 옮겨요.** 개수가 같으면 뷰 계층이 바뀌지 않으니 재배치가 다시 일어나지 않아요.

실기기에서 바꾸기 전에는 약 18pt 원이 챌린지 아이콘을 덮었고, 바꾼 뒤에는 6pt 점이 아이콘 오른쪽 위에 찍혔어요. **그 탭을 선택해서 아이콘이 라임 렌즈 안에 들어가도 점은 빨간색 그대로, 같은 자리에** 있었어요.

## 어디에 쓰지 않나

이번 방식이 맞는 경우와 아닌 경우를 가르는 기준을 하나 정해 봤어요.

> **그 부품이 "시스템이 그려 주는 모양" 말고는 앱만의 상태를 거의 갖지 않는가?**

탭바는 맞았어요. 상태라고는 선택 칸과 배지뿐이고, 판단은 전부 Dart 에 있었어요. 반대로 이런 경우에는 다시 생각할 거예요.

- **부품이 스스로 상태를 많이 바꾸는 경우.** 탭바의 선택 하나만으로도 연타 규칙을 다시 짜야 했어요. 텍스트 입력이나 스크롤 뷰처럼 상태가 계속 바뀌는 부품이면 동기화 비용이 훨씬 커져요.
- **시스템 모양을 조금만 벗어나야 하는 경우.** 레드닷 하나를 위해 비공개 뷰 계층을 뒤지게 됐어요. 디자인이 시스템 부품에서 멀어질수록 이런 우회가 늘어요.
- **위젯 트리에 기대는 도구가 많은 영역.** 접근성, UI 자동화, 계측이 그 영역에서 빠져요.

## 마치며: 흉내를 멈추니 남은 일

처음 질문은 "iOS 다움의 차이가 시스템 부품 몇 개에 몰려 있나?"였어요. 탭바 하나로 답한 건 **적어도 탭바는 그렇다**는 거예요. 시스템 `UITabBar` 를 PlatformView 로 띄우니 Liquid Glass 의 굴절, 선택 렌즈, 다크 재질을 따라 그리지 않아도 됐고, 성능도 측정한 범위에서는 떨어지지 않았어요. 앱 전체를 다시 쓸지는 이 결과만으로 정하지 않았어요.

대신 다른 걸 배웠어요.

**시스템 부품을 빌리면, 모양만이 아니라 그 부품의 고집도 함께 빌려 와요.**

`UITabBar` 는 누르는 순간 선택을 옮기고, 애니메이션 끝에 그 선택을 다시 확정하고, 빈 배지도 숫자 배지 크기로 그려요. 흉내 낼 때는 이 모든 걸 제가 정했지만, 빌려 오고 나서는 제가 맞춰야 했어요. 돌아보면 고생한 지점은 전부 **"Dart 가 정하고 싶은 것"과 "UIKit 이 이미 정한 것"이 겹치는 자리**였어요.

Flutter 앱에 시스템 부품을 PlatformView 로 붙이려 한다면, 시작하기 전에 세 가지를 물어보세요.

1. **이 부품은 사용자의 입력에 스스로 상태를 바꾸나요?** 바꾼다면 Dart 쪽에서 그 변화를 거절하는 코드(디바운스, 검증)가 있는지 찾아보세요. 그 코드는 네이티브 경로에서 다르게 짜야 해요.
2. **디자인이 시스템 기본 모양에서 얼마나 벗어나나요?** 공개 API 로 못 바꾸는 부분이 있다면, 그 부분이 사라져도 괜찮은지 먼저 정하세요.
3. **그 영역의 위젯 트리에 기대던 것이 뭐가 있나요?** Semantics 식별자, 위젯 테스트, 자동화 스크립트를 바꾸기 전에 목록으로 뽑아 두세요.

## 참고 자료

- Apple, [Adopting Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass) — 표준 컴포넌트가 재질을 자동으로 입는다는 설명 (2026-11-18 확인)
- Apple, [`UITabBarItem.badgeValue`](https://developer.apple.com/documentation/uikit/uitabbaritem/badgevalue) — 빈 문자열일 때의 크기는 설명하지 않아요 (2026-11-18 확인)
- Flutter, [Hosting native iOS views in your Flutter app with platform views](https://docs.flutter.dev/platform-integration/ios/platform-views) — iOS 는 Hybrid composition 만 쓴다는 설명과 성능 주의 (2026-11-18 확인)
- 기준 환경: 시뮬레이터 iPhone 17 Pro(iOS 26.3), 실기기 iPhone 15(iOS 26.6.1)·iPhone 16 Pro, 최소 배포 버전 iOS 15.6, 출시 시점 Flutter 3.47.4
