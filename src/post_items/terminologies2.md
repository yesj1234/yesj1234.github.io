---
title: 헷갈리는 용어들 정리(2) - parameter & argument
description: Dart의 Function에 대해 알아보며 parameter 와 argument 의 정확한 의미에 대해 알아봅니다.
author: jack
published: true
date: 2024. 09. 21.
tags: ['Dart']
---

# Parameters and arguments

문서를 읽다 보면 parameter와 argument가 종종 등장합니다.

평소에 저는 둘 다 인자 혹은 인수 정도로만 이해하고 넘어갔습니다만,

언제 parameter를 쓰고 언제 argument를 쓰는지 정확히 이해하지 않고 문서를 읽으니 문서가 100프로 이해되지 않는 찜찜한 경우가 여러 번 있었습니다.

---

**parameter**는 한국어로 **매개변수**로 번역할 수 있습니다.

**argument**는 **인수**로 번역할 수 있습니다.

보통은 함수의 **선언부**에서 **parameter**(매개변수) 용어를 사용하고

그 함수를 **사용할 때**는 **argument**(인수) 용어를 사용합니다.

예를 들어 int를 String으로 바꿔주는 함수가 있다고 해봅시다.

```dart
String intToString(int i) {
    return '$i';
}
```

**(int i)** 부분이 intToString함수의 **parameter**입니다.

```dart
var a = intToString(3);
print(a) // '3'
```

intToString 함수를 사용할 때 **3이라는 값**을 매개변수 i 자리에 넣어줬습니다. 이 3이 **argument**입니다.

**parameter**는 함수의 선언 시에 사용되는 **형식적**인 용어이고

**argument**는 함수를 사용 시에 사용되는 **실제적**인 용어입니다(실제로 값을 갖는).

Dart에서는 parameter를 다음의 3가지로 구분하여 사용할 수 있습니다.

1. **required positional parameter**
2. **named parameter**
3. **optional positional parameter**

---

## Required positional parameters

Required positional parameter는 위의 intToString함수와 같이 소괄호() 안에 파라미터명을 넣어서 사용하면 됩니다.

type을 명시해주는게 권장 사항이긴 하지만 명시하지 않아도 에러는 아닙니다.

```dart
// required positional parameter with type
String intToString(int i) {
    return '$i'
}
// required positional parameter without type
String intToString(i) {
    return '$i'
}
```

함수 선언 시에 가독성을 위한 한 가지 팁을 드리자면 위와 같이 한줄로 간단한게 return 할 수 있는 경우에는 arrow expression (=>) 을 사용하여 간단하게 줄일 수 있습니다.

```dart
String intToString(i) => '$i'; // don't forget the semicolon^^
```

---

## Named parameters

intToString처럼 매개변수가 1개 혹은 2개 정도만 필요한 간단한 함수라면 required positional parameter를 사용해도 전혀 문제가 되지 않습니다.

하지만 매개변수가 3개 이상이 필요한 경우라면 어떨까요?

아마 각 자리의 매개변수가 어떤 역할을 하는지 알기 쉽지 않을 것입니다.

이처럼 함수가 복잡해지고 매개변수가 어떤 역할을 하는지 알아야 할 때 named parameter를 활용할 수 있습니다.

```dart
void roomControl({bool? enableMainLight, bool? enableSubLight, bool? enableAirConditioner}) {...}

roomControl(enableMainLight: true, enableSubLight: true, enableAirConditioner: true);
```

named parameter는 required라고 명시해주거나 기본값을 할당해주지 않는 이상 기본적으로 optional입니다.

optional일 경우에는 기본값이 null값이기 때문에 꼭 nullable로 설정해주어야합니다.

```dart
// Setting default values
void roomControl({bool enableMainLight = false, bool enableSubLight = false, bool enableAirConditioner = false}) {...}

// Setting required with default values
void roomControl({required bool enableMainLight = false, required bool enableSubLight = false, required bool enableAirConditioner = false}) {...}

roomControl(); // No error^^
```

---

## Optional positional parameters

positional parameter를 optional하게 사용하고 싶은 경우가 있을 수 있습니다.

어떤 parameter는 함수 호출 시 값이 있을 수도 있고 없을 수도 있는 경우가 그렇습니다.

**대괄호[ ]**를 이용해 parameter를 감싸주면 해당 parameter들은 positional optional parameter가 됩니다.

named parameter와 마찬가지로 기본값을 할당하지 않으면 null이 기본값이기 때문에 nullable로 설정해주어야 합니다.

```dart
String makeSandwich(bool bread, [bool jam=false, bool meat=false]) {
  if (bread) {
    String mySandwich = 'Bread +';
    jam ? mySandwich += 'jam +' : null;
    meat ? mySandwich += 'meat +' : null;
    return mySandwich += 'Bread';
  }
  return "You can't make sandwich without a bread!";
}
```

샌드위치를 만드는데 빵은 있어도 잼이나 고기는 없을 수도 있죠.

---

위의 세가지 종류의 parameter는 다음과 같이 혼합하여 사용할 수 있습니다.

- required positional parameter & optional positional parameter
- required positional parameter & named parameter

```dart
void stringConcatenater(String a, [String? b, String? c]) {
    String newString = '$a';
    b ? newString += b : null;
    c ? newString += c : null;
    return newString;
}
```

하지만 optional positional parameter와 named parameter를 동시에 사용할 순 없습니다.

Flutter에서는 대부분 named parameter를 사용합니다.
