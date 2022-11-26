# Negation

A fact not existing in the database doesn't necessarily mean it won't eventually be derived. This simple fact makes negation tricky.

# Monotonicity
Datalog rules as described have the property that once a fact is derived, it is never removed from the database. The set of facts keeps growing. \\( DB_{n} \subset DB_{n+1} \\).

Why should we care?

Programs can be viewed at different levels of detail. Certainly we all know that renaming the variables in a program does not really change it. Sometimes reordering some assignments and lifing things out of loops and removing redundant or dead computations don't change our programs in some sense.
There is an intent behind most programs and these low level changes don't really change the intent. A factorial function returns factorial regardless if it uses a loop or recursion or SIMD instructions or whatever.
When we can make clear in our programs what is intent and what is details that don't really matter that much, the compiler or runtime environment is free to make choices to change the irrelevant details. This is a core behind the idea of declarative languages.

When I write a datalog program, I do have a vague operational model in my head of how it executes. This may not at all be the case.




# Forall
In classical logic, you can compile some of the logical operations into simpler forms.
the universal quantifier $\forall x, P(x)$ is the same as $\not \exists x\not P(x)$
Implication $a \rightarrow b = \neg a \lor b $.

Forall is a thing that it is tempting to talk about when modelling problems
"If for every predecessor such and such exists, then foo is true".

The natural forall datalog has is that surrounding the entire clause.

The natural exists is 

See notes from that course.
See [prolog forall](https://www.swi-prolog.org/pldoc/man?predicate=forall/2) This also implements a forall using negation





