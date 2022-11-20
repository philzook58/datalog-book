# Imperative Programs

Imperative programs proceed via a manipulation of state.

In essence, a stateful program can be emulated in datalog by recursively transforming one state to the next.

```
state(x,y,z) :- state(x,y,z).
```

It is desirable from a modelling perspective to separate out a notion of position in the program as special. Example of position include the state in a state machine, the program counter in assembly, or the statement label in a typical imperative program.


