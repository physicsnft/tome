---
title: Variables and Numbers
estimatedMinutes: 15
---

# Variables and Numbers

A **variable** is a name for a value. You create one with `=`:

```python
apples = 3
price = 0.5
total = apples * price
print(total)        # 1.5
```

Read `=` as *"becomes"*, not *"equals"*: `apples = 3` stores 3 under the name `apples`.

## Two kinds of numbers

| Type | Examples | Meaning |
|---|---|---|
| `int` | `3`, `-10`, `1000000` | whole numbers |
| `float` | `0.5`, `3.14`, `-2.0` | numbers with a decimal point |

Arithmetic works as you'd expect, with a few Python-specific operators:

```python
print(7 + 2)    # 9
print(7 - 2)    # 5
print(7 * 2)    # 14
print(7 / 2)    # 3.5   (division always gives a float)
print(7 // 2)   # 3     (floor division: drops the remainder)
print(7 % 2)    # 1     (modulo: the remainder)
print(7 ** 2)   # 49    (power)
```

:::widget type="numeric-input" id="q-modulo"
prompt: What is `17 % 5`?
answer: 2
hint: '`%` gives the remainder after division. 17 = 3 × 5 + ?'
explanation: '17 = 3 × 5 + 2. `%` gives what is left over after dividing, so `17 % 5` is `2`. It is how you test divisibility: `n % 5 == 0` means nothing is left over.'
:::

:::widget type="numeric-input" id="q-floor"
prompt: What is `17 // 5`?
answer: 3
hint: How many whole times does 5 fit into 17?
explanation: '5 fits into 17 three whole times (3 × 5 = 15), so `17 // 5` is `3`. The leftover 2 is what `%` gives. The two always fit together: `(17 // 5) * 5 + 17 % 5 == 17`.'
:::

## Updating a variable

A variable can be reassigned, and it can be reassigned using its own old value:

```python
count = 0
count = count + 1   # count is now 1
count += 1          # shorthand for the same thing; count is now 2
```

:::warning title="Order matters"
The right side of `=` is computed **first**, using the old value. Only then is the result stored.
:::

## Exercise: shopping total

:::widget type="code-exercise" id="ex-shopping"
language: python
prompt: |
  Write a function `total_price(quantity, unit_price, tax_rate)` that returns the total cost including tax.

  | call | result | why |
  |---|---|---|
  | `total_price(2, 10.0, 0.2)` | `24.0` | 2 × 10 = 20, plus 20 % tax |
  | `total_price(3, 5.0, 0.0)` | `15.0` | no tax |
starterCode: |
  def total_price(quantity, unit_price, tax_rate):
      # your code here
      pass


  print(total_price(2, 10.0, 0.2))
tests:
  - name: Example from the prompt
    code: assert_equal(round(total_price(2, 10.0, 0.2), 6), 24.0)
  - name: No tax
    code: assert_equal(round(total_price(3, 5.0, 0.0), 6), 15.0)
  - name: Zero quantity
    code: assert_equal(total_price(0, 99.0, 0.5), 0)
  - name: Program prints the example
    code: assert_equal(__stdout__.strip(), "24.0")
  - name: Large numbers
    hidden: true
    code: assert_equal(round(total_price(1000, 1.25, 0.07), 4), 1337.5)
hints:
  - "Start with the subtotal: `quantity * unit_price`."
  - Adding 20 % tax is the same as multiplying by `1 + 0.2`.
  - Replace `pass` with `return subtotal * (1 + tax_rate)`.
solution: |
  def total_price(quantity, unit_price, tax_rate):
      subtotal = quantity * unit_price
      return subtotal * (1 + tax_rate)


  print(total_price(2, 10.0, 0.2))
explanation: 'The subtotal is `quantity * unit_price`. Adding tax at rate *r* means adding *r* times the subtotal: `subtotal + subtotal * r`, which is `subtotal * (1 + r)`. A function must `return` its result. Printing it inside would show the number, but the caller would get `None`.'
:::

:::widget type="fill-blank" id="q-types"
text: The result of `10 / 2` is `{{=5}}`, which has type `{{float}}`. The result of `10 // 2` is `{{=5}}`, which has type `{{int}}`.
hint: '`/` and `//` are different operators. One always gives a decimal number; the other rounds down to a whole one.'
explanation: '`/` always produces a `float`, even when the division comes out exact, so `10 / 2` is `5.0`. `//` is floor division: with two `int`s it gives an `int`, so `10 // 2` is `5`. The value is the same; the type is not.'
:::

:::checkpoint
:::
