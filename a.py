def check(sentence):
    stack = []
    for string in list(sentence):
        if string == "(" or string == "[":
            stack.append(string)
            continue
        if string == ")":
            if not stack or stack.pop() != "(":
                return 'no'
        if string == "]":
            if not stack or stack.pop() != ']':
                return 'no'
    return 'yes'


def main():
    stack = []
    while True:
        sentence = input()
        if sentence == '.':
            return
        print(check(sentence))


if __name__ == "__main__":
    main()
