# @pomegranate-ui/testkit

Public conformance drivers and fixtures that adopters can run against their own frontend and backend adapters without reaching into package internals.

`runCoreConformance` reports the first eight dual-green preservation contracts as frozen plain results. It exercises only public contracts, layout, and core APIs; `assertCoreConformance` is available for CI gates that should fail on any literal contract regression.
