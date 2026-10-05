# Exhaustive Per-Callable Micro-Benchmark Suite Design and Porting Blueprint

Blueprint contract version: `1.0.0`

SPDX-License-Identifier: `<DOCUMENT_SPDX_IDENTIFIER>`

Copy this file into a project before implementing its benchmark suite. Replace
every uppercase angle-bracket placeholder with the target project's values.
This revision
derives a portable target architecture from the SGVAN++ suite, while keeping project
paths, build systems, source catalogues, and component names configurable.

This document defines one non-negotiable result: **every executable callable in
scope has its own direct benchmark record for every relevant typed input and
execution regime**. A parent benchmark does not count as a measurement of a
child. A source-name match does not count as coverage. An inventory entry does
not count as a benchmark. Only a successfully executed direct row with a
verified target-call count satisfies callable coverage.

---

## 0. How to read this document

Sections 1–16, 18, and 20–21 are the portable normative contract. Section 17 is
a non-normative prompt derived from that contract. Section 19 describes the
SGVAN++ Google Benchmark reference fork and consumer; it records useful
implementation facts without making SGVAN-specific behavior portable by fiat.

Version this blueprint with semantic versioning. A changed identity,
measurement, completion, ownership, or command-protocol meaning requires a new
major version. Additive requirements use a minor version and editorial fixes a
patch version. Store the blueprint hash and version in each run manifest. The
repository owner must replace the SPDX placeholder with a license they are
authorized to grant before redistributing this text. Record licenses and source
provenance separately for copied fixtures, corpora, extracted source, and
vendored frameworks; this blueprint grants no rights to those materials.

Use these terms consistently:

| Term | Meaning |
| --- | --- |
| Callable | One executable function, method, lifecycle operation, concrete template/generic, closure, or equivalent runtime target |
| Source definition | The exact source-level definition before compiler cloning or aliasing |
| EID | Stable canonical identity for one source callable in a named scope |
| Compiled record | One configuration-specific native symbol, bytecode/assembly entry, runtime module entry, or device kernel joined to an EID |
| Fixture | Versioned construction, inputs, dependencies, oracle, and operations for one EID |
| Operation | One owned callable action with a typed input and execution regime |
| Benchmark row | Framework registration that executes one operation |
| State iteration | One iteration of a benchmark thread's framework loop |
| Root target call | One fixture-originated invocation of the exact callable inside a State iteration; the denominator for direct-inclusive per-call cost |
| Observed target entry | Any entry into the target, including recursive or reentrant descendants; never assumed equal to root calls |
| Raw repetition | One separately reported measured sample containing actual framework iterations; process/session grouping states whether samples are statistically independent |
| Observation | One within-repetition chunk or slope point clustered under its raw repetition; never an independent repetition by itself |
| Aggregate | A derived statistic over identified raw repetitions |
| Scope | Frozen population of configurations, compiled records, EIDs, and required operations |
| Resolved scope key | Content hash of one exact resolved scope population and proof policy |
| Selection | Subset chosen for one execution; it does not redefine scope |
| Measurement plan | Frozen required samples, clocks, timer policy, passes, evidence, and success criteria |
| Producer | Execution backend declared by the project adapter; independent of suite selection and subject kind |
| Pass | Timing, verification, attribution, hardware-counter, validation, or other separately executed evidence collection |
| Direct-inclusive | Exact target timing that includes work performed by its callees |
| Terminal | Reviewed proof that a catalogue entry has no executable runtime operation in the named scope |

State every completion claim with its immutable scope/selection and measurement
plan identities, for example `authoring_complete(resolved_scope_key)`,
`selected_subject_rows_complete(selection_id, measurement_plan_id)`,
`selected_operations_complete(selection_id, measurement_plan_id)`, or
`runtime_complete(resolved_scope_key, measurement_plan_id)`. A human-readable
`scope_id` accompanies the key but never replaces it. The unqualified word “complete” is prohibited
in machine-readable results and should be avoided in prose.

---

## 1. Project contract

| Value | Project setting |
| --- | --- |
| Project name | `<PROJECT_NAME>` |
| Repository root | `<PROJECT_ROOT>` |
| Benchmark root | `<PROJECT_ROOT>/micro_benchmarks` |
| Production build directory | `<PRODUCTION_BUILD_DIR>` |
| Production build/module metadata | `<PRODUCTION_BUILD_OR_MODULE_GRAPH>` |
| Production artifacts | `<PRODUCTION_ARTIFACTS_OR_MODULES>` |
| Source-catalogue command | `get-all-functions`, already available on the agent's `PATH` |
| Source-catalogue document | `<PROJECT_ROOT>/ALL_FUNCTIONS.md` |
| Catalogue target boundary | `<REVIEWED_PRODUCT_DEPENDENCY_AND_CONFIGURATION_ROOTS>`; excludes benchmark infrastructure and nonproduct build output while retaining generated production code |
| Project languages | `<PROJECT_LANGUAGES>` |
| Production configurations | `<PRODUCTION_CONFIGURATION_MATRIX>` |
| Supported platforms | `<SUPPORTED_PLATFORM_MATRIX>` |
| Representative corpus | `<PROJECT_ROOT>/<CORPUS_DIRECTORY>` |
| Benchmark framework | `<BENCHMARK_FRAMEWORK_PROVIDER>` |
| Result schema registry | `<PROJECT_ROOT>/micro_benchmarks/schemas` |
| Default scope | `<DEFAULT_NAMED_SCOPE>` |
| Platform boundary | `<EXPLICIT_PLATFORM_BOUNDARY>` |
| Results owner | `<PERSON_OR_TEAM>` |

The scope includes:

- Every executable callable defined by the project.
- Every executable callable in bundled, vendored, embedded, generated,
  transpiled, statically linked, dynamically linked, or interpreted third-party
  code in scope.
- Every executable callable in nested third-party dependencies, even when the
  project does not currently call it.
- Every callable in the finite reviewed configuration matrix, including
  normally disabled features that matrix enables in isolated benchmark-only
  artifacts.
- Every supported language and runtime used by the product.
- Every compiled scalar, SIMD, architecture-specific, and runtime-dispatch
  implementation.

Preprocessor macros are not executable callables and have no independent
runtime duration. Do not invent macro benchmark rows. A function, class
operation, template instantiation, lambda, or generated state machine produced
by a macro expansion remains in scope because the emitted callable executes.
The source catalogue may retain macro definitions for provenance, but the
runtime denominator is explicitly nonmacro. Mark a macro definition as a
catalogue-only `macro_noncallable` record: it receives no EID, authoring
disposition, operation, or benchmark row. Conserve those excluded records in a
`catalogue_exclusions.json` macro-audit view, and catalogue executable
definitions emitted by expansion as ordinary callable records with expansion
provenance.

The platform boundary may exclude the operating system, kernel, drivers,
language runtime, C/C++ runtime, thread runtime, and build tools only when each
excluded boundary is explicitly named. All other direct and transitive
dependencies must be inventoried and benchmarked from pinned source.

### 1.1 One suite root and one runner

Keep all micro-benchmark work under one project directory. Do not create a
second standalone entity-benchmark tree with a competing runner, manifest, or
result schema. Use this portable layout as the starting point:

```text
micro_benchmarks/
  CMakeLists.txt or <BUILD_SYSTEM_FILES>
  README.md
  bench_<MODULE>.*                 curated callable workloads
  support/                         fixtures, barriers, clocks, regimes
  entities/
    fixtures/                      private/static/class/template adapters
    audits/                        compiled-scope and coverage proofs
    tools/                         inventory and fixture generators
  generated/                       reproducible generated sources; never results
  schemas/                         versioned JSON/TSV contracts
  tools/
    <RUNNER_ENTRYPOINT>             the only public runner
    <RESULT_SCHEMA_IMPLEMENTATION> normalization and checkpoint contract
    <ENTITY_BACKEND>               exhaustive identity execution backend
  results/                         ignored run artifacts
  .build/                          ignored benchmark build
```

The one runner exposes four suite selections. They are selectors over registered
populations, not four disjoint producer pipelines. Define their set relationship
in the adapter. The SGVAN-style relationship is `P ⊆ W`, where `W` is the
curated workload population and `P` is the subset whose `suite_role` is `pipeline`.
Let `O` be the frozen required EID-operation ownership plan. An operation in
`O` may be owned by a curated, generated-independent, dynamic-entity, foreign,
or device producer, so `O` can overlap `W`. Therefore `pipelines = P`,
`workloads = W`, `entities = O`, and `all = W ∪ O`, deduplicated by exact
measurement identity. `all` must not execute `P` or a curated owner in `O` a
second time.

| Suite | Purpose | May satisfy callable coverage? |
| --- | --- | --- |
| `workloads` | Complete curated population, including any rows whose `suite_role` is `pipeline` | Yes, only for exact directly owned callable rows |
| `pipelines` | Narrowing view of curated rows whose `suite_role` is `pipeline` | No |
| `entities` | Every required EID operation, dispatched to its sole qualifying owner producer | Yes |
| `all` | Union of curated rows and required EID operations, with overlapping owners run once | According to each phase's authority |

Every registration carries two independent role fields. `suite_role` controls
selection and is one of `workload|pipeline|entity` (or a schema-registered
extension). `row_role` controls evidentiary meaning and is one of
`subject|floor|diagnostic`. A pipeline subject therefore has
`suite_role: pipeline` and `row_role: subject`; a pipeline floor has
`suite_role: pipeline` and `row_role: floor`. Never place a suite role in the
row-role field or infer either field from the other.

Filters narrow execution; they never rewrite the inventory or silently make a
partial run whole-project complete. Record both the full scope and the selected
subset in every run manifest and report. Resolve the selection once against the
frozen row/ownership manifests, then dispatch its projections to producers. A
selector that does not apply to a phase must be rejected or explicitly marked
inapplicable; never silently clear it and widen execution.

### 1.2 Portable framework and project adapter

Separate reusable runner code from project knowledge. The reusable suite core owns
checkpointing, process isolation, statistics, schemas, normalization, audits,
and reports. A declarative project adapter owns everything that varies between
repositories:

```yaml
schema_version: project-adapter/1
schema_revision: 1.0.0
schema_uri: "${SUITE}/schemas/project-adapter-1.schema.json"
adapter:
  id: "<PROJECT_ADAPTER_ID>"
  version: "<PROJECT_ADAPTER_VERSION>"
  launcher:
    kind: executable
    path: "${SUITE}/<PROJECT_ADAPTER_EXECUTABLE>"
    executable_sha256: "<SHA256>"
project:
  name: "<PROJECT_NAME>"
  repo_root: "${REPO}"
  suite_root: "${REPO}/micro_benchmarks"
  output_root: "${SUITE}/results"
  schema_root: "${SUITE}/schemas"
benchmark_framework:
  provider:
    kind: vendored
    path: "${REPO}/<BENCHMARK_FRAMEWORK_PATH>"
    revision: "<PINNED_REVISION>"
    source_tree_sha256: "<SHA256>"
    patch_series: {manifest: "${SUITE}/framework_patches.json", sha256: "<SHA256>"}
    headers: {manifest: "${SUITE}/framework_headers.json", sha256: "<SHA256>"}
    built_libraries: {manifest: "${SUITE}/framework_libraries.json", sha256: "<SHA256>"}
  required_capabilities: [cpu_loop, json_output, raw_repetitions]
  optional_capabilities: [entity_api, foreign_runtime, device_runtime, hardware_counters]
  provider_options:
    google_benchmark: {entity: true, foreign: false, gpu: false, libpfm: true}
catalogue:
  provider:
    id: get-all-functions
    version: "<GET_ALL_FUNCTIONS_VERSION>"
    kind: installed_executable
    executable: get-all-functions
    executable_sha256: "<SHA256>"
  generation_action_id: catalogue-generate
  generation_argv:
    - get-all-functions
    - --root
    - "${REPO}"
    - --output
    - "${REPO}/ALL_FUNCTIONS.md"
  supplemental_providers:
    - id: "<LANGUAGE_COMPLETENESS_ORACLE_ID>"
      version: "<PROVIDER_VERSION>"
      kind: executable
      executable: "${SUITE}/<PROVIDER_EXECUTABLE>"
      executable_sha256: "<SHA256>"
      role: language_semantic_completeness_oracle
      completeness_claim: callable_definitions
      languages: ["<IN_SCOPE_LANGUAGE_ID>"]
      source_roots: ["${REPO}/<COVERED_SOURCE_ROOT>"]
      action_id: catalogue-supplement-language
      argv:
        - "${SUITE}/<PROVIDER_EXECUTABLE>"
        - --request
        - "${REQUEST_JSON}"
        - --result
        - "${RESULT_JSON}"
      result_schema: catalogue-provider-result/1
  path: "${REPO}/ALL_FUNCTIONS.md"
  raw_import_path: "${SUITE}/catalogue_import.json"
  normalized_path: "${SUITE}/callable_catalogue.json"
  exclusions_path: "${SUITE}/catalogue_exclusions.json"
  gaps_path: "${SUITE}/catalogue_gaps.json"
  import_audit_path: "${SUITE}/catalogue_import_audit.json"
  scan_coverage_path: "${SUITE}/catalogue_scan_coverage.json"
  definition_coverage_path: "${SUITE}/catalogue_definition_coverage.json"
  format: "get-all-functions-markdown/<FORMAT_VERSION>"
  boundary_manifest: "${SUITE}/catalogue_boundary.json"
  source_roots: ["${REPO}/<PROJECT_SOURCE_ROOT>", "${REPO}/<VENDORED_SOURCE_ROOT>"]
  excluded_roots: ["${SUITE}", "${REPO}/<NONPRODUCT_TOOL_CACHE_ROOT>"]
  exclude_runtime_kinds: [macro]
identity:
  algorithm: sha256
  version: 1
  namespace: "<PROJECT_NAME>"
  relocation_map: "${SUITE}/identity_relocations.json"
scopes:
  - id: production-default
    kind: production_compiled
    operation_manifest_id: "<REQUIRED_OPERATION_MANIFEST_ID>"
    authoring_snapshot:
      callable_coverage: {path: "${SUITE}/callable_coverage.json", sha256: "<SHA256>"}
      terminal_evidence: {path: "${SUITE}/terminal_evidence.json", sha256: "<SHA256>"}
    include:
      component_ids: ["<PROJECT_COMPONENT_ID>", "<DEPENDENCY_COMPONENT_ID>"]
      source_roots: ["${REPO}/<PROJECT_SOURCE_ROOT>", "${REPO}/<VENDORED_SOURCE_ROOT>"]
      configurations: [release-default]
      languages: ["<IN_SCOPE_LANGUAGE_ID_1>", "<IN_SCOPE_LANGUAGE_ID_N>"]
      platforms: ["<PLATFORM_ID>"]
    exclude:
      reviewed_manifest: "${SUITE}/scope_exclusions.json"
    proof_policy:
      completion_target: source_eid
      accepted_subject_provenance: [production_linked, source_included]
      compiled_record_policy:
        production_linked: exact_target_required
        source_included: matched_source_to_production_record_required
      identity_evidence: [binary_bound, runtime_entry_verified]
      count_evidence: [static_multiplicity_proof, runtime_exact_count, output_bijection_proof]
  - id: repository-all-configurations
    kind: scope_union
    members: [production-default, "<OTHER_CONFIGURATION_LANGUAGE_OR_HARDWARE_SCOPE>"]
build:
  production_configurations:
    - id: release-default
      execution_kind: native
      provider: {adapter: "<BUILD_PROVIDER_ADAPTER>", build_system: "<BUILD_SYSTEM>"}
      root: "${REPO}/<PRODUCTION_BUILD_DIR>"
      build_action_ids: [production-build-release]
      metadata: {kind: native_compile_graph, path: "${REPO}/<COMPILE_METADATA>"}
      outputs:
        kind: native_artifacts
        identities: ["${REPO}/<PRODUCTION_ARCHIVE_OR_BINARY>"]
        module_graph: "${REPO}/<NATIVE_MODULE_GRAPH>"
  benchmark:
    execution_kind: native
    provider: {adapter: "<BENCHMARK_BUILD_PROVIDER_ADAPTER>", build_system: "<BUILD_SYSTEM>"}
    root: "${SUITE}/.build"
    configure_action_ids: [benchmark-configure]
    build_action_ids: [benchmark-build]
    outputs: {kind: benchmark_registry, manifest: "${SUITE}/.build/registrations.json"}
components:
  manifest: "${REPO}/micro_benchmarks/shipping_components.json"
  tsv_projection: "${REPO}/micro_benchmarks/shipping_components.tsv"
fixtures:
  state_registry: "${REPO}/micro_benchmarks/entities/fixture_states.json"
  registries:
    - "${REPO}/micro_benchmarks/entities/fixtures.json"
  runtime_roots: ["${REPO}/<CORPUS_DIRECTORY>"]
ownership:
  manifests:
    - id: "<REQUIRED_OPERATION_MANIFEST_ID>"
      path: "${SUITE}/operation_ownership.json"
      sha256: "<SHA256>"
measurement_plans:
  manifest: "${SUITE}/measurement_plans.json"
  sha256: "<SHA256>"
language_adapters:
  cpp:
    id: "<NATIVE_LANGUAGE_ADAPTER_ID>"
    version: "<ADAPTER_VERSION>"
    provider: {kind: built_in, source_closure_sha256: "<SHA256>"}
  "<FOREIGN_LANGUAGE>":
    id: "<FOREIGN_LANGUAGE_ADAPTER_ID>"
    version: "<ADAPTER_VERSION>"
    provider: {kind: executable, path: "${SUITE}/<ADAPTER_EXECUTABLE>", sha256: "<SHA256>"}
producers:
  curated_workload:
    id: "<CURATED_PRODUCER_ADAPTER_ID>"
    version: "<ADAPTER_VERSION>"
    provider: {kind: built_in, source_closure_sha256: "<SHA256>"}
  generated_independent:
    id: "<GENERATED_PRODUCER_ADAPTER_ID>"
    version: "<ADAPTER_VERSION>"
    provider: {kind: built_in, source_closure_sha256: "<SHA256>"}
  dynamic_entities:
    id: "<DYNAMIC_PRODUCER_ADAPTER_ID>"
    version: "<ADAPTER_VERSION>"
    provider: {kind: built_in, source_closure_sha256: "<SHA256>"}
  foreign_runtime: null
  device_runtime: null
runner:
  matching:
    target: stable_logical_module_id
    normalization: unicode_nfc
    case_sensitive: true
    glob_syntax: portable-glob/1
    suite_role_precedence: highest_priority
    overlap_at_equal_priority: error
    unmatched: error
    row_filter_syntax: portable-regex/1
  suite_role_rules:
    - {priority: 100, suite_role: pipeline, include: "mb_pipe_*"}
    - {priority: 50, suite_role: workload, include: "mb_*", exclude: "mb_pipe_*"}
    - {priority: 50, suite_role: entity, include: "entity_*"}
  suite_plans:
    workloads: {select_suite_roles: [workload, pipeline]}
    pipelines: {select_suite_roles: [pipeline]}
    entities: {select_operation_manifests: active_scope_closure, dispositions: [required], owner_producers: all_qualifying}
    all: {union: [workloads, entities], deduplicate_by: measurement_key}
  exploratory_selection:
    flag: include_exploratory
    dispositions: [exploratory]
    completion_effect: none
  selector_routing:
    module: [curated_workload, generated_independent]
    eid: [all_qualifying_operation_owners]
    path_kind_limit: [all_qualifying_operation_owners]
    row_filter: [all_selected_producers]
  default_jobs: 1
  default_preset: standard
  presets:
    quick: "<QUICK_MEASUREMENT_PLAN_ID>"
    standard: "<STANDARD_MEASUREMENT_PLAN_ID>"
    stable: "<STABLE_MEASUREMENT_PLAN_ID>"
    exhaustive: "<EXHAUSTIVE_MEASUREMENT_PLAN_ID>"
  action_ids:
    catalogue_generate: catalogue-generate
    catalogue_supplement: [catalogue-supplement-language]
    inventory_refresh: inventory-refresh
    inventory_check: inventory-check
    configure: benchmark-configure
    build: benchmark-build
    list_rows: list-rows
    run: run
    report: report
  timeouts: {row_seconds: 600, build_seconds: 3600, max_attempts: 3}
  environment:
    inherit_allow: [PATH, "<PERFORMANCE_RELEVANT_VARIABLE>"]
    record_values: [PATH, "<PERFORMANCE_RELEVANT_VARIABLE>"]
    record_redacted_presence: ["<SECRET_VARIABLE>"]
    redact_from_logs: ["<SECRET_VARIABLE>"]
    identity_include: [PATH, "<PERFORMANCE_RELEVANT_VARIABLE>"]
    reject_unlisted: true
command_launcher:
  protocol: suite-command/1
  protocol_revision: 1.0.0
  launch: direct_no_shell
  argv_template:
    - "${SUITE}/<PROJECT_ADAPTER_EXECUTABLE>"
    - "--action"
    - "${ACTION}"
    - "--request"
    - "${REQUEST_JSON}"
    - "--result"
    - "${RESULT_JSON}"
  request_protocol: suite-command-request/1
  result_protocol: suite-command-result/1
  stdout_protocol: suite-progress-jsonl/1
  stderr_protocol: utf8-diagnostics/1
  actions:
    catalogue-generate:
      cwd: "${REPO}"
      env: {inherit: [PATH], set: {}, unset: []}
      timeout_seconds: 600
      success_codes: [0]
    catalogue-supplement-language:
      cwd: "${REPO}"
      env: {inherit: [PATH], set: {}, unset: []}
      timeout_seconds: 600
      success_codes: [0]
    production-build-release:
      cwd: "${REPO}"
      env: {inherit: [PATH], set: {}, unset: []}
      timeout_seconds: 3600
      success_codes: [0]
    inventory-refresh:
      cwd: "${SUITE}"
      env: {inherit: [PATH], set: {}, unset: []}
      timeout_seconds: 600
      success_codes: [0]
    inventory-check:
      cwd: "${SUITE}"
      env: {inherit: [PATH], set: {}, unset: []}
      timeout_seconds: 600
      success_codes: [0]
    benchmark-configure:
      cwd: "${SUITE}"
      env: {inherit: [PATH], set: {}, unset: []}
      timeout_seconds: 600
      success_codes: [0]
    benchmark-build:
      cwd: "${SUITE}"
      env: {inherit: [PATH], set: {}, unset: []}
      timeout_seconds: 3600
      success_codes: [0]
    list-rows:
      cwd: "${SUITE}"
      env: {inherit: [PATH], set: {}, unset: []}
      timeout_seconds: 600
      success_codes: [0]
    run:
      cwd: "${SUITE}"
      env: {inherit: [PATH], set: {}, unset: []}
      timeout_seconds: null
      success_codes: [0]
    report:
      cwd: "${SUITE}"
      env: {inherit: [PATH], set: {}, unset: []}
      timeout_seconds: 600
      success_codes: [0]
platform:
  required_capabilities: [wall_clock]
  requested_capabilities: [thread_cpu, process_cpu, hardware_counters]
  boundary: [operating_system, kernel, language_runtime, build_tools]
```

Fill every angle-bracket placeholder before validating the adapter. Within an
atomic scope, the `include` axes intersect: an EID is included only when its
component, source root, configuration, language, and platform all match that
scope. Consequently, the scope's source roots must cover the applicable
`catalogue.source_roots`, including vendored and nested dependencies, and its
language list must enumerate every runtime that belongs to the scope. Put
additional configurations, languages, devices, and hardware-only populations
in explicit atomic scopes and include all of them in the reviewed repository
union. A catalogue-eligible target that belongs to no atomic scope is a strict
scope-partition gap; it cannot silently disappear from exhaustive coverage.

Use `${REPO}` and `${SUITE}` tokens in checked-in manifests. Expand and
canonicalize them at runtime. Never store one developer's absolute checkout
path as fixture identity.

At resolution, compute `project_adapter_document_sha256` from the canonical
checked-in adapter before host-path token expansion and retain it as provenance.
Also derive separately versioned canonical projections for catalogue/scope
meaning and for each exact-row action's behavior. A scope projection includes
only the referenced boundary, providers, configurations, language adapters,
component/root populations, ownership/authoring proofs, and proof policy. An
exact-row projection includes only the selected launcher, producer/language
adapter, build/timing framework, command behavior, timeout, environment, and
other fields that can affect that row. Resolve and hash the declared launcher
executable, or its built-in source closure for that provider variant, and record
its ID/version. Bind the relevant projection hash, launcher identity, schema
revision, and command-protocol implementation to the corresponding scope or
measurement key; record both projection and full-document hashes in requests,
manifests, and evidence provenance. Adding an unrelated scope or changing a
preset mapping cannot invalidate an unchanged row. A copied path string or
adapter ID alone is not a code identity.

The benchmark-framework provider is a discriminated union:

- `vendored` records repository-relative source path, pinned revision, patch
  series/hash, headers, and built-library hashes.
- `package` records ecosystem, package name, lockfile entry, exact version,
  package checksum, and resolved headers/libraries/modules.
- `installed` records the deterministic resolver command, required version
  constraint, resolved path, and hashes/build IDs for every consumed header,
  library, executable, and module.

Reject provider fields from the wrong variant. Framework capabilities use
portable names; provider-specific switches belong below a namespaced
`provider_options` key. Copying or vendoring is one integration choice, not a
requirement.

Production and benchmark build entries are also discriminated by
`execution_kind`. A `native` entry supplies a compile/link graph and native
artifact identities. A `managed` entry supplies project/module graphs, locked
dependencies, bytecode/assembly artifacts, and runtime/JIT identity. An
`interpreted` entry supplies a module/import graph, locked dependencies, source
hashes, and interpreter identity. A `device` entry supplies host build metadata,
shader/kernel/firmware binaries, compiler identity, device/runtime API, and
driver compatibility. Each variant declares the output or module graph that the
compiled-scope projection consumes; do not force nonnative code into an empty
`compile_commands.json` or archive field.

Every external action uses `suite-command/1`. Expand tokens independently in
each `argv_template` element and in `cwd`/environment values; do not perform word
splitting, wildcard expansion, command substitution, or implicit shell parsing.
Use the platform's native subprocess API and its documented argv encoder on
POSIX and Windows; test round trips for empty arguments, spaces, quotes,
backslashes, Unicode, and shell metacharacters.
Merge only the explicitly inherited variables with the action's `set`/`unset`
map. Apply the action-specific timeout and accept only its declared success
codes. A null timeout is allowed only for the long-lived run coordinator; every
child row/build still has a finite declared timeout. The runner writes a
canonical `suite-command-request/1` JSON object with
action, scope, selection, configuration, paths, hashes, and options, then passes
its path as `${REQUEST_JSON}`. The adapter atomically writes a
`suite-command-result/1` object to `${RESULT_JSON}` containing status, produced
artifact identities/hashes, registrations or results, diagnostics, start/end
times, exit/signal/timeout data, and protocol version. Standard output is
versioned progress JSONL; standard error is diagnostic text. Missing, malformed,
or mismatched result JSON fails the action even when the process exits zero.

Record the literal resolved argv and all actual transport paths as launch
provenance, but never hash run-local request, result, pending, native-output, or
temporary-path spellings into reusable evidence identity. Each action schema
marks those exact argv fields as `transport_path` and defines a canonical
identity argv in which they become stable typed tokens such as
`${REQUEST_JSON}`, `${RESULT_JSON}`, `${PENDING_OUTPUT}`, and
`${NATIVE_OUTPUT}`. Bind that canonical argv to the canonical hash of the
request's measurement-affecting behavior projection and to the hashes of all
identity-bearing input content. Repository and suite roots likewise remain the
`${REPO}` and `${SUITE}` logical tokens. Do not normalize a real subject input,
fixture, executable, module, or production artifact as a disposable transport
path; represent its logical path and content/build identity explicitly. This
separation lets a byte-identical row reuse evidence across run directories
while preserving the exact launch needed to diagnose each attempt.

The `catalogue-generate` adapter action invokes the already-installed executable
with the exact no-shell argv `["get-all-functions", "--root", "${REPO}", "--output", "${REPO}/ALL_FUNCTIONS.md"]`
and `${REPO}` as its working directory. The
explicit `--output` is required because the tool's native default is the legacy
mixed-case `ALL_Functions.md`. Require `${REPO}/ALL_FUNCTIONS.md` as the action's
declared output. Record the
executable version/hash, invocation, output hash, generation time, source-root
set, exact input-source closure hashes, and source revision. Missing output,
nonzero exit, unparseable entries, or a mismatch between that recorded closure
and current included sources invalidates inventory preflight. Do not
silently replace this required project-wide intake with a narrower ad hoc scan.
If the installed command has no version-reporting option, use its executable
SHA-256 plus a reviewed package/source provenance identifier as the provider
version; do not invent a semantic version or invoke an unsupported flag.

Match `suite_role` rules and selectors against stable logical IDs, never host filesystem
paths. `portable-glob/1` is a whole-string, Unicode-NFC, case-sensitive grammar
with literal characters plus `*`, `?`, and bracket classes; `/` is an ordinary
logical separator and no pattern expands against the filesystem. Apply exclude
before include, then choose the highest numeric priority; equal-priority overlap
or an unmatched module is an error. Define `portable-regex/1` as a checked-in
common regex subset with search-versus-full-match behavior fixed by its schema;
reject provider-only syntax instead of silently changing meaning.

The environment policy distinguishes variables that may be inherited, values
recorded in the manifest, secret-variable presence recorded only as redacted,
values scrubbed from logs/results, and nonsecret values included in measurement
identity. Reject inheritance outside the allowlist. Never serialize a secret
value merely because its variable name affects an adapter action.

The adapter must declare production and benchmark build providers/commands,
artifacts or modules per configuration, compile/module metadata,
language/runtime launchers, source roots and exclusions, scopes/unions, platform boundary, fixture
registries, producer plugins, ordered module `suite_role` rules, schema/output roots,
environment policy, timeouts/retries, identity/relocation policy, and benchmark
flags. Runtime capability detection belongs in the run manifest; it must not
silently rewrite the checked-in adapter. Do not carry hardcoded component
names, archive lists, compiler paths, or ISA flags from a reference project
into the reusable runner.

Pin every catalogue, language, and producer adapter by version and executable,
package, or source-closure hash. For an adapter built into the runner, use the
runner source-closure hash instead of inventing an external executable.

Keep scope/ownership identity independent from measurement-plan identity. A
scope freezes which callables and operations exist; an ownership record freezes
who executes each operation. Neither contains a timing-plan ID. At run planning,
resolve the selected preset through the explicit preset-to-plan map, validate
that plan's requirement classes against the selected operations, and derive the
selection ID from both the resolved scope and plan. Switching quick, stable, or
exhaustive plans changes `measurement_plan_id` and `selection_id`, but it does
not change `resolved_scope_key` or the ownership-manifest hash.

After manifest resolution, every scope must contain finite, exact component,
source-root, configuration, language, platform, compiled-record, EID, and
required-operation sets. Globs may help generate a reviewed manifest, but a
mutable glob is not the frozen denominator. Exclusions require stable IDs,
reasons, evidence, and review metadata. The scope's proof policy determines
which `subject_provenance`, compiled-record binding, identity evidence, and
call-count evidence can satisfy
`runtime_complete(resolved_scope_key, measurement_plan_id)`. For example, a
`source_included` companion may satisfy a `completion_target: source_eid` scope
only when that provenance is accepted and separately matched to the production
record/source/flags required by policy. It does not become a direct measurement
of the original compiled record. A `source_extracted` companion cannot satisfy
the example policy. A stricter `completion_target: compiled_record` scope
accepts only a row that directly binds and invokes the exact production record.
Reports always name the completion target and proof-policy ID.

Every language/producer adapter implements the same interface: inventory,
build/resolve, untimed registration discovery, isolated invocation, clock and
call-proof capabilities, raw-result parsing, normalization, and cleanup.

### 1.3 Five-layer architecture

Implement the suite as five joined layers. Each layer emits a versioned artifact
that the next layer validates before use:

1. **Inventory:** reconcile source definitions, production build/module graphs,
   linked or loaded artifacts, symbols/entries, aliases, clones, and observed
   concrete instantiations.
2. **Authoring:** assign stable source identities, dispositions, typed fixtures,
   exact operation IDs, expected rows, validation oracles, and ownership.
3. **Registration and build:** generate isolated sources or select curated
   modules, compile them, list registrations without timing, and prove expected
   rows equal actual registrations.
4. **Execution:** run exact rows in isolated processes, preserve native output,
   and transactionally checkpoint only complete successful rows.
5. **Normalization and proof:** merge all producers into one schema, compute
   aggregates from raw samples, audit runtime completion, and create reports.

Never use evidence from a later layer to hide a gap in an earlier one.
Registration is not execution, a generated source is not a successful build,
an owning pipeline is not a child's direct measurement, and static authoring
completeness is not runtime completion.

---

## 2. Required record for every callable

For a callable with no arguments:

```cpp
int funcA()
{
    return 2 + 2;
}
```

the suite must emit at least one direct record containing:

```text
callable: int funcA()
callable kind: free function
input type: none
input description: no arguments
input size: none
input mode: normal
measurement scope: direct-inclusive
real time
user CPU time
system CPU time
total CPU time
benchmark iterations
target calls per iteration
total verified target calls
real time per target call
user CPU time per target call
system CPU time per target call
total CPU time per target call
repetitions and statistical aggregates
```

For a callable with input:

```cpp
Result funcB(const InputA& input);
```

the suite must emit separate records such as:

```text
funcB(InputA: empty)
funcB(InputA: small, 16 elements, 64 bytes)
funcB(InputA: medium, 4 KiB)
funcB(InputA: large, 64 MiB)
funcB(InputA: valid uncommon mode)
funcB(InputA: malformed)
funcB(InputA: truncated)
funcB(InputA: hot cache)
funcB(InputA: cache displaced)
```

Each record must describe the input in structured fields. Positional numbers in
the benchmark name are not sufficient metadata.

### 2.1 Timing definitions

- `thread_active_wall_totals`: directly observed monotonic active time for each
  registered benchmark thread in one raw repetition, with pause/resume behavior
  and active-slice count declared. A scalar `sample_active_wall_total` is
  unambiguous only for a single registered thread.
- `concurrent_group_wall_total`: one outer monotonic bracket from coordinated
  group start through completion of all registered threads. This is the
  authoritative group-elapsed denominator when aggregate throughput matters.
- `framework_wall_accumulator`: the framework's combination of per-thread wall
  intervals, stored with its exact aggregation formula; never assume it equals
  `concurrent_group_wall_total`.
- `amortized_wall_per_state_iteration`: for one thread,
  `sample_active_wall_total / framework_iterations_total`; for a concurrent
  group, `concurrent_group_wall_total / framework_iterations_total`. Preserve a
  framework-normalized value separately when it uses another aggregation rule.
- `batch_real_time`: separately bracketed wall latency of one State iteration's
  complete target batch. Publish it only when individual batches were actually
  timed; never rename a whole-sample average as an observed batch latency.
- `reported_real_time`: the benchmark framework's real-time field. Preserve it
  separately because manual-time or device rows may give it a different source.
- `framework_cpu_time`: the framework's native CPU field together with its
  configured mode. In Google Benchmark the default is CPU accumulated across
  registered benchmark threads; `MeasureProcessCPUTime()` changes that same
  field to process CPU. Never map it unconditionally to main-thread CPU.
- `main_thread_user_time`, `main_thread_system_time`, and
  `main_thread_cpu_time`: userspace, kernel, and total CPU time consumed by the
  calling thread.
- `process_user_time`, `process_system_time`, and `process_cpu_time`: CPU time
  consumed by all threads in the current process during an explicit outer
  bracket. It can include unrelated/background runtime threads, so claim
  target-bound scope only with isolation or attribution evidence. State whether
  already-exited threads are included.
- `thread_cpu_time`: independently measured calling-thread CPU time. When
  worker detail is available, retain per-thread records and `worker_cpu_sum`,
  explicitly excluding the calling thread.
- `child_process_cpu_by_pid` and `process_tree_cpu_time`: separately collected
  child/descendant CPU with per-process identity, boundaries, and de-duplication.
  Current-process clocks exclude children; GNU-time-style user/system figures
  may include waited-for children and must carry `process_tree` scope.
- `completion_latency`: wall time from direct entry or asynchronous submission
  until the result becomes externally observable, measured by an explicit
  single-operation bracket rather than inferred from throughput averages.
- `critical_path_time`: wall time along the dependency path that determines
  completion. It is not the sum of parallel worker CPU time.
- `host_submit_time`: host CPU and wall duration required to enqueue a device
  operation, excluding device completion unless the API is synchronizing.
- `device_execution_time`: device-native timestamp interval for the submitted
  kernel/shader/command, with timestamp domain and conversion method.
- `device_completion_latency`: host monotonic wall time from submission until
  results are observable after the required completion primitive.
- `fence_wait_time`: host wall and CPU time spent waiting on the declared
  fence/event/synchronization primitive.
- `first_call_latency` and `steady_state_latency`: distinct fresh-process and
  warmed measurements. A first-call row uses a one-shot fresh process with
  registration/setup complete, no target probe/calibration/warmup, exactly one
  root invocation, and an explicit wall bracket. Do not infer one from the other.
- `setup_time`, `target_time`, `teardown_time`, `allocation_time`,
  `deallocation_time`, `copy_time`, `move_time`, `enqueue_time`,
  `queue_wait_time`, `worker_execution_time`, and
  `synchronization_wait_time`: optional named phase clocks whose boundaries are
  declared by the fixture.
- `framework_iterations_total`: the framework's actual total State-loop
  iterations in the raw repetition, not the number of repetitions used to form
  an aggregate.
- `benchmark_threads`, `requested_iterations_per_thread`, and
  `iterations_by_thread`: thread and loop counts needed to interpret a
  multithreaded row. Retain null/reason when the framework exposes only a total.
- `root_target_calls_per_state_iteration`: fixture-originated calls made by one
  State-loop iteration on one benchmark thread, together with its evidence level.
- `total_root_target_calls`: the proven sum across actual thread iterations. Do not
  assume fixed requests were met exactly; batching APIs may overshoot.
- `time_per_call`: framework-reported per-iteration time divided by
  the matching fixture-root calls per normalized framework iteration. If a separately
  retained clock is the total for the entire sample, divide that total by
  `total_root_target_calls` instead. Never mix these two normalizations.
- `tsc_ticks_per_iteration`: elapsed x86 reference-clock ticks when a guarded
  TSC/RDTSCP source is available. Label these
  `elapsed_reference_clock_ticks_not_cpu_cycles`.
- `cpu_cycles_per_iteration`: actual hardware cycles from a performance counter.
  Never substitute TSC ticks for this field.

TSC evidence records invariant/constant-rate capability, serialization method,
start/end logical CPU, endpoint-ID equality, and a migration verdict with its
evidence. Equal RDTSCP endpoint IDs do not exclude a migrate-away-and-back
interval. Use `migration_verdict: not_observed` only with a verified single-CPU
affinity constraint or scheduler trace; otherwise use `unknown`. A proven
migration or interval rejected by the measurement plan is null with reason
rather than an admissible tick measurement.

Every duration is stored canonically in nanoseconds and rendered in all three
requested scales:

```json
{
  "wall_time": {"ns": 1254.5869, "us": 1.2545869, "ms": 0.0012545869},
  "process_cpu_time": {"ns": 3120.9375, "us": 3.1209375, "ms": 0.0031209375}
}
```

Do not publish one ambiguous `cpu_time` for a row that can create or use
workers. Preserve the benchmark framework's calling-thread CPU clock,
independent thread CPU clock, and process-wide CPU clock separately. Missing
clocks remain `null` with availability, evidence, method, scope, and reason.

Google Benchmark's multithreaded `iterations` field is the total across its
registered benchmark threads. A fixed request such as `50x` is requested per
benchmark thread, and batched iteration APIs may overshoot. Its reported wall
time is normalized for throughput across that total; it is not the latency of
one concurrent operation. Record a separately bounded completion-latency sample
when latency matters. Process CPU contains threads in the current process but
not child processes. Calling-thread CPU and every worker-thread CPU are subsets
of current-process CPU; never add any of them to process CPU. `worker_cpu_sum`
excludes the caller and is a diagnostic decomposition, not an additive total.
For multithreaded rows, retain per-thread active-wall/CPU vectors, the
framework's aggregation formula, and independently outer-bracketed group wall
and current-process CPU when those totals are claimed. Per-thread process-clock
samples may overlap; averaging or summing them does not create an exact outer
process total.

For Google Benchmark, a State iteration is the unit counted by
`state.iterations()` and written to native JSON. A normal range-for loop body
advances it by one; a manual inner loop of `k` target calls still advances it by
one and therefore has `k` target calls per State iteration.
`KeepRunningBatch(k)` advances the State count by `k` even though its surrounding
loop body is entered once, and its final batch may overshoot the requested
count. Derive target-call multiplicity from the API/control flow actually used,
not from loop-body entry count or the requested iteration count.

Target identity and call-count evidence are separate. Binding the correct symbol
does not prove how many times it ran.

| Identity evidence | Meaning | Exact identity established? |
| --- | --- | --- |
| `source_name_only` | A name or text match | No |
| `static_direct_call` | Reviewed source control flow calls the complete target | Provisional |
| `binary_bound` | Link/disassembly/build evidence binds the row to the exact compiled target | Yes |
| `runtime_entry_verified` | Matched instrumentation observed entry to the exact target | Yes |

| Call-count evidence | Meaning | Denominator verified? |
| --- | --- | --- |
| `fixture_declared` | The fixture author supplied a count | No |
| `static_multiplicity_proof` | Reviewed loop/control flow proves the count for every iteration | Yes when paired with exact identity evidence |
| `runtime_exact_count` | Matched instrumentation counted exact fixture-root calls and identified descendant entries | Yes |
| `output_bijection_proof` | A reviewed output/state invariant proves one distinct effect per call | Yes when paired with exact identity evidence |

Every count carries `count_scope`. The per-call denominator is always
`fixture_root_invocations`. For recursive or reentrant targets, record total
observed target entries and recursive/reentrant descendant entries separately;
one root invocation's direct-inclusive cost must not be divided by all nested
entries. `runtime_exact_count` qualifies the denominator only when the
instrumentation distinguishes fixture roots from descendant entries. Otherwise
it is useful attribution evidence but not an exact root-call denominator.

Strict direct coverage requires exact target identity plus a verified call-count
denominator. Never label a fixture-declared denominator as verified. Use it for
provisional normalization with
`denominator_source: fixture_declared_target_calls`, then upgrade both evidence
dimensions after the matched verification pass.

Store raw repetition records as well as mean, median, minimum, maximum,
standard deviation, coefficient of variation, and requested percentiles.
Aggregate-only output is forbidden because it can discard the true calibrated
iteration count.

Aggregate rows must keep their repetition count separate from subject
iterations. For example, an aggregate formed from seven samples has seven
repetitions; it did not execute the target only seven times.

### 2.2 Direct-inclusive timing

If `funcA()` calls `funcB()` and `funcC()`, the direct `funcA()` row includes the
work performed by those children. Mark this `direct-inclusive` and record the
known callees.

`funcB()` and `funcC()` must also have their own direct benchmark rows. The
`funcA()` row may never be copied or aliased to either child. A sampled profile
or compiler call graph may explain nesting, but it may not replace direct
callable timing.

Exclusive time must not be obtained by subtracting child microbenchmarks from a
parent. Inlining, cache state, branch prediction, allocation, and compiler
optimization make such subtraction unreliable. When exclusive attribution is
needed, retain the direct rows and add profiling or instrumented call-boundary
measurements labeled with their measurement method.

### 2.3 Tiny-callable batching

Tiny callables must run in a verified batch large enough to exceed timer noise.
The batch may contain 100, 10,000, or a dynamically calibrated number of calls.
Always preserve both batch totals and per-call normalization.

For constant or trivial functions, prevent constant folding, inlining-based
elimination, loop deletion, and dead-store removal with appropriate barriers,
runtime-controlled inputs, verified outputs, and, where necessary, a reviewed
non-inlined benchmark adapter. Report the production callable identity even
when an adapter is required.

---

## 3. Exact callable inventory

Create the inventory before claiming suite completeness. From the repository
root, invoke `get-all-functions --root <PROJECT_ROOT> --output <PROJECT_ROOT>/ALL_FUNCTIONS.md`;
every project using this blueprint must
produce that canonical repository-root document. Treat it as the required
project-wide source-catalogue intake. Parse every raw row losslessly into the
versioned `micro_benchmarks/catalogue_import.json`, preserving raw text, source
coordinates, reported kind/confidence, signature, owner, template/lambda
facets, generator version, and `ALL_FUNCTIONS.md` content hash. Derive the
canonical eligible callable records in `callable_catalogue.json` and all
no-EID or out-of-boundary records in `catalogue_exclusions.json`. The inventory must then
reconcile the eligible source structure with compiled artifacts.

Keep the raw document hash as provenance for the exact bytes parsed. Derive a
separate `catalogue_semantic_hash` from the canonical normalized record set,
primary-parser and supplemental-provider normalization schema/versions,
included-source closure, and classification policy.
Exclude generator timestamps, headings, display totals, row order, and other
declared presentation-only fields from the semantic hash while retaining them
in the import audit. EIDs and scope identity use normalized semantic/source
identities, so a presentation-only rewrite does not invalidate every
measurement. A changed callable, parser meaning, included-source closure, or
classification policy invalidates the affected catalogue/scope proof. It
invalidates reusable row evidence only when that row's canonical catalogue
record, source/dependency closure, or behavior projection changes.

No in-boundary nonmacro callable entry may disappear during import. Map every free/static
function, method and lifecycle operation, concrete template instantiation, and
lambda/closure to a catalogue ID and canonical EID. Expand a class entry into
its separately executable constructors, destructor, copy/move/assignment,
methods, operators, static members, and call operator; never assign one class-
level timing row. Preserve each lambda's source identity and capture form, and
each template's concrete argument/configuration identity. If one listed
function calls another, both remain separate EIDs with independently owned
direct rows. Macro definitions go to `catalogue_exclusions.json` with
`reason: macro_noncallable`, while callables emitted by a macro remain ordinary
eligible entries.

Parsing or classification uncertainty is recorded in `catalogue_gaps.json` as
a gap, never as an exclusion. Reconcile imported catalogue
entries, compiler/module records, and generated fixture/row manifests in both
directions: every eligible `ALL_FUNCTIONS.md` callable inside the frozen target
boundary must reach exactly one authoring disposition and required-operation
matrix, and every compiled or registered target callable must trace back to an
imported or supplemental entry or a reviewed generated/toolchain identity. Re-run the explicit
command after relevant source changes and reject a stale catalogue before build
or timing.

`get-all-functions` intentionally scans the repository, which may include the
benchmark suite and build trees. Freeze `catalogue_boundary.json` before row
generation. It classifies source roots and records as product, bundled/nested
dependency, declared tool/test scope, benchmark infrastructure, generated
benchmark registration/fixture, build output, or another reviewed role.
Benchmark infrastructure, generated benchmark implementation, results, and
nonproduct configure/probe/cache/intermediate callables are retained in
`catalogue_import.json` when scanned and conserved in
`catalogue_exclusions.json`, but they do not enter the product callable
denominator. A generated benchmark row may therefore add scanner records
without recursively creating new benchmark requirements. Generated,
transpiled, embedded, shader, state-machine, or other output that is compiled,
linked, loaded, or interpreted by a declared production configuration remains
in scope even when its source lives below a build directory; import it through
the primary or supplemental provider and join it to that production artifact.
Changes to an included target source still change the semantic catalogue and
scope. No path is excluded merely because it is difficult; every exclusion
carries stable record IDs, `source_role`, normalized path, source hash, reason, evidence,
and reviewer.

Do not assume the scanner visited every declared source root. Some installed
versions hard-skip directory names such as `vendor`, `build`, or
`node_modules`. Generate `catalogue_scan_coverage.json` from an independent,
hash-bound enumeration of every declared included source file and join it to
the scanner's represented-file set. A skipped file inside the target boundary
is a strict inventory gap. Configure or upgrade `get-all-functions`, or invoke
versioned supplemental catalogue providers for those roots and merge their
records before EID derivation. Supplemental records carry provider identity and
source hashes and obey the same normalization/conservation rules. A reviewed
boundary exclusion may classify an intentionally external platform/runtime
root; a scanner's built-in skip rule may not silently do so.

File visitation alone does not prove definition completeness. Pattern-based
catalogue providers can omit valid definitions even in a represented file, and
some language modes intentionally provide only a lower bound. For every
included language/configuration, declare a versioned completeness oracle that
enumerates callable definitions with language semantics: a compiler-front-end
AST or index for compiled languages, a typechecker/compiler index where that is
authoritative, or a grammar-complete parser plus runtime/module metadata for an
interpreted language. Run it with the production defines, include paths,
language version, generated sources, template/generic instantiations, and module
configuration needed by that scope. Generate
`catalogue_definition_coverage.json` as the exact per-file join between oracle
definitions, imported `get-all-functions` records, supplemental records,
canonical EIDs, and reviewed non-runtime outcomes. Every oracle definition must
be represented exactly once after alias reconciliation; every imported or
supplemental callable must resolve back to an oracle definition or carry a
reviewed provider-specific explanation. A language without an adequate oracle
cannot support an exhaustive-callable claim; report completion only over the
explicit tool-reported lower-bound scope until that gap is closed.

The complete nonmacro executable target population imported from
`ALL_FUNCTIONS.md` and supplemented by the language completeness oracles inside
that boundary must be a declared catalogue scope or a
reviewed union of finite configuration scopes. A production-compiled subset is
a useful milestone, but it cannot satisfy the repository-wide exhaustive claim
while another in-boundary executable imported EID lacks its own required direct
measurements.

### 3.0 `ALL_FUNCTIONS.md` catalogue-to-row expansion

Use one canonical parser. Downstream generators consume its normalized records;
they must not reparse Markdown with producer-specific rules. Preserve overlaps
and aliases until identity reconciliation proves whether they are duplicate
catalogue views, distinct overloads, or distinct compiled targets. Never derive
an EID from a Markdown row number, since adding an earlier entry would renumber
unrelated callables.

```text
get-all-functions
  -> ALL_FUNCTIONS.md (immutable hashed intake)
  -> catalogue_import.json (one lossless normalized record per raw row)
  -> catalogue_boundary.json classification
  -> catalogue_scan_coverage.json + catalogue_definition_coverage.json
  -> callable_catalogue.json + catalogue_exclusions.json + catalogue_gaps.json
     (conserved partition; strict runs require the gap set empty)
  -> catalogue_id / canonical EID / compiled-record joins
  -> reviewed typed input and regime matrix per EID
  -> required operation IDs and sole owner rows
  -> generated or curated direct registrations
  -> raw samples and EID-operation runtime proof
```

Apply this expansion contract:

| Imported record | Required direct-row expansion |
| --- | --- |
| Free, namespace, internal, or file-static function | One EID, then every justified typed input/regime operation; create a legal companion seam when linkage requires it |
| Class/struct or callable object | Each executable constructor, destructor, copy/move/assignment, method, operator, static member, conversion, and call operator over relevant object states |
| Function or class template/generic | Every production-required concrete instantiation, then its applicable callable operations and typed input/regime rows |
| Lambda/closure | One source-site EID for the closure call operator, with capture layout/provenance and relevant captured states; each separately executable closure constructor/destructor/copy/move/assignment operation receives its own EID and owned rows |
| Coroutine, generated state machine, runtime/ISA/device implementation, or foreign callable | Each independently executable entry and supported configuration, with its native runtime/device identity |
| Callable declaration without an executable definition, deleted operation, or abstract operation without a concrete body | Retain in `callable_catalogue.json`, assign its EID, and require reviewed `terminal` evidence in `callable_coverage.json`; it receives no timing row |
| Macro definition, enum/type-only syntax, or other no-EID construct | Record in `catalogue_exclusions.json`; any emitted executable callable re-enters through the applicable row above |

Each lossless import row receives a `raw_record_id` bound to the raw document
hash, byte range, and exact row bytes, plus a semantic `catalogue_id` bound to
normalized source path/location, reported construct kind, owner/signature, and
parser version. One catalogue ID may cite several raw rows when the generator
deliberately reports overlapping views. The raw IDs form an exact disjoint
partition of eligible callable records, eligible class/template expansion
parents, `catalogue_exclusions.json` records, and `catalogue_gaps.json` records.
Every expansion parent lists
the concrete EIDs or reviewed non-runtime outcomes it produced; every callable
catalogue record lists its EID; every exclusion lists classification, reason,
evidence, and review. `catalogue_import_audit.json` verifies these set joins and
reported totals exactly, including a dedicated `macro_noncallable` projection.
It publishes sorted ID sets and hashes as well as counts. Its raw equation is
`all_raw_record_ids = imported_callable_or_expansion_parent_raw_ids ⊎ excluded_raw_ids ⊎ raw_gap_ids`.
Its independent definition equation is
`all_oracle_definition_ids = primary_matched_definition_ids ⊎ supplemented_definition_ids ⊎ reviewed_nonruntime_or_out_of_boundary_definition_ids ⊎ definition_gap_ids`.
The disjoint-union symbol requires both complete coverage and zero overlap.
Every in-boundary nonmacro member of the latter equation must then map to one
canonical callable/expansion record and one EID or reviewed terminal outcome;
strict inventory requires `raw_gap_ids`, `definition_gap_ids`, unresolved, and
unpartitioned sets all empty. Persist nonempty gap records with provider, raw or
definition ID, source hash/location, failure stage, diagnostics, and candidate
joins so a failed preflight remains explainable.

For every required operation, generation must produce either one qualifying
owner row or an explicit operation gap that fails authoring. After untimed
discovery, the expected subject-row set must equal the registered subject-row
set. After execution, every required operation must join to its own complete
sample set; no parent, pipeline, overload sibling, class aggregate, primary
template, or caller may donate timing to another EID.

### 3.1 Callable kinds

Inventory all executable definitions:

- Free and namespace functions.
- Exported, internal, file-static, and anonymous-namespace functions.
- Overloads as distinct complete identities.
- Constructors and destructors.
- Copy and move constructors.
- Copy and move assignment operators.
- Member, static-member, conversion, and overloaded operator functions.
- Virtual overrides and concrete final overriders.
- Concrete template and generic instantiations.
- Lambdas and closure call operators.
- Coroutine and generated state-machine entry points that can be invoked.
- Generated, macro-generated, transpiled, and embedded functions.
- Runtime dispatch entries and every compiled target implementation.
- Scalar, SSE2, SSE4, AVX, AVX2, AVX-512, NEON, SVE, WASM SIMD, GPU, and
  other architecture-specific variants.
- Dynamic-language functions, methods, closures, generators, async functions,
  and callable objects.
- Foreign-function-interface adapters and callbacks.

Default-argument call forms are operation/input variants of the underlying
callable unless the language/toolchain emits a distinct executable wrapper.
Likewise, constructor/destructor ABI variants, thunks, cold partitions, and
compiler clones normally remain compiled records joined to one source EID;
give them independent operation ownership only when they expose a safe,
independently invocable contract.

Declarations without executable definitions, deleted functions, and abstract
operations with no invocable concrete body remain in the catalogue with a
non-executable reason. They are not silently omitted, but they are not counted
as timed executable callables.

### 3.2 Identity

Every callable receives a stable canonical EID plus the joined identities needed
to distinguish its source definition, compiled emissions, fixture, operations,
evidence passes, and samples from every other record.

Do not force source, compiler, linker, and benchmark identities into one string.
Maintain these joined layers:

| Layer | Stable key | Purpose |
| --- | --- | --- |
| Source catalogue | `catalogue_id` | Retains every parsed definition and non-runtime declaration |
| Catalogue completeness proof | `catalogue_completeness_proof_key` | Hashes semantic boundary/import/scan/definition/supplement reconciliation evidence without presentation-only provenance |
| Canonical source callable | `eid` | Groups one exact source definition across compiler aliases and clones |
| Compiled record | `compiled_record_id` | Identifies artifact/module, complete executable entry, clone/alias kind, runtime/toolchain, and configuration |
| Fixture | `fixture_identity` | Hashes a noncircular fixture-relevant adapter projection, typed state, source dependencies, and expected operations |
| Benchmark operation | `operation_id` | Identifies one EID, typed input, object operation, and execution regime |
| Resolved scope | `resolved_scope_key` | Hashes the exact denominator, exclusions, ownership manifests, and proof policy behind a human scope ID |
| Measurement plan | `measurement_plan_id` | Hashes required repetitions, timer policy, metrics, passes, evidence, and success rules |
| Selection | `selection_id` | Hashes the exact selected subject/auxiliary rows, routing, and measurement plan within a resolved scope |
| Base timing measurement | `measurement_key` | Binds an operation to its timing binary, environment, and measurement policy for safe resume |
| Logical pass reconciliation | `reconciliation_key` | Proves separate passes target the same logical operation/control flow despite declared instrumentation differences |
| Numerical comparison cohort | `comparison_cohort_key` | Proves separately measured values have compatible workload, concurrency, hardware, and environment scopes |
| Evidence pass | `pass_key` | Binds timing, verification, attribution, or counter evidence to its pass-specific implementation |
| Raw sample | `sample_key` | Identifies one requested repetition within one pass |
| Attempt path | `attempt_key` | Filesystem-safe identity for one run-local launch attempt; never a resume/completion key |
| Within-repetition observation | `observation_key` | Identifies one chunk/measurand point clustered beneath a sample |
| Derived aggregate | `aggregate_key` | Identifies one estimator/policy applied to an exact ordered raw-sample set and metric |
| Capability verdict | `capability_verdict_key` | Identifies one exact machine/provider/probe verdict for a required row capability; never a successful measurement |

The canonical `eid` should be a versioned digest of normalized repository path,
source coordinate, callable kind, complete signature or owner operation, and
configuration discriminator where the source body differs. Store the unhashed
identity fields next to the digest so collisions and relocations can be audited.
Moving a definition requires an explicit relocation map or a new EID; never
silently credit old timing to the nearest same-named function.

Publish the byte-level identity algorithm. A portable default is SHA-256 over a
length-delimited UTF-8/NFC tuple containing project namespace, identity-schema
version, repository-relative logical path with `/` separators, callable kind,
canonical complete signature, one-based definition coordinate, lambda/anonymous
ordinal where needed, and configuration discriminator. Declare whether logical
paths resolve symlinks and whether filesystem case is preserved; do not let host
defaults decide. Use the full digest as the authoritative key and only truncate
for display after checking the full-digest collision table; serialize SHA-256
IDs as 64 lowercase hexadecimal characters. A relocation entry
records old tuple/digest, new tuple/digest, unchanged-body evidence, reviewer,
reason, and source hashes; ambiguous or many-to-one relocations fail closed.

A single source EID may map to several emitted symbols, thunks, cold partitions,
IPA clones, and architecture variants. Preserve those compiled records without
inflating the source-callable denominator. Conversely, overloads, lambdas at
different source sites, class operations, concrete template instantiations, and
configuration-specific bodies must never collapse to one EID merely because
their leaf names match.

Canonicalize structured identity maps with RFC 8785 JSON before hashing them.
Keep the complete blueprint and adapter document hashes as provenance. Derive
`resolved_scope_key` from the versioned blueprint scope-contract projection,
canonical project-adapter scope projection, identity schema/version, primary and supplemental
catalogue-provider identities, `catalogue_semantic_hash`, and a
`catalogue_completeness_proof_key`, plus
exact sorted component/root/configuration/language/platform/compiled-record/EID/
required-operation populations, exclusion records, operation-ownership
manifest hashes, the canonical authoring-ledger and terminal-evidence manifest
hashes, and proof policy. Derive `measurement_plan_id` from exact
required raw samples, timer/calibration rules, registered metrics and adequacy
thresholds, pass kinds, evidence thresholds, unsupported policy, success
criteria, and reviewed completion-claim eligibility. Derive `selection_id` from `resolved_scope_key`,
`measurement_plan_id`, suite-plan and selector-routing hashes, and the exact
sorted selected subject and auxiliary row keys with owner dispatch and required
pass kinds. Human-readable names accompany these hashes and cannot be reused to
credit a changed definition.

Derive `catalogue_completeness_proof_key` from canonical semantic projections
of the boundary, import-conservation, included-file scan, language-definition,
supplement, exclusion, and join proofs. Include provider identities, policies,
included source/content identities, definition identities, classifications,
joins, and verdicts. Exclude generation timestamps, raw Markdown byte spelling,
row order, display totals, absolute host paths, and raw-record IDs that change
only because presentation changed. Retain and link the complete unprojected
artifact hashes in the run manifest for provenance. Thus a presentation-only
catalogue refresh can preserve the semantic proof key, while any changed source,
definition, provider meaning, boundary decision, or reconciliation verdict
changes it.

Atomic and union scopes both use the field `resolved_scope_key`. For a union,
hash a `kind: scope_union` tag, union-policy/schema version, the member scope IDs
and resolved keys sorted by canonical UTF-8 bytes, conflict/deduplication policy,
and the fully flattened component/configuration/platform/compiled-record/EID/
required-operation closure. Reject cycles, missing members, and incompatible
ownership/proof policies before hashing. Member declaration order cannot change
the key; a member population or union-policy change must.

Derive subordinate IDs with the same SHA-256 and byte-normalization rules. For
interoperability, encode each tuple field as its UTF-8/NFC byte length in ASCII,
a colon, and the bytes, then concatenate fields in the stated order. Use the
literal token `inapplicable` for an axis that does not apply; never omit a tuple
position or use a host-language null representation.

```text
operation_id = SHA256(LP("operation/1") || LP(eid) ||
                      LP(operation_kind) || LP(input_case_id) ||
                      LP(regime_id) || LP(configuration_id))

sample_key = SHA256(LP("sample/1") || LP(pass_key) ||
                    LP(decimal_repetition_index))

attempt_key = SHA256(LP("attempt/1") || LP(run_id) || LP(attempt_id))

observation_key = SHA256(LP("observation/1") || LP(sample_key) ||
                         LP(decimal_chunk_index) || LP(participant_id) ||
                         LP(measurand_id))

aggregate_key = SHA256(LP("aggregate/1") || LP(estimator_id_and_version) ||
                       LP(metric_id) || LP(aggregation_policy_hash) ||
                       LP(canonical_ordered_raw_sample_keys))

capability_verdict_key = SHA256(LP("capability-verdict/1") ||
                                LP(tagged_subject_and_operation_or_auxiliary_id) ||
                                LP(capability_id_and_requirement_version) ||
                                LP(capability_row_projection_hash) ||
                                LP(adapter_framework_probe_projection_hash) ||
                                LP(platform_capability_fingerprint))
```

`operation_kind` distinguishes construction, destruction, copy, move, method,
operator, invocation, or another registered action. `input_case_id` and
`regime_id` resolve to versioned manifests containing the full typed input and
regime axes. The repetition index is zero-based and stable within the frozen
pass; encode it as unsigned base-10 ASCII without leading zeroes. Retry attempts
retain the same `sample_key` and receive separate
append-only `attempt_id` values. Encode chunk indices by the same rule.
`measurand_id` names the measured clock/counter/slope quantity; two observations
with different measurands never share a key.
`participant_id` is a stable logical identity within the operation, such as
`benchmark_thread/0`, a declared worker role/EID, `host`, `device/0`, or a
device queue/stream ID. Record transient OS thread/process IDs separately as
diagnostics. Each scalar observation has exactly one participant; a group/vector
summary uses a distinct group measurand and explicitly maps every vector index
to its participant IDs.
The capability-row projection binds every capability-affecting callable source
and dependency hash, fixture/input/regime, configuration and compiler command,
production artifact, benchmark/probe binary, runtime/device module, and dispatch
identity. A changed row build or behavior therefore invalidates an old
unsupported verdict even when its logical operation ID is unchanged.
An aggregate key uses only eligible raw sample keys in the declared canonical
order; changing exclusions, clustering, weighting, quantile type, estimator, or
metric changes the aggregation-policy hash or tuple. Aggregate records never
reuse `sample_key` or a raw repetition index.

For native code include:

```text
component
build configuration
library/archive/shared object
object file or translation unit
linkage
complete demangled signature
source path and location
ISA or target attributes
```

For dynamic languages include:

```text
component
module and source file
qualified owner
callable name
parameter shape where available
source location
runtime/build configuration
```

Leaf names, substrings, wildcards, and source-text occurrences cannot establish
identity or coverage.

### 3.2.1 Compiled-scope projection

Use the finalized production build as the default executable scope. The
projection must read the build/module graph for each declared execution kind
and the exact production archives, objects, shared libraries, executables,
bytecode/assemblies, generated sources, runtime modules, shaders, and kernels.
Hash every input used to form the projection, including transitive dependency
files when available. Record archive members, symbols, source associations,
configuration, toolchain, and build IDs.

The projection produces two related populations:

- `production_compiled`: canonical source EIDs proven relevant to the selected
  production artifacts and configurations.
- `catalogue_nonmacro`: the wider source population, useful for disabled,
  orphaned, foreign-runtime, or future-feature audits.

The compiled population is the default strict denominator. The wider catalogue
is selected explicitly and must never be mistaken for the production-compiled
completion total. Rebuilding an archive, changing compile metadata, changing a
fixture dependency, or regenerating source invalidates the bound audit. Refresh
the projection; do not bypass the stale-input failure.

Production-compiled completion is a named milestone, not permission to narrow
the project contract. If the declared scope includes disabled configurations,
unlinked vendored code, foreign runtimes, or supported hardware variants, build
and audit those as additional named scopes before claiming repository-wide
exhaustiveness.

### 3.3 Templates and generics

A template definition is not executable until instantiated. The suite must:

1. Inventory the definition.
2. Discover every production instantiation.
3. Freeze `production_required` instantiations from emitted artifacts and the
   declared supported-type/configuration contract.
4. Keep additional stress or hypothetical instantiations in an `exploratory`
   set unless a reviewed scope manifest explicitly promotes them.
5. Build each required instantiation into a benchmark artifact.
6. Create direct rows for every callable operation on each required instantiation.

Examples:

```text
func<int>(int)
func<float>(float)
func<double>(double)
func<ProjectType>(ProjectType)
Container<int, 16>::insert(int)
Container<int, 4096>::insert(int)
Container<ProjectType, CustomAllocator>::erase(...)
```

Do not describe an uninstantiated template definition as benchmarked.
Creating an exploratory benchmark-only instantiation must not recursively
expand the production coverage denominator. Report exploratory results, but
only a versioned scope-manifest change can promote them to required coverage.

### 3.4 Classes and callable object state

A class itself is not one timed operation. Benchmark every executable class
operation separately, including construction, destruction, copy, move,
assignment, public/internal methods, static methods, operators, and callable
object invocation.

“Executable class operation” means a source-defined or emitted operation with
observable work in the declared scope. A deleted, abstract, trivial/defaulted,
fully elided, or non-emitted language-semantic operation may be a reviewed
non-runtime terminal when the inventory proves it has no independently timed
body. An optional row measuring generic language/harness semantics is labeled
as such and cannot satisfy an absent production callable identity.

Create distinct object-state fixtures where relevant:

- Default constructed.
- Empty.
- Small populated.
- Medium populated.
- Large populated.
- Maximum supported valid state.
- Moved-from but valid.
- Cache-warm and cache-displaced.
- Shared and unshared ownership.
- Success, failure, and uncommon internal state.
- Each supported policy, allocator, template parameter, and runtime mode.

Artificial class or template versions must not be invented merely to increase
row count. Each version must represent a real supported type, state,
configuration, implementation, or evidence-backed workload.

### 3.5 Dead, private, static, and disabled code

Existing production call sites are not required. If an executable callable is
otherwise unused, the benchmark harness must still call it directly.

- Reach file-static functions through a benchmark companion translation unit,
  approved source inclusion, or another legal test seam.
- Reach private members through approved friend/test access or a reviewed
  adapter that preserves production behavior.
- Compile disabled features into isolated all-feature or feature-specific
  benchmark artifacts.
- Instantiate buildable template definitions deliberately.
- Build mutually exclusive configurations in separate executables.
- Build architecture variants separately and runtime-gate execution on
  compatible hardware.
- Preserve duplicate complete identities by configuration and object ownership.

If a callable cannot yet be invoked safely, it remains a failing coverage item.
`unreachable`, `owning_path`, `indirectly_exercised`, and
`configuration_disabled` are informative states, not acceptable substitutes
for a direct record in the completed suite.

---

## 4. Component and dependency scope

Maintain authoritative `micro_benchmarks/shipping_components.json` plus
`shipping_components.tsv` as its deterministic projection:

```text
schema_version ␉ component ␉ parent ␉ source_path ␉ artifact ␉ configuration ␉ language ␉ status ␉ revision ␉ reason
```

Keep an authoritative JSON companion and encode this projection with the TSV
dialect defined in Section 5. The visible `␉` glyph above denotes one actual
U+0009 tab in the serialized header.

The component audit must verify:

1. Every project source root is classified.
2. Every top-level and nested third-party source tree is classified.
3. Every linked, embedded, generated, transpiled, or interpreted component has
   an owning source path and artifact/runtime module.
4. Every non-platform dependency is pinned to an immutable revision.
5. Missing vendored source, configure-time downloads, and unapproved system
   fallbacks fail the audit.
6. Every configuration-disabled product component has a named benchmark-only
   build that enables it.
7. Tests, examples, fuzzers, tools, and nonshipping code are explicitly
   classified rather than disappearing from scope.
8. Every component's callable inventory reconciles source definitions with
   emitted identities.

The benchmark denominator contains every executable callable in the requested
project, third-party, nested-dependency, and benchmark-only configurations.

---

## 5. Direct coverage manifest

Coverage needs separate authoring and runtime ledgers. Maintain at least:

```text
ALL_FUNCTIONS.md                    raw get-all-functions catalogue intake
catalogue_import.json               one lossless normalized record per raw row
catalogue_boundary.json             immutable target/infrastructure/build classification
catalogue_scan_coverage.json        declared included files -> scanner/supplement representation
catalogue_definition_coverage.json  per-file language oracle -> emitted callable definitions
callable_catalogue.json             canonical eligible callables and expansion parents
catalogue_exclusions.json           per-record no-EID syntax and out-of-boundary exclusions
catalogue_gaps.json                 unresolved parse/classification/definition records; strict-empty
catalogue_import_audit.json          raw/imported/classified/expanded/unresolved conservation
compiled_source_coverage.json       hash-bound compiled records -> canonical EIDs
fixture_manifest.json               EID -> fixture identity -> expected operations
callable_coverage.json              authoritative authoring disposition and required operation IDs
callable_coverage.tsv               deterministic human/tooling projection of that JSON
terminal_evidence.json              reviewed proof records for non-executable EIDs
operation_ownership.json             required/applicable operations -> sole executable owner
entity_runtime_report.json          expected operations -> successful measurements
entity_runtime_report.tsv           deterministic projection of the runtime report
```

The runtime-report names in this authoring overview are logical artifact names;
persist each run's copies below `runs/{run_id}/` as required by Section 13.

The authoring ledger assigns exactly one disposition to every EID:

| Disposition | Meaning |
| --- | --- |
| `authored` | The reviewed required-operation matrix is closed and every applicable required operation has an owned fixture/row ready for registration |
| `terminal` | Reviewed evidence proves there is no executable runtime operation to time in this scope |
| `gap` | Required authoring is absent, ambiguous, invalid, or failed |

`terminal` is restricted to declarations without bodies, deleted operations,
abstract operations without concrete bodies, or callable toolchain fragments
without an independently valid ABI. Enum/type-only definitions, macros, and
other non-callable syntax remain catalogue-only exclusion records with no EID;
a configuration outside the finite matrix remains a reviewed scope exclusion,
not a terminal callable. A terminal may not be used for a difficult
private function, an owning path, a failed fixture, or a callable that merely
lacks a production caller. Terminal rows retain reviewer, reason, source hash,
and evidence. They receive `null` timing and are excluded from the executable
runtime denominator.

Maintain `micro_benchmarks/callable_coverage.json` as the versioned authoring
join for every callable catalogue identity, including reviewed non-runtime
entries. Catalogue-only macro records remain in the separate exclusion audit. A
scope freezes it by hash; publish `callable_coverage.tsv` as its deterministic
projection:

```text
schema_version ␉ eid ␉ catalogue_id ␉ component ␉ configuration ␉ signature ␉ kind ␉ source_location ␉ executable_status ␉ authoring_disposition ␉ subject_provenance ␉ fixture_ids ␉ required_operation_ids ␉ reason
```

Allowed `executable_status` values:

- `executable`
- `declaration_only`
- `deleted`
- `abstract_without_concrete_body`
- `toolchain_generated_not_independently_invocable`

Do not write build, registration, or timing results back into this authoring
ledger. Derive them per operation in `entity_runtime_report.json` and publish
this exact column order in its `entity_runtime_report.tsv` companion:

```text
schema_version ␉ scope_id ␉ resolved_scope_key ␉ selection_id ␉ measurement_plan_id ␉ eid ␉ operation_id ␉ producer ␉ build_status ␉ registration_status ␉ execution_status ␉ expected_samples ␉ completed_samples ␉ reason
```

The visible `␉` glyphs in these column-order examples denote actual U+0009
tabs in serialized headers; the glyph itself never appears in a TSV artifact.

JSON is authoritative for strict checks. Any TSV named by this contract is a
deterministic projection with this exact dialect: UTF-8 without BOM, LF record
terminators, one unquoted ASCII header row, and U+0009 tab separators. Every
data cell is canonical JSON, including strings; null is `null`, lists are JSON
arrays, and embedded tabs/newlines are JSON escapes. Preserve order when a list
is semantic and sort set-valued lists by normalized UTF-8 bytes. Sort rows by
the artifact schema's declared stable key. Every row starts with
`schema_version`; reject a TSV whose companion JSON hash, row count, schema, or
stable-key set differs.

`operation_ownership.json` is authoritative for execution planning. Each record
contains schema, human `scope_id` plus a pre-resolution scope-definition hash,
operation-manifest ID, EID, operation ID,
required/inapplicable/exploratory/gap decision, `suite_role`, `row_role`, fixture identity,
input/regime/configuration IDs, owner fields, accepted subject provenance,
required identity/count evidence, an optional stable
`measurement_requirement_class`, and reason or review evidence. Treat
disposition as a tagged union: `required` has exactly one owner
producer/module/row; `exploratory` has zero or one owner but never enters the
denominator; `inapplicable` has null owner/row plus reviewed proof; and `gap` may
lack an owner and always fails strict authoring. Hash the canonical manifest,
publish that hash in the adapter, and reject a required operation with no owner,
any multiple owner, unknown owned row, or scope operation absent from the
manifest.

The ownership manifest never embeds the final `resolved_scope_key`: the
resolver hashes ownership into that key, so embedding the result would be
self-referential. After resolution, run membership and reports record the join
between the ownership-manifest hash and the resulting scope key.

Use independent state fields. At minimum, `build_status` distinguishes
`pending|succeeded|failed`, `registration_status` distinguishes
`pending|matched|missing`, and `execution_status` distinguishes
`unselected|pending|measured|partially_measured|failed|timed_out|skipped|unsupported`.
A registration that has no expected operation cannot inhabit that per-operation
record. Put it in `unmatched_registrations.json` with actual row ID, module,
producer, row role, native name, discovered subject facets, and join-failure
reason; any entry fails strict registration reconciliation.

Map sample states deterministically. All required successful samples yield
`measured`. Some successes plus any missing/unsuccessful sample yield
`partially_measured`. With no success, a failed launch yields `failed`, a
deadline yields `timed_out`, an explicit non-capability skip yields `skipped`,
and a schema-valid capability verdict yields `unsupported`. `skipped` and
`unsupported` never satisfy runtime completion; the latter can be reused only
as the separately keyed capability verdict described in Section 11.4.
A callable satisfies executable runtime coverage only when every required
operation is `build=succeeded`, `registration=matched`, and
`execution=measured` with the required sample count and qualifying evidence.
That requires:

- At least one exact registered row.
- A direct invocation inside the timed benchmark loop.
- A verified exact target-call count.
- Successful execution and a readable raw result.
- Structured input metadata.
- Required wall/CPU timing plus explicit unavailable metadata for capability-
  gated clocks.
- Actual iterations and raw repetitions.

Keep these completion statements distinct:

| Statement | Required proof |
| --- | --- |
| `inventory_reconciled(resolved_scope_key)` | The bound catalogue-completeness proof has zero import, file-scan, language-definition, supplement, partition, and join gaps, and normalized catalogue records, compiled records, aliases, configurations, and EIDs conserve exactly within that immutable scope |
| `authoring_complete(resolved_scope_key)` | Every EID is `authored` or reviewed `terminal`, the reviewed operation matrix is closed, `eid_gap_count = 0`, `operation_gap_count = 0`, and every required operation has exactly one owner |
| `selected_subject_rows_complete(selection_id, measurement_plan_id)` | Every selected callable operation and non-callable pipeline subject/phase row satisfied the plan |
| `selected_operations_complete(selection_id, measurement_plan_id)` | Every selected operation has the plan's required successful samples and passes |
| `runtime_complete(resolved_scope_key, measurement_plan_id)` | The plan is explicitly `runtime_completion_eligible`, and every required operation for every executable EID satisfied it |
| `cross_platform_complete(resolved_scope_key, measurement_plan_id)` | The resolved scope is a union, the plan is explicitly `cross_platform_completion_eligible`, and every declared configuration and hardware-only row in the immutable union satisfied it on compatible machines |

A path, kind, EID, module, or limit filter may make
`selected_subject_rows_complete(selection_id, measurement_plan_id)=true`; its
callable projection may also make
`selected_operations_complete(selection_id, measurement_plan_id)=true`. Neither
can make whole-scope
`runtime_complete(resolved_scope_key, measurement_plan_id)=true`. Reports must
show human scope/union IDs, immutable keys, measurement-plan IDs, full-scope
counts, and selected counts side by side.

Every measurement plan contains immutable booleans
`runtime_completion_eligible` and `cross_platform_completion_eligible` plus the
reviewed criteria that justify them. Quick/smoke and ordinary comparison plans
set both false. Completing every selected row under such a plan may make the
selected execution predicates true, but it cannot make a runtime or cross-
platform completion predicate true. The runner cannot override these plan
properties at the command line.

A full `runtime_complete` or `cross_platform_complete` claim requires:

```text
catalogue_parse_or_reconciliation_gap = 0
catalogue_raw_gap = 0
catalogue_definition_gap = 0
catalogue_source_file_scan_gap = 0
catalogue_definition_coverage_gap = 0
catalogue_partition_gap = 0
scope_partition_gap = 0
runtime_completion_plan_ineligible = 0        # for runtime_complete
cross_platform_completion_plan_ineligible = 0 # for cross_platform_complete
eid_authoring_gap = 0
operation_authoring_gap = 0
required_operation_without_owner = 0
build_failed = 0
registration_missing_or_unexpected = 0
execution_failed_or_timed_out = 0
partially_measured = 0
missing_required_samples = 0
missing_required_passes_or_metrics = 0
timer_floor_or_quality_gate_failed = 0
```

It also requires unique operation ownership, expected-row to registration
equality, readable complete raw repetitions, and a final
runtime report whose missing and partially measured operation counts are zero.
Static authoring counts must always be labeled as authoring counts; they are not
claims that timing has run.

Hardware-incompatible ISA rows may be reported as `unsupported`, but their benchmark artifacts and
registrations must exist. They must execute and receive timings on compatible
hardware before cross-platform exhaustive coverage is claimed.

---

## 6. Typed input-case design

Every directly benchmarked callable must have an explicit input-case table.
Each case receives a stable `input_case_id` and structured metadata.

### 6.1 Required input metadata

Record, where applicable:

```text
input type and complete type parameters
serialization or format
element count
byte count
dimensions and shape
value/content distribution
validity and expected outcome
small/medium/large/boundary classification
domain-specific mode
object state
ownership and allocation policy
cache state
temperature
thread count
ISA/implementation
fixture source and provenance
fixture checksum or generator seed
```

### 6.2 Size and boundary cases

For sized input, include every relevant class:

- Empty and zero-length where valid.
- Singleton.
- Tiny call-overhead-dominated input.
- Vector width minus one, exact width, and width plus one.
- Block/chunk/page boundary minus one, exact boundary, and plus one.
- L1-, L2-, and last-level-cache-scale inputs.
- Larger-than-cache input.
- Typical production input.
- Large valid input.
- Maximum supported or safely practical valid input.
- Every algorithm, representation, allocation, and dispatch threshold.

Geometric sweeps may supplement but never replace exact semantic boundaries.

### 6.3 Content and outcome cases

Include relevant content classes:

- Empty, zero, uniform, sparse, and dense.
- Sorted, reverse sorted, random, repeated, and adversarial.
- Compressible and incompressible.
- Transparent, opaque, partially transparent, gradient, photographic, and
  high-frequency imagery.
- Valid common input.
- Valid uncommon input.
- Invalid input.
- Truncated input at distinct structural boundaries.
- Early success, late success, early failure, and late failure.
- Cache hit, cache miss, fast path, slow path, fallback, and recovery.
- Scalar/vector tails and alignment classes.

Do not feed unsafe fabricated state into internal functions. Construct valid
state through reviewed fixtures or production initialization paths, pause timing,
and then invoke the exact target directly in the measured loop.

### 6.4 Evidence-backed fixture research

Research each callable or callable family before finalizing its cases. Consult,
in priority order:

1. Local production call sites and observed production data shapes.
2. Local tests, fuzz seeds, specifications, bug reports, and corpus files.
3. Upstream official documentation and upstream tests.
4. Published standards and conformance suites.
5. Maintainer documentation and primary technical sources found through web
   research.

Record source URLs, document versions, access dates, local file references, and
the reasoning connecting each researched workload to a benchmark case. Pin or
generate fixtures locally so normal benchmark execution never depends on live
network content. Community posts and synthetic examples may suggest additional
cases but cannot be the sole justification for calling an input representative.
Before copying any fixture, corpus, or source fragment, record copyright owner,
SPDX/license text, source URL/revision, modifications, and redistribution basis;
reject material whose use or redistribution is not authorized.

### 6.5 Fixture and operation contract

Separate reusable state from callable ownership. A `fixture_state` recipe may
construct shared class/object/input state and may be referenced by bindings for
several EIDs. A per-EID `fixture_binding` belongs to exactly one canonical EID,
and every operation in that binding invokes that same EID; lifecycle methods,
other methods, and concrete template instantiations have their own EID bindings.
Setup may call other helpers outside timing without claiming their coverage. No
operation may be owned by two EIDs. A portable binding record resembles:

```json
{
  "schema_version": "fixture/1",
  "schema_revision": "1.0.0",
  "eid": "<STABLE_EID>",
  "target": "<COMPLETE_SIGNATURE_OR_OWNER_OPERATION>",
  "language": "cpp",
  "subject_provenance": "production_linked",
  "source": "${REPO}/src/example.cpp",
  "source_sha256": "<SHA256>",
  "source_coordinate": {"line": 120, "column": 1, "ordinal": 0},
  "fixture_state_id": "<FIXTURE_STATE_ID>",
  "fixture_source": "${SUITE}/entities/fixtures/example.cpp",
  "fixture_dependencies": ["${REPO}/include/example.h"],
  "compile_flags": ["<PRODUCTION_COMPATIBLE_FLAGS>"],
  "link_artifacts": ["${REPO}/<PRODUCTION_ARTIFACT>"],
  "setup": "construct through the production factory outside timing",
  "correctness_oracle": "checksum equals <EXPECTED>",
  "target_identity_evidence_required": "runtime_entry_verified",
  "target_call_count_evidence_required": "runtime_exact_count",
  "operations": [
    {
      "operation_id": "<STABLE_OPERATION_ID>",
      "row_role": "subject",
      "name": "invoke/small/warmed/hot",
      "expected_row": "entity/<EID>/invoke/small/warmed/hot",
      "input_case_id": "small-valid-1",
      "declared_root_target_calls_per_state_iteration": 1,
      "regime": {"temperature": "warmed", "cache": "hot"}
    }
  ]
}
```

Hash the normalized binding, a versioned fixture-relevant adapter projection,
referenced fixture-state recipe, fixture source closure, compiler command, linked
artifacts, runtime inputs, and expected operation set into `fixture_identity`.
That projection includes only build/language/provider behavior needed to create
and invoke the fixture; it excludes fixture identities, authoring/ownership
manifest hashes, resolved-scope/selection keys, output paths, and run state, so
the fixture and ownership manifests cannot hash each other recursively.
For source inclusion or private/static companions, hash the exact included
source and declarations as well. For lambdas, preserve enclosing function,
source coordinate, ordinal among sibling closures, capture shape, and whether
the fixture invokes the production closure or a clearly labeled redeclaration.
For templates, bind every row to a concrete instantiation discovered from a
production artifact or justified by the declared supported-type contract.

Freeze a versioned operation-set manifest before an exhaustive run. For every
candidate operation/input/regime combination record one decision:

- `required`: belongs to the named scope and must register and complete.
- `inapplicable`: the callable contract proves the axis has no meaning; retain
  the reviewed reason and evidence.
- `exploratory`: useful measurement outside the current completion denominator.
- `gap`: required but not yet authored or valid; strict preflight fails.

A temporary waiver remains a gap unless it changes the reviewed scope itself.
Hash this manifest into registration, execution, and resume identities. This
closes the meaning of “every relevant input and regime” for a run and prevents
new exploratory rows from silently changing an in-progress denominator.

Every registration also has `row_role: subject|floor|diagnostic`. Only
`subject` rows may own a required EID operation or satisfy direct coverage.
`floor` rows measure harness/adapter cost, and `diagnostic` rows provide
comparisons, owning paths, or instrumentation. Freeze the expected subject set
and expected auxiliary set separately. Registration equality requires their
union to match exactly, while runtime completion evaluates only required
subject rows. An unexpected floor/diagnostic row still fails registration
reconciliation; it can never fill a missing subject row.

Fixture setup, teardown, input generation, cache displacement, and correctness
checks occur outside timing unless a separately named operation intentionally
measures them. Every measured iteration consumes observable output through an
optimizer barrier or validated state transition. Floor rows measure harness or
adapter cost separately; never subtract a noisy floor from subject timing and
never include floor rows in hotspot rankings.

Before timing, run fixtures in validation builds with applicable assertions,
sanitizers, deterministic oracles, and bounded timeouts. Validation timing is
not performance evidence. Persist seeds, generator versions, input hashes,
expected outcomes, and the source of any simulated state.

---

## 7. Execution regimes

For every callable, declare which regimes are relevant and create separate
direct rows for every relevant value:

- Cold start and warmed steady state.
- Allocation included and allocation excluded where the API permits reuse.
- Hot cache and cache displaced.
- Single-threaded and each safe representative multithreaded mode.
- Success, failure, truncated, and uncommon branches.
- Fast path, general path, fallback, and recovery.
- Aligned and relevant misaligned inputs.
- Scalar and every compiled ISA implementation.
- Runtime dispatch plus its verified selected implementation.
- Small, medium, large, maximum, and every behavior-changing boundary.

Do not generate a meaningless Cartesian product. The callable's input-case
table must justify applicable combinations, and the regime audit must fail when
any justified case lacks a direct row.

Cold-start rows must run in fresh processes. Cache displacement occurs outside
the timed interval unless eviction itself is the target callable. Unsupported
ISA implementations are registered but skipped safely on incompatible machines.

---

## 8. Measurement correctness

### 8.1 Timed boundary

Every row documents what is inside and outside timing. Normally place fixture
creation, research-derived input loading, correctness validation, cache
displacement, and unrelated setup outside timing. Include allocation,
initialization, parsing, or teardown only in explicitly named rows that measure
those operations.

### 8.2 Call verification

Every row must prove the exact target was called the declared number of times.
Use a mechanism appropriate to the language and optimization model, such as:

- A reviewed direct call in the benchmark loop plus a target-owned counter in
  an instrumentation build.
- A link-time or symbol-bound adapter tied to the complete identity.
- Runtime tracing or call-boundary instrumentation outside the production
  measurement build, reconciled with the measurement row.
- Output state that proves every invocation occurred when counters would
  materially distort the measurement.

Verification instrumentation must not silently contaminate the final timing.
When verification and timing require separate builds, record both build IDs and
prove through a versioned equivalence manifest that their source EID,
production compiled-target mapping, configuration, fixture, dispatch, and
relevant control flow correspond. Their pass binary hashes are expected to
differ.

Every callable measurement records `subject_provenance`:

| Provenance | What it measures | Coverage claim |
| --- | --- | --- |
| `production_linked` | Exact callable from the production artifact | Source EID and compiled record when identity proof passes |
| `source_included` | Exact hash-bound production source compiled into a companion | Source EID; compiled-production identity only with separately matched binary evidence |
| `source_extracted` | Reviewed exact body/declarations compiled in an adapter | Source-expression EID only; record extraction and semantic-equivalence evidence |
| `redeclared` | A reconstructed lambda/template/expression | Exploratory or source-expression claim only when the scope explicitly defines that identity |
| `proxy` or `owning_path` | Parent API, alias, or behaviorally related route | Diagnostic; never exact child coverage |

Source inclusion, extraction, and redeclaration create new machine code. Do not
silently call them the exact production compiled record. Bind them to source
hashes and production flags, retain their limitations, and use a matched
production-path profile when binary behavior matters.

### 8.3 Matched timing and verification passes

Use two reconcilable executions when exact call counts, worker lineage,
allocation, syscalls, object lifetimes, or lower-level edges would materially
disturb timing:

1. A production-like timing pass with only the clocks, barriers, output checks,
   and requested timed-boundary counters needed for trustworthy measurements.
2. A matched verification/attribution pass with exact function-entry counts,
   branch evidence, arguments or byte counts, allocator/object hooks, syscall
   tracing, and parent/worker lineage.

The second pass explains the first; its timings never replace the production-
like timing. Reconcile configuration, source EID, production compiled-target
mapping, fixture and input hashes, output checksum, selected dispatch target,
operation ID, relevant control flow, and actual framework-iteration semantics.
Keep each pass's binary/tool hashes separate. Reject an unexplained target or
control-flow difference; do not reject an expected bytewise binary difference
caused solely by declared instrumentation.

Never copy a verification pass's raw entry total into a timing repetition.
Instrumentation may change calibration, and the two passes may have different
actual State-iteration totals or batch overshoot. For constant multiplicity,
prove root target calls per framework-counted State iteration in the verification
pass and compute the timing denominator from that multiplicity times the timing
pass's own `framework_iterations_total` (or its per-thread vector). Alternatively
pin and verify the identical per-thread iteration schedule in both passes. A
data-dependent multiplicity requires in-band evidence or a timing-pass output
bijection; a count observed only in a differently calibrated sidecar cannot
provide the timing denominator.

Every execution declares `pass_kind` (`timing`, `verification`, `attribution`,
`hardware_counter`, `validation`, or another registered kind), unique `pass_id`,
its own binary/native-result hashes and environment fingerprint, and a shared
`reconciliation_key`. Store pass outputs as linked records. Do not copy sidecar
counters into a timing repetition in a way that implies they were measured
simultaneously or with the same overhead.

Adding a separate hardware/attribution sidecar preserves the clean timing
`measurement_key`. Enabling counters or hooks inside the timed launch can alter
calibration and overhead, so it creates a distinct timing measurement/cohort
whose key includes the in-band instrumentation and event set. Never merge that
timing with the no-counter base or imply the sidecar was simultaneous.

For targets that create threads, tasks, callbacks, asynchronous work, or child
processes, keep instrumentation active through descendants and completion.
Record parent/child or submitter/executor identity, per-worker callable counts,
thread CPU, process CPU, queue/execution/wait phases, and join/drain/fence proof.
Every observed worker callable still needs its own direct fixture and timing.

### 8.4 Compiler and runtime controls

- Match production optimization, LTO, floating-point, exception, RTTI, and
  architecture flags.
- Prevent dead-code and dead-store elimination.
- Preserve required inlining behavior in the production-like row.
- Add an explicitly labeled forced-call-boundary row when a non-inlined cost is
  also useful.
- Record when a callable was fully inlined or cloned in production.
- Record JIT warmup, tier, deoptimization, garbage collection, and runtime
  compilation for managed and dynamic languages.
- Verify deterministic fixture generation with checksums or seeds.

### 8.5 Timing overhead

Measure and report empty-harness and adapter overhead by language and call
shape. Increase batching when the target approaches timer overhead. Do not
blindly subtract overhead when doing so could produce unstable or negative
times; retain both raw and normalized results and explain the normalization.
For pause/resume timing, record active-slice count and the clock-pair overhead
and resolution per slice. A large sum of many individually sub-floor slices is
not equivalent to one well-resolved batch and fails the adequacy gate unless a
validated timer method supports that pattern.

---

## 9. Required metrics

Every direct record requires:

- Wall time and reported real time with timing provenance.
- Calling-thread user, system, and total CPU time where the platform exposes them.
- Independent calling-thread CPU time.
- Process-wide user, system, and total CPU time where available.
- Worker CPU sum and per-thread timing when workers participate.
- Completion latency for a dedicated, individually bracketed latency row;
  otherwise a registered null/inapplicable value with reason.
- Actual iterations.
- Root target calls per iteration, count scope, evidence level, and denominator source.
- Total root target calls plus recursive/reentrant entry counts, labeled verified
  only at a qualifying evidence level.
- Wall, calling-thread, process, and independent-thread CPU time per target call.
- Amortized time and batch size, plus observed batch latency only when it was
  individually bracketed.
- Explicit items/bytes per target call and per State iteration where applicable.
- Repetition count.
- Mean, median, minimum, maximum, standard deviation, coefficient of variation,
  and configured percentiles.
- Timer source, resolution, floor/adequacy verdict, scope, and sample count.
- Every available duration serialized in ns, us, and ms.

Record where applicable:

- Items and bytes processed.
- Items and bytes per second.
- TSC/reference ticks, labeled separately from CPU cycles.
- Hardware CPU cycles and instructions.
- Instructions per cycle.
- Cache references and misses by available level.
- Branches and branch misses.
- Minor and major page faults.
- Context switches and migrations.
- Frontend and backend stall indicators with honest labels.
- Allocation count, allocated bytes, freed bytes, and peak live bytes.
- Peak resident memory.
- Lock contention and scheduler delay.
- Energy or accelerator metrics when available.
- Host submission, device execution, completion, transfer, and fence-wait
  clocks for device work, with clock domain and synchronization method.

Missing metrics are `null` with an availability reason, never zero. Hardware
counters must identify whether their scope is the exact target batch, the whole
benchmark process, or a sampled interval. Each counter also records PMU/event
name and encoding, privilege mask, raw versus kernel/tool-scaled value,
`time_enabled`, `time_running`, `running_fraction`, start/end CPU and a
evidence-qualified migration verdict,
collection method, and pass key.

Define `running_fraction = time_running / time_enabled`, bounded by
`0 < running_fraction <= 1`; the multiplex scale factor is its inverse. Reject zero,
negative, nonfinite, or directionally inconsistent clock values. Do not expose
an ambiguous field named only `multiplex_ratio`. A measurement plan states its
minimum admissible running fraction.

Preserve the independently read raw sample total and any multiplex-scaled total
as separate metrics. A scaled value is a derived estimate, never `measured`.
Generic comparison fields such as `cpu_cycles_per_iteration`,
`instructions_per_iteration`, and their per-call forms derive from the scaled
total only when `time_running > 0`, scaling is finite, and the measurement plan's
minimum-running-fraction threshold passes. Publish explicitly named raw per-
iteration/per-call values when useful. If scaling is unavailable or rejected,
leave the generic comparison value null with reason rather than silently using
an undercounted raw value.

---

## 10. End-to-end companions

Keep end-to-end benchmarks for every major product operation, including load,
decode, parse, first result/frame, subsequent result/frame, seek, loop, resize,
render, transform, serialize, peak memory, supported threading, and full-pipe
throughput.

End-to-end rows do not satisfy direct callable coverage. They provide real-world
call frequency and user-visible impact. Reports should join direct per-call
cost with observed end-to-end call count:

```text
estimated contribution = direct cost per call * observed calls
```

Label that result as an estimate. Confirm important improvements with an actual
end-to-end before/after measurement.

---

## 11. Runner requirements

Provide one runner that:

- Discovers every benchmark module and language adapter.
- Lists exact callable IDs, signatures, input cases, and row names before timing.
- Runs performance-sensitive rows sequentially by default.
- Shows `tqdm` progress by module, callable, input case, row, and repetition.
- Shows elapsed time, completed/total direct callables, failures, and ETA.
- Supports exact callable, component, configuration, language, and input filters.
- Supports fixed iterations and calibrated minimum-time operation.
- Supports raw repetition preservation.
- Supports CPU affinity and controlled environment metadata.
- Supports row and module timeouts.
- Writes each completed row incrementally and atomically.
- Resumes without repeating valid completed rows.
- Runs cold rows in fresh processes.
- Runs exact-row hardware-counter passes separately where required.
- Never silently changes input cases or coverage based on a quick preset.
- Produces machine-readable and human-readable reports.

Quick modes may reduce repetitions or minimum time for validation, but they do
not constitute a complete performance run. Full completion mode executes every
required registered direct callable/input/regime row and every required pass,
then retains all raw repetitions. Exploratory operations are outside `O` and
run only through the explicit `include_exploratory` selector; when selected,
all matching exploratory rows execute and report normally but cannot satisfy or
block a scope completion predicate. A required relevant case can never be
reclassified as exploratory merely to shorten a run.

### 11.1 Result producers and reconciliation

The runner may use different build strategies, but every record names its
producer. Treat `suite`, `producer`, and `subject.kind` as independent axes: a
pipeline is a subject with `suite_role: pipeline` selected from curated workloads, not a producer by
definition, while foreign and device subjects may be emitted by a general
producer or by optional specialized producers declared in the adapter.

| Producer | Typical use |
| --- | --- |
| `curated_workload` | Handwritten modules with rich domain input sweeps |
| `generated_independent` | Pre-generated direct/companion binaries for simple or file-local identities |
| `dynamic_entities` | Per-EID binaries assembled from explicit fixture metadata |
| `foreign_runtime` | Optional launcher for interpreted, managed, or FFI subjects |
| `device_runtime` | Optional launcher for shader, accelerator, or device-kernel subjects |

The checked-in adapter publishes the allowed producer enumeration and rejects
unknown values. Omit or set an optional producer to null when its subjects flow
through another declared backend. Do not infer producer from suite name,
module prefix, language, or `subject.kind`.

All producers converge on the same operation identity and normalized result
envelope. If generated and dynamic producers cover different operations of the
same EID, reconcile their union in the final entity report. Reject duplicate
operation ownership, mismatched source identity, mismatched fixture identity,
or conflicting successful measurements. A curated or pipeline alias can remain
useful diagnostic evidence, but it cannot impersonate an independently owned
entity operation.

Freeze an operation-ownership manifest before generation. A curated row may be
the authoritative callable measurement only when it owns the exact EID and
operation ID with qualifying identity/call-count evidence; entity generation
then suppresses that same operation. The `entities` suite planner must still
select the operation and dispatch it to that curated owner. Its final report
merges qualifying owners from every producer. Otherwise the curated row is
diagnostic. Pipeline subjects never own callable operations. The `all` planner
deduplicates an operation already selected through the curated population by
its exact measurement key; it may reuse the one result but may not count or run
the operation twice.

### 11.2 One strict-completion authority per suite

Every run manifest records `strict_completion_authority` and its prerequisite
audits. Apply policies by suite and phase rather than running every historical
coverage gate against every producer.

| Suite | Preflight | Final authority |
| --- | --- | --- |
| `workloads` | Curated exact-row, fixture, and registration audits | Tagged workload `suite_runtime_report.json` |
| `pipelines` | Expected pipeline phase/regime registration audit | Tagged pipeline `suite_runtime_report.json`; never callable coverage |
| `entities` | Hash-bound compiled-source audit with zero authoring gaps | Final EID-operation report after every qualifying operation-owner producer is merged |
| `all` | Entity preflight before any timing, plus phase-local checks | Combined `suite_runtime_report.json` over referenced phase authorities; entity completion is decided only by the final merged EID-operation report |

Persist each final authority beneath its `runs/{run_id}/` directory as specified
in Section 13. A mutable top-level projection may display the latest run but
cannot replace the historical bytes referenced by an older manifest.

Every `suite_runtime_report.json` uses a versioned schema and records the suite,
resolved-scope key, selection ID, measurement-plan ID, expected and completed
subject/auxiliary row sets, required and completed sample/pass counts, failures,
selection-membership and planning-index hashes, referenced phase-authority
hashes, and the appropriate scoped completion
predicate. Its rows retain their tagged callable, pipeline, or auxiliary
subject. The entity report remains the callable operation authority; the
combined report references and verifies it rather than reinterpreting its EID
statuses.

Older symbol, owning-path, or source-name reports may remain strict mapping
validators for the phase they describe. In a compiled-scope entity or combined
run they are diagnostic unless explicitly named as authority. They cannot fail
or complete unrelated generated operations. Likewise, a phase-local report
cannot declare the global EID population complete.

Required strict invariants include:

- Exact raw-import conservation, included-file scan coverage, and per-language
  completeness-oracle definition coverage, with no unpartitioned record.
- Every in-boundary executable EID belongs to at least one declared atomic
  scope and to the reviewed exhaustive scope union; scope-partition gaps are zero.
- Compiled-record, source-association, category, and disposition conservation.
- Unique EIDs and unique operation ownership.
- Exact source coordinate/signature joins or an explicit reviewed relocation.
- Complete hashes for production artifacts, compile dependencies, generated
  sources, fixtures, and manifests.
- `authored + terminal + gap = in_scope`, with zero EID gaps, zero required-
  operation gaps, and one qualifying owner for every required operation.
- Lifecycle operations for every authored class and the required concrete
  instantiations for every authored template.
- Expected subject and auxiliary row sets exactly equal role-tagged untimed
  registrations.
- Every selected expected operation has all required successful raw samples.
- No missing, partially measured, failed, timed-out, or corrupt selected row.
- Positive subject iterations, finite required clocks, explicit timing scope,
  and explicit target-call evidence.

### 11.3 Ordered lifecycle

Invoke only action IDs declared through the adapter's `suite-command/1`
protocol. Complete these stages in order:

1. Invoke every production-build action required by the named scope. Verify the
   declared output/module graphs and retain every generated product source or
   executable entry.
2. From the repository root invoke the adapter action with the explicit
   `get-all-functions --root <PROJECT_ROOT> --output <PROJECT_ROOT>/ALL_FUNCTIONS.md`
   argv. Hash the output, populate the import,
   boundary, exclusion, scan-coverage, definition-coverage, and callable
   catalogues, merge any supplemental records found by the declared language
   completeness oracles or needed for scanner-skipped included sources, and
   fail on parse loss, scan/definition-coverage gaps, or a stale source snapshot. Freeze
   these identities only after this post-build import.
3. Invoke inventory refresh, then the separate read-only inventory check. The
   check must fail on stale hashes, conservation errors, invalid terminals,
   missing owners, or authoring gaps. It must not mutate source or committed
   inventory/audit artifacts; its required protocol result and runner-owned
   temporary diagnostics are allowed.
4. Invoke benchmark configure/build and untimed row discovery. Reconcile the
   required subject registrations and auxiliary floor/diagnostic registrations
   against their separately frozen expected sets.
5. Execute an explicitly bounded smoke selection with short timing. Record its
   selection ID and never present it as full-scope completion.
6. Execute the frozen exhaustive operation plan, sequentially by default, with
   strict completion, row isolation, transactional checkpoints, and resume.
7. Invoke report-only actions from committed evidence. Verify that reporting
   launches no benchmark subject and cannot change completion authority.

Stages 1–4 must not execute timed production subjects and must finish before a
long run starts. A timing preset changes duration/repetition policy; it does not
narrow selection. Smoke selection therefore always needs explicit stable row,
operation, module, or EID IDs. Section 19 records the current SGVAN-specific
commands as a non-normative example.

A useful preset contract is:

| Preset | Samples | Timing policy | Claim | Runtime-completion eligible? |
| --- | ---: | --- | --- | --- |
| `quick` | 1 | short calibrated minimum | Wiring and triage only | No |
| `standard` | 3 | moderate calibrated minimum | Local comparison | No |
| `stable` | 7 | long calibrated minimum | Controlled-machine comparison | No, unless a separately reviewed completion plan maps to this name |
| `exhaustive` | 7 or reviewed higher count | Frozen per-row fixed/calibrated policy that passes the timer-floor gate | Full operation-set execution | Yes when its frozen plan passes every required proof/quality criterion |

Each fixture's inner batch, fixed-iteration, or calibration policy must exceed
the measured timer floor. Record requested and actual iterations, including
multithreaded and batched overshoot. Hardware collection uses distinct pass keys
and capability gates; decide the requested pass set before creating a resumable
run. A hardware-row limit is useful for triage. Estimate its cost before
enabling it across the full suite. Report row limits affect presentation only.

### 11.4 Crash-safe row checkpoints and resume identity

Treat one successful `(pass_key, required-sample-group)` as the smallest
evidence commit unit. Run that pass in an isolated process, write native output
to a pass-unique hidden pending file, and parse and validate every raw repetition
required by that pass before committing its normalized samples in one SQLite
transaction. Derive plan-row completion separately only after every pass and
sample required by the selected measurement plan is committed. A failed or
missing verification/counter sidecar therefore leaves an already committed
clean timing pass reusable while the plan row remains incomplete.
The SQLite database is the sole completion authority. The append-only attempt
journal is diagnostic audit evidence and never grants completion. Public module
JSON, TSV, and Markdown are atomically replaced,
regenerable projections; a crash between the database commit and JSON rename
cannot lose completion. A file's existence or a parseable partial JSON document
does not prove completion.

One coordinator owns an exclusive lock for the result directory and is the only
database/manifest writer. Parallel workers may execute rows and write distinct
pending files, then return them to the coordinator for validation and commit.
On startup, acquire the lock, let SQLite recover/roll back incomplete
transactions, reconcile fully valid pending files, append recovery decisions to
the attempt journal, and regenerate public projections from committed rows.

Treat every coordinator invocation, including `--resume`, as a new run with a
new `run_id`. Write its atomically updated manifest, selection membership, and
append-only attempt journal below `runs/{run_id}/`; list prior run IDs in
`resumed_from_run_ids` and credit compatible recovered/reused evidence through
the new membership. Once an invocation exits or is found abandoned, its per-run
files are immutable history; a later invocation never overwrites them. Literal
resolved commands and transport paths live in per-attempt launch-provenance
records in that run directory. A top-level latest-run pointer is disposable
operator convenience and has no completion authority.

Publish a `checkpoint-store/1` schema and transactional migrations beside the
result schemas. The database contains a schema metadata table with major/minor
revision and migration history; immutable planning artifacts and key-material
content hashes; measurement, pass, sample, observation, aggregate, and
capability-verdict tables; pass expected-sample and completion tables; run,
membership-credit, attempt, and authority-reference tables. Enforce full-digest
primary/unique keys, `measurement -> pass -> sample -> observation` foreign
keys, key-material/content-hash foreign keys, unique membership credits, and
foreign-key checks. Insert a pass-completion marker in the same transaction only
after its exact expected sample-key set equals its validated successful sample
set and all native/key material is readable. Derive a plan-row or suite
completion verdict by joining required pass/sample sets; never let a loose row,
attempt, public JSON, or journal entry set it directly. Enable and check foreign
keys and run the database integrity check before resume/report. Apply only known
forward migrations transactionally and preserve a pre-migration backup; reject
unknown/newer major versions, failed migrations, constraint violations, or a
schema revision that lacks an explicit migration.

The base `measurement_key` must bind at least:

```text
versioned blueprint measurement-contract, schema, suite-core, runner, and command-protocol projection hashes
project-adapter exact-row behavior-projection hash and resolved launcher ID/version/executable or source-closure hash
producer adapter, language adapter, and timing-framework identities
producer, module, suite role, row role, tagged subject, operation/auxiliary ID, and expected row
canonical measurement-affecting projection and hash of the exact-row action request
canonical transport-token argv, logical cwd, and effective nonsecret environment digest
row-relevant canonical catalogue-record, callable source, transitive dependency, fixture, and runtime-input hashes
production artifact and benchmark binary hashes/build IDs
compiler and linker commands and configuration identity
input case, seed, regime, declared call shape, and correctness oracle
measurement-policy behavior projection, timer policy, fixed iterations/minimum time, and repetitions
warmup/calibration/probe policy; chunk count/boundaries and active-slice policy
randomized/interleaved schedule seed and order; quiescence policy
adaptive stopping rule/thresholds and regression/slope estimator version
CPU affinity, timing concurrency/granularity policy, and framework clock mode
measurement-environment fingerprint and capability profile
```

Serialize this versioned field map with a published canonical encoding (for
example RFC 8785 canonical JSON), then SHA-256 the resulting bytes. Suite names,
filters, limits, and selection IDs choose rows but do not change an exact row's
measurement, so keep them in the run manifest and run-membership record rather
than the measurement key.
Store the full coordinator request hash in the manifest, but project only the
exact-row behavior fields into `measurement_key`; exclude scope/selection and
presentation metadata from that projection.
The raw `ALL_FUNCTIONS.md` byte hash remains linked provenance; it enters the
measurement key only through a changed row-relevant canonical catalogue record
or exact callable/source dependency closure. Keep the project-wide
`catalogue_semantic_hash` and `catalogue_completeness_proof_key` in the resolved
scope and run membership; an unrelated callable edit cannot invalidate this
row's reusable evidence.
This permits a pipeline row measured through `pipelines` to be reused through
`workloads` or `all`, and permits a focused result to be reused later in a full
selection. Settings that alter contention or the timed row still belong in the
key.

Derive a shared `reconciliation_key` from a tagged subject tuple plus the
configuration, source closure, fixture, input case, regime, dispatch decision,
oracle/output identity, and control-flow revision that must agree across matched
passes. The callable tuple contains the canonical EID, operation ID, and exact
compiled target; the pipeline tuple contains `pipeline_id` and `phase_id`; the
auxiliary tuple contains `auxiliary_row_id`. Inapplicable callable fields must
not be fabricated for pipeline or auxiliary rows. That logical key alone does not prove numerical
comparability. Derive `comparison_cohort_key` from the reconciliation key plus
CPU/device and core class, microcode/driver, governor/frequency/turbo policy,
affinity, runtime/library versions, input/output identity, concurrency, clock
and measurement-boundary scope, plus other declared compatibility axes. The
join also validates each metric pair's method/scope compatibility. Numerical joins require
equal cohort keys or a versioned compatibility predicate that records every
accepted difference. Derive each stable `pass_key` from the base
`measurement_key`, `reconciliation_key`, `pass_kind`, pass-specific binary and
tool versions, requested evidence/counters, canonical pass-specific action-
request behavior projection and hash, canonical transport-token argv/logical
cwd/effective nonsecret environment,
requested iterations, calibration/minimum duration, repetitions,
warmup/probe/chunk/schedule policy, timeout, and environment fingerprint. The
`reconciliation_key` deliberately omits these schedule/collection differences;
it proves logical target equivalence rather than checkpoint equivalence. A
run-local `pass_id` identifies one launch and is not a resume key. Derive each
`sample_key` from `pass_key` and its zero-based requested repetition index using
the byte-level rule in Section 3.2. Verification, attribution, validation, and
hardware executions therefore have separate keys. Upgrading identity/call-count
proof or adding a separate counter pass must not invalidate clean base timing,
and base timing must not impersonate sidecar evidence. In-band counters instead
change the base measurement key as specified in Section 8.3.

The performance environment fingerprint includes CPU model and core class,
microcode, kernel, governor/power plan, turbo/frequency policy, affinity,
relevant runtime and dynamic-library versions, benchmark framework build, and
device/driver identity where applicable. Do not aggregate resumed samples across
different fingerprints. Start a new run/cohort or rerun the affected repetition
group; retain both cohorts for comparison.

Resume may reuse only a complete successful measurement with the same key and
readable native evidence. Missing/corrupt JSON, failed builds, crashes, and
timeouts are retried. A changed binary, source closure, fixture, archive,
configuration, or measurement policy invalidates the affected checkpoint.
Archive stale results for diagnosis instead of silently crediting them.

A deterministic `unsupported` capability verdict is checkpointable only as a
`capability-verdict/1` record under its exact `capability_verdict_key`. Its
preimage binds the tagged row subject/operation or auxiliary ID, capability and
requirement version, relevant adapter/framework/probe behavior projection, and
platform capability fingerprint as defined in Section 3.2. The record preserves
the projection-schema/encoding versions and complete canonical key preimage,
plus probe request/result/native evidence hashes, status, reason, and creation
environment, so a verifier can recompute the key without mutable state. There
is at most one canonical verdict per key; conflicting bytes
fail closed. It remains incomplete for runtime and cross-platform coverage until
a compatible host produces measurement evidence. Store it in the separate
capability-verdict table/cache and content-addressed output, never as a
successful measurement-row checkpoint. A user filter, missing fixture, build
failure, or generic skip is not a capability verdict and is not reusable through
this exception.

On interruption, retain already committed rows and any pending row that can be
fully validated. Record the current row, command, timestamps, return code,
signal, timeout, binary fingerprint, and error in
`runs/{run_id}/manifest.json`. Continue
after ordinary row failures so one bad fixture does not destroy a multi-day
survey; provide an explicit `--fail-fast` development option. Keep an append-
only attempt journal for failures, crashes, timeouts, retries, and stale-row
decisions. Only successful measurement rows become reusable measurement
checkpoints; exact-key deterministic capability verdicts are the separate
non-completing reuse exception above. Define
bounded retry/backoff and maximum-attempt policy so a deterministic crash cannot
loop forever. Never let two coordinators own the same result directory.

---

## 12. Normalized JSON record

Publish JSON Schemas for every artifact kind and version them independently;
for example `project-adapter/1`, `catalogue-import/1`,
`catalogue-boundary/1`, `catalogue-scan-coverage/1`,
`catalogue-definition-coverage/1`, `catalogue-exclusions/1`, `catalogue-gaps/1`,
`catalogue-provider-result/1`, `callable-catalogue/1`,
`catalogue-import-audit/1`,
`compiled-source-coverage/1`, `terminal-evidence/1`, `fixture/1`, `record-index/1`,
`measurement-key-material/1`, `pass-key-material/1`,
`capability-verdict/1`, `suite-command-request/1`, `suite-command-result/1`,
`attempt/1`, `checkpoint-store/1`, `run-manifest/1`,
`run-membership/1`, `run-planning-index/1`, `planning-snapshot/1`,
`measurement/1`, and `aggregate/1`. Reject unknown major versions. Additive
optional fields may advance a minor revision, while changed identity, timing,
or completion meaning requires a new major version and an explicit migration.
The slash suffix names the major compatibility family: `/1` means major version
1, not semantic version 1.0.0. Each schema document and artifact also carries a
`schema_revision` such as `1.2.0`; readers accept only supported additive minor
revisions and never infer a minor version from the slash suffix.

Every producer should normalize each raw repetition to the same envelope. A
`measurement/1` record is immutable reusable evidence, so it contains only
measurement-key/pass/sample-bound subject, behavior, result, and origin
provenance. It does not contain mutable/current `run_id`, suite, scope,
resolved-scope key, selection ID, or measurement-plan ID.

Every measurement record references immutable content-addressed
`measurement-key-material/1` and `pass-key-material/1` records. Each key-material
record contains the complete versioned canonical preimage field map, canonical
encoding identifier, projection-schema versions, and resulting key. The
referencing measurement envelope and record index store the key-material file's
content hash; the file does not attempt to contain its own digest. A verifier
must be able to load those records, recompute the
measurement/pass keys without consulting a mutable run manifest, and confirm
the references in the measurement envelope. Full blueprint/adapter document
hashes and literal launch provenance accompany the projected identity material
but are not silently added to its preimage. Missing or mismatched key material
makes evidence corrupt and ineligible for resume.

Store those planning facts in a separate `run-membership/1` record keyed by
`run_id`, suite, resolved-scope key, selection ID, and measurement-plan ID. It
lists every expected selected subject/auxiliary row and the exact
measurement/pass/sample keys credited to it, whether newly executed or reused,
plus status and rejection reasons. For newly executed evidence it also maps the
run-local `pass_id`, `attempt_id`, and process-launch ID to the stable pass/sample
keys; reused evidence retains its original launch provenance and records the
reuse decision. Its hash is referenced by `runs/{run_id}/manifest.json`
and `runs/{run_id}/{suite}/suite_runtime_report.json`. Reusing evidence through another suite, scope,
selection, plan, or run creates a new membership reference; it never overwrites
the immutable measurement record or relabels its origin.

Membership references every scope, catalogue/completeness, authoring,
ownership, fixture/input/regime, registration, routing, and measurement-plan
artifact through both its hash and immutable content-addressed planning-snapshot
path, and points to the content-addressed primary/supplemental raw catalogue
inputs behind those proofs. A later inventory refresh may replace checked-in authoring copies but
cannot erase the exact denominator or plan credited by an older run.

`subject` is a tagged union. Callable rows use `kind: callable` with an EID and
operation owner in every language and execution domain. A foreign/interpreted
function adds runtime/module facets to that callable identity; a device callable
adds shader/kernel/device facets. Neither may replace its EID or operation ID.
End-to-end rows use `kind: pipeline` with a stable `pipeline_id` and phase ID;
they do not fabricate an EID. Non-callable floor/diagnostic rows use their
auxiliary identity. Compiler, archive, binary, fixture, and per-call fields are
required only when meaningful for that subject kind; inapplicable or unavailable
fields carry a reason rather than a false value.

`row_role` is an independent required discriminator. A `subject` callable row
requires `operation_id` and its ownership join. A `floor` or `diagnostic` row
uses a stable `auxiliary_row_id`, leaves callable coverage fields inapplicable,
and can appear only in the separately frozen auxiliary registration set.

```json
{
  "schema_version": "measurement/1",
  "schema_revision": "1.0.0",
  "producer": "dynamic_entities",
  "pass_kind": "timing",
  "measurement_key": "<SHA256>",
  "pass_key": "<SHA256>",
  "reconciliation_key": "<SHA256>",
  "comparison_cohort_key": "<SHA256>",
  "module": "mb_decoder",
  "suite_role": "entity",
  "subject": {
    "kind": "callable",
    "callable": {
      "eid": "<STABLE_EID>",
      "catalogue_id": "<CATALOGUE_ID>",
      "subject_provenance": "production_linked",
      "target_compiled_record_id": "<COMPILED_RECORD_ID>",
      "associated_compiled_record_ids": ["<COMPILED_RECORD_ID>"],
      "component": "decoder",
      "configuration": "release-avx2",
      "language": "cpp",
      "signature": "Result decode_block(const Input&)",
      "callable_kind": "free_function",
      "source_path": "src/decode.cpp",
      "source_sha256": "<SHA256>",
      "source_line": 120,
      "source_column": 1,
      "definition_ordinal": 0
    }
  },
  "operation_id": "<STABLE_OPERATION_ID>",
  "row_role": "subject",
  "benchmark_row": "entity/<EID>/decode/small/warmed/hot/avx2",
  "measurement_scope": "direct-inclusive",
  "known_callees": ["validate_header(const Header&)"],
  "input": {
    "case_id": "input-small",
    "type": "Input",
    "type_parameters": [],
    "classification": "small",
    "elements": 16,
    "bytes": 4096,
    "shape": [16],
    "content": "valid-common",
    "mode": "default",
    "outcome": "success",
    "fixture": "corpus/sample-a.bin",
    "fixture_sha256": "<SHA256>",
    "provenance": ["<LOCAL_OR_PRIMARY_SOURCE_REFERENCE>"]
  },
  "items_per_target_call": 16,
  "bytes_per_target_call": 4096,
  "items_per_state_iteration": 16,
  "bytes_per_state_iteration": 4096,
  "regime": {
    "temperature": "warmed",
    "allocation": "excluded",
    "cache": "hot",
    "threads": 1,
    "isa": "avx2"
  },
  "sample": {
    "sample_key": "<SHA256>",
    "kind": "raw_repetition",
    "repetition_index": 0,
    "observation_policy_id": "single-chunk/1",
    "schedule_id": "<SCHEDULE_ID>",
    "independence": {
      "process_launch_id": "<PROCESS_LAUNCH_ID>",
      "repetition_within_process": 0,
      "fresh_process_for_repetition": false
    },
    "observations": [
      {
        "observation_key": "<SHA256>",
        "chunk_index": 0,
        "schedule_position": 0,
        "participant_id": "benchmark_thread/0",
        "measurand_id": "active_wall",
        "framework_iterations": 1000,
        "root_target_calls": 1000,
        "availability": "available",
        "evidence": "measured",
        "method": "monotonic_clock",
        "scope": "calling_thread_active_target_intervals",
        "clock_domain": "host_monotonic",
        "value": {"ns": 1000000.0, "us": 1000.0, "ms": 1.0},
        "basis": "chunk_total",
        "reason": null
      }
    ],
    "benchmark_threads": 1,
    "requested_iterations_per_thread": 1000,
    "framework_iterations_total": 1000,
    "iterations_by_thread": [1000],
    "active_timing_slices": 1,
    "status": "completed",
    "timing": {
      "sample_active_wall_total": {"ns": 1000000.0, "us": 1000.0, "ms": 1.0, "basis": "sample_total", "method": "monotonic_clock", "scope": "active_target_intervals"},
      "concurrent_group_wall_total": {"ns": 1000000.0, "us": 1000.0, "ms": 1.0, "basis": "sample_total", "method": "outer_monotonic_bracket", "scope": "registered_thread_group"},
      "framework_wall_accumulator": {"ns": 1000000.0, "us": 1000.0, "ms": 1.0, "basis": "sample_total", "method": "single_thread_active_wall", "scope": "registered_benchmark_threads"},
      "sample_process_user_time_total": {"ns": 900000.0, "us": 900.0, "ms": 0.9, "basis": "sample_total", "method": "outer_process_resource_usage", "scope": "current_process_all_threads"},
      "sample_process_system_time_total": {"ns": 20000.0, "us": 20.0, "ms": 0.02, "basis": "sample_total", "method": "outer_process_resource_usage", "scope": "current_process_all_threads"},
      "sample_process_cpu_time_total": {"ns": 920000.0, "us": 920.0, "ms": 0.92, "basis": "sample_total", "method": "outer_process_cpu_clock", "scope": "current_process_all_threads"},
      "amortized_wall_per_state_iteration": {"ns": 1000.0, "us": 1.0, "ms": 0.001, "basis": "per_state_iteration", "method": "derived_from_sample_total", "scope": "target_batch"},
      "batch_real_time": {"ns": null, "us": null, "ms": null, "basis": "per_state_iteration", "method": "not_individually_bracketed", "scope": "target_batch", "availability": "unavailable", "reason": "not_collected"},
      "reported_real_time": {"ns": 1000.0, "us": 1.0, "ms": 0.001, "basis": "per_state_iteration", "method": "google_benchmark_real_time", "scope": "registered_benchmark_threads"},
      "framework_cpu_time": {"ns": 910.0, "us": 0.91, "ms": 0.00091, "basis": "per_state_iteration", "method": "google_benchmark_cpu_time", "scope": "registered_benchmark_threads"},
      "main_thread_cpu_time": {"ns": 910.0, "us": 0.91, "ms": 0.00091, "basis": "per_state_iteration", "method": "thread_resource_usage", "scope": "calling_thread"},
      "process_user_time": {"ns": 900.0, "us": 0.9, "ms": 0.0009, "basis": "per_state_iteration", "method": "derived_from_outer_process_total", "scope": "current_process_all_threads"},
      "process_system_time": {"ns": 20.0, "us": 0.02, "ms": 0.00002, "basis": "per_state_iteration", "method": "derived_from_outer_process_total", "scope": "current_process_all_threads"},
      "process_cpu_time": {"ns": 920.0, "us": 0.92, "ms": 0.00092, "basis": "per_state_iteration", "method": "derived_from_outer_process_total", "scope": "current_process_all_threads"},
      "thread_cpu_time": {"ns": 905.0, "us": 0.905, "ms": 0.000905, "basis": "per_state_iteration", "method": "thread_cpu_clock", "scope": "calling_thread"}
    },
    "framework_cpu_mode": "benchmark_thread_cpu_sum",
    "target_calls": {
      "root_per_state_iteration": 1,
      "root_total": 1000,
      "observed_entries_total": null,
      "recursive_or_reentrant_descendant_entries": null,
      "count_scope": "fixture_root_invocations",
      "identity_evidence": "runtime_entry_verified",
      "count_evidence": "static_multiplicity_proof",
      "verified_root_multiplicity": 1,
      "denominator_source": "verified_root_multiplicity_x_timing_iterations",
      "evidence_pass_keys": ["<VERIFICATION_PASS_KEY>"]
    },
    "counter_totals": {
      "tsc_ticks": 2310000.0,
      "cpu_cycles_raw": 3680000.0,
      "cpu_cycles_scaled": 3680000.0,
      "instructions_raw": 5520000.0,
      "instructions_scaled": 5520000.0,
      "cache_misses_raw": null,
      "cache_misses_scaled": null
    },
    "per_call": {
      "wall_time": {"ns": 1000.0, "us": 1.0, "ms": 0.001, "basis": "per_target_call", "method": "derived", "scope": "direct_inclusive"},
      "process_user_time": {"ns": 900.0, "us": 0.9, "ms": 0.0009, "basis": "per_target_call", "method": "derived", "scope": "current_process_all_threads"},
      "process_system_time": {"ns": 20.0, "us": 0.02, "ms": 0.00002, "basis": "per_target_call", "method": "derived", "scope": "current_process_all_threads"},
      "process_cpu_time": {"ns": 920.0, "us": 0.92, "ms": 0.00092, "basis": "per_target_call", "method": "derived", "scope": "current_process_all_threads"},
      "tsc_ticks": 2310.0,
      "cpu_cycles_raw": 3680.0,
      "cpu_cycles_scaled": 3680.0
    },
    "tsc_ticks_per_iteration": 2310.0,
    "tick_kind": "elapsed_reference_clock_ticks_not_cpu_cycles",
    "cpu_cycles_per_iteration": 3680.0,
    "instructions_per_iteration": 5520.0,
    "cache_misses_per_iteration": null,
    "wall_items_per_second": 16000000.0,
    "wall_bytes_per_second": 4096000000.0,
    "memory": {
      "allocations": 0,
      "requested_bytes": 0,
      "peak_live_bytes": 0
    }
  },
  "metric_metadata": {
    "/sample/timing/sample_process_cpu_time_total": {
      "availability": "available",
      "evidence": "measured",
      "method": "outer_process_cpu_clock",
      "scope": "current_process_all_threads",
      "basis": "sample_total",
      "reason": null
    },
    "/sample/timing/process_cpu_time": {
      "availability": "available",
      "evidence": "derived",
      "method": "sample_process_cpu_time_total / framework_iterations_total",
      "scope": "current_process_all_threads",
      "basis": "per_state_iteration",
      "reason": null
    },
    "/sample/per_call/process_cpu_time": {
      "availability": "available",
      "evidence": "derived",
      "method": "sample_process_cpu_time_total / target_calls.root_total",
      "scope": "current_process_all_threads",
      "basis": "per_target_call",
      "reason": null
    },
    "/sample/counter_totals/tsc_ticks": {
      "availability": "available",
      "evidence": "measured",
      "method": "serialized_rdtscp",
      "scope": "calling_thread_target_interval",
      "basis": "sample_total",
      "clock_domain": "x86_tsc_reference_ticks",
      "invariant_capability_evidence": "<CAPABILITY_EVIDENCE_ID>",
      "start_logical_cpu": 4,
      "end_logical_cpu": 4,
      "endpoint_cpu_ids_equal": true,
      "migration_verdict": "unknown",
      "migration_evidence": "endpoint_ids_only",
      "reason": null
    },
    "/sample/tsc_ticks_per_iteration": {
      "availability": "available",
      "evidence": "derived",
      "method": "counter_totals.tsc_ticks / framework_iterations_total",
      "scope": "calling_thread_target_interval",
      "basis": "per_state_iteration",
      "clock_domain": "x86_tsc_reference_ticks",
      "source_metric": "/sample/counter_totals/tsc_ticks",
      "reason": null
    },
    "/sample/per_call/tsc_ticks": {
      "availability": "available",
      "evidence": "derived",
      "method": "counter_totals.tsc_ticks / target_calls.root_total",
      "scope": "calling_thread_target_interval",
      "basis": "per_target_call",
      "clock_domain": "x86_tsc_reference_ticks",
      "source_metric": "/sample/counter_totals/tsc_ticks",
      "reason": null
    },
    "/sample/counter_totals/cpu_cycles_raw": {
      "availability": "available",
      "evidence": "measured",
      "method": "perf_event_read",
      "scope": "calling_thread_target_interval",
      "basis": "sample_total",
      "pmu": "cpu",
      "event": "cycles",
      "event_encoding": "<PMU_EVENT_ENCODING>",
      "privilege_mask": "user",
      "counter_value_kind": "raw_unscaled",
      "time_enabled": {"ns": 1000000.0, "us": 1000.0, "ms": 1.0},
      "time_running": {"ns": 1000000.0, "us": 1000.0, "ms": 1.0},
      "running_fraction": 1.0,
      "start_logical_cpu": 4,
      "end_logical_cpu": 4,
      "endpoint_cpu_ids_equal": true,
      "migration_verdict": "unknown",
      "migration_evidence": "endpoint_ids_only",
      "reason": null
    },
    "/sample/cpu_cycles_per_iteration": {
      "availability": "available",
      "evidence": "derived",
      "method": "counter_totals.cpu_cycles_scaled / framework_iterations_total",
      "scope": "calling_thread_target_interval",
      "basis": "per_state_iteration",
      "source_metric": "/sample/counter_totals/cpu_cycles_scaled",
      "reason": null
    },
    "/sample/per_call/cpu_cycles_raw": {
      "availability": "available",
      "evidence": "derived",
      "method": "counter_totals.cpu_cycles_raw / target_calls.root_total",
      "scope": "calling_thread_target_interval",
      "basis": "per_target_call",
      "source_metric": "/sample/counter_totals/cpu_cycles_raw",
      "counter_value_kind": "raw_unscaled",
      "reason": null
    },
    "/sample/per_call/cpu_cycles_scaled": {
      "availability": "available",
      "evidence": "derived",
      "method": "counter_totals.cpu_cycles_scaled / target_calls.root_total",
      "scope": "calling_thread_target_interval",
      "basis": "per_target_call",
      "source_metric": "/sample/counter_totals/cpu_cycles_scaled",
      "counter_value_kind": "multiplex_scaled_estimate",
      "reason": null
    },
    "/sample/counter_totals/instructions_raw": {
      "availability": "available",
      "evidence": "measured",
      "method": "perf_event_read",
      "scope": "calling_thread_target_interval",
      "basis": "sample_total",
      "pmu": "cpu",
      "event": "instructions",
      "event_encoding": "<PMU_EVENT_ENCODING>",
      "privilege_mask": "user",
      "counter_value_kind": "raw_unscaled",
      "time_enabled": {"ns": 1000000.0, "us": 1000.0, "ms": 1.0},
      "time_running": {"ns": 1000000.0, "us": 1000.0, "ms": 1.0},
      "running_fraction": 1.0,
      "start_logical_cpu": 4,
      "end_logical_cpu": 4,
      "endpoint_cpu_ids_equal": true,
      "migration_verdict": "unknown",
      "migration_evidence": "endpoint_ids_only",
      "reason": null
    },
    "/sample/counter_totals/cpu_cycles_scaled": {
      "availability": "available",
      "evidence": "derived",
      "method": "cpu_cycles_raw * time_enabled / time_running",
      "scope": "calling_thread_target_interval",
      "basis": "sample_total",
      "source_metric": "/sample/counter_totals/cpu_cycles_raw",
      "counter_value_kind": "multiplex_scaled_estimate",
      "reason": null
    },
    "/sample/instructions_per_iteration": {
      "availability": "available",
      "evidence": "derived",
      "method": "counter_totals.instructions_scaled / framework_iterations_total",
      "scope": "calling_thread_target_interval",
      "basis": "per_state_iteration",
      "source_metric": "/sample/counter_totals/instructions_scaled",
      "reason": null
    },
    "/sample/counter_totals/instructions_scaled": {
      "availability": "available",
      "evidence": "derived",
      "method": "instructions_raw * time_enabled / time_running",
      "scope": "calling_thread_target_interval",
      "basis": "sample_total",
      "source_metric": "/sample/counter_totals/instructions_raw",
      "counter_value_kind": "multiplex_scaled_estimate",
      "reason": null
    },
    "/sample/counter_totals/cache_misses_raw": {
      "availability": "unavailable",
      "evidence": "unavailable",
      "method": "perf_event",
      "scope": "calling_thread_target_interval",
      "basis": "sample_total",
      "pmu": "cpu",
      "event": "cache-misses",
      "reason": "hardware counter permission denied"
    },
    "/sample/counter_totals/cache_misses_scaled": {
      "availability": "unavailable",
      "evidence": "unavailable",
      "method": "raw * time_enabled / time_running",
      "scope": "calling_thread_target_interval",
      "basis": "sample_total",
      "source_metric": "/sample/counter_totals/cache_misses_raw",
      "reason": "source counter unavailable"
    },
    "/sample/cache_misses_per_iteration": {
      "availability": "unavailable",
      "evidence": "unavailable",
      "method": "perf_event",
      "scope": "target_batch",
      "basis": "per_state_iteration",
      "source_metric": "/sample/counter_totals/cache_misses_scaled",
      "reason": "hardware counter permission denied"
    },
    "/sample/wall_items_per_second": {
      "availability": "available",
      "evidence": "derived",
      "method": "items_per_state_iteration / amortized_wall_per_state_iteration",
      "scope": "target_batch",
      "basis": "rate_per_second",
      "denominator_metric": "/sample/timing/amortized_wall_per_state_iteration",
      "reason": null
    }
  },
  "provenance": {
    "blueprint_document_sha256": "<SHA256>",
    "blueprint_measurement_contract_sha256": "<SHA256>",
    "project_adapter_document_sha256": "<SHA256>",
    "project_adapter_behavior_projection_sha256": "<SHA256>",
    "suite_core_sha256": "<SHA256>",
    "runner_sha256": "<SHA256>",
    "benchmark_framework_sha256": "<SHA256>",
    "language_adapter_sha256": "<SHA256>",
    "producer_adapter_sha256": "<SHA256>",
    "measurement_key_material": {
      "schema_version": "measurement-key-material/1",
      "key": "<SHA256>",
      "content_sha256": "<SHA256>"
    },
    "pass_key_material": {
      "schema_version": "pass-key-material/1",
      "key": "<SHA256>",
      "content_sha256": "<SHA256>"
    },
    "literal_launch_provenance_sha256": "<SHA256>",
    "fixture_identity": "<SHA256>",
    "benchmark_binary_sha256": "<SHA256>",
    "production_artifact_sha256": "<SHA256>",
    "native_result_sha256": "<SHA256>",
    "environment_fingerprint": "<SHA256>"
  }
}
```

Google Benchmark time values are normally already normalized per benchmark
iteration. Divide those values by the matching calls per normalized iteration
to form amortized `per_call`; those calls are fixture-root invocations, not
recursive entries. Do not divide the values again by
`framework_iterations_total`. Amortized wall/call in a batched or concurrent
row is throughput cost, not individual-call latency. Explicit per-target-call
and per-State-iteration item/byte denominators prevent unsafe reconstruction
from rate counters. Their State-iteration totals must already include every
batched target call. Never compare the word “item” across benchmark families
unless their item semantics match.

Every rate field names its source clock in the field name and metadata. Preserve
a framework-native items/bytes rate separately with the framework CPU, real, or
manual-time denominator it actually used. Never substitute that native rate for
a `wall_*_per_second` field or combine rates whose clock denominators differ.

Every metric declares `basis`, `method`, and `scope`, either inline as shown for
durations and observations or in its mandatory `metric_metadata` entry. Every
metric's registry identifier is a stable JSON Pointer, and every populated or null metric has
exactly one metadata definition after inline and registry metadata are resolved.
Allowed basis values include `chunk_total`, `sample_total`,
`per_state_iteration`, `per_target_call`, `per_item`, `per_byte`, and
`rate_per_second`; provider extensions are schema-registered.
Retain independently observed sample/batch totals as distinct metrics. Do not
recover a supposed raw total by multiplying a normalized framework value when
thread overlap, batching, manual timing, or calibration makes that inversion
invalid. Device records use separate host-submit, device-execution,
host-completion, transfer, and fence-wait metrics with named clock domains.

An evidence level obtained outside the timing launch must list the successful
matched `evidence_pass_keys` that establish it. Each referenced pass must share
the row's `reconciliation_key`, identify its instrumentation artifact, and
carry readable native evidence. If verification occurred in the timing launch,
reference the current `pass_key` and label the in-band method/overhead. A missing,
failed, stale, or mismatched evidence pass downgrades the identity/count claim;
the timing record may remain usable as provisional timing but cannot satisfy a
stricter proof policy.

The example abbreviates the metric registry. A conforming record contains every
metric key registered for `measurement/1`, with either a finite value or null
and a metadata object. Controlled vocabularies define availability
(`available|unavailable|inapplicable`), evidence (`measured|derived|declared|static|binary|runtime|sampled|estimated|unavailable`),
normalization basis, method, scope, clock domain, and reason tokens. Validate
`us = ns / 1000` and
`ms = ns / 1000000` from canonical nanoseconds within the schema's declared
floating-point tolerance.

Create a canonical `measurement/1` record at a `sample_key` path only for a
validated successful raw repetition; its `sample.status` is `completed`. A
failed, timed-out, or skipped launch is an `attempt/1` record keyed by its
run-local attempt identity and never occupies or overwrites the reusable sample
path. An unsupported capability uses the separately keyed capability-verdict
record from Section 11.4. A measurement-shaped partial parser result may be
retained only inside the attempt's diagnostic path and cannot enter the
canonical record store or completion database tables. A later retry therefore
keeps the same sample key and can create its first canonical successful record
without conflicting with failure bytes. Zero is valid only when a metric was
actually measured as zero.

Derived `aggregate/1` records use their own `aggregate_key` and reference the
exact canonically ordered raw sample keys. They carry metric ID, aggregation-
policy hash, estimator name/version, measurement/pass/comparison-cohort joins,
raw sample keys, raw sample count, eligibility verdict, exclusions with reasons,
and the vector of actual iteration counts. Compute each statistic over the raw repetitions' already-normalized
values, unweighted unless a named estimator explicitly says otherwise. Never
ingest framework-emitted aggregate rows as though they were raw samples.
Subject iterations remain separate or null. Percentiles require a declared
minimum independent sample count; seven repetitions normally support robust
location/dispersion triage, not tail-latency claims. Never reuse one measurement
for multiple EIDs or operation IDs. Preserve process/session grouping and do not
treat several repetitions from one launch as independent process samples; use a
declared cluster-aware estimator or collect separate launches when independence
is required.

When a repetition contains chunks or regression-slope points, retain every
`observation_key`, chunk boundary/order, iterations/root calls, measurand, and
schedule position. Chunks remain clustered beneath their repetition and process;
never report `repetitions × chunks` as the independent sample count. Aggregates
record the estimator and quantile type, nominal and effective sample sizes,
autocorrelation/cluster treatment, adaptive stopping rule and thresholds,
admissibility verdict, and every excluded observation with reason. A regression
result also records slope/intercept definition, weighting, fit diagnostics, and
estimator version.

---

## 13. Required outputs

Write at least:

- Native framework JSON and console log for every executed row/module.
- Raw per-repetition JSON for every direct row.
- Normalized per-callable JSON and deterministic TSV.
- Statistical aggregate JSON and deterministic TSV derived without deleting raw records.
- `row_results.sqlite3` implementing `checkpoint-store/1`, with transactional
  per-pass evidence groups and derived plan-row completion.
- `runs/{run_id}/manifest.json` containing commands, environment, build IDs, scope,
  catalogue-completeness-proof key, resolved-scope key, selection ID,
  measurement-plan ID, strict-completion
  authority, selection-membership and planning-index hashes, phase/row progress,
  failures, timeouts, resume state, and blueprint
  version/hash. A top-level `manifest.json`, if retained for operator
  convenience, is only an atomic latest-run pointer/index and never evidence or
  completion authority.
- `runs/{run_id}/selection_membership.json` using `run-membership/1`, with the
  suite/scope/selection/plan identities, exact expected rows, and immutable
  measurement/pass/sample references credited or rejected for that run.
- `runs/{run_id}/planning_index.json` using `run-planning-index/1`, mapping
  every full-document, raw-provider, and canonical planning/proof dependency to
  its role, schema, immutable path, and content hash.
- `runs/{run_id}/attempt_journal.jsonl` and
  `runs/{run_id}/attempts/v1/{attempt-key[0:2]}/{attempt-key[2:4]}/{attempt-key}.json`,
  preserving each launch's literal
  argv/cwd/transport paths, request/result hashes, process IDs, timestamps,
  status, signal/exit/timeout data, and recovery/reuse decision. Derive the
  filesystem-safe attempt key from the run ID and run-local attempt ID.
- `planning/v1/{artifact-sha256[0:2]}/{artifact-sha256[2:4]}/{artifact-sha256}.json`
  immutable canonical snapshots for every adapter/scope
  projection, catalogue proof, authoring/terminal ledger, compiled projection,
  component/fixture/input/regime/operation/expected-registration manifest,
  measurement plan, and selector/routing plan referenced by a scope, selection,
  membership, or completion report. Each reference records both durable path
  and hash; checked-in suite paths remain editable authoring copies and cannot
  be the sole historical evidence.
- `contracts/v1/{document-sha256[0:2]}/{document-sha256[2:4]}/{document-sha256}.blob`
  for the exact blueprint, project-adapter, schema, and provider-manifest bytes
  named as full-document provenance, with media type and logical role in the
  run's planning index.
- Authoritative `shipping_components.json` and its deterministic TSV projection.
- Exact source catalogue, compiled-record inventory, EID projection, alias/clone
  joins, template-instantiation inventory, and hash-bound input ledger.
- The exact `get-all-functions` version/invocation, raw `ALL_FUNCTIONS.md` hash,
  lossless `catalogue_import.json` hash, canonical `callable_catalogue.json`
  hash, and
  `catalogue_semantic_hash` used by identities.
- `catalogue_raw/v1/{raw-sha256[0:2]}/{raw-sha256[2:4]}/{raw-sha256}.md` for the
  exact primary catalogue bytes and
  `catalogue_provider_raw/v1/{raw-sha256[0:2]}/{raw-sha256[2:4]}/{raw-sha256}.blob`
  for every supplemental/oracle native output, preserving historical inputs
  after the repository-root working copy changes.
- `catalogue_boundary.json`, `catalogue_scan_coverage.json`,
  `catalogue_definition_coverage.json`, `catalogue_exclusions.json`, and
  `catalogue_gaps.json`,
  including each language completeness oracle, any supplemental-provider
  `catalogue-provider-result/1` output/join, and the exact
  no-EID/out-of-boundary exclusion records.
- `catalogue_import_audit.json` with raw, imported, duplicate/alias,
  non-callable/macro, executable, oracle-definition, primary-matched,
  supplemented, and unresolved counts whose separate raw-record and
  definition-record conservation equations close exactly.
- Authoring-disposition and static-invariant audit reports.
- Authoritative `callable_coverage.json` and its deterministic TSV projection.
- Hash-bound `terminal_evidence.json` referenced by every terminal disposition.
- `operation_ownership.json` and `measurement_plans.json`; each resolved scope
  references the ownership-manifest hash, while each run/selection independently
  references its chosen measurement-plan ID/hash.
- Typed input-case and fixture catalogues with provenance, source/dependency
  hashes, validation, expected operation IDs, and expected row names.
- `materials_licenses.json` for copied fixtures/corpora, extracted source, and
  vendored framework material.
- `records/v1/{sample-key[0:2]}/{sample-key[2:4]}/{sample-key}.json` as the
  collision-resistant canonical normalized raw store, plus a versioned
  `record_index.json` joining producer, tagged logical subject, row/operation,
  measurement, pass, and sample identities to that path and to the immutable
  origin run/attempt path plus literal-launch provenance hash.
- `key_material/measurement/v1/{measurement-key[0:2]}/{measurement-key[2:4]}/{measurement-key}.json`
  and `key_material/pass/v1/{pass-key[0:2]}/{pass-key[2:4]}/{pass-key}.json`, containing the
  complete canonical key preimages needed to recompute every referenced
  measurement and pass key independently of run-local state.
- `aggregates/v1/{aggregate-key[0:2]}/{aggregate-key[2:4]}/{aggregate-key}.json`
  for separately keyed derived aggregates and their exact raw-sample joins.
- `capability_verdicts/v1/{capability-verdict-key[0:2]}/{capability-verdict-key[2:4]}/{capability-verdict-key}.json`
  for exact
  reusable unsupported-machine/probe outcomes that never count as measurements.
- `callables/v1/{eid[0:2]}/{eid[2:4]}/{eid}.json` as one atomically regenerated
  per-callable index containing every owned operation, typed input/regime,
  raw-sample/aggregate reference, timing unit view, and failure or terminal state.
- `operation_timings/v1/{eid[0:2]}/{eid[2:4]}/{eid}/{operation-id}.json` as an atomically regenerated
  multi-record index over every retained measurement, pass, sample, and
  environment cohort for that callable operation; it is never the sole evidence.
- `native/v1/{sample-key[0:2]}/{sample-key[2:4]}/{sample-key}/{native-content-sha256}.blob`
  companions addressed by the same
  measurement/pass/sample keys, with MIME/format metadata in `record_index.json`.
- Final `runs/{run_id}/entities/entity_runtime_report.json` plus deterministic
  TSV projection with full-scope and selected completion.
- A versioned `runs/{run_id}/{suite}/suite_runtime_report.json` for workloads,
  pipelines, entities, and all as applicable, with selection/plan keys, exact expected and
  completed subject rows, sample/pass counts, phase-authority hashes, and the
  scoped completion predicates it asserts. Any top-level report is a
  regenerable latest-run view; older per-run authority bytes remain immutable.
- Callable-to-row-to-result join report.
- Missing direct benchmark report.
- `unmatched_registrations.json` for actual rows with no expected owner.
- Build, registration, execution, and unsupported-machine failure reports.
- Hardware counter and allocation reports.
- Matched timing/verification sidecars with call-count, lower-level-edge,
  allocation/object-lifetime, and descendant-thread reconciliation.
- Stale-checkpoint and producer-reconciliation reports.
- End-to-end results and observed call-frequency data.
- Ranked human-readable `summary.md`.

Temporary `.pending`/`.tmp` files, generated probe files, benchmark builds,
SQLite WAL/SHM files, native results, logs, and run directories belong in the
project's ignore rules unless the project deliberately curates a small result
snapshot. Checked-in manifests, fixture sources, schemas, audit tools, and
reviewed static audit outputs remain version controlled.

Every variable identity segment in the evidence-store paths above, including
`run_id`, is a full lowercase 64-hex digest; the bracket notation denotes
deterministic two-character fanout directories, not a literal filename. Derive
`run_id` as `SHA256(LP("run/1") || LP(coordinator_nonce) || LP(utc_start_time) || LP(coordinator_instance_id))`;
it names a run and never
enters reusable measurement identity. Keep a human display label inside the
manifest. The fixed `{suite}` segment is a closed schema enum, not user input.
Never place a raw logical/module/pipeline/phase/row ID, source path, `..`, slash,
Unicode spelling, or platform-reserved name in an evidence path. The index
preserves those display identities. Reject a digest whose normalized spelling
is invalid and fail closed if an existing digest path contains different bytes.
This keeps relative paths bounded and identical on case-sensitive and
case-insensitive filesystems.

The callable report must allow selecting an exact function, method, constructor,
destructor, template instantiation, lambda, or ISA implementation and seeing all
of its input cases, raw timings, aggregates, call counts, and regimes.

---

## 14. Report requirements

The report must answer:

- What is the absolute per-call cost of every executable callable?
- What are its batch totals and verified call counts?
- Which typed inputs and states were tested?
- Which fast paths, slow paths, fallbacks, and thresholds were observed?
- Which inputs scale poorly?
- Which callables consume the most time per call?
- Which inexpensive callables have high end-to-end call counts?
- Which callables dominate estimated and measured end-to-end time?
- Which rows allocate, fault, miss cache, mispredict branches, stall, or
  synchronize heavily?
- Which template instantiations, class operations, configurations, and ISA
  variants differ?
- Which exact callables or input regimes are still missing or failed?

Rankings must retain input type, size, mode, outcome, call count, and timing
scope. Do not compare differently sized work solely by raw time. Show absolute
time, normalized per-call time, and domain throughput together.

No-op, early-return, rejected, unsupported, and performed-work rows remain in
the report. Label them so extreme ratios expose fast paths without being
misrepresented as equal-work regressions.

### 14.1 Hotspot ranking policy

A slow micro-benchmark is an expensive operation, not automatically an
application hotspot. Produce these separate rankings:

1. **Measured direct-inclusive operation CPU cost:** group raw repetitions by
   measurement, pass, reconciliation, and comparison-cohort identity, EID,
   operation, fixture hash, input, regime,
   configuration, environment cohort, metric method, and metric scope; require
   the complete sample set. For proven single-thread synchronous rows, rank the
   median target-bound driver/thread CPU per verified call. For targets with
   in-process workers, rank target-bound process CPU per verified call and show
   worker/thread views separately. Whole-process launch tools and background
   runtime work use a separate diagnostic scope. Never add worker CPU to process
   CPU or mix per-call and per-iteration values in one column. Report the
   measured loop/adapter/barrier floor alongside tiny operations; exact target
   identity does not remove that harness cost.
2. **Batch impact:** rank compatible median target-bound CPU and wall time per
   registered iteration for naturally batched kernels. Show explicit items and
   bytes per target call/State iteration, CPU/item, amortized wall/item, and
   throughput.
3. **Latency:** rank median completion wall time separately from CPU cost so
   blocking, I/O, scheduling, and parallel execution remain visible. Never
   label batched or concurrent amortized wall/call as individual latency.
4. **Estimated product contribution:** join direct median CPU/call with observed
   end-to-end call frequency weighted by the observed input/regime mix. Label
   the multiplication as a candidate score. Direct-inclusive parents overlap
   their children, so never sum overlapping contribution scores. Use exclusive
   profiling/call attribution for shares, and validate leading candidates with
   end-to-end before/after measurements.
5. **Hardware work:** show cycles/call or cycles/item alongside nanoseconds.
   Diagnose frequency drift only with compatible core cycles, reference/TSC
   ticks or elapsed time, counter scope, multiplexing, invariant-TSC capability,
   serialization, and no-migration validity metadata. Core cycles alone do not
   establish DVFS behavior. Interpret cycles/TSC as an effective frequency only
   for compatible pinned single-core activity; process-wide cycles across
   concurrent workers also scale with active parallelism.

Preserve every raw repetition and report dispersion; never rank an isolated
maximum as the representative cost. Exclude `stddev`, `cv`, timer-floor,
failed, skipped, and unavailable records from time rankings. Flag rows below
the timer's defensible duration or above the chosen dispersion threshold.

Compare only equivalent work. Equal numeric sizes can still have different
content mixtures, early-return rates, object state, allocation policy, or
algorithm branches. A prefix-based size sweep may change the content
distribution as it grows, so treat it as distinct workload regimes unless the
fixture proves the mix stays constant. Cross-family CPU/item and CPU/byte
comparisons are invalid when “item” or logical-byte definitions differ.

Record governor, turbo, affinity, migrations, and load next to rankings. Use
parallel execution for throughput-oriented triage when desired, label it, and
repeat finalists sequentially on pinned CPUs with controlled frequency before
making optimization claims.

---

## 15. Reproducibility

Capture:

- Timestamp and timezone.
- Operating system, kernel, and runtime versions.
- CPU model, core topology, microcode, cache topology, and supported ISA.
- CPU affinity, governor/power plan, frequency behavior, and turbo state.
- Memory size and topology.
- Compiler, linker, JIT, interpreter, accelerator, and dependency versions.
- Exact compiler and linker flags.
- Release/debug, LTO, sanitizer, exception, RTTI, and floating-point settings.
- Feature flags and configuration identity.
- Source revision and dirty-worktree state.
- Harness and schema versions.
- Benchmark framework revision, enabled optional features, and additive fork
  revision when the project uses one.
- Canonical command request/result, resolved argv/cwd, and
  performance-affecting nonsecret environment values.
- Fixture checksums, seeds, local provenance, and researched source references.
- Source catalogue/completeness-proof, compiled-scope, fixture, registration, binary, native-result,
  measurement, reconciliation, comparison-cohort, pass, sample, and observation hashes.
- Suite, producer, full-scope count, selected count, strict authority, and
  completion state.

Benchmark tooling must never stage, commit, push, reset, clean, or rewrite
unrelated worktree files.

Do not reuse the same output directory for concurrent runs. A report rebuilt
from an existing directory must be a read/derive operation over committed rows;
it must not execute benchmark subjects unless the user explicitly starts a run.
Authoritative regeneration takes an explicit `run_id` and writes only that
run's report paths; omitting it may display a latest-run convenience view but
cannot rewrite historical authority.

---

## 16. Acceptance checklist

Mark an item complete only after implementation and verification.

- [ ] One `micro_benchmarks/` root and one public runner own workloads,
  pipelines, entities, and combined execution.
- [ ] Project-specific paths, components, archives, compiler flags, and module
  names live in a reviewed adapter rather than reusable runner code.
- [ ] The platform boundary, default compiled scope, wider catalogue scope, and
  nonmacro policy are explicit.
- [ ] Every scope, scope union, measurement plan, and selection resolves to a
  canonical content hash; human labels never act as proof identity.
- [ ] Every project, third-party, and nested-dependency source root is inventoried.
- [ ] `get-all-functions` was run from the repository root; its exact
  `ALL_FUNCTIONS.md` output is hash-bound and losslessly normalized, and every
  eligible nonmacro entry reconciles to an EID or reviewed non-runtime record.
- [ ] Independent file enumeration proves every included source file was
  scanned, and a declared language-semantic completeness oracle proves every
  callable definition in each file was imported or supplemented and reconciled.
- [ ] Raw, definition, unresolved, unpartitioned, and scope-partition gap sets
  are persisted for diagnosis and empty before any exhaustive claim.
- [ ] Every configuration-disabled executable callable has a benchmark-only build.
- [ ] Production artifacts and their compile/dependency inputs are hash-bound;
  stale compiled-scope audits fail before timing.
- [ ] Source and compiled callable inventories reconcile without unexplained gaps.
- [ ] Every executable callable has a stable complete identity.
- [ ] Catalogue IDs, canonical EIDs, compiled records, fixture identities,
  operation IDs, measurement/pass/sample keys, and attempt IDs remain distinct
  and join uniquely.
- [ ] Every in-scope EID is exactly `authored`, reviewed `terminal`, or `gap`,
  and strict authoring has zero EID gaps, zero operation gaps, and complete
  required-operation ownership.
- [ ] Every executable callable has at least one direct registered row.
- [ ] Every function, class operation, concrete template instantiation, and
  lambda imported from `ALL_FUNCTIONS.md` owns all required typed input/regime
  rows; called-by-another-function is never accepted as direct coverage.
- [ ] Every direct row invokes the exact target inside the measured loop.
- [ ] Every direct row records exact-target identity evidence separately from
  call-count denominator evidence without overstating either one.
- [ ] No parent, owning-path, or indirect row is used as a child's timing.
- [ ] Every expected operation has one owner and exactly one matching registered row.
- [ ] Every registration has independent `suite_role` and `row_role` values;
  selection never changes evidentiary meaning.
- [ ] Every callable has a reviewed typed input-case table.
- [ ] Every input case records type, size, content, mode, outcome, and provenance.
- [ ] Relevant small, medium, large, boundary, fast, slow, and fallback cases exist.
- [ ] Relevant success, failure, truncated, and uncommon cases exist.
- [ ] Every concrete class operation and relevant object state is benchmarked.
- [ ] Every required template/generic instantiation is built and benchmarked.
- [ ] Every compiled scalar and ISA implementation has a distinct direct row.
- [ ] Runtime-dispatch rows record the selected implementation.
- [ ] Wall/reported-real, main-thread, independent thread, and process CPU time
  are distinct and rendered in ns, us, and ms.
- [ ] TSC reference ticks remain distinct from hardware CPU cycles.
- [ ] Raw calibrated/fixed iterations are preserved.
- [ ] Aggregate repetition counts never replace subject iteration counts.
- [ ] Calls per iteration and total calls are recorded and labeled verified only
  when both identity and multiplicity meet the configured proof policy.
- [ ] Batch totals and per-call normalized timings are recorded.
- [ ] Items per iteration and bytes per iteration are explicit wherever rates
  or per-item/per-byte rankings are published.
- [ ] Raw repetitions are preserved alongside statistics.
- [ ] Optimizer barriers and output verification prevent eliminated work.
- [ ] Harness and adapter overhead is measured and disclosed.
- [ ] Hardware counters and memory metrics use honest availability and scope.
- [ ] Production-like timing and instrumented verification passes reconcile by
  source, binary, configuration, fixture, input, dispatch, output, and operation.
- [ ] Spawned threads/tasks/callbacks/processes are followed through completion,
  and worker timing/call counts do not replace direct worker-callable rows.
- [ ] Cold, warm, allocation, cache, thread, outcome, and ISA regimes are audited.
- [ ] End-to-end companions record real-world call frequency and user-visible time.
- [ ] Reports expose every callable, input case, raw result, aggregate, and failure.
- [ ] Every EID has one per-callable JSON index joining all of its operations,
  inputs, regimes, ns/us/ms timing views, CPU/tick counters, and raw evidence.
- [ ] Every result names its producer, tagged subject, operation/phase, and
  measurement/reconciliation/comparison-cohort/pass/sample identities, plus
  EID, fixture, binary, or runtime/device identity
  wherever applicable.
- [ ] Immutable key-material records reproduce every measurement/pass key
  without relying on a mutable run manifest or ephemeral transport path.
- [ ] Every suite records one final strict-completion authority; phase-local and
  diagnostic audits cannot complete unrelated rows.
- [ ] Full-scope authoring, selected-subject-row completion, its callable-only
  selected-operation projection, full runtime completion, and cross-platform
  completion are reported separately.
- [ ] Only a frozen plan with `runtime_completion_eligible: true` can assert
  full runtime completion; quick, smoke, and ordinary comparison results remain
  selected-execution evidence even when their unfiltered selection finishes.
- [ ] Missing direct, build, registration, and execution counts are all zero.
- [ ] Full completion mode executes every required registered
  callable/input/regime row; explicit exploratory selection executes all of its
  matching rows without changing the completion denominator.
- [ ] Resume preserves only complete fingerprint-compatible rows and retries
  missing, corrupt, failed, timed-out, or stale rows.
- [ ] Per-pass pending output, versioned SQLite transactions/constraints, and
  atomic public JSON survive interruption without turning partial data into
  completion; SQLite alone is authoritative, a clean pass survives another
  pass's failure, and the attempt journal cannot grant completion.
- [ ] Hotspot reports use complete repetition groups and compatible timing/work
  scopes; raw outliers and mixed-size work do not drive the ranking.
- [ ] No benchmark tooling performs source-control mutations.

One frozen named scope is complete only when every executable callable in that
scope has direct timing and its strict inventory, registration, execution,
input-case, and result audits all agree. Claim repository-wide completeness only
when the reviewed union of every scope declared in Section 1 is complete.

---

## 17. Ready-to-paste implementation prompt

```text
Build an exhaustive per-callable micro-benchmark suite for this repository.
Read MICRO_BENCHMARK_DESIGN.md completely and treat every requirement as the
acceptance contract.

Keep one micro_benchmarks directory and one runner with workloads, pipelines,
entities, and all suite selections. Put repository-specific source roots,
production artifacts, compile metadata, configurations, language runtimes,
fixtures, module patterns, and ISA flags in a versioned project adapter. Keep
the runner, checkpoint store, schemas, statistics, audit interfaces, and reports
portable. Declare the suite set relationship explicitly: a pipeline selector is
a narrowing view of curated `suite_role` values, and an all run must not execute those rows a
second time. Use discriminated vendored/package/installed framework providers
and native/managed/interpreted/device build providers. Launch every adapter
action through the versioned argv/cwd/environment/request/result protocol with
no implicit shell.

Finalize the production build first so generated/transpiled product sources and
entries exist. Then, from the repository root, invoke the already-installed
command with the exact argv `get-all-functions --root <PROJECT_ROOT> --output
<PROJECT_ROOT>/ALL_FUNCTIONS.md`; the explicit output is mandatory. Record the
tool version/hash and catalogue hash, parse every raw row losslessly into
`catalogue_import.json`, apply the immutable boundary/exclusion manifests, and
independently prove that every included source file was scanned. For every
language/configuration, run a declared compiler-AST, typechecker/indexer, or
grammar-complete definition oracle and reconcile every callable definition;
supplement primary catalogue omissions with versioned, source-bound records.
Upgrade or supplement the provider for included roots the installed scanner
skips. Import generated product code even when it lives below a build
directory. Fail on stale input, parse loss, scan/definition-coverage gaps, or
an unreconciled in-boundary nonmacro callable; preserve every failure in
`catalogue_gaps.json` rather than disguising it as an exclusion. A lower-bound language scanner
cannot support an exhaustive-callable claim by itself.

Use `ALL_FUNCTIONS.md` to drive authoring: every listed function, separately
executable class operation, concrete template instantiation, and lambda must
receive its own EID, required-operation matrix, direct benchmark rows, and
result join. A function being called by another function never satisfies its
row requirement. Generate a hash-bound compiled-scope projection from the
production build's compile metadata and exact artifacts, reconcile it with the
wider nonmacro source catalogue, and fail before timing when any bound input is
stale. Preprocessor macros themselves are excluded because they have no runtime
duration; executable functions, class operations, template instantiations, and
lambdas emitted by macro expansion remain in scope.

Resolve each named scope to finite exact component, root, configuration,
language, platform, compiled-record, EID, and operation sets. Freeze its
operation-manifest ID, exclusions, accepted subject provenance, compiled-record
policy, and minimum target-identity/call-count evidence. Content-hash every
resolved scope/scope union and measurement plan, then derive each selection ID
from those hashes, exact rows, owner routing, and required passes.

Keep catalogue IDs, canonical source EIDs, compiled symbol/clone records,
fixture identities, operation IDs, measurement/pass/sample keys, and run-local
attempt IDs distinct. Assign every
in-scope EID exactly one authored, reviewed-terminal, or gap disposition. A
terminal must prove there is no runtime operation; it cannot hide difficult
authoring. Report inventory reconciliation, authoring completeness, selected
operation completion, full runtime completion, and cross-platform completion
separately.

Inventory every executable callable in the project and every bundled, linked,
embedded, generated, transpiled, interpreted, third-party, and nested dependency
in scope, including code the project does not currently call. Build disabled
features in isolated benchmark-only configurations. Distinguish complete
signatures, object ownership, configurations, overloads, constructors,
destructors, class operations, template instantiations, lambdas, file-static
functions, generated functions, runtime dispatch, and every compiled ISA
implementation.

Give every executable callable at least one direct benchmark row. A parent or
owning path does not count for a child. Every direct row must invoke the exact
target in the measured loop, verify calls per iteration, preserve actual
iterations and raw repetitions, and emit real time, user CPU time, system CPU
time, total CPU time, batch totals, total verified calls, and normalized per-call
timings. If a target calls other functions, mark its timing direct-inclusive and
also benchmark every child directly in its own rows.

Use curated workloads, generated independent/companion binaries, and dynamic
per-EID fixtures as named result producers. Reconcile them by EID and unique
operation ID. Let the entities planner dispatch every required operation to its
sole qualifying owner even when that owner is curated, and deduplicate overlap
in all. Give every registration a subject, floor, or diagnostic row role; only
subject rows satisfy coverage. Also give it an independent workload, pipeline,
or entity suite role; never infer either role from the other. Every suite
records one final strict-completion authority.
Compiled entity and combined runs use the hash-bound zero-gap compiled-source audit
before launch and the final merged EID-operation report after all entity
producers finish; older symbol or owning-path audits remain diagnostics and may
not impersonate child measurements.

For every callable, create an evidence-backed typed input-case table. Record
input type, template parameters, size, bytes, shape, content, mode, object state,
outcome, allocation, cache, temperature, threads, ISA, fixture checksum, and
provenance. Cover relevant empty, small, medium, large, maximum, semantic
boundaries, fast paths, slow paths, fallbacks, success, failure, truncation, and
uncommon branches. Benchmark each class operation across relevant states and
each template across supported production and representative concrete
instantiations.

Research workloads using local production call sites, tests, corpus files,
specifications, upstream official documentation and tests, standards,
conformance suites, and primary sources found through web research. Record the
source and reasoning for every researched case. Pin fixtures locally; normal
benchmark execution must not require live network access.

Prevent constant folding, inlining-based elimination, loop deletion, and dead
stores. Batch tiny functions sufficiently above timer overhead while retaining
batch totals and per-call normalization. Match production compilation and
runtime settings. Record allocation, memory, hardware counters, faults, stalls,
and throughput where applicable, with unavailable values reported as null.

Record wall/reported-real, calling-thread CPU, independent thread CPU, and
process CPU separately in ns, us, and ms. Keep TSC reference-clock ticks
separate from hardware cycles. Record explicit items and bytes per iteration.
Give every metric an explicit sample-total/per-iteration/per-call/rate basis,
method, scope, and clock domain, and retain independently observed sample totals.
Record target identity evidence separately from call-count evidence. Require a
binary-bound or runtime-entry-verified identity and a static multiplicity,
runtime exact-count, or reviewed output-bijection proof before calling a
denominator verified. Never describe a fixture-declared count as verified.
Keep fixture-root calls separate from recursive/reentrant descendant entries.
Do not transfer a sidecar entry count to a differently calibrated timing pass;
derive the timing denominator only from a verified invariant multiplicity and
that timing pass's actual iterations, or prove an identical pinned schedule.
Preserve native JSON and every raw repetition before deriving aggregates.

Use a matched instrumented pass for exact call counts, lower-level edges,
allocation/object lifetimes, syscalls, and thread/task lineage when those hooks
would contaminate performance timing. Bind it to the production-like pass by
source, binary, configuration, fixture, input, dispatch, operation, and output
evidence. Follow asynchronous and descendant work through completion; every
worker callable still owns independent direct rows.

Keep end-to-end companions for real-world call frequency and user-visible
impact, but never use them as direct callable coverage. Produce raw
per-repetition JSON, normalized per-callable JSON/TSV, exact inventories,
coverage and input-case audits, failure reports, and a report where any exact
callable can be selected to see all inputs, regimes, timings, calls, and
statistics.

Provide a sequential tqdm runner with exact callable/input progress, filters,
affinity, fixed and calibrated iterations, timeouts, fresh-process cold rows,
hardware profiles, atomic incremental output, and row-level resume. Full mode
must execute every required registered callable/input/regime row. An explicit
exploratory selector executes all matching exploratory rows while leaving
completion unchanged. Quick validation modes
must never be described as complete coverage.

Commit a pass evidence group only after its isolated process produced every
successful sample required by that pass. Preserve a committed clean timing pass
when a separately keyed sidecar fails, and derive plan-row completion only when
all required pass/sample groups exist. Use a hidden pending file, versioned
transactional SQLite checkpoint, atomic public JSON, and an append-only
diagnostic attempt journal; SQLite is the sole completion authority. Use a base measurement key containing source, dependency, fixture,
compiler, artifact, timing binary, input, environment, and measurement-policy
hashes. Give verification, attribution, and hardware passes separate keys bound
by a shared reconciliation key.
Resume only fingerprint-compatible complete rows; retry stale, corrupt, failed,
timed-out, and partial rows. Preserve full-scope and selected counts in the run
manifest.

Model chunks and regression points as observations clustered under a raw
repetition and process launch. Record observation keys, schedule order, adaptive
stopping, exclusions, estimator version, and nominal/effective sample sizes;
never count chunks as independent repetitions. Publish a versioned tagged
suite-runtime authority for workload and pipeline rows as well as the merged
EID-operation authority for callable coverage. State selected-subject-row,
selected-operation, full-scope runtime, and scope-union completion separately.
Quick, smoke, and ordinary comparison plans set completion eligibility false;
only a frozen plan whose manifest explicitly sets
`runtime_completion_eligible: true` may assert full-scope runtime completion.

Rank measured direct-inclusive operation CPU cost across complete groups with
one authoritative timing pass and compatible comparison-cohort identity. Use
target-bound driver/thread CPU per verified call for proven single-thread
synchronous rows, target-bound process CPU per verified call for in-process
worker rows, and separate whole-process-launch diagnostics. Never add worker CPU
to process CPU. Rank natural batches separately by CPU/iteration and CPU/item,
and rank completion wall latency separately. Never mix work definitions, input
content, per-call and per-iteration scopes, metric methods, or isolated maximum
samples. Join cost with observed end-to-end call frequency before calling
something an application hotspot, avoid summing overlapping direct-inclusive
parents and children, and confirm the change end to end.

Finish authoring, static audits, build validation, and untimed row discovery
before starting a long timing pass. When the user's request includes execution,
continue through the requested run without repeatedly asking for confirmation.
Do not commit, stage, push, reset, clean, or modify unrelated files. Mark
checklist items complete only after implementation and verification. A named
scope is complete only when every executable callable in it has direct timing
and every strict audit has zero missing, build-failed, registration-failed,
partially measured, and execution-failed entries. Reserve a repository-wide
claim for the reviewed union of all declared scopes and configurations.
```

---

## 18. Handoff requirements

Report:

- Files created or changed.
- Project adapter values, declared scope/platform boundary, resolved-scope and
  selection hashes, catalogue-completeness-proof key, measurement-plan ID,
  benchmark framework revision, and schema versions.
- Builds and static verification performed.
- Whether timed benchmarks were executed.
- Exact project, dependency, configuration, language, and callable totals.
- `get-all-functions` version/invocation, `ALL_FUNCTIONS.md` hash and imported
  count, normalized-catalogue hash, per-provider supplemented totals, included
  files visited/skipped/supplemented totals, language-oracle definition totals,
  raw/definition/scope-partition gap totals, and zero-loss/zero-definition-gap
  reconciliation verdicts.
- Source catalogue, compiled records, canonical EIDs, aliases/clones, authored,
  reviewed-terminal, authoring-gap, fixture, and expected-operation totals.
- Directly benchmarked and missing-direct totals.
- Build, registration, execution, and unsupported-machine totals.
- Input-case and regime totals per callable.
- Full-scope versus selected completion and the final strict authority for each suite.
- Result totals by every producer declared in the project adapter, including
  curated, generated-independent, dynamic-entity, and any foreign/device
  producer, plus duplicate/conflict reconciliation.
- How to list, run, resume, and report the full suite.
- Which hashes form resume identity and which changes invalidate old evidence.
- Timing, instrumentation, runtime, and hardware-counter limitations.
- Target-identity and call-count evidence levels, plus any fixture-declared
  provisional timing.
- Confirmation that raw repetitions and real iteration counts are preserved.
- Confirmation that no source-control mutation or unrelated edit occurred.

Do not describe a named scope as complete while any executable callable in it
lacks a successful direct timing record. Do not describe the repository as
complete until every declared scope/configuration in the reviewed union is
complete.

---

## 19. Benchmark framework integration

The SGVAN++ reference suite vendors an additive Google Benchmark fork. A new
project may use stock Google Benchmark for basic C/C++ loops, but it must supply
equivalent schema, checkpoint, clock, entity, and reporting features before it
can claim this contract.

Within the SGVAN++ repository, the useful framework references are:

```text
3rd party/google-benchmark/PORTING.md
3rd party/google-benchmark/ENTITY_BENCHMARKS.md
3rd party/google-benchmark/FOREIGN_BENCHMARKS.md
3rd party/google-benchmark/SGVAN_FORK_OVERVIEW.md
micro_benchmarks/BENCHMARK_LIBRARY_UPGRADE.md
```

SGVAN++'s exhaustive authoring work starts from the repository-wide catalogue
produced by `get-all-functions`; this checkout's existing snapshot uses the
legacy filename `ALL_Functions.md`. The portable contract above standardizes
future runs on `ALL_FUNCTIONS.md`. Many current per-function,
per-class-operation, per-template-instantiation, and per-lambda fixtures/rows
were derived from the legacy snapshot, but the current consumer does not yet
implement the portable lossless import, boundary, exclusion, and catalogue-wide
completion contract.

The executable behavior of the SGVAN++ consumer is defined by
`micro_benchmarks/tools/run_benchmarks.py`, `entity_suite.py`, and
`result_schema.py`; its operator contract is `micro_benchmarks/README.md`.
Documents marked historical under `micro_benchmarks/entities/` describe the
retired standalone workflow and are not porting specifications.

### 19.1 Current SGVAN++ command sequence

This POSIX/Python sequence documents the current reference consumer. It is not
the portable command ABI from Section 1.2:

```sh
# 1. Finalize the production build and compile metadata.
cd "<PROJECT_ROOT>"
<BUILD_PRODUCTION_ARTIFACTS>

# 2. Refresh the legacy-cased catalogue consumed by the current SGVAN tools.
get-all-functions --root "<PROJECT_ROOT>" \
  --output "<PROJECT_ROOT>/ALL_Functions.md"

# 3. Refresh inventory outputs, generate an untimed entity inventory, then
#    invoke the current read-only zero-gap guard.
cd "<PROJECT_ROOT>/micro_benchmarks"
python3 entities/tools/compiled_scope_projection.py
python3 tools/generate_dav1d_source_fixture_registry.py
python3 entities/tools/compiled_source_coverage_audit.py
python3 tools/run_benchmarks.py entities generate --output results/preflight
PYTHONPATH=tools python3 -c \
  'import entity_suite; entity_suite.require_compiled_authoring_complete()'

# 4. Configure/build, then discover registrations without timing.
BENCHMARK_BUILD_DIR="<BENCHMARK_BUILD_DIR>"
<CONFIGURE_AND_BUILD_MICRO_BENCHMARKS>
python3 tools/run_benchmarks.py list \
  --build-dir "${BENCHMARK_BUILD_DIR}" --rows

# 5. Smoke deliberately bounded workload and entity selections.
python3 tools/run_benchmarks.py run \
  --suite workloads --build-dir "${BENCHMARK_BUILD_DIR}" \
  --module "<SMOKE_MODULE_GLOB>" --preset quick \
  --output results/smoke/workloads
python3 tools/run_benchmarks.py entities run \
  --entity-limit <SMALL_ENTITY_COUNT> --min-time 0.001s --repetitions 1 \
  --output results/smoke/entities

# 6. Run the exhaustive selection sequentially with row resume.
python3 tools/run_benchmarks.py run \
  --suite all --build-dir "${BENCHMARK_BUILD_DIR}" \
  --preset exhaustive --jobs 1 --strict-completion --top 1000000 \
  --output results/full_exhaustive --resume

# 7. Rebuild current phase reports without rerunning valid rows.
python3 tools/run_benchmarks.py report \
  results/full_exhaustive/workloads --top 1000000
python3 tools/run_benchmarks.py entities report \
  --output results/full_exhaustive/entities
```

The current CLI has no public `entities check` action, so the sequence calls its
read-only authoring guard directly. `entities generate` validates conservation
and writes inventory but does not fail solely because a disposition is `gap`.
The quick preset shortens sampling but does not narrow selection; an unfiltered
`--suite all --preset quick` still selects the full entity population.
SGVAN++ currently requests 50 iterations per benchmark thread and seven
repetitions for its exhaustive preset. Batched APIs may overshoot that request.

For one current-fork multithreaded repetition, let `T` be registered threads,
`W_t` each thread's accumulated active wall interval, `C_t` each thread's CPU
interval, `P_t` each thread's overlapping process-clock delta, and `N_t` each
thread's native iteration count. The framework reports real time as
`(sum(W_t) / T) / sum(N_t)`, default CPU time as `sum(C_t) / sum(N_t)`, and
`MeasureProcessCPUTime()` CPU time as `(sum(P_t) / T) / sum(N_t)`. The real-time
formula is equivalent to inverse group throughput only when the thread
intervals are balanced. The process-mode formula averages overlapping samples;
it is not an exact outer process-CPU bracket. Preserve these framework values
and independently bracket group wall and current-process CPU when those totals
are required.

With `--hardware-counters`, curated and generated benchmark-module timing asks
the libpfm-enabled Google Benchmark build for `CYCLES` and `INSTRUCTIONS`, then
the runner launches separate fresh-process `perf stat` and GNU `time` profiles
for selected rows. Dynamic per-EID execution always asks Google Benchmark for
`CYCLES` and `INSTRUCTIONS`; it does not receive that external perf/GNU-time
pass. These records therefore have different methods and scopes and must not be
presented as one simultaneous measurement. Decide the flag before resuming an
existing current-format run because it is stored in that run's manifest.
After that phase's base timing finishes and before its external hardware
profile starts, the current runner raises if either `perf` or GNU `time` is
missing, even without `--hardware-required`. This can leave completed base
timing before aborting the profile and, in `all`, later phases. Once both tools
exist, an individual external hardware profile failure warns and continues
unless `--hardware-required` is set.

The fork's current `thread_timer.h` guards RDTSCP availability and invalidates
TSC evidence when the two endpoint CPU IDs differ. It neither reports migration
nor detects a migrate-away-and-back interval, and it does not itself attest
invariant/constant-rate TSC. Require independent capability evidence before
interpreting those ticks as a stable reference-clock rate. Its in-band counter path calls `ResumeTiming()` before it
starts the perf counters, so counter-start overhead lies inside the reported
timed interval. Dynamic EID rows always request `CYCLES` and `INSTRUCTIONS` in
that path. Record this boundary difference rather than comparing those samples
as clean counter-free timing.

The current `all` layout writes separate `workloads/` and `entities/` reports
and has no top-level combined report. Its runner exit status OR-combines phase
operational return codes, while the final entity report alone decides callable
completion; it does not reconcile one cross-producer top-level completion
authority. A portable read-only top-level index may point to the phase
authorities without replacing them.

Current selector routing is phase-specific:

| Current phase | Module/include-exclude selectors | EID/path/kind/limit selectors | Row filter |
| --- | --- | --- | --- |
| Curated workload | Applied | Not applicable | Applied |
| Generated-independent entity modules | Applied for `--suite entities`; deliberately cleared by `--suite all` | Not applied | Applied |
| Dynamic per-EID inventory | Not applied | Applied | Applied |

Record the selector matrix in a port's adapter. Do not assume that
`--entity-limit` bounds generated-independent modules or that `--module` bounds
dynamic EIDs. A smoke run must select the phase through a control that actually
owns it, as the separate commands above do.

Treat the reference consumer as a worked example, not a drop-in generic runner.
Its archive discovery, component names, compiler selection, support headers,
source-catalogue path, feature variants, and ISA flags are project-specific.
It also assumes Linux/GNU facilities in several paths, including `taskset`,
`perf`, GNU `time`, POSIX file locks/process groups/resource APIs, GNU linker
groups and `-no-pie`, and pthread/dl/rt/pfm libraries.
Move those behind the adapter in Section 1.2. The reference consumer also has
producer-specific result shapes; a new port should implement the unified
`measurement/1` envelope in Section 12 at the boundary rather than spreading
those shapes into reports. Existing entity records whose denominator source is
`fixture_declared_target_calls` remain provisional per-call evidence until a
binary/runtime verification lane upgrades them.

The current SGVAN++ consumer predates several stricter rules in this blueprint.
Treat these as reference gaps to close in a new port rather than behavior to
copy:

- The current tools directly reparse `ALL_Functions.md`; they do not publish
  the portable `catalogue_import.json`, `catalogue_boundary.json`,
  `catalogue_scan_coverage.json`, `catalogue_definition_coverage.json`,
  `callable_catalogue.json`,
  `catalogue_exclusions.json`, `catalogue_gaps.json`, or
  `catalogue_import_audit.json` chain. The
  inspected snapshot's strict compiled-source authority covers 12,546 source
  EIDs, while `repository_static_exhaustiveness_audit.json` reports 289,157
  unresolved records in the broader nonmacro catalogue. These snapshot counts
  describe current SGVAN evidence, not completion of the portable catalogue
  scope. The installed scanner also has built-in skipped directory names, so a
  future conforming refresh needs the independent scan-coverage/supplement rule
  from Section 3. Its implementation uses pattern scanners rather than
  language compiler front ends and labels some language results as a lower
  bound, so a portable exhaustive claim also needs the per-language
  definition-completeness oracle; a visited-file count alone cannot close that
  gap.
- Its entity `summary.complete` is selection-scoped, and a
  `configuration_disabled` row may be accepted by that report. Read the scope,
  selection, and status fields instead of interpreting that flag as
  `runtime_complete(resolved_scope_key, measurement_plan_id)`.
- Its current entity strict gate proves hash-bound authoring and completion of
  selected expected operations. It does not yet prove the two independent
  requirements of binary/runtime target identity and exact target-call
  multiplicity defined in Sections 2.1 and 8.2.
- Dynamic entity rows use per-EID measurement files rather than the curated
  producer's SQLite row-commit path. A portable implementation should put both
  behind the single-writer checkpoint contract in Section 11.4.
- Current resume identity is weaker than Section 11.4: curated rows bind a
  limited run manifest and binary identity; hardware sidecars resume primarily
  by module/row rather than hardware duration, tool, and environment identity;
  dynamic execution identity covers filter, duration/iterations, repetitions,
  CPU, timeout, operation command, and binary but not the full normalized key.
  Do not reuse these current checkpoint formats as the portable key contract.
- Its `run --suite entities` selection executes generated and dynamic entity
  paths, while the direct `entities run` subcommand executes only the dynamic
  inventory. Neither dispatches a required operation to a curated owner. Until the
  ownership-aware planner in Section 11.1 exists, curated aliases must remain
  diagnostic rather than suppressing the entity operation.
- Its entity `hotspots.json` orders individual Google Benchmark CPU samples
  divided by the declared call denominator. Rebuild portable hotspot rankings
  from complete repetition groups, verified denominators, and compatible clock
  scopes as required by Section 14.

Resolve the framework through one pinned vendored, package, or installed
provider as defined in Section 1.2. When vendoring, do not copy individual
headers or hand-assemble its source list; use its supported integration and
disable dependency tests/install rules when embedded unless the project
deliberately enables them.

The reference fork provides these optional, additive capability tiers:

| Capability | Build switch or layer | Required use |
| --- | --- | --- |
| Stock CPU benchmark loop/JSON | base library | Portable baseline |
| Process/thread clocks and TSC diagnostics | suite timer integration | Enable where supported |
| Timed-loop hardware counters | `BENCHMARK_ENABLE_LIBPFM` | Optional; null with reason when unavailable |
| Class/template/lambda entity API | `BENCHMARK_ENABLE_ENTITY` | Useful for declared entity fixtures |
| Python/Node/Go foreign runners | `BENCHMARK_ENABLE_FOREIGN` | Enable only for declared project runtimes |
| GPU shader/device rows | `BENCHMARK_ENABLE_GPU` | Enable only for an in-scope GPU implementation |
| Robust statistics/timer-floor metadata | additive fork reporters | Preserve raw samples and availability credentials |

Classes, templates, and lambdas are separate operation subjects. Framework
registration macros are only compile-time conveniences and are not benchmark
subjects themselves. Class registrations expand construction, destruction,
copy/move, assignment, methods, operators, and callable invocation as applicable.
Template rows carry concrete instantiation identity. Lambda rows carry closure
source identity and capture provenance.

Keep framework changes additive: retain stock public symbols and meanings,
place new fields in namespaced/versioned JSON, and make optional backends compile
out cleanly. Missing permissions, runtimes, devices, counters, or clocks produce
`unavailable`/`unsupported` with a machine-readable reason. They never become
zero and never disappear from the schema.

The framework is not the coverage authority. It times and reports registered
work. The project inventory, fixture ownership, strict completion, and
source/artifact reconciliation remain suite responsibilities.

## 20. Porting playbook for another project

Use this sequence when bringing the design to a new repository:

1. Copy this document, set an authorized SPDX license, and fill the project contract.
2. Resolve a pinned vendored, package, or installed benchmark framework and run
   its untimed/unit conformance tests.
3. Create and schema-validate the project adapter, command ABI, finite scopes,
   provider variants, and component boundary before writing benchmark rows.
4. Build production in every in-scope configuration and retain compile metadata,
   including generated/transpiled product sources and entries.
5. From the repository root run
   `get-all-functions --root <PROJECT_ROOT> --output <PROJECT_ROOT>/ALL_FUNCTIONS.md`,
   then pin the command, raw output,
   normalized semantic, and included-source closure hashes.
6. Losslessly normalize `ALL_FUNCTIONS.md`, generate the hash-bound compiled
   projection and independent scan-coverage report, run the declared
   language-semantic definition-completeness oracles, supplement skipped roots,
   primary-provider omissions, and generated product sources, then reconcile
   both directions without dropping a target callable.
7. Stabilize catalogue IDs, EIDs, compiled-record IDs, and relocation rules.
8. Assign authored/terminal/gap dispositions and drive EID/operation gaps to zero.
9. Author deterministic fixtures and expected operation rows by component shard.
10. Configure/build isolated benchmark modules and validate registrations without timing.
11. Run quick smoke measurements, test crash/resume, and verify report regeneration.
12. Run the sequential strict exhaustive suite into a new dedicated result directory.
13. Rank completed evidence using compatible scopes, rerun finalists on a controlled
    machine, optimize, and confirm end-to-end impact.

Keep generated code deterministic and shard it by component, source file, or
stable EID prefix. Avoid one enormous translation unit and avoid one permanent
binary per callable when thousands of identities are involved. Cache compiled
objects by source closure and compiler-command hash, then retire successfully
measured per-EID executables by default; retain them only with an explicit
debugging option. Record peak disk use and cleanup policy in the manifest.

Start with sequential measurement (`jobs=1`). Parallel build and fixture
validation are appropriate; parallel timing is a labeled triage mode because
the workers contend for CPU frequency, cache, memory bandwidth, and I/O. Do not
pin several timing workers to the same CPU.

When the following block is placed in the repository-root `.gitignore`, use
rules equivalent to:

```gitignore
/micro_benchmarks/.venv/
/micro_benchmarks/.build/
/micro_benchmarks/results/
/micro_benchmarks/.crash/
/micro_benchmarks/generated/.probe/
/micro_benchmarks/generated/.cmake_state.json
/micro_benchmarks/**/__pycache__/
/micro_benchmarks/**/*.py[cod]
/micro_benchmarks/**/.pytest_cache/
/micro_benchmarks/.coverage
/micro_benchmarks/.coverage.*
/micro_benchmarks/htmlcov/
```

Use exact additional build-directory names if the adapter cannot standardize on
`.build/`; do not use a broad `build*` rule that could hide checked-in
`build_support/` or `build_tools/`. Put small reviewed reference results under a
tracked `micro_benchmarks/testdata/` tree rather than partially unignoring the
live results directory. Configure core dumps, perf, Callgrind, Massif, and other
diagnostic outputs below `results/` or `.crash/`; never use broad `core*` rules
that can hide legitimate source files or directories. Never ignore checked-in
generated sources that form the reproducible registration contract unless
generation is guaranteed and verified during every build.
Keep the canonical repository-root `ALL_FUNCTIONS.md` visible to source control
or to the project's explicit reproducible-input policy; never hide it with an
ignore rule that prevents catalogue staleness and review checks.

## 21. Portable conformance tests

Create untimed tests for the framework and project adapter. They must never
execute production benchmark subjects. At minimum test:

- Source, compiled-record, category, and authoring-disposition conservation.
- Direct `get-all-functions --root <PROJECT_ROOT> --output <PROJECT_ROOT>/ALL_FUNCTIONS.md`
  invocation, tool/output hashing, stale-source
  rejection, and lossless raw-row import into `catalogue_import.json`.
- Independent included-file enumeration that catches a provider-skipped
  vendored root, plus retention of generated production code below a build
  directory while excluding benchmark probes and generated harness code.
- A deliberate primary-scanner false negative in every supported language,
  detected by its language-semantic completeness oracle and restored through a
  versioned supplemental record; a lower-bound provider alone must fail the
  exhaustive-callable claim.
- Malformed, uncertain, and conflicting raw/definition records entering
  `catalogue_gaps.json`, closing the conservation equations, and failing strict
  inventory without being relabeled as reviewed exclusions.
- One-to-one reconciliation from every eligible `ALL_FUNCTIONS.md` function,
  class operation, concrete template instantiation, and lambda to its EID and
  required direct rows, including callees that also appear inside other rows.
- Stable EID derivation, collisions, overloads, lambdas, templates, class
  operations, aliases/clones, and reviewed relocation maps.
- Noncircular fixture, ownership, and scope derivation: fixture projections
  exclude ownership/fixture hashes, ownership uses a pre-resolution scope
  definition, and only the resolver joins its hash into `resolved_scope_key`.
- Identical EIDs and manifest hashes after moving a checkout, including a path
  containing spaces and non-ASCII characters.
- Deterministic generated file contents, ordering, and hashes across repeated
  runs and shuffled inventory input.
- Stable `catalogue_semantic_hash` under declared `ALL_FUNCTIONS.md`
  presentation-only changes, with a changed raw hash retained, and semantic-hash
  invalidation for any callable, parser, source-closure, or classification change.
- Stable `catalogue_completeness_proof_key` under presentation-only/raw-audit
  timestamp changes, with invalidation for any changed provider, included
  source, boundary, oracle definition, supplement, join, or verdict.
- Project-adapter schema validation, unknown-major-version rejection, and
  explicit migration of identity-affecting fields.
- Stable scope/measurement keys after changing an unrelated scope, preset map,
  output root, or report option in the same adapter, while a changed referenced
  scope or exact-row behavior projection invalidates only affected identities.
- An unrelated callable/catalogue-record edit changing the scope catalogue hash
  without invalidating another row's measurement key; editing that row's
  catalogue record or dependency closure must invalidate it.
- Blueprint version/hash capture and rejection of unlicensed or provenance-free
  copied fixtures, corpora, extracted source, and vendored framework material.
- Command adapters preserving argument boundaries, working directory, allowed
  environment variables, redaction, exit status, signal, and timeout behavior.
- Command request/result protocol versioning, atomic result writes, malformed or
  missing result rejection, progress-JSONL parsing, and direct-no-shell launch.
- Cross-run identity stability when request/result/pending/native-output files
  move: literal resolved argv remains in launch provenance while canonical
  transport-token argv and identical behavior/input hashes retain the same
  measurement and pass keys.
- Independent recomputation of every measurement/pass key from its immutable
  key-material record, with missing, altered, or mutable-manifest-only preimages
  rejected as corrupt evidence.
- POSIX and Windows argv round trips for empty values, spaces, quotes,
  backslashes, Unicode, wildcard characters, and command metacharacters.
- Vendored, package, and installed framework resolution without embedding a
  developer's absolute checkout path in identity.
- At least two build-provider fixtures, or provider-contract fakes, proving the
  runner does not assume CMake command lines or artifact layout.
- Explicit macro exclusion while retaining callables emitted by expansion.
- EID authoring plus required-operation-matrix closure, including rejection when
  an EID is marked authored but any required operation is still a gap or lacks
  exactly one owner.
- Stale catalogue, source, dependency, fixture, production archive, compiler
  command, benchmark binary, and native-result rejection.
- Expected operation ownership and generated-source/registration equality.
- Active scope-union planning that resolves every referenced ownership manifest
  and fails when any member's required operation is omitted or multiply owned.
- Scope-partition reconciliation that fails when an in-boundary executable EID
  belongs to no atomic scope or is absent from the reviewed exhaustive union.
- Entity-plan dispatch to a qualifying curated owner, suppression of its
  generated duplicate, and one execution/count when the same owner is selected
  through `all`.
- Separate inventory `refresh` and fail-closed `check`: the latter must perform
  no committed-state writes beyond its protocol result/temporary diagnostics
  and must reject stale committed metadata.
- Correct suite and phase authority for workloads, pipelines, entities, and all.
- Orthogonal `suite_role` and `row_role` validation, including a pipeline
  subject and pipeline floor selected by the same suite rule without allowing
  the floor to satisfy callable coverage.
- Declared selector-to-phase routing, including proof that each smoke selector
  bounds its intended producer and that `all` does not silently clear a required
  scope restriction.
- Full-scope versus selected completion under path, kind, EID, module, and limit filters.
- An unfiltered quick/smoke or ordinary comparison plan completing every
  selected row without setting `runtime_complete`, and a frozen eligible
  exhaustive plan setting it only after every full-scope predicate succeeds.
- Terminal disposition validation and fail-closed behavior for authoring gaps.
- Resolved-scope invalidation when callable authoring disposition, terminal
  evidence, ownership, or proof policy changes even if the EID set is unchanged.
- Reconciliation of generated-independent and dynamic-entity producers,
  including duplicate/conflicting operation rejection.
- Required-only entity/all planning plus explicit exploratory opt-in, with every
  selected exploratory row executed and reported but excluded from completion.
- Row crash, timeout, interruption, corrupt pending output, atomic commit, and
  fingerprint-compatible resume.
- Failed/timed-out/skipped attempts never occupying the immutable sample-key
  path, followed by a successful retry creating the sole canonical
  `measurement/1` record for that unchanged sample key.
- A resume invocation creating a new run ID and immutable per-run
  manifest/membership/attempt history, crediting compatible prior evidence
  without overwriting the abandoned run or trusting a top-level latest pointer.
- Historical run reconstruction after checked-in catalogue, scope, ownership,
  fixture, registration, routing, and plan files change, using only each
  membership's immutable content-addressed raw catalogue inputs, planning
  snapshots, and per-run runtime authorities.
- Full-digest filesystem addressing for run, sample, aggregate, EID, and
  operation identities, with rejection of traversal, reserved names, malformed
  digests, collisions, and unsafe display IDs in evidence paths.
- SQLite recovery as the sole completion authority, including proof that a
  pending file, public projection, or append-only attempt-journal entry cannot
  independently mark a row complete.
- `checkpoint-store/1` schema/version and transactional migration tests,
  uniqueness/foreign-key/integrity failures, atomic complete-pass insertion,
  plan-row derivation from all required pass/sample groups, and preservation of
  a clean timing pass when a required sidecar fails.
- Multiple execution workers delivering unique pending rows to one coordinator,
  with a second coordinator rejected by the result-directory lock.
- Ignore-rule fixtures proving a tracked `core.cpp`, source directory named
  `core`, and checked-in generated registration sources remain visible while
  artifacts routed below `results/` and `.crash/` remain ignored.
- Failed/skipped attempts publishing no canonical sample or numeric timing, and
  unavailable metrics in successful records remaining null with
  reason/evidence/method/scope.
- Capability-verdict key stability and invalidation across row, requirement,
  probe/provider, and platform changes; filters/build failures cannot enter the
  reusable unsupported cache or satisfy runtime completion.
- Raw subject iterations versus aggregate sample counts.
- Exact Google Benchmark multithread real/default-CPU/process-CPU aggregation
  formulas, balanced-versus-unbalanced thread intervals, and independent outer
  group-wall/current-process brackets.
- Manual inner-loop call multiplicity versus `KeepRunningBatch(k)` State-count
  advancement and final-batch overshoot.
- Fixture-root calls versus recursive/reentrant observed entries, with rejection
  of descendant-entry counts as a per-root denominator.
- Rejection of sidecar call counts transferred across different calibrated
  iteration schedules, plus acceptance of verified invariant multiplicity times
  the timing pass's actual iterations or a proven identical pinned schedule.
- Measurement-key changes for in-band counters and stable base timing keys for
  separately keyed sidecars, including disclosure of counter-boundary overhead.
- One-shot fresh-process first-call measurement with no target invocation during
  framework probe, calibration, or warmup.
- Pause/resume active-slice accounting and rejection when accumulated clock-pair
  overhead or quantization violates the timer-floor policy.
- Observation-key uniqueness, chunk/slope clustering beneath repetitions and
  process launches, adaptive stopping, schedule order, exclusions,
  autocorrelation handling, and nominal versus effective sample size.
- Observation-key separation for two participants reporting the same measurand
  in the same chunk, with transient OS thread IDs excluded from stable identity.
- Correct per-call normalization for every call-count evidence level.
- Explicit item/byte denominators and rejection of incompatible throughput joins.
- One-to-one JSON-Pointer metric metadata, null availability semantics, exact
  ns/us/ms duration conversion, clock-qualified rate names, and rejection of
  rates or counters with incompatible denominator/PMU/encoding/scaling scope.
- Preservation of raw and multiplex-scaled hardware-counter totals, rejection
  of zero/invalid `time_running` and inadmissible scaling ratios, and derivation
  of per-iteration/per-call values from the explicitly named raw or scaled source.
- Independent wall, reported-real, thread CPU, process CPU, TSC tick, and hardware
  cycle semantics, including TSC/cycle non-equivalence.
- Equal TSC/perf endpoint CPU IDs yielding an unknown migration verdict unless
  single-CPU affinity or scheduler-trace evidence proves no migration, and a
  proven migrated interval failing the configured admissibility policy.
- Calling-thread/worker/current-process overlap and separate child/process-tree
  CPU accounting without double counting.
- Versioned workload, pipeline, entity, and combined suite-runtime authorities,
  including correct selected-subject-row versus callable-operation predicates.
- Explicit-run-ID report-only regeneration performing no timing, preserving
  native/raw evidence and historical authorities, and treating latest-run views
  as nonauthoritative projections.
- Deterministic per-callable JSON indexes whose operation/input/regime joins and
  raw/aggregate references exactly match the authoritative evidence store.
- Immutable measurement evidence reused by a new `run-membership/1` record
  without rewriting suite/scope/selection/plan provenance in the evidence.
- Aggregate-key changes when the estimator, metric, aggregation policy, or
  ordered eligible raw-sample set changes; aggregate records may never reuse a
  raw `sample_key`.
- Pass/sample-key changes for pass-specific binary, tool, counter request,
  timeout, calibration, repetition, warmup, chunk, or schedule changes, while a
  run-local launch/pass ID never acts as a resume key.
- Strict completion returning nonzero for missing, partial, failed, corrupt, or
  stale selected operations.

Add a tiny reference consumer containing a free function, overloaded method,
constructor/destructor, copy/move operations, concrete template instantiation,
capturing and capture-free lambdas, private/file-static companion, spawned
worker, unsupported capability, deliberate crash row, and pipeline companion.
Its pinned expected inventory and result shapes are the fastest way to detect a
port that appears to work while silently losing one callable kind or resume rule.
