# Program Analysis

## Pure Expressions
### Hutton's Razor
There is a very solid rule thumb called Hutton's razor that you should try out programming language techqniues on a simple language of only addition and constants first. You can learn a lot.

The first thing to do with such expressions is of course to evaluate them.

```souffle
.type AExpr = Add {x : AExpr, y : AExpr} | Lit {n : number}

.decl aexpr(e : AExpr)
aexpr(x), aexpr(y) :- aexpr($Add(x,y)).

.decl eval(e : AExpr, v : number)
eval(e, vx + vy) :- aexpr(e), e = $Add(x,y), eval(x,vx), eval(y,vy).
eval(e, n) :- aexpr(e), e = $Lit(n).

aexpr($Add($Add($Lit(1), $Lit(2)), $Lit(3))).
.output eval(IO=stdout)
```

### Adding Variables
One direction extend the language to make it more interesting is to add variables. Nothing needs to change, but now eval becomes a partial relation, only filled in for subterms that do not contain the variables. `eval` now has the flavor of a constant propagation analysis. By using the results of the analysis, we can simplify the original expressions. Since `eval` does not depend on `simplify`, we can check whether or not an entry in `eval` exists for `e` using negation.

```souffle
.type AExpr = Add {x : AExpr, y : AExpr} | Lit {n : number} | Var {v : symbol}

.decl aexpr(e : AExpr)
aexpr(x), aexpr(y) :- aexpr($Add(x,y)).

.decl eval(e : AExpr, v : number)
eval(e, vx + vy) :- aexpr(e), e = $Add(x,y), eval(x,vx), eval(y,vy).
eval(e, n) :- aexpr(e), e = $Lit(n).

.decl simplify(orig : AExpr, simp : AExpr)
simplify(e,$Lit(v)) :- eval(e, v).
simplify(e,e) :- aexpr(e), !eval(e, _), e = $Var(x).
simplify(e,$Add(x1,y1)) :- aexpr(e), !eval(e, _), e = $Add(x,y), simplify(x,x1), simplify(y,y1).

aexpr($Add($Add($Lit(1), $Lit(2)), $Var("x"))).
.output simplify(IO=stdout)
```
### Evaluation in Environments

We can also evaluate the language in an environment. I'm going to change my representation of terms only allow 3 named variables. This is to avoid needing first class maps from symbols to numbers to represent the environment (which is doable but complicated by accident in Souffle datalog. Other datalogs support this more easily.). Instead we can use a fixed sized record to represent the environment.

```souffle
.type AExpr = Add {x : AExpr, y : AExpr} | Lit {n : number} | X {} | Y {} | Z {}
.type Env = [x : number, y : number, z : number]

.decl aexpr(e : AExpr)
aexpr(x), aexpr(y) :- aexpr($Add(x,y)).

.decl env(e : Env)

.decl eval(e : AExpr, rho : Env, v : number)
eval(e, rho, vx + vy) :- aexpr(e), e = $Add(x,y), eval(x,rho,vx), eval(y,rho,vy).
eval(e, rho, n) :- env(rho), aexpr(e), e = $Lit(n).
eval($X(),rho,x) :- env(rho), rho = [x,_y,_z].
eval($Y(),rho,y) :- env(rho), rho = [_x,y,_z].
eval($Z(),rho,z) :- env(rho), rho = [_x,_y,z].

aexpr($Add($Add($Lit(1), $Lit(2)), $X())).
env([1,2,3]).
.output eval(IO=stdout)
```


Now let us constrast this with a different approach of describing states which might have been your first inclination.


```
.type AExpr = Add {x : AExpr, y : AExpr} | Lit {n : number} | Var {x : symbol}

.decl aexpr(e : AExpr)
aexpr(x), aexpr(y) :- aexpr($Add(x,y)).

.decl env(x : symbol, v : number)


```


Another thing we can do in this simple language is a valueset analysis. Given the set of possible values


