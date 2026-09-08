## Service Template

### Interface

```typescript
interface {{service_name}}Service {
  create(data: Create{{service_name}}Input): Promise<{{service_name}}>;
  get(id: string): Promise<{{service_name}}>;
  list(filter?: {{service_name}}Filter): Promise<{{service_name}}[]>;
}
```

### Implementation

- import the interface and types
- implement each method using the data layer
- handle errors with typed exceptions
- log input/output at DEBUG level

### Testing

- unit test each method with mocked data layer
- test success and error paths
- use descriptive test names
