# Types and Logic

The clauses of prolog and datalog can be read as inference rules.


\\( \AxiomC edge(1,2)  \)

\\( edge(X,Y) \UnaryInfC path(X,Y)  \\)

\\( edge(X,Y) path(Y,Z) \BinaryInfC path(X,Z) \\) 


In this analogy, facts are not quite associate with propositions, but actually with _judgements_.

Some other judgements you may see around in computer science literature:

I am constantly thrown by infix notation for judgements and relations.

\( \Gamma \turnstile  e : A \) 
`.decl hastype(ctx, expr, type)`

\( {pre} cmd {post} \) 
`.decl hoare(pre, cmd, post)`

`.decl wellformed(term)`


\\( e \downarrow v \\)
`.decl evals_to(expr, value)`


\\( A == B type\\)
\\( \Gamma \turnstile A == B type\\)


Frank Pfenning notes

# Provenance
Provenance in datalog is tracking how a fact was derived. Conceptually, every fact could have an entire proof tree datastructure storing every fact and rule application that occurred to find that fact from th initial database, but this is not necessary.

This is a similar situation to minimum path finding and other dynamic programming problems. One does not need to store the entire solution at every node because once you have built the table containing minimum costs, a simple search is sufficient to reconstruct the solution in a top down, demand driven manner.


Conceptually, the proof object behind the edge-path example is any path connecting the two nodes. This is an entirely down to earth object, representable as a list of vertices. If you are ever scared of the idea of a proof object, this is good to keep in mind.


# Contexts

Many judgements are hypothetical. The infix syntax makes this seem mysterious, but it is just another field.

What is a pain is that the context is very often considered to be a set, and that judgementw using weaker contexts (less assumptions) should subsume stronger uses of contexts. Not all uses of contexts actualy obey these properties, see substructural logics like linear logic.




# Type Checking
Related of course to the above.
See the table on page 3 of [this bidirectional typing tutorial](https://arxiv.org/pdf/1908.05839.pdf). This is more or less a transcription of these rules to datalog. It is interesting how explicit the moding and forward / backward reasoning becomes. `has` becomes a seperate entity from `infer` and `check`. The latter two are top down / backwards requests for proofs, whereas `has` is a bottom up / forward reasoning assertion of truth.


```souffle
.type type = Unit {} | Arr {a :  type, b : type}
.type term = TT {} | Lam {b : term} | App {f : term, x : term} | Var {n : number} | Annot {t : term, ty : type}
.type ctx = [ ty:type, g : ctx]

.decl has(g : ctx, t : term , ty : type) // bottom up
.decl infer(g : ctx, t : term) // mode -+ topdown
.decl check(g : ctx, t : term, ty : type) // topdown

// variable.
// base case
has([ty,ctx], $Var(0), ty) :- infer([ty,ctx], $Var(0)).
// recursive case
infer(ctx, $Var(n-1)) :- infer([_ty,ctx], $Var(n)), n > 0.
has([ty,ctx], $Var(n), ty2) :- infer([ty,ctx], $Var(n)), has(ctx, $Var(n-1), ty2).

// infer instead of check if possible
infer(ctx,t) :- check(ctx,t,_ty).

// subtyping or equality rule
// has(ctx, t, ty) :- check(ctx,t,ty), has(ctx,t,ty2), sub(ty,ty2).

// annotation rule
check(ctx, t, ty) :- infer(ctx, $Annot(t,ty)).

// unit rule
has(ctx,$TT(), $Unit()) :- check(ctx, $TT(), $Unit()).

// Lam case
check([a, ctx], body, b) :- check(ctx, $Lam(body), $Arr(a,b)).
has(ctx, $Lam(body), $Arr(a,b)) :- check(ctx, $Lam(body), $Arr(a,b)), has([a, ctx], body, b).

// App case.
infer(ctx, f) :- infer(ctx, $App(f,_x)).
check(ctx, x, a) :- infer(ctx, $App(f,x)), has(ctx, f, $Arr(a,_b)).
has(ctx, $App(f,x), b) :- infer(ctx, $App(f,x)), has(ctx, f, $Arr(a,b)), has(ctx, x, a).

check(nil, $Lam($Lam($App($Var(1),$Var(0)))), 
      $Arr($Arr($Unit(), $Unit()), $Arr($Unit(), $Unit()))).

.output has(IO=stdout)
/*
.decl check_top(t : term, ty : type)
check(nil,t,ty):- check_top(t,ty).
.decl has_top(t : term, ty : type)
has_top(t,ty ):- has(nil, t, ty).


check_top($TT(), $Unit()).
check_top($Lam($Var(0)), $Arr($Unit(),$Unit())).
check_top($Lam($Lam($Var(0))), $Arr($Unit(),$Unit())).
check_top($Lam($Lam($Var(0))), $Arr($Unit(),$Arr($Unit(),$Unit()))).
check_top($Lam($Lam($Var(1))), $Arr($Unit(),$Arr($Unit(),$Unit()))).
check_top($Lam($Lam($Var(2))), $Arr($Unit(),$Arr($Unit(),$Unit()))).
check_top($App($Lam($Var(0)), $TT()), $Unit()).

check_top($Lam($Lam($App($Var(1),$Var(0)))), 
      $Arr($Arr($Unit(), $Unit()), $Arr($Unit(), $Unit()))).
*/
//.output check(IO=stdout)
//.output infer(IO=stdout)
//.output has(IO=stdout)
//.output has_top(IO=stdout)
```
