---
title: Record type in Dart
description: Record type에 대해 알아봅니다.
author: jack
date: 2024.09. 23.
published: true
tags: [Dart]
---

# Record란?

Record는 Dart 3.0 이상의 버전에서 사용할 수 있는 type입니다.

Record는 다음과 같은 특징을 갖습니다.

- **anonymous**: anonymous function (혹은 lambda function) 처럼 이름이 없는 익명으로 사용됩니다.
- **immutable**: 불변 타입입니다. 따라서 setter가 없고 타입이 고정됩니다(**fixed-type**).
- **aggregate**: 하나의 record 안에 여러 개의 data type을 담을 수 있습니다. 이 성질을 **heterogeneous** 하다고도 표현합니다.

---

## syntax

**Record expression**(표현식)은 소괄호()를 이용해 선언하며 comma 를 이용해 각 필드를 구분합니다.

```dart
// anonymous, immutable, aggregate 한 특징을 갖는다는 것을 상기해봅시다.
var record = ('first', name: 'jack', age: 30, 'last');
```

**Record type annotation** 은 표현식과 마찬가지로 소괄호와 comma를 사용해 함수의 return type이나 parameter type을 정해줄 수 있습니다.

```dart
(int, int) swap((int, int) record) {
	var (a, b) = record; // destructuring using record pattern.
	return (b, a);
}
```

Record type annotation 사용시 함수를 선언할 때 처럼 named field를 사용할 수 있습니다.

```dart
({int a, int b}) recordAB;

recordAB = (1, 2);
```

위처럼 선언된 record의 **type**은 named field들의 name에도 영향을 받습니다.

```dart
({int x, int y}) recordXY;
recordXY = (3, 4);

// recordAB = recordXY // compile error
```

recordAB와 recordXY는 서로 다른 이름의 name field를 갖기 때문에 서로 다른 타입으로 취급되고 recordAB에 recordXY를 할당하려 하면 컴파일 에러가 납니다.

반면 위와 같은 상황에서 named field가 아닌 positional field를 사용하면 정상적으로 작동합니다.

```dart
(int a, int b) recordAB = (1, 2);
(int x, int y) recordXY = (3, 4) ;

recordAB = recordXY; // recordAB and recordXY is considred the same type.
```

> **Question** : Record는 immutable 하다고 하지 않았었나요? `recordAB = recordXY` 부분은 뭔가요?
>
> **Answer**: immutable 하다라는 것은 recordAB의 개별값을 직접 바꿀 수 없다는 것입니다. 위처럼 같은 타입의 새로운 record를 할당하는 것은 가능합니다.
>
> `recordAB.$1 = 3 // Error`
>
> `recordAB.a = 3 // Error`

## Record 값 접근

Record는 2가지 방식으로 값에 접근이 가능합니다.

- **positional field access**
- **named field access**

```dart
var record = ('first', name: 'jack', age: 30, 'last');

// positional access through $
print(record.$1); // Prints 'first'
print(record.$2); // Prints 'last'

// named access through field names
print(record.name); // Prints 'jack'
print(record.age); // Prints 30
```

# Record는 언제 쓰면 좋을까?

Dart에서 Record를 사용하는 가장 대표적인 경우는 Multiple return입니다.

보통은 함수가 하나의 반환값을 갖지만 여러 개의 값을 반환하는 함수가 유용한 경우가 있습니다.

예를 들어 json에서 값을 추출하여 가공하는 경우를 생각해 보겠습니다.

```dart
// fetch json that has name and age as its field.
Future<Map<String, dynamic>> fetchData() => {
	// fetch the json data
	...
	return json;
}

var jsonData = fetchData();
var name = jsonData['name'];
var age = jsonData['age'];

// Do something with the name and age.
```

name 과 age를 json으로 받아 가공하는 함수입니다.

만약 fetchData 함수가 json을 반환하는게 아니라 바로 name과 age를 반환하게 하면 어떨까요?

```dart
Future<(String, int)> fetchData() => {
	// fetch the json data
	...
	return (json['name'] as String, json['age'] as int);
}
final (name, age) = fetchData();
```

코드가 좀 더 간결해지고 type safety를 보장해주는 효과가 있습니다.

Record가 아닌 List나 Set같은 type들로도 multiple return을 구현할 수 있지만 type safety를 보장해주지 않습니다.
