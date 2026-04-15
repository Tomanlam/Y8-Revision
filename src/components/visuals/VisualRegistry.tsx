import React from 'react';
import * as Unit1 from './Unit1Visuals';
import * as Unit2 from './Unit2Visuals';

interface VisualProps {
  isAssistMode: boolean;
  chineseType: 'traditional' | 'simplified';
}

export type VisualComponent = React.ComponentType<VisualProps>;

export const visualRegistry: { [unitId: number]: { [conceptIndex: number]: VisualComponent } } = {
  1: {
    0: Unit1.ChemicalFormulas,
    1: Unit1.HeartPump,
    2: Unit1.RespirationEquation,
    3: Unit1.MitochondrionAnimation,
    4: Unit1.BloodComponents,
    7: Unit1.ImmuneDefense,
    12: Unit1.AlveoliExchange,
    18: Unit1.BreathingSimulation,
  },
  2: {
    1: Unit2.DissolvingAnimation,
    6: Unit2.MassConservation,
    7: Unit2.ConcentrationVisualizer,
    11: Unit2.SolubilityCurve,
    16: Unit2.SeparationTechniques,
    17: Unit2.ChromatographyAnimation,
  }
};

export const getVisual = (unitId: number, conceptIndex: number): VisualComponent | null => {
  return visualRegistry[unitId]?.[conceptIndex] || null;
};
