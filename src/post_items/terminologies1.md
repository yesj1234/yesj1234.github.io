---
title: 헷갈리는 용어들 정리(1) - statement & expression
description: Dart의 switch 공식문서를 살펴보며 statement와 expression의 정의와 차이점에 대해 알아봅니다.
author: jack
published: true
date: 2024. 09. 12.
tags: ['Dart']
---

# Expression and Statement

> **Expressions** are **_evaluated_** and thus can be reduced to a single value
>
> **Statements** are **_executed_**. Statements are basic building blocks of a program.

위의 두 문장은 간결하게 expression과 statement의 차이를 표현합니다.

다음과 같이 도식화하여 기억하면 좋을 것 같습니다.

**Expression** - **evaluated**

**Statement** - **executed**

Dart의 공식문서에서 위의 용어를 사용하는 예시를 살펴보겠습니다.

# Example in Dart

## Switch statements

> A switch statement **evaluates** a **value expression** against a series of cases. Each case clause is a pattern for the value to match against.
>
> You can use any kind of pattern for a case.
>
> When the value matches a case's pattern, the **case body** **executes**. Non-empty case clauses jump to the end of the switch after completion.
>
> They do not require a break statement. Other valid ways to end a non-empty case clause are a continue, throw, or return statement.
>
> Use a 'default' of wildcard \_ to execute code when no case clause matches.

Switch 구문에 대해서 설명하는 글입니다.

statement와 expression을 명확하게 구분하여 사용하고 있는것을 볼 수 있습니다.

statement(위의 경우 case body)는 execute(실행)되며 expression(위의 경우 a value)은 evaluate 되는것으로 명확하게 구분짓습니다.

예제를 보며 어떤 부분이 statement이고 어떤 부분이 expression이 되는지를 확인해 보겠습니다.

```dart
// 이 문장을 하나의 statement라고 볼 수 있습니다. command 라는 식별자에 'OPEN' 을 할당하라는 명령을 수행합니다.
//한편 'OPEN'은 'OPEN'이라는 값 자체로 evaluated 되었다고 생각하면 expression이라고 볼 수 있습니다.
var command = 'OPEN'; //
// switch statement입니다. switch statement 안에서는 command가 각 case 와의 비교를 통해 어떤 함수가 실행될지를 정하게 됩니다.
// 각각의 case들('CLOSED', 'PENDING', 'APPROVED', 'DENIED', 'OPEN')은
// command와 마찬가지로 expression으로 볼 수 있습니다.
// command가 case 일 경우 실행되는 각각의 함수들(executeClosed, executePending, executeApproved,
// executeDenied, executeOpen, executeUnknown)은
// statement로 볼 수 있습니다.
switch (command) {
	case 'CLOSED': // 'CLOSED' is a expression
		executeClosed(); // statement
	case 'PENDING': // 'PENDING' is a expression
		executePending(); // statement
	case 'APPROVED': // 'APPROVED' is a expression
		executeApproved(); // statement
	case 'DENIED': // 'DENIED' is a expression
		executeDenied(); // statement
	case 'OPEN': // 'OPEN' is a expression
		executeOpen(); // statement
	default:
		executeUnknown(); // statement
}
```

## Switch expression

Dart에서는 Switch를 statement뿐만 아니라 expression으로도 사용이 가능합니다.

switch control flow 를 사용하여 가독성 있게 코드를 짤 수 있습니다.

공식 문서의 설명부터 살펴보겠습니다.

> A switch **expression** **produces a value** based on the expression body of whichever case matches.
>
> You can use a switch expression wherever Dart allows expressions, except at the start of an expression statement[^1].

> The syntax of a switch expression differs from switch statement syntax.
>
> 1. Cases do not start with the case keyword.
> 2. A case body is a single expression instead of a series of statements
> 3. Each case must have a body; there is no implicit fallthrough for empty cases.
> 4. Case patterns are separated from their bodies using => instead of :
> 5. Cases are separated by , (and an optional trailing , is allowed)
> 6. Default cases can only use _ , instead of allowing both default and _ .

switch statement와 문법적인 차이와 기능적인 차이가 몇 가지 있습니다.

**문법적인 차이**

1. 각각의 case 구분 시 case 키워드를 사용하지 않습니다.
2. 각 case의 실행문 부분에 하나의 statement만 들어갈 수 있습니다.
3. : 대신 => 을 사용합니다.
4. 각각의 케이스들을 comma(,) 을 이용해 구분합니다.
5. switch statement의 경우 default, wildcard 를 둘 다 사용할 수 있지만 expression으로 사용 할 경우 wildcard만 사용할 수 있습니다.

**기능적인 차이**

1. switch statement의 경우 case에 body가 없는 것이 허용됩니다. fallthrough 즉 다음케이스로 flow가 자연스럽게 넘어갑니다. 하지만 switch expression으로 사용할 경우 이 기능이 제한됩니다.

Dart에서 switch expression은 expression이 들어갈 수 있는 자리라면 어디든 들어갈 수 있지만 예외적으로 expression statement의 시작부분에는 사용하지 않습니다.

expression statement의 시작부분에 switch문을 사용하고자 한다면 expression이 아니라 statement를 사용하는 것이 훨씬 자연스럽습니다.

switch expression의 사용 예제를 보겠습니다.

```dart
// token 변수에 switch statement를 사용해 값을 할당하는 코드입니다.
// 각 case의 body들이 하나의 statement만으로 이루어져있으며 fallthorough 기능을 활용하고 있지 않습니다.
// 각 case의 body들의 statement 부분에 코드가 중복되어 작성되어 있습니다. (token = ...)
// state expression 을 이용해 좀 더 가독성 있는 코드로 바꿀 수 있을 것 같습니다.
switch (charCode) {
	case slash || star || plus || minus: // Logical-or pattern
		token = operator(charCode);
	case comma || semicolon: // Logical-or pattern
		token = punctuation(charCode);
	case >= digit0 && <= digit9: // Relational and logical-and patterns
		token = number();
	default:
		throw FormatException('Invalid format');
}
```

```dart
// 각 case들이 comma(,)로 구분되며 각 case의 body에서 실행되는 statement들을 한눈에 볼 수 있습니다.
// 하나의 값으로 evaluate되어 token에 값을 할당해줍니다.
token = switch (charCode) {
	slash || star || plus || minus => operator(charCode),
	comma || semicolon => punctuation(charCode),
	>= digit0 && <= digit9 => number(),
	_ => throw FormatException('Invalid format');
};
```

[1]: An expression statement is an expression used in a place where a statement is expected. The expression is evaluated and its result is discarded. Therefore it only makes sense only for expressions that make side effects, such as executing a function or updating a variable.[: information_source:](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/Expression_statement)
