# Functional Programs

There are two issues to tackle when converting functional programs to datalog.

1. Datalog deals mostly in relations not functions.
2. Datalog is bottom up, whereas functional programs are demand driven (they only compute functions that are called).


Functional programs can be converted to logic programs by making the return value a parameter to the relation. A function is a subcase of relations in which the last column is determined by the initial columns.

For example, the function `factorial(n)` becomes the relation `factorial(n,res)` or `append(x,y)` becomes `append(x,y,res)`.

```python
def factorial(n):
    if n == 0:
        return 1
    else:
        return n * fact(n-1)
```


```souffle
.decl factorial(n : unsigned, res : unsigned)
factorial(0,1).
factorial(n+1, (n + 1) * m) :- factorial(n, m), n < 10.
.output factorial(IO=stdout)
```

A priori I have chosen to stop the process at `n = 10`. This is fine if we can know at compile time what answers we need computed. What if we don't though? Then we need to write the function in a demand driven style.

## Demand
A simple mechanism to achieve translate function programs is to define auxiliary demand relations. These relations do not have the field corresponding the result of the function.

Demand needs to be propagated downward. For every subcall in the body of a functions definition, you need to produce the demand for that subcall.

```souffle,editable
.decl _factorial(n : unsigned)
.decl factorial(n : unsigned, res : unsigned)
factorial(0,1).
_factorial(n-1) :- _factorial(n), n > 0. // demand propagation
factorial(n+1, (n + 1) * m) :- _factorial(n+1), factorial(n, m).

_factorial(10).
.output factorial(IO=stdout)
```

## Lists
We can show some common list functions to demonstrate this point further.

```souffle
.comp List<A>{
  .type t = [hd : A, tl : t]
  .decl _length(l : t)
  .decl length(l : t, res : unsigned)
  
  _length(tl) :- _length([_hd,tl]).
  length(nil,0).
  length([hd,tl], n+1) :- _length([hd,tl]), length(tl,n).

  .decl _nth(l : t, n : unsigned)
  .decl nth(l : t, n : unsigned , res : A)
  _nth(tl, n - 1) :- _nth([_hd,tl], n), n > 0.
  nth([hd,tl],0,hd) :- _nth([hd,tl], 0).
  nth([hd,tl], n, res):- _nth([hd, tl], n), nth(tl, n-1, res).

  .decl _rev(l : t)
  .decl __rev(l : t, rem : t, acc : t)
  .decl rev(l : t, res : t)
  __rev(l, l, nil) :- _rev(l).
  __rev(l, tl, [hd,acc]) :- __rev(l, [hd, tl], acc).
  rev(l, acc) :- __rev(l, nil, acc).

  .decl _append(x : t, y : t)
  .decl append(x : t, y : t, z : t)
  _append(tl, y) :- _append([_hd, tl], y).
  append(nil, y, y) :- _append(nil, y).
  append([hd,tl], y, [hd, z]) :- _append([hd,tl], y), append(tl, y, z).

  .decl _mem(x : A, l : t)
  .decl mem(x : A, l : t, res : number)
  mem(x, nil, 0) :- _mem(x, nil).
  mem(x, [hd,tl], 1) :- _mem(x, [hd,tl]), x = hd.
  _mem(x, tl) :- _mem(x, [hd,tl]), x != hd.
  mem(x, [hd,tl], res) :- _mem(x, [hd,tl]), x != hd, mem(x, tl, res).

}
```

## The Stack
In the actual implementation of a functional program, there exists some data structure to keep track of who needs what results and what to do with them next. This is typically achieved via a stack, which records return addresses and records the needed state of the call site.

The stack is an implicit data structure that most languages maintain for you, but it is useful to note sometime that it is there.

This same observation is useful in other programming contexts. It is sometimes relatively wasteful to use the general purpose function call mechanism. You can convert a recursive function call into a loop and maintain that analog of your own stack for efficiency purposes.

Datalog does not have an implicit stack. If you want such a thing, you must build it.


# Demand by Option Lattice
A refactoring of the above 2 relations,is to use one single lattice where the result field is in an Option lattice. The value of None represents unknown value / demand and Some(x) represents a computed result.


# Egglog
Egglog is a new style of datalog

# Macros
Souffle datalog by default offers C preprocesor macros. These are useful for defining simple functions.

# Inline Relations
Souffle datalog offers a feature of inline relations. This performs top down resolution at compile time, but has to terminate, so inline relations cannot be recursively defined.. This is mainly useful for simple complex but non recursive definitions.