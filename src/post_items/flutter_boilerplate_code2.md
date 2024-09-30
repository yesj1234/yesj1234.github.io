---
title: new Flutter project의 main.dart 코드 파헤쳐보기(2)
description: IDE를 이용해 만든 flutter project의 초기 main.dart 코드들을 보면서 StatelessWidget, StatefulWidget, key에 대해 알아봅니다.
author: jack
date: 2024.09. 29.
published: true
tags: [Dart, Flutter]
---

지난 글에서 Widget이 field로 가지고 있던 Key까지 알아보았습니다.

createElement() 메서드에 대해 이어서 보도록 하겠습니다.

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

# Element createElement()

createElement 메서드는 2가지 annotation이 포함되어 있습니다.

1. **protected**: `@protected`로 표시된 instance member(method, field 포함)는 같은 클래스나 mixin 혹은 하위 클래스에서만 사용해야합니다.
2. **factory**: `@factory`로 표시된 메서드는 반드시 null 혹은 새로운 instance를 반환해야합니다.

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

음..Element는 뭐고 Widget이랑 무슨 관계지?

## Element

[공식 문서](https://api.flutter.dev/flutter/widgets/Element-class.html)에서는 Element를 다음과 같이 설명합니다.

> An instantiation of a Widget at a particular location in the tree.

Element는 tree의 특정 위치에 있는 Widget의 instance다. 라고 이해할 수 있을 것 같습니다.

## Element는 Widget이랑 무슨 관계지?

Flutter는 Tree구조로 앱을 그립니다.

Widget도 tree를 만들고, element도 tree를 만듭니다.

정확히는 **Widget Tree**를 기반으로 **Element Tree**를 구성하게 됩니다.

`StatelessElement createElement() => StatelessElement(this);` 부분이 바로 widget의 구성(configuration)을 바탕으로 element를 만들어 element tree에 넣어주는 방식이죠.

Widget Tree와 Element Tree가 그려지는 순서는 다음과 같습니다.

---

1. main함수안에 있는 **`runApp(const MyApp)`** 함수가 실행됩니다.

2. **Flutter**는 MyApp widget을 **Widget Tree의 최상단에 위치**시킵니다(mounts).
3. Widget Tree에 mount된 MyApp widget은 **createElement** 메서드를 이용해 **element**를 만듭니다(instantiates).
4. 만들어진 element를 **Element Tree에 mount**시킵니다. 이 때 해당 **element는 widget을 참조**(reference)하고 있는 상태입니다.
5. Flutter는 MyApp widget의 **build 메서드를 실행**시킵니다.
6. build 메서드는 **MaterialApp widget을 반환**하고 Flutter는 이 widget을 **MyApp widget 밑에 위치**시킵니다.
7. Widget Tree에 mount된 MaterialApp widget **createElement** 메서드를 이용해 **element**를 만듭니다.
8. 만들어진 element를 **Element Tree에 mount**시킵니다. 이 때 해당 **element는 widget을 참조**(reference)하고 있는 상태입니다.
9. Flutter는 MaterialApp widget의 **build 메서드를 실행**시킵니다.
10. 위와 같은 과정을 마지막 Widget까지 반복합니다.

---

main.dart의 Widget Tree와 Element Tree는 결과적으로 다음과 같습니다.

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

---

![main_dart_tree.png](/tree.png)

# StatefulWidget

맨 처음 Widget Tree와 Element Tree가 만들어지는 과정에 대해서는 이제 어느정도 이해했습니다.

하지만 StatefulWidget 처럼 상태가 변하는 Widget이 어떻게 동작하는지는 설명하고있지 않습니다.

StatefulWidget은 StatelessWidget과는 다르게 build 메서드가 아닌 createState 메서드를 overriding 합니다.

```dart
class MyHomePage extends StatefulWidget {
	const MyHomePage({super.key, required this.title});

	final String title;

	@override
	State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
	int _counter = 0; // final이 아닙니다!

	void _increment() {
		setState(() {
			_counter++;
		})
	}

	@override
	Widget build(BuildContext context) {
		return ...
	}
}
```

StatefulWidget은 Element뿐만 아니라 StateObject도 함께 만들어 Element로 하여금 상태의 변화를 감지하고 효율적으로 UI를 업데이트할 수 있도록 합니다.

state가 변할 때는 다음과 같은 과정으로 Tree가 업데이트됩니다.

예를 들어 \_counter 의 값이 0 에서 1로 바뀌는 상황이라고 가정해봅시다.

---

1. 유저의 클릭으로 **\_increment**메서드가 호출됩니다.

2. state object의 **\_counter값이 0 에서 1로 업데이트** 됩니다.
3. **state object**는 해당 **element를 오염된(dirty) 상태로 마킹**합니다. 다음 프레임에서 업데이트가 필요하다고 Flutter에게 알리기 위함입니다.
4. stateful element는 **state object에게 업데이트된 \_counter값을 가지고 새로운 Widget을 만들라고 요청**합니다.
5. **새롭게 만들어진 Widget**은 **기존 widget이 있던 위치에 mount**됩니다.
6. 기존 widget을 참조하고 있던 **element는 새롭게 mount된 widget을 참조**합니다(기존 widget과 새로운 widget이 같은 타입이므로 **element는 그대로 유지**됩니다.)

---

# 코드 맛보기

Flutter가 어떤 식으로 동작하는지 어느정도 파악하긴 했지만 아직은 뜬구름 잡는 느낌이 있습니다.

Flutter가 알아서 해준다 라고 알고 있는 것 보다는 실제 로직이 포함된 코드를 보면 이해하는데 훨씬 도움이 될 것 같습니다.

앱의 진입점 역할을 해주는 runApp함수를 따라가보도록 하겠습니다.

## runApp

```dart
void runApp(Widget app) {
    final WidgetBinding binding = WidgetsFlutterBinding.ensureInitialized();
    _runWidget(binding.wrapWithDefaultView(app), binding, 'runApp');
}
```

WidgetBinding은 Flutter engine과 widget layer를 이어주는 역할을 하는 클래스입니다.

runApp은 \_runWidget을 호출하고있습니다. \_runWidget을 확인해봅시다.

## \_runWidget

```dart
void _runWidget(Widget app, WidgetsBinding binding, String debugEntryPoint) {
  assert(binding.debugCheckZone(debugEntryPoint));
  binding
    ..scheduleAttachRootWidget(app)
    ..scheduleWarmUpFrame();
}
```

runApp에서 받아온 binding의 scheduleAttachRootWidget 메서드와 scheduleWarmUpFrame을 순차적으로 부르고 있군요.

메서드 이름에서 유추해보면 Widget Tree에 root widget을 넣도록 스케줄 하고 Element Tree를 만드는 것 같습니다.

binding의 해당 메서드들을 확인해보도록 하겠습니다.

## scheduleAttachRootWidget

```dart
mixin WidgetsBinding on BindingBase, ServicesBinding, SchedulerBinding, GestureBinding, RendererBinding, SemanticsBinding {
	...
	@protected
	void scheduleAttachRootWidget(Widget rootWidget) {
		Timer.run(() {
			attachRootWidget(rootWidget);
		});
	}
	void attachRootWidget(Widget rootWidget) {
		attachToBuildOwner(RootWidget(
			debugShortDescription: '[root]',
			child: rootWidget,
		));
	}
	void attachToBuildOwner(RootWidget widget) {
		final bool isBootstrapFrame = rootElement == null;
		_readyToProduceFrames = true;
		_rootElement = widget.attach(buildOwner!, rootElement as RootElement?);
		if (isBootstrapFrame) {
			SchedulerBinding.instance.ensureVisualUpdate();
		}
	}
}
```

**WidgetsBinding**은 여러 Binding들의 mixin이었군요.

**scheduleAttachRootWidget** 메서드는 Timer의 콜백으로 **attachRootWidget**메서드를 호출합니다.

일정 시간이 지난 후 콜백이 실행되는데 기본값은 0초로 설정되어있습니다. 즉 가능한 빨리 실행이 될 것으로 예상할 수 있습니다.

attachRootWidget은 다시 **attachToBuildOwner**메서드를 호출합니다.

attachToBuildOwner는 root widget을 buildOwner에 root element로 넣어주고,

SchedulerBinding.instance 의 **ensureVisualUpdate**메서드를 호출합니다.

참고로 BuildOwner는 Widget framework를 관리해주는 클래스입니다. 보통 위처럼 binding이 property로 가지고 있고 처음 operator system에 의해 사용되는 클래스입니다.

**ensureVisualUpdate** 를 확인해보도록 하겠습니다.

## scheduleWarmUpFrame

```dart
mixin SchedulerBinding on BindingBase {
	...
	void ensureVisualUpdate() {
		switch(schedulerPhase) {
			case SchedulerPhase.idle:
			case SchedulerPhase.postFrameCallbacks:
				scheduleFrame();
				return;
			case SchedulerPhase.transientCallbacks:
			case SchedulerPhase.midFrameMicrotasks:
			case SchedulerPhase.persistentCallbacks:
				return;
		}
	}
	void scheduleFrame() {
		if (_hasSchedulerFrame || !framesEnabled) {
			return;
		}
		...
		ensureFrameCallbacksRegistered();
		platformDispatcher.schedulFrame();
		_hasScheduledFrame = true;
	}
}
```

ensureVisualUpdate메서드는 SchedulerBinding mixin의 메서드입니다.

scheduler의 단계(phase)에 따라 visual udpate를 해주는 듯 합니다.

idle 혹은 postFrameCallbacks 단계일 경우 scheduleFrame을 호출합니다.

scheduleFrame메서드는 platformDispatcher의 scheduleFrame()을 호출하고 있습니다.

## scheduleFrame

```dart
class PlatformDispatcher {
	...
    void scheduleFrame() => _scheduleFrame();

	@Native<Void Function()>(symbol: 'PlatformConfigurationNativeApi::ScheduleFrame')
	external static void _scheduleFrame();
}
```

scheduleFrame메서드는 결국 PlatformDispatcher 클래스의 external 메서드였군요.

OS에 따라 다른 함수를 받아와서 실행시킬 것으로 예상됩니다.

## Element

```dart
abstract class Element extends DiagnosticableTree implements BuildContext {
	@override
	Widget get widget => _widget!;
	Widget? _widget;

	@override
	bool get mounted => _widget != null;


	@override
	BuildOwner? get owner => _owner;
	BuildOwner? _owner;

	BuildScope get buildScope => _parentBuildScope!;
	BuildScope? _parentBuildScope;

	void visitChildren(ElementVisitor visitor) {}

	Element? updateChild(Element? child, Widget? newWidget, Object? newSlot) {}
	List<Element> updateChildren(List<Element> oldChildren, List<Widget> newWidget, {Set<Element>? forgottenChildren, List<Object?>? slots}) {}
	void mount(Element? parent, Object? newSlot) {}
	void update(covariant Widget newWidget) {}
	void updateSlotForChild(Element child, Object? newSlot) {}
	void updateSlot(Object? newSlot) {}
	void _updateDepth(int parentDepth){}
	Element inflateWidget(Widget newWidget, Object? newSlot) {}
	void forgetChild(Element child) {}
	void unmount() {}
	bool get dirty => _dirty;
	bool _dirty = true;
	void markNeedsBuild() {}
	void rebuild({bool force = false}) {}
	void performRebuild() {}
}
```

(한 눈에 보기 위해 생략된 부분이 많습니다.)

위처럼 Element 클래스에는 mount, update, markNeedsBuild 등의 메서드들이 실제로 포함되어 있습니다.

그림에서 봤던 것들의 실제 로직을 코드로 볼 수 있습니다.

맛보기니까 자세하게 다루진 않겠습니다(~~귀찮아서가 아닙니다~~).

# Sources

1. [Flutter architecture overview - widgets](https://docs.flutter.dev/resources/architectural-overview#widgets)

2. [inside flutter](https://docs.flutter.dev/resources/inside-flutter)

3. [BuildOwner](https://github.com/flutter/flutter/blob/main/packages/flutter/lib/src/widgets/framework.dart#L2838)

4. [WidgetBinding](https://github.com/flutter/flutter/blob/main/packages/flutter/lib/src/widgets/binding.dart#L409)

5. [Element](https://github.com/flutter/flutter/blob/main/packages/flutter/lib/src/widgets/framework.dart#L3473)
