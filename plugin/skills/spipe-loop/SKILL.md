---
name: spipe-loop
description: Run a bounded SPipe check-and-repair or daily-debug evidence cycle.
---

# SPipe Loop

Run one bounded discovery pass, record every eligible failure, repair the
focused set, and finish with one whole confirmation. Never poll indefinitely or
repeat a green check. The default continuous mode is fail-closed unless the
host provides an implemented scheduler. Daily-debug mode ingests one dated bug
batch, classifies and routes it, records receipts, and exits.
