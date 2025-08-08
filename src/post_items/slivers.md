---
title: ScrollView in Flutter
author: jack
description: Get to know about CustomScrollView related widgets. 
published: true
date: 2025. 06. 26.
tags: ['Flutter']
---
# Viewport 
https://api.flutter.dev/flutter/widgets/Viewport-class.html

A widget through which a portion of larger content can be viewed, typically in combination with a *Scrollable*.

Related widgets: 
- ListView, PageView, GridView and CustomScrollView, which combines Scrollable and Viewport into widgets that are easier to use. 
- SliverToBoxAdapter, which allows a box widget to be placed inside a sliver context (the opposite of this widget). 
- ShrinkWrappingViewport, a variant of Viewport that shrink-wraps its content along the main axis. 
- ViewportElementMixin, which should be mixed in to the Element type used by viewport-like widgets to correctly handle scroll notifications. 

Inheritance: 
Object > DiagnosticableTree > Widget > RenderObjectWidget > MultiChildRenderObjectWidget > Viewport 

Implementers: 
NestedScrollViewViewport 



# Scrollable 
https://api.flutter.dev/flutter/widgets/Scrollable-class.html

A widget that manages scrolling in one dimension and informs the *ViewPort* through which the content is viewed. 

Scrollable implements the interaction model for a scrollable widget, including gesture recognition, but does not have an opinion about how the viewport, which actually idsplays the children, is constructured. 

It's rare to construct a Scrollabe directly. Instead , consider **ListView** or **GridView**, which combine scrolling, viewporting, and a layout model. To combine layout models (or to use a custom layout model), consider using CustomScrollView. 

The static Scrollable.of and Scrollable.ensureVisible functions are often used to interact with the Scrollable widget inside a ListView or a GridView. 

To further customize scrolling behavior with a Scrollable: 
1. You can provide a viewportBuilder to customize the child model. For example, SingleChildScrollView uses a viewport that displays a single box child whereas CustomScrollView uses a Viewport or a ShrinkWrappingViewport, both of which displays a list of slivers. 
2. You can provide a custom scrollController that creates a custom ScrollPosition subclass. For example, PageView uses a PageController, which creates a page-oriented scroll position subclass that keeps the same page visible when the Scrollable resizes. 

Related widgets: 
- ListView, which is a commonly used ScrollView that displays a scrolling, linear list of child widgets. 
- PageView, which is a scrolling list of child widgets that are each the size of the viewport. 
- GridView, which is a ScrollView that displays a scolling, 2D array of child widgets. 
- CustomScrollView, which is a ScrollView that create custom scroll effects using slivers. 
- SingleChildScrollView, which is a scrollable widget that has a single child. 
- ScrollNotification and NotificationListener, which can be used to watch the scroll position without using a ScrollController.  

# ScrollView 
Abstract. A Widget that combines a *Scrollable* and a *ViewPort* to create an interactive scrolling pane of content in one dimension.  

Scrollable widgets consist of three pieces: 
1. A **Scrollable** widget, which listens for various user gesture and implements the interaction design for scrolling. 
2. A **viewport** widget, such as Viewport or ShrinkWrappingViewport, which implements the visual design for scrolling by displaying only a portion of the widgets inside the scroll view. 
3. One or more **slivers**, which are widgets that can be composed to created various scrolling effects, such as lists, grids and expanding headers. 

Related widgets: 
- ListView 
- PageView 
- GridView
- CustomScrollView
- ScrollNotification and NotificationListener 
- TwoDimensionalScrollView, which is a similar widget ScrollView that scrolls in two dimensions. 

Inheritance: 
Object > DiagnosticableTree > Widget > StatelessWidget > ScrollView 



# CustomScrollView 
A **ScrollView** that creates custom scroll effects using slivers. 

A CustomScrollView lets you supply slivers directly to create various scrolling effects, such as lists, grids, and expanding headers. For example, to create a scroll view that contains an expanding app bar followed by a list and a grid, use a list of three slivers: SliverAppBar, SliverList, and SliverGrid. 

Widgets in these slivers must produce RenderSliver object. 

To control the initial scroll offset of the scroll view, provide a controller with its ScrollController.initialOffset property set. 


Related widgets: 
- SliverList 
- SliverFixedExtentList 
- SliverGrid 
- SliverPadding
- SliverAppBar 
- ScrollNotification and NotificationListener  
- IndexedSemantics 

Inheritance: 
Object > DiagnosticableTree > Widget > StatelessWidget > ScrollView > CustomScrollView 

# RenderSliver 
Base class for the render objects that implements scroll effects in viewport. 

A RenderViewport has a list of child slivers. Each slivers - literally a slice of the viewport's content - is laide out in turn, covering the viewport in the process.(Every slivers is laid out each time, including those that have zero extent because they are "scrolled off" or are beyond the end of the viewport.)

Slivers participate in the sliver protocol, wherein during layout each slivers receives a SliverConstraints object and computes a corresponding SliverGeometry that describes where it fits in the viewport. This is analogous to the box protocol used by RenderBox, which gets a BoxConstraints as input and computes a Size. 




Inheritance: 
Object > RenderObject > RenderSliver 


# SliverPersistentHeader

# SliverToBoxAdapter 



# Problem 
PageMain > _PageMainState 
```dart
final ScrollController scrollController = ScrollController(); 
CustomScrollView(
    controller: scrollController, 
    slivers: [
        SliverPersistentHeader(
            delegate: _TopNavDelegate(), 
        ), 
        SliverToBoxAdapter(
            child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 5), 
                child: Stack(
                    children: [
                        Content(scrollController: scrollController), 
                        Align( // Not showing anywhere. 
                            alignment: Alignment.bottomRight,
                            child: ScrollToTopButton(scrollController: scrollController), 
                        ), 

                    ], 

                )
            )
        )
    ]
)

```