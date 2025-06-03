# react-rx-tools

An easy-to-use toolkit for React.js that lets you use RxJS observables directly in your components.

## Custom hook `useObservable()`

This custom hook allows you to retrieve data from observable in a familiar and simple way for React.js.
When an observable emits new data, then component updates.

```typescript jsx
import { ReactElement } from 'react';
import { useObservable } from 'react-rx-tools';
import { userData$ } from './userData';

export function UserPanel(): ReactElement {
  // component will be updated when userData$ provides new userData
  const userData = useObservable(userData$);

  return userData.isGuest
    ? <a href="/login">Login</a>
    : <a href="/account">{userData.email}</a>;
}
```

The hook may be invoked with observable factory instead of observable instance. 
Sometimes it's more preferred, because you need to make a few observables just for current component:

```typescript jsx
import { ReactElement } from 'react';
import { useObservable } from 'react-rx-tools';
import { map } from 'rxjs';
import { userData$ } from './userData';

export function UserPanel(): ReactElement {
  const userImageUrl = useObservable(() => userData$.pipe(
    map(userData => userData.image.url),
  ));
  const userFullName = useObservable(() => userData$.pipe(
    map(({ firstName, lastName }) => `${firstName} ${lastName}`),
  ));
  const isGuest = useObservable(() => userDataService.userData$.pipe(
    map(({ isGuest }) => isGuest),
  ));

  return <div>
    <img src={userImageUrl} alt=""/>
    {
      isGuest
        ? <a href="/login">Login</a>
        : <a href="/account">{userFullName}</a>
    }
  </div>;
}
```

There are some optimizations under the hood. Some observables may emit a bunch of events right on subscribe (sharing through ReplaySubject).
In this case `useObservable()` collects all synchronous events onto internal buffer and returns only the latest value.
But there is a chance when source observable emits again but `useObservable()` already returned a value. In this case `useObservable()` 
collects these events onto internal buffer and automatically updates component state with the latest value from buffer on effect phase.

### There is an alternative version of this hook `useTransitionObservable()`

The key difference with regular `useObservable()` is that `useTransitionObservable()` uses transitions for state updates. 
And it returns a tuple with pending flag and actual value.

```typescript jsx
import { ReactElement } from 'react';
import { useTransitionObservable } from 'react-rx-tools';
import { userData$ } from './userData';

export function Example(): ReactElement {
  const [pending, userData] = useTransitionObservable(userData$);
  
  return pending ? <Preloader/> : <UserPanel userData={userData}/>;
}
```


## Utility function `multicastForUI()`

It is recommended to prepare your observables before using them in components.
Let's say you have global observable `windowResize$`, 
the idea of this observable is to share one event with all subscribers.

```typescript
export const windowResize$ = fromEvent(window, 'resize');
```

If you are going to use this observable directly in components, each component will create a new event listener. 
But usually we don't need that. **Make your observables multicasting!** And, if needed, provide start value for them.
There is a special utility function for this:

```typescript
import { multicastForUI } from 'react-rx-tools';
import { fromEvent, map } from 'rxjs';

export const windowResize$ = multicastForUI(fromEvent(window, 'resize'));

const mql = matchMedia('screen and (prefers-color-scheme: dark)');

export const isDarkTheme$ = multicastForUI(
  fromEvent(mql, 'change').pipe(map(() => mql.matches)),
  mql.matches,
);
```

Or use it as rxjs operator:

```typescript
import { makeUIFriendly } from 'react-rx-tools';
import { fromEvent, map } from 'rxjs';

export const windowResize$ = fromEvent(window, 'resize').pipe(
  multicastForUI(),
);

const mql = matchMedia('screen and (prefers-color-scheme: dark)');

export const isDarkTheme$ = fromEvent(mql, 'change').pipe(
  map(() => mql.matches),
  multicastForUI(mql.matches),
);
```

## Custom hook `useSubscription()`

This hook allows you to subscribe to observables directly in components and automatically unsubscribes when component is unmounting.

```typescript jsx
import { ReactElement } from 'react';
import { useSubscription } from 'react-rx-tools';
import { userData$ } from './userData';

export function Test(): ReactElement {
  useSubscription(() => userData$.subscribe(userData => {
    // Do something with received data.
    // Subscription will be created only once.
    // Automatically unsubscribes before unmounting.
  }));

  return <SomeJSX/>;
}
```

By default `useSubscription()` invokes callback after component did mount. 
If you need to subscribe on first render, pass additional argument with config.

```typescript jsx
import { ReactElement } from 'react';
import { useSubscription } from 'react-rx-tools';
import { userData$ } from './userData';

export function Test(): ReactElement {
  useSubscription(() => userData$.subscribe(userData => {
    // subscription will be created at first run, before any effects.
  }), { immediate: true });

  return <SomeJSX/>;
}
```

Also `useSubscription()` allows you to resubscribe if observable changes:

```typescript jsx
import { ReactElement, useMemo } from 'react';
import { useSubscription } from 'react-rx-tools';
import { map } from 'rxjs';
import { userData$, UserData } from './userData';

type TestProps = {
  formatter: (userData: UserData) => string;
};

export function Test({ formatter }: TestProps): ReactElement {
  const fullName$ = useMemo(() => {
    return userData$.pipe(map(formatter));
  }, [formatter]);

  useSubscription(fullName$, (obs$) => obs$.subscribe(userData => {
    // Each time when component receives new formatter, useSubscription will resubscribe.
  }), { immediate: true });

  return <SomeJSX/>;
}
```

## Custom hook `useDidMount()`

This hook creates memoized observable that emits only once after component did mount.
It replays for late subscribers until component is unmounted. 
Mostly it's needed for creating custom hooks for RxJS.

```typescript jsx
import { ReactElement, useEffect, useMemo } from 'react';
import { useDidMount, useObservable } from 'react-rx-tools';
import { skipUntil } from 'rxjs';
import { dataFromSocket$ } from './dataLayer';

export function Test(): ReactElement {
  const didMount$ = useDidMount();
  const dataFromSocket = useObservable(() => {
    return dataFromSocket$.pipe(skipUntil(didMount$));
  });

  // first value of data from socket will be received only after component did mount.

  return <SomeJSX/>;
}
```

## Custom hook `useWillUnmount()`

As `useDidMount()`, this hook creates memoized observable that emits once and completes when component is unmounted.
It's also mostly helpful for internal things, such as passing this observable into `takeUntil()` operator.

```typescript jsx
import { ReactElement, useCallback } from 'react';
import { takeUntil } from 'rxjs';
import { useWillUnmount } from 'react-rx-tools';
import { openDialog } from './dialogs';

export function Test(): ReactElement {
  const unmount$ = useWillUnmount();
  const onClick = useCallback(() => {
    openDialog()
      .pipe(
        takeUntil(unmount$),
      )
      .subscribe();
  }, []);

  return <button type="button" onClick={onClick}>Open</button>
}
```

## Custom hook `useRxRef()`

This hook creates a pair: memoized ref observable and memoized `ComboRef`. May accept initial value as argument.
`ComboRef` is a combination of `RefCallback` and `RefObject`, so you are able to use property `current` for reading and changing value.

```typescript jsx
import { ReactElement } from 'react';
import { switchMap } from 'rxjs';
import { useObservable, useRxRef, useSubscription } from 'react-rx-tools';
import { isMobileView$ } from './layout';

export function Test(): ReactElement {
  const [ref$, refCallback] = useRxRef();
  const isMobileView = useObservable(isMobileView$);

  useSubscription(() =>
    ref$
      .pipe(
        // handle changes of ref
        // do any pipe here
      )
      .subscribe(() => {
        // handle observable result like ref never changes
      })
  );

  return (
    isMobileView
      ? <MobileViewJSX ref={refCallback}/>
      : <DesktopViewJSX ref={refCallback}/>
  );
}
```

## Custom hook `useRxEvent()`

This hook creates a pair of memoized observable and memoized event listener callback.
It allows you to transform usual event handling into RxJS observables.
The main purpose of this is not direct event handling, but provide a way to integrate 
user actions into observables, such as `buffer()`, `takeUntil()` and many others.

```typescript jsx
import { ReactElement } from 'react';
import { useRxEvent, useSubscription } from 'react-rx-tools';

export function Test(): ReactElement {
  const [click$, onClick] = useRxEvent();

  useSubscription(() => click$.subscribe(event => {
    // handle event
  }));

  return <SomeJSX onClick={onClick}/>;
}
```

It's possible to pass a mapper function into the hook, that will transform event into other value.

```typescript jsx
import { ReactElement } from 'react';
import { useRxEvent, useSubscription } from 'react-rx-tools';

export function Test({ dx }: { dx: number }): ReactElement {
  const [click$, onClick] = useRxEvent(event => {
    return event.clientX + dx;
  });

  useSubscription(() => click$.subscribe(x => {
    // x is number value, sum of clientX and actual value of prop dx
  }));

  return <SomeJSX onClick={onClick}/>;
}
```

## Custom hook `useRxCallback()`

This is more powerful way to convert any callback into observable than `useRxEvent()`. It allows you to define a pipe which transforms 
callback arguments into observable value.

```typescript jsx
import { ReactElement } from 'react';
import { debounceTime, map, pipe } from 'rxjs';
import { useRxCallback, useSubscription } from 'react-rx-tools';

export type ExampleProps = {
  onChange: (value: string) => void;
};

export function Example({ onChange }): ReactElement {
  const [data$, onData] = useRxCallback<[event, string], string>(() => pipe(
    tap(([event]) => event.preventDefault()),
    map(([, newValue]) => value),
    debounceTime(300),
  ));

  useSubscription(() => data$.subscribe(onChange));

  return <CustomInput onValueChange={onData}/>
}
```

## Custom hook `useValueChange()`

This hook is kinda technical tool. It allows to integrate props or any other values into observables.
Let's say we want to filter some data from observable by value of prop `disabled`:

```typescript jsx
import { ReactElement } from 'react';
import { filter, withLatestFrom, map } from 'rxjs';
import { useSubscription, useValueChange } from 'react-rx-tools';
import { dataStream$ } from './data';

type TestProps = {
  disabled?: boolean;
};

export function Test({ disabled }: TestProps): ReactElement {
  const disabled$ = useValueChange(disabled);

  useSubscription(() =>
    dataStream$
      .pipe(
        withLatestFrom(disabled$),
        filter(([data, disabled]) => !disabled),
        map(([data]) => data),
      )
      .subscribe(data => {
        // handle data only when prop "disabled" is false
      })
  );

  return <SomeJSX/>;
}
```

## Custom hook `useSubject()`

It creates memoized subject that completes on component unmount. Accept subject factory as argument.

```typescript jsx
import { ReactElement, useEffect } from 'react';
import { Subject } from 'rxjs';
import { useSubject } from 'react-rx-tools';

export function Test(): ReactElement {
  const subject = useSubject(() => new Subject<void>());

  useEffect(() => {
    // do something with subject
  });

  return <SomeJSX/>;
}
```

## Custom hook `useRxEffect()`

It returns memoized observable that emits after each render. Mostly it's required for technical purposes.

## Component `<Render$/>`

The purpose of this component is very similar to `useObservable()` hook, but with some differences:

1. The component works not only with `Observable`, but also with `ObservableInput`. 
   This allows it to be applied in a more flexible way.
2. When getting new data from `Observable`, the component redraws only its children. This allows to optimize performance.
3. A component may not redraw its children if the source observable provides `null` or `undefined`. 
   You can customize this behavior with an additional property.

It uses `useTRansitionObservable()` inside.

### Props

- `$` - a value that matches `ObservableInput` type.
- `definedOnly` - indicates should component ignore `null` and `undefined` and don't render anything in this case. 
  Default is `false`.
- `children` - component accepts children only as function and passes the latest value from source as argument.
- `fallback` - ReactNode that should be rendered while observable does not emit.

```typescript jsx
import { ReactElement } from 'react';
import { Render$ } from 'react-rx-tools';
import { userData$ } from './userData';

export function UserPanel(): ReactElement {
  return <Render$ $={userData$} definedOnly>
    {(userData, pending) => userData.isGuest
      ? <a href="/login">Login</a>
      : <a href="/account">{userData.email}</a>
    }
  </Render$>;
}
```

## Component `<Output$/>`

This component allows you to render a value directly from observable.

### Props

- `$` - a value that matches `ObservableInput<ReactNode>` type.

```typescript jsx
import { ReactElement, useMemo } from 'react';
import { pluck } from 'rxjs';
import { Output$ } from 'react-rx-tools';
import { userData$ } from './userData';

export function UserPanel(): ReactElement {
  const userEmail$ = useMemo(() => userData$.pipe(pluck('email')), []);

  return <span><Output$ $={userEmail$}/></span>;
}
```

# License

MIT
