---
title: Practice Dart - exercises for beginners (2)
description: Exercises to practice Dart.
author: jack
published: true
date: 2024. 09. 09.
tags: ['Dart']
---

# Table of contents

# Excercice2

## **Description**

출처: https://hackmd.io/@kuzmapetrovich/S1x90jWGP 연습문제 16번 ~ 20번 문제입니다.

1. Draw the tic tac toe game board (3x3)
2. Check whether the board has a winner
3. Handle a player move from user input

틱택토 게임을 만들어보는 문제입니다. 틱택토는 두 명의 플레이어가 번갈아 가며 게임판에 마킹을 해 가로나 세로 혹은 대각선에 먼저 한 줄을 채우는 사람이 이기는 게임입니다. 구현을 위해선 다음의 사항을 구현해야 합니다.

1. 콘솔에 게임판 표시하기.
2. 사용자로부터 번갈아 입력 받아 게임판에 표시하기. 입력은 좌표로 받음.
3. 현재 게임판에 승자가 있는지 확인하고 승자가 있다면 누가 승자인지 표시하기.

각 단계를 함수로 구분하여 구현해보도록 하겠습니다.

## main code

```dart
import 'dart:io';

void main() {
  // console에 현재 게임의 상태를 표시하기 위한 함수입니다.
  void drawBoard(List<List<int>> board) {
    String upperUnit = " ---";
    String sideUnit = "|";
    int boardSize = board.length;
    List<String> currentUpperUnit = List.generate(boardSize, (_) => upperUnit);
    for (var i = 0; i < boardSize; i++) {
      List<String> sideUnitWithItem = List.generate(boardSize, (index) => "$sideUnit ${board[index][i]} ");
      sideUnitWithItem.add(sideUnit);
      print(currentUpperUnit.join(''));
      print(sideUnitWithItem.join(''));
    }
    print(currentUpperUnit.join(''));
  }

  // 현재 상태에 승자가 있는지를 확인하는 함수입니다.
  int checkBoard(List<List<int>> board) {
      int size = board.length;
      int checkRow(List<List<int>> board) {
        for (var i = 0; i < size; i++) {
          Set curRow = Set.from(board[i]);
          if (curRow.length == 1 && !curRow.contains(0)) {
            return curRow.elementAt(0);
          }
        }
        return 0;
      }

      int checkColumn(List<List<int>> board) {
        for (var i = 0; i < size; i++) {
          var curColumn = <int>{};
          for (var j = 0; j < size; j++) {
            curColumn.add(board[i][j]);
          }
          if (curColumn.length == 1 && !curColumn.contains(0)) {
            return curColumn.elementAt(0);
          }
        }
        return 0;
      }
      int checkDiagonal(List<List<int>> board) {
        var fromLeft = <int>{};
        for (var i = 0; i < size; i++) {
          fromLeft.add(board[i][i]);
        }
        if (fromLeft.length == 1 && !fromLeft.contains(0)) {
          return fromLeft.elementAt(0);
        }
        var fromRight = <int>{};
        for (var i = size; i < 0; i--) {
          fromRight.add(board[i][i]);
        }
        if (fromRight.length == 1 && !fromRight.contains(0)) {
          return fromRight.elementAt(0);
        }
        return 0;
      }
      if (checkRow(board) != 0) return checkRow(board);
      if (checkColumn(board) != 0) return checkColumn(board);
      if (checkDiagonal(board) != 0) return checkDiagonal(board);
      return 0;
  }

  // 사용자로부터 어느 위치에 말을 놓을 것인지 좌표형태로 입력받습니다.
  List<List<int>> gameBoard = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  print(
      """
      Welcome to tic tac toe. Type 'exit' to end the game.
      Each player can type where to put the mark on the game board with coordinates.
      For example, if the player wants to put mark on left upper side of the game board,
      type 0,0
      """);
  var curPlayer = 1;
  while (true) {
    drawBoard(gameBoard);
    stdout.write("Player$curPlayer: ");
    var userInput = stdin.readLineSync();
    if (userInput == 'exit') {
      print("Bye!");
      break;
    }
    if (userInput != null) {
      var coordinate = [];
      userInput.split(",").forEach((e) => coordinate.add(int.parse(e.trim())));
      print(curPlayer);
      gameBoard[coordinate[0]][coordinate[1]] = curPlayer;
      var status = checkBoard(gameBoard);

      if (status == 1 || status == 2) {
        print("Congratulations! The winner is Player$curPlayer.");
        drawBoard(gameBoard);
        break;
      }
    }

    curPlayer = (curPlayer == 1) ? 2 : 1;
  }

}
```

## Used APIs

구현하는데 사용할 api들을 살펴보고 가도록 하겠습니다. 굳이 사용하지 않아도 for문과 if문을 이용해 구현할 수도 있지만 알고 있다면 코드가 좀 더 간결해지고 가독성이 좋아지는 api들입니다.

### List.generate

```dart
List.generate(
    int length,
    E generator(int index),
    {bool growable: true}
)
```

> generates a list of values
> Creates a list with length positions and fills it with values created by calling `generator` for each index in the range from `0` ... `length -1` in increasing order.
>
> **Example**
>
> ```dart
> List<int> a = List.generate(3, (int index) => index * index); // [0, 1, 4]
> ```

위의 예시를 List.generate를 사용하지 않고 구현하기 위해서는 다음과 같이 for문을 사용하면 될 것 같습니다.

```dart
void main() {
  List<int> a = [];
  int length = 3;
  for (var i = 0; i < length; i++) {
    a.add(i * i);
  }
  print(a); // [0, 1, 4]
}
```

### List.contains

> ```dart
> bool contains(
>    Object elements
> )
> ```
>
> Returns true if the collection contains an element equal to the element.
> This operation will check each element in order for being equal to element, unless it has more efficient way to find an element equal to the element.
> The equality used to determine whether element is equal to an element defaults to the Object.operator== of the element.
> Some types of the element may have a different equality used for its element. For example, a Set may have a custom equality(Set.identical) that its contain uses.
> Likewise, the iterable returned by a Map.keys call should use the same eqaulity that the Map uses for keys.

List, set, map 과 같은 collection 안에 element가 존재하는지 여부를 확인하는 api입니다. 기본적으로 == 연산자를 사용하여 element와의 비교를 통해 존재여부를 체크합니다.
== 연산자 이외의 동등성을 체크하는 별도의 함수를 사용하는 경우가 있을수도 있는 것 같습니다. Set.identical을 추가적으로 공부해보면 좋을 것 같습니다.

기본적인 사용법은 다음과 같이 사용하면 될 것 같습니다.

```dart
List<String> names = ['jack', 'daniel', 'amber'];
print(names.contains('jack')); // true
print(name.contains('sparrow')); // false
```

만약 contains를 사용하지 않고 구현한다면 다음과 같이 할 수 있을것입니다.

```dart
List<string> names = ['jack', 'daniel', 'amber'];
for (var name in names) {
    if (name == 'jack') {
        print(true);
    }
}
print(false);
```

### List.elementAt

```dart
E elementAt(
    int index
)
```

> Returns the `index`th element.
> The `index` must be non-negative and less than length. index zero represents the first element(so iterable.elementAt(0) is equivalent to iterable.first)
> May iterate through the elements in iteration order, skipping the first index elements and returning the next.  
> Some iterable may have more efficient ways to find the element.

함수의 인자로 들어간 index번째 element를 반환하는 api입니다. 경우에 따라서는 순서대로 iteration을 도는게 아니라 효율적인 방식으로 element를 반환할 수도 있는 것 같습니다(?).

예시

```dart
import 'dart:math';
var random = Random();
List<int> randomNumbers = List.generate(10, (_) => random.nextInt(100));
print(randomNumbers.elementAt(randomNumbers.length-1));
```

랜덤하게 생성된 리스트의 마지막 element를 알 수 있습니다. 물론 위의 예시의 경우 List를 사용했기 때문에 굳이 elementAt이 아니라 []를 사용한 direct indexing이 훨씬 간결하고 효율적입니다.
하지만 direct indexing이 안되는 iterable의 특정 index번째에 있는 element를 확인하기 위해서는 elementAt의 사용이 효과적일 수 있습니다.

### List.add

```dart
void add(E value)
```

> Adds value to the end of this list, extending the length by one.
> The list must be growable.

List의 맨 뒤에 value를 추가하는 api입니다. 고정된 사이즈의 List에는 사용할 수 없는 것 같습니다. 기존 리스트에 값을 추가하는 것이고 반환값은 없습니다.

## Used properties

### List.length

```dart
//override
int length
```

> The number of objects in this list.
> The valid indices for a list are 0 through length - 1.

_Implementation_

```dart
int get length;
set length(newLength);
```

List class의 length라는 이름의 getter와 setter가 있습니다. length를 이용해서 현재 List안에 포함된 object들의 개수를 확인할 수도 있고(getter) List의 전체 길이를 조절할 수도 있습니다(setter). 길이를 조절하는 경우에는 기존 length보다 큰 값을 설정해야 하며 null로 초기화됩니다.

### String.split

```dart
List<String> split(
    Pattern pattern
)
```

> Split the string at matches of `pattern` and returns a list of substrings
> Finds all the matches of pattern in this string, and returns the list of substrings between the matches.

String을 특정 패턴(정규표현식 등)을 기준으로 구분하여 String들의 List로 반환해줍니다. Pattern에 빈값('')을 넣어준다면 모든 단어들이 쪼개진 결과를 받을 수 있습니다.
예시

```dart
String names = "jack,michael,andrew,peter";
List<String> separatedNames = names.split(',');
print(separatedNames) // ["jack", "michael", "andrew", "peter"];
```
