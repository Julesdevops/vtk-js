import macro from 'vtk.js/Sources/macros';
import vtkInteractorStyleManipulator from 'vtk.js/Sources/Interaction/Style/InteractorStyleManipulator';
import vtkTrackedHandXRManipulator from 'vtk.js/Sources/Interaction/Manipulators/TrackedHandXRManipulator';

import {
  Device,
  Input,
} from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor/Constants';

function vtkInteractorStyleHMDAR(publicAPI, model) {
  model.classHierarchy.push('vtkInteractorStyleHMDAR');

  const leftHandManipulator = vtkTrackedHandXRManipulator.newInstance();
  const rightHandManipulator = vtkTrackedHandXRManipulator.newInstance();

  leftHandManipulator.setDevice(Device.Left);
  rightHandManipulator.setDevice(Device.Right);

  leftHandManipulator.setInput(Input.A);
  rightHandManipulator.setInput(Input.B);

  model.leftHandManipulator = leftHandManipulator;
  model.rightHandManipulator = rightHandManipulator;

  publicAPI.addVRManipulator(model.leftHandManipulator);
  publicAPI.addVRManipulator(model.rightHandManipulator);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkInteractorStyleManipulator.extend(publicAPI, model, initialValues);

  // Object specific methods
  vtkInteractorStyleHMDAR(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkInteractorStyleHMDAR');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
