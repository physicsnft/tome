---
title: Decisions and Loops
estimatedMinutes: 20
---

# Decisions and Loops

So far every program ran every line exactly once, top to bottom. Real programs make **decisions** and **repeat** things.

## `if`, `elif`, `else`

```python
temperature = 23

if temperature > 30:
    print("Hot")
elif temperature > 15:
    print("Pleasant")
else:
    print("Cold")
```

The **indented** lines belong to the branch above them. Indentation isn't decoration in Python — it's how the language knows where a block starts and ends.

Comparison operators: `==` (equal), `!=` (not equal), `<`, `<=`, `>`, `>=`. Combine conditions with `and`, `or`, `not`.

:::widget type="multiple-choice" id="q-if"
prompt: With `temperature = 15`, what does the program above print?
options:
  - text: '`Cold`'
    correct: true
    explanation: 15 is not greater than 15, so the `elif` fails and `else` runs.
  - text: '`Pleasant`'
    explanation: '`15 > 15` is `False`.'
  - text: Nothing
    explanation: 'An `if`/`elif`/`else` chain always runs exactly one branch. When every condition is false, `else` catches it, so something is always printed.'
hint: 'Check each condition in order with 15. Is `15 > 15` true?'
explanation: '`15 > 30` is false, and so is `15 > 15` — a number is not greater than itself. Both conditions fail, so the `else` branch runs and prints `Cold`. For `Pleasant` at 15 the condition would need `>=`.'
:::

## `for` loops

A `for` loop runs a block once for each item in a sequence:

```python
for fruit in ["apple", "banana", "cherry"]:
    print(fruit)
```

To loop over numbers, use `range`:

```python
for i in range(5):      # 0, 1, 2, 3, 4
    print(i)

for i in range(1, 6):   # 1, 2, 3, 4, 5
    print(i)
```

:::important
`range(n)` starts at 0 and stops **before** `n`. `range(5)` has five numbers, and the last one is 4.
:::

:::widget type="numeric-input" id="q-range-sum"
prompt: What is the sum of all numbers produced by `range(1, 5)`?
answer: 10
hint: '`range(1, 5)` is 1, 2, 3, 4.'
explanation: '`range(1, 5)` starts at 1 and stops *before* 5, giving 1, 2, 3, 4. Their sum is 10. The end is excluded for the same reason as in a slice: `range(a, b)` produces exactly b − a numbers.'
:::

## `while` loops

A `while` loop repeats as long as a condition is true:

```python
n = 1
while n < 100:
    n = n * 2
print(n)    # 128
```

:::warning title="Infinite loops"
If the condition never becomes false, the loop never ends. In this app a runaway loop is stopped by the time limit, but in real programs it can freeze your computer. Always make sure something inside the loop moves it toward stopping.
:::

## Putting it together: FizzBuzz

The classic. For each number from 1 to `n`:

- print `Fizz` if it's divisible by 3,
- `Buzz` if it's divisible by 5,
- `FizzBuzz` if it's divisible by both,
- otherwise the number itself.

:::widget type="code-exercise" id="ex-fizzbuzz"
language: python
prompt: |
  Write a function `fizzbuzz(n)` that **returns** a string for a single number:

  - `"Fizz"` if `n` is divisible by 3,
  - `"Buzz"` if divisible by 5,
  - `"FizzBuzz"` if divisible by both,
  - otherwise the number itself, as a string.

  The starter code already prints `fizzbuzz(i)` for 1 to 15, so you can check your work with **Run**.
starterCode: |
  def fizzbuzz(n):
      # your code here
      pass


  for i in range(1, 16):
      print(fizzbuzz(i))
tests:
  - name: Multiples of 3
    code: |
      assert_equal(fizzbuzz(3), "Fizz")
      assert_equal(fizzbuzz(9), "Fizz")
  - name: Multiples of 5
    code: |
      assert_equal(fizzbuzz(5), "Buzz")
      assert_equal(fizzbuzz(20), "Buzz")
  - name: Multiples of both
    code: |
      assert_equal(fizzbuzz(15), "FizzBuzz")
      assert_equal(fizzbuzz(30), "FizzBuzz")
  - name: Other numbers are returned as strings
    code: |
      assert_equal(fizzbuzz(7), "7")
      assert_equal(fizzbuzz(1), "1")
  - name: Program prints 15 lines ending in FizzBuzz
    code: |
      lines = __stdout__.strip().splitlines()
      assert_equal(len(lines), 15)
      assert_equal(lines[-1], "FizzBuzz")
  - name: Large inputs
    hidden: true
    code: |
      assert_equal(fizzbuzz(3000), "FizzBuzz")
      assert_equal(fizzbuzz(3001), "3001")
      assert_equal(fizzbuzz(3003), "Fizz")
hints:
  - Check for divisibility by 15 **first**, otherwise the 3 or 5 case will win.
  - "Use the `%` operator: `n % 3 == 0` means divisible by 3."
  - For the default case, convert the number with `str(n)`.
solution: |
  def fizzbuzz(n):
      if n % 15 == 0:
          return "FizzBuzz"
      elif n % 3 == 0:
          return "Fizz"
      elif n % 5 == 0:
          return "Buzz"
      else:
          return str(n)


  for i in range(1, 16):
      print(fizzbuzz(i))
explanation: 'Order is the whole trick. A number divisible by both 3 and 5 is divisible by 15. If the `% 3` test came first, 15 would return `"Fizz"` and never reach the FizzBuzz case. So test the most specific condition first. Each branch also *returns* a string, including `str(n)`, so the function always gives the same type back.'
:::

## Bonus: counting with a loop

:::widget type="code-exercise" id="ex-count-vowels"
language: python
prompt: |
  Write `count_vowels(text)` that returns how many vowels appear in `text`.

  - Vowels are `a`, `e`, `i`, `o`, `u`.
  - Upper case counts too: `count_vowels("AEIOU")` is `5`.
starterCode: |
  def count_vowels(text):
      count = 0
      # loop over each character in text
      return count


  print(count_vowels("Hello World"))   # should print 3
tests:
  - name: Simple sentence
    code: assert_equal(count_vowels("Hello World"), 3)
  - name: Upper case counts
    code: assert_equal(count_vowels("AEIOU"), 5)
  - name: No vowels
    code: assert_equal(count_vowels("rhythm"), 0)
  - name: Pangram
    hidden: true
    code: assert_equal(count_vowels("The quick brown fox jumps over the lazy dog"), 11)
hints:
  - "`for ch in text:` visits every character."
  - "`ch.lower() in 'aeiou'` is True for a vowel in any case."
solution: |
  def count_vowels(text):
      count = 0
      for ch in text:
          if ch.lower() in "aeiou":
              count += 1
      return count


  print(count_vowels("Hello World"))
explanation: '`for ch in text` visits each character once, and `ch.lower() in "aeiou"` asks whether it is a vowel. Lower-casing the character, not the vowel list, is what makes `"AEIOU"` count. Anything else, such as spaces, punctuation and `y`, is simply not counted.'
:::

## Review

:::widget type="ordering" id="q-order-exec"
prompt: Put the steps of a `while` loop in the order Python performs them.
items:
  - Evaluate the condition
  - If it is true, run the indented block
  - Go back to the top
  - If it is false, continue after the loop
hint: 'The condition is checked before the block runs — every time, including the first.'
explanation: 'A `while` loop checks first and acts second. It evaluates the condition. If true, it runs the block, then goes back and checks again. Only when the condition comes out false does it continue after the loop. That means a loop whose condition is false at the start runs zero times.'
:::

:::widget type="flashcards" id="review-cards"
cards:
  - front: '`range(3)`'
    back: '`0, 1, 2`'
  - front: '`7 // 2` and `7 % 2`'
    back: '`3` and `1`'
  - front: What marks a block in Python?
    back: Indentation (usually 4 spaces)
  - front: f-string
    back: '`f"…{expression}…"` — text with values filled in'
  - front: '`==` vs `=`'
    back: '`==` compares; `=` assigns'
spaced: true
:::

:::checkpoint
You can now write programs that store values, make decisions and repeat work — that's the core of every program ever written.
:::
