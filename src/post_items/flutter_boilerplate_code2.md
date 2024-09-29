---
title: new Flutter project의 main.dart 코드 파헤쳐보기(2)
description: IDE를 이용해 만든 flutter project의 초기 main.dart 코드들을 보면서 StatelessWidget, StatefulWidget, key에 대해 알아봅니다.
author: jack
date: 2024.09. 29.
published: true
tags: [Dart, Flutter]
---

Continuing on Widget

```dart
abstract class Widget extends DiagnosticableTree {
	const Widget({this.key}); // Initializes key for subclasses.

	final Key? key;

	@protected
	@factory
	Element createElement();


	@override
	String toStringShort() {
		final String type = objectRuntimeType(this, 'Widget');
		return key == null ? type: '$type-$key';
	}

	@override
	void debugFillProperties(DiagnosticPropertiesBuilder properties) {
		super.debugFillProperties(properties);
		properties.defaultDiagnosticsTreeStyle = DiagnosticsTreeStyle.dense;
	}

	@override
	@nonVirtual
	bool operator ==(Object other) => super == other;

	@override
	@nonVirtual
	int get hashCode => super.hashCode;

	static bool canUpdate(Widget oldWidget, Widget newWidget) {
		return oldWidget.runtimeType == newWidget.runtimeType
			&& oldWidget.key == newWidget.key;
	}

	static int _debugConcreteSubtype(Widget widget) {
		return widget is StatefullWidget ? 1 :
			widget is StatelessWidget ? 2 : 0
	}
}
```

Widget has a method decorated with @protected and @factory CreateElement().
=> What is the @protected and @factory annotation in dart? d
@protected annotations indicates that the annotated class member should only be used in the same or in the subclass only.
@factory annotation means that the method must return new instance or null
@nonVirtual annotation means that subclass should not implement the method

# Element createElement()

createElement 메서드는 2가지 annotation이 포함되어 있습니다.

1. protected: `@protected`로 표시된 instance member(method, field 포함)는 같은 클래스나 mixin 혹은 하위 클래스에서만 사용해야합니다.
2. factory: `@factory`로 표시된 메서드는 반드시 null 혹은 새로운 instance를 반환해야합니다.

참고로 annotation은 편의를 위해 코드에 주석을 다는것입니다. 위의 protected, factory annotation의 의도와 다르게 코드를 쓴다고해도 compile 에러는 나지 않습니다.

이전 글에서 본 바와 같이 StatelessWidget은 Widget을 상속받아 createElement 메서드를 구체화하여 사용하고 있는 것을 확인한 바 있습니다.

```dart
absract class StatelessWidget extends Widget:
	const StatelessWidget({super.key});

	@override
	StatelessElement createElement() => StatelessElement(this);
	...
```

그럼 이쯤에서 궁금한 점이 생깁니다.

- Element는 정확히 뭐지..?
- Widget이랑 Element는 무슨 관계지..?

# Element는 뭐지?

공식 문서에서는 Element를 다음과 같이 설명합니다.
An instantiation of a Widget at a particular location in the tree.

Element는 tree의 특정 위치에 있는 Widget의 instance다. 라고 이해할 수 있을 것 같습니다.

Flutter는 Tree구조로 앱을 구조화합니다.

Widget도 tree를 만들고, element도 tree를 만듭니다.

정확히는 Widget Tree를 기반으로 Element Tree를 구성하게 됩니다.

main.dart의 코드로 Widget tree와 Element tree를 그려보도록 하겠습니다.

```dart
class MyApp extends StatelessWidget {
	...
	@override
	Widget build(BuildContext context) {
		return MaterialApp(
			title: ...
			theme: ThemeData(),
			home: const MyHomePage()
		)
	}
}

class MyHomePage extends StatefulWidget {
	...
	@override
	State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
	...
	@override
	Widget build(BuildContext context) {
		return Scaffold(
			appBar: AppBar(),
			body: Center(
				child: Column(
					children: <Widget>[
						const Text(),
						Text()
					]
				)
			)
		)
	}
}
```

Flutter has 3 types of trees internally.

1. Widget Tree
2. Element Tree
3. Render object Tree
   See the inside flutter.

4. How are these trees related to each other ?
5. What are these trees?
6. Where in the flutter code can I find this building tree?

**Widgets** are immutable descriptions of part of the UI. Each time the app's state changes, a new Widget tree is created.

The Element tree is a **mutable** structure that maintains the lifecycle state of widgets.
It's a middle layer between the Widget tree and the Render Object tree.
Elements hold references to widgets and render objects.

The Render Object tree handles the actual rendering of the UI.
It computes the layout, paints the UI, and handles hit testing for user interactions.

Flutter creates or updates Elements based on the Widget tree.
Elements persist and Widgets are recreated.

Elements create and manage RenderObjects.
Not all Elements have associated RenderObjects(e.g. StatelessWidget, StatefulWidget). RenderObjects are created by RenderObjectWidgets

**Overall flow: Widget(configuration) -> Element(lifecycle) -> RenderObject(rendering)**

---

Flutter architecture overview

**Widgets**
each widget is an immutable declaration of part of the user interface.

Widgets form a hierarchy based on **composition**.
Each widget nests inside its parent and can receive **context** from the parent.
This structure carries all the way up to the root widget(the container that hosts the Flutter app, typically MaterialApp or CupertinoApp), as this trivial example shows.

Apps update their user interface in response to events(such as a user interaction) by **telling the framework to replace a widget in the hierarchy with another widget**.
The framework then **compares** the new and old **widgets**, and efficiently updates the user interface.

Flutter has its own implementations of each UI control, rather than deferring to those provided by the system: for example, there is a pure Dart implementation of both the iOS toggle control and the one for the android equivalent.

Composition
