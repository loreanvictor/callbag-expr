import { Callbag, Source, Sink, START, DATA, END } from 'callbag';

type Track = {
  <T>(cb: Callbag<never, T>): T | undefined;
  <T>(cb: Callbag<never, T>, initial: T): T;
};

interface Tracking<T> {
  cb: Callbag<never, T>;
  talkback?: Callbag<any, never>;
  value: T;
  seen: boolean;
  terminated: boolean;
}

const _Unset = {};

export function expr<R>(fn: ($: Track, _: Track) => R): Source<R> {
  return (type: START | DATA | END, msg?: any) => {
    if (type !== 0) { return; }
    const sink = msg as Sink<R>;
    let trackings: Tracking<any>[] | undefined = undefined;

    const connect = <T>(cb: Callbag<never, T>, active: boolean) => {
      let tracking = trackings!!.find(source => source.cb === cb);
      if (!tracking) {
        tracking = {cb, seen: true, value: _Unset, terminated: false};
        trackings!!.push(tracking);
        cb(0, (t: START | DATA | END, m?: any) => {
          if (t === 0) {
            tracking!!.talkback = m;
          } else if (t === 1) {
            if (!tracking!!.terminated) {      // --> for mis-behaving sources
              tracking!!.value = m;
              if (active) { run(tracking!!); }
            }
          } else if (t === 2) {
            if (m) {
              sink(2, m);
              trackings!!.forEach(s => {
                if (s.cb !== cb && s.talkback && !s.terminated) {
                  s.talkback(2, m);
                }
              });
              trackings!!.length = 0;
            } else {
              tracking!!.terminated = true;
              if (!trackings!!.some(s => !s.terminated)) {
                trackings!!.length = 0;
                sink(2);
              }
            }
          }
        });
      }

      return tracking;
    };

    const track = (active: boolean) => <T>(cb: Callbag<never, T>, initial?: T) => {
      const tracking = connect(cb, active);
      tracking.seen = true;
      return (tracking.value === _Unset) ? initial : tracking.value;
    };

    const run = (tracking?: Tracking<any>) => {
      if (!trackings) { trackings = []; }
      trackings.forEach(s => s.seen = false);
      const value = fn(track(true), track(false));
      if (!tracking || tracking.seen) { sink(1, value); }
    };

    const relay = (t: START | DATA | END, m?: any) => {
      trackings!!.forEach(s => {
        if (s.talkback) {
          s.talkback(t as any, m);
        }
      });

      if (t === 2) {
        trackings!!.length = 0;
      }
    };

    const prerun_buffer: [START | DATA | END, any][] = [];

    sink(0, (t: START | DATA | END, m?: any) => {
      if (trackings) { relay(t, m); }
      else { prerun_buffer.push([t, m]); }
    });

    run();
    prerun_buffer.forEach(([t, d]) => relay(t, d));
  };
}

export default expr;
