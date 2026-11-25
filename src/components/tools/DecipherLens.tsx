import React from 'react';
import SignalReconstructor, { SignalReconstructorProps } from './SignalReconstructor';

export type DecipherLensProps = SignalReconstructorProps;

export default function DecipherLens(props: DecipherLensProps) {
  return <SignalReconstructor {...props} />;
}
