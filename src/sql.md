# SQL

SQL at it's core is expressions of the form `SELECT ... FROM ... WHERE ...`. This makes it more query language like than programming language like. Most programming languages have a more recursive structure.


Extensions to SQL can do all sorts of crazy things.



- SQL is multiset based, datalog is set based (typically)
- SQL gives variable names to rows, datalog gives variable names to row entries.
- Datalog allows variables to share names defining an implicit equality constraint

SQL is a useful language to perform macro operations on databases. Datalogs can be built upon a SQL interface. This isn't persay even inefficient, since the processing of the SQL text overhead will often be small compared to the manipulation of the database itself.

See these blog posts:
- [Duckegg: A Datalog / Egraph Implementation Built Around DuckDB](https://www.philipzucker.com/duckegg-post/)
- [Datalite: A Simple Datalog Built Around SQLite in Python](https://www.philipzucker.com/datalite/)

## Recursive Common Tables Subexpressions

Recursive Common Table Subexpressions enable the descrpition of an extremely limittied form of datalog.


Triggers might possibly be usable to do certain datalog like tasks