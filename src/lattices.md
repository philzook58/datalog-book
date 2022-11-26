# Aggregates, Lattices, and Subsumption

# Lattices
A lattice is a very useful mathematical concept for computer science. The common applications involve a data structure or data type that have some notion of combination.

The algebraic laws of the lattice are
- idempotency - It's ok for the system to combine things twice
- commutativity and associativity - It's ok for the system to reorder operations

If a computer system can know it's ok to do these things are still get the same results, significant oppurtunities for optimization present themselves. One becomes free for example to perform operations in a distributed way and combne them back together in whatever order or duplication the results arrive in. 

Lattices often have the feel of some bound getting tighter, information being gained, or a structure becoming more defined.

Examples include:
    - integers combined under maximum 
    - integers combined under minimum
    - Intervals
    - Option
    - Sets under intersection or union


```scheme
(function best (String) i64 :merge (max old new)) ; :default 0

(set (best "a") 10)
(set (best "a") 20)
(set (best "b") 5)
;(define bestc (best "c"))
(set (best "a") 42)

(print best)
```


When you observe a lattice value, you should not say that lattice value _is_ the value you see, rather the lattice value is a lower bound upon it's eventual fixed point value. A more general statement is that observations can correspond to filters, upwards closed sets of lattices.

# Aggregates
Aggregates include sum, count, multiplication

Traditionally, aggregates are determined after the fixed point is reached in the datalog rule iteration. In this sense, aggregation is a relative of negation, which also requires the fixed point before it can determine a fact with never be dervied.


# Subsumption
Souffle has a very powerful feature called subsumption, which is a form of conditional deletion.


#### max min
Max, min using subsumption. 
```
mymax(z) :- reltomax(z).
mymax(z) <= mymax(z2) :- z1 <= z2.
```

Can I do sum and count? Maybe not. Not without tracking what we've already used. You could do this with bitsets. Requires reflection I guess. c
Ah, I don't need to require tracking the set of already used, only count. Oh. Wait. no.
```
mysum(count : unsigned, partial_sum : unsigned)
mysum(1,n) :- foo(n).
mysum(n+1,) 
nope
```
But if I cluster them into groups, I can take approximate sums.
What if I track the current biggest element in the sum. This is tracking the state of a naive summation algorithm. We can lways necode an imperative algorithm to datalog by tracking state. This relies on summing positive numbers only
```
mysum(n,n) :- foo(n).
mysum(n, partsum + n) :- mysum(top,partsum), foo(n), top < n.
mysum(n,sum) <= mysum(n,sum') :- sum <= sum'.
```

count
```
mycount(n,1) :- foo(n).
mycount(n, partcount + 1) :- mysum(top,partcount), foo(n), top < n.
mysum(n,count) <= mysum(n,count2) :- count <= count2.
```

Could hyperloglog be relevant for approximate counts? https://en.wikipedia.org/wiki/HyperLogLog

A* search. Interesting. If you have the a bound on distance you can subsumpt away bad possible paths. Path search is a canonical datalog program. Subsumption allows shortest path search (which I showed above).

#### Lattices
See also bitset lattice above

Lattices are in some respects just an optimization. They allow the database to coalesce rows in a principled way. One could allow the database to be filled with the junk of lesser lattice values.

Lattices can be sometimes encoded into finite sets. Consider the 4 valued lattice of unknonw, true, false, conflict. These are the power sets of a set of size 2. This can be represented as two tables which can be in different states of full. Because of stratified negation, it is not always possible to observe things. You shouldn't really observe anything other than filter questions anyhow though. Anf you're always above unknown.
true(a), false(a)

You often need 1 rule to combine pieces with the join of the lattice and 1 rule for subsumption. This is probably not efficient, but it is works.
It would be be nice to have a construct that did both at once efficiently. We should be immeditaly erasing a and b when we compute their join.

```souffle
rel(join(a,b)) :- rel(a), rel(b).
rel(a) <= rel(b) :- lattice_order(a, b).
```

Perhaps you could make a generic lattice compment parametrized over join

```
.comp Lattice<T> {
  .decl join(x: T, y : T, z : T) overridable
  .decl r(x:T, y:T)
  r(z) :- r(x), r(y), join(x,y,z).
  r(x) <= r(y) :- join(x,y,y).
}
```
But filling out joi will be annoying. There isn't a great way to parametrize over functors so far as I can tell.



Todo:
- vsa


##### Min/max lattice

labaeller Max lattice
I suppose in a sense this is the lattice of the function space `T -> int` defining join pointwise. If that's your bag.

```souffle
.comp Upper<T> {
   .decl upper(label: T, x : unsigned)
   upper(l,x) <= upper(l,x1) :- x <= x1.
}

.comp Lower<T> {
   .decl lower(label: T, x : unsigned)
   lower(l,x) <= lower(l,x1) :- x1 <= x.
}

.init symu = Upper<symbol>

symu.upper("x", 1).
symu.upper("x", 7).
symu.upper("y", 4).
.output symu.upper(IO=stdout)

```

If you have both, you have an interval, see below.

##### Maybe/Option lattice

```prolog

.type optionsymbol = None {} | Some {val : symbol}

.decl A(v : optionsymbol)

A($Some("foo")).
A($Some("fiz")).
A($Some("foz")).
//A($None()).

A($None()) :- A(x), A(y), x != y.
A(x) <= A($None()) :- A($None()).

.output A(IO=stdout)
```

Also you can make N max set lattice. Keep sorted. Insertion sort. Kind of a pain if you get too many

```
.type Nary = None {} | One {a : T} | Two {a : T, b : T} | Top {}
```


##### Intervals

```souffle
.type Interval = [l : float, u : float]
.type Expr = Add {a : Expr, b : Expr} | Lit { a : float} | Var {x : symbol} 

// all expressions
.decl expr(e : Expr)
expr(a), expr(b) :- expr($Add(a,b)).

expr($Add($Var("x"), $Lit(1))).

.decl iexpr(e : Expr, i : Interval)
iexpr($Lit(n), [n,n]):- expr($Lit(n)).
iexpr(e, [la + lb, ua + ub]) :- iexpr( a, [la,ua] ), iexpr(b, [lb, ub]), e = $Add(a,b), expr(e).

// also vice versa back down the tree
iexpr(b, [ l1 - ua, u1 - la]) :- iexpr($Add(a,b), [l1,u1]), iexpr(a, [la,ua]).


iexpr($Var("x"), [-1,1]).
iexpr($Var("x"), [0,1]).
iexpr($Add($Var("x"), $Var("x")), [0.5,0.75]).

// meet semantics
iexpr(e, [max(l1,l2), min(u1,u2)]) :- iexpr(e, [l1,u1]), iexpr(e, [l2,u2]).
iexpr(e, [l1,u1]) <= iexpr(e, [l2,u2]) :- l1 <= l2, u2 <= u1.  
.output iexpr(IO=stdout)
```
It may not be worth packing into a record though. This almost certainly has performance cost. Records never get deleted. So you should just unpack into a relation. 


```
// intervals getting bigger
/*
components?
We'd need to know at compile time how many possible instantations
.comp Interval<T>{
    .decl upper(x : T)
    .decl lower(x : T)
}


*/
.decl upper(t : symbol, x : float)
upper(t,x) <= upper(t, y) :- x <= y.
.decl lower(t : symbol, x : float)
lower(t,x) <= lower(t, y) :- y <= x.

.output upper(IO=stdout)
.output lower(IO=stdout)

upper("foo", 7).
upper("foo", 8).
upper("fiz", 9).

lower("foo", 8).
lower("fiz", 9).
lower("foo", -3).


.comp Interval<T>{
    .decl upper(x : T)
    upper(x) <= upper(y) :- x <= y.
    .decl lower(x : T)
    lower(x) <= lower(y) :- y <= x.
}
.init i1 = Interval<float>

i1.upper(3).
i1.upper(14).
.output i1.upper(IO=stdout)
```

# BitSets

# First Class Sets