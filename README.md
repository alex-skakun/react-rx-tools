# react-rx-tools

An easy-to-use toolkit for React.js that lets you use RxJS observables directly in your components.

## Custom hook `useObservable()`

This custom hook allows you to retrieve data from observable in a familiar and simple way for React.js.
When an observable emits new data, then component updates.

```typescript jsx
import { useObservable } from 'react-rx-tools';
import { userData$ } from './userData';


export function UserPanel(): JSX.Element {
  // component will be updated when userData$ provides new userData
  const userData = useObservable(userData$);

  return userData.isGuest
    ? <a href="/login">Login</a>
    : <a href="/account">{ userData.email }</a>;
}
```

The hook may be invoked with observable factory instead of observable object. 
Sometimes it's more preferred, because you need to make few observables just for current component:

```typescript jsx
import { useObservable } from 'react-rx-tools';
import { map, pluck } from 'rxjs';
import { userData$ } from './userData';


export function UserPanel(): JSX.Element {
  const userImageUrl = useObservable(() => userData$.pipe(
    map(userData => userData.image.url),
  ));
  const userFullName = useObservable(() => userData$.pipe(
    map(({ firstName, lastName }) => {
      return `${firstName} ${lastName}`;
    }),
  ));
  const isGuest = useObservable(() => userDataService.userData$.pipe(
    pluck('isGuest'),
  ));

  return <div>
    <img src={userImageUrl} alt="" />
    {
      isGuest
        ? <a href="/login">Login</a>
        : <a href="/account">{userFullName}</a>
    }
  </div>;
}
```
## Utility function `multicastForUI()`

I recommend to prepare your observables before using them in components.
Let's say you have global observable `windowResize$`, 
the idea of this observable is to share one event with all subscribers.
```typescript
export const windowResize$ = fromEvent(window, 'resize');
```
If you are going to use this observable directly in components,
each component will create new event listener. But we don't need that.
**Make your observables multicast!** And, if needed, provide start value for them.
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

This hook allows to subscribe to observables directly in components and automatically unsubscribes, 
when component is unmounted.

```typescript jsx
import { useSubscription } from 'react-rx-tools';
import { userData$ } from './userData';


export function Test(): JSX.Element {
  useSubscription(() => userData$.subscribe(userData => {
    // Do something with received data.
    // Subscription will be created only once.
    // Automatically unsubscribes before unmounting.
  }));
  
  return <SomeJSX />;
}
```

By default `useSubscription()` invokes callback after component did mount. 
If you need to subscribe at first render pass additional argument with config.

```typescript jsx
import { useSubscription } from 'react-rx-tools';
import { userData$ } from './userData';


export function Test(): JSX.Element {
  useSubscription(() => userData$.subscribe(userData => {
    // subscription will be created at first run, before any effects.
  }), { immediate: true });
  
  return <SomeJSX />;
}
```

Also `useSubscription()` allows you to resubscribe if observable changes:

```typescript jsx
import { useMemo } from 'react';
import { useSubscription } from 'react-rx-tools';
import { map } from 'rxjs';
import { userData$ } from './userData';


type TestProps = {
  formatter: ({ firstName, lastName }) => `${firstName} ${lastName}`
};

export function Test({ formatter }: TestProps): JSX.Element {
  const fullName$ = useMemo(() => {
    return userData$.pipe(map(formatter));
  }, [formatter]);

  useSubscription(fullName$)(obs$ => obs$.subscribe(userData => {
    // Each time when component receives new formatter, useSubscription will resubscribe.
    // First subscription will be created at first run, before any effects.
  }));

  return <SomeJSX/>;
}
```

## Custom hook `useDidMount()`

This hook creates memoized observable that emits only once after component did mount.
It replays for late subscribers until component is unmounted. 
Mostly it's needed for creating custom hooks for RxJS.

```typescript jsx
import { useEffect, useMemo } from 'react';
import { useDidMount, useObservable } from 'react-rx-tools';
import { skipUntil } from 'rxjs';
import { dataFromSocket$ } from './dataLayer';


export function Test(): JSX.Element {
  const didMount$ = useDidMount();
  const dataFromSocket = useObservable(() => {
    return dataFromSocket$.pipe(skipUntil(didMount$));
  });

  // first value of data from socket will be received only after component did mount.
  
  return <SomeJSX />;
}
```

## Custom hook `useWillUnmount()`

As `useDidMount()`, this hook creates memoized observable that emits once and completes when component is unmounted.
It also mostly helpful for internal things, such as passing this observable into `takeUntil()` operator.

```typescript jsx
import { useCallback } from 'react';
import { takeUntil } from 'rxjs';
import { useWillUnmount } from 'react-rx-tools';
import { openDialog } from './dialogs';


export function Test(): JSX.Element {
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

This hook creates a pair: memoized ref observable and memoized ref callback. May accept initial value as argument.

```typescript jsx
import { switchMap } from 'rxjs';
import { useObservable, useRxRef, useSubscription } from 'react-rx-tools';
import { isMobileView$ } from './layout';


export function Test(): JSX.Element {
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
      ? <MobileViewJSX ref={refCallback} /> 
      : <DesktopViewJSX ref={refCallback} />
  );
}
```

## Custom hook `useRxEvent()`

This hook creates a pair of memoized observable and memoized event listener callback.
It allows to transform usual event handling into RxJS observables.
The main purpose of this is not direct event handling, but provide a way to integrate 
user actions into observables, such as `buffer()`, `takeUntil()` and many others.

```typescript jsx
import { useRxEvent, useSubscription } from 'react-rx-tools';


export function Test(): JSX.Element {
  const [click$, onClick] = useRxEvent();

  useSubscription(() => click$.subscribe(event => {
    // handle event
  }));

  return <SomeJSX onClick={onClick}/>;
}
```

## Custom hook `useValueChange()`

This hook is kinda technical tool. It allows to integrate props or any other values into observables.
Let's say we want to filter some data from observable by value of prop `disabled`:

```typescript jsx
import { filter, withLatestFrom, map } from 'rxjs';
import { useSubscription, useValueChange } from 'react-rx-tools';
import { dataStream$ } from './data';


type TestProps = {
  disabled?: boolean;
};

export function Test({ disabled }: TestProps): JSX.Element {
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
import { useEffect } from 'react';
import { Subject } from 'rxjs';
import { useSubject } from 'react-rx-tools';


export function Test(): JSX.Element {
  const subject = useSubject(() => new Subject<void>());

  useEffect(() => {
    // do something with subject
  });

  return <SomeJSX/>;
}
```

## Custom hook `useRxEffect()`

It returns memoized observable that emits after each render. Mostly it's required for technical purposes.

## Component `<Render$ />`

The purpose of this component is very similar to `useObservable()`, but with some differences:

1. The component works not only with `Observable`, but also with `ObservableInput`. 
   This allows it to be applied in a more flexible way.
2. When getting new data from `Observable`, the component redraws only its children. This allows to optimize performance.
3. A component may not redraw its children if the source observable provides `null` or `undefined`. 
   You can customize this behavior with an additional property.

### Props

- `$` - a value that matches `ObservableInput` type.
- `definedOnly` - indicates should component ignore `null` and `undefined` and don't render anything in this case. 
  Default is `false`.
- `children` - component accepts children only as function and passes the latest value from source as argument.

```typescript jsx
import { Render$ } from 'react-rx-tools';
import { userData$ } from './userData';


export function UserPanel(): JSX.Element {
  return <Render$ $={userData$} definedOnly>
    { userData => userData.isGuest
      ? <a href="/login">Login</a>
      : <a href="/account">{ userData.email }</a> 
    }
  </Render$>;
}
```

## Component `<Output$ />`

This component allows to render a value directly from observable.

### Props

- `$` - a value that matches `ObservableInput<ReactNode>` type.

```typescript jsx
import { useMemo } from 'react';
import { pluck } from 'rxjs';
import { Output$ } from 'react-rx-tools';
import { userData$ } from './userData';


export function UserPanel(): JSX.Element {
  const userEmail$ = useMemo(() => userData$.pipe(pluck('email')), []);

  return <span><Output$ $={userEmail$}/></span>;
}
```

# License

MIT
