
## The why?

Have you heard that you should use immutable everywhere? 

You can use a library like Ramda or lodash/fp but these have large API surfaces that take time for some teams to learn. And because javascript doesnt have optimized collection types that support immutability (called peristent collections) they are slow. 

Is there an easier, more natural way?

What if we could use the libraries that everyone knows but just make them safer? In certain cases mutation is quite safe and beneficial. Even functional languages like clojure offer mutable variables within constraints.

The truth is there is its possible to create a cleaner, easy-to-use set of rules with regards to mutation. 

## The Vision

Ideally we could track variable life cycles a similar way to how the Rust compiler does.

Once a variable is shared with another function or module, it should become locked down and immutable by default. The following 3 rules should be followed: 
 
1. Lock down borrowed variables (like this plugin attempts to do)
2. Lock down lent variables. Once a variable is lent by default it's no longer safe to modify. (not currently implemented) 
3. Finally safe lends/borrows should be faciliated syntactically such as when mutating an accumulator in a reduce function, where control is handed over to the accumulator function. (not currently implemented)

Preventing mutation of shared variables prevents a huge class of bugs from ever appearing.

This eslint plugin is the first step to achieving this vision.

