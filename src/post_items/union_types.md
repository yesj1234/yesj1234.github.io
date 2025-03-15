---
title: Union types in dart
description: Union type에 대해 알아봅시다.
author: jack
published: true
date: 2024. 12. 26.
tags: ['Dart']
---

# Union types

개인 프로젝트를 개발하는 와중에 Union type을 사용하고 싶은 경우가 있었습니다.

상황은 다음과 같았습니다.

1. 포스트는 이미지 파일, 제목, 내용을 포함할 수 있습니다.
2. 이미지는 image picker 패키지를 통해 사진첩에서 **XFile** 타입으로 가져올 수 있으며 Image.File 위젯을 사용하여 보여줍니다.
3. 이미지를 포스트에 포함하여 저장할 경우에는 firestorage에 이미지 파일을 저장하고 download url을 받아 데이터베이스 해당 **url을 String으로 저장**합니다.
4. 이미지를 포함하는 기존의 포스트를 수정할 경우에는 원본 내용을 보여줘야 합니다. 이 경우 이미지는 download url을 string으로 받아서 Image.network 위젯을 통해 보여줍니다.
5. 만약 새로운 사진을 추가할 경우 이미지를 보여주는 위젯은 이제 **download url(String)** 과 **XFile** 두가지 타입을 동시에 처리할 수 있어야 합니다.

따라서 String, XFile 두 가지 타입을 받기 위해 dynamic 타입으로 받아와서 타입이 String일 경우에는 Image.network위젯을, XFile일 경우에는 Image.file을 사용하도록 했습니다.

위와 같은 방식은 코드를 짜기 편리하다는 장점이 있지만 단점 또한 적지 않습니다.

단점은 다음과 같습니다.

- 개발자가 직접 타입을 일일이 확인해서 해당 타입에 맞게 분기를 처리해주어야 하기 때문에 실수가 발생하기 쉽습니다(만약 타입이 여러개일 경우 미처 확인하지 못하고 지나가는 타입이 있는 경우 등).
- 컴파일러가 타입을 인식하지 못하기 때문에 IDE의 자동완성기능과 같은 compile 언어의 장점을 제대로 활용할 수 없습니다.
- 또한 String이나 XFile 타입이 아니라 다른 타입이 들어올 경우에는 runtime error가 발생할 수 있습니다.

이런 단점들을 해결해보고자 Dart에서 union type을 다루는 방식에 대해 알아보고자 합니다.

# Type systems

Union type을 알아보기 전에 type에 대한 몇 가지 개념들에 대해 보고 가도록 합시다.

개발 언어마다 type을 다루는 방식이 상이합니다.

예를 들어 typescript는 **shape based typ**e을 사용하고 java는 **nominal type**을 사용합니다.

shape based type과 nominal type은 **타입간의 호환성**(Type Compatibility), **유연성**(Flexibility), **에러를 처리하는 방식**에 차이가 있습니다.

## Nominal types

**Nominal type** 은...

- 선언된 타입의 **이름** 혹은 **identity**에 기반합니다.
- 타입의 **이름 혹은 선언이 같은 경우**에 두 가지 타입이 **호환**됩니다.
- 상속(Inheritance)이나 서브 타이핑(subtyping) **관계는 명시적으로 선언**되어야 합니다.
- Java, C++, C#과 같은 언어가 nominal type을 사용합니다.

## Shaped based types

**Shaped based type**은...

- 타입의 이름이나 선언이 아닌 **구조 / 모양(properties, method)**으로 타입을 결정합니다.
- 만약 이름이 서로 다른 두 타입이 **같은 구조를 갖고 있다면 같은 타입**으로 간주합니다.
- typescript, Go, OCaml 언어가 shaped based type을 사용합니다.
- python과 같은 동적인 언어에서는 duck typing("If it looks like a duck and quacks like a duck, it's a duck.") 이라고도 합니다.

예시 코드

```typescript
// Shaped based types
interface User {
	id: string;
	name: string;
}

interface Order {
	id: string;
	total: number;
}

function printId(entity: { id: string }): void {
	console.log(`ID: ${entity.id}`);
}

const user: User = { id: 'u123', name: 'Alice' };
const order: Order = { id: 'o456', total: 99.99 };

printId(user); // Valid
printId(order); // Valid
```

위처럼 typescript와 같은 Shape base type 시스템에서는 User 든 Order든 String 타입의 id를 갖고 있기 때문에 printId 함수를 실행시키는데 문제가 없습니다.

```dart
class UserId {
  final String value;

  UserId(this.value);
}

class OrderId {
  final String value;

  OrderId(this.value);
}

String getUserById(UserId id) {
  return 'User with ID: ${id.value}';
}

String getOrderById(OrderId id) {
  return 'Order with ID: ${id.value}';
}

void main() {
  final userId = UserId('u123');
  final orderId = OrderId('o456');

  print(getUserById(userId)); // Valid
  // print(getUserById(orderId)); // Compile-time error
}
```

하지만 Dart와 같은 Nominal type 시스템에서는 UserId와 OrderId가 명확하게 다른 타입이기 때문에 컴파일 에러가 납니다.

## Tagged Union types

Tagged union types 은 sum types, discriminated unions, 혹은 variant types 같은 이름으로도 불립니다.
이름에서 알 수 있듯이 tagged union type은 각각의 타입들이 다른 타입과는 구별되는 이름 혹은 식별자를 갖고 있기 때문에 더 안전하고 쉽게 사용할 수 있다는 장점이 있습니다.

## Untagged union types

Untagged union type은 타입간의 구별을 위한 명시적인 이름이나 식별자가 없는 타입입니다.
따라서 하나의 객체가 여러가지의 타입을 가질 수 있게되지만 타입간의 상속관계를 정의할 수 없기 때문에 runtime에서 타입을 식별할 수 없습니다.
즉 개발자가 runtime에서 타입을 식별하기 위한 코드를 직접 작성해주어야 합니다.

# Dart support for Union types

Dart는 typescript의 `|` 와 같이 Union type을 사용하기 위한 문법은 없긴하지만 Union type을 아예 배제하고 있진 않습니다.

Dart는 특정 상황에서 필요한 몇 가지 union type을 정의해놨습니다.

## `FutureOr<T>`

> A type representing values that are either Future of type T or T.
>
> This class declaration is a public stand-in for an internal future - or - value generic type, which is not a class type. References to this class are resolved to the internal type.
>
> It is a compile-time error for any class to extend, mix in or implement FutureOr.

`Future<T>` 혹은 `<T>` 타입입니다.

## Nullable types

`T` 혹은 `null` 타입입니다.

## Sealed class modifier - Tagged union types

**sealed modifier**

sealed modifier는 이산적(enumerable)이고 다른 타입과는 구별되는(known) **서브타입들의 집합**을 만들기 위해 사용됩니다.

sealed modifier로 정의된 클래스는 switch문과 함께 사용할 때 enum을 사용하는 것처럼 **exhaustive checking**을 보장해줍니다.

sealed class는 다음과 같은 성격을 갖습니다.

- 내부적으로 **abstract**이기 때문에 직접 instance화 하여 사용할 수 없습니다.
- factory constructor를 가질 수 있습니다.
- subclass들이 사용할 constructor를 정의할 수 있습니다.
- library외부에서 sealed class를 상속(extend 혹은 implement) 할 수 없습니다.

이처럼 sealed class는 library내부에서만 사용할 수 있기 때문에 compiler가 해당 클래스의 서브 클래스들을 모두 정확하게 파악할 수 있습니다.

따라서 compile 타임에서 switch를 통한 exhaustive checking 기능을 사용할 수 있는 것입니다.

## package - Either

> The library for error handling and railway oriented programming.
> This library supports async "map" and async "then" hiding the boilerplate of working with asynchronous computations Future[Either].

Source: https://pub.dev/packages/either_dart

## package - Extension type unions

> Support for union types in Dart has been requested at least [since 2012](https://github.com/dart-lang/language/issues/1222). This repository provides a basic level of support for union types in Dart.

Source: https://pub.dev/packages/extension_type_unions

# Refactoring example

```dart
/// BEFORE
/// images are of type List<dynamic>
class PreviousFormState extends State<PreviousForm> {
	List<dynamic>? images;

	...
	@override
	Widget build(BuildContext context) {
		return Form(
			child: ImageWidgetLayout(
				images: images as List<dynamic>,
			)
		)
	}
}


/// AFTER
/// To utilize the sealed class to represent union types,
/// define ImageType and let UrlImage and XFileImage inherit ImageType
/// so that the compiler can check if all the type is checked within switch syntax
import 'package:image_picker/image_picker.dart';

sealed class ImageType {}

final class UrlImage extends ImageType {
  UrlImage(this.value);
  final String value;
}

final class XFileImage extends ImageType {
  XFileImage(this.value);
  final XFile value;
}

```

```dart
/// BEFORE
///
class ImageWidgetLayout extends StatelessWidget {
	const ImageWidgetLayout({super.key, required this.images});
	final List<dynamic> images;
	...

	@override
	Widget build(BuildContext context) {
		return GridView.builder(
			gridDelegate: ...,
			itemCount: images.length,
			itemBuilder: (context, index) {
				if (images[index].runtimetype == String){
					return URLImageTile(url: images[index]);
				} else {
					return XFileImageTile(image: images[index]);
				}

			}
		);
	}
}

// AFTER
class ImageWidgetLayout extends StatelessWidget {
	const ImageWidgetLayout({super.key, required this.images});
	final List<ImageType> images;
	...

	@override
	Widget build(BuildContext context) {
		return GridView.builder(
			gridDelegate: ...,
			itemCount: images.length,
			itemBuilder: (context, index) {
				switch (images[index]) {
					case UrlImage(:final value):
						return UrlImageTile(url: value);
					case XFileImage(:final value):
						return XFileImageTile(image: value);
					case Null:
						throw UnimplementedError();
				}

			}
		);
	}
}
```

# Source

https://dcm.dev/blog/2024/12/10/demystifying-union-types-dart-tagged-untagged/

https://pub.dev/packages/either_dart

https://pub.dev/packages/extension_type_unions
