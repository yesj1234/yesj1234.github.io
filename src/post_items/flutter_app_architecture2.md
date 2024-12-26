---
title: Flutter App Architecture(2) - Riverpod Architecture
author: jack
description: Riverpod 아키텍처에 대해 알아봅니다.
published: true
date: 2024. 12. 10.
tags: ['Flutter']
---

# Riverpod Architecture

![Overall diagram of Riverpod architecture](/riverpod_architecture.png)

## Presentation Layer

**presentation layer**는 다음과 같이 Widget, Controller로 이루어져있습니다.

- **Widgets**: 실제 화면에 데이터를 어떻게 보여줄지를 결정
- **Controllers**: POST요청과 같은 데이터와 관련된 비동기적인 요청을 수행하고 widget state를 관리

### Widgets

**Widget은** MVVM 아키텍처에서 **View**에 해당하는 부분으로 이해할 수 있습니다.

Widget은 실제 화면에 데이터를 어떻게 보여줄지 결정하는 부분입니다.

데이터와 관련된 비즈니스 로직을 포함하지 않도록 주의해야합니다.

### Controllers

**Controller**는 MVVM 아키텍처에서 **View Model**에 해당하는 부분으로 이해할 수 있습니다.

Controller의 역할은 다음과 같습니다.

- 데이터와 관련된 비즈니스 로직을 포함
- Widget의 state를 관리
- Data layer의 repository와 데이터를 주고 받으며 Widget과 Data layer를 중개

---

## Domain Layer

Domain layer는 특정 앱이 필요로 하는 데이터의 모양을 결정합니다.

Wikipedia는 도메인 모델을 다음과 같이 정의합니다.

> 도메인 모델은 **행위**와 **데이터**를 둘 다 아우르는 도메인의 **개념 모델**(Conceptual Model)이다.

예를 들어, 쇼핑앱을 만든다고 가정해보면 다음과 같은 개념 모델들을 생각해 볼 수 있습니다.

- **User** : ID, email 등의 property를 갖는 모델
- **Product** : ID, image URL, title, price, available quantity 등의 property를 갖는 모델
- **Item** : Product ID, quantity 등의 property를 갖는 모델
- **Cart** : List of items, total 등의 property를 갖는 모델
- **Order** : List of items, price paid, status, payment details 등의 property를 갖는 모델

모델은 해당 도메인에 대한 충분한 이해와 고민을 바탕으로 만들어집니다.

각각의 모델들이 도메인의 무엇을 나타내는지에 대한 **컨셉**과 전체 시스템 안에서 다른 모델들과 소통하기 위한 **행동**들, 각 모델들이 다른 모델들과 맺는 **관계성** 등에 대한 고민이 필요합니다.

Riverpod architecture에서의 모델은 다음과 같은 특징을 갖는 **class**로 이해할 수 있습니다.

- **불변**(Immutable)
- fromJson , toJson과 같은 **직렬화 로직**(Serialization logic)을 포함
- 동등성 비교를 위한 **== 연산**, **hashCode**

위의 예시의 Cart가 Order는 Item에 의존성을 갖듯이 모델은 **다른 모델에 의존성**을 가질 수 있습니다.  
하지만 data를 어디서 가져오는지에 대한지는 포함하지 않습니다.

따라서 Domain layer를 다른 레이어들과 구분되는 별개의 layer로 표현할 수 있습니다.

하지만 Diagram의 표현과는 다르게 model들은 인접레이어인 Application layer 혹은 Data layer와만 소통하는 식이 아니라 Widget과 같은 presentation layer와도 필요하다면 가져다 사용하는 class입니다.

---

## Data Layer

Data layer는 다음과 같이 3개의 서로 다른 타입의 클래스를 포함합니다.

- **Data Sources**: 원격 데이터베이스, REST API endpoint, push notification, 블루투스 인터페이스 등의 앱 외부와 소통하기 위한 써드파티 API들
- **Data Transfer Objects** : DTO. Data sources로 받아오는 데이터들. 일반적으로 JSON과 같은 비정형 데이터인 경우가 많음
- **Repositories**: 백엔드 API 등의 다양한 Data source가 반환하는 DTO에 접근하기 위한 클래스로서 앱에서 사용하기 위해 type-safe한 모델로 변환하는 과정을 담당

Data Source와 Data Transfer Object들은 앱 외부의 패키지들입니다.
해당 패키지들을 사용하기 위해서는 해당 패키지가 제공하는 API들을 사용하여 소통해야합니다.

반면 Repository는 앱의 일부입니다. 직접 설계하고 코드를 작성해서 사용하는 클래스입니다.

만약 앱에서 원격 혹은 로컬 데이터베이스를 사용한다면 그 데이터베이스가 앱의 유일한 정보의 원천(Single Source of Truth)이어야하며 Repository는 데이터베이스에 접근하는 gateway역할을 합니다.
이는 단방향 데이터 흐름 원칙을 이용해 구현할 수 있습니다.

---

# Code Example

위의 개념들을 최대한 활용해 Firestore로부터 이미지URL을 받아와 기본 아바타 프로필 이미지를 보여주는 위젯을 하나 만들어보겠습니다.

**1. 모델 정의**

```dart
class DefaultImage {
  String? downloadURL;
  DefaultImage({required this.downloadURL});

  factory DefaultImage.fromJson(Map<String, dynamic> data) {
    final downloadURL = data['downloadURL'];
    return DefaultImage(downloadURL: downloadURL);
  }
}

```

**2. Abstract Repository 정의**

```dart
abstract class DefaultImageRepository {
  Future<DefaultImage> getDefaultImage();
}
```

**3. Concrete Repository 정의**

```dart
class FireStoreDefaultImageRepository implements DefaultImageRepository {
  final FirebaseFirestore instance;
  FireStoreDefaultImageRepository({required this.instance});
  @override
  Future<DefaultImage> getDefaultImage() async {
    // TODO: send request, parse response, return DefaultImage object or throw.
    final image = instance.collection('images').doc('LNnga0Rn86RkxU6kB8VO');
    final result = await image.get().then((DocumentSnapshot doc) {
      final json = doc.data() as Map<String, dynamic>;
      final defaultImage = DefaultImage.fromJson(json);
      return defaultImage;
    });
    return result;
  }
}
```

**4. Controller 정의**

```dart
@riverpod
class DefaultImageController extends _$DefaultImageController {
  @override
  Future<DefaultImage> build() async {
    final repository = ref.read(defaultImageRepositoryProvider);
    return await repository.getDefaultImage();
  }
}
```

**5. Widget**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:farmers_journal/domain/firebase/DefaultImage.dart';
import 'package:farmers_journal/presentation/controller/default_image_controller.dart';

class AvatarProfile extends ConsumerWidget {
  final double width;
  final double height;
  final VoidCallback onNavigateTap;
  const AvatarProfile({
    super.key,
    this.width = 10.0,
    this.height = 10.0,
    required this.onNavigateTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<DefaultImage> defaultImage =
        ref.watch(defaultImageControllerProvider);
    return GestureDetector(
      onTap: onNavigateTap,
      child: SizedBox(
        width: width,
        height: height,
        child: CircleAvatar(
          backgroundImage: switch (defaultImage) {
            AsyncData(:final value) => NetworkImage(value.downloadURL!),
            AsyncError() => const AssetImage('assets/avatars/default.png'),
            _ => const AssetImage('assets/avatars/default.png'),
          },
        ),
      ),
    );
  }
}

```

# Sources

https://codewithandrea.com/articles/flutter-presentation-layer/
https://codewithandrea.com/articles/flutter-repository-pattern/
https://codewithandrea.com/articles/flutter-app-architecture-domain-model/
https://codewithandrea.com/articles/flutter-app-architecture-domain-model/
