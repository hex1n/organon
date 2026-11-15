# Adapter: HTTP / REST

An HTTP interface is a method plus a path. Discover both, and everything bound
to them, from how this project declares routes; the framework names below are
search seeds, not defaults.

## Interface Discovery

+ A published schema (OpenAPI, JSON Schema, GraphQL SDL) is the first source when the project keeps one current; check it against the route code it describes.
+ Otherwise find the route declarations: controller annotations (Spring `@GetMapping`, ASP.NET `[HttpGet]`, NestJS `@Get`), router registrations (Express, Koa, Gin, chi), or decorators (FastAPI, Flask).
+ Full path is every prefix that applies plus the route's own path: gateway prefix, application context or mount path, router or class-level prefix, method-level path.
+ Verify module layout in the target project; do not assume a fixed package or directory.
+ Completion criterion: handler, HTTP method, full path, request model, and response model are located.

## Address And Response Wrapper

+ Base URL: read server port, context or mount path, gateway prefix, README, or deployment docs.
+ API line: write `METHOD {baseUrl}{prefix}{path}` or the project profile's equivalent.
+ Response wrapper: if the project wraps all responses, read the wrapper fields and document the wrapper in the conventions section. The response table expands the business payload.
+ Status codes: record the ones the handler and its error middleware actually produce.

## Parameter Positions

HTTP request tables include a Position column: `path`, `query`, `header`,
`cookie`, or `body`. Read the position from the binding the handler uses, such
as a parameter annotation, a typed extractor, or the request property it reads.
For a request body, follow object fields to their leaves and mark them `body`.

## Auth

Read existing declarations only: method or class annotations, route guards,
middleware, filters, interceptors, security configuration, and path-prefix
rules. If auth cannot be established, mark it `unconfirmed` and name the missing
source in the reply. Ask only when finishing the requested scope needs a
user-owned decision.

## Requiredness

+ Resolve requiredness per concrete route and active parameter binding, including optional parameter types and declared defaults; document the effective default.
+ A path variable in a matched route template is required. Where a framework lets one handler serve a route without the variable, document the routes separately.
+ Query and header parameters: read the binding's own rule (required by default in some frameworks, optional in others) and any validation that can still reject the bound value.
+ Body fields: inspect the validation that actually runs on this route, whether a schema library, validation annotations with their groups, a deserializer, or hand-written checks. A cascade into a nested object validates it when present; it does not make the object required. Record conditional constraints explicitly. A missing rule alone does not prove optionality.
+ Distinguish an absent request body from an absent, null, or empty field.

## ID Type

Use the wire type declared by the handler signature, schema, or DTO.
