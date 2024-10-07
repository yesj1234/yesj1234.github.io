---
title: Flutter UI Challenge(2)
description: Learn how to use StatefulWidgets and animate the changes of Widget. Widgets related to animations are Animation, AnimationController, Tween, AnimatedWidget and etc..
author: jack
date: 2024. 10. 07.
published: true
tags: [Flutter]
---

# Cloning Radial Countdown Timer

![timer](/timer.png)

2번째로 구현해볼 것은 위와 같은 디자인의 카운트 다운 타이머입니다.

Restart버튼을 누르면 10초에서 0초까지 카운트다운이 시작되며 숫자를 감싸고 있는 원의 배경색이 시간에 맞춰 반시계 방향으로 변하는 애니메이션을 추가해주면 됩니다.

구현에 앞서 다음의 Widget들에 대해 간단히 알아보도록 하겠습니다.

- **StatefulWidget**
- **CustomPaint** and **CustomPainter**
- **Animation**
- **AnimationController**
- **Tween**
- **AnimatedWidget**
- **Timer**
- **Ticker**

# Prerequisites

## StatefulWidget(abstract)

> A widget that has **mutable** state.
> State is information that
>
> (1) **can be read synchronously when the widget is built** and
>
> (2) **might change during the lifetime of the widget**.
>
> It is the responsibility of the widget implementer to ensure the State is
> Promptly notified when such state changes, using **State.setState**.
>
> ...
>
> Stateful widgets are useful when the part of the user interface you are describing
> can change dynamically, e.g. due to having an **internal clock-driven state**,
> or **depending on some system state**.

- StatelessWidget과는 달리 값이 변할 수 있는 **state**를 저장
- **state**라 함은 (1) Widget 생성과 동시에 읽을 수 있는 값
- 혹은 (2)Widget의 생애주기 상에서 변할 수 있는 값
- 이 **state**가 언제 변할지는 개발자가 **setState**를 이용해 명시적으로 알려줘야함

**How to use StatefulWidget Example**

```dart
class Counter extends StatefulWidget {
    const Counter({super.key});

    // Must override createState method.
    @override
    State<Counter> createState() => _CounterState();
}

class _CounterState extends State<Counter> {
    // state to change over lifecycle of the widget.
    // in this case we are changing the count using Timer.periodic
    int _count = 0;
    Timer? _timer;
    @override
    void initState() {
        super.initState();
        _timer = Timer.periodic(duration: const Duration(seconds: 1), (timer) {
            // Explicitly calling State.setState method to let the widget know
            // the state has changed and mark the widget dirty.
            setState(() {
                _count += 1;
            });
        });
    }
    @override
    void dispose() {
        _timer?.cancle();
        super.dispose();
    }

    //Must override build method.
    @override
    Widget build(BuildContext context) {
        return SizedBox(
            width: 300,
            height: 300,
            child: Center(
                child: Text('$_count'),
            ),
        );
    }
}
```

## CustomPaint

> A widget that provides a **canvas** on which to draw during the **paint phase**.
>
> When asked to paint, CustomPaint first asks its painter to paint on the current canvas,then, it paints its child, and then, after painting its child, it asks its foregroundPainter to paint.
>
> The **coordinate system of the canvas** matches the **coordinate system of the CustomPaint object**.
> The painters are **expected to paint within a rectangle** starting at the origin and encompassing a region of the given size.(If the painters paint outside those bounds, there might be insufficient memory allocated to rasterize the painting commands and resulting behavior is undefined.)
>
> To enforce painting within those **bounds**, consider wrapping this CustomPaint with a **ClipRect** widget.

## CustomPainter

## Animation

## AnimationController

## Tween

## AnimatedWidget

## Timer

## Ticker

# Code

# 개선점

# Sources

- [StatefulWidget](https://api.flutter.dev/flutter/widgets/StatefulWidget-class.html)

- [CustomPaint](https://api.flutter.dev/flutter/widgets/CustomPaint-class.html)

- [CustomPainter](https://api.flutter.dev/flutter/rendering/CustomPainter-class.html)

- [Animation in Flutter.dev](https://docs.flutter.dev/ui/animations)

- [Timer](https://api.flutter.dev/flutter/dart-async/Timer-class.html)

- [Ticker](https://api.flutter.dev/flutter/scheduler/Ticker-class.html)
