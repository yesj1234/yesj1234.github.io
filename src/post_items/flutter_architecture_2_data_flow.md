---
title: '계층의 경계는 타입이 바뀌는 자리였다 — 토글 하나를 서버까지 따라가 보기'
author: jack
date: 2026. 11. 18.
published: true
description: '이메일 수신 토글 하나가 화면에서 서버까지 갔다 돌아오는 길을 실제 코드로 따라가며, 계층마다 무엇을 알고 무엇을 모르는지, 에러가 어디서 모양을 바꾸는지 정리한 시리즈 두 번째 글이에요.'
series: flutter-architecture
seriesOrder: 2
category: architecture
tags: [Flutter, Architecture]
---

## 들어가며: 문서는 네 줄, 코드는 열 칸이었다

[1편](/posts/flutter_architecture_1_monorepo)에서는 6개 패키지의 지도를 그리고, **의존 방향**과 **호출 방향**이 다르다는 것까지 봤어요. 이번 편에서는 1편의 **"이메일 수신 설정"** 화면으로 **실제 길을 걸어 볼게요.** 마케팅 메일 수신 토글을 끄면, 그 `bool` 하나가 서버까지 갔다가 화면으로 돌아와요.

저희 저장소의 아키텍처 문서에는 이 흐름이 이렇게 적혀 있어요.

```text
1. Page 가 context.read<XBloc>().add(Event)
2. BLoC 핸들러 → UseCase → network DataSource(dio) → 서버 response 를 entity 로 변환해 반환
3. 실패 시 DioException → ResponseError 변환은 network(dio_exception_mapper.dart) 담당,
   BLoC 이 ResponseError/도메인 Exception(entity/lib/exceptions/)을 매핑해 state emit
4. UI 는 BlocBuilder/BlocListener
```

저도 이 네 줄을 믿고 있었어요. 특히 두 가지를요. **비즈니스 로직은 UseCase 에 있다.** 그리고 **에러는 계층을 올라가며 도메인 예외로 바뀐다.**

그런데 토글 하나를 실제 코드로 따라가 보니 **열 칸**을 지나갔어요. 그리고 두 믿음 모두 이 기능에서는 맞지 않았어요. UseCase 는 20줄짜리 전달자였고, 서버 에러는 **원래 모양 그대로 화면의 스낵바까지** 올라왔어요.

이 글은 그 열 칸을 차례로 걸으면서, 칸마다 **이 계층이 아는 것과 모르는 것**을 적어요. 이런 분께 도움이 될 거예요.

- Clean Architecture 그림은 아는데, 실제 코드에서 경계가 어디인지 잘 안 보이는 분
- "UseCase 가 그냥 전달만 하는데 왜 있지?" 싶은 분
- 서버 에러 코드가 화면까지 어떤 모양으로 오는지 헷갈리는 분

## 지도부터: 토글 하나가 지나가는 열 칸

마케팅 수신 토글을 끈 순간부터 화면이 다시 그려질 때까지예요. 기준은 2026년 11월 18일 main 이에요.

| 칸 | 패키지 | 어디서 | 받는 것 | 넘기는 것 |
|---|---|---|---|---|
| 1 | `app` | 토글 위젯 `onChanged` | 손가락 탭 | `bool` |
| 2 | `app` | `EmailPreferencePage` | `bool` | `EmailPreferenceMarketingToggledEvent` |
| 3 | `presenter` | `EmailPreferenceBloc._onToggle` | 이벤트 | 낙관적 state + UseCase 호출 |
| 4 | `usecase` | `EmailPreferenceUseCase.updateMarketing` | `bool` | 인터페이스 호출 |
| 5 | `usecase` | `EmailPreferenceDataSource` (인터페이스) | — | — |
| 6 | `network` | `EmailPreferenceDataSourceImpl` | `bool` | 요청 본문 `Map` + `fromJson` |
| 7 | `network` | `BaseNetwork.put` → dio → 서버 | `Map` | 응답 JSON |
| 8 | `entity` | `EmailPreferenceModel.fromJson` | JSON | 모델 |
| 9 | `presenter` | BLoC 이 결과를 받아 `emit` | `Result` 에 담긴 모델 | 새 state |
| 10 | `app` | `BlocBuilder` → 토글 다시 그림 | state | 화면 |


<figure>
	<img src="/posts/flutter_architecture_2_data_flow/fig-1-ten-cells.webp" alt="토글의 onChanged 에서 Page, BLoC, UseCase, 인터페이스, DataSource 구현, BaseNetwork 를 거쳐 서버로 내려갔다가, fromJson, emit, BlocBuilder 로 돌아오는 열 칸. 칸 사이 타입이 bool, 이벤트, Map, JSON, 모델, state 로 바뀐다" width="1600" height="1200" loading="lazy" />
	<figcaption>토글 하나가 열 칸을 지나는 동안 넘기는 타입이 계속 바뀌고, 그 자리가 계층 경계예요.</figcaption>
</figure>

여기서 볼 건 **"넘기는 것" 열의 타입이 계속 바뀐다**는 점이에요. `bool` → 이벤트 → `Map` → JSON → 모델 → state 로요. 계층 경계는 결국 **타입이 바뀌는 자리**예요. 그리고 문서의 네 줄에는 5칸(인터페이스)과 8칸(모델 변환)이 따로 드러나지 않아요. 이 두 칸이 이 구조의 핵심인데도요.

## 1~3칸: 화면은 bool 을 이벤트로 바꾸고 손을 뗀다

화면 코드에서 토글에 걸린 건 한 줄이에요.

```dart
// app/lib/feat/notifications/email_preference_page.dart
NotificationToggleRow(
  title: Lang.get('marketing_title'),
  value: preference.marketingSubscribed,
  onChanged: (value) => bloc.add(EmailPreferenceMarketingToggledEvent(subscribed: value)),
),
```

`Page` 는 **값을 바꾸지 않아요.** 이벤트를 넣고 끝이에요. 결과는 나중에 state 로 돌아와요.

BLoC 은 이 이벤트를 받아 두 가지를 해요. 화면을 먼저 바꾸고, UseCase 를 불러요.

```dart
// presenter/lib/src/blocs/email_preference/email_preference_bloc.dart
Future<void> _onToggle(EmailPreferenceToggleEvent event, Emitter<EmailPreferenceState> emit) async {
  final EmailPreferenceModel? previous = state.preference;
  if (previous == null || !previous.hasEmail || !previous.isChangeable) return;

  final Future<Result<EmailPreferenceModel>> request;
  switch (event) {
    case EmailPreferenceMarketingToggledEvent(:final subscribed):
      if (previous.marketingSubscribed == subscribed) return;
      emit(state.copyWith(preference: previous.withMarketingSubscribed(subscribed)));
      request = _emailPreferenceUseCase.updateMarketing(subscribed);
    // ... 주제 토글
  }
  final result = await request; // 9칸에서 이어서
}
```

여기서 볼 건 **"보낼지 말지"를 BLoC 이 정한다**는 점이에요. 이메일이 없거나, 바꿀 수 없는 계정이거나, 값이 같으면 UseCase 를 부르지 않고 돌아가요. 화면을 먼저 바꾸고 실패하면 되돌리는 **낙관적 갱신**도 여기서 해요. 그 설계는 4편에서 자세히 다룰게요.

| 계층 | 아는 것 | 모르는 것 |
|---|---|---|
| `Page` (`app`) | BLoC, 이벤트, state, 모델, 번역 문구 | UseCase, 인터페이스, dio, 서버 경로 |
| BLoC (`presenter`) | UseCase, 모델, `Result`, 그리고 `ResponseError` | 인터페이스 구현, dio, 서버 경로, JSON 키 |

BLoC 의 "아는 것"에 서버 에러 타입 `ResponseError` 가 있는 게 눈에 걸려요. 에러 절에서 다시 볼게요.

## 4~5칸: UseCase 는 인터페이스만 본다

BLoC 이 부른 `EmailPreferenceUseCase` 는 파일 전체가 20줄이에요.

```dart
// usecase/lib/feat/email_preference/email_preference_usecase.dart
class EmailPreferenceUseCase {
  EmailPreferenceUseCase({required this._dataSource});

  final EmailPreferenceDataSource _dataSource;

  Future<Result<EmailPreferenceModel>> fetch() => _dataSource.getEmailPreference();

  Future<Result<EmailPreferenceModel>> updateMarketing(bool subscribed) {
    return _dataSource.putMarketingSubscribed(subscribed);
  }

  Future<Result<EmailPreferenceModel>> updateCategory(EmailPreferenceCategoryType type, bool subscribed) {
    return _dataSource.putCategorySubscribed(type, subscribed);
  }
}
```

(`required this._dataSource` 는 private 필드를 named 파라미터로 받는 Dart 3.13 문법이에요. 부르는 쪽은 `dataSource:` 로 넘겨요.)

솔직히 처음 봤을 때 **"이게 왜 있지?"** 싶었어요. 메서드 세 개가 인자를 그대로 넘기기만 해요. "비즈니스 로직은 UseCase 에" 라는 첫 번째 믿음이 여기서 깨졌어요. 이 기능의 규칙은 **BLoC**("보낼지 말지")과 **모델**(`withMarketingSubscribed`, 모르는 주제를 버리는 `fromJson`)에 있었어요.

그렇다면 이 20줄은 무엇을 하고 있을까요? 답은 UseCase 가 **무엇을 import 하는가**에 있어요.

### 의존 역전을 코드로 보면

UseCase 가 들고 있는 `EmailPreferenceDataSource` 는 같은 `usecase` 패키지 안의 인터페이스예요.

```dart
// usecase/lib/interface/repository/email_preference_data_source.dart
/// 응답은 GET·PUT 모두 전체 설정이다.
abstract interface class EmailPreferenceDataSource {
  Future<Result<EmailPreferenceModel>> getEmailPreference();
  Future<Result<EmailPreferenceModel>> putMarketingSubscribed(bool subscribed);
  Future<Result<EmailPreferenceModel>> putCategorySubscribed(EmailPreferenceCategoryType type, bool subscribed);
}
```

구현은 `network` 의 `EmailPreferenceDataSourceImpl implements EmailPreferenceDataSource` 예요. 그러려고 `network` 가 `usecase` 의 인터페이스 파일을 import 하고, 반대 방향의 import 는 없어요. 1편에서 본 **"호출은 아래로, 의존은 가운데로"** 가 코드에서는 이 `implements` 한 단어예요. 런타임에 인터페이스 자리에 구현을 끼워 넣는 건 모든 패키지를 아는 `app` 의 DI 등록이고요. 등록 코드는 5편에서 볼게요.

이 기능만 그런 게 아니에요. `usecase/lib/interface/` 에 선언된 추상 클래스 109개를, 어느 패키지가 구현하는지 `implements`/`extends` 로 찾아봤어요(grep 기준이라 근삿값이에요).

| 구현하는 패키지 | 인터페이스 수 | 무엇 |
|---|---|---|
| `network` | 68 | 서버 API 데이터 소스, 건강 데이터 연동 |
| `app` | 26 | 로컬 알림, 위치, 워치 연결, 로그, 기기 정보 |
| `local_storage` | 13 | 기기 저장소 |
| `usecase` 안 | 3 | — |

(하나는 `app` 과 `usecase` 양쪽에 구현이 있어 합이 110이고, 구현을 찾지 못한 것이 1개예요.)


<figure>
	<img src="/posts/flutter_architecture_2_data_flow/fig-2-interface-implementers.webp" alt="usecase 의 인터페이스를 network 가 68개, app 이 26개, local_storage 가 13개, usecase 자신이 3개 구현한다" width="1600" height="900" loading="lazy" />
	<figcaption>usecase 의 인터페이스는 network 만이 아니라 app 과 local_storage 도 구현해요.</figcaption>
</figure>

여기서 볼 건 **`app` 도 26개를 구현한다**는 점이에요. Flutter 플러그인이 필요한 구현은 `app` 에 두고 인터페이스만 `usecase` 에 둬요.

그러니까 이 20줄짜리 UseCase 의 일은 로직이 아니라 **BLoC 이 `network` 를 모르게 하는 것**이에요. 비용은 파일 하나와 위임 메서드 세 개예요. 다만 **"UseCase = 비즈니스 로직"이라고 설명하면 이 파일을 읽은 사람은 헷갈려요.** 이 프로젝트에서 UseCase 는 먼저 **경계**이고, 로직은 있을 때만 있어요.

## 6~7칸: network 는 Response 를 밖으로 내보내지 않는다

구현체의 메서드 하나를 보면 이래요.

```dart
// network/lib/data_source/email_preference/email_preference_data_source_impl.dart
@override
Future<Result<EmailPreferenceModel>> putMarketingSubscribed(bool subscribed) {
  return _baseNetwork.put(
    '/(이메일 설정 경로)',
    data: {'marketing_subscribed': subscribed},
    fromJson: EmailPreferenceModel.fromJson,
  );
}
```

`DataSource` 가 하는 일은 세 가지예요. 서버 경로를 알고, `bool` 을 요청 본문 키 `marketing_subscribed` 로 바꾸고, 응답을 무엇으로 바꿀지(`fromJson`)를 정해요. 실제 HTTP 는 공통 클래스 `BaseNetwork` 가 해요.

```dart
// network/lib/dio_network/base_network.dart
Future<Result<T>> _request<T>(Future<Response<dynamic>> Function() send, {FromJson<T>? mapper}) async {
  try {
    final response = await send();
    // ... (204, 빈 바디 처리)
    final parsedData = data is String ? jsonDecode(data) : data;
    if (mapper != null) return Success(mapper(parsedData));
    // ... (mapper 가 없을 때의 처리)
  } on DioException catch (error, stackTrace) {
    if (error.error is ResponseError) {
      return Failure(error.error as ResponseError, stackTrace);
    }
    return Failure(error, stackTrace);
  } catch (error, stackTrace) {
    return Failure(error, stackTrace); // 파싱 실패도 값으로
  }
}
```

여기서 볼 건 **dio 의 `Response` 가 이 함수 밖으로 나가지 않는다**는 점이에요. 성공이면 모델이, 실패면 에러가 `Result` 에 담겨 나가요. `Result` 의 설계는 3편에서 다루고, 여기서는 **"network 의 출구에서 이미 모델이 된다"** 만 기억해 주세요.

이 규칙이 얼마나 지켜지는지 세어 봤어요. `network/lib/data_source/` 에서 `fromJson:` 을 넘기는 곳이 411군데예요. 반대로 인터페이스가 모델 대신 `Result<Map<String, dynamic>>` 을 돌려주는 곳은 **2개**였어요. 하나는 결제 영수증 검증, 하나는 개발용 테스트 API 예요. 결제 쪽은 그 맵이 `app` 의 결제 서비스까지 올라가고, 거기서 응답 키를 직접 읽어요. **출구에서 모델로 바꾸지 않으면 JSON 키를 아는 계층이 그만큼 위로 올라가요.**

정리하면 `DataSource` 는 **서버 경로·요청 키·바꿀 모델**을 알고 누가 불렀는지는 몰라요. `BaseNetwork` 는 **dio·인터셉터·타임아웃**을 알고 이메일 설정이라는 기능 자체는 몰라요.

## 8~10칸: JSON 을 아는 건 entity, 올라오는 타입은 그대로

응답 JSON 을 모델로 바꾸는 `fromJson` 은 `network` 가 아니라 `entity` 에 있어요. 모델 파일은 이래요.

```dart
// entity/lib/models/email_preference/email_preference_model.dart
class const EmailPreferenceModel({
  final String? email,
  final bool marketingSubscribed = false,
  final List<EmailPreferenceCategoryModel> categories = const [],
  // ... isChangeable, consentedAt, processedAt
}) extends Equatable {
  factory EmailPreferenceModel.fromJson(Object? json) {
    final Map<String, dynamic> map = json is Map<String, dynamic> ? json : const {};
    final Object? categories = map['categories'];
    return EmailPreferenceModel(
      // ...
      marketingSubscribed: map['marketing_subscribed'] as bool? ?? false,
      categories: (categories is List<dynamic> ? categories : const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(EmailPreferenceCategoryModel.fromJson)
          .nonNulls
          .toList(),
      // ...
    );
  }
  // ...
}
```

(`class const X(...)` 는 Dart 3.13 의 primary constructor 문법이에요. 클래스 이름 옆에 생성자 파라미터를 바로 적으면, 그게 필드 선언이 돼요.)

여기서 볼 건 두 가지예요. 첫째, **`fromJson` 은 어떤 입력에도 던지지 않아요.** 맵이 아니면 빈 맵으로, 키가 없으면 기본값으로 받아요. 앱이 모르는 주제 코드는 `null` 이 되고 `.nonNulls` 가 버려요. 서버가 주제를 늘려도 **이미 배포된 앱이 깨지지 않게** 하려는 장치예요.

둘째, **서버의 `snake_case` 키를 아는 패키지가 둘이에요.** 응답 키는 `entity` 의 모델이, 요청 키는 `network` 의 `DataSource` 가 알아요. 그러니까 정확히는 **"JSON 은 데이터 계층과 entity 만 안다"** 예요. `presenter` 와 `app` 은 JSON 키를 하나도 몰라요.

모델은 BLoC 의 state 에도, 화면에도 그대로 들어가요. 주제 타입을 번역 문구로 바꾸는 것만 `app` 의 VO(화면용 값 객체) `EmailPreferenceCategoryVo.of(type)` 가 해요. 모델 → VO 경계는 **"번역 문구를 누가 아나"** 로 갈려요.

### 9~10칸: 돌아오는 길은 같은 타입으로 올라온다

모델이 담긴 `Future<Result<EmailPreferenceModel>>` 은 **바뀌지 않고** `network` → `usecase` → `presenter` 로 올라와요. 내려갈 때는 칸마다 타입이 바뀌었는데, 올라올 때는 BLoC 에서 비로소 state 로 바뀌어요.

```dart
// presenter/lib/src/blocs/email_preference/email_preference_bloc.dart
final result = await request;
switch (result) {
  case Success(:final data):
    emit(state.copyWith(preference: data));
    // ... 전체 수신 변경이면 처리 일시를 사이드 이펙트로 알림
  case Failure(:final error):
    emit(state.copyWith(preference: previous));
    _emitSideEffect(EmailPreferenceUpdateFailedEffect(error: error));
    if (error is ResponseError && error.hasErrorCode(notChangeableErrorCode)) {
      await _onLoad(const EmailPreferenceLoadEvent(), emit);
    }
}
```

성공하면 **서버가 돌려준 전체 설정으로** state 를 덮어요. PUT 응답도 GET 과 같은 전체 설정이라 가능한 방식이에요. `BlocBuilder` 가 새 state 로 다시 그리면서 열 칸이 끝나요.

성공 경로는 문서의 네 줄과 거의 같았어요. 달랐던 건 `case Failure` 쪽이에요.

## 에러는 계층마다 모양을 바꾼다, 이 기능에서는 한 번 덜

실패 경로를 거꾸로 따라가 볼게요. 서버가 400 과 함께 `{"error_code": "(접두어):EMAIL_PREFERENCE_NOT_CHANGEABLE"}` 을 돌려줬다고 해 볼게요.

### DioException 이 ResponseError 가 되기까지: 세 곳에 나뉜 변환

dio 는 4xx 응답을 `DioException` 으로 던져요. 문서는 "변환은 `dio_exception_mapper.dart` 담당"이라고 적었는데, 실제로 매퍼를 부르는 건 **인터셉터**예요. 토큰 갱신과 재시도를 먼저 시도하고, 그래도 실패하면 바꿔요.

```dart
// network/lib/dio_network/interceptor/network_interceptor.dart
@override
Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
  if (await _handleUnauthorized(err, handler)) return;   // 401 → 토큰 갱신 후 재요청
  if (await _handleRetryableError(err, handler)) return; // 연결 오류 → 재시도

  final responseError = err.toResponseError();
  handler.reject(
    DioException(
      requestOptions: err.requestOptions,
      error: responseError, // 바꾼 결과를 DioException 안에 다시 넣는다
      // ... response, type, stackTrace 는 그대로
    ),
  );
}
```

여기서 볼 건 **`ResponseError` 가 `DioException` 의 `error` 필드에 담겨 돌아간다**는 점이에요. dio 인터셉터는 에러를 `DioException` 으로만 넘길 수 있어서, 껍데기는 그대로 두고 안에 넣어요. 그리고 앞에서 본 `BaseNetwork._request` 의 `catch` 가 그 껍데기를 벗겨 `Failure(ResponseError)` 로 만들어요. 그러니까 변환은 **매퍼, 인터셉터, `BaseNetwork` 세 곳에 나눠** 있어요.

매퍼 자체는 연결 오류면 `noInternetConnection`, 타임아웃이면 `invalidServerError`, 429 면 `tooManyRequests` 로 정해요. 서버가 응답했으면 바디의 `error_code` 를 `:` 로 잘라 마지막 조각을 `ResponseErrorType.fromCode()` 로 찾아요.

`ResponseErrorType` 에는 에러 종류가 73개 정의돼 있어요. 목록에 없는 코드는 `unknown` 이 돼요. `EMAIL_PREFERENCE_NOT_CHANGEABLE` 도 목록에 없어요. 그래서 `ResponseError` 에는 원문 코드를 다시 꺼내는 `hasErrorCode()` 가 따로 있고, BLoC 은 그걸로 분기해요.

참고로 `ResponseError` 와 `Result` 는 `entity` 가 아니라 **`usecase/lib/core/`** 에 있어요. `network` 와 `presenter` 가 둘 다 `usecase` 를 의존하니, 의존 방향 안에서는 맞는 위치예요.

### ResponseError 가 도메인 예외가 되는 곳: 다른 기능에서는

문서의 3번 줄은 BLoC 이 `ResponseError` 를 `entity/lib/exceptions/` 의 **도메인 예외**로 바꾼다고 해요. 팀 기능이 그렇게 해요.

`usecase` 의 `TeamErrorMapper` 확장이 `ResponseError.type` 을 `switch` 로 보고 `TeamNotFoundException`, `TeamFullException` 같은 예외 22종 중 하나로 바꿔요. 모르는 종류면 `ResponseError` 를 그대로 돌려줘요. BLoC 은 실패를 받으면 `error is ResponseError ? error.toTeamException() : error` 로 한 번 바꾼 뒤 사이드 이펙트에 담아요.

이렇게 바꾸면 화면은 `is TeamFullException` 처럼 **도메인 언어로** 분기하고, 서버 코드 문자열을 몰라도 돼요. 그런데 이 매퍼의 doc 주석은 "data source 구현체에서 호출한다"고 적혀 있고, 실제 호출 14곳은 **전부 BLoC 3개 파일**에 있어요. 문서와 코드는 BLoC 을 가리키는데 **주석만 다른 위치를 말해요.**

### 이메일 설정에서는: ResponseError 가 화면까지 간다

이메일 설정 BLoC 은 이 변환을 건너뛰어요. `Failure(:final error)` 의 `error` 를 그대로 사이드 이펙트에 담고, 화면은 그걸 이렇게 보여 줘요.

```dart
// app/lib/feat/notifications/email_preference_page.dart
case EmailPreferenceUpdateFailedEffect(:final error):
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(error.toString()), backgroundColor: AppColor.red),
  );
```

`ResponseError.toString()` 을 따라가면 스낵바에 뜨는 문자열은 이래요.

```text
비행기 모드에서 토글:   ResponseError(type: NO_INTERNET_CONNECTION, statusCode: 0)
바꿀 수 없는 계정:      ResponseError(type: UNKNOWN_ERROR, statusCode: 400) code: (접두어):EMAIL_PREFERENCE_NOT_CHANGEABLE
```

코드를 읽어 얻은 결과이고 실기기에서 띄워 보지는 않았어요. 그래도 **사용자에게 보이는 문구가 디버그 문자열**이에요. 같은 폴더의 알림 설정 화면 두 개도 같은 방식이고, 이 화면은 그 패턴을 따랐어요.

에러의 여정을 표로 모으면 이래요.

| 단계 | 어디서 | 에러의 모양 | 이메일 설정에서 |
|---|---|---|---|
| 1 | dio | `DioException` | 거침 |
| 2 | 인터셉터 + 매퍼 | `DioException` 안의 `ResponseError` | 거침 |
| 3 | `BaseNetwork._request` | `Failure(ResponseError)` | 거침 |
| 4 | BLoC | 도메인 예외(`TeamFullException` 등) | **건너뜀** |
| 5 | `Page` | 번역된 사용자 문구 | **건너뜀**, `toString()` 이 그대로 |


<figure>
	<img src="/posts/flutter_architecture_2_data_flow/fig-3-error-journey.webp" alt="서버 에러는 DioException, DioException 안의 ResponseError, Failure(ResponseError), 도메인 예외, 번역된 사용자 문구의 5단계를 거치는데, 팀 기능은 다섯 단계를 모두 지나고 이메일 설정은 3단계 뒤 4·5단계를 건너뛰어 toString() 이 스낵바에 그대로 뜬다" width="1600" height="900" loading="lazy" />
	<figcaption>도메인 예외로 바꾸는 4단계는 관례라서, 이메일 설정은 그 단계를 건너뛰었어요.</figcaption>
</figure>

여기서 볼 건 **4단계가 강제가 아니라 관례**라는 점이에요. `Failure.error` 의 타입은 `Object` 라서, BLoC 이 바꾸지 않아도 컴파일러는 아무 말을 하지 않아요. 4단계를 건너뛰면 화면이 분기할 기준도 없어서 5단계도 같이 빠져요. 저장소 전체로 보면 `presenter/lib` 에서 `ResponseError` 를 직접 다루는 파일이 29개, 도메인 예외 타입으로 분기하는 파일이 25개예요(grep 기준). 두 방식이 섞여 있어요.

이 구멍을 어떻게 막을지, 예외와 값 중 무엇을 고를지는 3편에서 `Result` 와 함께 다룰게요.

## 새는 경계: 모른다고 적었지만 아는 곳

저장소 전체로 넓히면 "이 계층은 이걸 모른다"가 지켜지지 않는 곳이 두 종류 있어요. 1편에서 이름만 꺼낸 것들이에요.

### 화면이 BLoC 을 건너뛰고 UseCase 를 부른다

`app` 은 DI 조립 때문에 모든 패키지를 의존해서, 화면에서 `getIt<XUseCase>().method()` 를 부르는 것도 막히지 않아요. `app/lib/feat` 에서 라우트 빌더와 개발자 페이지를 뺀 파일 중 **78개**가 이렇게 UseCase 의 멤버를 직접 불러요. 동기 getter 나 스트림 구독처럼 문제없는 것도 섞여 있어요.

문제가 되는 건 **`Future` 를 돌려주는 메서드**, 즉 네트워크 호출이에요. 화면이 직접 부르면 로딩·에러 상태가 state 밖에 흩어지고, 위젯을 띄우지 않고는 테스트할 수 없어요. 패키지 구조로는 막을 수 없어서, 소스를 읽는 **아키텍처 테스트**를 뒀어요.

```dart
// app/test/architecture/bloc_bypass_guard_test.dart
// 뒤에 `.` 이 붙은 것만 — Bloc(useCase: getIt<X>()) 같은 BLoC 조립은 매칭되지 않는다.
final RegExp _directCall = RegExp(r'getIt<(\w*(?:UseCase|Usecase|UseCases))>\(\)\s*\.\s*(\w+)');

// 찾은 멤버의 반환형을 usecase/lib 선언에서 찾아, Future 면 위반으로 센다.
```

판정 기준을 호출부의 `await` 가 아니라 **선언의 반환형**으로 잡은 게 핵심이에요. `await` 없이 콜백으로 넘긴 네트워크 호출도, 이름만 IO 같은 동기 메서드도 있었거든요. 기존 위반 **26건**은 허용 목록에 두고 새로 생기는 것만 막아요. 고쳐진 항목이 목록에 남아 있으면 실패하는 테스트도 같이 둬서, 목록은 줄어들기만 해요.

### 인터페이스와 BLoC 이 플러그인 타입을 안다

건강 데이터 인터페이스는 이래요.

```dart
// usecase/lib/interface/repository/health_sync_data_source.dart
import 'package:health/health.dart';

abstract interface class HealthSyncDataSource {
  Future<Result<List<HealthDataPoint>>> readHealthData({required List<HealthDataType> types, /* ... */});
  // ...
}
```

반환 타입 `HealthDataPoint` 가 Flutter 플러그인의 타입이에요. 그래서 `usecase` 에서 `package:health` 를 import 하는 파일이 10개예요. 인터페이스가 있어도 **시그니처에 바깥 타입이 있으면 경계는 열려 있어요.**

`presenter` 도 같은 모양이에요. `pubspec.yaml` 에 `in_app_purchase` 와 `video_player` 가 있는데, `in_app_purchase` 는 페이월·코인 구매 BLoC 을 포함한 파일 5개가 import 해요. `video_player` 는 선언만 있고 import 하는 파일이 없었어요.

결제 쪽은 이유가 인터페이스 주석에 남아 있어요. 결제 플러그인은 Flutter 플러그인이라 구현은 `app` 에 두고, `presenter` 는 `app` 을 import 할 수 없으니 인터페이스를 `presenter` 에 뒀다고 적혀 있어요. 인터페이스가 플러그인의 상품 타입(`ProductDetails`)을 그대로 내보내는 이유도 적혀 있어요. **구매 호출이 조회해 온 그 인스턴스 자체를 요구**하고, 무료 체험이 붙을지를 가르는 값이 인스턴스 안에 실려 있어서, 평평한 값 객체로 바꾸면 되돌릴 방법이 없다는 거예요. 같은 주석은 "`usecase` 는 Flutter 의존이 없다"는 것도 이유로 들어요. 그런데 이 주석을 쓸 때 `usecase` 의 `pubspec.yaml` 에는 이미 위의 `health` 가 있었어요.


## 마치며: 경계는 타입이 바뀌는 자리였다

처음에 믿었던 두 가지로 돌아가 볼게요. "비즈니스 로직은 UseCase 에 있다"는 이 기능에서 맞지 않았어요. 규칙은 BLoC 과 모델에 있었고, UseCase 는 BLoC 이 바깥 세계를 모르게 하는 **경계**였어요. "에러는 계층을 올라가며 도메인 예외로 바뀐다"도 반만 맞았어요. `ResponseError` 까지는 구조가 바꿔 주지만, 그다음은 **각 BLoC 이 바꿀지 말지 고르는 관례**였어요.

문서의 네 줄이 틀린 건 아니에요. 다만 네 줄은 **화살표**를 적었고, 경계의 실체는 **화살표 사이에서 바뀌는 타입**에 있었어요. 타입이 바뀌는 자리를 세어 보면 그 계층이 무엇을 숨기는지가 보이고, 타입이 그대로 통과하는 자리를 보면 무엇이 새는지가 보여요.

여러분의 저장소에서도 버튼 하나를 골라 탭부터 화면 갱신까지 걸어 보세요. 그러면서 이렇게 물어보면 경계가 판별돼요.

1. **network 의 출구에서 나가는 타입이 모델인가?** `Response`, `Map`, `dynamic` 이 나가면 그 위 계층이 JSON 키를 알게 돼요.
2. **서버가 4xx 를 돌려주면 사용자에게 어떤 문구가 보이나?** BLoC 이 에러 코드 문자열을 직접 비교하고 있다면, 도메인 예외로 바꾸는 단계가 빠진 거예요.
3. **인터페이스 시그니처에 바깥 패키지 타입이 있나?** 있다면 그 인터페이스는 구현은 숨기지만 의존은 숨기지 못해요.
4. **화면에서 UseCase 의 `Future` 메서드를 직접 부르는 곳이 있나?** 패키지 의존으로는 막히지 않으니, 막고 싶다면 테스트나 린트가 필요해요.

UseCase 가 위임만 한다고 해서 지울 필요는 없다고 봐요. 기준은 하나예요. **"그 UseCase 를 지우면 BLoC 이 `network` 나 인터페이스를 직접 알게 되나?"** 그렇다면 그 20줄은 경계로서 일하고 있어요.

### 시리즈 안내

1. [패키지를 6개로 나눠도 경계는 린트가 지킨다](/posts/flutter_architecture_1_monorepo)
2. **계층의 경계는 타입이 바뀌는 자리였다 — 토글 하나를 서버까지 따라가 보기** (이 글)
3. [실패를 값으로 바꾸자, 던져진 실패가 숨기 시작했다](/posts/flutter_architecture_3_result)
4. [emit 했는데 화면이 그대로인 이유 — 이벤트와 화면 사이의 다섯 칸](/posts/flutter_architecture_4_bloc_viewmodel)
5. [구조는 사람보다 AI 가 더 문자 그대로 읽는다 — DI·라우팅·테스트 편](/posts/flutter_architecture_5_di_routing_testing)

## 참고 자료

- [The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) — 의존은 안쪽(정책)으로만 향한다는 규칙
- [dio Interceptors](https://pub.dev/packages/dio#interceptors) — `onError` 에서 `handler.reject` / `resolve` 로 에러를 바꾸거나 복구하는 방식 (이 글은 dio 5.9.2 기준)
- [Dart class modifiers](https://dart.dev/language/class-modifiers) — `abstract interface class` 의 의미
- [flutter_bloc](https://bloclibrary.dev/) — `BlocBuilder`, `Emitter` (이 글은 flutter_bloc 8.1.6 기준)
