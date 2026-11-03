# mocks/

**Owner:** Person 1 (every file).

**What goes here:** FAKE data the module stubs return until the real modules land, and the `/design` page uses.
The numbers tell the demo story: $90 short on Thu 12 Nov; $21 short after the $72 order is paid ($69 after
PayPal's fee); covered after setting aside $11 a day; "$200 on Monday" leaves $745 on Mon 9 Nov but makes
Thursday $290 short.

`forecast.ts` builds the forecast from a few constants instead of hand-typed totals, so the story stays consistent.
`mocks.test.ts` checks it. If you change a mock, keep that test passing.

Mocks are not the seed. The database seed (`lib/demo/seed.ts`) is the simulated history the real modules will read.
