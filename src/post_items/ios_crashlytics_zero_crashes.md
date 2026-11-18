---
title: iOS 크래시가 0건이었던 진짜 이유
author: jack
date: 2026. 11. 18.
published: true
description: CocoaPods 에서 SPM 으로 옮긴 뒤 Crashlytics 에 iOS 크래시가 한 건도 잡히지 않았어요. 조용히 실패하던 빌드 단계 하나를 찾아간 기록이에요.
cover: /posts/ios_crashlytics_zero_crashes/cover.webp
tags: [Flutter, iOS, Crashlytics]
---

## 들어가며: 크래시가 0건이라는 좋은 소식

저는 Flutter 로 웰니스 앱을 만들고, 앱에 붙는 서버도 함께 맡고 있어요.

어느 날 팀원이 iOS 에서 앱이 꺼졌다고 알려 왔어요. 로그를 보려고 Crashlytics 를 열었는데, **최신 iOS 버전의 크래시 리포트가 0건**이었어요. 방금 꺼진 앱의 기록이 없었어요. 크래시만 없는 게 아니라 non-fatal 도 한 건이 없었고요.

평소 같으면 "요즘 안정적이네" 하고 넘어갔을 숫자예요. 그런데 **눈앞에서 꺼진 앱이 있는데 0건**이라면 이야기가 달라져요. 0이 "크래시가 없다"는 뜻이 아니라 "**측정이 안 되고 있다**"는 뜻일 수도 있으니까요.

조사해 보니 원인은 CocoaPods 에서 Swift Package Manager(SPM)로 옮기면서 **조용히 실패하기 시작한 빌드 단계 하나**였어요. 그 바람에 **iOS 21개 빌드 동안 크래시가 하나도 집계되지 않았어요.**

이 글에서는 수집 → 전송 → 서버 처리 순서로 의심을 하나씩 지워 간 과정과, 같은 일이 다시 조용히 일어나지 않게 막은 방법을 정리했어요. iOS 의존성을 SPM 으로 옮겼거나 옮길 예정인 분, 특히 Flutter 앱에서 `firebase_crashlytics` 를 쓰는 분께 도움이 될 거예요.

## 배경: 크래시 리포트가 대시보드에 오기까지

iOS 크래시가 Crashlytics 대시보드에 보이기까지는 네 단계를 거쳐요.

| 단계 | 어디서 | 하는 일 |
|---|---|---|
| 1. 수집 | 앱(SDK) | 크래시·non-fatal 을 기기에 리포트로 저장 |
| 2. 전송 | 앱(SDK) | 다음 실행 때 리포트를 서버로 업로드 |
| 3. 심볼리케이션 | Crashlytics 서버 | 메모리 주소를 함수 이름·줄 번호로 바꿈. 이때 **dSYM** 이 필요 |
| 4. 집계 | Crashlytics 서버 | 이슈로 묶어 대시보드·알림·BigQuery 로 내보냄 |

**dSYM** 은 빌드할 때 만들어지는 디버그 심볼 파일이에요. 배포용 바이너리에는 함수 이름이 빠져 있어서, 서버는 이 파일이 있어야 스택 트레이스를 사람이 읽을 수 있게 바꿀 수 있어요. 보통 Xcode 빌드 단계(Run Script)에 업로드 스크립트를 넣어서, archive 할 때마다 자동으로 올려요.

조사를 시작할 때 저는 두 가지를 당연하게 믿고 있었어요.

1. **대시보드에 0건이면, 앱이 리포트를 안 보낸 것이다.** 문제가 있다면 1~2단계, 즉 앱 쪽에 있을 거라고 생각했어요.
2. **archive 가 성공했으면, 그 안의 빌드 단계도 다 성공한 것이다.**

**두 가정 모두 틀렸어요.**

## 현상: Android 는 들어오는데 iOS 만 특정 버전부터 0건

먼저 범위를 좁혔어요. 슬랙에 오는 Crashlytics 알림을 플랫폼별로 나눠 보니 모양이 분명했어요.

- **Android**: 가장 최근 빌드의 알림까지 꾸준히 들어와요.
- **iOS**: 알림이 온 버전이 전부 몇 달 전 구버전이에요. 최근 빌드에서 온 알림은 하나도 없어요.

**Crashlytics 전체가 멈춘 게 아니라 iOS 최신 빌드만 빠져 있었어요.** 알림은 새 이슈가 생길 때만 오니까, 정확한 경계는 BigQuery 로 확인했어요. Firebase 는 Sessions(앱 실행 기록)와 Crashlytics 이벤트를 각각 BigQuery 로 내보내 줘서, 둘을 앱 버전으로 묶으면 **"세션은 있는데 이벤트가 없는 버전"** 을 찾을 수 있어요.

| iOS 버전 | 세션당 Crashlytics 이벤트 |
|---|---|
| 0.509.1 | **약 0.7건** |
| 0.510.0 | 이벤트 있음 |
| 0.514.0 ~ 0.559.2 (21개 빌드) | **0건** |

여기서 볼 건 두 가지예요. 0.514.0 부터는 **세션이 꾸준히 쌓이는데도 이벤트가 0건**이에요. 0.509.1 의 비율대로라면 수백 건은 들어왔어야 해요. 그리고 **같은 시각에 구버전 iOS 의 이벤트는 계속 들어오고 있었어요.** Firebase 프로젝트나 BigQuery export 의 문제가 아니라 **새 빌드 쪽에서 무언가 바뀐 거예요.**

0.514.0 에 뭐가 들어갔는지 보니 바로 짚이는 게 있었어요. **iOS 의존성을 CocoaPods 에서 SPM 으로 옮긴 첫 빌드**였어요. 그렇다면 SPM 전환이 SDK 의 무엇을 바꿨을까요?

## 헛걸음: SDK 가 아예 안 켜진 걸까

첫 번째 가정대로 앱 쪽부터 의심했어요. 비슷한 증상의 이슈가 firebase-ios-sdk 에 있었거든요([#15696](https://github.com/firebase/firebase-ios-sdk/issues/15696), "Xcode 26 으로 만든 release 빌드에서 크래시와 non-fatal 이 사라진다"). 실행 파일에서 `__mh_execute_header` 심볼을 찾지 못하면 Crashlytics 가 아예 기동을 포기한다는 내용이었어요. 링크 방식이 바뀌는 SPM 전환과도 잘 맞아 보였어요.

그래서 Release 설정으로 로컬 빌드를 만들어 하나씩 확인했어요.

| 확인한 것 | 결과 |
|---|---|
| `__mh_execute_header` export (`dyld_info -exports`) | 있음 |
| archive 와 같은 `strip` 적용 뒤에도 남는지 | 남음 |
| Crashlytics 네이티브 코드가 링크됐는지 | `FIRCLS*` 심볼 1,737개 |
| 번들 안 `GoogleService-Info.plist` | 프로젝트·번들 ID 정상 |
| 전환 전후 Firebase SDK 버전 | 같음 (Firebase iOS SDK 12.14.0, `firebase_crashlytics` 5.2.3) |
| BigQuery 세션의 `crashlytics_data_collection_enabled` | `true` |

**전부 정상이었어요.** 수집 설정도 켜져 있고, SDK 도 제대로 들어가 있었어요. 다만 로컬 빌드는 CI 와 Xcode 버전이 달라서, 이것만으로 "앱은 정상"이라고 단정할 수는 없었어요. **실제로 배포된 빌드가 기기에서 어떻게 동작하는지** 봐야 했어요.

## 실기기: 리포트는 나갔는데 도착하지 않는다

CI 가 만든 배포 빌드를 실기기(iPhone)에 설치하고, 기기 로그를 보면서 두 가지를 확인했어요. SDK 가 기동하는지, 그리고 리포트를 실제로 서버에 보내는지요.

리포트를 확실히 만들려고 비행기 모드를 썼어요. 비행기 모드로 앱을 켜면 네트워크 오류가 non-fatal 로 기록돼요. 그다음 비행기 모드를 끄고 다시 실행하면, SDK 가 쌓아 둔 리포트를 올리는 장면을 로그로 볼 수 있어요.

```
[FirebaseCrashlytics] Automatic data collection is enabled
[FirebaseCrashlytics] Packaged report with id '2d2a3b2c…' for submission
[FirebaseCrashlytics] Completed report submission with id: 2d2a3b2c…
```

**SDK 는 기동했고, 리포트를 만들었고, 제출까지 끝냈어요.** 1·2단계는 정상이라는 뜻이에요. 그런데 **16분을 기다려도 BigQuery 에 이 리포트가 나타나지 않았어요.** 같은 시간에 구버전 iOS 의 이벤트는 4~5분 지연으로 들어오고 있었는데요.

여기서 첫 번째 가정이 깨졌어요. **앱은 보냈고, 서버가 받고도 내놓지 않고 있었어요.** 남은 건 3단계, 심볼리케이션이었어요.

> 이 조사는 Claude Code 에이전트와 함께 했어요. BigQuery 쿼리, 로컬 빌드 검사, WebDriverAgent 로 실기기 조작(비행기 모드 켜고 끄기, 앱 재실행), 기기 로그 수집을 에이전트가 맡았어요. 저는 가설을 고르고 결과를 판정했어요. 로컬 빌드로 끝내려던 검증을 "실기기가 있으니 실기기로 하자"고 돌린 게 이 조사의 전환점이었어요.

## 원인: 없는 경로를 부르고도 성공한 빌드 단계

dSYM 업로드는 Xcode 빌드 단계 하나가 맡고 있었어요. 그 스크립트의 핵심은 이랬어요.

```sh
if [ -f "${GSP_PATH}" ]; then
  "${PODS_ROOT}/FirebaseCrashlytics/upload-symbols" \
    -gsp "${GSP_PATH}" \
    -p ios \
    "${DWARF_DSYM_FOLDER_PATH}"
  echo "dSYM upload completed."
else
  echo "warning: GoogleService-Info.plist not found at ${GSP_PATH}"
fi
```

`${PODS_ROOT}/FirebaseCrashlytics/upload-symbols` 는 **CocoaPods 가 Firebase 를 설치할 때만 존재하는 경로**예요. SPM 으로 옮기면서 Firebase 는 `Pods/` 에서 빠졌고, 이 파일도 함께 사라졌어요.

그런데 archive 는 계속 성공했어요. 이유는 셸 스크립트의 종료 코드에 있어요. 없는 파일을 실행하면 그 줄은 실패해요. 하지만 `set -e` 가 없어서 스크립트는 다음 줄로 넘어가요. 그리고 **마지막 줄 `echo "dSYM upload completed."` 가 성공하니 스크립트 전체의 종료 코드는 0**이에요. Xcode 는 이 단계를 성공으로 기록해요. 로그에는 업로드가 끝났다는 문구까지 찍히고요.

**두 번째 가정도 여기서 깨졌어요.** archive 는 성공했지만, 그 안의 업로드 단계는 21개 빌드 내내 실패하고 있었어요.

dSYM 이 없으면 서버는 어떻게 할까요? FlutterFire 의 Crashlytics 문서에 답이 있어요.

> Without these files, you'll see a "Missing dSYM" alert in the Crashlytics dashboard and exceptions will be held by the backend until the missing files are uploaded.
>
> (이 파일이 없으면 Crashlytics 대시보드에 "Missing dSYM" 경고가 뜨고, 누락된 파일이 올라올 때까지 **예외는 백엔드에 보류돼요**.)

**버려지는 게 아니라 보류돼요.** 그래서 대시보드에도, 알림에도, BigQuery 에도 나오지 않았어요. 실제로 콘솔 상단에는 경고 배너가 떠 있었어요.

> 이 앱에 처리되지 않은 비정상 종료가 156개 있습니다. dSYM 파일 16개를 업로드하여 처리하세요.

누락된 dSYM 목록의 버전은 **0.514.0 부터 시작했어요.** 0건이 시작된 시점과 정확히 겹쳐요. 답은 처음부터 대시보드 위에 있었던 셈이에요. 다만 "0건 = 안정적"이라고 읽는 동안에는 그 배너를 볼 이유가 없었어요.

## 복구 시도: 같은 커밋을 다시 빌드해도 UUID 는 다르다

보류된 이벤트는 dSYM 만 올리면 처리된다고 했으니, 놓친 dSYM 을 다시 만들면 될 것 같았어요. 단서도 있었어요. 누락 목록을 보니 **버전이 다른데 UUID 가 같은 쌍**이 있었거든요. 네이티브 코드가 같으면 링커가 같은 UUID 를 만든다는 뜻이니, 같은 커밋을 다시 빌드하면 같은 dSYM 이 나올 수도 있었어요.

마침 작업 중이던 브랜치가 실기기에서 테스트한 배포 빌드와 같은 커밋이었어요. 로컬에서 빌드해 UUID 를 비교했어요.

| | Runner UUID |
|---|---|
| 콘솔이 기다리는 dSYM (CI 빌드, Xcode 26.6) | `FE16FC15-…` |
| 같은 커밋 로컬 재빌드 (Xcode 26.3) | `901191EA-…` |

**UUID 가 달랐어요.** 커밋이 같아도 Xcode 버전과 빌드 경로가 다르면 바이너리가 달라져요. CI 에도 원본이 남아 있지 않았어요. 배포 lane 이 TestFlight 업로드 직후 `~/Library/Developer/Xcode/Archives/*` 를 지우고 있었거든요.

결국 **보류된 156건은 복구하지 못했어요.** 그 기간의 iOS 크래시는 잃은 거예요. 앞으로의 빌드를 고치는 것과 별개로, **다음에 같은 일이 생겨도 복구할 원본은 남겨야겠다**는 게 이 단계의 교훈이었어요.

## 해결: 조용히 실패할 수 없게 만들기

고친 건 세 가지예요.

**1. SPM 경로에서 `upload-symbols` 를 찾아요.** SPM 은 패키지를 DerivedData 의 `SourcePackages/checkouts/` 아래에 받아요. 빌드 단계 안에서는 `BUILD_DIR` 로 그 위치를 계산할 수 있어요. CocoaPods 경로는 대비용으로 뒤에 남겼어요.

**2. 실패하면 archive 를 멈춰요.** 이게 핵심이에요. 경로가 바뀐 건 실수였지만, 그 실수가 21개 빌드 동안 숨어 있을 수 있었던 건 **실패해도 아무 일도 일어나지 않는 구조** 때문이었어요.

```sh
UPLOAD_SYMBOLS=""
for candidate in \
  "${BUILD_DIR%/Build/*}/SourcePackages/checkouts/firebase-ios-sdk/Crashlytics/upload-symbols" \
  "${PODS_ROOT}/FirebaseCrashlytics/upload-symbols"; do
  if [ -x "${candidate}" ]; then
    UPLOAD_SYMBOLS="${candidate}"
    break
  fi
done
if [ -z "${UPLOAD_SYMBOLS}" ]; then
  echo "error: Crashlytics upload-symbols not found (BUILD_DIR=${BUILD_DIR})"
  exit 1
fi

if ! "${UPLOAD_SYMBOLS}" -gsp "${GSP_PATH}" -p ios -- "${DWARF_DSYM_FOLDER_PATH}"; then
  echo "error: dSYM upload to Crashlytics failed"
  exit 1
fi
```

`GoogleService-Info.plist` 가 없을 때도 예전에는 `warning` 만 찍었는데, 이제는 `exit 1` 이에요. **dSYM 없이 배포되는 빌드는 그 빌드의 iOS 크래시를 전부 숨긴다**는 걸 알게 된 이상, 경고로 넘길 일이 아니었어요.

**3. CI 가 dSYM 을 아티팩트로 보관해요.** GitHub Actions 에서 `Runner.app.dSYM.zip` 을 30일 동안 남겨요. 업로드가 또 빠지더라도 `upload-symbols` 로 나중에 올려 복구할 수 있어요.

스크립트는 pbxproj 에서 그대로 뽑아 경우별로 돌려 봤어요. 실제 업로드 대신 `--validate` 로 확인했어요.

| 경우 | 결과 |
|---|---|
| Debug 설정 | 건너뜀, exit 0 |
| `upload-symbols` 없음 | `error: … not found`, exit 1 |
| plist 없음 | exit 1 |
| SPM 경로 + Release | `Validation succeeded`, exit 0 |

> 테스트할 때 하나 걸린 게 있어요. `upload-symbols … -p ios --validate <경로>` 순서로 쓰면 "No dSYM paths provided" 오류가 나요. `--validate` 를 앞에 두거나, 위 스크립트처럼 `--` 로 경로를 구분해야 해요.

그다음 실제 환경에서 단계별로 확인했어요.

1. **dev 빌드**: 빌드 단계가 실행되고 archive 가 성공했어요. 업로드에 실패하면 이제 archive 가 멈추니까, **archive 성공이 곧 업로드 성공**이에요. 그 빌드에서 만든 리포트도 대시보드에 올라왔어요.
2. **수정 전 빌드 하나가 오히려 원인을 확인해 줬어요.** 수정 전 스크립트로 만든 빌드 중 하나(0.561.9)는 이벤트가 정상으로 집계되고 있었어요. 콘솔을 보니 이 빌드만 dSYM 이 "업로드됨"이었어요. 누군가 따로 올린 거였어요. **같은 시기, 같은 스크립트여도 dSYM 이 있으면 집계되고 없으면 0건**이었던 거예요.
3. **수정이 들어간 스토어 빌드(0.562.0)**: 배포 1주일 동안 non-fatal 과 fatal 이 정상으로 집계됐어요. 그 뒤 TestFlight 빌드의 이벤트도 들어오고 있어요.

0.514.0 부터 0.559.2 까지는 지금도 0건이에요. **그 기간의 0은 "크래시 없음"이 아니라 "집계 안 됨"으로 읽어야 해요.** 팀에도 그렇게 공유했어요.

## 같은 모양의 두 번째 사고: 사라진 `Package.resolved`

수정을 dev 빌드로 확인하던 중에 develop 브랜치의 iOS 빌드가 전부 실패하고 있었어요. 제 변경과는 상관없는 실패였어요.

원인은 `Runner.xcworkspace/xcshareddata/swiftpm/Package.resolved` 였어요. SPM 이 실제로 쓸 패키지 버전을 고정해 두는 잠금 파일이에요. 이 파일이 **main 을 develop 으로 합친 머지 커밋에서 빠져 있었어요.** 충돌 목록에 없던 파일이라 왜 빠졌는지는 지금도 모르겠어요.

잠금 파일이 없으면 SPM 은 플러그인이 적어 둔 버전 범위(`from: "4.8.3"` 같은) 안에서 **최신판을 새로 받아요.** 그 최신판이 더 높은 iOS 최소 버전을 요구해서 archive 가 깨졌어요. 빌드가 실패해서 다행이었지, 최신판이 조용히 빌드됐다면 **검증하지 않은 의존성 버전이 그대로 배포됐을 거예요.**

dSYM 사고와 모양이 같아요. **빠지면 안 되는 것이 빠졌는데, 도구가 알아서 "성공처럼" 넘어가요.** 그래서 해결도 같은 방향으로 했어요. 직접 검사 스크립트를 만들기 전에 표준 옵션이 있는지 먼저 찾았고, `xcodebuild` 에 `-disableAutomaticPackageResolution` 이 있었어요. fastlane gym 에서는 `disable_package_automatic_updates: true` 로 켤 수 있어요.

로컬에서 패키지 해석만 돌려서 동작을 확인했어요.

| 경우 | 결과 |
|---|---|
| `Package.resolved` 있음 + 옵션 | 성공, 고정된 버전 그대로 |
| `Package.resolved` 없음 + 옵션 | **즉시 실패**: `a resolved file is required when automatic dependency resolution is disabled` |
| `Package.resolved` 없음 + 옵션 없음 (기존 CI) | 성공처럼 끝나지만 **의존성이 최신판으로 올라감** (사고 재현) |

이제 잠금 파일이 빠지면 빌드가 원인이 적힌 에러로 바로 멈춰요.

## 마치며: 0은 측정값이 아닐 수 있다

처음 0건을 봤을 때 팀원의 크래시가 없었다면, 저는 아마 "안정적이네" 하고 넘어갔을 거예요. 실제로 크래시 수정 작업 목록에서 iOS 는 "고칠 게 없음"으로 나오고 있었어요. **0이라는 숫자는 문제가 없다는 신호처럼 보여서, 아무도 그 숫자를 의심하지 않아요.**

이번 일에서 가장 크게 배운 건 이거예요.

**잘 돌아가던 이유를 모르면, 그 이유가 사라져도 알아채기 어렵다.**

dSYM 업로드는 CocoaPods 가 Firebase 를 `Pods/` 에 넣어 줬기 때문에 돌아가고 있었어요. 아무도 그걸 의식하지 않았으니, SPM 전환 체크리스트에도 없었어요. 그리고 실패를 삼키는 스크립트가 그 사실을 21개 빌드 동안 숨겼어요.

Crashlytics 를 쓰고 있다면 세 가지만 확인해 보세요.

1. **콘솔의 dSYM 탭이나 상단 배너에 "누락" 이 있나요?** 있다면 그 버전의 iOS 이벤트는 집계되지 않고 있어요.
2. **dSYM 업로드 스크립트가 실패하면 빌드가 멈추나요?** 일부러 경로를 틀리게 바꿔서 archive 를 돌려 보세요. 그래도 성공한다면 이 글과 같은 구조예요.
3. **업로드가 빠졌을 때 올릴 dSYM 원본이 어딘가 남아 있나요?** CI 가 archive 를 지운다면, 놓친 이벤트는 되살릴 수 없어요.

지금은 CocoaPods 에서 SPM 으로 옮기는 프로젝트가 많을 거예요. 옮길 때 `Pods/` 경로를 참조하는 빌드 단계가 남아 있지 않은지 한 번 찾아보세요. `grep -n 'PODS_ROOT' ios/Runner.xcodeproj/project.pbxproj` 한 줄이면 돼요.

## 참고 자료

- Firebase, [Get deobfuscated crash reports (Flutter)](https://firebase.google.com/docs/crashlytics/get-deobfuscated-reports?platform=flutter) — dSYM 이 없으면 이벤트가 보류된다는 문구. 원문은 [flutterfire 저장소](https://github.com/firebase/flutterfire/blob/main/docs/crashlytics/_deobfuscated.md)에 있어요 (2026-11 확인)
- Firebase, [Get readable crash reports (Apple platforms)](https://firebase.google.com/docs/crashlytics/ios/get-deobfuscated-reports) — 업로드 스크립트 예시. 2026-11 기준 CocoaPods 경로(`$PODS_ROOT`)만 나와 있어요
- firebase-ios-sdk [#15696](https://github.com/firebase/firebase-ios-sdk/issues/15696) — `__mh_execute_header` 관련 이슈 (이번 원인은 아니었어요)
- 기준 버전: Firebase iOS SDK 12.14.0, `firebase_crashlytics` 5.2.3, Xcode 26.6(CI)·26.3(로컬), fastlane 2.236.1
