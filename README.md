# callbag-expr

Create expressions based on callbags.

```bash
npm i callbag-expr
```

<br>

👉 Expressions with callbags:

```ts
import interval from 'callbag-interval'
import pipe from 'callbag-pipe'
import subscribe from 'callbag-subscribe'
import expr from 'callbag-expr'

const a = interval(1000)

pipe(
  expr($ => 'Hellow: ' + $(a, 0)),
  subscribe(console.log)
)
```

[► TRY IT!](https://stackblitz.com/edit/callbag-expr-demo?devtoolsheight=33&embed=1&file=index.ts)

<br>

👉 Conditional expressions:

```ts
import interval from 'callbag-interval'
import pipe from 'callbag-pipe'
import subscribe from 'callbag-subscribe'
import expr from 'callbag-expr'

const a = interval(1000)
const b = interval(600)
const c = interval(3000)

pipe(
  expr($ => {
    if($(c, 0) % 2) return 'A = ' + $(a)
    else  return 'B = ' + $(b)
  }),
  subscribe(console.log)
)
```
[► TRY IT!](https://stackblitz.com/edit/callbag-expr-demo2?devtoolsheight=33&embed=1&file=index.ts)

<br>

👉 Passive tracking, i.e. using latest value from callbag without re-evaluating when it emits:

```ts
import interval from 'callbag-interval'
import pipe from 'callbag-pipe'
import subscribe from 'callbag-subscribe'
import expr from 'callbag-expr'

const a = interval(1000)
const b = interval(300)

pipe(
  expr(($, _) => $(a) + _(b)),
  subscribe(console.log)
)
```
[► TRY IT!](https://stackblitz.com/edit/callbag-expr-demo3?devtoolsheight=33&embed=1&file=index.ts)

<br>

## Gotchas

⚠️⚠️ Don't create new callbags in the expression:

```ts
// WRONG:
expr($ => $(interval(1000)));

// CORRECT:
const i = interval(1000);
expr($ => $(i));
```

<br>

⚠️⚠️ Make sure your callbags have initial value, or provide initial value. If you don't, `$(a)` might default to `undefined` (so take that into account).
```ts
// WRONG:
const a = interval(1000);
expr($ => $(a));         // --> initially will be `undefined`
```
```ts
// CORRECT:
const a = interval(1000);
expr($ => $(a, 0));     // --> initially will be 0
```
```ts
// CORRECT:
const a = makeBehaviorSubject(42);
expr($ => $(a));        // --> initially will be 42
```

<br>

⚠️⚠️ Make sure some callbag is actively tracked:

```ts
// WRONG:
const a = interval(1000);
const b = interval(1000);

//
// --> a is not actively tracked, b is also not tracked initially,
// --> so the expression is never re-evaluated.
//
expr($ => _(a, 0) > 5 ? $(b) : 32);
```

<br>

## Contribution

Play nice and respectful. Useful commands for development:

```bash
git clone https://github.com/loreanvictor/callbag-expr.git
```
```bash
npm i               # --> install dependencies
```
```bash
npm start           # --> run samples/index.ts
```
```bash
npm test            # --> run tests
```
```bash
npm run cov:view    # --> view coverage
```

<br><br>

_Inspired by [RxJS Autorun](https://github.com/kosich/rxjs-autorun)._
