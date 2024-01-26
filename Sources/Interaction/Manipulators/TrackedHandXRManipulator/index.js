import macro from 'vtk.js/Sources/macros';
import vtkCompositeVRManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeVRManipulator';
import {
  Device,
  Input,
} from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor/Constants';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkLineSource from '@kitware/vtk.js/Filters/Sources/LineSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPicker from '@kitware/vtk.js/Rendering/Core/Picker';
import { vec3 } from 'gl-matrix';

// ----------------------------------------------------------------------------
// vtkTrackedHandXRManipulator methods
// ----------------------------------------------------------------------------
// currently picked actor if any

function vtkTrackedHandXRManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTrackedHandXRManipulator');

  let pickedActor;
  let initialActorPosition; // position of the picked actor at the time if was picked in world coordinates
  let initialPickControllerPosition; // space of the controller that picked the actor at the time it picked the actor
  let pickDevice; // id of the device/controller that did picking

  model.picker = vtkPicker.newInstance();

  // actors for target ray drawing
  const leftTargetRayLineSource = vtkLineSource.newInstance();
  const rightTargetRayLineSource = vtkLineSource.newInstance();

  const leftTargetRayMapper = vtkMapper.newInstance();
  const rightTargetRayMapper = vtkMapper.newInstance();
  leftTargetRayMapper.setInputConnection(
    leftTargetRayLineSource.getOutputPort()
  );
  rightTargetRayMapper.setInputConnection(
    rightTargetRayLineSource.getOutputPort()
  );

  const leftTargetRayActor = vtkActor.newInstance();
  leftTargetRayActor.getProperty().setColor(1, 0, 0);
  leftTargetRayActor.getProperty().setLineWidth(5);

  const rightTargetRayActor = vtkActor.newInstance();
  rightTargetRayActor.getProperty().setColor(1, 0, 0);
  rightTargetRayActor.getProperty().setLineWidth(5);

  leftTargetRayActor.setMapper(leftTargetRayMapper);
  rightTargetRayActor.setMapper(rightTargetRayMapper);

  leftTargetRayActor.setPickable(false);
  rightTargetRayActor.setPickable(false);

  let leftOk = false;
  let rightOk = false;

  publicAPI.onButton3D = (interactorStyle, state, eventData) => {
    const camera = eventData.pokedRenderer.getActiveCamera();
    const physicalToWorldMatrix = [];
    camera.getPhysicalToWorldMatrix(physicalToWorldMatrix);

    const targetRayPos = vec3.fromValues(
      eventData.trPose.transform.position.x,
      eventData.trPose.transform.position.y,
      eventData.trPose.transform.position.z
    );

    const targetRayOrientation = camera.physicalOrientationToWorldDirection([
      eventData.trPose.transform.orientation.x,
      eventData.trPose.transform.orientation.y,
      eventData.trPose.transform.orientation.z,
      eventData.trPose.transform.orientation.w,
    ]);
    const targetRayWorldPos = [];
    vec3.transformMat4(targetRayWorldPos, targetRayPos, physicalToWorldMatrix);

    const dist = eventData.pokedRenderer
      .getActiveCamera()
      .getClippingRange()[1];

    if (eventData.pressed) {
      console.debug('user is pinching: do some picking');

      const wp1 = [...targetRayWorldPos, 1.0];
      const wp2 = [
        wp1[0] - targetRayOrientation[0] * dist,
        wp1[1] - targetRayOrientation[1] * dist,
        wp1[2] - targetRayOrientation[2] * dist,
        1.0,
      ];

      // do the picking, lookup picked actors and take action if we have some.
      model.picker.pick3DPoint(wp1, wp2, eventData.pokedRenderer);
      const actors = model.picker.getActors();

      if (actors.length > 0) {
        actors[0].getProperty().setColor(0.0, 1.0, 0.0);
        pickedActor = actors[0];
        initialActorPosition = pickedActor.getPosition();
        initialPickControllerPosition = structuredClone(targetRayWorldPos);
        pickDevice = eventData.device;
        console.debug('picked something!');
      } else {
        if (pickedActor) {
          pickedActor.getProperty().setColor(0.0, 0.0, 1.0);
          pickedActor = undefined;
          initialActorPosition = undefined;
          initialPickControllerPosition = undefined;
          pickDevice = undefined;
        }
        console.debug('picked nothing!');
      }
    }
  };

  publicAPI.onMove3D = (interactorStyle, state, eventData) => {
    const camera = eventData.pokedRenderer.getActiveCamera();

    const physicalToWorldMatrix = [];
    camera.getPhysicalToWorldMatrix(physicalToWorldMatrix);

    const targetRayPos = vec3.fromValues(
      eventData.trPose.transform.position.x,
      eventData.trPose.transform.position.y,
      eventData.trPose.transform.position.z
    );

    // const gripPos = vec3.fromValues(
    //   eventData.position.x,
    //   eventData.position.y,
    //   eventData.position.z
    // );
    // vec3.transformMat4(gripPos, gripPos, physicalToWorldMatrix);

    const dir = camera.physicalOrientationToWorldDirection([
      eventData.trPose.transform.orientation.x,
      eventData.trPose.transform.orientation.y,
      eventData.trPose.transform.orientation.z,
      eventData.trPose.transform.orientation.w,
    ]); // orientation is a unit quaternion.

    vec3.transformMat4(targetRayPos, targetRayPos, physicalToWorldMatrix);

    const dist = eventData.pokedRenderer
      .getActiveCamera()
      .getClippingRange()[1];

    // left hand
    if (eventData.device === Device.LeftController) {
      if (!leftOk) {
        eventData.pokedRenderer.addActor(leftTargetRayActor);
        leftOk = true;
      }
      leftTargetRayLineSource.setPoint1(
        targetRayPos[0] - dir[0] * dist,
        targetRayPos[1] - dir[1] * dist,
        targetRayPos[2] - dir[2] * dist
      );
      leftTargetRayLineSource.setPoint2(...targetRayPos);
    }

    // right hand
    if (eventData.device === Device.RightController) {
      if (!rightOk) {
        eventData.pokedRenderer.addActor(rightTargetRayActor);
        rightOk = true;
      }

      rightTargetRayLineSource.setPoint1(
        targetRayPos[0] - dir[0] * dist,
        targetRayPos[1] - dir[1] * dist,
        targetRayPos[2] - dir[2] * dist
      );
      rightTargetRayLineSource.setPoint2(...targetRayPos);
    }

    if (pickedActor && pickDevice === eventData.device) {
      const displacement = [];
      vec3.subtract(displacement, targetRayPos, initialPickControllerPosition);
      const newActorPos = [];
      vec3.add(newActorPos, displacement, initialActorPosition);

      pickedActor.setPosition(...newActorPos);
    }

    window.renderWindow.render();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  device: Device.RightController,
  input: Input.TrackPad,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.setGet(publicAPI, model, ['picker']);
  macro.obj(publicAPI, model);
  vtkCompositeVRManipulator.extend(publicAPI, model, initialValues);

  // Object specific methods
  vtkTrackedHandXRManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkTrackedHandXRManipulator'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
