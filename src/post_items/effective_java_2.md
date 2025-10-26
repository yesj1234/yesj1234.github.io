---
title: Effective Java 2.
description: Methods common to all objects.
author: jack
published: false
date: 2025. 10. 26.
tags: ['Object Programming', 'Java']
---

## Effective Java Chapter 3 - Methods Common to All Objects

## Study Notes and Key Concepts

## 📚 Core Concepts

### 동치 관계 (Equivalence Relation)

동치관계는 집합을 동치류라는 부분집합들로 분할하는 수학적 개념으로, 다음 세 가지 속성을 만족해야 합니다:

- **반사성(Reflexivity)**: 모든 객체는 자기 자신과 같다
- **대칭성(Symmetry)**: x가 y와 같으면, y도 x와 같다  
- **추이성(Transitivity)**: x가 y와 같고 y가 z와 같으면, x는 z와 같다

### 동치류 (Equivalence Class)

동치관계는 집합을 **동치류**라는 부분집합들로 분할합니다:

- 같은 동치류 내의 원소들은 서로 같다고 간주
- 다른 동치류의 원소들은 서로 다르다고 간주
- 모든 원소는 정확히 하나의 동치류에만 속함

**예시:**

- 정수의 모듈로 연산: `mod 3`에서 `{0,3,6,9...}`, `{1,4,7,10...}`, `{2,5,8,11...}`
- 기하학의 합동/닮음: 도형 간의 합동 관계는 동치 관계

---

## 🔧 핵심 메서드 구현

### 1. hashCode에서 31을 곱하는 이유

#### 비트 시프트 연산 분해

```java
i << 5  // i를 왼쪽으로 5비트 시프트
        // = i × 2^5 
        // = i × 32

(i << 5) - i  // (i × 32) - i
              // = 32i - i
              // = 31i
```

#### 구체적인 예시

```java
// i = 10일 때
int i = 10;  // 이진수: 0000 1010

// Step 1: i << 5 (왼쪽으로 5비트 시프트)
i << 5  // 0000 1010 << 5
        // 0001 0100 0000
        // = 320 (10 × 32)

// Step 2: (i << 5) - i
(i << 5) - i  // 320 - 10
              // = 310
              // = 31 × 10
```

#### 성능 최적화

```java
// 방법 1: 직접 곱셈
result = 31 * i;  
// CPU의 MUL 명령어 사용 (느림)

// 방법 2: 비트 연산
result = (i << 5) - i;  
// SHL 명령어 + SUB 명령어 (빠름)
```

**CPU 사이클 비교 (대략적):**
- 곱셈(MUL): 3-4 사이클
- 시프트(SHL) + 뺄셈(SUB): 1-2 사이클

#### 다른 수들의 최적화 패턴

```java
// 31 = 32 - 1 = 2^5 - 1
31 * i = (i << 5) - i

// 63 = 64 - 1 = 2^6 - 1
63 * i = (i << 6) - i

// 15 = 16 - 1 = 2^4 - 1
15 * i = (i << 4) - i

// 33 = 32 + 1 = 2^5 + 1
33 * i = (i << 5) + i

// 127 = 128 - 1 = 2^7 - 1
127 * i = (i << 7) - i
```

#### JVM 최적화

현대 JVM(HotSpot 등)은 이런 최적화를 자동으로 수행합니다:

```java
// 개발자가 작성한 코드
result = 31 * result + c;

// JVM이 내부적으로 변환
result = ((result << 5) - result) + c;

// 실제 기계어 (x86 어셈블리 예시)
// SHL EAX, 5    ; result를 5비트 왼쪽 시프트
// SUB EAX, EBX  ; 원래 값을 빼기
// ADD EAX, ECX  ; c를 더하기
```

---

### 2. getClass() 메서드

#### getClass()란?

`getClass()`는 **Object 클래스에 정의된 final 메서드**로, 객체의 런타임 클래스 정보를 반환합니다.

```java
public final native Class<?> getClass();
```

#### 기본 사용법

```java
String str = "Hello";
Class<?> clazz = str.getClass();
System.out.println(clazz.getName());  // java.lang.String

Integer num = 42;
Class<?> numClass = num.getClass();
System.out.println(numClass.getName());  // java.lang.Integer
```

#### getClass() vs .class

```java
// getClass(): 런타임에 실제 객체의 클래스
Object obj = "Hello";
Class<?> c1 = obj.getClass();  // String.class (실제 타입)

// .class: 컴파일 타임의 타입
Class<?> c2 = Object.class;     // Object.class (선언된 타입)
Class<?> c3 = String.class;     // String.class

System.out.println(c1 == String.class);  // true
System.out.println(c1 == Object.class);  // false
```

#### equals() 구현에서의 활용

**instanceof vs getClass() 비교:**

```java
// 1. instanceof 사용 (리스코프 치환 원칙 준수)
public class Point {
    private int x, y;
    
    @Override
    public boolean equals(Object obj) {
        if (!(obj instanceof Point))
            return false;
        Point p = (Point) obj;
        return x == p.x && y == p.y;
    }
}

// 2. getClass() 사용 (정확한 타입 매칭)
public class Point {
    private int x, y;
    
    @Override
    public boolean equals(Object obj) {
        if (obj == null || obj.getClass() != this.getClass())
            return false;
        Point p = (Point) obj;
        return x == p.x && y == p.y;
    }
}
```

#### getClass()의 특징

1. **final 메서드**: 오버라이드 불가
2. **native 메서드**: JVM이 직접 구현
3. **null 안전하지 않음**: null에서 호출하면 NullPointerException
4. **항상 실제 타입 반환**: 선언 타입이 아닌 런타임 타입

---

### 3. 공변 반환 타입 (Covariant Return Type)

Java 5부터 도입된 기능으로, 메서드를 오버라이딩할 때 원래 반환 타입의 하위 타입을 반환할 수 있게 해주는 기능입니다.

#### 기본 예제

```java
// Java 5 이후 (공변 반환 타입)
class Animal {
    public Animal reproduce() {
        return new Animal();
    }
}

class Dog extends Animal {
    @Override
    public Dog reproduce() {  // ✅ Dog 반환 가능!
        return new Dog();
    }
}

// 사용 시 타입 캐스팅 불필요
Dog parent = new Dog();
Dog puppy = parent.reproduce();  // 캐스팅 없이 Dog 타입!
```

---

## 🏗️ 설계 원칙

### 리스코프 치환 원칙 (Liskov Substitution Principle, LSP)

**"서브타입은 언제나 자신의 기반 타입(부모 타입)으로 교체할 수 있어야 한다"**

1987년 Barbara Liskov가 제시한 원칙으로, SOLID 원칙 중 'L'에 해당합니다.

#### 핵심 개념

```java
// 부모 타입의 변수에 자식 객체를 할당해도
// 프로그램의 정확성이 깨지면 안 됨
Parent parent = new Child();  
parent.doSomething();  // Child가 Parent를 제대로 대체해야 함
```

#### 위반 사례 1: 정사각형 vs 직사각형

**잘못된 설계:**

```java
class Rectangle {
    protected int width;
    protected int height;
    
    public void setWidth(int width) {
        this.width = width;
    }
    
    public void setHeight(int height) {
        this.height = height;
    }
    
    public int getArea() {
        return width * height;
    }
}

class Square extends Rectangle {  // 정사각형 IS-A 직사각형?
    @Override
    public void setWidth(int width) {
        this.width = width;
        this.height = width;  // 정사각형은 가로=세로
    }
    
    @Override
    public void setHeight(int height) {
        this.width = height;  // 정사각형은 가로=세로
        this.height = height;
    }
}

// LSP 위반 증명
public void testRectangle(Rectangle rect) {
    rect.setWidth(5);
    rect.setHeight(4);
    
    // 직사각형이면 5 × 4 = 20이어야 함
    assert rect.getArea() == 20;  // Square에서는 16이 됨! ❌
}
```

**올바른 설계:**

```java
// 공통 인터페이스로 추상화
interface Shape {
    int getArea();
}

class Rectangle implements Shape {
    private final int width;
    private final int height;
    
    public Rectangle(int width, int height) {
        this.width = width;
        this.height = height;
    }
    
    @Override
    public int getArea() {
        return width * height;
    }
}

class Square implements Shape {
    private final int side;
    
    public Square(int side) {
        this.side = side;
    }
    
    @Override
    public int getArea() {
        return side * side;
    }
}
```

#### LSP를 지키기 위한 규칙

**1. 계약 규칙(Design by Contract):**

```java
interface Account {
    /**
     * 사전조건: amount > 0
     * 사후조건: balance가 amount만큼 증가
     * 불변조건: balance >= 0
     */
    void deposit(double amount);
}

class SavingsAccount implements Account {
    @Override
    public void deposit(double amount) {
        // ✅ 사전조건 동일하거나 약화 (amount >= 0도 OK)
        // ✅ 사후조건 동일하거나 강화
        // ✅ 불변조건 유지
    }
}
```

**2. Tell, Don't Ask 원칙:**

```java
// 나쁜 예 - 타입을 물어보고 처리
if (shape instanceof Square) {
    Square s = (Square) shape;
    return s.getSide() * s.getSide();
} else if (shape instanceof Rectangle) {
    Rectangle r = (Rectangle) shape;
    return r.getWidth() * r.getHeight();
}

// 좋은 예 - 다형성 활용
return shape.getArea();  // 구체적 타입을 몰라도 됨
```

#### LSP의 이점

1. **코드 재사용성**: 부모 타입으로 작성한 코드를 모든 자식에 적용
2. **확장성**: 새로운 서브타입 추가가 기존 코드에 영향 없음
3. **테스트 용이성**: 부모 클래스 테스트를 자식이 상속
4. **유지보수성**: 일관된 동작으로 예측 가능한 코드

---

## 📊 Freezed와 Effective Java 비교

### Freezed 생성 코드 평가

Freezed가 생성한 Dart 코드를 Effective Java의 관점에서 분석한 결과:

| 메서드 | Effective Java 준수도 | 평가 |
|--------|---------------------|------|
| equals | ✅✅✅✅✅ | 완벽히 준수 |
| hashCode | ✅✅✅✅✅ | 완벽히 준수 |
| toString | ✅✅✅✅✅ | 완벽히 준수 |
| clone/copyWith | ✅✅✅✅✅ | copyWith가 더 우수한 대안 |
| Comparable | ❌ | 미구현 (필요시 추가) |

### 결론

Freezed는 Effective Java의 권고사항을 매우 잘 따르고 있으며, 일부는 더 개선된 방식으로 구현합니다:

1. **equals/hashCode**: 자동 생성으로 실수 방지
2. **toString**: 디버깅에 최적화된 형식
3. **copyWith > clone**: 더 안전하고 유연한 복사 메커니즘
4. **불변성**: 기본적으로 불변 객체 생성
5. **보일러플레이트 제거**: 수동 구현의 실수 가능성 제거

---

## 💡 핵심 정리

리스코프 치환 원칙은 **"상속은 IS-A 관계가 아니라 IS-SUBSTITUTABLE-FOR 관계"**라고 이해하면 됩니다.

단순히 "펭귄은 새다"라는 현실 세계의 분류가 아니라, "펭귄 객체가 새 객체를 완벽히 대체할 수 있는가?"를 고민해야 합니다. LSP를 위반하면 다형성이 깨지고, 예상치 못한 버그가 발생하므로 상속 설계 시 반드시 고려해야 합니다.