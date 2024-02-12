import macro from 'vtk.js/Sources/macros';
import vtkCompositeVRManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeVRManipulator';
import {
  Device,
  Input,
} from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor/Constants';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkLineSource from '@kitware/vtk.js/Filters/Sources/LineSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPicker from '@kitware/vtk.js/Rendering/Core/Picker';
import { vec3, vec4, mat3, mat4, quat } from 'gl-matrix';

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

  function convertQuatToWorld(q, physicalToWorldMatrix) {
    // const axis = vec3.create();
    // const angle = quat.getAxisAngle(axis, q);

    // transform axis in world coordinate system
    // const worldAxis = vec4.fromValues(...axis, 0.0);
    // vec4.transformMat4(worldAxis, worldAxis, physicalToWorldMatrix);

    const matrix = mat4.fromQuat([], q);
    mat4.multiply(matrix, physicalToWorldMatrix, matrix);
    const rotation = mat3.fromMat4([], matrix);

    const outQ = quat.fromMat3([], rotation);

    // const outQ = quat.setAxisAngle([], worldAxis, angle);
    return quat.normalize([], outQ);
  }

  function positionProp(
    prop,
    physicalPosition,
    physicalOrientation,
    physicalToWorldMatrix
  ) {
    const translation = [];
    vec3.subtract(translation, physicalPosition, model.lastPhysicalPosition);

    // const lastPhysicalAngle = [];
    // const orientationAngle = quat.getAxisAngle(
    //   lastPhysicalAngle,
    //   model.lastPhysicalOrientation
    // );

    // const q1 = quat.create();
    // quat.setAxisAngle(q1, lastWorldOrientationAxis, lastWorldOrientationAngle);
    // const quatPhysicalOrientation = quat.fromValues(...physicalOrientation);
    // const worldOrientationAxis = vec3.fromValues(
    //   model.lastWorldOrientation[0],
    //   model.lastWorldOrientation[1],
    //   model.lastWorldOrientation[2]
    // );

    // const worldOrientationAxis = [];
    // const worldOrientationAngle = quat.getAxisAngle(
    //   worldOrientationAxis,
    //   worldOrientation
    // );

    // const q2 = quat.create();
    // quat.setAxisAngle(q2, worldOrientationAxis, worldOrientationAngle);

    const worldOrientation = convertQuatToWorld(
      physicalOrientation,
      physicalToWorldMatrix
    );
    const lastWorldOrientation = convertQuatToWorld(
      model.lastPhysicalOrientation,
      physicalToWorldMatrix
    );

    console.log({
      worldOrientation: [...worldOrientation],
      lastWorldOrientation: [...lastWorldOrientation],
    });

    const lastWorldOrientationConjugated = quat.conjugate(
      [],
      lastWorldOrientation
    );
    const orientation = [];
    quat.multiply(
      orientation,
      worldOrientation,
      lastWorldOrientationConjugated
    );
    console.log({ orientation });

    let worldAxis = [];
    let angle = quat.getAxisAngle(worldAxis, orientation);
    console.log({ angle, worldAxis });

    if (Number.isNaN(angle)) {
      angle = 0.0;
      worldAxis = [0, 0, 1];
    }

    const wxyz = [
      vtkMath.degreesFromRadians(angle),
      worldAxis[0],
      worldAxis[1],
      worldAxis[2],
    ];
    const transform = mat4.create();
    mat4.translate(transform, transform, physicalPosition);

    // mat4.rotate(transform, transform, angle, axis);
    // mat4.rotateY(transform, transform, 0.15);

    mat4.translate(transform, transform, vec3.negate([], physicalPosition));
    mat4.translate(transform, transform, translation);

    mat4.multiply(transform, physicalToWorldMatrix, transform);

    const userMatrix = prop.getUserMatrix();
    mat4.multiply(transform, transform, userMatrix);

    const m = transform;

    // console.log({ transform });

    const currentPropPosition = prop.getPosition();

    const newPropPosition = vec3.create();

    const worldTranslation = vec4.fromValues(...translation, 0.0);
    vec4.transformMat4(
      worldTranslation,
      worldTranslation,
      physicalToWorldMatrix
    );

    vec3.add(newPropPosition, currentPropPosition, worldTranslation);

    // const newPose = vec3.subtract([], worldPosition, translation);

    // console.log({ newPose });
    // prop.setPosition(newPose);

    // const degreeAngle = vtkMath.degreesFromRadians(angle);
    // console.log({ degreeAngle, axis });

    // if (Number.isNaN(degreeAngle)) {
    //   console.log({
    //     degreeAngle,
    //     angle,
    //     q2: [...q2],
    //     worldOrientationAngle,
    //     worldOrientationAxis: [...worldOrientationAxis],
    //     lastWorldOrientationAngle,
    //     lastWorldOrientationAxis: [...lastWorldOrientationAxis]
    //   });
    // }
    // prop.rotateWXYZ(degreeAngle, ...axis);
    prop.setPosition(newPropPosition);
    console.log({ wxyz });
    prop.rotateWXYZ(...wxyz);
    // prop.setUserMatrix(m);
  }

  function getWorldOrientationQuaternionFromXRPoseMatrix(
    physicalToWorldMatrix,
    poseMatrix
  ) {
    const hvright = [poseMatrix[0], poseMatrix[1], poseMatrix[2]];
    const hvup = [poseMatrix[4], poseMatrix[5], poseMatrix[6]];

    console.log({ hvright, hvup });

    // convert axes to world coordinates

    vec3.transformMat4(hvright, hvright, physicalToWorldMatrix);
    vec3.transformMat4(hvup, hvup, physicalToWorldMatrix);

    const wdir = [];
    vtkMath.cross(hvright, hvup, wdir);

    const ortho = mat3.fromValues(
      hvright[0],
      hvup[0],
      -wdir[0],
      hvright[1],
      hvup[1],
      -wdir[1],
      hvright[2],
      hvup[2],
      -wdir[2]
    );

    const wxyz = [];
    quat.fromMat3(wxyz, ortho);

    console.log({ ortho, wxyz });

    const mag = Math.sqrt(
      wxyz[1] * wxyz[1] + wxyz[2] * wxyz[2] + wxyz[3] * wxyz[3]
    );

    if (mag !== 0.0) {
      wxyz[0] = 2.0 * vtkMath.degreesFromRadians(Math.atan2(mag, wxyz[0]));
      wxyz[1] /= mag;
      wxyz[2] /= mag;
      wxyz[3] /= mag;
    } else {
      wxyz[0] = 0.0;
      wxyz[1] = 0.0;
      wxyz[2] = 0.0;
      wxyz[3] = 1.0;
    }

    return wxyz;
  }

  publicAPI.onButton3D = (interactorStyle, state, eventData) => {
    const camera = eventData.pokedRenderer.getActiveCamera();
    const physicalToWorldMatrix = [];
    camera.getPhysicalToWorldMatrix(physicalToWorldMatrix);

    const targetRayPos = vec3.fromValues(
      eventData.trPose.transform.position.x,
      eventData.trPose.transform.position.y,
      eventData.trPose.transform.position.z
    );

    const targetRayDirection = camera.physicalOrientationToWorldDirection([
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
      const wp1 = [...targetRayWorldPos, 1.0];
      const wp2 = [
        wp1[0] - targetRayDirection[0] * dist,
        wp1[1] - targetRayDirection[1] * dist,
        wp1[2] - targetRayDirection[2] * dist,
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
      }
    }
  };

  publicAPI.onMove3D = (interactorStyle, state, eventData) => {
    const camera = eventData.pokedRenderer.getActiveCamera();

    const physicalToWorldMatrix = [];
    camera.getPhysicalToWorldMatrix(physicalToWorldMatrix);

    const targetRayPosition = vec3.fromValues(
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

    const targetRayWorldPosition = vec3.transformMat4(
      [],
      targetRayPosition,
      physicalToWorldMatrix
    );

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
        targetRayWorldPosition[0] - dir[0] * dist,
        targetRayWorldPosition[1] - dir[1] * dist,
        targetRayWorldPosition[2] - dir[2] * dist
      );
      leftTargetRayLineSource.setPoint2(...targetRayWorldPosition);
    }

    // right hand
    if (eventData.device === Device.RightController) {
      if (!rightOk) {
        eventData.pokedRenderer.addActor(rightTargetRayActor);
        rightOk = true;
      }

      rightTargetRayLineSource.setPoint1(
        targetRayWorldPosition[0] - dir[0] * dist,
        targetRayWorldPosition[1] - dir[1] * dist,
        targetRayWorldPosition[2] - dir[2] * dist
      );
      rightTargetRayLineSource.setPoint2(...targetRayWorldPosition);
    }

    if (pickedActor && pickDevice === eventData.device) {
      // const poseMatrix = eventData.trPose.transform.matrix;
      // console.log({ poseMatrix });

      // Get world orientation quaternion
      // const wxyz = getWorldOrientationQuaternionFromXRPoseMatrix(
      //   physicalToWorldMatrix,
      //   poseMatrix
      // );
      // const wxyz = eventData.trPose.transform.orientation;

      const wxyz = quat.fromValues(
        eventData.trPose.transform.orientation.x,
        eventData.trPose.transform.orientation.y,
        eventData.trPose.transform.orientation.z,
        eventData.trPose.transform.orientation.w
      ); // orientation is a unit quaternion.

      if (model.lastPhysicalOrientation && model.lastPhysicalPosition) {
        // console.log({
        //   targetRayWorldPosition: [...targetRayWorldPosition],
        //   wxyz: [...wxyz],
        //   lwori: [...model.lastWorldOrientation],
        //   lwpos: [...model.lastWorldPosition],
        // });
        positionProp(
          pickedActor,
          targetRayPosition,
          [...wxyz],
          physicalToWorldMatrix
        );
      }

      model.lastPhysicalOrientation = [...wxyz];
      // model.lastWorldPosition = [...targetRayWorldPosition];
      model.lastPhysicalPosition = [...targetRayPosition];
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
  macro.get(publicAPI, model, ['lastPhysicalPosition', 'lastPhysicalPosition']);
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
