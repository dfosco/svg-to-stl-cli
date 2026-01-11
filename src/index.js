import * as THREE from 'three';
import { JSDOM } from 'jsdom';

// Set up DOM environment for SVG parsing
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const window = dom.window;
const document = window.document;

// Helper: Parse SVG path to THREE.ShapePath (which has toShapes method)
function transformSVGPath(pathStr) {
  const DEGS_TO_RADS = Math.PI / 180;
  const DIGIT_0 = 48, DIGIT_9 = 57, COMMA = 44, SPACE = 32, PERIOD = 46, MINUS = 45;
  
  const path = new THREE.ShapePath();
  let idx = 1, len = pathStr.length, activeCmd,
      x = 0, y = 0, nx = 0, ny = 0, firstX = null, firstY = null,
      x1 = 0, x2 = 0, y1 = 0, y2 = 0,
      rx = 0, ry = 0, xar = 0, laf = 0, sf = 0, cx, cy;
  
  function eatNum() {
    let sidx, c, isFloat = false, s;
    // eat delims
    while (idx < len) {
      c = pathStr.charCodeAt(idx);
      if (c !== COMMA && c !== SPACE)
        break;
      idx++;
    }
    if (c === MINUS)
      sidx = idx++;
    else
      sidx = idx;
    // eat number
    while (idx < len) {
      c = pathStr.charCodeAt(idx);
      if (DIGIT_0 <= c && c <= DIGIT_9) {
        idx++;
        continue;
      }
      else if (c === PERIOD) {
        idx++;
        isFloat = true;
        continue;
      }
      s = pathStr.substring(sidx, idx);
      return isFloat ? parseFloat(s) : parseInt(s);
    }
    s = pathStr.substring(sidx);
    return isFloat ? parseFloat(s) : parseInt(s);
  }
  
  function nextIsNum() {
    let c;
    while (idx < len) {
      c = pathStr.charCodeAt(idx);
      if (c !== COMMA && c !== SPACE)
        break;
      idx++;
    }
    c = pathStr.charCodeAt(idx);
    return (c === MINUS || (DIGIT_0 <= c && c <= DIGIT_9));
  }
  
  let canRepeat;
  activeCmd = pathStr[0];
  
  while (idx <= len) {
    canRepeat = true;
    switch (activeCmd) {
      case 'M':
        x = eatNum();
        y = eatNum();
        path.moveTo(x, y);
        activeCmd = 'L';
        firstX = x;
        firstY = y;
        break;
      case 'm':
        x += eatNum();
        y += eatNum();
        path.moveTo(x, y);
        activeCmd = 'l';
        firstX = x;
        firstY = y;
        break;
      case 'Z':
      case 'z':
        canRepeat = false;
        if (x !== firstX || y !== firstY)
          path.lineTo(firstX, firstY);
        break;
      case 'L':
      case 'H':
      case 'V':
        nx = (activeCmd === 'V') ? x : eatNum();
        ny = (activeCmd === 'H') ? y : eatNum();
        path.lineTo(nx, ny);
        x = nx;
        y = ny;
        break;
      case 'l':
      case 'h':
      case 'v':
        nx = (activeCmd === 'v') ? x : (x + eatNum());
        ny = (activeCmd === 'h') ? y : (y + eatNum());
        path.lineTo(nx, ny);
        x = nx;
        y = ny;
        break;
      case 'C':
        x1 = eatNum(); y1 = eatNum();
        x2 = eatNum();
        y2 = eatNum();
        nx = eatNum();
        ny = eatNum();
        path.bezierCurveTo(x1, y1, x2, y2, nx, ny);
        x = nx; y = ny;
        break;
      case 'S':
        x1 = 2 * x - x2; y1 = 2 * y - y2;
        x2 = eatNum();
        y2 = eatNum();
        nx = eatNum();
        ny = eatNum();
        path.bezierCurveTo(x1, y1, x2, y2, nx, ny);
        x = nx; y = ny;
        break;
      case 'c':
        x1 = x + eatNum();
        y1 = y + eatNum();
        x2 = x + eatNum();
        y2 = y + eatNum();
        nx = x + eatNum();
        ny = y + eatNum();
        path.bezierCurveTo(x1, y1, x2, y2, nx, ny);
        x = nx; y = ny;
        break;
      case 's':
        x1 = 2 * x - x2;
        y1 = 2 * y - y2;
        x2 = x + eatNum();
        y2 = y + eatNum();
        nx = x + eatNum();
        ny = y + eatNum();
        path.bezierCurveTo(x1, y1, x2, y2, nx, ny);
        x = nx; y = ny;
        break;
      case 'Q':
        x1 = eatNum(); y1 = eatNum();
        nx = eatNum();
        ny = eatNum();
        path.quadraticCurveTo(x1, y1, nx, ny);
        x = nx;
        y = ny;
        break;
      case 'T':
        x1 = 2 * x - x1;
        y1 = 2 * y - y1;
        nx = eatNum();
        ny = eatNum();
        path.quadraticCurveTo(x1, y1, nx, ny);
        x = nx;
        y = ny;
        break;
      case 'q':
        x1 = x + eatNum();
        y1 = y + eatNum();
        nx = x + eatNum();
        ny = y + eatNum();
        path.quadraticCurveTo(x1, y1, nx, ny);
        x = nx; y = ny;
        break;
      case 't':
        x1 = 2 * x - x1;
        y1 = 2 * y - y1;
        nx = x + eatNum();
        ny = y + eatNum();
        path.quadraticCurveTo(x1, y1, nx, ny);
        x = nx; y = ny;
        break;
      case 'A':
        rx = eatNum();
        ry = eatNum();
        xar = eatNum() * DEGS_TO_RADS;
        laf = eatNum();
        sf = eatNum();
        nx = eatNum();
        ny = eatNum();
        if (rx !== ry) {
          console.warn("Forcing elliptical arc to be a circular one :(", rx, ry);
        }
        x1 = Math.cos(xar) * (x - nx) / 2 + Math.sin(xar) * (y - ny) / 2;
        y1 = -Math.sin(xar) * (x - nx) / 2 + Math.cos(xar) * (y - ny) / 2;
        const norm = Math.sqrt(
          (rx*rx * ry*ry - rx*rx * y1*y1 - ry*ry * x1*x1) /
          (rx*rx * y1*y1 + ry*ry * x1*x1));
        const normSign = (laf === sf) ? -norm : norm;
        x2 = normSign * rx * y1 / ry;
        y2 = normSign * -ry * x1 / rx;
        cx = Math.cos(xar) * x2 - Math.sin(xar) * y2 + (x + nx) / 2;
        cy = Math.sin(xar) * x2 + Math.cos(xar) * y2 + (y + ny) / 2;
        const u = new THREE.Vector2(1, 0);
        const v = new THREE.Vector2((x1 - x2) / rx, (y1 - y2) / ry);
        let startAng = Math.acos(u.dot(v) / u.length() / v.length());
        if (u.x * v.y - u.y * v.x < 0)
          startAng = -startAng;
        const uAng = new THREE.Vector2((-x1 - x2) / rx, (-y1 - y2) / ry);
        let deltaAng = Math.acos(v.dot(uAng) / v.length() / uAng.length());
        if (v.x * uAng.y - v.y * uAng.x < 0)
          deltaAng = -deltaAng;
        if (!sf && deltaAng > 0)
          deltaAng -= Math.PI * 2;
        if (sf && deltaAng < 0)
          deltaAng += Math.PI * 2;
        // Use currentPath.absarc since ShapePath doesn't have absarc directly
        if (path.currentPath) {
          path.currentPath.absarc(cx, cy, rx, startAng, startAng + deltaAng, sf);
        }
        x = nx;
        y = ny;
        break;
      default:
        break;
    }
    if (canRepeat && nextIsNum())
      continue;
    activeCmd = pathStr[idx++];
  }
  return path;
}

// Flatten SVG transformations - simplified version for path elements
function flattenSvgPaths(svgDoc) {
  const paths = svgDoc.querySelectorAll('path');
  const pathStrings = [];
  
  paths.forEach(pathElement => {
    const d = pathElement.getAttribute('d');
    if (d) {
      pathStrings.push(d);
    }
  });
  
  // Also handle basic shapes that can be converted to paths
  const circles = svgDoc.querySelectorAll('circle');
  circles.forEach(circle => {
    const cx = parseFloat(circle.getAttribute('cx')) || 0;
    const cy = parseFloat(circle.getAttribute('cy')) || 0;
    const r = parseFloat(circle.getAttribute('r')) || 0;
    if (r > 0) {
      // Approximate circle with bezier curves
      const k = 0.5522847498; // 4 * (sqrt(2) - 1) / 3
      const d = `M ${cx - r},${cy} ` +
                `C ${cx - r},${cy - k * r} ${cx - k * r},${cy - r} ${cx},${cy - r} ` +
                `C ${cx + k * r},${cy - r} ${cx + r},${cy - k * r} ${cx + r},${cy} ` +
                `C ${cx + r},${cy + k * r} ${cx + k * r},${cy + r} ${cx},${cy + r} ` +
                `C ${cx - k * r},${cy + r} ${cx - r},${cy + k * r} ${cx - r},${cy} Z`;
      pathStrings.push(d);
    }
  });
  
  const ellipses = svgDoc.querySelectorAll('ellipse');
  ellipses.forEach(ellipse => {
    const cx = parseFloat(ellipse.getAttribute('cx')) || 0;
    const cy = parseFloat(ellipse.getAttribute('cy')) || 0;
    const rx = parseFloat(ellipse.getAttribute('rx')) || 0;
    const ry = parseFloat(ellipse.getAttribute('ry')) || 0;
    if (rx > 0 && ry > 0) {
      const k = 0.5522847498;
      const d = `M ${cx - rx},${cy} ` +
                `C ${cx - rx},${cy - k * ry} ${cx - k * rx},${cy - ry} ${cx},${cy - ry} ` +
                `C ${cx + k * rx},${cy - ry} ${cx + rx},${cy - k * ry} ${cx + rx},${cy} ` +
                `C ${cx + rx},${cy + k * ry} ${cx + k * rx},${cy + ry} ${cx},${cy + ry} ` +
                `C ${cx - k * rx},${cy + ry} ${cx - rx},${cy + k * ry} ${cx - rx},${cy} Z`;
      pathStrings.push(d);
    }
  });
  
  const rects = svgDoc.querySelectorAll('rect');
  rects.forEach(rect => {
    const x = parseFloat(rect.getAttribute('x')) || 0;
    const y = parseFloat(rect.getAttribute('y')) || 0;
    const w = parseFloat(rect.getAttribute('width')) || 0;
    const h = parseFloat(rect.getAttribute('height')) || 0;
    const rx = parseFloat(rect.getAttribute('rx')) || 0;
    const ry = parseFloat(rect.getAttribute('ry')) || rx;
    
    if (w > 0 && h > 0) {
      if (rx === 0 && ry === 0) {
        const d = `M ${x},${y} L ${x + w},${y} L ${x + w},${y + h} L ${x},${y + h} Z`;
        pathStrings.push(d);
      } else {
        const actualRx = Math.min(rx, w / 2);
        const actualRy = Math.min(ry, h / 2);
        const d = `M ${x + actualRx},${y} ` +
                  `L ${x + w - actualRx},${y} ` +
                  `Q ${x + w},${y} ${x + w},${y + actualRy} ` +
                  `L ${x + w},${y + h - actualRy} ` +
                  `Q ${x + w},${y + h} ${x + w - actualRx},${y + h} ` +
                  `L ${x + actualRx},${y + h} ` +
                  `Q ${x},${y + h} ${x},${y + h - actualRy} ` +
                  `L ${x},${y + actualRy} ` +
                  `Q ${x},${y} ${x + actualRx},${y} Z`;
        pathStrings.push(d);
      }
    }
  });
  
  const polygons = svgDoc.querySelectorAll('polygon');
  polygons.forEach(polygon => {
    const points = polygon.getAttribute('points');
    if (points) {
      const d = `M ${points} Z`;
      pathStrings.push(d);
    }
  });
  
  const polylines = svgDoc.querySelectorAll('polyline');
  polylines.forEach(polyline => {
    const points = polyline.getAttribute('points');
    if (points) {
      const d = `M ${points}`;
      pathStrings.push(d);
    }
  });
  
  const lines = svgDoc.querySelectorAll('line');
  lines.forEach(line => {
    const x1 = parseFloat(line.getAttribute('x1')) || 0;
    const y1 = parseFloat(line.getAttribute('y1')) || 0;
    const x2 = parseFloat(line.getAttribute('x2')) || 0;
    const y2 = parseFloat(line.getAttribute('y2')) || 0;
    const d = `M ${x1},${y1} L ${x2},${y2}`;
    pathStrings.push(d);
  });
  
  return pathStrings;
}

// Create extruded SVG object
function getExtrudedSvgObject(paths, options) {
  let bevelEnabled = (options.typeDepth < 0 || !options.wantBasePlate) ? false : options.bevelEnabled;
  let shapes = [];
  
  for (let i = 0; i < paths.length; ++i) {
    const path = transformSVGPath(paths[i]);
    const newShapes = path.toShapes(options.svgWindingIsCW);
    shapes = shapes.concat(newShapes);
  }
  
  // Negative typeDepths are ok, but can't be deeper than the base
  if (options.wantBasePlate && options.typeDepth < 0 && Math.abs(options.typeDepth) > options.baseDepth) {
    options.typeDepth = -1 * options.baseDepth;
  }
  
  // Extrude all shapes WITHOUT BEVEL
  let extruded = new THREE.ExtrudeGeometry(shapes, {
    depth: Math.abs(options.typeDepth),
    bevelEnabled: false
  });
  
  extruded.computeBoundingBox();
  const svgWidth = extruded.boundingBox.max.x - extruded.boundingBox.min.x;
  const svgHeight = extruded.boundingBox.max.y - extruded.boundingBox.min.y;
  const maxBbExtent = Math.max(svgWidth, svgHeight);
  
  // Extrude with bevel if requested
  if (bevelEnabled) {
    extruded = new THREE.ExtrudeGeometry(shapes, {
      depth: 0,
      bevelEnabled: true,
      bevelThickness: options.typeDepth,
      bevelSize: options.typeDepth * (maxBbExtent / options.typeSize),
      bevelSegments: 1
    });
  }
  
  // Use negative scaling to invert the image
  if (!options.wantInvertedType) {
    const invertTransform = new THREE.Matrix4().makeScale(-1, 1, 1);
    extruded.applyMatrix4(invertTransform);
  }
  
  const material = new THREE.MeshLambertMaterial({
    color: new THREE.Color(options.objectColor),
    emissive: new THREE.Color(options.objectColor),
    side: THREE.DoubleSide
  });
  
  const mesh = new THREE.Mesh(extruded, material);
  
  // Scale to requested size (lock aspect ratio)
  const scaleTransform = new THREE.Matrix4().makeScale(
    options.typeSize / maxBbExtent,
    options.typeSize / maxBbExtent,
    1
  );
  mesh.geometry.applyMatrix4(scaleTransform);
  
  // Center on X/Y origin
  mesh.geometry.computeBoundingBox();
  const boundBox = mesh.geometry.boundingBox;
  const translateTransform = new THREE.Matrix4().makeTranslation(
    -(Math.abs((boundBox.max.x - boundBox.min.x) / 2) + boundBox.min.x),
    -(Math.abs((boundBox.max.y - boundBox.min.y) / 2) + boundBox.min.y),
    0
  );
  mesh.geometry.applyMatrix4(translateTransform);
  
  // Rotate 180 deg
  const rotateTransform = new THREE.Matrix4().makeRotationZ(Math.PI);
  mesh.geometry.applyMatrix4(rotateTransform);
  
  mesh.geometry.computeBoundingBox();
  mesh.geometry.computeBoundingSphere();
  
  return mesh;
}

// Create base plate object
function getBasePlateObject(options, svgMesh) {
  let basePlateMesh;
  const material = new THREE.MeshLambertMaterial({
    color: new THREE.Color(options.objectColor),
    emissive: new THREE.Color(options.objectColor),
    side: THREE.DoubleSide
  });
  
  if (options.basePlateShape === "Rectangular") {
    const svgBoundBox = svgMesh.geometry.boundingBox;
    const svgWidth = svgBoundBox.max.x - svgBoundBox.min.x;
    const svgHeight = svgBoundBox.max.y - svgBoundBox.min.y;
    const maxBbExtent = Math.max(svgWidth, svgHeight);
    
    const basePlate = new THREE.BoxGeometry(
      maxBbExtent + options.baseBuffer,
      maxBbExtent + options.baseBuffer,
      options.baseDepth
    );
    basePlateMesh = new THREE.Mesh(basePlate, material);
  } else {
    // Circular
    const svgBoundRadius = svgMesh.geometry.boundingSphere.radius;
    const basePlate = new THREE.CylinderGeometry(
      svgBoundRadius + options.baseBuffer,
      svgBoundRadius + options.baseBuffer,
      options.baseDepth,
      64
    );
    basePlateMesh = new THREE.Mesh(basePlate, material);
    const rotateTransform = new THREE.Matrix4().makeRotationX(Math.PI / 2);
    basePlateMesh.geometry.applyMatrix4(rotateTransform);
  }
  
  // Put base flat on print surface
  const translateTransform = new THREE.Matrix4().makeTranslation(0, 0, options.baseDepth / 2);
  basePlateMesh.geometry.applyMatrix4(translateTransform);
  
  return basePlateMesh;
}

// STL Exporter
function exportToSTL(scene) {
  let output = 'solid exported\n';
  
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      const geometry = object.geometry;
      const matrixWorld = object.matrixWorld;
      
      // Convert BufferGeometry to indexed if needed
      const positionAttribute = geometry.getAttribute('position');
      const normalAttribute = geometry.getAttribute('normal');
      const index = geometry.getIndex();
      
      if (positionAttribute) {
        const normalMatrixWorld = new THREE.Matrix3().getNormalMatrix(matrixWorld);
        
        if (index) {
          // Indexed geometry
          for (let i = 0; i < index.count; i += 3) {
            const indices = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
            
            // Get face normal from first vertex (they should all be the same for flat faces)
            const normal = new THREE.Vector3();
            if (normalAttribute) {
              normal.fromBufferAttribute(normalAttribute, indices[0]);
              normal.applyMatrix3(normalMatrixWorld).normalize();
            }
            
            output += `\tfacet normal ${normal.x} ${normal.y} ${normal.z}\n`;
            output += '\t\touter loop\n';
            
            for (let j = 0; j < 3; j++) {
              const vertex = new THREE.Vector3();
              vertex.fromBufferAttribute(positionAttribute, indices[j]);
              vertex.applyMatrix4(matrixWorld);
              output += `\t\t\tvertex ${vertex.x} ${vertex.y} ${vertex.z}\n`;
            }
            
            output += '\t\tendloop\n';
            output += '\tendfacet\n';
          }
        } else {
          // Non-indexed geometry
          for (let i = 0; i < positionAttribute.count; i += 3) {
            const normal = new THREE.Vector3();
            if (normalAttribute) {
              normal.fromBufferAttribute(normalAttribute, i);
              normal.applyMatrix3(normalMatrixWorld).normalize();
            }
            
            output += `\tfacet normal ${normal.x} ${normal.y} ${normal.z}\n`;
            output += '\t\touter loop\n';
            
            for (let j = 0; j < 3; j++) {
              const vertex = new THREE.Vector3();
              vertex.fromBufferAttribute(positionAttribute, i + j);
              vertex.applyMatrix4(matrixWorld);
              output += `\t\t\tvertex ${vertex.x} ${vertex.y} ${vertex.z}\n`;
            }
            
            output += '\t\tendloop\n';
            output += '\tendfacet\n';
          }
        }
      }
    }
  });
  
  output += 'endsolid exported\n';
  return output;
}

// Simple union by just combining meshes (without proper CSG which requires additional library)
function combineMeshes(baseMesh, svgMesh, options) {
  // For proper CSG operations, we would need a CSG library
  // For now, we'll just return the combined geometry in a group
  const group = new THREE.Group();
  
  if (options.wantBasePlate) {
    group.add(baseMesh);
    group.add(svgMesh);
  } else {
    group.add(svgMesh);
  }
  
  return group;
}

// Main conversion function
export function convertSvgToStl(svgContent, options) {
  // Parse SVG
  const parser = new window.DOMParser();
  const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
  
  // Extract paths
  const svgPaths = flattenSvgPaths(svgDoc);
  
  if (svgPaths.length === 0) {
    throw new Error('No valid paths found in SVG file');
  }
  
  // Create scene
  const scene = new THREE.Scene();
  const group = new THREE.Group();
  scene.add(group);
  
  // Create extruded SVG object
  const svgMesh = getExtrudedSvgObject(svgPaths, options);
  
  if (options.wantBasePlate) {
    // Shift the SVG portion away from the bed to account for the base
    const translateTransform = new THREE.Matrix4().makeTranslation(0, 0, options.baseDepth);
    svgMesh.geometry.applyMatrix4(translateTransform);
    
    // Create base plate
    const basePlateMesh = getBasePlateObject(options, svgMesh);
    
    // Add both to group
    group.add(basePlateMesh);
    group.add(svgMesh);
  } else {
    group.add(svgMesh);
  }
  
  // Export to STL
  return exportToSTL(scene);
}

export default convertSvgToStl;
