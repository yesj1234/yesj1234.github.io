---
title: Branches in Dart
author: jack
description: Dart에서 Branch(분기)로 코드의 흐름을 제어하는 방법에 대해 알아봅니다.
published: true
date: 2024. 09. 24.
tags: ['Dart']
---

# Branch란?

Branch는 다음과 같이 코드의 흐름이 조건에 따라 나누어 지는 것을 의미합니다.

![ControlFlowExample](/controlFlow.png)

(~~15년도 SKT T1은 월즈에 나온 모든 팀들에게 자연재해 그 자체였습니다. 대상혁..~~)

Dart에서는 크게 다음의 3가지 방식으로 Branch를 이용해 코드의 흐름을 제어합니다.

1. **If**
2. **If case**
3. **switch**

본 글에서는 If 와 If case에 대해서 알아보도록 하겠습니다.

switch는 [헷갈리는 용어들 정리(1)-statement & expression](https://yesj1234.github.io/posts/terminologies1)에 정리해두었으니 참고해주세요.

## If

If문은 condition으로 bool값으로 평가될 수 있는 expression이 올 수 있습니다.

```dart
// bool isFakerDominating() {...}

if (isFakerDominating()) {
    you.lose();
}
```

만약 여러 종류의 분기가 필요하다면 else 문을 이용해 여러 개의 분기점을 만들 수 있습니다.

```dart
if (isFakerDominating()) {
    you.lose();
} else if (isMarineDominating()) {
    you.lose();
} else if (isBangDominating()) {
    you.lose();
} else if (isBengiUsingHand()) {
    you.lose();
} else {
    you.win();
}
```

만약 분기가 하나뿐이라면 **conditional expression**을 사용해 더 간단하게 표현할 수도 있습니다.

conditional expression은 다음과 같이 표현할 수 있습니다.

`condition ? expression1 : expression2`

만약 condition이 true라면 expression1의 값이 evaluate되고 false라면 expression2의 값이 evaluate됩니다.

다른 언어에서는 흔히 삼항연산자(ternary operation)으로도 많이 부릅니다.

```dart
String yourTeam = isBengUsingHand() ? "Lose" : "Win";
```

## If case

If case 문은 pattern 문법과 함께 Dart 버전 3.0 이상부터 지원되는 문법입니다.

if case 문은 조건문에 pattern 을 이용한 **pattern matching**과 **destructuring**(구조 분해 할당)이 가능합니다.

만약 다음과 같이 특정 패턴을 파악해야 하는 경우가 있다고 가정해 봅시다.

```dart
bool isCartesian(pair) {...} // additional coding for pattern matching
bool isPolar(pair) {...}

var anonymousPair = [1, 2];

if (isCartesian(anonymousPair)) {
    print("pair is cartesian");
    print("${anonymousPair[0]} ${anonymousPair[0]}");
} else if (isPolar(anonymousPair)) {
    print("pair is polar");
    print("${anonymousPair[0]} ${anonymousPair[0]}");
} else {
    // Not implemented.
}
```

if case 문을 이용하면 다음과 같이 바꿀 수 있습니다.

```dart
var anonymousPair = [1, 2];

if (anonymousPair case [int x, int y]) { // pattern matching and destructuring.
    print("pair is cartesian");
    print('$x $y');
} else {
    print("pair is polar");
    print('$x $y');
}
```

if case문은 위처럼 1가지 케이스에 대해 pattern matching하는 경우 유용한 문법입니다.

여러 개의 case에 대해 분기를 위해서는 switch문을 이용하는 것이 적절합니다.
