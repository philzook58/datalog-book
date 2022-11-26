# Algebraic Data Types

Algebraic data types are a programming language feature that are very useful for describing tree-like structures.

```souffle
.type IntList = Nil {} | Cons {hd : number, tl : IntList}
.type BinTree = Empty {} | Leaf {n : number} | Node {left : BinTree, right : BinTree}

```


Traditional datalog does not include algebraic datatypes. Algebraic datatypes completely destroy the termination guarantees of datalog.

```souffle
.type Nat = Succ {prev : Nat} | Zero {}

.decl nats(n : Nat)
nats($Zero()).
nats($Succ(n)) :- nats(n).
.limitsize nats(n=10)
.output nats(IO=stdout)
```

Despite that, they are profoundly useful.

## Subterm predicates
A useful predicate is one that collects up all subterms. You can use this for example to determine which lists to compute the length of. Without this blocking predicate, datalog would compute the length of all lists, which is not what you want.

```souffle
.type IntList = Nil {} | Cons {hd : number, tl : IntList}
.type BinTree = Empty {} | Leaf {n : number} | Node {left : BinTree, right : BinTree}

.decl list(l : IntList)
list(tl) :- list($Cons(_hd,tl)).
.decl bintree(b : BinTree)
bintree(left), bintree(right) :- bintree($Node(left,right)).

.decl length(l : IntList, n : unsigned)
length($Nil(), 0).
length(l, n + 1) :- list(l), l = $Cons(_hd,tl), length(tl, n).

list($Cons(3,$Cons(2,$Cons(1,$Nil())))).
.output length(IO=stdout)
```

## Autoinc and Skolemization
It is very tempting and operationally simple to use the `autoinc()` feature, which maintains a mutable counter that increments by one every time you call it. This is really problematic with regards to the declarative semantics of datalog. You get different results depending on the order and how many times you execute rules.

It is almost universally better to use ADTs instead of `autoinc()`. The reason this is so is that you can replace the id with a term that holds the _reasons_ you thought you needed a new id. Then, if the same reasons apply again, it will produce the same term. This same term will not make a new duplicate entry in the database, because datalog is manipulating sets, whereas autoinc would produce a fresh number and that _would_ produce an essentially duplicate record. It is quite hard to get autoinc to terminate ever, and even worse it produces a lot of junk.


# Egglog

Egglog is also intimately based around the concept of datatypes.
There are a number of differences from souffle's treatment
1. Datatypes are open. You can add new constructors. In fact, egglog's notion of datatype is not currently distinct from egglog's notion of function.
2. Datatypes are searchable. Souffle does not store flattened ADTs as regular tables. Instead it uses a record storing hash table. The only way this hash table can be queried is by dereferencing a record id, or giving the table a record to produce an id. Partially filled in records as queries are not a thing. You can manually reflect into indexing tables if you like. This is a common technique.
3. Egglog's "record ids" are not stable over time. They change as the equality relation discovers new relationships.


```scheme
(datatype Expr (Add Expr Expr) (Lit i64))
```