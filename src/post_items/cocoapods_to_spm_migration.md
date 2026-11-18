---
title: 'CocoaPods 에서 SPM 으로 옮기며 깨진 것들'
author: jack
date: 2026. 11. 18.
published: true
description: 'Flutter 앱의 iOS 의존성을 CocoaPods 에서 Swift Package Manager 로 옮기면서, CocoaPods 가 조용히 대신 해 주던 일들이 하나씩 드러난 기록이에요.'
cover: /posts/cocoapods_to_spm_migration/cover.webp
tags: [Flutter, iOS, SPM, CocoaPods, Xcode]
---

## 들어가며: 지금도 빌드는 되는데 왜 옮기나

저는 Flutter 로 웰니스 앱을 만들고, 앱에 붙는 서버(Django·FastAPI)도 함께 맡고 있어요.

2026년 10월 중순, CI 의 iOS 빌드가 갑자기 전부 `pod install` 단계에서 멈췄어요. 코드는 한 줄도 바꾸지 않았어요. 원인은 **Facebook iOS SDK 19.0.0 이 새로 공개된 것**이었어요. 저희는 Podfile 에서 18.0.2 로 버전을 고정해 두고 있었는데요. CocoaPods 의 CDN 검색은 **고정 버전과 상관없이 그 pod 의 모든 버전 podspec 을 받아 와요.** 그중 새 19.0.0 podspec 이 CI 러너에서 `Error in the HTTP2 framing layer` 로 받아지지 않았고, `pod install` 전체가 실패했어요.

그때는 podspec URL 을 직접 지정해서 trunk 검색을 건너뛰는 방식으로 넘어갔어요. 그런데 비슷한 시기에 더 큰 소식이 있었어요. **CocoaPods 중앙 저장소(trunk)가 2026년 12월 2일부터 영구 읽기 전용**이 된다는 거예요. 이미 올라간 버전은 계속 받을 수 있지만, Firebase 같은 SDK 의 **새 버전은 더 이상 CocoaPods 로 받을 수 없어요.** 저희 앱이 trunk 에서 받던 네이티브 SDK 는 36개였어요.

Flutter 쪽도 같은 방향이었어요. Flutter 3.44 부터 Swift Package Manager(SPM)가 기본이고, 공식 문서는 **SPM 을 끄는 설정이 앞으로는 허용되지 않을 거라고** 안내하고 있었어요. 저희는 `enable-swift-package-manager: false` 로 버티는 중이었고요.

그래서 11월에 iOS 의존성을 SPM 으로 옮겼어요. 결과만 보면 **trunk 의존이 36개에서 0개**가 됐어요. 그런데 그 과정에서 **CocoaPods 가 조용히 대신 해 주던 일들이 하나씩 드러났어요.** 이 글은 그 목록이에요.

사건마다 증상 → 원인 → 해결 → 다음에 피하는 법 순서로 정리했고, 마지막에 체크리스트를 붙였어요. Flutter 앱을 SPM 으로 옮길 예정이거나, 옮긴 뒤 원인 모를 빌드 실패를 겪는 분께 도움이 될 거예요.

## 배경: Flutter 앱의 iOS 의존성은 세 겹이에요

Flutter 앱이 쓰는 패키지는 iOS 입장에서 세 종류로 나뉘어요.

| 종류 | 예시 | 어디서 받나 |
|---|---|---|
| 순수 Dart 패키지 | `dio`, `go_router` | pub.dev. iOS 와 무관 |
| 플러그인 (Dart + 네이티브 코드) | `firebase_core`, `flutter_line_sdk` | pub.dev 에서 받고, 그 안의 iOS 코드를 CocoaPods 나 SPM 으로 붙임 |
| 네이티브 SDK | `FirebaseCore`, `LineSDK`, `GoogleMaps` | 플러그인이 끌고 옴. CocoaPods 라면 trunk 에서 받음 |

12월 2일의 영향을 받는 건 세 번째 줄이에요. 그리고 SPM 으로 옮길 수 있는지는 두 번째 줄, **플러그인이 `Package.swift` 를 제공하는지**로 정해져요.

Flutter 는 **혼합 방식**을 지원해요. SPM 을 켜면 `Package.swift` 가 있는 플러그인은 SPM 으로, 없는 플러그인은 계속 CocoaPods 로 붙어요. 저희는 이 혼합 방식으로 먼저 켜고, CocoaPods 완전 제거는 나중으로 미뤘어요.

시작할 때 저는 세 가지를 당연하게 믿고 있었어요.

1. **앱의 최소 iOS 버전이 15.6 이면, 의존성도 15.6 기준으로 맞춰진다.** 저희는 2026년 6월에 앱 타깃을 13.0 에서 15.6 으로 올려 둔 상태였어요.
2. **Podfile 에 적어 둔 빌드 설정은 계속 적용된다.**
3. **빌드가 한 번 통과하면, 의존성 버전은 그대로 고정돼 있다.**

**셋 다 SPM 에서는 성립하지 않았어요.**

## 조사: 플러그인 51개 중 43개는 이미 SPM 을 지원했어요

먼저 범위를 쟀어요. `pubspec.lock` 에 고정된 버전의 플러그인 소스(`~/.pub-cache`)에 `Package.swift` 가 있는지를 하나씩 확인했어요. iOS 네이티브 코드가 있는 플러그인 51개 중 **43개는 지금 쓰는 버전에서 이미 SPM 을 지원했어요.**

지원하지 않는 8개는 pub.dev 최신 버전까지 같은 방식으로 확인했어요.

| 플러그인 | 상황 | 처리 |
|---|---|---|
| `fluttertoast` | 8.x 미지원, 10.0.2 지원 | **버전 업** (호출부 API 동일) |
| `flutter_facebook_auth` | 7.1.2 고정, 7.3.2 지원 | **버전 업** (아래 사건 3) |
| `google_maps_flutter_ios` | 최신도 미지원 | **다른 구현 패키지로 교체** (아래 사건 2) |
| `health` | 13.3.2 지원 | **보류**. 의존성 연쇄 업그레이드가 필요 |
| `mobile_device_identifier` | 원본 최신은 지원 | **보류**. 직접 고친 복사본을 쓰고 있어서 |
| `flutter_tts`, `flutter_email_sender`, `device_region` | 지원 버전 없음 | **CocoaPods 에 남김** |

여기서 볼 건, 이 판정이 **"`Package.swift` 가 있다"까지만 확인한 것**이라는 점이에요. 실제로 빌드되는지는 별개였어요. 첫 번째 사건이 바로 거기서 났어요.

> `health` 는 패치 버전 하나만 올리면 되는 줄 알았어요. 그런데 새 버전이 요구하는 `device_info_plus` 13 이 다시 `win32` 6 을 끌어오고, 그 바람에 `network_info_plus`·`share_plus`·`package_info_plus`·`flutter_local_notifications` 가 줄줄이 메이저 업그레이드가 필요했어요. SPM 전환과 섞기엔 범위가 커서 따로 떼어 냈어요.

## 사건 1: 앱은 15.6 인데 "이 타깃은 13.0 을 지원한다"며 깨졌어요

**증상.** SPM 을 켜고 빌드하자 패키지 해석 단계에서 이런 에러가 났어요.

```text
Target Integrity (Xcode): The package product 'LineSDK' requires minimum platform version 15.0 for the iOS platform, but this target supports 13.0
Target Integrity (Xcode): The package product 'GoogleCast' requires minimum platform version 16.0 for the iOS platform, but this target supports 15.0
```

처음 읽었을 땐 이상했어요. 앱 타깃은 15.6 이에요. "13.0 을 지원하는 타깃"이 어디 있다는 걸까요?

**원인.** 여기서 말하는 "타깃"은 앱이 아니라 **플러그인 패키지**였어요. SPM 은 패키지마다 자기 `Package.swift` 에 최소 iOS 버전을 선언하고, **의존하는 패키지가 그보다 높은 버전을 요구하면 거부해요.** 앱 타깃이 몇이든 상관없어요.

`flutter_line_sdk` 2.6.2 의 `Package.swift` 를 열어 보면 이래요.

```swift
let package = Package(
    name: "flutter_line_sdk",
    platforms: [
        .iOS("13.0"),
    ],
    dependencies: [
        .package(url: "https://github.com/line/line-sdk-ios-swift.git", from: "5.13.0")
    ],
    // ...
)
```

여기서 볼 건 두 가지예요. 플러그인은 **iOS 13.0** 을 선언했어요. 그리고 LINE SDK 를 **`from: "5.13.0"`**, 즉 "5.13.0 이상의 최신"으로 받아요. 그 최신인 5.17.0 이 iOS 15 를 요구하면서 충돌이 났어요. `flutter_chrome_cast` 1.4.6 도 같은 구조예요. 플러그인은 iOS 15.0 을 선언하고 `google-cast-sdk` 를 `from: "4.8.3"` 으로 받는데, 최신 4.8.6 이 iOS 16 을 요구했어요.

그럼 CocoaPods 에서는 왜 괜찮았을까요? Podfile 의 `post_install` 에 이런 코드가 있었어요.

```ruby
# 프로젝트 최소 타겟(15.6) 미만인 Pod 는 모두 15.6 으로 상향.
deployment_target = config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
if deployment_target && deployment_target.to_f < 15.6
  config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.6'
end
```

**CocoaPods 는 설치 후에 모든 pod 의 빌드 설정을 덮어쓸 수 있었어요.** 플러그인이 13.0 을 선언해도 저희가 15.6 으로 올려 버리면 그만이었죠. 첫 번째 가정, "앱이 15.6 이면 의존성도 15.6 에 맞춰진다"는 사실 **이 몇 줄이 만들어 준 것**이었어요. SPM 에는 `post_install` 같은 훅이 없어요. 패키지의 `Package.swift` 는 패키지 작성자의 것이고, 앱 쪽에서 고칠 수 없어요.

**해결.** 충돌하지 않는 마지막 버전으로 고정했어요. SPM 이 실제로 쓸 버전을 적어 두는 잠금 파일 `Package.resolved` 에 `google-cast-sdk` **4.8.4**, `line-sdk-ios-swift` **5.16.0** 을 적었어요. 5.16.0 의 `Package.swift` 는 iOS 13 을 선언해서 플러그인과 맞아요.

`Package.resolved` 는 두 곳에 있어요.

- `ios/Runner.xcworkspace/xcshareddata/swiftpm/Package.resolved`
- `ios/Runner.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved`

두 파일 내용이 같아야 하고, 둘 다 커밋해요. 저희 앱은 지금 이 파일에 패키지 25개가 고정돼 있어요.

**다음에 피하는 법.** 이 고정은 **Xcode 의 "Update to Latest Package Versions" 한 번이면 풀려요.** 누르는 순간 4.8.6·5.17.0 으로 올라가고 빌드가 깨져요. 팀에 공유해 두고, 근본 해결은 따로 잡아 뒀어요. `flutter_line_sdk` 3.0.0 으로 올리거나(Android Gradle Plugin 9 가 필요해요), 앱의 최소 iOS 를 16 으로 올리는 거예요.

> 원래 SPM 을 꺼 둔 이유도 이 계열이었어요. `pubspec.yaml` 의 주석에 "`flutter_line_sdk`(LineSDK)가 iOS 15 를 요구해 생성 패키지 기본값(13.0)과 충돌"이라고 적혀 있었어요. Flutter 문서가 이 계열 에러에 안내하는 해법은 앱의 최소 배포 버전을 올리고 `flutter build ios --config-only` 를 다시 돌리는 거예요. Flutter 가 만드는 `FlutterGeneratedPluginSwiftPackage` 쪽 문제라면 그걸로 풀려요. 하지만 **플러그인 자신의 선언은 앱 타깃으로 풀리지 않았어요.** 같은 에러 문구가 두 가지 다른 원인을 가리킬 수 있어요.

## 사건 2: 지도 플러그인은 구조상 SPM 을 쓸 수 없었어요

**증상.** `google_maps_flutter_ios` 는 최신 버전에도 `Package.swift` 가 없었어요. 버전을 올려서 풀 수 있는 문제가 아니었어요.

**원인.** 기본 iOS 구현은 **앱의 최소 iOS 버전에 따라 Google Maps SDK 버전이 달라지는 구조**예요. podspec 은 `GoogleMaps` 를 `'>= 8.4', '< 11.0'` 처럼 넓은 범위로 받고, SDK 9.x 는 iOS 15, 10.x 는 iOS 16 을 요구해요. 이 구조를 SPM 으로 옮기지 못해서 지원이 막혀 있다는 게 Flutter 저장소 이슈의 설명이에요([flutter/flutter#146920](https://github.com/flutter/flutter/issues/146920)). 사건 1 을 떠올리면 짐작이 가요. SPM 은 범위 안의 최신판을 고르고, 그 최신판의 최소 iOS 가 앱보다 높으면 깨져요.

**해결.** Flutter 팀이 SDK 버전별로 따로 낸 구현 패키지가 있어요. `google_maps_flutter_ios_sdk9`(Maps SDK 9.x, iOS 15 이상)와 `google_maps_flutter_ios_sdk10`(iOS 16 이상)이에요. 앱 `pubspec.yaml` 에 의존성으로 넣기만 하면 기본 구현을 대신해요.

```yaml
dependencies:
  google_maps_flutter_ios_sdk9: "^2.19.0"
```

패키지 README 에도 "앱의 pubspec.yaml 에 의존성을 추가하면 기본 구현을 자동으로 대체한다"고 적혀 있어요. 앱 코드는 계속 `google_maps_flutter` 를 그대로 써요. 저희는 최소 iOS 가 15.6 이라 sdk9 를 골랐어요. 전환 전에도 Maps SDK 9.4.0 을 쓰고 있었는데, 교체 후에도 9.4.0 이 그대로 들어왔어요. 실기기에서 러닝 화면의 지도 타일·현재 위치 표시를 확인했어요.

**다음에 피하는 법.** 미지원 플러그인을 만나면 "언제 지원하나"를 기다리기 전에, **같은 플랫폼 인터페이스를 구현한 다른 패키지가 있는지** 먼저 찾아보세요. Flutter 의 연합 플러그인(federated plugin) 구조에서는 앱이 플랫폼 구현을 골라 끼울 수 있어요.

## 사건 3: Podfile 로 버티던 Facebook SDK 고정이 필요 없어졌어요

이건 깨진 게 아니라 **풀린** 사건이에요.

저희는 `flutter_facebook_auth` 를 7.1.2 로 고정하고, Podfile 에서 FBSDK pod 4개를 18.0.2 로 붙잡고 있었어요. 들어가며에서 쓴 CDN 사고 때문에 이 고정은 jsDelivr 의 podspec URL 을 직접 가리키는 모양까지 돼 있었어요.

```ruby
fbsdk_spec = ->(name, shard) { "https://cdn.jsdelivr.net/cocoa/Specs/#{shard}/#{name}/18.0.2/#{name}.podspec.json" }
pod 'FBSDKCoreKit', :podspec => fbsdk_spec.call('FBSDKCoreKit', '9/b/5')
pod 'FBSDKLoginKit', :podspec => fbsdk_spec.call('FBSDKLoginKit', 'b/3/c')
# ... 2줄 더
```

7.1.2 로 고정한 이유를 거슬러 올라가 보니, FBSDK 18.0.2 컴파일 오류를 피하려던 것이었어요([flutter-facebook-auth#478](https://github.com/darwin-morocho/flutter-facebook-auth/issues/478)). SPM 을 지원하는 7.3.2 로 올리면서 **Podfile 의 FBSDK 4줄을 지웠고**, FBSDK 는 SPM 으로 18.1.1 이 들어왔어요.

로그인 SDK 는 "빌드된다"와 "로그인된다" 사이가 멀어서, 실기기에서 Facebook Limited Login 으로 서버 로그인까지 끝까지 해 봤어요. LINE·Kakao·Google 로그인도 SDK 화면 진입까지 확인했어요.

**다음에 피하는 법.** Podfile 에 남아 있는 버전 고정은 **이유를 찾아 적어 두세요.** 이유를 모르면 지워도 되는지 판단할 수 없어요. 저희는 커밋 메시지와 Podfile 주석에 이유가 남아 있어서, 다시 조사하지 않고 지울 수 있었어요.

## 사건 4: Podfile 의 수동 설정은 SPM 플러그인에 닿지 않아요

**증상.** 이건 에러가 나지 않았어요. 그래서 일부러 찾아야 했어요.

**원인.** Podfile 의 `post_install` 은 **CocoaPods 가 만든 pod 타깃에만** 적용돼요. SPM 으로 옮겨 간 플러그인은 pod 타깃이 아니니 이 설정을 받지 못해요. 저희 Podfile 에는 그런 설정이 네 종류 있었어요.

| Podfile 설정 | 하던 일 | SPM 으로 옮긴 뒤 |
|---|---|---|
| `GCC_PREPROCESSOR_DEFINITIONS` 의 `PERMISSION_*=1` | `permission_handler` 가 쓸 권한 코드만 컴파일 | **적용 안 됨.** SPM 판이 다른 방식으로 판정 |
| `IPHONEOS_DEPLOYMENT_TARGET` 15.6 상향 | 낮게 선언한 pod 을 15.6 으로 | **적용 안 됨** (사건 1) |
| `SWIFT_ENABLE_EXPLICIT_MODULES=NO` | Xcode 26 에서 Firebase 서브스펙 모듈 해석 실패 회피 | 남은 pod 에만 적용 |
| `.xcprivacy` 를 Resources 로 이동 | 프라이버시 매니페스트 위치 교정 | 남은 pod 에만 적용 |

가장 위험한 건 첫 줄이었어요. `permission_handler` 는 **매크로가 켜진 권한의 코드만 컴파일해요.** 매크로가 꺼지면 해당 권한 요청 코드가 아예 빠지고, 앱은 권한을 요청해도 아무 일도 일어나지 않아요. 그래서 앱이 쓰는 권한만 골라 켜는 구조예요.

SPM 판(`permission_handler_apple` 9.4.10)의 `Package.swift` 를 보니 판정 순서가 적혀 있었어요.

```swift
// Permissions are resolved in priority order:
//   1. Environment variable (e.g. `launchctl setenv PERMISSION_CAMERA 1` ...)
//   2. Matching key present in the app's Info.plist
//   3. Default: enabled for permissions with no required plist key
//              (PERMISSION_NOTIFICATIONS, PERMISSION_CRITICAL_ALERTS),
```

**SPM 판은 Podfile 대신 앱의 `Info.plist` 에 사용 목적 키(`NSCameraUsageDescription` 등)가 있는지로 판정해요.** 저희 `Info.plist` 에는 카메라·사진·ATT 키가 있어서 이 셋은 그대로 켜져요. 대신 위치·마이크·모션도 키가 있어서 함께 켜지고, 반대로 Podfile 에서 켜 두었던 `PERMISSION_CRITICAL_ALERTS` 는 꺼져요(코드에서 쓰지 않아서 문제는 없었어요). **결과가 같은지는 소스를 읽는 것만으로 확신할 수 없어서**, 실기기용으로 빌드한 산출물을 `nm -u` 로 열어 봤어요.

| 권한 | 참조돼야 할 심볼 | 결과 |
|---|---|---|
| 사진 | `PHPhotoLibrary` | 있음 |
| 카메라 | `AVCaptureDevice` | 있음 |
| ATT | `ATTrackingManager` | 있음 |
| Critical Alerts | — | 없음 (의도대로) |

`Package.swift` 주석에는 하나 더 적혀 있어요. **`Info.plist` 나 환경 변수를 바꾼 뒤에는 DerivedData 를 한 번 지워야** Xcode 가 이 매니페스트를 다시 평가한다는 거예요. 권한 키를 추가했는데 반영이 안 되면 여기부터 보세요.

**다음에 피하는 법.** SPM 을 켜기 전에 **Podfile 의 `post_install` 을 한 줄씩 읽고**, 각 설정이 어느 플러그인을 위한 것이고 그 플러그인이 SPM 으로 옮겨 가는지 표로 만들어 보세요. 에러가 나지 않는 변화일수록 이 표 없이는 놓쳐요.

> 새 설치 상태에서 권한 팝업이 실제로 뜨는지는 앱을 지워야 해서 아직 확인하지 못했어요. [확인 필요: 새 설치 상태 권한 팝업 노출]

## 머지 직후: 같은 모양의 사고 두 개

전환을 main 에 머지한 다음 날, 두 가지가 드러났어요. 둘 다 다른 글에서 자세히 썼어요([iOS 크래시가 0건이었던 진짜 이유](/posts/ios_crashlytics_zero_crashes)).

- **Crashlytics 가 iOS 에서 0건이 됐어요.** dSYM 업로드 빌드 단계가 `${PODS_ROOT}` 아래의 `upload-symbols` 를 부르고 있었는데, SPM 으로 옮기면서 그 경로가 사라졌어요. 스크립트가 실패를 삼켜서 빌드는 계속 성공했어요.
- **`Package.resolved` 가 머지 커밋에서 빠졌어요.** 잠금 파일이 없으니 SPM 이 사건 1 의 최신판(4.8.6·5.17.0)을 다시 받아 archive 가 깨졌어요. 그래서 CI 의 gym 에 `disable_package_automatic_updates: true`(`xcodebuild -disableAutomaticPackageResolution`)를 켜서, 잠금 파일이 없으면 원인이 적힌 에러로 바로 멈추게 했어요.

두 사고는 이 글의 사건 1·4 와 뿌리가 같아요. **CocoaPods 시절에 무언가가 조용히 맞춰 주고 있었고, 옮긴 뒤엔 그게 빠졌는데 아무도 알려 주지 않았어요.**

## 헛걸음 경계: main 의 iOS CI 실패는 SPM 탓이 아니었어요

머지 직후 main 의 iOS CI 가 실패하고 있었어요. 전환 직후라 SPM 부터 의심하기 쉬운 타이밍이었는데, **실패 단계를 보니 인증서 저장소를 clone 하는 fastlane match 단계**였어요. 머지 전 커밋들에서도 같은 단계로 실패하고 있었고요. SPM 은 그보다 뒤인 빌드 단계에서야 관여해요.

큰 전환 직후의 빌드 실패는 **에러 문구보다 실패한 단계부터** 보세요. 그 단계가 전환과 닿는 곳인지부터 가르면, 엉뚱한 곳을 파는 시간을 줄일 수 있어요. 그 뒤 11월 12~13일에 dev·prod 서명 archive 가 SPM 상태로 CI 에서 통과했어요.

## 혼합 기간에 남아 있는 것들

CocoaPods 를 완전히 걷어 내기 전까지 남아 있는 함정도 적어 둘게요.

**`#include?` 는 파일이 없으면 조용히 건너뛰어요.** Flutter 가 만드는 `ios/Flutter/*.xcconfig` 첫 줄은 이렇게 생겼어요.

```text
#include? "Pods/Target Support Files/Pods-Runner/Pods-Runner.debug-dev.xcconfig"
#include "Generated.xcconfig"
```

물음표가 붙은 `#include?` 는 **파일이 없어도 에러 없이 넘어가요.** 그런데 이 Pods xcconfig 가 `FRAMEWORK_SEARCH_PATHS`·`OTHER_LDFLAGS` 를 제공해요. 그래서 `flutter clean` 직후 `pod install` 없이 빌드하면, 이 줄이 통째로 빠져서 `Undefined symbol: _OBJC_CLASS_$_FlutterError` 같은 링커 에러가 나요. SPM 전환 전에 겪은 일인데, 혼합 방식에서도 CocoaPods 에 남은 플러그인이 있는 한 그대로예요. 이럴 때 xcconfig 에 `FRAMEWORK_SEARCH_PATHS` 를 직접 추가하면 안 돼요. **xcconfig 는 같은 키를 다시 정의하면 앞의 값을 통째로 대체**해서, Pods 경로가 오히려 사라져요. `pod install` 을 다시 돌리는 게 답이에요. 저희 프로젝트에는 이런 xcconfig 가 11개 있고, CocoaPods 를 걷어 낼 때 이 줄들도 함께 지워야 해요.

**CI 는 아직 매 빌드 `pod deintegrate` 를 하고 `Podfile.lock` 을 지워요.** CocoaPods 1.16.2 로 빌드마다 남은 pod 을 다시 해석하니, 그 pod 들은 허용 범위 안의 최신판을 받아요. 남은 5개는 trunk SDK 에 의존하지 않아서 지금은 문제가 없지만, SPM 쪽에서 잠금 파일로 막은 일이 CocoaPods 쪽에서는 열려 있는 셈이에요.

**CI 는 빌드마다 DerivedData 를 지워요.** SPM 패키지가 DerivedData 아래 `SourcePackages/` 에 받아지니, **매 빌드 패키지 25개를 새로 받아요.** 빌드 시간이 얼마나 늘었는지는 아직 재지 않았어요. [확인 필요: 전환 전후 CI iOS 빌드 시간] 필요하면 gym 의 `cloned_source_packages_path` 로 패키지 위치를 DerivedData 밖으로 빼서 캐시할 계획이에요.

**pbxproj diff 가 커 보여도 놀라지 마세요.** SPM 을 켜면 Xcode 가 프로젝트 파일을 다시 쓰면서 `PBXFileSystemSynchronized*` 항목의 포맷이 바뀌어요. 의미 변화는 없어요. `[CP] Embed Pods Frameworks` 빌드 단계가 사라지는 것도 정상이에요. 동적 프레임워크로 들어오던 FBSDK pod 이 SPM 으로 옮겨 갔기 때문이에요. 스킴마다 "Run Prepare Flutter Framework Script" pre-action 이 추가되는 것도 Flutter 가 자동으로 하는 일이에요. 저희는 쓰는 스킴(dev·stg·prod)에 추가된 것만 확인했어요.

`Podfile.lock` 은 615줄이 줄었어요. 남은 건 SPM 을 지원하지 않는 플러그인 5개예요.

## SPM 전환 체크리스트

전환 전

- [ ] **플러그인마다 `Package.swift` 유무**를 `pubspec.lock` 버전 기준으로 확인했다. 미지원이면 최신 버전 → 대체 구현 패키지 → CocoaPods 잔류 순서로 검토했다.
- [ ] **Podfile `post_install` 의 설정을 한 줄씩** 어느 플러그인을 위한 것인지 표로 만들었다. SPM 으로 옮겨 가는 플러그인의 설정은 대체 수단을 찾았다.
- [ ] **Podfile 의 버전 고정마다 이유**를 찾았다. 이유가 없어졌으면 고정도 지운다.
- [ ] **빌드 단계 스크립트에서 `PODS_ROOT` 참조**를 찾았다. `grep -n 'PODS_ROOT' ios/Runner.xcodeproj/project.pbxproj`

전환 중

- [ ] **`Target Integrity` 에러는 플러그인 `Package.swift` 의 `platforms` 와 의존 SDK 의 최소 버전**을 비교해 봤다. 앱 타깃을 올려서 풀리는 문제인지 먼저 가른다.
- [ ] 버전을 고정했다면 **`Package.resolved` 두 곳을 모두 커밋**하고, 고정한 버전과 이유를 팀에 알렸다. "Update to Latest Package Versions" 금지.
- [ ] 권한·로그인·지도처럼 **"빌드됨"과 "동작함"이 먼 기능은 실기기**에서 끝까지 확인했다. 권한 매크로는 산출물을 `nm -u` 로 확인할 수 있다.

전환 후

- [ ] **CI 가 `Package.resolved` 에 적힌 버전만 쓰게** 했다 (`-disableAutomaticPackageResolution`).
- [ ] **머지 커밋에서 잠금 파일이 지워지지 않았는지** 확인했다. `git diff --name-status --diff-filter=D -- '*Package.resolved' '*.lock'`
- [ ] **dSYM 업로드처럼 실패해도 빌드가 통과하는 단계**가 실제로 성공하는지 봤다.
- [ ] 빌드가 실패하면 **에러 문구보다 실패한 단계부터** 본다.

## 마치며: CocoaPods 가 해 주던 일의 목록

처음엔 이 작업을 "설정 하나 끄고, 안 되는 플러그인 몇 개 버전 올리기" 정도로 봤어요. 실제로 바뀐 코드도 많지 않았어요. 시간이 든 곳은 코드가 아니라, **CocoaPods 가 저희 대신 해 주던 일을 찾아내는 것**이었어요. 의존성의 최소 iOS 를 앱에 맞춰 올려 주고, 권한 매크로를 넣어 주고, Firebase 를 `Pods/` 에 넣어서 업로드 스크립트가 돌게 해 주던 일들이요.

**도구를 바꿀 때 옮겨야 하는 건 설정 파일이 아니라, 그 도구가 해 주던 일의 목록입니다.**

그 목록은 어디에도 적혀 있지 않아요. Podfile 의 `post_install`, 빌드 단계 스크립트, 커밋 메시지에 흩어져 있어요. SPM 전환을 앞두고 있다면 세 가지를 먼저 물어보세요.

1. **Podfile `post_install` 의 각 줄이 무슨 일을 하는지 설명할 수 있나요?**
2. **빌드 단계 중에 `Pods/` 경로를 전제로 한 것이 있나요?**
3. **의존성 버전이 바뀌면 CI 가 멈추나요, 아니면 조용히 최신판을 받나요?**

## 참고 자료

- CocoaPods Blog, [CocoaPods Trunk Read-only Plan](https://blog.cocoapods.org/CocoaPods-Specs-Repo/) — trunk 읽기 전용 일정(2026-12-02). 기존 버전 설치는 계속된다고 안내 (2026-11 확인)
- Flutter, [Swift Package Manager for app developers](https://docs.flutter.dev/packages-and-plugins/swift-package-manager/for-app-developers) — 혼합 방식, 최소 배포 버전 에러 대처, SPM 끄기 설정에 대한 안내 (2026-11 확인)
- [flutter/flutter#146920](https://github.com/flutter/flutter/issues/146920) — `google_maps_flutter_ios` 의 SPM 미지원 이유
- [flutter-facebook-auth#478](https://github.com/darwin-morocho/flutter-facebook-auth/issues/478) — FBSDK 18.0.2 컴파일 오류
- `permission_handler_apple` 9.4.10 의 `ios/permission_handler_apple/Package.swift` — SPM 판 권한 매크로 판정 순서
- 기준 버전: Flutter 3.47.4, Xcode 26.6(CI ARM)·26.4.1(CI Intel), CocoaPods 1.16.2, `flutter_line_sdk` 2.6.2, `flutter_chrome_cast` 1.4.6, `google_maps_flutter_ios_sdk9` 2.19.0, `flutter_facebook_auth` 7.3.2
