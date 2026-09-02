# Performance evidence

Evidence date: 2026-09-02
Machine: Windows 11 x64
Runtime: Node 22, VS Code stable 1.135.0

## Budgets

| Path | Budget |
| --- | --- |
| Extension activation in fixture | under 2,000 ms in CI |
| Three panel open/dispose cycles | under 3,000 ms |
| 10,000 identity/color/chrome builds | under 2,000 ms |
| 10,000 matching ownership plans | under 2,000 ms |
| 1,000 coalesced refresh requests | under 1,000 ms |
| Extension bundle | under 250 KB |
| Panel JavaScript | under 250 KB |
| Panel CSS | under 100 KB |

These are regression tripwires, not product latency promises. CI runners vary.

## Local result

`pnpm run check:performance`:

| Measurement | Result |
| --- | ---: |
| 10,000 color/chrome builds | 319.31 ms |
| 10,000 no-op ownership plans | 330.28 ms |
| 1,000 coalesced refresh requests | 0.83 ms |
| `dist/extension.js` | 84,472 bytes |
| `dist/panel.js` | 92,206 bytes |
| `dist/panel.css` | 7,674 bytes |

Stable Extension Host integration:

| Measurement | Result |
| --- | ---: |
| Stable 1.135 activation | 40.38 ms |
| Stable 1.135 three panel open/dispose cycles | 160.70 ms |
| Minimum 1.134 activation | 46.53 ms |
| Minimum 1.134 three panel open/dispose cycles | 144.47 ms |

## Lifecycle controls

- 40 ms refresh debounce;
- one serialized write queue;
- pending refreshes coalesce to the latest operation;
- each plan reads the latest workspace value;
- a pre-write snapshot check aborts stale plans;
- equal `workbench.colorCustomizations` values do not write;
- matching ownership refreshes do not increment generation or rewrite local state;
- one Status Bar item is reused;
- hidden panel context is not retained;
- webview subscriptions are disposed with the panel;
- no workspace scan, file read, network request, telemetry, or production dependency at activation.

Run the command again after bundle, ownership, event, or panel architecture changes.
