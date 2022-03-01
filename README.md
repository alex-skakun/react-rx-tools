# react-rx-tools

An easy-to-use toolkit for React.js that lets you use RxJS observables directly in your components.

## Custom hook `useObservable()`

This custom hook allows you to retrieve data from observable in a familiar and simple way for React.js. 
When an observable emits new data component will be updated.

### Example

```typescript jsx
import React from 'react';
import { useObservable } from 'react-rx-tools';
import { userDataService } from './userData';


const UserPanel = () => {
  // component will be rerendered when userDataService.userData$ provides new userData
  const userData = useObservable(userDataService.userData$);

  return <>
    {
      userData.isGuest
        ? <a href="/login">Login</a>
        : <a href="/account">{ userData.email }</a>
    }
  </>;
};
```

## Component `<RenderAsync />`

The purpose of this component is very similar to `useObservable()`, but with some differences:

1. The component works not only with `Observable`, but also with `ObservableInput`. 
   This allows it to be applied in a more flexible way.
2. When getting new data from `Observable`, the component redraws only its children. This allows to optimize performance.
3. A component may not redraw its children if the source observable provides `null` or `undefined`. 
   You can customize this behavior with an additional property.

### Props

- `source` - a value that matches `ObservableInput` type.
- `definedOnly` - indicates should component ignore `null` and `undefined` and don't render anything in this case. 
  Default is `false`.
- `children` - component accepts children only as function and passes the latest value from source as argument.

### Example

```typescript jsx
import React from 'react';
import { RenderAsync } from 'react-rx-tools';
import { userDataService } from './userData';


const UserPanel = () => {
  return <RenderAsync source={userDataService.userData$} definedOnly>
    { userData => <>
      {
        userData.isGuest
          ? <a href="/login">Login</a>
          : <a href="/account">{ userData.email }</a>
      }
    </> }
  </RenderAsync>;
};
```

## Helper functions

### `isDefined()`

Returns true if passed value is not `null` or `undefined`. Also, it confirms that passed value is `NonNullable`.

```typescript
import { isDefined } from './react-rx-tools';


type Point = null | {
  x: number;
  y: number;
};

export function handlePoint(point: Point): void {
  if (isDefined(point)) {
    // point is not null and it is known for TypeScript compiler
  } else {
    // point is null
  }
}
```

### `getCurrentFromObservable()`

If an observable synchronously emits data on subscribe, this function helps to get it in simple way.

```typescript
import { getCurrentFromObservable } from './react-rx-tools';
import { userDataService } from './userData';


const data = getCurrentFromObservable(userDataService.userData$);

// data will be UserData or undefined
```

## License

MIT
