// tslint:disable: no-magic-numbers
// tslint:disable: no-unused-expression

import { expect, should } from 'chai'; should();
import subscribe from 'callbag-subscribe';
import pipe from 'callbag-pipe';
import of from 'callbag-of';
const subject = require('callbag-subject');
const behaviorSubject = require('callbag-behavior-subject');

import expr from '../index';


describe('callbag-expr', () => {
  it('should call given function with given initial data for every susbcriber at least once.', () => {
    let r = 0;
    const e = expr(() => r++);
    pipe(e, subscribe(() => {}));
    pipe(e, subscribe(() => {}));
    r.should.equal(2);
  });

  it('should subscribe to given sources per subscriber.', () => {
    const asub: any[] = [];
    const bsub: any[] = [];
    const a = (_: any, sink: any) => asub.push(sink);
    const b = (_: any, sink: any) => bsub.push(sink);

    const e = expr($ => [$(a), $(b)]);

    pipe(e, subscribe(() => {}));
    pipe(e, subscribe(() => {}));

    asub.length.should.equal(2);
    bsub.length.should.equal(2);
  });

  it('should ignore non-greet messages.', () => {
    let r = 0;
    const e = expr(() => r++);
    e(1);
    e(2);
    r.should.equal(0);
  });

  it('should relay all messages from the sink to sources.', (done) => {
    const up: any[] = [];
    const a = (_: any, sink: any) => {
      sink(0, (t: any, d: any) => up.push([t, d]));
    };

    const s = (src: any) => {
      src(0, (t: any, d: any) => {
        if (t === 0) {
          d(1, 'hellow');
          setTimeout(() => d(1, 'world'), 5);
          setTimeout(() => d(2, 'goodbye'), 10);
        }
      });
    };

    pipe(expr($ => $(a)), s);
    setTimeout(() => {
      up.should.eql([[1, 'hellow'], [1, 'world'], [2, 'goodbye']]);
      done();
    }, 20);
  });

  it('should do initial evaluation with `undefined`.', done => {
    const a = subject();
    pipe(
      expr($ => $(a)),
      subscribe(v => {
        expect(v).to.be.undefined;
        done();
      })
    );
  });

  it('should do initial evaluation with given initial value.', done => {
    const a = subject();
    const b = subject();
    pipe(
      expr($ => $(a, 17) + $(b, 25)),
      subscribe(v => {
        v.should.equal(42);
        done();
      })
    );
  });

  it('should do initial evaluation with immediate emits from sources.', () => {
    const a = of(17);
    const b = behaviorSubject(26);
    const c = of(-1);
    const r: number[] = [];

    pipe(
      expr(($, _) => $(a)!! + $<number>(b)!! + _(c)!!),
      subscribe(v => r.push(v))
    );

    r.should.eql([42, 42, 42]);
  });

  it('should re-evaluate every time each source emits.', () => {
    const a = subject();
    const b = subject();
    const r: number[] = [];
    pipe(
      expr($ => $(a, 0) + 2 * $(b, 0)),
      subscribe(v => r.push(v))
    );

    a(1, 2);
    b(1, 3);
    a(1, 5);
    r.should.eql([0, 2, 8, 11]);
  });

  it('should not re-evaluate for every emission of weakly tracked sources.', () => {
    const a = subject();
    const b = subject();
    const r: number[] = [];
    pipe(
      expr(($, _) => $(a, 0) + 2 * _(b, 0)),
      subscribe(v => r.push(v))
    );

    a(1, 2);
    b(1, 3);
    a(1, 5);
    r.should.eql([0, 2, 11]);
  });

  it('should send a signal to all sources when one source errors.', done => {
    const a = subject();
    const b = (t: any, m?: any) => {
      if (t === 0) {
        m(0, (_: any) => { if (_ === 2) { done(); } });
      }
    };

    pipe(
      expr($ => $(a) || $(b)),
      subscribe(() => {})
    );

    a(2, 'Oops');
  });

  it('should terminate when all sources are terminated.', done => {
    const a = subject();
    const b = subject();
    const r: number[] = [];
    const s = (src: any) => {
      src(0, (t: any, d: any) => {
        if (t === 1) { r.push(d); }
        if (t === 2) {
          r.should.eql([0, 2, 5, 7]);
          done();
        }
      });
    };

    pipe(expr($ => $(a, 0) + $(b, 0)), s);
    a(1, 2);
    b(1, 3);
    b(2);
    a(1, 4);
    a(2);
    a(1, 5); // --> bad source
  });

  it('should ignore weird messages from source.', () => {
    const a = (t: any, m?: any) => {
      if (t === 0) {
        m(3);
      }
    };

    pipe(
      expr($ => $(a)),
      subscribe(() => {})
    );
  });

  it('should ignore emission whose value is not used in computation.', () => {
    const a = subject();
    const b = subject();
    const r: number[] = [];

    pipe(
      expr(($, _) => _(a, true) ? $(b, 0) : 32),
      subscribe(v => r.push(v))
    );

    b(1, 3); // --> added
    b(1, 4); // --> added
    a(1, false);
    b(1, 7); // --> ignored
    b(1, 8); // --> ignored
    a(1, true);
    b(1, 17); // --> added
    r.should.eql([0, 3, 4, 17]);
  });
});
