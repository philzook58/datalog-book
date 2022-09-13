# Introduction

Well, hey there buddo!

This book is intended to be an introduction to the programming language datalog. There isn't an overwhelming number of resources out there about datalog and some never get past queries over movie or employee databases. Datalog really is a programming language.

Datalog is fascinating from multiple perspectives.

- Operational - Datalog rules have a simple model of execution
- Relational - Datalog is a declarative description language of relations
- Logical - Datalog rules can be read as logical axioms

There is a thrill that comes from finding out how to program a system that does not offer the typical programming constructs. Some other restrictive or unusual systems might include regular expressions, sql, apl, forth, vectorized arrays, SIMD operations, assembly, typelevel programming, or weird machines. From these restrictions come great pains but also great gains. Datalog by is highly parallelizable and has execution strategies that avoid large redundant calculations you might naively make.

This book is built around the syntax of the implementation [Souffle Datalog](https://souffle-lang.github.io/).