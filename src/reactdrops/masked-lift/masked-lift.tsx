"use client";

import { forwardRef } from 'react';
import { LiftEngine, type LiftTextHandle, type LiftTextProps } from '../shared/lift-engine';

export type MaskedLiftTextHandle = LiftTextHandle;
export type MaskedLiftTextProps = LiftTextProps;

/** Reveal complete lines together, with one mask and stagger per line. */
export const MaskedLiftText = forwardRef<MaskedLiftTextHandle, MaskedLiftTextProps>(
  function MaskedLiftText(props, ref) {
    return <LiftEngine {...props} ref={ref} mode="lines" />;
  },
);
