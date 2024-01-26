import macro from 'vtk.js/Sources/macros';
import vtkInteractorStyleManipulator from 'vtk.js/Sources/Interaction/Style/InteractorStyleManipulator';
import vtkTrackedHandXRManipulator from 'vtk.js/Sources/Interaction/Manipulators/TrackedHandXRManipulator';

import {
  Device,
  Input,
} from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor/Constants';

function vtkInteractorStyleHMDXR(publicAPI, model) {
  model.classHierarchy.push('vtkInteractorStyleHMDXR');

  model.TrackedHandXRManipulator = vtkTrackedHandXRManipulator.newInstance();

  model.TrackedHandXRManipulator.setDevice(Device.Right);
  model.TrackedHandXRManipulator.setInput(Input.A);

  publicAPI.addVRManipulator(model.TrackedHandXRManipulator);

  publicAPI.setPicker = function setPicker(picker) {
    model.TrackedHandXRManipulator.setPicker(picker);
  };
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
  vtkInteractorStyleHMDXR(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkInteractorStyleHMDXR');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
