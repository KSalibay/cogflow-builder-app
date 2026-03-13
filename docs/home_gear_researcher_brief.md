# Home Gear (LSL) Researcher Brief

## What is Home Gear?

Home Gear is CogFlow's planned local execution mode for labs that need Lab Streaming Layer (LSL) synchronization with EEG and other sensors.

In simple terms:
- You still design and manage studies in cloud-hosted CogFlow Builder.
- You click `Pack Experiment To Go` to produce a local run package.
- You run that package on a lab machine (Dockerized local runtime).
- The local runtime emits LSL markers to your recording stack.
- Results and metadata sync back to the platform securely.

## Why this model?

Pure browser-cloud execution is excellent for remote studies, but local lab synchronization requires software running near the hardware.

Home Gear keeps both advantages:
- Cloud standardization and governance from Builder/Portal.
- Local timing and equipment sync for EEG/LSL workflows.

## When could this be implemented?

Recommended sequence after migration:
1. Migration core complete (platform publish/run/submit/portal/privacy gates passed).
2. Home Gear alpha build (about 2-3 weeks):
   - Packaging (`Pack Experiment To Go`)
   - Local runtime container
   - LSL marker outlet (one-way)
3. Lab pilot (about 2-4 weeks):
   - 1-2 partner labs
   - Timing and reliability validation
   - Installer and runbook hardening
4. Broader rollout:
   - Home Gear enabled as supported execution mode for eligible studies

A practical planning range is 4-8 weeks after migration MVP stabilization, depending on pilot outcomes.

## How would a researcher use it?

Planned researcher flow:
1. Build and validate study in CogFlow Builder.
2. Select runtime mode with LSL support.
3. Click `Pack Experiment To Go`.
4. Download package and run on lab machine.
5. Start EEG/LSL recorder as usual.
6. Launch participant session locally.
7. Sync encrypted results back to platform (live or deferred).

## Initial scope and boundaries

Expected first supported scope:
- LSL marker outlet for experiment events and trial timing.
- Local execution with secure cloud sync.
- Cloud remains source of truth for study definitions and governance.

Out of initial scope:
- Generic remote control of lab hardware from cloud browsers.
- Complex inbound closed-loop control from external devices (candidate later phase).

## Status note

Current CogFlow versions do not yet include native LSL integration in production. Home Gear is a planned post-migration extension designed for lab-grade synchronization needs.
