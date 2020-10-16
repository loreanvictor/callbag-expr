# callbag-expr
Expressions based on callbags

```ts
const interval = require('callbag-interval')

import pipe from 'callbag-pipe'
import subscribe from 'callbag-subscribe'
import expr from 'callbag-expr'

const a = interval(1000)
const b = interval(2000)

pipe(
  expr(($, _) => $(a, 0) + ' :: ' + _(b, 0)),
  subscribe(console.log)
)
```

[► TRY IT!](https://stackblitz.com/edit/callbag-expr-demo?devtoolsheight=33&embed=1&file=index.ts)

<br><br>

_Inspired by [RxJS Autorun](https://github.com/kosich/rxjs-autorun)._
