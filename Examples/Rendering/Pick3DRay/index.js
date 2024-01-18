import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
// import vtkCellPicker from 'vtk.js/Sources/Rendering/Core/CellPicker';
import vtkPicker from 'vtk.js/Sources/Rendering/Core/Picker';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
// import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkLineSource from 'vtk.js/Sources/Filters/Sources/LineSource';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const background = [0, 0, 0];
const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background,
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Add a cone source
// ----------------------------------------------------------------------------
const cone = vtkConeSource.newInstance();
const mapper = vtkMapper.newInstance();
mapper.setInputData(cone.getOutputData());
const actor = vtkActor.newInstance();
actor.setMapper(mapper);
actor.getProperty().setColor(0.0, 0.0, 1.0);

renderer.addActor(actor);

const p = [-5, 10, 0];
const ori = [1, 0, 0];

const p2 = [...ori];
vtkMath.multiplyScalar(p2, 30);
vtkMath.add(p, p2, p2);
const lineSource = vtkLineSource.newInstance({
  resolution: 20,
  point1: [...p],
  point2: [...p2],
});
console.debug({ p, p2 });

const lineMapper = vtkMapper.newInstance();
lineMapper.setInputData(lineSource.getOutputData());
const lineActor = vtkActor.newInstance();
lineActor.setMapper(lineMapper);
lineActor.getProperty().setColor(1.0, 0.0, 0.0);

renderer.addActor(lineActor);
renderer.resetCamera();
renderWindow.render();

// ----------------------------------------------------------------------------
// Setup picking interaction
// ----------------------------------------------------------------------------
// Only try to pick cone
const picker = vtkPicker.newInstance();
picker.setPickFromList(true);
picker.addPickList(actor);

// Pick on mouse right click
renderWindow.getInteractor().onRightButtonPress((callData) => {
  picker.pick3DRay(p, [...ori, 0], renderer);

  if (picker.getActors().length === 0) {
    console.log('No actor picked');
  } else {
    const actors = picker.getActors();

    console.debug({ actors });
    actors[0].getProperty().setColor(0.0, 1.0, 0.0);

    // const pickedPoints = picker.getPickedPositions();
    // for (let i = 0; i < pickedPoints.length; i++) {
    //   const pickedPoint = pickedPoints[i];
    //   console.log(`Picked: ${pickedPoint}`);
    //   const sphere = vtkSphereSource.newInstance();
    //   sphere.setCenter(pickedPoint);
    //   sphere.setRadius(0.01);
    //   const sphereMapper = vtkMapper.newInstance();
    //   sphereMapper.setInputData(sphere.getOutputData());
    //   const sphereActor = vtkActor.newInstance();
    //   sphereActor.setMapper(sphereMapper);
    //   sphereActor.getProperty().setColor(0.0, 1.0, 0.0);
    //   renderer.addActor(sphereActor);
    // }
  }
  renderWindow.render();
});
