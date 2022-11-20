# Basics

To get started, let's demonstrate the core constructs of Datalog.

In Souffle Datalog, tables are declared alongside the types and names of their columns. This is the analog of a `CREATE` statement in SQL. The names of the columns are not used except for printing in Souffle.

Souffle Datalog has a number of basic built in types

- `symbol` is effectively a string datatype
- `number` is signed integers
- `unsigned` is unsigned integers
- `float` are floating point numbers

Here's an example declaration

```souffle
.decl sausages(maker : symbol, difference : number, count : unsigned, inches : float)
```

## Facts

Facts are inserted into the database by "calling" the table with values for the columnsc followed by a period. 
This is the analog of a `INSERT INTO mytable FROM VALUES ("42",-42,42,42.1);` statement in SQL.

Tables in Souffle datalog have set semantics, meaning duplicate rows are coalesced into a single row.

The user only sees relations marked as `.output`.

```souffle,editable
.decl mytable(x : symbol, y : number, z : unsigned, w : float)
mytable("42", -42, 42, 42.1).
mytable("42", -42, 42, 42.1). // Duplicate rows are coalesced
mytable("Hi", -47, 7331, 11.1).
.output mytable(IO=stdout)

.decl this_table_wont_print(x : symbol)
this_table_wont_print("hidden").
```

## Rules
The simplistic syntax for insertion of facts is nice, but datalog rules are where it shines.

Rules describe how new facts can be derived from the already known database of facts. Sometimes the initial facts are called the intensional database (IDB) and the derived facts are called the extensional database (EDB).

They have a right hand side know as a clause which corresponds roughly to a `SELECT` query and left hand side known as a head which corresponds to an `INSERT`. Facts can be seen as a rule with an empty unconditional body.

An SQL style query can be encoded by making a rule whose body corresponds to the query and saves the result to a table in the head.

```souffle
.decl foo(x : symbol, y : symbol)
foo("a","a").
foo("b","a").

.decl myquery(x : symbol)
myquery(a) :- foo(x,x). 
.output myquery(IO=stdout)
```

## Recursion
Ok, rules are great, but what is _really_ great are recursive rules.

There is something to be said about examples involving family. This is a concept we primally understand (hence the popularity of the Fast and Furious franchise).

We can use rules to extract grandparent, greatgrandparent, and greatgreatgrandparent tables from parent tables.

```
grandparent(a,c) :- parent(a,b), parent(b,c).
greatgrandparent(a,c) :- parent(a,b), grandparent(b,c).
greatgreatgrandparent(a,c) :- parent(a,b), greatgrandparent(b,c).
```

There is a theme here, a pattern to extract. Any person deep in our family tree is our ancestor. To describe this concept, we can use a recursive rule. Our parent is our ancestor, and the parent of our ancestor is also an ancestor.

```
ancestor(a,b) :- parent(a,b).
ancestor(a,c) :- parent(a,b), ancestor(b,c).
```

We can also count how deep a relationship is.

```
ancestor(1, a, b) :- parent(a,b).
ancestor(n+1, a,c) :- parent(a,b), ancestor(n,b,c).
```

Your ancestors should form a tree structure. If they form a DAG, that's kind of messed up.

If your ancestor relationship has _cycles_ in it, that is deeply troubling as a human. But datalog will be happy as a clam!

## Exercises



## Resources
- [Exotic Programming Ideas: Part 4 (Datalog) - Stephen Diehl](https://www.stephendiehl.com/posts/exotic04.html)
- [Souffle Datalog tutorial](https://souffle-lang.github.io/tutorial)





 

```souffle,editable
.decl edge(x : number, y : number)
edge(1,2).
.output edge(IO=stdout)
```

Hey

Suggestions:
Easy Sudoku
matrix logic puzzles.
first cousins
