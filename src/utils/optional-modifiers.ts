import { FromModifierParam, SideMultiModifierAlias } from '../config/modifier'
import { ModifierKeyAlias } from './key-alias'
import { MultiModifierAlias, NamedMultiModifierAlias } from './multi-modifier'

const optionalAnyAliases = ['optionalAny', '?any', '??'] as const
export type OptionalAnyAlias = (typeof optionalAnyAliases)[number]

export type OptionalModifierAlias = `?${
  | ModifierKeyAlias
  | Exclude<MultiModifierAlias, NamedMultiModifierAlias>
  | SideMultiModifierAlias}`

export function isOptionalAnyAlias(src: any): src is OptionalAnyAlias {
  if (!src || typeof src !== 'string') return false
  return optionalAnyAliases.includes(src as OptionalAnyAlias)
}

export type FromOptionalModifierParam =
  | OptionalAnyAlias
  | { optional: FromModifierParam }
  | OptionalModifierAlias

export function isOptionalModifierAlias(
  src: string,
): src is OptionalModifierAlias {
  return /^\?(left|l|<|‹|right|r|>|›)?([⌘⌥⌃⇧⇪]*)$/.test(src)
}