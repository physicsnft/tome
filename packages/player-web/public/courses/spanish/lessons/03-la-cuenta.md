---
title: La cuenta — Numbers and Paying
estimatedMinutes: 15
summary: Numbers one to ten, prices, and asking for the bill.
---

# La cuenta — Numbers and Paying

## Uno a diez

:::widget type="ordering" id="cuenta-ordering"
prompt: Tap to listen, then put the numbers in order from one to ten.
items:
  - { text: uno, audio: assets/audio/uno.mp3 }
  - { text: dos, audio: assets/audio/dos.mp3 }
  - { text: tres, audio: assets/audio/tres.mp3 }
  - { text: cuatro, audio: assets/audio/cuatro.mp3 }
  - { text: cinco, audio: assets/audio/cinco.mp3 }
  - { text: seis, audio: assets/audio/seis.mp3 }
  - { text: siete, audio: assets/audio/siete.mp3 }
  - { text: ocho, audio: assets/audio/ocho.mp3 }
  - { text: nueve, audio: assets/audio/nueve.mp3 }
  - { text: diez, audio: assets/audio/diez.mp3 }
hint: '*Seis* and *siete* both start with *s*; *seis* comes first.'
explanation: 'Uno, dos, tres, cuatro, cinco, seis, siete, ocho, nueve, diez. Two pairs are easy to confuse: *seis* (6) and *siete* (7), and *nueve* (9) and *diez* (10). Prices are mostly built from these ten, so they are worth knowing cold.'
:::

## Prices

Prices are said as *euros con céntimos*: €3.50 is **tres euros con cincuenta**. You only need to catch the first number for now.

:::widget type="numeric-input" id="cuenta-precio-1"
audio:
  src: assets/audio/precio-1.mp3
  transcript: Son dos euros con ochenta.
  playLimit: 3
prompt: How many whole euros is the bill? Type just the number.
answer: 2
hint: 'Listen for the number word straight after *son*.'
explanation: '*Son **dos** euros con ochenta*: two euros and eighty cents, €2.80. Prices follow the pattern *son X euros con Y* — the euros first, then *con* and the cents.'
:::

:::widget type="numeric-input" id="cuenta-precio-2"
audio:
  src: assets/audio/precio-3.mp3
  transcript: Son siete euros con cincuenta.
  playLimit: 3
prompt: And this one?
answer: 7
hint: 'Listen for the number word after *son*. You learned the numbers from one to ten above.'
explanation: '*Son **siete** euros con cincuenta*: €7.50. *Siete* (7) is easy to confuse with *seis* (6). Listen for the second syllable, which *seis* does not have: SIE-te.'
:::

## A second conversation

::::listening src="assets/audio/dialogo-2.mp3" playLimit=2 speed="0.75,1"
:::transcript
— Buenas tardes. ¿Tienen zumo de naranja?
— Sí, claro. ¿Grande o pequeño?
— Pequeño, por favor. Y un cruasán.
— Muy bien. Son cuatro euros con veinte.
:::

:::widget type="multiple-choice" id="cuenta-dialogo-2-q1"
prompt: What time of day is it, and how do you know?
options:
  - text: Morning — the waitress says *buenos días*
    explanation: 'Nobody says *buenos días* in this conversation. Listen again to how it opens.'
  - text: Afternoon — the customer says *buenas tardes*
    correct: true
  - text: Night — they order a beer
    explanation: 'Nobody orders a beer — the customer asks for an orange juice and a croissant. Listen to the greeting instead.'
hint: 'Listen to the very first words of the conversation.'
explanation: 'The customer opens with *buenas tardes*, which is used from lunch until dark — so it is afternoon. The greeting is often the only clue to the time of day in a conversation, which is why it is worth getting right yourself.'
:::

:::widget type="multiple-choice" id="cuenta-dialogo-2-q2"
prompt: How much is the bill?
options:
  - text: "€3.50"
    explanation: '€3.50 was the bill in the first conversation — *tres euros con cincuenta*. This one is different.'
  - text: "€4.20"
    correct: true
  - text: "€4.50"
    explanation: 'The euros are right, but listen to the cents again — *con veinte*, not *con cincuenta*.'
hint: 'Listen for *son … euros con …* at the very end.'
explanation: '*Son cuatro euros con veinte*: four euros and twenty cents, €4.20. *Veinte* is 20 — one step beyond the numbers from this lesson, but it sounds like *twenty* if you listen for the *v*.'
:::
::::

## Asking for the bill

:::widget type="dictation" id="cuenta-dictado"
audio:
  src: assets/audio/dictado-2.mp3
  transcript: La cuenta, por favor.
  playLimit: 3
answer: La cuenta, por favor
hint: Four words; you know the last two already.
explanation: '*La cuenta, por favor* — the bill, please. *Cuenta* is feminine, so it takes *la*. The same word also means a bank account, and a story is *cuento*.'
:::

:::widget type="record" id="cuenta-habla"
prompt: Ask for the bill and say thank you.
model:
  src: assets/audio/modelo-cuenta.mp3
  transcript: La cuenta, por favor. Gracias.
  transcriptAfter: always
maxSeconds: 10
rubric:
  - "*Cuenta* has two syllables: **cuen**-ta"
  - I said *gracias* at the end
explanation: '*Cuenta* has two syllables, CUEN-ta. The *ue* is said together as one sound, not *cu-en-ta*. Ending with *gracias* is not optional in Spain; it is what makes the request polite rather than abrupt.'
:::

:::checkpoint
Greet, order, pay, leave. That is a whole café visit in Spanish — *¡hasta luego!*
:::
