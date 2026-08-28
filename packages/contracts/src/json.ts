import { z } from 'zod';

export type JsonPrimitive = string | number | boolean | null;
export type JsonArray = readonly JsonValue[];
export type JsonObject = { readonly [key: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonArray | JsonObject;

function isDataProperty(descriptor: PropertyDescriptor | undefined): descriptor is PropertyDescriptor & { value: unknown } {
  return Boolean(descriptor && descriptor.enumerable && 'value' in descriptor);
}

function isJsonValueInternal(value: unknown, ancestors: WeakSet<object>): value is JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object') return false;
  if (ancestors.has(value)) return false;

  const prototype = Object.getPrototypeOf(value);
  if (Array.isArray(value)) {
    if (prototype !== Array.prototype || Reflect.ownKeys(value).length !== value.length + 1) return false;
    ancestors.add(value);
    const valid = value.every((entry, index) => (
      Object.hasOwn(value, index) && isJsonValueInternal(entry, ancestors)
    ));
    ancestors.delete(value);
    return valid;
  }

  if (prototype !== Object.prototype && prototype !== null) return false;
  ancestors.add(value);
  const valid = Reflect.ownKeys(value).every((key) => {
    if (typeof key !== 'string') return false;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return isDataProperty(descriptor) && isJsonValueInternal(descriptor.value, ancestors);
  });
  ancestors.delete(value);
  return valid;
}

export function isJsonValue(value: unknown): value is JsonValue {
  try {
    return isJsonValueInternal(value, new WeakSet());
  } catch {
    return false;
  }
}

export function isJsonObject(value: unknown): value is JsonObject {
  return isJsonValue(value) && value !== null && !Array.isArray(value) && typeof value === 'object';
}

export const JsonValueSchema = z.custom<JsonValue>(isJsonValue, {
  error: 'Expected a finite, acyclic JSON-safe value.'
});

export const JsonObjectSchema = z.custom<JsonObject>(isJsonObject, {
  error: 'Expected a plain JSON-safe object.'
});
