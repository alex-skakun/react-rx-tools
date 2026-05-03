react-rx-tools
==============

An easy-to-use toolkit for React.js that lets you use RxJS observables directly in your components.

> ### Version 3.0.0
> 
> #### New features
> 
> The `Render$` and `Output$` components have been improved. They now optionally use `startTransition` to update states. 
> They also provide access via ref to a special `Observable` that signals when rendering within these components has completed.
>
> A new component factory, `createRxComponent`, has been added. 
> This function allows you to create simple components whose rendering logic can be encapsulated in a single RxJS pipe.
>
> Many functions have been added for working with browser APIs via RxJS. 
> You can now use `MutationObserver`, `ResizeObserver`, `IntersectionObserver`, `ReportingObserver` and `MediaQueryList` 
> in a convenient RxJS style.
>
> Several RxJS operators have also been added for convenient error handling.
> 
> #### Breaking changes
> 
> * The `Render$` component no longer uses `startTransition` by default
>   This behavior is now enabled via a special `withTransition` parameter
> * The `useObservable` and `useTransitionObservable` hooks can now throw an exception if the passed Observable ends with an error
> * The `useValueChange` hook now emits new values inside `useLayoutEffect` instead of `useEffect`
> 
> #### Deprecations
> 
> * The `useDidMount` hook has been renamed to `useRxMount`
> * The `useWillUnmount` hook has been renamed to `useRxUnmount`
 

## TOC

* [Components](#components)
  * [Render$](#render)
  * [Output$](#output)
  * [createRxComponent()](#createrxcomponent)
* [Hooks](#hooks)
  * [useSubscription()](#usesubscription)
  * [useObservable()](#useobservable)
  * [useTransitionObservable()](#usetransitionobservable)
  * [useSubject()](#usesubject)
  * [useRxEvent()](#userxevent)
  * [useRxRef()](#userxref)
  * [useRxCallback()](#userxcallback)
  * [useExhaustCallback()](#useexhaustcallback)
  * [useRxFactory()](#userxfactory)
  * [useRxEffect()](#userxeffect)
  * [useNextRender()](#usenextrender)
  * [useValueChange()](#usevaluechange)
  * [useRxMount()](#userxmount)
  * [useRxUnmount()](#userxunmount)
* [Utils](#utils)
  * [multicastForUI()](#multicastforui)
  * [catchErrorAndComplete()](#catcherrorandcomplete)
  * [catchErrorAndRetry()](#catcherrorandretry)
  * [distinctUntilRecordChanged()](#distinctuntilrecordchanged)
  * [fromTransitionEnd()](#fromtransitionend)
  * [fromAnimationEnd()](#fromanimationend)
  * [fromFileSelect()](#fromfileselect)
  * [fromFileReader()](#fromfilereader)
  * [fromMediaQuery()](#frommediaquery)
  * [fromMutationObserver()](#frommutationobserver)
  * [fromResizeObserver()](#fromresizeobserver)
  * [fromReportingObserver()](#fromreportingobserver)
  * [rxIntersectionObserver()](#rxintersectionobserver)


## Components

### `<Render$>`
This component allows you to perform a partial render of a state provided via an RxJS Observable.

1. The component works not only with `Observable`, but also with `ObservableInput`.
   This allows it to be applied in a more flexible way.
2. When getting new data from `Observable`, the component redraws only its children. This allows to optimize performance.
3. A component may not redraw its children if the source observable provides `null` or `undefined`.
   You can customize this behavior with an additional property.
4. Optionally may update state inside `startTransition`.

#### Props

- `$` - a value that matches `ObservableInput` type.
- `definedOnly` - indicates should component ignore `null` and `undefined` and don't render anything in this case.
  Default is `false`.
- `withTransition` - enables state updates inside `startTransition`.
- `fallback` - ReactNode that should be rendered while observable does not emit or emits null or undefined.
- `ref` - Provides an observable that emits after internal render.
  Sometimes, before rendering the next state, you need to make sure the previous state has been rendered. 
  This is usually necessary when programming complex UI elements with animations. 
  For this exact purpose, the component provides a special Observable that can be used later with the special [`useNextRender`](#usenextrender) hook. 
- `children` - component accepts children only as function and passes the latest value from source as argument.

```typescript jsx
import { Render$ } from 'react-rx-tools';
import { userData$ } from './userData';

export function UserPanel(): ReactElement {
  return (
    <Render$ definedOnly withTransition $={userData$}>
      {(userData, pending) => {
        if (pending) {
          return <Skeleton/>;
        }

        return userData.isGuest
          ? <a href="/login">Login</a>
          : <a href="/account">{userData.email}</a>;
      }}
    </Render$>
  );
}
```


### `<Output$>`

This component allows you to render a value directly from observable.

#### Props

- `$` - a value that matches `ObservableInput<ReactNode>` type.
- `withTransition` - enables state updates inside `startTransition`.
- `ref` - Provides an observable that emits after internal render.
  Sometimes, before rendering the next state, you need to make sure the previous state has been rendered.
  This is usually necessary when programming complex UI elements with animations.
  For this exact purpose, the component provides a special Observable that can be used later with the special [`useNextRender`](#usenextrender) hook.

```typescript jsx
import { ReactElement, useMemo } from 'react';
import { map } from 'rxjs';
import { Output$ } from 'react-rx-tools';
import { userData$ } from './userData';

export function UserPanel(): ReactElement {
  const userEmail$ = useMemo(() => userData$.pipe(
    map(({ email }) => email),
  ), []);

  return (
    <span>
      <Output$ $={userEmail$}/>
    </span>
  );
}
```


### `createRxComponent()`

This function allows you to create simple components whose rendering logic can be encapsulated in a single RxJS pipe.

```typescript jsx
import { ReactElement, useMemo } from 'react';
import { animationFrames, distinctUntilChanged, map, withLatestFrom } from 'rxjs';
import { createRxComponent } from 'react-rx-tools';

export type CurrentTimeProps = {
  format: string;
};

// this component may render current time according passed format
export const CurrentTime = createRxComponent<CurrentTimeProps>((props$) => (
  animationFrames().pipe(
    withLatestFrom(props$),
    map(([, { format }]) => formatDate(new Date())),
    distinctUntilChanged(),
    map((dateString) => (
      <span>{dateString}</span>
    ))
  )
));

// usage
<CurrentTime format="HH:MM:SS.sss"/>
```


## Hooks


### `useSubscription()`

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


### `useObservable()`

This hook allows you to retrieve data from observable in a familiar and simple way for React.js.
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

If you need to re-invoke the observable factory in certain cases, pass an array of dependencies as the second argument.

There are some optimizations under the hood. Some observables may emit a bunch of events right on subscribe (sharing through ReplaySubject).
In this case `useObservable()` collects all synchronous events onto internal buffer and returns only the latest value.
But there is a chance when source observable emits again but `useObservable()` already returned a value. In this case `useObservable()`
collects these events onto internal buffer and automatically updates component state with the latest value from buffer on effect phase.


### `useTransitionObservable()`

The key difference with regular `useObservable()` is that `useTransitionObservable()` uses transitions for state updates.
And it returns a tuple with pending flag and actual value. Arguments are equal to arguments of `useObservable()`.

```typescript jsx
import { ReactElement } from 'react';
import { useTransitionObservable } from 'react-rx-tools';
import { userData$ } from './userData';

export function Example(): ReactElement {
  const [pending, userData] = useTransitionObservable(userData$);
  
  return pending ? <Preloader/> : <UserPanel userData={userData}/>;
}
```


### `useSubject()`

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


### `useRxEvent()`

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


### `useRxRef()`

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


### `useRxCallback()`

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


### `useExhaustCallback()`

Hook creates a callback function that ignores all subsequent calls until the `Observable` returned from the callback of the first call completes. 
It also returns an `Observable` that acts as a busy indicator.

It takes a function as an argument that must return an `Observable`.
The function cannot be called again until the returned `Observable` completes.
As a second argument, the hook takes a function to handle potential errors.
If the second argument is not provided, errors will simply be ignored.

```typescript jsx
import { useExhaustCallback, useObservable } from 'react-rx-tools';
import { of, tap, switchMap, filter } from 'rxjs';

export function MyForm() {
  const [onSumbit, submitting$] = useExhaustCallback((event) => of(event).pipe(
    tap((e) => e.preventDefault()),
    filter(isFormDataValid),
    switchMap(submitForm),
  ), (error) => {
    analyzeSubmitError(error);
  });
  const disabled = useObservable(submitting$);

  return (
    <form onSubmit={onSumbit}>
      <FormFields disabled={disabled}/>
    </form>
  );
}
```


### `useRxFactory()`

This hook allows you to create an `Observable` directly within a component from something 
that isn't an `ObservableInput` but can be wrapped in a `new Observable()`.
It takes an array of dependencies as its second argument. If the contents of the dependencies change, the factory will be restarted.

```typescript jsx
import { Render$, useRxFactory } from 'react-rx-tools';

export type MyComponentProps = {
  store: SomeThirdPartyStore;
};

export function MyComponent({ store }: MyComponentProps) {
  const store$ = useRxFactory((subscriber) => {
    const unsubscribe = store.watch((newState) => {
      subscriber.next(newState);
    });

    return () => unsubscribe();
  }, [store]);

  return (
    <Render$ $={store$}>
      {(storeState) => {
        // render store state
      }}
    </Render$>
  );
}
```


### `useRxEffect()`

It returns memoized observable that emits after each render. Mostly it's required for technical purposes.
May be used together with `useNextRender()`.

```typescript jsx
import { useRxEffect } from 'react-rx-tools';

export function MyComponent() {
  const rxEffect$ = useRxEffect();
  
  // use rxEffect$ as reactive alternative to useEffect()
  
  return <SomeJSX/>;
}
```


### `useNextRender()`

The hook creates a function that returns an `Observable`, which emits once immediately after the next render.
It takes as an argument the result of the `useRxEffect` hook or a `RefObject` containing a similar `Observable`, 
which can be obtained from `Render$` or `Output$` components.

```typescript jsx
import { Render$, useNextRender } from 'react-rx-tools';

export function MyComponent() {
  const renderRef = useRef<RxEffectObservable>(null);
  const fromNextRender = useNextRender(renderRef);
  
  // use fromNextRender in any callback or in rxjs pipelines
  fromNextRender().subscribe(() => {
    // component Render$ just finished its internal render
  });

  return (
    <Render$ ref={renderRef} $={someData$}>
      {renderFunction}
    </Render$>
  );
}
```


### `useValueChange()`

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


### `useRxMount()`

This hook creates memoized observable that emits only once after component did mount.
It replays for late subscribers until component is unmounted.
Mostly it's needed for creating custom hooks for RxJS.

```typescript jsx
import { ReactElement, useEffect, useMemo } from 'react';
import { useRxMount, useObservable } from 'react-rx-tools';
import { skipUntil } from 'rxjs';
import { dataFromSocket$ } from './dataLayer';

export function Test(): ReactElement {
  const didMount$ = useRxMount();
  const dataFromSocket = useObservable(() => {
    return dataFromSocket$.pipe(skipUntil(didMount$));
  });

  // first value of data from socket will be received only after component did mount.

  return <SomeJSX/>;
}
```


### `useRxUnmount()`

As `useRxMount()`, this hook creates memoized observable that emits once and completes when component is unmounted.
It's also mostly helpful for internal things, such as passing this observable into `takeUntil()` operator.

```typescript jsx
import { ReactElement, useCallback } from 'react';
import { takeUntil } from 'rxjs';
import { useRxUnmount } from 'react-rx-tools';
import { openDialog } from './dialogs';

export function Test(): ReactElement {
  const unmount$ = useRxUnmount();
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


## Utils


### `multicastForUI()`

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


### `catchErrorAndComplete()`

RxJS operator that simply completes resulting `Observable` and passes caught error into callback.

```typescript
import { catchErrorAndComplete } from 'react-rx-tools';

source$
  .pipe(
    catchErrorAndComplete((error) => {
      // handle an error
      // if this callback throws an error, then resulting Observable also throws an error 
    }),
  )
  .subscribe();
```

### `catchErrorAndRetry()`

An RxJS operator that allows you to configure automatic resubscription to the original `Observable` in the event of an error. 
It accepts subscription settings such as:

 - `limit` - Non-negative integer, that specifies max amount of retries. 
   Retry attempts begin to count after the first trigger. 
   In other words, if `limit=3`, the total number of times the error handler is triggered will be 4.
   Default value is `Infinity`.
 - `delay` - Delay in milliseconds before the next attempt. Default is `0`.
 - `delayStep` - A value in milliseconds that will be added to the delay of the next attempt. 
   The delay for each subsequent attempt is increased by this amount. Default is `0`.

The error-handling callback takes two arguments: the error itself and an object containing details about the retry status. 
The object contains the following properties:

 - `firstTime` - Boolean that indicates that callback is invoked first time
 - `retriesUsed` - Number of attempts used
 - `retriesLeft` - Number of remaining attempts
 - `retriesTotal` - Total number of attempts
 - `nextRetryDelay` - Number of milliseconds until the next attempt

This information may be used to display informative messages to the user.

```typescript
source$
  .pipe(
    catchErrorAndRetry((error, retryDetails) => {
      // handle an error
      // use retryDetails to inform a user about current state of retries
      // if this callback throws an error, then resulting Observable also throws an error 
    }, {
      limit: 3, // After first error it will make 3 attampts of retry
      delay: 1_000, // The first retry will be delayed by 1 second
      delayStep: 1_000, // Second retry will be dalayed by 2 seconds and third by 3 seconds
    }),
  )
  .subscribe({
    error: (error) => {
      // This handler will be called when all retry attempts have been exhausted and the error occurs again.
      // Or if the handler function from `catchErrorAndRetry` throws its own exception.
    },
  });

```

### `distinctUntilRecordChanged()`

This is a custom operator for RxJS that filters elements in an Observable stream, 
excluding those that do not differ from the previous element in terms of their object property values.

The operator is useful in scenarios where you need to track changes in an object’s state 
(for example, in reactive application state management) and pass only those objects through the stream whose at least one property has 
changed relative to the previous one.

The operator uses the built-in `distinctUntilChanged` operator from RxJS with a custom comparator. The comparator compares two consecutive objects (`previous` and `current`) element by element:

For each property of the current object (`current`), it checks whether its value matches the value of the corresponding property in the previous object (`previous`).
The values are compared using the `Object.is()` function, which correctly handles `NaN` and `+0/-0`.
If the values do not match for at least one property, the objects are considered different, and the current object is passed into the stream.
If all properties match, the objects are considered identical, and the current object is not passed into the stream (it is filtered out).

```typescript
import { from } from 'rxjs';
import { distinctUntilRecordChanged } from 'react-rx-tools';

const stateChanges$ = from([
  { count: 1, name: 'Alice' },
  { count: 1, name: 'Alice' }, // duplicate — will be ignored
  { count: 2, name: 'Bob' },   // change — will be passed
  { count: 2, name: 'Bob' },   // duplicate — will be ignored
]);

stateChanges$.pipe(
  distinctUntilRecordChanged(),
).subscribe(value => {
  console.log('new state:', value);
});

// prints next:
// new state: { count: 1, name: 'Alice' }
// new state: { count: 2, name: 'Bob' }
```

#### Limitations and specialities:

 - Works only with objects.
 - Shallow comparison. Properties are compared at the first level of nesting. Nested objects are not compared recursively—their equality is determined using `Object.is()`.
 - The order of properties is ignored. The operator compares objects based on a set of named properties; the order in which properties are listed in the object is irrelevant.
 - Sensitivity to missing properties. If current has a property that is missing in previous, the objects are considered different. Similarly, if a property is missing in current but present in previous.


### `fromTransitionEnd()`

The function creates an Observable which emits the specified DOM element when a CSS transition ends on that element — optionally filtered by specific transition properties and with a timeout.

It is useful for reacting to the completion of CSS transitions (e.g., in animations, UI state changes), allowing you to perform side effects or update application logic once the transition finishes.

#### Parameters

 - `element`
   
   The DOM element on which to monitor the transition end event. Must be an instance of HTMLElement or SVGElement.
 
 - `transitionPropertyOrProperties`

   Specifies which CSS transition property (or properties) to monitor:
   If a string is provided, the observable will only emit when the transition on that specific property ends.
   If an array of strings is provided, the observable will emit if any of the listed properties' transitions end.

 - `duration` (optional)

   Maximum time (in milliseconds) to wait for the transition to end before emitting due to timeout. If not provided, no timeout is applied.

#### Return value

`Observable<T>`

An observable that emits the original element once:

- the specified transition(s) on the element complete, or
- the optional timeout duration elapses.

The observable completes after emitting once.

```typescript
import { fromTransitionEnd } from 'react-rx-tools';
import { subscribe } from 'rxjs';

const element = document.querySelector('.animated-box') as HTMLDivElement;

// Monitor a specific transition property with timeout
fromTransitionEnd(element, 'opacity', 3000) // wait max 3s
  .subscribe(() => {
    console.log('Opacity transition ended or timed out');
  });

// Monitor multiple properties
fromTransitionEnd(element, ['transform', 'background-color'])
  .subscribe(() => {
    console.log('Either transform or background-color transition ended');
  });
```


### `fromAnimationEnd()`

The function  creates an Observable which emits the specified DOM element when a CSS animation ends on that element — optionally filtered by specific animation names and with a timeout.

It allows you to react to the completion of CSS animations (e.g., in complex UI transitions or interactive elements), enabling you to trigger side effects or update application logic after animations finish.

#### Parameters

 - `element`

   The DOM element on which to monitor the animation end event. Must be an instance of HTMLElement or SVGElement.
   
 - `animationNameOrNames`

   Specifies which CSS animation name(s) to monitor:
   If a string is provided, the observable will only emit when the animation with that specific name ends.
   If an array of strings is provided, the observable will emit if any of the listed animations end.
   
 - `duration` (optional)

   Maximum time (in milliseconds) to wait for the animation to end before emitting due to timeout. If not provided, no timeout is applied.

#### Return value

`Observable<T>`

An observable that emits the original element once:

- the specified animation(s) on the element complete, or
- the optional timeout duration elapses.

The observable completes after emitting once.

```typescript
import { fromAnimationEnd } from 'react-rx-tools';
import { subscribe } from 'rxjs';

const element = document.querySelector('.animated-box') as HTMLDivElement;

// Monitor a specific animation with timeout
fromAnimationEnd(element, 'fadeIn', 3000) // wait max 3s
  .subscribe(() => {
    console.log('fadeIn animation ended or timed out');
  });

// Monitor multiple animations
fromAnimationEnd(element, ['slideLeft', 'pulse'])
  .subscribe(() => {
    console.log('Either slideLeft or pulse animation ended');
  });
```

### `fromFileSelect()`

The function creates an `Observable` that emits selected files when a file selection dialog is triggered. It dynamically creates a hidden file input element, opens the file picker, and emits the selected `File` or `File[]` object(s) based on the `multiple` option.

This is useful for integrating file uploads or file-based operations in web applications using a reactive programming approach with RxJS.

#### Parameters

- `options` (optional) - Configuration object with the following properties:

  - `accept` (optional)

  Specifies accepted file types using standard MIME types or file extensions (e.g., 'image/*', '.png,.jpg'). Defaults to an empty string (all file types).
      
  - `multiple` (optional)

    Determines whether multiple files can be selected.
    - If `true`, the observable emits a `File[]` array.
    - If `false` (default), the observable emits a single `File` object.

#### Return value

`Observable<File | File[]>`

An observable that emits:

 - A single `File` object if `multiple = false`.
 - An array of `File[]` objects if `multiple = true`.

The observable completes after emitting once;

```typescript
import { fromFileSelect } from 'react-rx-tools';
import { subscribe } from 'rxjs';

// Select a single file (accepts only images)
fromFileSelect({ accept: 'image/*' })
  .subscribe((file: File) => {
    console.log('Selected file:', file.name);
  });

// Select multiple files
fromFileSelect({ multiple: true, accept: '.pdf,.docx' })
  .subscribe((files: File[]) => {
    console.log('Selected files:', files.map(f => f.name));
  });

// Default usage (single file, no filters)
fromFileSelect()
  .subscribe((file: File) => {
    console.log('Default selection:', file.name);
  });
```


### `fromFileReader()`

The function creates an `Observable` that reads a `Blob` (or `File`) using the browser’s `FileReader` API and emits the result in the specified format. 
It supports reading as text, data URL, or array buffer, and includes support for aborting the read operation via an `abortSubject`.

This function is useful for reactive file processing in web applications — such as reading uploaded images, configuration files, or binary data — while maintaining clean error handling and resource cleanup.

#### Parameters

 - `file`: `Blob`

   The file (or blob) to read. Must be a valid `Blob` object (e.g., from a file input or API response).
   
 - `options` (optional): `FromFileOptions`

   Configuration object with the following properties:

    - `abortSubject`: `Subject<any>` (optional)

      A subject that, when emitted to, will abort the ongoing file read operation. Useful for cancelling long-running reads (e.g., in async workflows).

    - `readAs`: `'text' | 'dataURL' | 'arrayBuffer'` (optional)

      Specifies the format to read the file into:

       * `'text'` — emits a string (default).
       * `'dataURL'` — emits a string in data URL format (e.g., data:image/png;base64,...).
       * `'arrayBuffer'` — emits an `ArrayBuffer` object.

#### Return value

`Observable<string> | Observable<ArrayBuffer>`

An observable that emits:

- A string if `readAs` is 'text' or 'dataURL'.
- An `ArrayBuffer` if `readAs` is 'arrayBuffer'.

```typescript
import { fromFileReader, of } from 'react-rx-tools';
import { merge, Subject } from 'rxjs';
import { take, map } from 'rxjs/operators';

const file: Blob = /* ... */;
const abort$ = new Subject();

// Read as text
fromFileReader(file, { readAs: 'text' })
  .subscribe((content: string) => {
    console.log('File content:', content);
  });

// Read as data URL (e.g., for images)
fromFileReader(file, { readAs: 'dataURL' })
  .subscribe((dataUrl: string) => {
    const img = new Image();
    img.src = dataUrl;
  });

// Read as ArrayBuffer
fromFileReader(file, { readAs: 'arrayBuffer' })
  .pipe(
    map((buffer: ArrayBuffer) => new Uint8Array(buffer)),
  )
  .subscribe((uint8Array) => {
    console.log('Binary data:', uint8Array);
  });

// With abort control
const reader$ = fromFileReader(file, { readAs: 'text', abortSubject: abort$ });
reader$.subscribe((text) => console.log(text));

// Cancel the read after 1 second
setTimeout(() => abort$.next(), 1000);
```


### `fromMediaQuery()`

The function creates an `Observable` that tracks changes to a CSS media query’s match state in the current viewport. 
It emits a `boolean` value indicating whether the media query condition is currently met, and continues to emit whenever the match state changes (e.g., due to window resizing).

This is useful for building responsive UIs with reactive logic — allowing components to react to media query state changes without manually listening to resize events.

Accepts а valid CSS media query string to monitor. Examples:

 - `'(max-width: 768px)'` — detects narrow screens.
 - `'screen and (orientation: portrait)'` — detects portrait orientation.
 - `'print'` — detects print media.

```typescript
import { fromMediaQuery } from 'react-rx-tools';
import { subscribe, map, filter } from 'rxjs';

// Detect mobile viewports (max-width: 768px)
fromMediaQuery('(max-width: 768px)')
  .subscribe((isMobile: boolean) => {
    console.log('Is mobile:', isMobile);
    // Toggle mobile-specific UI logic
  });

// Only act when entering mobile mode
fromMediaQuery('(max-width: 768px)')
  .pipe(
    filter((isMobile) => isMobile), // Only emit true values
  )
  .subscribe(() => {
    console.log('Entered mobile mode — adjust layout');
  });

// Use in component logic (e.g., hide sidebar on mobile)
const isDesktop$ = fromMediaQuery('(min-width: 769px)');
isDesktop$.subscribe((isDesktop) => {
  document.getElementById('sidebar').style.display = isDesktop ? 'block' : 'none';
});
```


### `fromMutationObserver()`

The function creates an `Observable` that monitors DOM mutations (changes) on a specified node using the browser’s `MutationObserver` API. 
It emits each `MutationRecord` whenever a change occurs, enabling reactive responses to DOM modifications.

This is useful for building dynamic UIs, tracking structural or attribute changes, or implementing custom directives that react to DOM updates.

```typescript
import { fromMutationObserver } from 'react-rx-tools';
import { map, filter } from 'rxjs/operators';

// Observe child node additions/removals
const container = document.getElementById('my-container');

fromMutationObserver(container, { childList: true, subtree: true })
  .subscribe((mutation: MutationRecord) => {
    console.log('Mutation detected:', mutation);
    // React to structural changes (e.g., update UI state)
  });

// Filter for attribute changes only
fromMutationObserver(container, { attributes: true })
  .pipe(
    filter((mutation) => mutation.attributeName === 'class'),
  )
  .subscribe((mutation) => {
    console.log('Class attribute changed:', mutation);
  });

// Track text content changes
fromMutationObserver(someTextNode, { characterData: true })
  .subscribe((mutation) => {
    console.log('Text content changed:', mutation.target.textContent);
  });
```


### `fromResizeObserver()`

The function creates an `Observable` that monitors size changes (resizing) of a specified DOM element using the browser’s `ResizeObserver` API. 
It emits `ResizeObserverEntry` objects whenever the element’s dimensions change, enabling reactive responses to layout modifications.

This is useful for building responsive UIs, implementing adaptive layouts, or triggering actions based on element size changes (e.g., adjusting content, showing/hiding elements).

```typescript
import { fromResizeObserver } from 'react-rx-tools';
import { map, filter } from 'rxjs/operators';

// Monitor size changes of a container
const container = document.getElementById('my-container');

fromResizeObserver(container)
  .subscribe((entry: ResizeObserverEntry) => {
    console.log('Size changed:', entry.borderBoxSize[0]);
    // React to size changes (e.g., adjust layout)
  });

// Monitor using content-box measurements
fromResizeObserver(container, { box: 'content-box' })
  .subscribe((entry) => {
    console.log('Content-box size:', entry.contentBoxSize[0]);
  });

// Filter for significant size changes only
fromResizeObserver(container)
  .pipe(
    filter((entry) => entry.borderBoxSize[0].blockSize > 500),
  )
  .subscribe(() => {
    console.log('Element became large — trigger action');
  });
```


### `fromReportingObserver()`

The function creates an `Observable` that monitors browser reporting events (e.g., security violations, deprecations, interventions) using the `ReportingObserver` API. 
It filters and emits relevant reports based on specified report types, enabling reactive handling of browser-level issues and warnings.

This is useful for debugging, monitoring security issues, tracking deprecated APIs, or implementing compliance checks in web applications.

```typescript
import { fromReportingObserver } from 'react-rx-tools';
import { filter, map } from 'rxjs';

// Monitor only CSP violations
fromReportingObserver(['csp-violation'])
  .subscribe((report: CSPViolationReport) => {
    console.warn('CSP violation detected:', report.body);
    // Log to analytics or alert team
  });

// Monitor deprecation warnings
fromReportingObserver(['deprecation'])
  .pipe(
    filter((report) => report.body.anticipatedRemoval),
  )
  .subscribe((report: DeprecationReport) => {
    console.log('Deprecated feature will be removed:', report.body.message);
  });

// Monitor multiple report types
fromReportingObserver(['integrity-violation', 'permissions-policy-violation'])
  .subscribe((report: TypedReport) => {
    console.error('Security issue:', report);
    // Take action based on report type
  });
```

### `rxIntersectionObserver()`

The function creates a reactive wrapper around the browser’s `IntersectionObserver` API, returning an object (`RxIntersectionObserver`) that enables observing element visibility changes in a composable, RxJS-friendly way.

It allows you to monitor when elements enter/exit the viewport or a specified root element, emitting `IntersectionObserverEntry` objects as observables — ideal for lazy loading, infinite scrolling, or visibility-based UI logic.

```typescript
import { rxIntersectionObserver } from 'react-rx-tools';
import { filter, map } from 'rxjs/operators';

const intersectionObserver = rxIntersectionObserver({
  threshold: [0, 0.5, 1], // emit at 0%, 50%, 100% visibility
});

// Observe a specific element
const lazyImage = document.getElementById('lazy-image');

intersectionObserver.observe(lazyImage)
  .pipe(
    filter((entry) => entry.isIntersecting), // Only when visible
    map((entry) => entry.target as HTMLImageElement),
  )
  .subscribe((img) => {
    img.src = img.dataset.src; // Load image when visible
  });

// Multiple elements (e.g., infinite scroll items)
const items = document.querySelectorAll('.scroll-item');
items.forEach((item) => {
  intersectionObserver.observe(item)
    .pipe(
      filter((entry) => entry.intersectionRatio &gt; 0.3), // More than 30% visible
    )
    .subscribe(() => {
      console.log('Item is mostly visible:', item);
      // Load content, trigger animation, etc.
    });
});

// Cleanup when done
intersectionObserver.disconnect();
```


## License

MIT
