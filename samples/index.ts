  // tslint:disable: no-magic-numbers

import pipe from 'callbag-pipe';
import subscribe from 'callbag-subscribe';
const interval = require('callbag-interval');

import { expr } from '../src';

const a = interval(500);
const b = interval(1000);

pipe(
  expr(($, _) => $(a, 0) + ' :: ' + _(b, 0)),
  subscribe(console.log)
);
