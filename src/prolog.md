# Prolog

Read [The Power of Prolog](https://www.metalevel.at/prolog).

# Prolog vs Datalog

Compare with top down vs bottom up in dynamic programming.

Datalog is the "answer" half of prolog. It corresponds to "returns" in prolog

# What is Logic Programming
Computation = Proof Search.

`:-` is horizontal bar of inference rules.



## Pure vs Impure Prolog
For the purposes of this book, I am only referring to mostly pure constructs in prolog.

Because the control flow of prolog is relatively predictable compared to datalog or minikanren, there is an irresistable temptation to use imperative constructs.
This situation mirrors that of Haskell vs Scheme/Ocaml. The lazy excution of haskell makes reasoninig about _true_ side effectful code so difficult that they are forced to use the monadic paradigm. There are benefits to this discipline.

# Magic Set

# Unification Variables
The meaning of unification variables is not just one thing.


# Minikanren
At the level of comparison of this book, minikanren is more or less the same as prolog. It has a very similar notion of unification variable, is top down. It differs from prolog in the method by which is chooses to perform search.

[Will Byrd](https://stackoverflow.com/questions/28467011/what-are-the-main-technical-differences-between-prolog-and-minikanren-with-resp) chips in on his comparison between prolog and minikanren.

# Tabling

