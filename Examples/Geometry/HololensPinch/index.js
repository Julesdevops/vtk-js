// For streamlined VR development install the WebXR emulator extension
// https://github.com/MozillaReality/WebXR-emulator-extension

import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
// import vtkCalculator from '@kitware/vtk.js/Filters/General/Calculator';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
// import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkWebXRRenderWindowHelper from '@kitware/vtk.js/Rendering/WebXR/RenderWindowHelper';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
// import { AttributeTypes } from '@kitware/vtk.js/Common/DataModel/DataSetAttributes/Constants';
// import { FieldDataTypes } from '@kitware/vtk.js/Common/DataModel/DataSet/Constants';
import { XrSessionTypes } from '@kitware/vtk.js/Rendering/WebXR/RenderWindowHelper/Constants';

import vtkInteractorStyleHMDXR from '@kitware/vtk.js/Interaction/Style/InteractorStyleHMDXR';
import vtkRenderWindowInteractor from '@kitware/vtk.js/Rendering/Core/RenderWindowInteractor';

// Force DataAccessHelper to have access to various data source
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import vtkResourceLoader from '@kitware/vtk.js/IO/Core/ResourceLoader';

// Custom UI controls, including button to start XR session
import controlPanel from './controller.html';

// Dynamically load WebXR polyfill from CDN for WebVR and Cardboard API backwards compatibility
if (navigator.xr === undefined) {
  vtkResourceLoader
    .loadScript(
      'https://cdn.jsdelivr.net/npm/webxr-polyfill@latest/build/webxr-polyfill.js'
    )
    .then(() => {
      // eslint-disable-next-line no-new, no-undef
      new WebXRPolyfill();
    });
}

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});

const interactor = vtkRenderWindowInteractor.newInstance();
interactor.setView(fullScreenRenderer.getApiSpecificRenderWindow());
interactor.initialize();

// const picker = vtkPicker.newInstance();
// picker.setPickFromList(true);
const is = vtkInteractorStyleHMDXR.newInstance();
// is.setPicker(picker);
interactor.setInteractorStyle(is);

const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const XRHelper = vtkWebXRRenderWindowHelper.newInstance({
  renderWindow: fullScreenRenderer.getApiSpecificRenderWindow(),
  drawControllersRay: true,
});

// nice cone bro!
const coneSource = vtkConeSource.newInstance({ height: 100.0, radius: 50 });

const filter = coneSource;

const mapper = vtkMapper.newInstance();
mapper.setInputConnection(filter.getOutputPort());

const actor = vtkActor.newInstance();
actor.setMapper(mapper);
actor.setPosition(0.0, 0.0, -20.0);
renderer.addActor(actor);

const coneSourceLeft = vtkConeSource.newInstance({
  height: 50.0,
  radius: 20,
});

const coneSourceRight = vtkConeSource.newInstance({
  height: 50.0,
  radius: 20,
});

const mapperL = vtkMapper.newInstance();
const mapperR = vtkMapper.newInstance();

const actorL = vtkActor.newInstance();
const actorR = vtkActor.newInstance();
actorL.setMapper(mapperL);
actorR.setMapper(mapperR);

mapperR.setInputConnection(coneSourceRight.getOutputPort());
mapperL.setInputConnection(coneSourceLeft.getOutputPort());

actorL.setPosition(50.0, 0.0, -20.0);
actorR.setPosition(-50.0, 0.0, -20.0);

renderer.addActor(actorL);
renderer.addActor(actorR);

renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);
const vrbutton = document.querySelector('.vrbutton');

vrbutton.addEventListener('click', (e) => {
  if (vrbutton.textContent === 'Send To VR') {
    XRHelper.startXR(XrSessionTypes.HmdVR);
    vrbutton.textContent = 'Return From VR';
  } else {
    XRHelper.stopXR();
    vrbutton.textContent = 'Send To VR';
  }
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

window.source = coneSource;
window.mapper = mapper;
window.actor = actor;
window.actorL = actorL;
window.actorR = actorR;
window.renderer = renderer;
window.renderWindow = renderWindow;
