---
title: Hello, Python
estimatedMinutes: 10
summary: Your first program, printing text, and how the editor works.
---

# Hello, Python

Python is a language for telling computers what to do, written in a way that's close to plain English. Here is a complete Python program:

```python
print("Hello, world!")
```

`print` is a **function** — a named piece of behaviour. The text inside the quotes is a **string**, and the parentheses hand the string to `print`, which writes it to the screen.

## How exercises work

Below is your first exercise. You'll see an editor with some starter code and a console underneath.

- **Run** executes your code and shows whatever it prints. Use it as often as you like.
- **Submit** checks your code against the assignment. When every check passes, the exercise is complete.
- Stuck? Ask for a **hint**. After a few tries you can also reveal the solution.

:::widget type="code-exercise" id="ex-hello"
language: python
prompt: Change the program so it prints `Hello, Python!` instead of `Hello, world!`.
starterCode: |
  print("Hello, world!")
grading: output
cases:
  - {expectedOutput: "Hello, Python!"}
hints:
  - Only the text between the quotes needs to change.
  - Punctuation counts — don't forget the comma and the exclamation mark.
solution: |
  print("Hello, Python!")
explanation: '`print` shows exactly what is between the quotes — Python does not read or correct the text inside a string. And output grading compares character by character, so `Hello, Python!` and `Hello Python!` are different answers.'
:::

## Several lines

Each `print` writes one line. A program runs from top to bottom, one line after another.

```python
print("First")
print("Second")
```

Output:

```
First
Second
```

## Reading input

`input()` pauses the program, waits for a line of text, and hands it back as a string:

```python
name = input()
print("Hello, " + name + "!")
```

If the user types `Ada`, the program prints `Hello, Ada!`. In the exercises, the text the program reads comes from the **stdin** box in the console.

:::widget type="code-exercise" id="ex-three-lines"
language: python
prompt: |
  Write a program that reads a name and prints a three-line greeting. For the input `Ada` it should print:

  ```
  Hello, Ada!
  Welcome to Python.
  42
  ```

  The first line uses the name; the other two lines are always the same.
starterCode: |
  name = input()
  # print the three lines below
grading: output
outputMatch: lines
cases:
  - {name: Ada, stdin: Ada, expectedOutput: "Hello, Ada!\nWelcome to Python.\n42"}
  - {name: Grace, stdin: Grace, expectedOutput: "Hello, Grace!\nWelcome to Python.\n42"}
  - {name: Hidden name, stdin: Linus, expectedOutput: "Hello, Linus!\nWelcome to Python.\n42", hidden: true}
hints:
  - Three `print(...)` calls, one per line.
  - Build the first line with `"Hello, " + name + "!"`.
  - "Numbers don't need quotes: `print(42)` works."
solution: |
  name = input()
  print("Hello, " + name + "!")
  print("Welcome to Python.")
  print(42)
explanation: 'Each `print` call writes one line and then moves to the next, so three calls give three lines. Only the first line changes with the input, so it is the only one that uses `name`. `"Hello, " + name + "!"` glues three strings into one. And `print(42)` needs no quotes, because 42 is a number, not text.'
:::

:::note title="Comments"
Lines starting with `#` are **comments**. Python ignores them; they're notes for humans.
:::

:::widget type="multiple-choice" id="q-print"
prompt: What does `print("2 + 2")` display?
options:
  - text: '`2 + 2`'
    correct: true
    explanation: It's a string — Python prints the characters, it doesn't do the maths.
  - text: '`4`'
    explanation: That would be `print(2 + 2)`, without quotes.
  - text: An error
    explanation: '`print` can display any string, and `"2 + 2"` is a perfectly valid one. Nothing here is an error.'
hint: 'Look at the quotes. Is `2 + 2` a calculation here, or text?'
:::

:::checkpoint
:::
