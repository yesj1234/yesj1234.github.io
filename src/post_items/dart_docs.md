---
title: Effective Dart
description: How to document my code.
author: jack
published: true
date: 2025. 02. 17.
tags: ['Dart']
---

해당 포스트는 [effective-dart](https://dart.dev/effective-dart/documentation)의 일부를 번역한 글입니다.

# Comment

우리는 종종 코드를 작성할 때 작성한 코드가 얼마나 우리의 머리 속에만 있는 문맥에 의존하는지 잊습니다.

동료 개발자나 내 프로젝트에 기여하고 싶은 새로운 개발자가 우리의 코드를 처음 봤을 때, 심지어는 프로젝트를 완성해 놓고 1년 동안 돌아보지 않은 1년 후의 본인이 코드를 봤을 때, 어떤 문맥 상에서 코드가 작성 되었는지 알 수 없을 것입니다.

코드에 대한 간결하고 정확한 주석은 작성하는데 몇 분 걸리지 않지만, 그런 주석을 읽는 사람들에게는 몇 시간을 아껴 줄 수 있는 강력한 도구가 될 수 있습니다.

개발자들에게 코드란 모름지기 "주석이 필요 없는", "코드 자체가 곧 자기 자신을 설명하는" 코드가 좋은 코드란 것을 알고 있고 주석은 적을수록 좋다는 것을 알고 있습니다.

하지만 현실은 꼭 필요한 주석 또한 적지 않고 넘어가고 있는 경우가 다반사입니다.

주석은 마치 운동과도 같습니다.
이론적으로 주석을 과하게 쓰는 것이 가능하긴 하지만, 현실적으로는 너무 적게 쓰고 있는 것이죠.

## DO format comments like sentence

```dart
// Not if anything comes before it.
if (_chunks.isNotEmpty) return false;
```

- 문장의 시작은 대문자로 합니다. (소문자로 해야 될 특별한 이유가 있는 경우를 제외하고)
- 문장은 마침표 혹은 물음표 혹은 느낌표로 끝냅니다.
  위 규칙은 모든 주석에 doc comments, inline comments, TODOs 등 모든 종류의 주석에 해당합니다.

## DON'T use block comments for documents

**GOOD**

```dart
void greet(String name) {
	// Assume we have a valid name.
	print('Hi, $name');
}
```

**BAD**

```dart
void greet(String name) {
	/* Assume we have a valid name.*/
	print('Hi, $name!');
}
```

Block comment는 임시로 코드 블럭을 주석처리하기 위한 주석입니다.
doc comment에는 `//` 주석을 사용하도록 합시다.

## Doc comments

Doc comments are especially handy becuase `dart doc` parses them and generates beautiful doc pages from them.

A doc comment is any comment that appears before a declaration and uses the special `///` syntax that `dart doc` looks for.

Doc comment는 `dart doc` 명령어를 실행 했을 때 그 진가를 볼 수 있습니다.

잘 작성된 doc comment는 [이런 아름다운 문서](https://api.dart.dev/)를 자동으로 만들어줍니다.

Doc comment란 코드의 선언부 이전에 `///` 문법으로 작성된 부분을 의미합니다.

## Do use `///` doc comments to document members and types

Lint rule: slash_for_doc_comments

Using a doc comment instead of a regular comment enables `dart doc` to find it and generate documentation for it.

**GOOD**

```dart
/// The number of characters in this chunk when unsplit.
int get length => ...
```

**BAD**

```dart
// The number of characters in this chunk when unsplit.
int get length => ...
```

역사적인 이유에서 `dart doc` 은 2가지 종류의 doc comment 문법을 지원합니다.

- `/** ... */` : JavaDoc 스타일
- `///`
  Dart는 후자를 더 선호하며 이유는 다음과 같습니다.
- 훨씬 간결합니다.
- `/** ... */` 은 내용과 상관없는 라인이 2개 생깁니다.
- 특수한 상황 (예를 들어 `*` 기호를 사용하는 bulleted list가 포함될 경우)에서 `///` 가 훨씬 읽기 편합니다.

## PREFER writing doc comments for public APIs

Linter rule: public_member_api_docs

모든 library, 변수, 멤버, 등을 모두 문서화 해야할 필요는 없지만 하는 것이 좋습니다.

## CONSIDER writing a library-level doc comment

Java 처럼 class를 유일한 프로그램의 생성단위로 사용하는 언어와는 달리, Dart는 library 자체가 유저가 직접적으로 작업하고 사용하며 개념적으로 고려하는 하나의 독립적입 개체입니다.
따라서 `library`는 개발자에게 중요 컨셉과 제공하는 주요 함수들에 대해 소개하는 좋은 출발점입니다.
다음과 같은 내용이 포함될 수 있습니다.

- 해당 라이브러리에 대해 소개하는 간략한 소개글
- 라이브러리에서 사용되는 용어에 대한 설명
- API의 사용 코드
- 빈번하게 사용되는 class 혹은 function 들에 대한 link
  library 문서화를 시작하려면 다음과 같이`library` 지시어 이전에 `///` 로 시작하면 됩니다.

**GOOD**

```dart
/// A really great test library.
@TestOn('browser')
library;
```

## CONSIDER writing doc comments doc comment for private APIs

## Do start doc comments with a single-sentence summary

문서의 시작은 유저 중심으로 작성한 간결한 문장으로 시작해야 합니다.

일반적으로 한 문장 이면 충분합니다.

유저가 문서를 더 읽을지 아니면 다른 문서를 봐야 할지를 판단할 정도의 정보면 충분합니다.

**GOOD**

```dart
/// Deletes the file at [path] from the file system.
void delete(String path) {...}
```

**BAD**

```dart
/// Depending on the state of the file system and the user's permissions,
/// certain operations may or may not be possible. If there is not  /// file at [path] or it can't be accessed, this function throws either [IOError] or [PermissionError], respectively. Otherwise, this deletes the file.
void delete(String path) {...}
```

## DO separate the first sentence of a doc comment into its own paragraph

첫 문장과 문단의 나머지 부분을 분리하도록 합시다. 이는 요약문이 두 줄 이상 필요한 경우에도 마찬가지입니다.

**GOOD**

```dart
/// Deletes the file at [path].
///
/// Throws an [IOError] if the file could not be found.
/// Throws a [PermissionError] if the file is present but could not be
/// deleted.
void delete(String path) {...}
```

**BAD**

```dart
/// Deletes the file at [path].
/// Throws an [IOError] if the file could not be found.
/// Throws a [PermissionError] if the file is present but could not be
/// deleted.
void delete(String path) {...}
```

## AVOID redundancy with the surrounding context

클래스 이름이나 상속하고 있는 인터페이스 등 이미 알고 있는 정보를 반복하여 쓸 필요는 없습니다.

뻔한 정보 말고 유저가 알아야할 꼭 필요한 정보를 써주도록 합시다.

만약 이미 유저가 알고 있을법한 뻔한 정보 외에 더 코멘트할 내용이 없다면 생략하도록 합시다.

쓸데 없이 이미 알고 있는 정보를 나열하여 독자의 시간을 뺏는 것 보단 낫습니다.

**GOOD**

```dart
class RadioButtonWidget extends Widget {
	/// Sets the tooltip to [lines], which should have been word wrapped the current font.
	void tooltip(List<String> lines) {...}
}
```

**BAD**

```dart
class RadioButtonWidget extends Widget {
	/// Sets the tooltip for this radio button widget to the list of strings in [line].
	void tooltip(List<String> lines) {...}
}
```

## PREFER starting function or method comments with third-person verbs

코드가 _무엇을_ 하는지에 집중하여 문서를 작성해주도록 합시다.

**GOOD**

```dart
/// Returns `true` if every element satisfies the [predicate].
bool all(bool predicate(T element)) => ...

/// Starts the stopwatch if not already running.
void start() {...}
```

## PREFER starting a non-boolean variable or property comment with a noun phrase

property가 _어떤것_ 인지에 대해 명확히 알려줄 필요가 있습니다.

getter처럼 어떤 계산값을 리턴하는 경우에도 마찬가지입니다. 실제 사용하는 입장에선 계산을 어떻게 하는지 보다 무엇인지가 더 중요합니다.

이를 위해서 명사구(noun phrase)로 문장을 시작하도록 합시다.

**GOOD**

```dart
/// The current day of the week, where `0` is Sunday.
int weekday;

/// The number of checked buttons on the page.
int get checkedCount => ...
```

## PREFER starting a boolean variable or property comment "Whether" followed by a noun or gerund phrase

**GOOD**

```dart
/// Whether the modal is currently displayed to the user.
bool isVisible;

/// Whether the modal should confirm the user's intent
```

## DON'T write documentation for both the getter and setter of a property

## PREFER starting library or type comments with noun phrase

## CONSIDER including code samples in doc comments

## DO use square brackets in doc comments to refer to in-scope identifiers

Linter rule: comment_references

## DO use prose to explain parameters, return values, and exceptions.

## DO put doc comments before metadata annotations

## Markdown

Markdown 문법이 사용 가능합니다.
사용 가능한 것들의 예시

- bold
- italics
- Unordered lists
- Numbered lists
- Code blocks
- Links
- Header
- SubHeader
- SubSubHeader

## AVOID using markdown excessively

Markdown 문법을 남용하는 것은 주의하도록 합시다.

## AVOID using HTML for formatting

tables과 같은 특수한 상황을 제외하고는 HTML을 사용을 자제하도록 합시다.

## PREFER backticks fences for code blocks

code block을 쓰기 위해서는4 indent 말고 backtick(\`)을 사용하도록 합시다.

**GOOD**

````dart
/// You can use [CodeBlockExample] like this:
///
/// ```dart
/// var example = CodeBlockExample();
/// print(example.isItGreat); // "Yes."
/// ```
````

**BAD**

```dart
/// You can use [CodeBlockExmample] like this:
///
///.   var example = CodeBlockExample();
///.   print(example.isItGreat); // "Yes."
///
```

## PREFER brevity

문서는 항상 명확하고 간결하게 작성하도록 합시다

## AVOID abbreviations and acronyms unless they are obvious

축약어는 최대한 자제하도록 합시다.

## PREFER using "this" instead of "the" to refer to a member's instance

class member에 대한 문서를 작성할 때는 "this"처럼 해당 클래스를 지칭하는 단어를 써주도록 합시다.

```dart
class Box {
	/// The value this wraps.
	Object? _value;

	/// True if this box contains a value.
	bool get hasValue => _value != null;
}
```

# Sources

- https://dart.dev/effective-dart/documentation
