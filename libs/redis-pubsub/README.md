# @rosreestr-extracts/redis-pubsub

Redis Pub/Sub library for delivering verification codes (SMS, Captcha) to the order processing worker.

## Overview

This library provides a reliable mechanism for delivering verification codes from external services to the worker through Redis Pub/Sub channels.

## Features

- **Publisher Service**: Publish codes to Redis channels
- **Subscriber Service**: Subscribe to Redis channels and wait for codes
- **Type Safety**: Full TypeScript support with interfaces
- **Timeout Handling**: Configurable timeouts for code delivery
- **Multi-type Support**: Handles both SMS and Captcha codes

## Usage

### Publishing Codes (in api-gateway)

```typescript
import { RedisPubSubService, CodeType } from '@rosreestr-extracts/redis-pubsub';

// Publish SMS code
await redisPubSubService.publishCode({
  rosreestrUserName: 'user@example.com',
  type: CodeType.SMS,
  code: '123456',
});
```

### Subscribing to Codes (in worker)

```typescript
import { RedisSubscriberService, CodeType } from '@rosreestr-extracts/redis-pubsub';

// Wait for SMS code with timeout
const code = await redisSubscriberService.waitForCode(
  'user@example.com',
  CodeType.SMS,
  300000 // 5 minutes timeout
);
```

## Configuration

Set Redis connection parameters via environment variables (same as queue configuration):

```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```
