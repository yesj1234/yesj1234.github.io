---
title: Effective Java 1.
description:  Creating and Destroying Objects.
author: jack
published: false
date: 2025. 10. 18.
tags: ['Object Programming', 'Java']
---

# Introduction 

- When & How to **create** object. 
- When & How to **destroy** object. 
- How to ensure objects are **destroyed** in a **timely** manner. 
- How to manage any **cleanup actions** that must precede their desctruction. 


## Item1. Consider static factory methods instead of constructors. 

Public constructor is a traditional way of providing the client to obtain an instance. 
There is another technique that should be a part of every programmer's toolkit. 
A class can provide a public `static factory method`, which is simply a static method that returns an instance of the class. 

Note that a static factory method is not the same as the `Factory Method` pattern from `Design Patterns`. The static factory method described in this item has no direct equivalent in `Design Patterns`. 

### Factory Method in Design Patterns. 

Factory Method Pattern은 객체 생성을 담당하는 메서드를 하위 클래스에서 정의하도록 하는 패턴. 

- 상위 클래스에서는 "어떤 객체를 만들어야 하는지" 정확히 알지 못한다. 
- 하위 클래스가 구체적으로 "어떤 객체를 만들지" 결정한다. 
- 객체 생성 로직을 캡슐화하고 유연하게 만든다. 

Example. 

```java 
// 상위 클래스
abstract class AnimalFactory {
    // 이것이 Factory Method - 하위 클래스에서 구현해야 함
    abstract Animal createAnimal();
    
    public void doSomething() {
        Animal animal = createAnimal(); // 어떤 동물인지 모르지만 사용
        animal.makeSound();
    }
}

// 하위 클래스들이 구체적인 생성 방법을 정의
class DogFactory extends AnimalFactory {
    Animal createAnimal() {
        return new Dog(); // 개를 생성
    }
}

class CatFactory extends AnimalFactory {
    Animal createAnimal() {
        return new Cat(); // 고양이를 생성
    }
}
```

Static Factory Method와의 차이점. 

- 단순히 객체 생성을 담당하는 static 메서드. 
- 생성자 대신 사용하는 편의 메서드. 

Factory Method Pattern

- 상속과 다형성을 활용
- 객체 생성 책임을 하위 클래스에 위임 
- 런타임에 어떤 객체를 만들지 결정 가능. 

다른 생성 패턴들과의 차이 

1. Abstract factory: 관련된 객체들의 "가족"을 만드는 패턴 
2. Builder: 복잡한 객체를 단계별로 만드는 패턴 
3. Singleton: 클래스의 인스턴스를 하나만 만드는 패턴 

Factory Method는 이 중에서도 "상속을 통한 객체 생성 위임"이 핵심. 


---

Providing a static factory methods instead of a public constructor has... 
Pros 
1. unlike constructors, they have **names**. 
2.  unlike constructors, they are **not** required to **create a new object** each time they're invoked, which allows immutable classes to use preconstructed instances, or to cache instances as they're constructed, and dispense them repeatedly to avoid creating unnecessary duplicate objects. 

Classes that maintain strict control over what instances exist at any time are called `instance-controlled`. 
`instnace-controlled` classes guarantee...
- that it is a singleton or noninstantiable 
- immutable value class that no two equal instances exist. 
- Enum types provide this guarantee. 

3. unlike constructors, they can return an object of any **subtype** of their return type. 

4. class of the returned object can vary from call to call as a function of the input parameters. 

5. class of the returned object need not exist when the class containing the method is written. 





Cons
1. classes without public or protected constructors cannot be subclassed. 

2. they are hard for programmers to find. 

Common names for static factory methods. 

- from : A `type-conversion method` that takes a single parameter and retunrs a corresponding instance of this type, 

- of : An `aggregation method` that takes multiple parameters and returns an instance of this type that incorporates them. 

- valueOf : A more verbose alternative to from and of

- instance or getInstance : Returns an instance that is described by its parameters but cannot be said to have the same value. 

- create or newInstance : Like instance or getInstance, except that the method guarantees that each call returns a new instance. 

- get*Type* : Like getInstance, but use if the factory method is in an different class. 

- new*Type* : Like newInstance, but used if the factory method is in a different class. Type is the type of object returned by the factory method. 

- *type* : A consice alternative to getType and newType




Flyweight pattern.
메모리를 절약하기 위해 같은 객체를 여러 곳에서 공유하는 디자인 패턴 

- 동일한 데이터를 가진 객체를 매번 새로 만들지 않고 
- 한번 만든 객체를 재사용함.
- 메모리 사용량 최적화 


Examples in Dart. 

```dart
@freezed
class WithdrawRequest with _$WithdrawRequest {
    // 1. 기본 factory constructor - Static Factory Method 
    const factory WithdrawRequest({
        required String leaveReason,
        required List<String> leaveOtherReason,
        required String leaveOtherReason,
    }) = _WithdrawRequest;

    // 2. Named factory constructor - Static Factory Method
    // API 응답처리의 필수 패턴
    // 유효성 검사와 데이터 변환
    // Immutable 객체 생성
    // 테스트 용이성
    // 코드 일관성과 가독성 
    factory WithdrawRequest.fromJson(Map<String, dynamic> json) => _$WithDrawRequestFromJson(json);
}
```

```dart
class User {
    // 다양한 데이터 소스에서 객체 생성 
    factory User.fromJson(Map<String, dynamic> json) => ...;

    factory User.fromDatabase(Map<String, dynamic> dbRow) => ...; 

    factory User.fromFirestore(DocumentSnapshot doc) => ...; 

    factory User.empty() => User(id: '', name: '', email: '');
}
```



1. 클래스의 인스턴스를 반환 : `WithdrawRequest`객체 반환
2. 생성자 대신 사용 : `new WithdrawRequest()` 대신 사용
3. 메서드를 통한 객체 생성 : `factory` 키워드로 메서드 정의



## Item2. Consider a builder when face with many constructor parameters. 

Dart에서 Builder가 유용한 경우들
1. 복잡한 유효성 검사 

```dart
class DatabaseConfig {
  final String host;
  final int port;
  final String database;
  final String username;
  final String password;
  
  DatabaseConfig._({
    required this.host,
    required this.port,
    required this.database,
    required this.username,
    required this.password,
  });
}

class DatabaseConfigBuilder {
  String? _host;
  int? _port;
  String? _database;
  String? _username;
  String? _password;
  
  DatabaseConfigBuilder setHost(String host) {
    if (host.isEmpty) throw ArgumentError('Host cannot be empty');
    _host = host;
    return this;
  }
  
  DatabaseConfigBuilder setPort(int port) {
    if (port < 1 || port > 65535) throw ArgumentError('Invalid port');
    _port = port;
    return this;
  }
  
  DatabaseConfig build() {
    // 복잡한 조합 검증
    if (_host == null || _port == null) {
      throw StateError('Host and port are required');
    }
    
    // 특정 조합 검증
    if (_host!.contains('localhost') && _port! != 5432) {
      throw ArgumentError('Localhost must use port 5432');
    }
    
    return DatabaseConfig._(
      host: _host!,
      port: _port!,
      database: _database ?? 'default',
      username: _username ?? 'user',
      password: _password ?? '',
    );
  }
}
```

2. 단계별 설정이 필요한 경우 

```dart
// HTTP 클라이언트 설정처럼 순서가 중요한 경우
final client = HttpClientBuilder()
    .setBaseUrl('https://api.example.com')
    .addHeader('Authorization', 'Bearer $token')
    .setTimeout(Duration(seconds: 30))
    .enableRetry(maxAttempts: 3)
    .build();
```

3. 불변 객체를 점진적으로 구성할 때 

실제 Flutter/Dart 생태계에서의 예시 
- `PageRouteBuilder` 
    - 복잡한 객체 생성(Route 객체는 많은 설정이 필요) 
    - 단계별 구성 (pageBuilder, transitionBuilder) 
    - 유연한 조합 (다양한 애니메이션과 설정을 조합)
    - 가독성: 어떤 설정을 하는지 명확
- `ThemeData.from()` 


## Item3. Enforce the singleton property with a private constructor or an enum type.

Java Enum(열거형)
- Enum은 상수들의 집합을 정의하는 특별한 클래스 

직렬화(Serialization) 
- 객체를 파일이나 네트워크로 전송/저장하기 위해 바이트 형태로 변환하는 것
- 싱글톤 객체를 직렬화했다가 역직렬화하면 새로운 인스턴스가 생성됨

리플렉션(Reflection) 
- 실행 중에 클래스의 private 생성자까지 강제로 호출할 수 있는 기능 

기존 싱글톤의 문제점들 
- 직렬화 공격: 직렬화 후 역직렬화하면 새 인스턴스 생성 
- 리플렉션 공격: private 생성자를 강제로 호출해서 새 인스턴스 생성 

Enum Singleton 
- 단일 인스턴스 보장 
- 직렬화 안전: Java가 enum직렬화를 특별하게 처리해서 같은 인스턴스 유지 
- 리플렉션 안전: enum의 생성자는 리플렉션으로도 호출 불가 
- 스레드 안전: Java가 자동으로 스레드 안전성 보장 

예시 
```java
// 기존 싱글톤 - 문제 있음
public class OldSingleton {
    private static final OldSingleton INSTANCE = new OldSingleton();
    private OldSingleton() {}
    public static OldSingleton getInstance() { return INSTANCE; }
}

// Enum 싱글톤 - 완벽함
public enum NewSingleton {
    INSTANCE;
    
    public void doWork() {
        // 실제 비즈니스 로직
    }
}
```

Dart와의 차이점
- 자동 직렬호 보호 없음. 
- 자동 리플렉션 보호 없음. 
- JVM레벨의 스레드 안전성 보장 없음. 
- Dart는 싱글 스레드 기반이라 스레드 안정성 이슈가 적음
- 직렬화 / 리플렉션 공격보다는 실용성에 초점
- `late final` 키워드로 지연 초기화 가능 






## Item4. Enforce noninstantiability with a private constructor. 

객체지향의 기본 철학: 
- 데이터(상태)와 그 데이터를 다루는 행동(메서드)를 하나의 객체 안에 묶는 것 
- 현실 세계의 사물들을 모델링 

Static 메서드만 있는 클래스의 문제점?
- 캡슐화 위반, 데이터와 관련된 연산들이 분리되어 있을 수 있다. 
- 같은 원의 반지름을 여러번 전달해야 된다. 
```java
// 객체지향적이지 않은 방식
class MathUtils {
    public static double calculateArea(double radius) {
        return Math.PI * radius * radius;
    }
    
    public static double calculateCircumference(double radius) {
        return 2 * Math.PI * radius;
    }
}

// 사용
double area = MathUtils.calculateArea(5.0);
double circumference = MathUtils.calculateCircumference(5.0);
```

```java
class Circle {
    private final double radius;  // 데이터
    
    public Circle(double radius) {
        this.radius = radius;
    }
    
    public double getArea() {      // 행동
        return Math.PI * radius * radius;
    }
    
    public double getCircumference() {  // 행동
        return 2 * Math.PI * radius;
    }
}

// 사용
Circle circle = new Circle(5.0);
double area = circle.getArea();           // 데이터와 행동이 함께!
double circumference = circle.getCircumference();
```

- 데이터(radius)와 행동(`getArea`, `getCircumference`)이 함께 있다 
- 한번 생성하면 여러 연산 가능
- 더 직관적이고 이해 쉽다. 

언제 Static 유틸리티 클래스가 괜찮은가?
- 기본 타입이나 배열에 대한 연산 
- 팩토리 메서드 모음
- 인터페이스 구현체들을 위한 유틸리티 

결론 
Static 유틸리티 클래스가 "객체지향적이지 않은 이유" 
- 데이터와 행동을 분리 
- 객체의 상태와 책임을 무시 
- 절차지향적 사고를 조장 

적절한 곳에 사용하는 경우 
- 상태가 없는 순수 함수들 
- 여러 타입에 공통으로 적용되는 유틸리티 
- 팩토리 메서드 모음 


## Item5. Prefer dependency injection to hardwiring resources. 


## Item6. Avoid creating unnecessary objects.
불필요한 객체 생성 방지. 가능하면 재사용. 

## Item7. Eliminiate obsolete object refrences.

- 가비지 컬렉터는 만능이 아니다. 참조가 남아있을 경우 정리 대상이 아님. 
- 연쇄 누수 가능성. 하나의 참조가 많은 객체를 살려 둘 수 있다. 
- 자료구조 구현시 특히 주의해야된다. Array기반 구조에서 자주 발생. 





## Item8. Avoid finalizers and cleaners.

- Finalizer / Cleaner 는 자동 리소스 정리를 위한 매커니즘 

메모리 관리 방식 
- 수동 (C / C++)
```C
// C 언어 예시
void someFunction() {
    // 메모리 할당
    char* buffer = malloc(1024);
    FILE* file = fopen("data.txt", "r");
    
    // 작업 수행...
    
    // 반드시 수동으로 해제해야 함!
    free(buffer);    // 메모리 해제
    fclose(file);    // 파일 닫기
}
// 만약 free(), fclose()를 깜빡하면 → 메모리 누수!
```
- 자동 (Java, Dart) 

```java
// Java 예시
void someFunction() {
    String text = "Hello";  // 메모리 할당
    // 함수 끝나면 자동으로 가비지 컬렉터가 메모리 해제!
}
```

C++ Destructor
- 예측 가능: 객체가 스코프를 벗어나면 즉시 호출 
- 안전함: 예외가 발생해도 호출됨. 

Java finalizer의 문제 
- Java는 GC언어라서 언제 객체가 해제될지 모름. 
- 따라서 예측 불가능함. 
- 성능 문제 
- 위험함 
 
Java Cleaner 
- 예외가 전파되지 않음
- 더 나은 성능
- 하지만 여전히 예측 불가능 

python의 `__del__` 이 비슷한 개념 

dart / Flutter의 경우에는 dispose 

Dart : try-finally 또는 using 패턴 






## Item9. Prefer try-catch resources to try-finally



