
## The why?

Have you heard that you should use immutable everywhere? 

You can use a library like Ramda or lodash/fp but these have large API surfaces that take time for some teams to learn. And because javascript doesnt have optimized collection types that support immutability (called peristent collections) they are slow. 

Is there an easier, more natural way?

What if we could use the libraries that everyone knows but just make them safer? In certain cases mutation is quite safe and beneficial. Even functional languages like clojure offer mutable variables within constraints.

The truth is there is no hard and fast set of rules with regards to mutation. But this eslint plugin tries to create them! 

## The Vision

Ideally we could track variable life cycles the same way the Rust compiler does. Once a variable is shared with another function
or module, it should become locked down and immutable by default. This would apply to borrowed variables (like this plugin attempts to do) and to lent variables (not currently implemented).
Finally safe lends/borrows should be faciliated syntactically such as when mutating an accumulator in a reduce function.

Preventing mutation of shared variables prevents a huge class of bugs from ever appearing.

This eslint plugin is the first step to achieving this vision.

