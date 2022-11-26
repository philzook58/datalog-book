# Egglog

```scheme,editable,runnable

; edit me
(datatype Expr (Lit i64) (Add Expr Expr))
(rewrite (Add (Lit i) (Lit j)) (Lit (+ i j)))
(relation expr (Expr))
(expr (Add (Lit 1) (Lit 2)))
(run 10)
(print expr)

```


# Egglog by Example

(Copied From Pearls Section of paper submission)

In this section, we will walk through a list of examples
 showing the wide applications of egglog.

## Functional Programming with Egglog




 Egglog is capable of evaluating many functional programs very naturally.
 The standard evaluation of Datalog programs is traditionally done bottom up.
 Starting from the facts known,
  it iteratively derives new facts,
  and when it terminates,
  all the derivable facts
  are contained in the database.
 In the evaluation of functional programs,
  however,
  we usually start with the goal of evaluating a big expression and
  break it down into smaller goals while
  traversing the abstract syntax tree from root to leaves,
  before collecting the results bottom up.
 In order to simulate the top-down style of evaluation
  of functional programs,
  Datalog programmers need to create manual ``demand'' relations
  that carefully tune the firing of rules
  to capture the evaluation order of functional programs.
 On the other hand,
  egglog express many functional programs very naturally,
  thanks to the unification mechanism.

 For example, consider the task of computing the relation `tree_size`,
  which maps trees to their sizes.
 A full instantiation of the `tree_size` finds the size of _all_ trees
  and therefore is infinite,
  so bottom-up evaluations will not terminate
  in languages like Souffle.
 We need to manually _demand transform_ the program
  to make sure we only instantiate `tree_size`
  for the trees asked for and their children.
 Demand transformation first populates a "demand" relation,
  and `tree_size` will compute only trees that resides in the demand relation.
 The program is shown below.
 To get the size of a specific tree,
  we have to first insert the tree object into the `tree_size_demand`
  relation to make a demand, before looking up `tree_size` for
  the actual tree size.

```souffle
 .type Tree = Leaf {} | Node {t1: Tree, t2: Tree}
 .decl tree_size_demand(l: Tree)
 .decl tree_size(t: Tree, res: number)
 // populate demands from roots to leaves
 tree_size_demand(t1) :-
     tree_size_demand($Node(t1, t2)).
 tree_size_demand(t2) :-
     tree_size_demand($Node(t1, t2)).
 // calculate bottom-up
 tree_size($Node(t1, t2), s1 + s2) :-
     tree_size_demand($Node(t1, t2)),
     tree_size(t1, s1),
     tree_size(t2, s2).
 tree_size($Leaf(), 1).
 // compute size for a particular tree
 tree_size_demand($Node($Leaf(), $Leaf())).
 .output tree_size

```


 Similar to Datalog, Egglog programs are evaluated bottom up.
 However, we do not need a separate demand relation in Egglog,
  because we can use ids
  to represent unknown or symbolic information.
 To query the size of a tree   `t`,
  we simply put the atom `(tree_size t)` in the action.
 egglog will create a fresh id as a placeholder for the value
  `tree_size` maps to on `t`,
  and the rest of the rules will
  figure out the actual size subsequently.
 The egglog program is shown below.


```scheme
 (datatype Tree (Leaf) (Node Tree Tree))
 (datatype Expr (Add Expr Expr) (Num i64))
 (function tree_size (Tree) Expr)
 ;; compute tree size symbolically
 (rewrite (tree_size (Node t1 t2))
     (Add (tree_size t1) (tree_size t2)))
 ;; evaluate the symbolic expression
 (rewrite (Add (Num n) (Num m))
     (Num (+ n m)))
 (union (tree_size (Leaf)) (Num 1))
 ;; compute size for a particular tree
 (define two (tree_size (Node (Leaf) (Leaf))))
  (run 10)
  (check (= two (Num 2)))
  (clear)
```

 Conceptually, we create a ``hole'' for the value
  `(tree_size t)` is mapped to.
 A series of rewriting will ultimately fill in this hole
  with concrete numbers.
 We use fresh ids here in a way that is similar to
  how logic programming languages use logic variables.
 In logic programming,
  logic variables represent unknown information
  that has yet to be resolved.
 We view this ability to represent the unknown
  as one of the key insights
  to both Egglog and logic programming languages
  like Prolog and miniKanren.
 However, unlike Prolog and miniKanren,
  egglog does not allow backtracking
  in favor of monotonicity and efficient evaluations.



## Simply Typed Lambda Calculus

% \yz{Consider removing the part on capture-avoiding substitutions}

Previous equality saturation applications use lambda calculus
 as their intermediate representation for program rewriting
~\citep{koehler2021sketch,egg,storel}.
To manipulate lambda expressions in \egraphs, a key challenge is
 performing capture-avoiding substitutions,
 which requires tracking the set of free variables.
A traditional equality saturation framework will represent
 the set of free variables
 as an eclass analysis
 and uses a user-defined applier to perform the capture-avoiding substitution,
 both written in the host language (e.g., Rust).
As a result,
 users need to reason about both rewrite rules and custom Rust code
 to reason about their applications.

We follow the `lambda` test suite of egg \citep{egg}
 and replicate the lambda calculus example in egglog.
Instead of writing custom Rust code for analyses,
 we track the set of free variables using standard egglog rules.
Figure \ref{fig:free-var} defines a function that maps terms to set of variable names.
Since the set of free variables can shrink in equality saturation
 (e.g., rewriting \\(x-x\\) to \\(0\\) can shrink the set of free variables from \\(\{x\}\\) to the empty set),
 we define the merge expression as set intersections.
The first two rules say that values have no free variables and variables have themselves
 as the only free variable.
The free variables of lambda abstractions, let-bindings, and function applications are
 inductively defined by constructing the appropriate variable sets at the right hand side.
Finally,
 the last three rewrite rules perform the capture-avoiding substitution
 over the original terms depending on the set of free variables.
When the variable of lambda abstraction is contained in the set of free variables
 of the substituting term,
 a new fresh variable name is needed.
We skolemize the rewrite rule
 so that the new variable name is generated deterministically.
Note that the last two rules depend both positively and negatively
 on whether the set of free variables contains a certain variable,
 so this program is not monotonic in general.

% Some applications perform constant folding over
%  lambda expressions.
% For these applications, users have to write a composite analysis that is the Cartesian product of
%  constant folding analysis and free variable analysis.
% Each component of the composite analysis cannot propagate independently.
% In contrast, users can specify two individual analyses in egglog
%  by defining two functions or relations, and each individual analysis can propagate independently.

egglog can not only express eclass analyses,
 which are typically written in a host language like Rust,
 but also semantic analyses not easily expressible in eclass analyses.
For example, consider an equality saturation application
 that optimizes matrix computation graphs and uses lambda calculus
 as the intermediate representation.
Users may want to extract terms with the least cost as the outputs of optimizations,
 but a precise cost estimator may depend on the type and shape information of an expression
 (e.g., the dimensions of matrices being multiplied).
Expressing type inference within the abstraction of eclass analyses is difficult:
 in eclass analyses, the analysis values are propagated bottom up,
 from children to parent eclasses.
However, in simply typed lambda calculus,
 the same term may have different types depending on the typing context,
 so it is impossible to know the type of a term without first knowing the typing context.
Because the typing contexts need to be propagated top down first,
 eclass analysis is not the right abstraction for type inference.
In contrast,
 we can do type inference in egglog
 by simply encoding the typing rule for simply typed lambda calculus in a Datalog style:
 we first break down larger type inference goals into smaller ones,
  propagate demand together with the typing context top down,
  and assemble parent terms' types based on the children terms' bottom up.

\autoref{fig:stlc} shows a subset of rules that perform type inference
 over simply typed lambda calculus.
We determine the types of variables based on contexts.
For lambda expressions, we rewrite the type of `(Lam x t1 e)`
 to be \\(t_1\rightarrow t_2\\), where \\(t_2\\) is the type of \\(e\\) in the new context
 where $x$ has type \\(t_1\\) (i.e., `(typeof (Cons x t1 ctx) e)`).
Finally, because we cannot directly rewrite the type of function applications
 in terms of types of their subexpressions,
 we explicitly populate demands for subexpressions and
 derive the types of function applications using
 the types of subexpressions once they are computed.

```scheme
(function free (Term) (Set Ident)
    :merge (set-intersect old new))

;; Computing the set of free variables
(rule ((= e (Val v)))
      ((set (free e) (empty))))
(rule ((= e (Var v)))
      ((set (free e) (set-singleton v))))
(rule ((= e (Lam var body))
       (= (free body) fv))
      ((set (free e) (set-remove fv var))))
(rule ((= e (Let var e1 e2))
       (= (free e1) fv1) (= (free e2) fv2))
      ((set (free e) (set-union fv2
          (set-remove fv1 var)))))
(rule ((= e (App e1 e2))
       (= (free e1) fv1) (= (free e2) fv2))
      ((set (free e) (set-union fv1 fv2))))

;; [e2/v1](*$\lambda$*)v1.e1 rewrites to (*$\lambda$*)v1.e1
(rewrite (subst v e2 (Lam v e1))
         (Lam v body))
;; [e2/v2](*$\lambda$*)v1.e1 rewrites to (*$\lambda$*)v1.[e/v2]e1
;; if v1 is not in free(e2)
(rewrite (subst v2 e2 (Lam v1 e1))
         (Lam v1 (subst v2 e2 e1))
    :when ((!= v1 v2)
           (set-not-contains (free e2) v1)))
;; [e2/v2](*$\lambda$*)v1.e1 rewrites to (*$\lambda$*)v3.[e/v2][v3/v1]e1
;; for fresh v3 if v1 is in free(e2)
(rule ((= expr (subst v2 e2 (Lam v1 e1)))
       (!= v1 v2)
       (set-contains (free e2) v1))
      ((define v3 (Skolemize expr))
       (union expr (Lam v3 (subst v2 e2
           (subst v1 (Var v3) e1))))))
```

\caption{Free variable analysis
 and capture avoiding substitution in egglog.
We use skolemization function \lstinline{Skolemize}
 to deterministically generate fresh variables
 for capture-avoiding substitution.
}
```scheme
(function typeof (Ctx Expr) Type)

(function lookup (Ctx Ident) Type)
(rewrite (lookup (Cons x t ctx) x) t)
(rewrite (lookup (Cons y t ctx) x)
         (lookup ctx x)
    :when ((!= x y)))

;; Type of matrix constants
(rewrite (typeof ctx (fill (Num n) (Num m) val))
         (TMat n m))

;; Type of variables
(rewrite (typeof ctx (Var x) )
         (lookup ctx x))

;; Type of lambda abstractions
(rewrite (typeof ctx (Lam x t1 e))
         (Arr t1 (typeof (Cons x t1 ctx) e)))

;; Populate type inference demand for
;; subexpressions of function application
(rule ((= (typeof ctx (App f e)) t2))
      ((typeof ctx f)
       (typeof ctx e)))

;; Type of function application
(rule ((= (typeof ctx (App f e)) t)
       (= (typeof ctx f) (Arr t1 t2))
       (= (typeof ctx e) t2))
      ((union t1 t2)))
```

\caption{Type inference for simply typed lambda calculus
 with matrices.
 Here we require that lambda abstractions are annotated with parameter types.
 Section~\ref{sec:hm} looses this restriction.}


### Type Inference beyond Simply Typed Lambda Calculus

egglog is suitable for expressing a wide range of unification-based algorithms
 including equality saturation (Section~\ref{sec:eqsat}) and Steensgard analyses (Section~\ref{sec:points-to}).
In this section, we show an additional example on the expressive power of egglog:
 type inference for Hindley-Milner type systems.
Unlike the simple type system presented in Section~\ref{sec:stlc},
 a Hindley-Milner type system does not require type annotations for variables in lambda abstractions
 and allows let-bound terms to have a \textit{scheme} of types.
For example, the term `let f = \x. x in (f 1, f True)`
 is not typeable in simply typed lambda calculus,
 since this requires `f` to have both type \\(\textit{Int}\rightarrow\textit{Int}\\)
 and \\(\textit{Bool}\rightarrow\textit{Bool}\\).
In contrast, A Hindley-Milner type system will accept this term,
 because both \\(\textit{Int}\rightarrow\textit{Int}\\)
 and \\(\textit{Bool}\rightarrow\textit{Bool}\\) are instantiations of the type scheme
 \\(\forall \alpha,\alpha\rightarrow\alpha\\).

Concretely,
 to infer a type for the above term,
 a type inference algorithm will first introduce a fresh type variable \(\alpha\\) for `x`,
 the argument to function `f`, and infer that
 the type of `f` is \\(\alpha\rightarrow\alpha\\).
Next, because `f` is bound in a let expression,
 the algorithm generalizes the type of `f` to be a scheme by introducing forall quantified
 variables, i.e., \\(\forall \alpha.\alpha\rightarrow\alpha\\).
At the call site of `f`,
 the type scheme is instantiated by consistently substituting forall quantified type variables with fresh ones,
 and the fresh type variables are later unified with concrete types.
For example, `f` in function application `f 1`
 may be instantiated with type \\(\alpha_1\rightarrow\alpha_1\\).
Because integer `1` has type \textit{Int},
 type variable \\(\alpha_1\\) is unified with \\(\textit{Int}\\),
 making the occurrence of `f` here
 have type \\(\textit{Int}\rightarrow\textit{Int}\\).
The final type of `f 1` is therefore \textit{Int}.

The key enabler of Hindley-Milner inference
 is the ability to unify two types.
To do this,
 an imperative implementation like Algorithm W \citep{hindley-milner} needs
 to track the alias graphs among type variables
 and potentially mutating a type variable
 to link to a concrete type,
 which requires careful handling.
In contrast, egglog has the right abstractions for Hindley-Milner inference
 with the built-in power of unification.
The unification mechanism can be expressed as a single injectivity rule
```scheme
(rule ((= (Arr fr1 to1) (Arr fr2 to2)))
      ((union fr1 fr2)
       (union to1 to2)))
```
This rule propagates unification down
 from inductively defined types to their children types.
% Injective unification like this
%  is known in the literature as the dual of congruence~\citep{congr-duality}.
At unification sites,
 it suffices to call `union`
 on the types being unified.
For instance, calling `union` on
`(Arr (TVar x) (Int))` and `(Arr (Bool) (TVar y))`
 will unify type variable \\(x\\) (resp.\ \\(y\\)) and `Int` (resp.\ `Bool`)
 by putting them into the same eclass.

```scheme
(function generalize (Ctx Type) Scheme)
(function instantiate (Scheme) Type)
(function lookup (Ctx Ident) Scheme)
(function typeof (Ctx Expr i64) Type)

;; Injectivity of unification
(rule ((= (Arr fr1 to1) (Arr fr2 to2)))
      ((union fr1 fr2)
       (union to1 to2)))

;; Simple types
(rewrite (typeof ctx (Num x)) (Int))
(rewrite (typeof ctx (True)) (Bool))
(rewrite (typeof ctx (False)) (Bool))
(rewrite (typeof ctx (Var x))
         (instantiate (lookup ctx x)))

;; Inferring types for lambda abstractions
(rule ((= t (typeof ctx (Abs x e))))
      ((define fresh-tv (TVar (Fresh x)))
       (define scheme (Forall (empty) fresh-tv))
       (define new-ctx (Cons x scheme ctx))
       (define t1 (typeof new-ctx e))
       (union t (Arr fresh-tv t1))))
```

```scheme
;; Inferring types for function applcations
(rule ((= t (typeof ctx (App f e))))
	  ((define t1 (typeof ctx f))
	   (define t2 (typeof ctx e))
	   (union t1 (TArr t t2))))
;; Inferring types for let expressions
(rule ((= t (typeof ctx (Let x e1 e2))))
      ((define t1 (typeof ctx e1 c1))
       (define scheme (generalize ctx t1))
       (define new-ctx (Cons x scheme ctx))
       (define t2 (typeof new-ctx e2))
       (union t t2)))

;; Occurs check
(relation occurs-check (Ident Type))
(relation errors (Ident))
(rule ((= (TVar x) (Arr fr to)))
      ((occurs-check x fr)
       (occurs-check x to)))
(rule ((occurs-check x (Arr fr to)))
      ((occurs-check x fr)
       (occurs-check x to)))
(rule ((occurs-check x (TVar x)))
      ((errors x)
       (panic "occurs check failed")))
```

\caption{Expressing Hindley-Milner inference in egglog.
 `Ident` is a datatype for identifiers
  that can be constructed by lifting a string or a counter (i.e., `i64`).
 In the actual implementation,
  we additionally track a counter in the `typeof` function
  to ensure the freshness of fresh variables,
  which we omit for brevity.
 Definitions of `instantiate`, `generalize`,
 and `lookup` are not shown as well.
 }
 \label{fig:hm}
\end{figure}

\autoref{fig:hm} shows a snippet of Hindley-Milner inference in egglog.
We translate the typing rule to rewrite rules in egglog straightforwardly.
The egglog rule for lambda abstractions says,
 whenever we see a demand to check the type of `\x.e`.
We create a fresh type scheme `fresh-tv` with no variables quantified,
 binding it to `x` in the context, and infer the type of body as `t1`.
Finally, we unify the type of `\x.e` with
 \lstinline[mathescape=true]{fresh-tv $\rightarrow$ t1}.
%\yz{this part is different from simple type inference.}
For function application `f e`,
 we can compact the two rules
 for function application in simply typed lambda calculus into one rules
 thanks to the injectivity rule:
 we simply equate the type `t1` of `f` and the arrow type `Arr t t2`
 for type `t` of `f e` and type `t2` of `e`,
 and injectivity will handle the rest of unifications.
Finally, the rule for type inferring `let x = e1 in e2`
 will first get and,
 generalize\footnote{
    Generalization, as well as instantiation for the rule for type inferring variables
    is a standard operation in type inference literature.
    They convert between types and type schemes based on contexts.
    We omit them from the presentation for brevity.
    To implement them, we also track the free type variables
    for each type
    in our implementation.
 } the type of `e1` in the current context,
 bind variable `x` to it
 and infer the type of `e2` as `t2`.
The type of \lstinline[language=Haskell]{let x = e1 in e2}
 is then unified with the type of `t2`.

In Hindley-Milner type systems,
 a type variable may be accidentally unified
 with a type that contains it, which results in infinitary types
 like \\(\alpha\rightarrow\alpha\rightarrow\ldots\\) and is usually
 not what users intend to do.
A Hindley-Milner inference algorithm will also
 do an ``occurs check'' before
 unifying a type variable with a type.
In egglog, the occurs check can be done modularly,
 completely independent of the unification mechanism
 and the type inference algorithm.
In \autoref{fig:hm},
 we define an `occurs-check` relation
 and match on cases where a type variable
 is unified with an inductive type like the arrow type
 and mark types that need to be occurs checked by
 populating them in the `occurs-check` relation.
The occurs check fails when an `occurs-check` demand
 is populated on an identifier and a type variable with the same identifier.
Our actual implementation also contains rules that
 check if two different base types are unified or
 a base type is unified with an arrow type,
 where it will throw an error.
These could happen when two incompatible types are unified
 due to ill typed terms
 (e.g., when type inferring `True + 1`).


### Theory of Arrays

```scheme
(datatype Addr (Num i64) (Var String))
(datatype Array (Const i64) (AVar String))
(function store (Array Addr Addr) Array)
(function select (Array Addr) Addr)
(function add (Addr Addr) Addr)
(relation neq (Addr Addr))
;; select gets from store
(rewrite (select (store mem i e) i) e)
;; select passes through wrong index
(rewrite (select (store mem i1 e) i2) (select mem i2)
    :when ((neq i1 i2)))
```

The theory of arrays is a simple first order axiomatization of functions that is
useful in software verification. Some of the axioms are simple rewrite rules,
but others are guarded upon no aliasing conditions of the address. Addresses may
be concrete or abstract entities. Inferring that two addresses cannot alias may
be done via constant propagation or injectivity reasoning and is a natural
application of Datalog.

% \rw{Is theory of arrays monotonic?}
% \pz{You're right. As written I need an explicit neq relation. I could also change to i64
% addresses, although this is a bit unsatisfying.}
% \rw{No I was just wondering, not being monotonic is fine.}
\end{comment}

## Other Egglog Pearls

In this subsection,
 we show more self-contained programs with interesting behaviors,
 further demonstrating the expressive power of egglog.

### Equation Solving
Many uses of eqsat and hence egglog fall into a guarded rewriting paradigm. A
different mode of use is that of equation solving: rather than
taking a left hand side and producing a right, egglog can take an entire equation
and produces a new equation.
A common manipulation in algebraic reasoning is to
manipulate equations by applying the same operation to both sides. This is often
 used to isolate variables
 and use one variable to substitute other variables in an equation.
Substitutions in \egraphs and egglog are implicit
 (since the variable and its definition via other variables are in the same equivalence class),
 and we can encode variable isolation as rules.

\autoref{fig:equationsolve:egglog} shows a simplistic equational system
 with addition, multiplication, and negations.
Besides the standard algebraic rules,
 we use two rules that manipulate equations to isolate variables.
This allows us to solve simple multivariable equations
 like \\[
    \begin{cases}
    z+y=6\\
    2z=y
 \end{cases}
 \\]
 .

Equation solving in egglog can be seen as similar to the "random walk" approach to
 variable elimination a student may take. For specific solvable systems this may
 be very inefficient compared to a dedicated algorithm.
 For example one can
 consider a symbolic representation of a linear algebraic system,
 for which Gaussian elimination will be vastly more efficient.
However, equation solving in egglog is
 compositional and
 can easily handle the addition of new domain-specific rules
 like those for trigonometric functions.

```scheme
(datatype Expr
    (Add Expr Expr)
    (Mul Expr Expr)
    (Neg Expr)
    (Num i64)
    (Var String))

;; Algebraic rules over expressions
(rewrite (Add x y) (Add y x))
(rewrite (Add (Add x y) z) (Add x (Add y z)))
(rewrite (Add (Mul y x) (Mul z x))
         (Mul (Add y z) x))

;; Make the implicit coefficient 1 explicit
(rewrite (Var x) (Mul (Num 1) (Var x)))

;; Constant folding
(rewrite (Add (Num x) (Num y)) (Num (+ x y)))
(rewrite (Neg (Num n)) (Num (- n)))
(rewrite (Add (Neg x) x) (Num 0))

;; Variable isolation by rewriting
;; the entire equation
(rule ((= (Add x y) z))
      ((union (Add z (Neg y)) x)))
(rule ((= (Mul (Num x) y) (Num z))
       (= (% z x) 0))
      ((union (Num (/ z x)) y)))

; system 1: x + 2 = 7
(set (Add (Var "x") (Num 2)) (Num 7))
; system 2: z + y = 6; 2z = y
(set (Add (Var "z") (Var "y")) (Num 6))
(set (Add (Var "z") (Var "z")) (Var "y"))

(run 5) ;; run 5 iterations

(extract (Var "x")) ;; (Num 5)
(extract (Var "y")) ;; (Num 4)
(extract (Var "z")) ;; (Num 2)
```



### Proof Datatypes
Datalog proofs can be internalized as syntax trees inside of egglog. This proof
datatype has one constructor for every Datalog rule of the program and records
any intermediate information that may be necessary. This can also be done in any
Datalog system that supports terms. A unique capability of egglog however is the
ability to consider proofs of the same fact to be equivalent, a form of proof
irrelevance. This compresses the space used to store the proofs and enhances the
termination of the program which would not terminate in ordinary. In addition,
the standard extraction procedure can be used to extract a short proof.



```scheme
;; Proofs of connectivity
(datatype Proof
    (Trans i64 Proof)
    (Edge i64 i64))

;; Path function points to a proof datatype
(function path (i64 i64) Proof)
(relation edge (i64 i64))

;; Base case
(rule ((edge x y))
      ((set (path x y) (Edge x y))))

;; Inductive case
(rule ((edge x y) (= p (path y z)))
      ((set (path x z) (Trans x p))))

;; Populate the graph and run
(edge 1 2)
(edge 2 3)
(edge 1 3)
(run)

;; returns the smallest proof of
;; the connectivity between 1 and 3
(extract (path 1 3))
```


### Binary Decision Diagrams
Binary decision diagrams are a compact canonical representation of boolean
formulas or sets of bitvectors. They can be viewed in different lights. One way
of looking at them is as a hash consed if-then-else tree
<https://www.lri.fr/~filliatr/ftp/publis/hash-consing2.pdf> that examines each
variable in a prescribed order, and where any branch where the then and else
branch hold the same expression is collapsed. egglog is hash consed by it's
nature and is capable of encoding this collapse as a rewrite rule. Calculations
of functions of the BDDs is also expressible as rewrite rules, being implemented
by merging down the two trees in variable ordering.

This is particularly intriguing in light of the work of bddbdddb
<https://bddbddb.sourceforge.net/> which was a Datalog built around using binary
decision diagrams as it's core datastructure. While the egglog encoding of the
structure is unlikely going to be as efficient as a bespoke implementation, it
is capable of describing them in its surface language as a first class construct. BDDs are one form of a
first class set.


```scheme,editable
(datatype BDD
    (ITE i64 BDD BDD) ;; variables labelled by number
    (True)
    (False)
)

; compress unneeded nodes
(rewrite (ITE n a a) a)

(function and (BDD BDD) BDD)
(rewrite (and (False) n) (False))
(rewrite (and n (False)) (False))
(rewrite (and (True) x) x)
(rewrite (and x (True)) x)
; We use an order where low variables are higher in tree
; Could go the other way.
(rewrite (and (ITE n a1 a2) (ITE m b1 b2))
    (ITE n (and a1 (ITE m b1 b2)) (and a2 (ITE m b1 b2)))
    :when ((< n m))
)
(rewrite (and (ITE n a1 a2) (ITE m b1 b2))
    (ITE m (and (ITE n a1 a2) b1) (and (ITE n a1 a2) b2))
    :when ((> n m))
)
(rewrite (and (ITE n a1 a2) (ITE n b1 b2))
    (ITE n (and a1 b1) (and a2 b2))
)
```


### Reasoning about matrices
The algebra of matrices follows similar rules as the algebra of simple numbers,
 except that matrix multiplication generally not commutative.
With the addition of structural operations like the Kronecker product, direct sum, and stacking of matrices a richer algebraic structure emerges.
A particularly simple and useful rewrite rule allows one to
 push matrix multiplication through a Kronecker product
 \\((A \otimes B) \cdot (C \otimes D) = (A \cdot C) \otimes (B \cdot D)\\).
Rewriting from left to right improves the asymptotic complexity of evaluating the expression.
However,
 while this equation may proceed from right to left unconditionally,
 the left to right application requires that the dimensionality of the matrices line up.
In a large matrix expression with possibly abstract dimensionality,
 this is not easily doable in a classical equality saturation framework.
Although one may be tempted to express dimensionality
 with eclass analyses,
 the dimensionality is a symbolic term itself and needs to be reasoned about via algebraic rewriting.
However, the abstraction of eclass analyses do not allow rewriting over the analysis values.
On the other hand, because the analysis is just another function
 not unlike the constructors for matrix expressions,
 we can use standard egglog rules to reason about it
 just like how we reason about matrix expressions.
\autoref{fig:matrix:egglog} shows
 a simple theory of matrices with Kronecker product,
 and this example can be generalized to
 other (essentially) algebraic theories.


```scheme
(datatype MExpr
    (MMul MExpr MExpr)
    (Kron MExpr MExpr)
    (Var String))

(datatype Dim
    (Times Dim Dim)
    (NamedDim String)
    (Lit i64))

(function nrows (MExpr) Dim)
(function ncols (MExpr) Dim)

;; Computing the dimensions of
;; matrix expressions
(rewrite (nrows (Kron A B))
         (Times (nrows A) (nrows B)))
(rewrite (ncols (Kron A B))
         (Times (ncols A) (ncols B)))
(rewrite (nrows (MMul A B)) (nrows A))
(rewrite (ncols (MMul A B)) (ncols B))

;; Reasoning about dimensionality
(rewrite (Times a (Times b c))
         (Times (Times a b) c))
(rewrite (Times (Lit i) (Lit j)) (Lit (* i j)))
(rewrite (Times a b) (Times b a))

;; Rewriting matrix multiplications and Kronecker
;; product
(rewrite (MMul A (MMul B C)) (MMul (MMul A B) C))
(rewrite (MMul (MMul A B) C) (MMul A (MMul B C)))
(rewrite (Kron A (Kron B C)) (Kron (Kron A B) C))
(rewrite (Kron (Kron A B) C) (Kron A (Kron B C)))
(rewrite (Kron (MMul A C) (MMul B D))
         (MMul (Kron A B) (Kron C D)))

;; Optimizing Kronecker product with guarded rules
(rewrite (MMul (Kron A B) (Kron C D))
         (Kron (MMul A C) (MMul B D))
    :when ((= (ncols A) (nrows C))
           (= (ncols B) (nrows D))))
```
\caption{Equality saturation with matrices in egglog.
The last rule is guarded by the equational precondition
 that the dimensionalities should align,
 which is made possible by
 rich semantic analyses \textit{a la} Datalog.}
\label{fig:matrix:egglog}
\end{figure}

# Other Examples
- Unification
- Bitvectors
- Resolution theorem proving
- Herbie
- CClyzer
- Gappa
- Theorem Proving
- Homotopy Search
## Unification
Programmable Unification without backtracking

## Bitvectors


## Egraphs
Explain what an egraph is

# Reflection
