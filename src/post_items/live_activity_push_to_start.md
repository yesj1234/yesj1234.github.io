---
title: '앱이 잠들어 있어도 Live Activity 를 바꾸는 법: 서버 push-to-start'
author: jack
date: 2026. 11. 18.
published: true
description: 앱 안에서만 갱신하던 루틴 Live Activity 가 앱이 잠든 동안 멈췄어요. 서버가 push-to-start 로 배너를 띄우는 구조로 바꿨다가, 결국 하루 한 개의 배너를 update 로 돌리는 구조에 도착한 기록이에요.
cover: /posts/live_activity_push_to_start/cover.webp
tags: [iOS, ActivityKit, Live Activity, APNs, Flutter, Django]
---

## 들어가며: 점심인데 아침 체중 배너가 떠 있다

저는 Flutter 로 웰니스 앱을 만들고, 앱에 붙는 서버(Django)도 함께 맡고 있어요.

앱에는 **루틴**이 있어요. 아침 체중 재기, 물 마시기, 점심 기록하기처럼 정해진 시각에 하는 습관이에요. 이 루틴을 잠금화면과 Dynamic Island 에서 보여 주려고 **루틴 Live Activity** 를 만들었어요. 루틴 종류와 진행 상태를 합쳐 **화면 템플릿 13종**이 있어요.

처음 구현은 단순했어요. **앱이 홈 화면을 그릴 때 지금 보여 줄 루틴을 골라 Live Activity 를 띄우거나 바꿨어요.** 그런데 QA 에서 이런 보고가 왔어요.

> 점심인데 라이브 액티비티에 아침 체중이 계속 나와요.

버그처럼 보였지만 코드에는 잘못이 없었어요. **앱이 잠들어 있는 동안에는 배너를 바꿀 주체가 없었던 거예요.** 사용자는 점심 루틴 알림을 받고도 앱을 열지 않았고, 앱이 열리지 않으니 배너는 아침 화면에 멈춰 있었어요.

이 글은 그 빈칸을 서버로 메운 과정이에요. 처음엔 "서버가 **push-to-start** 로 새 배너를 띄우면 된다"고 생각했어요. 그 설계는 실기기에서 두 번 무너졌고, 마지막에는 **"배너를 갈아끼우지 말고, 하루 한 개의 배너를 update 로 돌린다"**는 구조에 도착했어요.

이런 분께 도움이 될 거예요.

- Live Activity 를 앱에서만 갱신하고 있는데, 앱이 꺼진 동안 내용이 멈추는 게 신경 쓰이는 분
- push-to-start 를 붙이려는데 토큰이 몇 종류이고 누가 언제 올려야 하는지 헷갈리는 분
- APNs 가 `200` 을 돌려주는데 배너가 안 뜨는 상황을 겪고 있는 분

다룰 키워드는 **push-to-start 토큰, update 토큰, `apns-priority`, `stale-date`, 상태 diff** 예요.

## 배경: Live Activity 를 바꿀 수 있는 길과 토큰 두 개

먼저 Live Activity 의 내용을 바꿀 수 있는 길부터 정리할게요.

| 길 | 누가 | 앱 프로세스가 필요한가 |
|---|---|---|
| `Activity.request` / `activity.update` | 앱 | **필요** |
| ActivityKit 푸시 `event: "start"` | 서버 → APNs | 필요 없음 (push-to-start 토큰) |
| ActivityKit 푸시 `event: "update"` / `"end"` | 서버 → APNs | 필요 없음 (update 토큰) |

앱 안에서 부르는 API 는 당연히 앱이 살아 있어야 해요. 앱이 잠든 동안 배너를 바꾸려면 **서버가 APNs 로 ActivityKit 푸시를 보내는 수밖에 없어요.**

여기서 헷갈리기 쉬운 것이 **토큰이 두 종류**라는 점이에요.

| | push-to-start 토큰 | update 토큰 |
|---|---|---|
| 개수 | **앱(기기)당 1개** | **활동(배너) 하나당 1개** |
| 받는 곳 | `Activity<T>.pushToStartTokenUpdates` | `activity.pushTokenUpdates` |
| 할 수 있는 일 | 새 배너 시작(`start`) | 그 배너의 갱신·종료(`update`·`end`) |
| 언제 바뀌나 | 바뀔 수 있음 — 새 값이 오면 서버 값을 갈아끼움 | 활동 도중에도 바뀔 수 있고, **그 활동이 끝나면** 무효 |
| 지원 버전 | iOS 17.2 이상 | iOS 16.2 이상 (`request(attributes:content:pushType:)` 기준) |

push-to-start 토큰은 "이 기기에 이 타입의 배너를 새로 띄울 권리"이고, update 토큰은 "이미 떠 있는 바로 그 배너를 만질 권리"예요. 이 차이가 글 전체를 끌고 가요.

Apple 문서에는 Live Activity 에 걸린 제한도 있어요(2026-11-18 기준 [Apple 문서](https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities) 확인).

- 활동은 **최대 8시간** 살아 있고, 그 뒤 시스템이 끝내요. 끝난 뒤 잠금화면에는 최대 4시간 더 남아서, **잠금화면 잔류는 최대 12시간**이에요.
- 정적·동적 데이터를 합친 크기는 **4 KB** 를 넘을 수 없어요.
- ActivityKit 푸시에는 **시간당 예산**이 있어요. `apns-priority: 10` 은 예산을 쓰고, `5` 는 쓰지 않아요.

## 첫 설계: 루틴 알림이 나갈 때 push-to-start 를 같이 보낸다

서버는 이미 매분 루틴 알림을 보내고 있었어요. 그래서 첫 설계는 이랬어요.

**루틴 알림이 실제로 나간 그 순간, 같은 회원의 기기로 push-to-start 를 함께 보낸다.**

알림과 배너가 같은 시각, 같은 루틴을 가리키니 어긋날 일이 없어 보였어요. 이전 배너가 남지 않도록 **`end` 를 먼저 보내고 `start` 를 보내는** 순서도 정했어요. 순서를 뒤집으면 두 배너가 겹쳐 보이는 구간이 생겨요.

앱 쪽 일은 토큰을 서버에 올리는 것이었어요. Swift 에서는 push-to-start 토큰 스트림을 구독해 두고, Dart 가 MethodChannel 로 그 값을 읽어 서버에 보내요.

```swift
// ActivityKit 관리 actor (줄임)
func pushToStartTokenObserving() -> String? {
    guard #available(iOS 17.2, *) else { return nil }

    if pushToStartTask == nil {
        pushToStartTask = Task {
            for await tokenData in Activity<RoutineActivityAttributes>.pushToStartTokenUpdates {
                self.pushToStartToken = tokenData.map { String(format: "%02x", $0) }.joined()
            }
        }
    }
    return pushToStartToken
}
```

여기서 볼 건 **첫 호출은 거의 항상 `nil`** 이라는 점이에요. 구독을 거는 순간 값이 오지 않고, 토큰은 비동기로 도착해요. 그래서 Dart 쪽은 2초, 5초 뒤에 한 번씩 더 물어요. 그래도 없으면 다음 포그라운드 복귀나 로그인 때 다시 시도해요.

```dart
// 토큰 보고 (줄임)
static const List<Duration> _retryDelays = [Duration(seconds: 2), Duration(seconds: 5)];

static Future<void> report(AppBloc appBloc) async {
  for (var attempt = 0; attempt <= _retryDelays.length; attempt++) {
    if (attempt > 0) await Future<void>.delayed(_retryDelays[attempt - 1]);

    final token = await channel.getRoutinePushToStartToken();
    if (token == null || token.isEmpty) continue;

    // 앱 표시 언어를 토큰과 함께 올린다 (아래 「표시 언어」 절)
    final locale = languageUseCase.selectedLanguage?.tag ?? '';
    appBloc.add(ReportPushToStartTokenEvent(deviceId: deviceId, token: token, locale: locale));
    return;
  }
}
```

서버는 FCM 이 아니라 **APNs HTTP/2 에 직접** 보내기로 했어요. 이유는 능력보다 **진단 가능성**이었어요. 직접 보내면 APNs 가 `BadDeviceToken`, `BadTopic`, `InvalidProviderToken` 같은 거절 사유를 그대로 돌려줘요. 이 기능은 바로 다음 절에서 보듯 실패해도 `200` 이 오는 경우가 있어서, 사유가 안 보이면 고칠 수가 없었어요. (FCM 을 거치면 `apns-push-type: liveactivity` 헤더를 실을 수 없다는 제약도 함께 확인했어요 [확인 필요: FCM 의 Live Activity 지원 현황, 기준 시점].)

## 막힌 지점: APNs 는 200 인데 배너가 안 뜬다

dev 서버에서 처음 보낸 `start` 는 **APNs 가 `200` 을 돌려줬는데 잠금화면에는 아무것도 없었어요.** 서버 로그에는 성공으로 남았어요.

원인은 세 가지가 차례로 나왔어요. 셋 다 **오류 없이 조용히 버려지는** 종류였어요.

**첫째, `start` 에 `aps.alert` 가 없었어요.** 실기기로 확인해 보니 alert 가 없으면 iOS 가 payload 를 버리고, APNs 는 그래도 `200` 을 줘요. Apple 문서도 start payload 의 요구사항으로 "`event` 를 `start` 로", "**alert 를 포함**", "`attributes-type` 과 `attributes` 키를 포함" 세 가지를 적어 두고 있어요([Apple 문서](https://developer.apple.com/documentation/activitykit/starting-and-updating-live-activities-with-activitykit-push-notifications), 2026-11-18 확인). 저는 이 줄을 "알림을 띄우고 싶을 때 넣는 옵션"으로 읽고 넘어갔었어요.

alert 를 넣으면 알림이 두 번 가지 않을까 걱정했는데, **실기기에서 alert 는 알림함·소리·배지에 나타나지 않았어요.** Apple 문서도 alert 의 title·body 는 Apple Watch 에서 쓰이고, 다른 기기에서는 일반 알림 대신 배너를 펼쳐 보여 준다고 설명해요. 문구는 그 순간 이미 나간 루틴 알림 문구를 그대로 재사용했어요. 번역을 새로 만들 필요도 없고, 알림과 배너 문구가 어긋날 수도 없어요.

**둘째, `content-state` 의 키 이름이 Swift 와 달랐어요.** 파이썬 모델 필드는 `title_key` 인데 Swift `ContentState` 는 `titleKey` 를 기대해요. 이 경우도 디코딩이 실패하면 배너만 안 뜨고 APNs 는 `200` 이에요. pydantic 모델에 alias 를 달고 **반드시 `model_dump(by_alias=True)`** 로 덤프하게 했어요.

**셋째, 시각 필드의 기준일이 둘이었어요.**

```python
def build_payload(event, content_state, attributes, alert, stale_at, now) -> dict:
    aps = {
        "timestamp": now,                       # Unix 초 (1970 기준)
        "event": event.value,
        "content-state": content_state.model_dump(by_alias=True) if content_state else {},
    }
    if event is PushEvent.START:
        aps["attributes-type"] = "RoutineActivityAttributes"
        # attributes 안의 startTime / endTime 은 Apple 기준일(2001-01-01) 초
        aps["attributes"] = attributes.model_dump(by_alias=True, exclude_none=True)
        aps["alert"] = {"title": alert.title, "body": alert.body}  # 없으면 iOS 가 버린다
    if stale_at is not None:
        aps["stale-date"] = stale_at            # 다시 Unix 초
    return {"aps": aps}
```

여기서 볼 것은 **한 payload 안에 epoch 기준이 두 개** 섞인다는 점이에요. `aps.stale-date` 는 Unix(1970) 초인데, `attributes` 안의 `Date` 필드는 Swift 기본 `JSONDecoder` 의 `.deferredToDate` 전략 때문에 **2001년 1월 1일 기준** 초로 읽혀요. 틀려도 디코딩은 성공하고 **시각만 31년 어긋나요.** 서버에 변환 함수를 따로 두고, 시간대 없는 `datetime` 은 받지 않게 막았어요.

헤더도 정리해 두면 이래요.

```python
headers = {
    "authorization": f"bearer {provider_jwt}",            # ES256, 45분마다 재발급
    "apns-push-type": "liveactivity",
    "apns-topic": f"{bundle_id}.push-type.liveactivity", # 번들 ID 만 쓰면 BadTopic
    "apns-priority": "10" if event is PushEvent.START else "5",
    "apns-expiration": str(stale_at),                     # 지난 루틴 배너가 뒤늦게 뜨지 않게
}
```

`apns-priority` 는 **`start` 만 10, `update`·`end` 는 5** 로 나눴어요. 시작은 예정 시각에 떠야 의미가 있지만, 갱신은 몇 분 늦어도 괜찮아요. 모두 10 으로 보내면 시간당 예산을 써 버려서 정작 다음 `start` 가 밀릴 수 있어요. provider JWT 를 45분마다 바꾸는 이유는 Apple 이 짧은 간격의 재발급도, 1시간 넘은 토큰도 거절하기 때문이에요 [확인 필요: Apple 문서의 provider token 갱신 간격 문구와 기준 시점].

이 세 가지를 고치고 나서야 dev 실기기에서 물·명상·식사 배너가 서버 푸시만으로 떴어요.

## 배너가 쌓인다: end 를 보내려면 update 토큰이 필요했다

배너가 뜨기 시작하자 다음 문제가 보였어요. **`start` 를 보낼 때마다 새 활동이 생겨요**(처음 실기기에서 본 동작이에요. 뒤에서 다시 다뤄요). 이전 배너를 끝내지 않으면 "점심인데 아침 배너"가 "점심과 아침이 나란히"로 바뀌어요.

그래서 `start` 전에 `end` 를 보내기로 했는데, **`end` 는 그 배너의 update 토큰이 있어야 보낼 수 있어요.** push-to-start 토큰으로는 끝낼 수 없어요.

update 토큰을 서버로 가져오려면 앱이 관찰해야 해요. 이때 놓치기 쉬운 곳이 두 군데 있었어요.

- **`Activity.request` 를 부를 때 `pushType: .token` 을 넘겨야 해요.** `nil` 이면 ActivityKit 이 update 토큰을 아예 발급하지 않아요. 그러면 `pushTokenUpdates` 가 영원히 아무것도 흘리지 않고, **앱이 만든 배너는 서버가 존재조차 모르게** 돼요. 실기기 로그에서 활동은 보이는데 토큰 줄이 70초 동안 안 찍히는 걸 보고 찾았어요.
- **관찰 축이 둘이에요.** 지금 살아 있는 활동(`Activity<T>.activities`)과 앞으로 생길 활동(`Activity<T>.activityUpdates`)을 모두 봐야 해요. 앞쪽만 보면 푸시로 새로 뜬 배너를 놓치고, 뒤쪽만 보면 앱을 다시 켰을 때 이미 떠 있던 배너를 놓쳐요.

```swift
func updateTokenObserving() async {
    if updateTokenTask == nil {
        for activity in Activity<RoutineActivityAttributes>.activities {
            observeUpdateToken(activity)
        }
        updateTokenTask = Task {
            for await activity in Activity<RoutineActivityAttributes>.activityUpdates {
                observeUpdateToken(activity)
                await reduceToLatestActivity()  // 잠든 사이 쌓인 배너를 하나로
            }
        }
    }
}

private func observeUpdateToken(_ activity: Activity<RoutineActivityAttributes>) {
    guard updateTokenTasks[activity.id] == nil else { return }
    updateTokenTasks[activity.id] = Task {
        for await tokenData in activity.pushTokenUpdates {
            self.updateToken = tokenData.map { String(format: "%02x", $0) }.joined()
            self.updateActivityId = activity.id
            self.onUpdateToken?()              // Dart 에 "새 토큰 왔다"고 알린다
        }
        // 스트림이 끝났다 = 활동이 끝났다. 죽은 토큰을 다음 배너 토큰인 양 올리지 않는다.
        self.updateTokenTasks[activity.id] = nil
        if self.updateActivityId == activity.id { self.updateToken = nil }
    }
}
```

Apple 문서도 update 토큰은 **활동 도중에 바뀔 수 있으니** 새 값이 오면 서버의 옛 토큰을 무효로 하라고 해요. 그래서 Dart 가 주기적으로 묻는 대신, 네이티브가 토큰을 받는 순간 채널로 Dart 를 불러 바로 올리게 했어요. 네트워크가 끊겼다 다시 이어질 때도 한 번 더 올려요.

서버 쪽에서 토큰을 끄는 기준도 좁게 잡았어요. **`BadDeviceToken` 과 `Unregistered` 둘만** 토큰을 비활성화해요. `TooManyRequests` 같은 일시적 사유로 끄면 멀쩡한 기기가 영영 배너를 못 받아요.

남은 질문은 하나였어요. **서버가 push-to-start 로 띄운 배너의 update 토큰은 언제 서버에 닿을까?**

## 가정이 깨졌다: push-to-start 는 앱을 깨워 주지 못했다

제가 믿었던 흐름은 이랬어요. Apple 문서에도 그렇게 적혀 있어요.

> When the system receives the ActivityKit push notification on a device, it starts a new Live Activity, wakes up your app, and grants it background runtime …
>
> (시스템이 기기에서 ActivityKit 푸시를 받으면 새 Live Activity 를 시작하고, 앱을 깨우고, 백그라운드 실행 시간을 줘요.)

그러니 **push-to-start 가 앱을 깨우면 → 앱이 새 배너의 update 토큰을 받아 → 서버에 올리고 → 서버는 그 토큰으로 2시간 뒤 `end` 를 보낸다**는 설계였어요. 네이티브와 Dart 양쪽에 계측 로그를 심고 실기기에서 확인했어요.

결과는 **3번 중 3번 실패**였어요. 배너는 떴는데 앱 코드가 돌지 않았어요. 로그를 따라가 보니 iOS 가 앱 프로세스를 main 진입 전 단계에서 동결해 두었다가, 푸시가 오면 그 미완성 부팅을 재개하는 모양이었어요. 12초를 기다려도 앱 코드에 닿지 않았어요. dev 서버 액세스 로그 2,300여 건을 뒤져도 네이티브 HTTP 클라이언트(`CFNetwork`)가 올린 토큰은 한 건도 없었고, 전부 앱을 연 뒤 Dart(`dart:io`)가 올린 것이었어요.

이 측정에는 한계가 있어요. **기기 한 대에서 세 번** 본 결과이고, 어떤 조건에서는 깨어날 수도 있어요 [확인 필요: 측정한 iOS 버전과 빌드 종류]. 하지만 설계의 관점에서는 결론이 같았어요. **깨어남이 보장되지 않는 경로에 배너 종료를 걸 수는 없었어요.**

토큰을 네이티브에서 바로 HTTP 로 올리는 방법도 검토했지만, 그것도 결국 앱 코드가 돌아야 하는 길이라 같은 벽에 막혀요.

## 다시 세운 설계: 배너를 갈아끼우지 말고 하루 한 개를 돌린다

막힌 지점을 다시 보니, 문제는 `start` 와 `end` 가 **둘 다 새 활동을 전제로** 한다는 데 있었어요. 새 활동이 생길 때마다 새 update 토큰이 생기고, 그 토큰은 앱이 깨어나야 서버에 닿아요.

반대로 `update` 는 성질이 달라요. Apple 문서 표현대로, ActivityKit 푸시가 오면 **시스템은 위젯 익스텐션을 깨워 화면을 그려요.** 앱 프로세스는 끼지 않아요. 토큰만 있으면 앱이 하루 종일 안 깨어나도 내용을 바꿀 수 있어요.

그래서 문제를 이렇게 다시 정의했어요.

**배너를 바꾸는 일 = 새 배너를 띄우는 일이 아니라, 이미 떠 있는 배너의 내용을 바꾸는 일.**

이 글에서는 이 구조를 **회전**이라고 부를게요. 규칙은 세 줄이에요.

1. **활동은 하루 한 개만 둔다.** 아침에 앱이 한 번이라도 열리면 그 배너의 update 토큰이 서버에 올라가고, 그 토큰은 활동이 사는 동안 유효해요.
2. **루틴 예정 시각 −30분 ~ +1시간 30분**을 그 루틴의 창으로 보고, 창 안이면 그 루틴 화면, 창 밖이면 "오늘 남은 루틴" 요약 화면(이 글에서는 **Default 화면**)을 보여 준다. 창이 겹치면 나중 루틴이 이겨요.
3. **남은 루틴이 0개여도 `end` 하지 않는다.** `end` 하는 순간 update 토큰이 함께 죽어 그날 남은 회전을 잃어요.

3번은 앱 쪽에서도 같은 함정이 있었어요. 홈 화면이 "보여 줄 배너 없음"을 계산하면 그대로 활동을 내렸는데, 그러면 토큰까지 죽어요. 그래서 상태를 둘로 나눴어요. **`None` 은 활동을 내리고, `Keep` 은 아무것도 하지 않아요.** 미구독 사용자의 창 밖 구간처럼 "보여 줄 게 없을 뿐 내릴 이유는 없는" 경우는 `Keep` 이에요.

앱이 같은 활동 위에서 화면만 바꾸려면 비교 축도 바꿔야 했어요. 처음엔 화면 템플릿이 바뀌면 `start` 로 새 활동을 세웠는데, 그러면 물 → Default → 식사로 넘어갈 때마다 토큰이 죽어요. 활동의 `attributes` 에는 화면 대신 **활동 종류**(`dailyRoutine` / `fastOngoing`)를 넣고, 종류가 같으면 `update` 로 이어 가게 했어요. `attributes` 는 시작할 때 고정되는 값이라, 여기에 화면을 넣으면 첫 화면에 영영 묶여요.

단식만은 별도 활동으로 남겼어요. 단식 카운트다운은 `attributes` 의 끝 시각으로 iOS 가 직접 그리는데, 서버 `update` 가 그 위를 덮으면 카운트다운이 깨져요. 그래서 서버에는 **진행 중 단식 배너에는 `update`·`end`·`start` 어느 것도 보내지 않는다**는 금지 목록이 있어요.

## 서버가 매분 정하는 것: 상태 diff 와 다음 전환 시각

회전은 서버의 Celery 태스크가 매분 돌면서 해요. 윈도우 경계가 분 단위 벽시계(12시 루틴이면 11:30 진입, 13:30 종료)라 더 긴 주기로는 경계를 지나칠 수 있어서예요.

처음 기획 문서는 전환을 네 종류(창 진입, 창 종료, 루틴 완료, 겹침)로 나눠 감지하자고 했어요. 그런데 이 방식에는 멱등이 없었어요. 조회 범위가 5분이라 **전환 하나에 `update` 가 3~5번 나가요.**

그래서 이벤트를 세지 않고 **상태를 비교**하기로 했어요. 매 틱마다 "지금 보여야 할 상태"를 계산하고, 마지막으로 보낸 상태와 다를 때만 보내요.

```python
state_key = f"{member_local_date}:{item_id or 'DEFAULT'}"   # 예: "2026-09-21:DEFAULT"

if state_key != token.last_state_key:
    await apns.send(event=PushEvent.UPDATE, push_token=token.update_token, ...)
    token.last_state_key = state_key
token.next_state_change_at = next_boundary_after(now)       # 다음 창 경계 또는 다음 로컬 자정
```

| 원래의 전환 | 상태 diff 에서는 |
|---|---|
| 창 진입 | `DEFAULT` → `item_id` |
| 창 종료 | `item_id` → `DEFAULT` |
| 루틴 완료 | 그 항목이 후보에서 빠짐 → `DEFAULT` |
| 겹침 | 정렬(나중 루틴 우선) → 다른 `item_id` |

이 표에서 볼 것은 **네 종류가 한 번의 비교로 합쳐진다**는 점이에요. 같은 상태를 두 번 계산해도 두 번째는 아무것도 보내지 않으니 멱등이 구조로 보장돼요. 날짜가 키에 들어 있어서 자정이 지나면 같은 루틴이어도 새 상태가 돼요.

두 번째로 신경 쓴 건 **작업량**이에요. 매분 활성 토큰 전부를 평가하면, 한 회원의 상태는 하루 10~20번 바뀌는데 평가는 1,440번이에요. 대부분의 평가가 아무것도 만들지 않아요. 그래서 토큰 행에 **다음 전환 예정 시각**(`next_state_change_at`)을 들고, 그 시각이 지난 행만 partial index 로 골라요. 일의 양이 활성 토큰 수가 아니라 **그 분에 실제로 경계를 넘은 토큰 수**에 비례해요.

같은 이유로 판정은 토큰이 아니라 **회원 단위**로 해요. 무엇을 보여 줄지는 기기와 무관하고, 기기마다 다른 건 표시 언어 하나뿐이에요.

`stale-date` 도 같은 함수에서 나와요. 다음 전환 시각이 지나면 iOS 가 앱 없이도 배너를 "낡음" 상태로 바꾸고, 위젯은 흐리게 그려요. **내용은 못 바꿔도 틀린 내용이 최신인 척하는 것은 막는** 바닥층이에요. 회전이 바꿔 줄 시각보다 `stale-date` 가 이르면 멀쩡한 배너가 먼저 흐려지고, 늦으면 갱신이 실패했는데도 최신인 척해요. 그래서 두 값을 한 함수에서 만들어요.

### 조용히 아무 일도 안 할 뻔한 곳들

회전은 안 돌아도 배너가 시작 화면에 머물 뿐이라 **예외도 오류 로그도 나지 않아요.** 작업 중 그런 구멍을 셋 찾았어요.

1. **새로 올라온 토큰이 회전 후보로 잡히지 않았어요.** 후보 조회는 `next_state_change_at <= now` 한 줄인데, 토큰을 저장할 때 그 칼럼을 채우지 않아 새 행이 전부 `NULL` 이었어요. `NULL` 은 어떤 틱에도 안 잡혀요. 그대로 배포했으면 기능 전체가 무동작이었어요.
2. **첫 평가에서 중복 `update` 가 나갔어요.** 배너는 방금 시작한 내용을 이미 그리고 있어요. 배포 직후엔 살아 있던 배너 전부가 동시에 첫 평가라 그 순간 `update` 가 몰려요. 첫 평가는 보내지 않고 상태만 받아 적게 했어요.
3. **방금 띄운 단식 시작 배너를 서버가 1분 만에 지웠어요.** 서버는 실제 단식 기록을 모르기 때문에 단식 항목을 후보로 올리지 않는데, 그러면 그 창을 Default 로 계산해요. 금지 목록에 진행 중 화면만 있고 시작·완료 화면이 빠져 있었어요.

## 문구는 서버가 아니라 위젯이 만든다: 키와 표시 언어

서버가 `update` 로 화면을 바꾸면 그 화면의 문구는 누가 만들까요? 앱이 띄우는 배너는 Dart 가 완성한 문구를 실어 보내요. 하지만 서버 푸시는 Dart 를 거치지 않아요.

서버가 완성 문구를 만들면, 앱이 지원하는 35개 언어의 번역을 서버 DB 에 복제하고 앱 번역 파일과 영원히 맞춰야 해요. 그래서 **서버는 문구 대신 키와 숫자만 보내요.** `titleKey`, `subtitleArgKeys`, `valueCurrent` 같은 재료예요. 위젯 익스텐션이 그 키를 자기 번들의 번역으로 바꿔 조립해요. 위젯 번들의 번역 파일은 앱 번역 원본에서 스크립트로 생성하고, `--check` 옵션으로 어긋남을 검사해요.

구버전 호환도 이 구조에 넣었어요. `ContentState` 가 완성 문구와 키를 둘 다 받을 수 있게 넓히고, **완성 문구가 오면 그것이 우선**이에요. 앱이 보내던 기존 payload 는 그대로 동작해요.

남은 질문은 **어느 언어로** 바꾸느냐였어요. 이 앱은 앱 안에서 기기와 다른 언어를 고를 수 있어요. 위젯 익스텐션은 기본적으로 기기 언어를 따르니, 그대로 두면 앱은 영어인데 배너는 한국어로 나와요.

그래서 **push-to-start 토큰을 올릴 때 앱 표시 언어를 함께 올려요.** 서버는 그 값을 `content-state` 의 `locale` 에 실어 보내고, 위젯은 그 언어의 `.lproj` 번들을 골라요.

```swift
enum RoutineLocalizer {
    // 언어 코드만으로는 갈리지 않는 넷
    private static let explicitLproj = [
        "en_US": "en", "en_GB": "en-GB", "zh_CN": "zh-Hans", "zh_TW": "zh-Hant",
    ]

    static func string(_ key: String?, args: [String]? = nil, locale: String?) -> String {
        guard let key, !key.isEmpty else { return "" }
        let format = NSLocalizedString(key, bundle: bundle(for: locale), comment: "")
        guard let args, !args.isEmpty else { return format }
        return String(format: format, arguments: args.map { $0 as CVarArg })
    }
}
```

여기서 볼 것은 **언어 코드가 아니라 국가까지 붙은 태그**(`zh_CN`)를 보낸다는 점이에요. `zh` 하나로는 간체와 번체를, `en` 하나로는 영국 영어를 가를 수 없어요. 값이 비어 있으면 "기기 언어를 따른다"는 뜻이에요. 인앱 선택이 없는 사용자는 앱도 기기 언어로 그려지니 둘이 같은 언어가 돼요.

서버도 `content-state` 를 **토큰마다** 조립해요. 같은 회원이어도 아이폰은 한국어, 아이패드는 영어일 수 있어요. 한 번 만들어 돌려쓰면 한쪽 기기가 남의 언어로 떠요. 같은 이유로 토큰 행에는 앱 버전도 있어서, 새 화면 템플릿을 모르는 구버전 위젯에는 예전 화면으로 내려 보내요.

이 함정은 나중에 **걸음 Live Activity** 에서 한 번 더 만났어요. 걸음 배너는 서버도 Dart 도 아닌 **네이티브 만보계 코드가 직접** 띄워요. 그래서 앱 언어를 몰랐고, 문구가 기기 언어로 나왔어요. Dart 가 콜드 스타트와 언어 변경 때 앱 언어 태그를 네이티브에 넘겨 저장하고, 걸음 배너도 같은 `RoutineLocalizer` 를 타게 고쳤어요. **문구를 만드는 쪽이 Dart 가 아니면, 앱 언어는 누군가 명시적으로 건네줘야 해요.**

## 어디에 쓰지 않나: 루틴과 걸음만

서버 push-to-start 를 붙이고 나니 다른 배너에도 쓰고 싶어졌어요. 하지만 지금 Live Activity 는 **루틴과 걸음, 두 종류만** 노출해요. 예전에 있던 캐릭터 배너와 랭크 배너는 배선을 걷어 냈어요.

기획상 두 종류만 두기로 정했고, 앱은 그 결정에 맞춰 **배너가 한 번에 한 종류만** 뜨게 해요. 지금은 루틴이 우선이고, 걸음 보상이 쌓였을 때만 걸음 배너가 잠깐 자리를 받아요. 배너를 지울 때 함정도 하나 있었어요. 랭크 배너는 "배선을 지웠다"고 기억하고 있었는데, 코드를 보니 루틴 배너가 없는 사용자에게 계속 뜨고 있었어요. 네이티브 화면 코드가 남아 있으면 살아 있는 것처럼 보여서, 지금도 **Dart 쪽 배선이 있는지**로 판단해요.

걸음 화면은 서버가 회전시키지도 않아요. **걸음 수의 표시 정본은 앱의 만보계 계산**이라, 서버가 가진 걸음 스냅샷을 내리면 앱 화면과 숫자가 어긋나요. 서버가 걸음 템플릿을 고르면 이전 배너를 건드리지 않고 그냥 물러나요. 먼저 `end` 를 보내면 "낡은 배너가 남는다"보다 나쁜 "배너가 사라진다"가 돼요.

정리하면, 서버 회전을 붙일지는 이 질문 하나로 갈렸어요.

**그 화면의 값을 서버가 앱과 같은 숫자로 알고 있는가?**

루틴 예정 시각과 완료 여부는 서버가 정본이라 회전에 맞아요. 걸음 수와 진행 중 단식처럼 기기가 실시간으로 계산하는 값은 맞지 않아요.

## 남은 구멍: 8시간

이 구조에도 메우지 못한 곳이 있어요. **활동은 8시간이 지나면 iOS 가 끝내요.** 아침 7시에만 앱을 연 사용자는 오후 3시쯤 활동이 끝나고, update 토큰도 함께 죽어요. 저녁 루틴은 회전으로 덮을 수 없어요.

이 구간은 두 가지가 바닥층이에요. 루틴 알림 시각의 push-to-start 가 새 배너를 띄우고, 다음에 앱이 열리면 앱이 로컬에서 정리해요. 다만 push-to-start 로 뜬 배너의 update 토큰은 다시 앱이 열려야 서버에 닿아서, 그날 저녁의 회전은 끊겨요.

push-to-start 가 기존 활동을 교체하는지에 대해서도 기록이 엇갈려요. 처음엔 "새 활동을 만들고 기존 것을 치워 주지 않는다"고 봤는데, 다음 날 디버그 빌드 한 대에서 연속 전송했을 때는 매번 마지막 하나만 남았어요. release 빌드와 다른 iOS 버전, 앱이 만든 활동과의 관계는 아직 확인 전이라 **서버의 `end` → `start` 와 앱의 "가장 최근 배너 하나만 남기기"를 둘 다 유지하고 있어요** [확인 필요: release 빌드에서의 교체 동작].

iOS 18 부터는 start payload 에 `input-push-token: 1` 이나 채널 ID 를 실어, 시작과 동시에 갱신 경로를 여는 방법도 생겼어요(같은 Apple 문서). 이번 구조에는 쓰지 않았어요 [확인 필요: 검토 여부와 미사용 이유].

## 마치며: 바꾸는 일과 띄우는 일은 다르다

"점심인데 아침 배너"를 처음 봤을 때 저는 **새 배너를 제때 띄우면 된다**고 생각했어요. 그래서 push-to-start 를 붙였고, 배너는 떴어요. 그런데 띄우는 일은 끝내는 일을 낳고, 끝내는 일은 앱이 깨어나야 받을 수 있는 토큰을 요구했어요.

결국 고친 건 질문이었어요. "언제 새 배너를 띄울까"에서 **"하루 한 개의 배너를 어떻게 계속 만질 수 있게 둘까"**로요.

**앱 프로세스가 필요 없는 경로만으로 닫히는지 확인하지 않으면, 그 설계는 앱이 깨어날 때만 동작합니다.**

Live Activity 를 서버에서 다루려 한다면 세 가지를 먼저 물어보세요.

1. **이 흐름의 어느 단계가 앱 코드 실행을 전제하나요?** 토큰 업로드 한 줄이라도 있다면, 앱이 안 깨어나는 날 그 흐름은 멈춰요.
2. **`end` 를 보내는 순간 무엇을 잃나요?** update 토큰은 활동과 함께 죽어요. 없앨지 내용을 바꿀지는 그 토큰을 다시 얻을 수 있는지로 정해야 해요.
3. **APNs 가 `200` 을 줬을 때 무엇을 확인하나요?** alert 누락, 키 이름, epoch 기준처럼 이 기능의 실패는 대부분 조용해요. 실기기에서 배너가 바뀌는 걸 직접 보는 단계를 빼지 마세요.

## 참고 자료

- Apple, [Starting and updating Live Activities with ActivityKit push notifications](https://developer.apple.com/documentation/activitykit/starting-and-updating-live-activities-with-activitykit-push-notifications) — start payload 요구사항(alert 포함), 앱을 깨운다는 문구, `apns-priority` 5/10 과 시간당 예산, update 토큰 교체, iOS 18 의 `input-push-token`. 2026-11-18 확인
- Apple, [Displaying live data with Live Activities](https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities) — 8시간 활동 수명과 잠금화면 최대 12시간, 4 KB 데이터 크기 제한, Apple Watch 에서의 alert 표시. 2026-11-18 확인
- Apple, [`pushToStartTokenUpdates`](https://developer.apple.com/documentation/activitykit/activity/pushtostarttokenupdates) — iOS 17.2 부터 지원. 2026-11-18 확인
