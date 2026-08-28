import { z } from 'zod';

declare const brand: unique symbol;

export type BrandedId<Name extends string> = string & { readonly [brand]: Name };
export type PanelId = BrandedId<'PanelId'>;
export type WidgetInstanceId = BrandedId<'WidgetInstanceId'>;
export type WidgetType = BrandedId<'WidgetType'>;

function idSchema<Name extends string>(name: Name) {
  return z.string().refine(
    (value) => value.length > 0 && value.trim() === value,
    { message: `${name} must be non-empty and contain no surrounding whitespace.` }
  ).transform((value) => value as BrandedId<Name>);
}

export const PanelIdSchema = idSchema('PanelId');
export const WidgetInstanceIdSchema = idSchema('WidgetInstanceId');
export const WidgetTypeSchema = idSchema('WidgetType');

export function asPanelId(value: string): PanelId {
  return PanelIdSchema.parse(value);
}

export function asWidgetInstanceId(value: string): WidgetInstanceId {
  return WidgetInstanceIdSchema.parse(value);
}

export function asWidgetType(value: string): WidgetType {
  return WidgetTypeSchema.parse(value);
}
