import React from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  KeyRound,
  Lightbulb,
  MapPin,
  Puzzle,
  Search,
  User,
} from 'lucide-react';
import { FindingCategory, TeamCardStatus } from '../../types/collaboration';

export function FindingCategoryIcon({
  category,
  size = 13,
}: {
  category: FindingCategory;
  size?: number;
}) {
  switch (category) {
    case 'code':
      return <KeyRound size={size} aria-hidden="true" />;
    case 'person':
      return <User size={size} aria-hidden="true" />;
    case 'date':
      return <Calendar size={size} aria-hidden="true" />;
    case 'location':
      return <MapPin size={size} aria-hidden="true" />;
    case 'theory':
    default:
      return <Lightbulb size={size} aria-hidden="true" />;
  }
}

export function TeamStatusIcon({
  status,
  size = 12,
}: {
  status: TeamCardStatus;
  size?: number;
}) {
  switch (status) {
    case 'has_clue':
      return <AlertTriangle size={size} aria-hidden="true" />;
    case 'stuck':
      return <Puzzle size={size} aria-hidden="true" />;
    case 'exhausted':
      return <CheckCircle2 size={size} aria-hidden="true" />;
    case 'unexplored':
    default:
      return <Search size={size} aria-hidden="true" />;
  }
}
