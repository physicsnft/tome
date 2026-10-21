---
title: Strings
estimatedMinutes: 15
---

# Strings

A **string** is text. Strings go in quotes — single or double, it doesn't matter as long as they match.

```python
name = "Ada"
greeting = 'Hello'
```

## Combining strings

The `+` operator joins strings together:

```python
print(greeting + ", " + name + "!")    # Hello, Ada!
```

But mixing text and numbers with `+` is an error. Instead, use an **f-string**: put `f` before the opening quote and write expressions inside `{}`:

```python
age = 36
print(f"{name} is {age} years old.")   # Ada is 36 years old.
print(f"Next year: {age + 1}")         # Next year: 37
```

:::tip
f-strings are the modern, readable way to build text in Python. Reach for them first.
:::

## Useful string operations

```python
s = "Hello, World"
print(len(s))          # 12            — number of characters
print(s.upper())       # HELLO, WORLD
print(s.lower())       # hello, world
print(s.replace("World", "Python"))   # Hello, Python
print(s[0])            # H             — first character
print(s[-1])           # d             — last character
print(s[0:5])          # Hello         — characters 0 up to (not including) 5
print("World" in s)    # True
```

:::widget type="multiple-choice" id="q-slice"
prompt: What does `"Python"[1:4]` evaluate to?
options:
  - text: '`yth`'
    correct: true
    explanation: Indexes 1, 2, 3 — the end index is not included.
  - text: '`ytho`'
    explanation: The end index 4 is excluded.
  - text: '`Pyt`'
    explanation: Counting starts at 0, so index 1 is `y`.
hint: 'Indexes start at 0, and a slice stops just *before* its end index.'
explanation: 'Positions are 0 `P`, 1 `y`, 2 `t`, 3 `h`, 4 `o`, 5 `n`. A slice `[1:4]` starts at index 1 and stops before index 4, so it takes indexes 1, 2 and 3: `yth`. The length of a slice is always end minus start — here 4 − 1 = 3 characters.'
:::

:::widget type="matching" id="q-string-ops"
prompt: Match each expression with its result.
pairs:
  - left: '`len("abc")`'
    right: '`3`'
  - left: '`"abc".upper()`'
    right: '`"ABC"`'
  - left: '`"abc"[-1]`'
    right: '`"c"`'
  - left: '`"a" + "bc"`'
    right: '`"abc"`'
hint: '`[-1]` counts from the end. Negative indexes start at −1, not −0.'
explanation: '`len` counts characters: 3. `.upper()` returns a new string in capitals: `"ABC"`. A negative index counts from the end, so `[-1]` is the last character, `"c"`. And `+` joins strings end to end: `"abc"`.'
:::

## Exercise: initials

:::widget type="code-exercise" id="ex-initials"
language: python
prompt: |
  Write a function `initials(full_name)` that returns the initials in upper case, each followed by a dot.

  ```python
  initials("Ada Lovelace")          # "A.L."
  initials("Grace Brewster Hopper") # "G.B.H."
  initials("alan turing")           # "A.T."
  ```

  Names may have two or three parts, and may be in lower case.
starterCode: |
  def initials(full_name):
      # your code here
      pass


  print(initials("Ada Lovelace"))
tests:
  - name: Two-part name
    code: assert_equal(initials("Ada Lovelace"), "A.L.")
  - name: Three-part name
    code: assert_equal(initials("Grace Brewster Hopper"), "G.B.H.")
  - name: Lower-case input is capitalised
    code: assert_equal(initials("alan turing"), "A.T.")
  - name: Extra spaces
    hidden: true
    code: assert_equal(initials("  Linus   Torvalds "), "L.T.")
hints:
  - "`full_name.split()` gives you a list of the words — and it ignores extra spaces."
  - For each word, take `word[0].upper()`.
  - You can build the result with a loop and `+=`, adding a `"."` after each initial.
solution: |
  def initials(full_name):
      result = ""
      for word in full_name.split():
          result += word[0].upper() + "."
      return result


  print(initials("Ada Lovelace"))
explanation: '`split()` with no argument splits on any run of spaces and drops the empty pieces. That is why the hidden test with extra spaces passes. Then each word gives `word[0].upper()` plus a dot. Upper-casing only the first letter, instead of the whole word, keeps it working for `"alan turing"`.'
:::

:::details summary="Wait — what's a loop?"
You'll meet `for` loops properly in the next lesson. For now: `for word in words:` runs the indented lines once for each item in `words`.
:::

:::checkpoint
:::
