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

It is almost universally better to 