# Functional Programs

There are two issues to tackle when converting functional programs to datalog.

1. Datalog deals mostly in relations not functions.
2. Datalog is bottom up, whereas functional programs are demand driven (they only compute functions that are called).


Functional programs can be converted to logic programs by making the return value a parameter to the relation. A function is a subcase of relations in which the last column is determined by the initial columns.

For example, the function `factorial(n)` becomes the relation `factorial(n,res)` or `append(x,y)` becomes `append(x,y,res)`.


```souffle
.decl factorial(n : unsigned, res : unsigned)
factorial(0,1).
factorial(1,1).
factorial(n+1, (n + 1) * m) :- factorial(n, m), n < 10.
.output factorial(IO=stdout)
```

A priori I have chosen to stop the process at `n = 10`. This is fine if we can know at compile time what answers we need computed. What if we don't though? Then we need to write the function in a demand driven style.

## Demand



## The Stack
In the actual implementation of a functional program, there exists some data structure to keep track of who needs what results and what to do with them next. This is typically achieved via a stack, which records return addresses and records the needed state of the call site.

The stack is an implicit data structure that most languages maintain for you, but it is useful to note sometime that it is there.

This same observation is useful in other programming contexts. It is sometimes relatively wasteful to use the general purpose function call mechanism. You can convert a recursive function call into a loop and maintain that analog of your own stack for efficiency purposes.

Datalog does not have an implicit stack. If you want such a thing, you must build it.




# Macros

Souffle datalog by default offers C preprocesor macros. These are useful for defining simple functions.

# Inline relations