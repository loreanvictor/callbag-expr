# callbag-expr

Expressions with callbags:

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

<br><br>

_Inspired by [RxJS Autorun](https://github.com/kosich/rxjs-autorun)._
