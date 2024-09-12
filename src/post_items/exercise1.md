---
title: Practice Dart - exercises for beginners (1)
description: Exercises to practice Dart.
author: jack
published: true
date: 2024. 09. 04.
tags: ['Dart']
---

# Exercise1

**Source**: https://hackmd.io/@kuzmapetrovich/S1x90jWGP#Practice-Dart---exercises-for-beginners

**Description**: Create a program that asks the user to enter their name and their age. Print out a message that tells how many years they have to be 100 years old.

사용자로부터 이름과 나이를 입력받고 100살이 되기까지 남은 기간을 알려주는 프로그램을 작성해보는 문제입니다.

문제는 크게 2가지를 요구하고 있습니다.

1. 사용자로부터 입력을 받을 것.
2. 받은 입력을 이용해 알맞은 문구를 출력할 것.

콘솔에 입출력 하는 방법을 연습하는 문제라고 볼 수 있을 것 같습니다.

[dart:io 공식 문서](https://dart.dev/libraries/dart-io)를 보면 동기(synchronous) 방식의 메서드는 프로그램의 흐름을 방해할 가능성이 크기 때문에 비동기적으로 Future 혹은 Stream object로 결과를 받는 것을 권장하고 있고 또 이에 관한 API들에 대해서만 설명하고 있습니다.

1번 문제에서는 단순하게 이름이나 나이같은 간단한 입력만을 받지만 경우에 따라서는 용량이 큰 파일을 받을 수도 있고 실시간으로 스트리밍 하는 상황도 있을 수 있기 때문에 만약 동기적인 메서드를 사용하게 되면 해당 파일을 다 받을 때까지 아무것도 할 수 없는 경우가 생길 수도 있을 것 같습니다.

지금 사용하고자 하는 동기적인 방식의 stdin.readLineSync 나 stdout.write 과 같은 메서드는 따로 정리가 되어 있습니다. 또 동기적인 메서드들은 이름에 명확하게 sync가 포함되어 있습니다.

readLineSync 메서드에 관한 설명부터 살펴보고 가도록 합시다.

## **stdin.readLineSync**

```dart
String? readLineSync(
    {
        Encoding encoding = systemEncoding,
        bool retainNewLines = false,
    }
)
```

> Reads a line from stdin.
>
> Blocks until a full line is available.
>
> Lines may be terminated by either `<CR><LF>` or `<LF>` ...
>
> Input bytes are converted to a string by encoding.

readLineSync 메서드는 String 혹은 null을 반환하는 함수임을 알 수 있습니다.

stdin은 [stdin class](https://api.dart.dev/stable/3.5.2/dart-io/Stdin-class.html)를 의미하는 것 같고(?) 메서드에 포함된 sync에서 알 수 있듯이 동기적으로 작동하여 값을 받기 전까지 프로세스를 blocking 하는 것 같습니다.

CR(Carrige Return), LF(Line Feed) 즉 한 줄이 끝남을 의미하는 입력이 들어오면(엔터라고 이해하면 될 것 같습니다) 해당 줄을 String 으로 반환한다고 보면 될 것 같습니다.

## **stdout.write**

```dart
void write(Object? object)
```

> Converts objects to a string by invoking Object.toString and adds the encoding of the result to the target consumer.
>
> This operation is non-blocking.

write 메서드는 [stdout](https://api.dart.dev/stable/3.5.2/dart-io/Stdout-class.html) class에 포함된 메서드입니다. object 를 String으로 변환한 결과를 encoding하여 target consumer에 넣는다고 합니다.

지금 사용하고자 하는 방식에 대입해서 생각해보면 터미널에 우리가 넣고자 하는 문구를 표시해준다고 볼 수 있겠습니다.

stdout.write 과 stdin.readLineSync를 적절히 조합하여 코드를 완성해보도록 합시다.

## **main code**

```dart
import 'dart:io';

void main() {
	stdout.write("What's your name? ");
	String name = stdin.readLineSync();
	stdout.write("Hi, $name! what is your age?");
	int age = stdin.readLineSync();
	if (age != null) {
		try {
			int iage = int.parse(age);
			if (iage >= 100) {
				print("$name. You have lived too long.");
				return;
			} else if (iage < 0) {
				print("age can not be negative");
				return;
			} else {
				print("$name, You have ${100-iage} years left to be 100.");
			}
			} on FormatException {
			print("FormatException.");
		}
	}
}
```

stdout.write 은 print 와는 다르게 줄바꿈을 포함하지 않습니다. 따라서 입력을 받을 때 좀 더 자연스럽게 보일 수 있을 것 같습니다.

사용자로부터 받은 입력은 String 혹은 null입니다. 따라서 int로 type을 바꾸어 주어야 계산에 사용할 수 있습니다.

변환시에 인자로 알맞은 포맷의 값이 들어오지 않을 경우 FormatException이 발생합니다.

입력받은 숫자의 범위에 맞게 적절한 문구를 출력합니다.

예전 버전의 dart에서는 타입 변환을 간단하게 다음과 같이 사용했던 것 같습니다.

```dart
int age = int.parse(stdin.readLineSync());
```

현재 제가 사용하고 있는 3.5.1 버전에서는 위처럼 쓸 경우 다음과 같은 에러를 냅니다.

The argument type 'String?' can't be assigned to the parameter type 'String'

stdin.readLineSync 의 반환값이 String? 인 반면 int.parse는 인자로 String을 받기 때문입니다.
