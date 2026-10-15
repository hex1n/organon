# Adapter: RPC

Discover exported operations, addressing and envelopes from the project's active
RPC path. Use project facts rather than assumed framework defaults.

## Interface Discovery

+ Find service interfaces and implementations. One interface method normally maps to one remote operation.
+ Use framework markers as search anchors, not as defaults: SOFABoot `@SofaService`, Dubbo `@DubboService`, gRPC `.proto` stubs, or the project's equivalent export mechanism.
+ Discover naming and file layout from the target project. Common names such as `*Facade.java`, `*Service.java`, and `*Impl.java` are search seeds only.
+ Completion criterion: interface, implementation, operation method, and model classes are all located in the target project.

## Address And Envelope

+ Operation identifier: if the method has a gateway or dispatch annotation whose value is the external operation key, use that value; otherwise use service interface plus method name.
+ Base endpoint: read configuration, gateway setup, README, or deployment docs. If it remains unknown, name the missing source. Ask only when finishing the scope requires a user-owned decision.
+ Request envelope: if calls go through a gateway dispatch object, read the outer request object that carries operation identifier and business payload.
+ Response envelope: read the common wrapper returned by the interface or implementation, including success flag, code, message, data, trace id, or equivalent fields.
+ RPC request fields live in the request object or envelope. Omit the Position column unless the verified transport envelope needs it.

## Auth

Read existing declarations only. Leave missing auth unchanged in code.
Identify method/class annotations, gateway filters, interceptors, or AOP checks
that validate identity, token, role, or permission.
If auth cannot be established, mark it unknown and name the missing source.
Ask only when finishing the requested scope needs a user-owned decision.

## Requiredness

Inspect active entry validation, validation groups, schema presence semantics,
custom assertions and defaults. `@Valid` cascades into a present object;
it does not require non-null. Distinguish omitted, null, empty and conditionally
required values. Record intended requirements separately from enforcement
discrepancies. If the active validation path cannot be established, mark it
unknown.

## ID Type

Use the wire contract type declared by the interface or model. If persistence uses a different type, document the wire type and mention the mismatch only when it affects callers.
