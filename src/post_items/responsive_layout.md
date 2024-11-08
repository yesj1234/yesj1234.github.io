---
title: Responsive layout in Flutter(1)
description: How to build responsive layout in flutter application. Learn about SafeArea, MediaQuery, LayoutBuilder and some best practices.
author: jack
date: 2024. 10. 30.
published: true
tags: [Flutter]
---

# Responsive layout

**Responsive(반응형) 이란?**

> **Responsive web design**(RWD) or **responsive design** is an approach to web design that aims to make web pages render well on a **variety of devices and window or screen sizes** from minimum to maximum display size to ensure **usability and satisfaction**. ([wikipedia](https://en.wikipedia.org/wiki/Responsive_web_design))

반응형 디자인이란 다양한 종류의 화면 사이즈에 맞춰 적절한 화면을 그려줌으로서 앱을 사용하는 사람의 편의성과 만족감을 높여주는 디자인을 의미합니다.

Flutter는 Android, IOS 같은 모바일 환경 뿐만 아니라 웹에서도 같은 코드베이스로 동작합니다.

따라서 다양한 크기의 스크린 사이즈를 고려하여 코드를 작성해야 완성도 높은 앱을 만들 수 있습니다.

Flutter에서 반응형 디자인을 다루는 몇 가지 방식에 대해서 알아보도록 하겠습니다.

# SafeArea

> A widget that **insets its child by sufficient padding** to avoid intrusions by the operating system.
>
> ...
>
> When a minimum padding is specified, the greater of the minimum padding or the safe area padding will be applied. ([**Document**](https://api.flutter.dev/flutter/widgets/SafeArea-class.html))

SafeArea 자식요소가 확실하게 화면에 보여지도록 도와주는 위젯입니다.

아이폰X의 노치디자인, 아이폰15의 Dynamic Island 등의 **요소들이 화면을 가리지 않도록 공간을 확보**해주는 역할이라고 생각 할 수 있습니다.

SafeArea constructor를 통해 화면의 상, 하, 좌, 우 어디에 "Safe area"를 적용할지 선택할 수 있습니다.

기본적으로는 상, 하, 좌, 우 전체에 적용이 됩니다.

또한 최소값(minimum)값을 이용해 기본적으로 적용될 padding의 최소값을 정할 수 있습니다.

---

**SafeArea Constructor**

```dart
const SafeArea({
	Key? key,
	bool left = true,
	bool top = true,
	bool right = true,
	bool bottom = true,
	EdgeInsets minimum = EdgeInsets.zero,
	bool maintainBottomViewPadding = false,
	required Widget child
})
```

---

**SafeArea가 동작하는 방식**

```dart
EdgeInsets padding = MediaQuery.paddingOf(context);
return Padding(
	padding: EdgeInsets.only(
		left: math.max(left ? padding.left : 0.0, minimum.left),
		top: math.max(top ? padding.top : 0.0, minimum.top),
		right: math.max(right ? padding.right: 0.0, minimum.right),
		bottom: math.max(bottom ? padding.bottom : 0.0, minimum.bottom)
	),
	child: MediaQuery.removePadding(
		context: context,
		removeLeft: left,
		removeTop: top,
		removeRight: right,
		removeBottom: bottom,
		child: child
	),
);
```

MediaQuery.paddingOf(context) 를 통해 현재 화면의 padding에 대한 정보를 받아옵니다.

이후 상, 하, 좌, 우 의 bool값을 토대로 minimum값과 비교를 통해 적용될 padding값을 정합니다.

Widget Tree 최상단에 SafeArea를 두어 전체 앱에 padding을 적용시키는 방식을 많이 사용합니다.

SafeArea는 Widget Tree 상에서 중첩하여 사용하여도 최상단에 있는 SafeArea 하나만 적용되기 때문에(MediaQuery.removePadding이 자식 요소의 패딩을 없애줌으로써) 어디서 사용해도 원하는 효과를 얻을 수 있어 안심하고 사용할 수 있다는 장점이 있습니다.

# MediaQuery

> Establishes a subtree in which media queries resolve to the given data.
>
> For example, to learn the size of the current view (e.g. the FlutterView containing your app), you can use MediaQuery.sizeOf: MediaQuery.sizeOf(context).
>
> Querying the current media using specific methods (for example, MediaQuery.sizeOf or MediaQuery.paddingOf) will cause your widget to rebuild automatically whenever that specific property changes.
>
> Querying using MediaQuery.of will cause your widget to rebuild automatically whenever any field of the MediaQueryData changes(e.g. if the user rotates their device).
> Therefore, unless you are concerned with the entire MediaQueryData object changing, prefer using the specific methods (for example, MediaQuery.sizeOf and MediaQuery.paddingOf), as it will rebuild more efficiently ([**Document**](https://api.flutter.dev/flutter/widgets/MediaQuery-class.html))

앞서 살펴본 SafeArea는 MediaQuery의 padding에 대한 정보를 이용해 Padding을 반환하는 위젯입니다.

MediaQuery는 padding에 대한 정보뿐만 아니라 현재 Media(앱이 실행되는 디바이스)의 화면 사이즈(MediaQuery.sizeOf), 화면 배열 방향(MediaQuery.orientationOf), light mode 혹은 dark mode 등의 밝기 설정에 대한 정보(MediaQuery.platformBrightnessOf) 등의 훨씬 더 다양한 정보를 담고 있는 활용성이 높은 위젯입니다.

다양한 정보를 담고 있는 만큼 사용시 주의할 점이 있습니다.

MediaQuery를 이용해 다음과 같이 Media에 대한 정보를 받아오는 경우 Media의 어떠한 정보가 바뀌는 경우 rebuild가 일어납니다.

```dart
@override
Widget build(BuildContext context) {
	double width = MediaQuery.of(context).size.width;
	double height = MediaQuery.of(context).size.height;
	return ...
}
```

화면의 width 와 height에 대한 정보를 받아와서 사용하고 있고 width 와 height 값이 변하면 rebuild가 생길것으로 예상하지만 위와 같이 사용할 경우 orientation이 바뀌는 경우에도 rebuild가 일어나 불필요한 리소스 낭비가 생길 수 있습니다.

이와 같은 문제는 다음과 같이 특정 값을 받아오는 메서드를 사용하여 해결할 수 있습니다.

```dart
@override
Widget build(BuildContext context) {
	//double width = MediaQuery.of(context).size.width;
	//double height = MediaQuery.of(context).size.height;
	double width = MediaQuery.sizeOf(context).width;
	double height = MediaQuery.sizeOf(context).height;
	// OR use maybe... for null exception
	double? width = MediaQuery.maybeSizeOf(context).width;
	double? height = MediaQuery.maybeSizeOf(context).height;
	return ...
}
```

---

# LayoutBuilder

> Builds a widget tree that can depend on the parent widget's size.
>
> Similar to the Builder widget except that the framework calls the builder function at layout time and provides the parent widget's constraints.
>
> This is useful when the parent constraints the chid's size and doesn't depend on the child's intrinsic size. The LayourBuilder's final size will match its child's size.

MediaQuery.sizeOf는 현재 화면의 크기를 가져왔다면 LayoutBuilder는 부모 위젯으로부터 크기 정보(constraints)를 가져옵니다.

**LayoutBuilder의 사용예시**

```dart
@override
Widget build(BuildContext context) {
    return LayoutBuilder(
        builder: (BuildContext context, BoxConstraints constraints) {
            // Distinction point from extra small and small from Material guide.
            if (constraints.maxWidth > 600) {
                return SmallSize();
            } else {
                return ExtraSmallSize();
            }

        }
    )
}

```

# Code refactor example

TODO: refactor the code with responsive widgets.

# Sources

- [Adaptive UI with Flutter](https://www.youtube.com/watch?time_continue=2039&v=LeKLGzpsz9I&embeds_referring_euri=https%3A%2F%2Fdocs.flutter.dev%2F&embeds_referring_origin=https%3A%2F%2Fdocs.flutter.dev&source_ve_path=MTM5MTE3LDEzOTExNywyMzg1MQ)

- [SafeArea Docs](https://api.flutter.dev/flutter/widgets/SafeArea-class.html)

- [MediaQuery](https://api.flutter.dev/flutter/widgets/MediaQuery-class.html)

- [GridView Docs](https://api.flutter.dev/flutter/widgets/GridView-class.html)

- [LayoutBuilder Docs](https://api.flutter.dev/flutter/widgets/LayoutBuilder-class.html)

- [Layout guidance from material3](https://m3.material.io/foundations/layout/applying-layout/window-size-classes)
