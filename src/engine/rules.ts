import type { TimeSlot, Visitor } from '../types/index.js';

export interface RuleResult {
  valid: boolean;
  ruleName: string;
}

export interface ApplyRulesResult {
  valid: boolean;
  violations: string[];
}

export function invalidCapacity(slot: TimeSlot): RuleResult {
  const valid = slot.capacity !== undefined && slot.capacity > 0;
  return { valid, ruleName: 'invalidCapacity' };
}

export function isAvailable(slot: TimeSlot, visitor: Visitor): RuleResult {
  const slotStart = new Date(slot.start).getTime();
  const slotEnd = new Date(slot.end).getTime();
  const from = new Date(visitor.availableFrom).getTime();
  const to = new Date(visitor.availableTo).getTime();
  const valid = slotStart >= from && slotEnd <= to;
  return { valid, ruleName: 'isAvailable' };
}

export function hasCapacity(slot: TimeSlot): RuleResult {
  const capacity = slot.capacity ?? 0;
  const attendance = slot.estimatedAttendance ?? capacity * 0.5;
  const valid = attendance < capacity;
  return { valid, ruleName: 'hasCapacity' };
}

export function withinCrowdComfort(slot: TimeSlot, visitor: Visitor): RuleResult {
  const capacity = slot.capacity ?? 0;
  const attendance = slot.estimatedAttendance ?? capacity * 0.5;
  const ratio = capacity > 0 ? attendance / capacity : 1;
  const valid = ratio <= visitor.maxCrowdRatio;
  return { valid, ruleName: 'withinCrowdComfort' };
}

export function applyRules(slot: TimeSlot | null | undefined, visitor: Visitor | null | undefined): ApplyRulesResult {
  if (!slot) throw new Error('slot must not be null or undefined');
  if (!visitor) throw new Error('visitor must not be null or undefined');

  const results = [
    invalidCapacity(slot),
    isAvailable(slot, visitor),
    hasCapacity(slot),
    withinCrowdComfort(slot, visitor),
  ];
  const violations = results.filter((r) => !r.valid).map((r) => r.ruleName);
  return { valid: violations.length === 0, violations };
}
