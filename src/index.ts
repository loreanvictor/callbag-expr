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

interface Bag<R> {
  sink: Sink<R>;
  fn: ($: Track, _: Track) => R;
  trackings: Tracking<any>[] | undefined;
}

function srcSink<R, T>(
  bag: Bag<R>,
  cb: Callbag<never, T>,
  active: boolean,
  tracking: Tracking<T>,
  t: START | DATA | END,
  m?: any
) {
  if (t === 0) {
    tracking!!.talkback = m;
  } else if (t === 1) {
    if (!tracking!!.terminated) {      // --> for mis-behaving sources
      tracking!!.value = m;
      if (active) { run(bag, tracking!!); }
    }
  } else if (t === 2) {
    if (m) {
      bag.sink(2, m);
      for (
        let i = 0, s = bag.trackings!![i];
        i < bag.trackings!!.length;
        s = bag.trackings!![++i]
      ) {
        if (s.cb !== cb && s.talkback && !s.terminated) {
          s.talkback(2, m);
        }
      }

      bag.trackings!!.length = 0;
    } else {
      tracking!!.terminated = true;
      if (!bag.trackings!!.some(s => !s.terminated)) {
        bag.trackings!!.length = 0;
        bag.sink(2);
      }
    }
  }
}

function connect<R, T>(bag: Bag<R>, cb: Callbag<never, T>, active: boolean) {
  let tracking = bag.trackings!!.find(source => source.cb === cb);
  if (!tracking) {
    tracking = {cb, seen: true, value: _Unset, terminated: false};
    bag.trackings!!.push(tracking);
    cb(0, srcSink.bind(null, bag, cb, active, tracking));
  }

  return tracking;
}

function track<R, T>(active: boolean, bag: Bag<R>, cb: Callbag<never, T>, initial?: T) {
  const tracking = connect(bag, cb, active);
  tracking.seen = true;
  return (tracking.value === _Unset) ? initial : tracking.value;
}

function run<R>(bag: Bag<R>, tracking?: Tracking<any>) {
  if (!bag.trackings) { bag.trackings = []; }
  for (let i = 0, s = bag.trackings[i]; i < bag.trackings.length; s = bag.trackings[++i]) {
    s.seen = false;
  }
  const value = bag.fn(track.bind(null, true, bag), track.bind(null, false, bag));
  if (!tracking || tracking.seen) { bag.sink(1, value); }
}

function relay<R>(bag: Bag<R>, t: START | DATA | END, m?: any) {
  for (
    let i = 0, s = bag.trackings!![i];
    i < bag.trackings!!.length;
    s = bag.trackings!![++i]
  ) {
    if (s.talkback) {
      s.talkback(t as any, m);
    }
  }

  if (t === 2) {
    bag.trackings!!.length = 0;
  }
}

export function expr<R>(fn: ($: Track, _: Track) => R): Source<R> {
  return (type: START | DATA | END, msg?: any) => {
    if (type !== 0) { return; }
    const sink = msg as Sink<R>;
    const bag: Bag<R> = { trackings: undefined, sink, fn };

    const prerun_buffer: [START | DATA | END, any][] = [];

    sink(0, (t: START | DATA | END, m?: any) => {
      if (bag.trackings) { relay(bag, t, m); }
      else { prerun_buffer.push([t, m]); }
    });

    run(bag);
    for (let i = 0, _e = prerun_buffer[i]; i < prerun_buffer.length; _e = prerun_buffer[++i]) {
      relay(bag, _e[0], _e[1]);
    }
    prerun_buffer.length = 0;
  };
}

export default expr;
