import macro from 'vtk.js/Sources/macros';
import vtkInteractorStyleManipulator from 'vtk.js/Sources/Interaction/Style/InteractorStyleManipulator';
import vtkPicker from 'vtk.js/Sources/Rendering/Core/Picker';
import vtk3DControllerModelSelectorManipulator from 'vtk.js/Sources/Interaction/Manipulators/3DControllerModelSelectorManipulator';

import {
  Device,
  Input,
} from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor/Constants';

function vtkInteractorStyleHMDXR(publicAPI, model) {
  model.classHierarchy.push('vtkInteractorStyleHMDXR');

  const defaultLeftPicker = vtkPicker.newInstance();
  const defaultRIghtPicker = vtkPicker.newInstance();

  const leftHandManipulator =
    vtk3DControllerModelSelectorManipulator.newInstance();
  const rightHandManipulator =
    vtk3DControllerModelSelectorManipulator.newInstance();

  leftHandManipulator.setDevice(Device.LeftController);
  rightHandManipulator.setDevice(Device.RightController);

  leftHandManipulator.setInput(Input.A);
  rightHandManipulator.setInput(Input.A);

  model.leftHandManipulator = leftHandManipulator;
  model.rightHandManipulator = rightHandManipulator;

  model.leftHandManipulator.setPicker(defaultLeftPicker);
  model.rightHandManipulator.setPicker(defaultRIghtPicker);

  publicAPI.addVRManipulator(model.leftHandManipulator);
  publicAPI.addVRManipulator(model.rightHandManipulator);

  publicAPI.setPicker = function setPicker(picker) {
    model.leftHandManipulator.setPicker(picker);
    model.rightHandManipulator.setPicker(picker);
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
