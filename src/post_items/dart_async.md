---
title: Dart asynchronous programming
author: jack
description: Dart에서 비동기를 구현하는 방식에 대해 알아보고 예시를 통해 학습 해봅니다.
published: true
date: 2025. 03. 27.
tags: ['Dart', 'Flutter']
---

# Basic concepts

## Asynchronous programming in Dart

### Future

**Future** 객체는 아직 결과값이 정해지지 않은 미래의 계산 작업(**computation**)을 의미합니다. 어떤 계산이 완료되면 Future는 그 결과값을 반환합니다. Future는 주로 별도의 스레드나 격리된 환경(**Isolate**)에서 실행되는 비동기 작업을 처리할 때 사용됩니다. 예를 들어, `dart:io`의 파일 입출력 작업이나 `dart:html`의 HTTP 요청 같은 경우가 있습니다.

Dart의 많은 메서드들은 특정 작업을 수행할 때 Future를 반환합니다. 예를 들어, `HttpServer.bind()` 메서드는 서버를 특정 IP와 포트에 연결하는데, 이 과정이 완료되면 Future를 통해 결과를 반환합니다.

```dart
 HttpServer.bind('127.0.0.1', 4444)
     .then((server) => print('${server.isBroadcast}'))
     .catchError(print);
```

위 코드에서 `bind()` 메서드는 서버를 설정하는 작업을 실행하고, 작업이 성공하면 `then()` 안의 코드가 실행됩니다. 여기서 `server.isBroadcast` 값을 출력하는 것이죠. 만약 오류가 발생하면 `catchError()`에 등록된 코드가 실행되어 오류 내용을 출력합니다.

Future는 이렇게 특정 **작업이 완료된 후 실행될 코드를 미리 등록**해두고, 결과를 기다렸다가 **적절한 시점에 실행**할 수 있도록 도와주는 개념입니다.

### Stream

**Stream은** 비동기적으로 **연속된 데이터를 제공**하는 개념입니다. 데이터가 순차적으로 전달되는 예로는 마우스 클릭 같은 개별 이벤트나, 파일의 내용을 여러 개의 바이트 리스트로 나누어 읽는 경우가 있습니다.

아래 예제는 파일을 읽기 위해 Stream을 사용합니다.  
[Stream.listen](https://api.dart.dev/stable/latest/dart-async/Stream/listen.html) 메서드를 사용하면 새로운 데이터가 들어올 때마다 실행할 콜백 함수를 등록할 수 있습니다. 또한, 오류가 발생했을 때나 스트림이 종료되었을 때 실행할 함수도 설정할 수 있습니다.

```dart
Stream<List<int>> stream = File('quotes.txt').openRead();
stream.transform(utf8.decoder).forEach(print);
```

이 스트림은 여러 개의 바이트 리스트를 순차적으로 내보냅니다. 프로그램은 이 바이트 리스트들을 적절한 방식으로 처리해야 합니다. 위 코드에서는 `dart:convert` 라이브러리의 UTF-8 디코더를 사용해 바이트 스트림을 문자열 스트림으로 변환하고 출력합니다.

스트림은 웹 애플리케이션에서 사용자의 입력 이벤트를 처리할 때도 자주 사용됩니다. 예를 들어, 아래 코드는 특정 버튼이 클릭될 때마다 이벤트를 감지하고 실행됩니다.

```dart
querySelector('#myButton')!.onClick.forEach((_) => print('Click.'));
```

이렇게 스트림을 활용하면 이벤트가 발생할 때마다 즉시 반응할 수 있으며, 데이터가 도착하는 즉시 처리하는 비동기 방식의 프로그래밍이 가능합니다.

### Isolates

**Isolate**는 모든 Dart 코드가 실행되는 단위입니다. 이것은 기계 안에서 **독립적인** 작은 공간처럼 작동하며, **자체적인 메모리 영역**을 가지고 있고, 하나의 스레드가 이벤트 루프를 실행하는 구조입니다.

C++ 같은 많은 다른 언어에서는 여러 개의 스레드가 하나의 메모리를 공유하며 원하는 코드를 실행할 수 있습니다. 하지만 Dart에서는 각 스레드가 자신만의 `Isolate(아이솔레이트)`에서 실행되며, 독립적인 메모리를 가지며, 이벤트를 처리하는 방식으로 동작합니다.

대부분의 Dart 애플리케이션은 하나의 아이솔레이트에서 모든 코드를 실행하지만, 필요하다면 여러 개를 만들 수도 있습니다. 예를 들어, 매우 큰 연산을 수행해야 하는 경우 메인 아이솔레이트에서 실행하면 프레임 드롭이 발생할 수 있습니다. 이런 경우, Dart의 [`Isolate.spawn()`](https://api.dartlang.org/stable/dart-isolate/Isolate/spawn.html) 또는 Flutter의 [`compute()` 함수](https://flutter.dev/docs/cookbook/networking/background-parsing#4-move-this-work-to-a-separate-isolate)를 사용하면 됩니다. 이 함수들은 새로운 아이솔레이트를 생성하여 복잡한 연산을 처리하고, 메인 아이솔레이트는 위젯 트리를 리빌드하고 렌더링하는 등의 작업을 계속할 수 있도록 해줍니다.

새로운 아이솔레이트는 자체적인 이벤트 루프와 메모리를 가지며, 이를 생성한 원래 아이솔레이트조차도 해당 메모리에 접근할 수 없습니다. 이러한 독립적인 특성 때문에 `Isolate(아이솔레이트)`라는 이름이 붙었습니다. 즉, 각 아이솔레이트는 서로 **격리(isolated)** 되어 있습니다.

실제로 아이솔레이트들이 협력하는 유일한 방법은 **메시지를 주고받는 것**입니다. 한 아이솔레이트가 다른 아이솔레이트로 메시지를 보내면, 받은 아이솔레이트는 자신의 **이벤트 루프**를 이용해 해당 메시지를 처리합니다.

Java나 C++ 같은 언어에서 멀티스레드 프로그래밍을 해본 경험이 있다면, Dart의 아이솔레이트 개념이 다소 제한적으로 보일 수도 있습니다. 하지만 이런 구조는 Dart 개발자들에게 몇 가지 중요한 이점을 제공합니다.

예를 들어, 아이솔레이트 내부의 메모리 할당과 가비지 컬렉션(GC)은 **락(lock)을 사용하지 않고도 안전하게 처리됩니다.** **하나의 아이솔레이트**에는 **단 하나의 스레드**만 존재하므로, 그 스레드가 실행되지 않는 동안에는 메모리가 변경될 가능성이 없습니다. 이러한 구조는 Flutter 애플리케이션이 빠르게 위젯을 생성하고 파괴하는 작업을 수행할 때 매우 유용합니다.

### Event loops

<img src='/queue.jpg' width='70%' alt='queue.jpg'>

앱이 시작하고, 종료되기까지 여러 이벤트가 발생합니다. 디스크에서 데이터를 읽거나, 사용자가 화면을 터치하는 등 다양한 이벤트가 있습니다.

앱은 이러한 이벤트가 언제, 어떤 순서로 발생할지 예측할 수 없으며, **단 하나의 스레드**로 모든 이벤트를 처리해야 합니다. 하지만 이 **스레드**는 절대 **블로킹되지 않아야** 하죠. 그래서 앱은 **이벤트 루프(event loop)** 를 실행합니다.  
이벤트 루프는 **이벤트 큐**(**event queue**)에서 가장 오래된 이벤트를 가져와 처리하고, 다음 이벤트를 가져와 처리하는 방식으로 계속 반복됩니다. 큐가 비워질 때까지 이 과정이 이어집니다.

앱이 실행되는 동안, 사용자는 화면을 터치하고, 파일이 다운로드되며, 타이머가 울릴 수도 있습니다. 이벤트 루프는 이러한 이벤트들을 **한 번에 하나씩** 처리하면서 계속 돌아갑니다.

이벤트가 없는 순간에는 스레드가 대기 상태가 됩니다. 이때는 가비지 컬렉션(GC)이 실행될 수도 있고, 그냥 멈춰 있을 수도 있습니다.

Dart의 **비동기 프로그래밍을 위한 고수준 API와 언어 기능**— `Future`, `Stream`, `async` 및 `await`—은 모두 이 단순한 이벤트 루프를 기반으로 작동합니다.

### Event queues

Dart 애플리케이션은 단 하나의 **이벤트 루프(event loop)** 를 가지고 있으며, 여기에는 **두 개의 큐(queue)** 가 존재합니다.  
바로 **이벤트 큐(event queue)** 와 **마이크로태스크 큐(microtask queue)** 입니다.

**이벤트 큐 (Event Queue)** **외부에서 발생하는 이벤트** 들이 저장됩니다.  
예를 들어, I/O 작업, 마우스 이벤트, 화면 렌더링 이벤트, 타이머, Dart 아이솔레이트 간의 메시지 등이 이벤트 큐에 들어갑니다.

**마이크로태스크 큐 (Microtask Queue)** 는 특정 작업을 **나중에 실행하지만, 이벤트 루프의 제어권을 반환하기 전에 반드시 실행해야 할 경우** 필요합니다.  
예를 들어, **Observable 객체**(변경 사항을 감지하는 객체)가 변경될 때, 여러 개의 변경을 묶어서 비동기적으로 보고하는 경우가 있습니다.

이벤트 큐에는 **Dart 내부에서 발생한 이벤트뿐만 아니라, 시스템 외부에서 발생한 이벤트도 포함됩니다.**  
반면, 현재 마이크로태스크 큐에는 **Dart 코드 내부에서 생성된 작업만** 들어갑니다.

### **이벤트 루프의 실행 순서**

아래 그림과 같이, `main()` 함수가 종료되면 **이벤트 루프가 실행을 시작합니다.**

1. 먼저, **모든 마이크로태스크** 를 **FIFO(First In, First Out) 순서로 실행**합니다.
2. 그 후, **이벤트 큐에서 첫 번째 이벤트를 가져와 실행**합니다.
3. 다시 **모든 마이크로태스크를 실행**한 후, **이벤트 큐에서 다음 이벤트를 처리**합니다.
4. 이 과정을 반복합니다.

이벤트 큐와 마이크로태스크 큐가 **모두 비어 있고, 더 이상 실행할 이벤트가 없을 때**,  
앱의 **임베더(embedder)** (예: 브라우저나 테스트 프레임워크)는 앱을 종료할 수 있습니다.

<img src='/process.jpg' width='70%' alt='process.jpg'>

## Example

```dart
// Asynchronous network request that will eventually return Future with
// downloadURL as String on success, and Error on failure.
Future<String> _uploadBytes(
    {required Uint8List bytes,
    String? path,
    }) async {
  String fileName = DateTime.now().millisecondsSinceEpoch.toString();
  Reference storageRef =
      FirebaseStorage.instance.ref().child("${path ?? ''}/$fileName");

  final compressedBytes = await FlutterImageCompress.compressWithList(bytes);

  UploadTask uploadTask = storageRef.putData(compressedBytes);

  TaskSnapshot snapshot = await uploadTask;

  String downloadURL = await snapshot.ref.getDownloadURL();
  return downloadURL;
}
```

**Before:**

```dart
List<String> imageURLs = [];
// Process the asynchronous task sequentially, which does not have any
// dependencies with each other, redundantly consuming the time spent on
// the whole process to complete.
for (final image in images) {
  final bytes = await image.readAsBytes();
  // meaninglessly waiting for the upload process to finish, blocking the next
  // image from uploading.
  final downloadURL = await _uploadBytes(
    bytes: bytes,
    path: 'images',
    progressCallback: progressCallback,
  );
  imageURLs.add(downloadURL);
}
newJournal = newJournal.copyWith(images: imageURLs);
```

**After:**

```dart
// imageUploadTasks is a list of Future<String?>, which means the callback inside the .map() does not execute immediately.
final imageUploadTasks = images.map((image) async {
  try {
    final bytes = await image.readAsBytes();
    return _uploadBytes(
        bytes: bytes,
        path: 'images',
        progressCallback: progressCallback);
  } catch (e) {
    return null; // allow partial image upload.
  }
}).toList();
// Using Future.wait() will wait for all images to be uploaded concurrently.
final imageURLs = await Future.wait(imageUploadTasks);
newJournal = newJournal.copyWith(images: imageURLs);
```

### **이전 코드의 실행 순서**

1. **반복문 시작**

   - 첫 번째 이미지를 선택합니다.
   - `await image.readAsBytes()` 를 호출합니다.

2. **이미지 바이트 읽기**

   - 이 과정은 **I/O 바운드 연산** 입니다.
   - Dart는 이 작업을 **OS 파일 시스템에 위임(offload)** 하고, 이벤트 큐의 다음 작업을 처리합니다.
   - OS가 파일 읽기를 완료하면, 이벤트 루프가 이를 다시 받아 실행을 계속합니다.

<img src='/previous_1.jpg' width='80%' alt='previous_1.jpg'>

3. **이미지 업로드**

   - `_uploadBytes` 를 호출하여 이미지를 서버에 업로드합니다.
   - 네트워크 작업 역시 **OS/네트워크 스택에 위임** 되므로, Dart는 다른 작업을 계속 처리할 수 있습니다.
   - 하지만 이벤트 루프는 **이전 업로드가 완료될 때까지 다음 반복으로 넘어가지 않습니다.**

<img src='/previous_2.jpg' width='80%' alt='previous_2.jpg'>

4. **URL 저장**

   - 서버가 업로드된 이미지의 다운로드 URL을 반환합니다.
   - Dart는 이 URL을 `imageURLs` 리스트에 추가합니다.

5. **이미지 2, 이미지 3에 대해 1~4를 반복**

   - Dart는 **이전 이미지 업로드가 완료될 때까지 다음 이미지를 처리하지 않습니다.**
   - 즉, 이미지들이 **순차적으로 처리되며, 하나의 작업이 완료되기 전까지 다음 작업이 블록(block)됩니다.**

---

### **개선된 코드의 실행 순서**

1. **메인 함수 시작**

   - `image.map()` 내의 작업들이 **이벤트 루프(event loop)** 에 추가됩니다.

2. **각 `image.readAsBytes()` 실행 시작 (비동기 I/O)**

   - 파일 I/O 연산(디스크 읽기) 작업이 시작됩니다.
   - 이는 **이벤트 큐(event queue)** 로 이동하며, **마이크로태스크 큐(microtask queue)** 에는 추가되지 않습니다.
   - 이벤트 루프는 **이 작업이 완료될 때까지 대기하지 않고** 다음 작업을 계속 실행합니다.

3. **각 `_uploadBytes()` 업로드 시작 (비동기 네트워크 I/O)**

   - 네트워크에 데이터를 업로드하는 **네트워크 바운드(network-bound) 연산** 이 실행됩니다.
   - **각 이미지의 읽기(read)가 완료되는 즉시** 업로드가 시작됩니다.
   - 이전 코드와 달리, **이미지들이 순차적으로 처리되는 것이 아니라 동시에(concurrently) 업로드됩니다.**

4. **`Future.wait(imageUploadTasks)` 모든 업로드 완료 대기**

   - `Future.wait()` 는 **모든 이미지 업로드가 완료될 때까지 기다립니다.**
   - 모든 `Future` 들이 완료된 후, `imageURLs` 리스트에 업로드된 URL들이 저장됩니다.

<img src='/after_1.jpg' width='80%' alt='after_1.jpg'>

# Source

- https://api.dart.dev/stable/latest/dart-async/index.html
- https://api.flutter.dev/flutter/dart-async/Future/wait.html
- https://api.flutter.dev/flutter/dart-async/Future/then.html
- https://api.flutter.dev/flutter/dart-async/Future-class.html
- https://dart.dev/libraries/dart-async
- https://medium.com/dartlang/dart-asynchronous-programming-isolates-and-event-loops-bffc3e296a6a
