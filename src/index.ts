import { Callbag, Source, Sink, START, DATA, END } from 'callbag';

type Track = {
  <T>(cb: Callbag<any, T>): T | undefined;
  <T>(cb: Callbag<any, T>, initial: T): T;
};

interface Tracking<T> {
  cb: Callbag<any, T>;
  talkback?: Callbag<any, void>;
  value?: any;
  seen: boolean;
}

export function expr<R>(fn: ($: Track, _: Track) => R): Source<R> {
  return (type: START | DATA | END, msg?: any) => {
    if (type !== 0) { return; }
    const sink = msg as Sink<R>;
    const sources: Tracking<any>[] = [];

    const subscribe = <T>(cb: Callbag<any, T>, active: boolean) => {
      let src = sources.find(s => s.cb === cb);
      if (!src) {
        src = {cb, seen: true};
        sources.push(src);
        cb(0, (t: START | DATA | END, m?: any) => {
          if (t === 0) {
            if (src!!.talkback) {
              src!!.talkback = m;
            }
          } else if (t === 1) {
            src!!.value = m;
            if (active) { run(src!!); }
          } else if (t === 2) {
            sink(2, m);
            sources.forEach(s => {
              if (s.cb !== cb && s.talkback) {
                s.talkback(2, m);
              }
            });
            sources.length = 0;
          }
        });
      }

      return src;
    };

    const run = (track?: Tracking<any>) => {
      sources.forEach(s => s.seen = false);
      const value = fn(
        <T>(cb: Callbag<any, T>, i?: T) => { const s = subscribe(cb, true); s.seen = true; return s.value || i; },
        <T>(cb: Callbag<any, T>, i?: T) => { const s = subscribe(cb, false); s.seen = true; return s.value || i; }
      );
      if (track?.seen) { sink(1, value); }
    };

    sink(0, (t: START | DATA | END, m?: any) => {
      sources.forEach(s => {
        if (s.talkback) {
          s.talkback(t as any, m);
        }
      });

      if (t === 2) {
        sources.length = 0;
      }
    });

    run();
  };
}


// tslint:disable-next-line: no-default-export
export default expr;
