# Modelling State

Imperative programs proceed via a manipulation of state.

In essence, a stateful program can be emulated in datalog by recursively transforming one state to the next.

```
 // Initial state
state(0,0,0).
// Transition functions
state(x1,y1,z1) :- state(x,y,z), x1 = f(x,y,z), y = g(x,y,z), z = h(x,y,z).
// Transition Relations
state(x1,y1,z1) :- state(x,y,z), trans(x,y,z,x1,y1,z1).
```

This is analogous to the simpler problem.

```
reachable(0).
reachable(x1) :- reachable(x), edge(x,x1)
```

Which is the single source form of the classic datalog `path` problem, but with more interesting structured vertices.


#  Die Hard Puzzle
A fun puzzle is the Die Hard 3 puzzle. This is used in some TLA+ tutorials.

```
.pragma "provenance" "explain"
.decl reach(big : unsigned, small : unsigned)
reach(0,0).
// move water small to big
reach(big + small, 0) :- reach(big,small), big + small <= 5.
reach(5,  small - (5 - big)) :- reach(big,small), !big + small <= 5.
// move water big to small
reach(0, big + small) :- reach(big,small), big + small <= 3.
reach(big  - (3 - small),  3) :- reach(big,small), !big + small <= 3.
// empty big
reach(0, small) :- reach(_,small).
// empty small
reach(big,0) :- reach(big,_).
// fill big
reach(5, small) :- reach(_,small).
// fill small
reach(big,3) :- reach(big,_).

.decl big_is_4(small : unsigned)
big_is_4(small) :- reach(4,small).
.output big_is_4(IO=stdout)
```


# Imperative Programs
Here we directly model a simple imperative program. We look at the program to determine the state. There are two variables `i` and `acc`. 
```souffle
/*
acc = 0;
for(i = 0; i < 10; i++){
  acc += i;
}
*/
.decl sumn(i : number, acc : number)
sumn(0,0).
sumn(i+1, s + i) :- sumn(i,s), i < 10.
.output sumn(IO=stdout)
```

A more direct modelling of the program is to make sure that the _line number_ / program point is part of your state. This is true. Your underlying CPU tracks the address of code it is running in a register called the program counter. You are in essence modelling that.

```souffle
/*
// L1
acc = 0;
i = 0;
//L2
while(i < 10){
  // L3
  acc += i;
  // L4
  i++;
}
//L5
*/

.decl sumn(pc : number, i : number, acc : number)
sumn(1,0,0).
sumn(2,i,acc) :- sumn(1,i,acc).
sumn(3,i,acc) :- sumn(2,i,acc), i < 10.
sumn(4,i,acc+i) :- sumn(3,i,acc).
sumn(2,i+1,acc):- sumn(4,i,acc).

.output sumn(IO=stdout)
```


# Factoring State
A common overapproximation to try to use is to factor the state into separate relations. This will think more executions are possible than they are, but can be used to prove certain behavior does not happen. The state can only be factored and reconstituted if the subpieces of the state do not interact at all.

We have made this analysis nonterminating. :(

.decl acc(pc : number, v : number)
.decl i(pc : number, v : number)
acc(1,0). i(1,0).
acc(2,v) :- acc(1,v). i(2,v) :- i(1,v).
acc(3,i),i(3,acc) :- acc(2,v), i(2,v), i < 10.
sumn(4,i,acc+i) :- sumn(3,i,acc).
sumn(2,i+1,acc):- sumn(4,i,acc).

```souffle
.decl acc(pc : number, v : number)
.decl i(pc : number, v : number)
.decl sumn(pc : number, i : number, acc : number) inline
sumn(pc,i,acc) :- acc(pc,acc), i(pc,i).
acc(1,0). i(1,0).
acc(2,acc),i(2,i) :- sumn(1,i,acc).
acc(3,acc),i(3,i) :- sumn(2,i,acc), i < 10.
acc(4,acc+1),i(4,i) :- sumn(3,i,acc).
acc(2,acc),i(2,i+1) :- sumn(4,i,acc).

.limitsize acc(n=20)
.output acc(IO=stdout)
```


## Ball and Springs

Balls and springs are a model of a partial differential equation. We can model the equations of motion, initial conditions, and boundary conditions using datalog. What fun!

```souffle
#define T 10
.decl ball(t : number, n : number, x : float, v : float)
// initial conditions

ball(0, n, 0, 0) :- n = range(0,11), n != 5.
ball(0, 5, 10, 0).

// ball(0, n, x, v) :- n = range(1,10), x = to_float(n) * 0.1, v = 0.
// ball(0,0,0,0).
// ball(0,10,0,0).


// Boundary condition. iniital and final ball fixed
ball(t+1,0,0,0) :-  t = range(0,T).
ball(t+1,10,0,0) :- t = range(0,T).

// dynamics
ball(t+1, n,  newx, newv) :- 
  t < T, 
  ball(t, n-1, x0, _v0), 
  ball(t, n, x, v), 
  ball(t, n+1, x2, _v2),
  newx = x + 0.1 * v,
  newv = v + 0.1 * (x0 - x + x2 - x).
.output ball(IO=stdout)


```

# Mandelbrot

Translated from the [SQLlite docs on recursive ctes](https://www.sqlite.org/lang_with.html)
```sql
WITH RECURSIVE
  xaxis(x) AS (VALUES(-2.0) UNION ALL SELECT x+0.05 FROM xaxis WHERE x<1.2),
  yaxis(y) AS (VALUES(-1.0) UNION ALL SELECT y+0.1 FROM yaxis WHERE y<1.0),
  m(iter, cx, cy, x, y) AS (
    SELECT 0, x, y, 0.0, 0.0 FROM xaxis, yaxis
    UNION ALL
    SELECT iter+1, cx, cy, x*x-y*y + cx, 2.0*x*y + cy FROM m 
     WHERE (x*x + y*y) < 4.0 AND iter<28
  ),
  m2(iter, cx, cy) AS (
    SELECT max(iter), cx, cy FROM m GROUP BY cx, cy
  ),
  a(t) AS (
    SELECT group_concat( substr(' .+*#', 1+min(iter/7,4), 1), '') 
    FROM m2 GROUP BY cy
  )
SELECT group_concat(rtrim(t),x'0a') FROM a;
```



```souffle
#define dx 0.05
#define dy 0.0625
.decl xaxis(x : float)
.decl yaxis(y : float)
.decl m(iter:unsigned, cx : float, cy : float, x : float, y : float)
.decl m2(iter:unsigned, cx : float, cy : float)
.decl collect(cx:float, cy:float, line:symbol)
.decl a(cy:float, line:symbol)

xaxis(-2).
yaxis(-1.00000001).
xaxis(x + dx) :- xaxis(x), x < 1.2.
yaxis(y + dy) :- yaxis(y), y < 1.

m(0,x,y, 0,0) :- xaxis(x), yaxis(y).
m(iter+1, cx, cy, x*x-y*y + cx, 2.0*x*y + cy ) :- m(iter, cx,cy,x,y),iter < 28, x*x + y*y < 4.0.
m2(iter, cx,cy) :- xaxis(cx), yaxis(cy), iter = max i : m(i, cx,cy, _,_).

collect(-2.00,cy,"") :- yaxis(cy).
collect(cx+dx,cy,line2) :- m2(iter,cx+dx,cy), collect(cx,cy,line), line2 = cat(line,c), 
                         ( iter < 16 , c = " " ; iter >= 16,  c = "#" ).
a(1+cy,line) :- cx = max x : xaxis(x), collect(cx,cy,line).

.output a(IO=stdout)
```


# Other stuff

- Concurrent Execution


