---
title: Flutter App Architecture(1) - MVVM
author: jack
description: MVVM(Model View ViewModel)아키텍처에 대해 알아봅니다.
published: true
date: 2024. 11. 23.
tags: ['Flutter']
---

Architecture란 용어는 문맥에 따라 다양한 의미를 지니는 단어이기 때문에 한 문장으로 정의하기 애매한 단어입니다.  
앱을 개발하는 관점에서 Architecture는 유지 보수성, 확장성을 고려하여 앱을 어떻게 구조화/체계화/설계 할지에 대한 방법이라고 생각 할 수 있습니다.
이러한 아키텍처를 고민하고 앱을 개발하면 여러가지 이점을 얻을 수 있습니다.

좋은 아키텍처는...

- **유지 보수성(Maintainability)** : 앱의 새로운 기능을 추가하거나 업데이트 혹은 수정에 유연하게 대응할 수 있습니다.
- **확장성(Scalability)** : 많은 개발자들이 동시에 개발에 참여할 수 있습니다.
- **쉬운 테스트 코드 작성(Testability)** : 간단한 class와 잘 정의된 인터페이스는 좋은 테스트를 할 수 있게 도와줍니다.
- **새로운 개발자의 낮은 학습 곡선(Lower cognitive load)** : 높은 가독성을 확보 할 수 있고, 앱의 아키텍처를 아는 개발자들은 많은 노력 없이도 프로젝트 개발에 참여할 수 있습니다.
- **더 나은 유저 경험(Better user experience)** : 새로운 기능 개발이 빨라지고 버그가 줄어듭니다.

아키텍처를 선정할 때 가장 중요하게 고려할 것은 **관심사의 분리**(Separation of concerns)입니다.

# Separation of concerns

**관심사의 분리**([Separation of concerns](https://en.wikipedia.org/wiki/Separation_of_concerns))는 프로그램을 여러 개의 구별되는 영역으로 분리하는 디자인 원칙입니다.

**관심사**(Concern)란 프로그램에 영향을 주는 정보의 집합체입니다.

이러한 관심사의 분리는 각 영역이 담당하는 관심사를 다른 영역으로부터 숨기고(Encapsulating) 잘 정의된 인터페이스를 통해 다른 영역과 소통함으로써 이루어집니다.

웹이나 앱에서 많이 사용하는 레이어드(Layered) 아키텍처는 이러한 관심사의 분리 디자인 원칙의 구현입니다.
레이어드(Layered), 즉 층이 나눠져 있다는 것은 각 레이어가 인접한 레이어와만 소통할 수 있다는 의미가 담겨져 있습니다.

이번 글에선 이런 레이어드 아키텍처 중 **MVVM** 아키텍처에 대해서 알아보도록 하겠습니다.

# Layered Architectures in Flutter App

이 글은 [플러터팀이 작성한 App architecture](https://docs.flutter.dev/app-architecture) 을 읽고 정리한 내용입니다. 참고 부탁드립니다.

**용어 정의하기**

레이어드 아키텍처는 관심사 분리 원칙의 구현이라는 것을 알았습니다.

하지만 앱의 영역을 어떻게 분리할 지에 대한 부분은 각 아키텍처에 과제로 남아 있습니다.

그러다 보니 각 아키텍처 마다 각 영역이 담당하는 관심사가 조금씩 달라 지고 자연스럽게 용어의 의미도 다르게 사용되곤 합니다.

따라서 아키텍처를 선택할 때는 아키텍처에서 사용 되는 용어를 정확히 숙지할 필요가 있습니다.

**공통되는 레이어**

각 아키텍처마다 관심사를 분리하는 기준이 달라진다고 해도 공통되는 큰 틀은 어느정도 정해져있습니다.
일반적으로 앱의 복잡도에 따라 레이어를 크게 2~3개로 나눌 수 있습니다.

- **UI layer** : 유저에게 데이터를 어떻게 보여줄지와 유저와의 상호작용을 담당하는 레이어입니다. Presentation layer라고도 합니다.
- **Logic layer** : 데이터에 관련된 비즈니스 로직을 담당합니다.
- **Data layer** : 외부 데이터베이스나 플랫폼 플러그인과의 소통을 담당합니다.

**일관된 데이터 관리와 단방향 데이터 흐름**

앱에서 사용 되는 모든 데이터 타입은 일관된 데이터를 가져야합니다. 이는 데이터를 단 한 곳에서만 관리, 제공해야 함을 의미합니다.

일반적으로 Data layer에 있는 Repository가 데이터를 관리, 제공합니다.

![Unidirectional_data_flow](/unidirectional_data_flow.png)

유저의 상호작용으로 인한 데이터의 변경도 마찬가지로 최종적인 데이터를 변경하는 곳은 Data layer이어야 합니다.  
유저의 상호작용으로 인한 데이터의 변경은 다음과 같은 단방향 데이터 흐름을 갖습니다.

1. **[UI Layer]** : 클릭과 같은 유저 상호작용이 일어나면 그 클릭에 걸려있는 콜백이 실행됩니다. 해당 콜백은 Logic layer가 인터페이스로 UI layer에 제공하는 메서드입니다.
2. **[Logic Layer]** : 해당 콜백은 Data layer가 Logic layer에 인터페이스로 제공하는 메서드입니다. 해당 메서드를 실행시키기 전에 필요한 비즈니스 로직이 있다면 Logic layer에서 이를 담당합니다. 최종적인 데이터의 변경은 Data layer의 메서드가 담당합니다.
3. **[Data Layer]** : Logic layer에 인터페이스로 제공한 메서드가 실행됩니다. 실행된 메서드의 리턴값을 Logic layer로 전달합니다. 이는 곧 데이터의 업데이트를 의미하기도 합니다.
4. **[Logic Layer]** : Data layer로 리턴값을 받고 State를 업데이트합니다. 업데이트 된 리턴값을 UI에 전달합니다.
5. **[UI Layer]** : Logic layer로 부터 리턴값을 받고 업데이트 된 state를 이용해 UI를 업데이트합니다.

**Flutter에서 UI는 (불변)상태에 대한 함수다**

Flutter는 선언적(declarative)이기 때문에 Flutter에서의 UI는 현재 상태를 반영한 결과값입니다.

항상 염두에 두어야 할 점은 데이터가 UI를 결정해야 한다는 점입니다. UI관점에서 데이터는 불변 값 이어야하며
최대한 데이터와 관련된 비즈니스 로직을 포함하지 않아야 합니다.

이런 특징은 앱이 종료 되었을 때 데이터의 유실을 최소화 할 수 있고 테스트에 유용하며 버그가 발생할 가능성을 낮춰줍니다.

## MVVM Architecture

MVVM(Model, View, ViewModel) 아키텍처에서 사용하는 용어에 대한 정의를 먼저 하고 가도록 합시다.
MVVM아키텍처는 크게 **UI layer**와 **Data(model) layer**로 나눌 수 있습니다.

![MVVM](/MVVM.png)

- **UI Layer**
  - View : 유저에게 데이터를 어떻게 보여줄지에 대한 화면을 정의합니다. 일반적으로는 Scaffold위젯을 갖는 하나의 페이지라고 생각할 수 있으며 ViewModel에 유저 인터랙션으로 인해 발생하는 이벤트를 전달합니다.
  - ViewModel : Repository가 전달하는 데이터를 View가 UI를 그리는데 필요한 state로 가공하는 역할을 합니다. 여러 Repository로 부터 정보를 받아 합쳐서 전달하거나 적절한 type으로 변환하는 등의 로직을 수행합니다.
- **Data(Model) Layer**
  - Repository : 유일한 데이터의 원천(Single Source of Truth)역할을 합니다. Serivce로 부터 데이터를 받아오고 Domain model로 변환한 후 ViewModel로 전달합니다.
  - Service : 데이터베이스, REST endpoint, local file 등의 앱 외부와 소통하는 게이트웨이입니다. Repository에 Future나 Stream과 같은 형식으로 데이터를 제공하며 데이터 로딩에 관한 역할만 수행합니다.
- **Domain model** : 앱에서 필요한 데이터의 모양을 결정합니다. Repository에서 원본 데이터를 Domain model로 변환하고 ViewModel에서 Domain model을 가지고 비즈니스 로직을 수행합니다.

---

### UI Layer

UI layer는 유저에게 데이터를 보여주고 버튼 클릭과 같은 유저의 행동 혹은 입력폼 제출과 같은 이벤트를 담당합니다.

MVVM 아키텍처에서는 UI layer를 다시 View, ViewModel로 나눕니다.

View와 ViewModel은 1대1 관계를 갖습니다.

#### View

유저에게 데이터를 어떻게 보여줄지 정합니다. Flutter는 앱을 Widget들의 조합으로 하나의 페이지를 구성합니다. 예를 들어 하나의 View는 Scaffold 위젯을 포함하는 페이지가 될 수 있습니다. 유저의 입력이나 클릭과 같은 상호작용으로 발생하는 이벤트를 ViewModel로 전달합니다.

View는 데이터와 관련된 비즈니스 로직을 포함해서는 안됩니다.
데이터와 관련된 모든 비즈니스 로직은 ViewModel에서 수행되어야 하며 결과값만을 받아 사용해야 합니다.

View에서 처리할 수 있는 비즈니스 로직은 다음과 같이 한정됩니다.

- 화면에 표시할 위젯을 정할 간단한 분기처리 로직(if statement와 같은)
- 애니메이션에 필요한 로직
- 서로 다른 디바이스를 위한 반응형 로직
- 페이지 라우팅 로직

#### ViewModel

View가 필요로 하는 데이터를 제공하는 역할을 합니다.
Repository로부터 받은 app data들을 1대1로 대응하는 View가 필요로 하는 데이터 형태로 가공하여 전달합니다.

ViewModel의 주된 관심사는 다음과 같습니다.

- Repository로 부터 데이터를 전달받아 1대1로 대응되는 View에 필요한 데이터 형태로 가공하기. 예를 들어, 여러 repository로 부터 데이터를 받아 하나로 묶거나, 받은 데이터를 특정 조건에 맞게 필터링하는 로직을 수행합니다.
- View가 화면을 그리는데 필요한 상태(State)를 관리합니다. 예를 들어, 화면에 특정 위젯을 보여줄지에 대한 boolean flag, 캐러셀의 어느 부분을 표시할 지에 대한 상태값 등이 이에 포함됩니다.
- View의 이벤트 핸들러가 사용할 콜백(command)을 제공해야합니다. Dart에서는 이 command를 ViewModel 클래스의 멤버로 정의하여 사용하며 메서드로 View에 제공됩니다.

---

### Data(Model) Layer

MVVM 아키텍처는 Data(Model) layer를 Repository , Service 로 나눕니다.

#### Repository

Repository는 유일한 데이터의 원천(Single Source of Truth)역할을 합니다.
Serivce로 부터 데이터를 받아오고 Domain model로 변환한 후 ViewModel로 전달합니다.

Repository는 Service에 다음과 같은 관련된 비즈니스 로직을 수행합니다.

- **캐싱**
- **에러 핸들링**
- **재요청**
- **새로고침**
- 데이터를 주기적으로 확인하기위한 **Polling**

Repository는 ViewModel에 데이터를 전달할 때 DomainModel에 정의된 형태로 가공하여 데이터를 전달하여야 합니다.

소셜 미디어 앱을 예로 들어보면 유저 프로필 데이터를 관리하기 위한 UserProfileRepository가 있을 수 있습니다.

유저의 로그인 상태에 따라 UserProfileRepository는 `Stream<UserProfile?>`을 제공할 것이고 이때 UserProfile이 Domain model이며 ViewModel에서 사용되는 데이터의 형태입니다.

이런 **Domain model과 Repository가 1대1로** 대응되어 관리되어야 합니다.

**Repository와 ViewModel은 다대다** 관계를 갖습니다.
하나의 ViewModel은 여러 Repository로 부터 데이터를 받아와 사용할 수 있고 마찬가지로 하나의 Repository는 여러 ViewModel로 부터 호출될 수 있습니다.

Repository끼리는 서로 영향을 주어선 안됩니다. 만약 서로 다른 Repository로 부터 데이터를 받아와 비즈니스 로직을 수행해야 한다면 이 과정은 반드시 ViewModel 혹은 Domain layer에서 수행되어야 합니다.

#### Service

Services는 데이터베이스, REST endpoint, local file 등의 앱 외부와 소통하는 게이트웨이 역할입니다.

Repository에 Future나 Stream과 같은 형식으로 데이터를 제공하며 데이터 로딩에 관한 역할만 수행하며 상태에 관한 정보를 가져서는 안됩니다.

**Service와 외부 Data source는 1대1** 관계를 갖습니다.

외부 Data source는 다음과 같은것들을 의미합니다.

- **iOS나 Android API와 같은 플랫폼**
- **REST endpoints**
- **로컬 파일**

**Service 와 Repository는 다대다 관계**를 갖습니다. 하나의 Service는 여러 Repository에서 사용될 수 있으며 하나의 Repository는 여러 Service로 부터 데이터를 받아와 사용할 수 있습니다.

---

# Best practices

## Separation of concerns

**Strongly recommended**

1. UI Layer & Data Layer의 명확한 분리
2. Data Layer에서 Repository pattern 사용
3. UI Layer에서 View 와 ViewModel 사용
4. widget 안에 비즈니스 로직 포함시키지 않기

**Conditional**

1. widget에 업데이트가 필요할 경우엔 ChangeNotifier 혹은 Listenable 사용
2. Domain Layer 사용

## Handling data

**Strongly recommended**

1. 단방향 데이터 흐름을 통해 데이터 관리
2. data model은 불변 타입으로 사용

**Recommended**

1. Command pattern을 사용해 유저와의 상호작용으로 발생하는 이벤트 관리
2. freezed 같은 코드 제너레이터를 사용해 data model 관리

**Conditional**

1. API 모델과 domain 모델 분리하여 만들기

## App structure

**Strongly recommended**

1. 의존성 주입 패턴 사용
2. Abstract repository 사용

**Recommended**

1. go_router를 사용
2. 파일, 디렉토리, 클래스 이름 지을 때 표준화된 규칙 사용하기

## Testing

**Strongly recommended**

1. Test architectural components separately and together
2. Make fakes for testing (and write code that takes advantages of fakes.)

# Sources

- https://docs.flutter.dev/app-architecture
