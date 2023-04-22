const place_hleft = 0;
const place_hmiddle = 1;
const place_hright = 2;
const place_vtop = 0;
const place_vmiddle = 1;
const place_vbottom = 2;


const border = 25; // Border/Gaps of normal tiled windows
const alt_border = 15; // Border of special Maximized window (single and both monitors)
const monitor_width = 2560; // Width of the left monitor, after this width, the positioning of windows will be Right to Left ( instead of from Left to Right)
const monitor_height = 1440; // Height of monitors


// const master_size = 1536;
// const secondary_size = 1024;
// const minor_gap = 640;

const master_size = Math.round(monitor_width * 0.62);
const secondary_size = Math.round(monitor_width - master_size);
const minor_gap = Math.round(monitor_width * 0.23)

const vert_middle = Math.round(monitor_height / 2);
const vert_area = Math.round(monitor_height / 3);

const horizontal_area = Math.round(monitor_width / 3);
const horizontal_area_two = horizontal_area * 2;

// todo: put this in a function that the monitor and areas are calculated per window and from kwin values

const float_windows = [];
workspace.clientAdded.connect((window) => {
	if (!skipWindow(window)) {
        connectAndPlaceDefault(window);
}});
workspace.clientRemoved.connect((window) => {
	if (!skipWindow(window)) {
    workspace.clientRemoved.connect(cleanWindow);
}});

function connectAndPlaceDefault(window) {
    connectWindow(window);
    defaultPositionWindow(window);
}
function connectWindow(window) {
	if (!skipWindow(window)) {
	    window.clientFinishUserMovedResized.connect(onMovedAnonymousWindow);
    }
}

function defaultPositionWindow(window) {

    // Example on how to setup windows per activity:
    //
	// resource_class = String(window.resourceClass).toLowerCase();
	// window_caption = String(window.caption).toLowerCase();
	// print(resource_class + ":" + window_caption + ":" + String(window.activities[0]).toLowerCase());
	// if (skipWindow(window)) return;

	// switch (window.activities[0]) {
	// 	case "24fe03fe-1126-46bf-904b-9c04168b7907":
	// 		switch (resource_class) {
	// 			default:
	// 				positionAnonymousWindow(window);
	// 		}
	// 		break;

	// 	case "349ffe2f-b73d-466d-acc6-d16f47f4fc8e":
	// 		switch (resource_class) {
	// 			case 'brave-zeal__-zeal':
	// 				workspace.sendClientToScreen(window, 1);
	// 				window.desktop = 1;
	// 				makeWindowMax(window);
	// 				break;
	// 			case 'plasmatube':
	// 				workspace.sendClientToScreen(window, 0);
	// 				window.desktop = 1;
	// 				makeWindowMax(window);
	// 				break;
	// 			default:
	// 				positionAnonymousWindow(window);
	// 		}
	// 		break;
	// 	default:
	// 		positionAnonymousWindow(window);
	// }
	
    positionAnonymousWindow(window);
}


function positionAnonymousWindow(window) {
  if (skipWindow(window)) return;

	// if (window.frameGeometry.width > (master_size + border)) {
	// 	makeWindowMax(window);
	// 	return;
	// }

	// if (window.frameGeometry.width > (secondary_size + border)) {
	// 	makeWindowMaster(window);
	// 	return;
	// }

	// makeWindowSecondary(window);
    doPlacement(window, getArea(window), window.frameGeometry);
}

// On moved window

function onMovedAnonymousWindow(window) {
  if (skipWindow(window)) return;

	area = getArea(window);

	isFloat = isFloatWindow(window);
	if (isFloat >= 0) {
		doPlacementFloat(window, area);
		return;
	}    
    doMousePlacement(window, area, findMiddleWindow(window, area))
}

function doMousePlacement(window, area, geometry) {
  if (skipWindow(window)) return;

  if (detectRightMonitor(area))
		geometry = placeMouseWindowHorizontalInverted(window, area, geometry);
	else
		geometry = placeMouseWindowHorizontal(window, area, geometry);

	geometry = placeMouseWindowVertical(window, area, geometry);
	window.frameGeometry = geometry;
	return;
}


function placeMouseWindowHorizontal(window, area, geometry) {
	if (geometry.x < horizontal_area) {
		geometry.x = area.x + border;
		geometry.width = area.width - (border * 2) - master_size;
	}
	else if (geometry.x < horizontal_area_two) {
		geometry.x = area.x + border + minor_gap;
		geometry.width = area.width - (border * 2) - minor_gap;
	}else {
		geometry.x = area.x + border + secondary_size;
		geometry.width = area.width - (border * 2) - secondary_size;
	}
	return geometry;
}


function placeMouseWindowHorizontalInverted(window, area, geometry) {
	if ((geometry.x - monitor_width) > horizontal_area_two) {
		geometry.x = area.x + border + master_size;
		geometry.width = area.width - (border * 2) - master_size;
	}
	else if ((geometry.x - monitor_width) > (horizontal_area)) {
		geometry.x = area.x + border;
		geometry.width = area.width - (border * 2) - minor_gap ;
	}else {
		geometry.x = area.x + border;
		geometry.width = area.width - (border * 2) - secondary_size;
	}
	return geometry;
}

function placeMouseWindowVertical(window, area, geometry) {
	if (geometry.y < vert_area) {
		geometry.y = area.y + border;
		geometry.height = area.height - (border * 2) - vert_middle;
	}
	else if (geometry.y < (vert_area*2)) {
		geometry.y = area.y + border;
		geometry.height = area.height - (border * 2) ;
	}else {
		geometry.y = area.y + border + vert_middle;
		geometry.height = area.height - (border * 2) - vert_middle;
	}
	return geometry;
}


// Forcing where window should be

function isFloatWindow(window) {
	// for (i=0; i < float_windows.length; i++ ) {
	// 	if (float_windows[i] === window.frameId)
	// 		return i;
	// }
	return float_windows.indexOf(String(window));
}

function cleanWindow(window) {
	float = isFloatWindow(window);
	if (float >= 0) {
		removeWindowSpecialFloat(window, float);
	}
}

function toggleFloatWindow(window) {
  if (skipWindow(window)) return;

	floatIndex = isFloatWindow(window);
	if (floatIndex === -1)
		makeWindowSpecialFloat(window);
	else {
		removeWindowSpecialFloat(window, floatIndex);
		positionAnonymousWindow(window);
	}
}

function makeWindowSpecialFloat(window, enable) {
	if (skipWindow(window)) return;

  float_windows.push(String(window));
	window.keepAbove = true;
	doPlacementFloat(window, getArea(window));
}

function removeWindowSpecialFloat(window, index) {
	window.keepAbove = false;
	float_windows.splice(index, 1);
}

function doPlacementFloat(window, area) {
  if (skipWindow(window)) return;

  monitor_offset = area.x;
	geometry = { x: window.x - monitor_offset, y: window.y, width: window.width, height: window.height };
	changed = false;
	if (geometry.x < border) {
		geometry.x = border;
		changed = true;
	}
	if (geometry.y < border) {
		geometry.y = border;
		changed = true;
	}
	if ((geometry.width + (2 * border)) > monitor_width) {
		geometry.width = monitor_width - (2 * border);
		geometry.x = border;
		changed = true;
	}
	if ((geometry.height + (2 * border)) > monitor_height) {
		geometry.height = monitor_height - (2 * border);
		geometry.y = border;
		changed = true;
	}
	if ((geometry.x + geometry.width + border) > monitor_width) {
		geometry.x = geometry.x - ((geometry.x + geometry.width + (border)) - monitor_width);
		changed = true;
	}
	if ((geometry.y + geometry.height + border) > monitor_height) {
		geometry.y = geometry.y - ((geometry.y + geometry.height + (border)) - monitor_height);
		changed = true;
	}
	if (changed) {
		geometry.x = geometry.x + monitor_offset;
		window.frameGeometry = geometry;
	}
}

function makeWindowSpecialMax(window) {
  if (skipWindow(window)) return;

	area = workspace.clientArea(KWin.MaximizeArea, window);
	window.frameGeometry = { x: area.x + alt_border, y: area.y + alt_border, width: area.width - (alt_border * 2), height: area.height - (alt_border * 2)}
}

function makeWindowSpecialMaxAllMonitors(window) {
    print("DOING: makeWindowSpecialMaxAllMonitors(window) ")
	window.frameGeometry = { x: alt_border, y: alt_border, width: (monitor_width * 2) - (alt_border * 2), height: monitor_height - (alt_border * 2)}
}

function makeWindowMax(window) {
  if (skipWindow(window)) return;

	area = workspace.clientArea(KWin.MaximizeArea, window);
	if (detectRightMonitor(area)) {
		geometry = {x: monitor_width + horizontal_area + border, y: vert_area + border};
	}
	else {
		geometry = {x: horizontal_area + border, y: vert_area + border };
	}

	doMousePlacement(window, area, geometry);
}
function makeWindowMaster(window) {
  if (skipWindow(window)) return;

  area = workspace.clientArea(KWin.MaximizeArea, window);
	geometry_x = horizontal_area_two + border;
	geometry_y = selectVerticalHeight(window, area);

	if (detectRightMonitor(area))
		geometry_x = monitor_width + border;

	geometry = {x: geometry_x, y: geometry_y};
	doMousePlacement(window, area, geometry);
}

function makeWindowSecondary(window) {
  if (skipWindow(window)) return;

	area = workspace.clientArea(KWin.MaximizeArea, window);
	geometry_x = horizontal_area - border;
	geometry_y = selectVerticalHeight(window, area);

	if (detectRightMonitor(area))
		geometry_x = monitor_width + horizontal_area_two + border;

	geometry = {x: geometry_x, y: geometry_y};
	doMousePlacement(window, area, geometry);
}

function moveWindowHorizontally(window, direction) {
	area = workspace.clientArea(KWin.MaximizeArea, window);
    geometry = window.frameGeometry;

    horiz = detectWindowPositionHorizontally(area, geometry);
    print("Detected HORIZ: " + horiz);

    horiz = horiz + direction;
    
    if (horiz < 0) {
        if (detectRightMonitor(area)) {
            window.frameGeometry.x = 0 + border
            horiz = 2;
    } else {
            horiz = 0;
        }
    }
    if (horiz > 2) {
        if (detectRightMonitor(area)) {
            horiz = 2;
    } else {
        window.frameGeometry.x = area.width + border;
        horiz = 0;
        }
    }

    doSpecificPlacement(window, horiz, -1);
}

function moveWindowVertically(window, direction) {
	area = workspace.clientArea(KWin.MaximizeArea, window);
    geometry = window.frameGeometry;

    vert = detectWindowPositionVertically(area, geometry);

    vert = vert + direction;
    
    if (vert < 0) {
        vert = 0;
    }
    if (vert > 2) {
        vert = 2;
    }

    doSpecificPlacement(window, -1, vert);
}

function doPlacement(window, area, geometry) {
  if (skipWindow(window)) return;

    doSpecificPlacement(window, detectWindowPositionHorizontally(area, geometry), detectWindowPositionVertically(area, geometry));
	return;
}

function detectWindowPositionHorizontally(area, geometry) {
  horiz = place_hright;
     if (detectRightMonitor(area)) {
        print("Detected Right Monitor");
        middle_dividing_line_left = horizontal_area + monitor_width;
        comparing_size = master_size + border;
    } else {
        print("Detected Left Monitor");
        middle_dividing_line_left = horizontal_area;
        comparing_size = secondary_size + border;
    }

    if (geometry.x < middle_dividing_line_left && geometry.width < (comparing_size + border) ) {
        horiz = place_hleft;
	}
	else if (geometry.x < middle_dividing_line_left) {
        horiz = place_hmiddle;
	}
    return horiz;
}

function detectWindowPositionVertically(area, geometry) {
  vert = place_vbottom;
      	if (geometry.y < vert_area && geometry.height < (vert_middle + border) ) {
            vert = place_vtop;
	}
	else if (geometry.y < (vert_area)) {
            vert = place_vmiddle;
	}
    return vert;
}

function doSpecificPlacement(window, horiz, vert) {
    if (skipWindow(window)) return;
	area = workspace.clientArea(KWin.MaximizeArea, window);
    // Does not work, wont update width  geometry = window.frameGeometry;
    geometry = {x: 0, y: 0, width: 0, height: 0};
    geo_x = geometry;
    geo_y = geometry;

    if (horiz == -1 ) {
        horiz = detectWindowPositionHorizontally(area, window.frameGeometry);
    }
    if (vert == -1 ) {
        vert = detectWindowPositionVertically(area, window.frameGeometry);
    }
    print("HORIZ: " + horiz);
    print("VERT: " + vert);

    if (horiz == place_hleft) {
	    geo_x = placeWindowLeft(area);
    } else {
        if (horiz == place_hmiddle) {
	        geo_x = placeWindowMiddle(area);
        } else {
            if (horiz == place_hright) {
	            geo_x = placeWindowRight(area);
            }
        }
    }
    if (vert == place_vtop) {
	    geo_y = placeWindowTop(area);
    } else {
        if (vert == place_vmiddle) {
    	    geo_y = placeWindowCenter(area);
        } else {
            if (vert == place_vbottom) {
	            geo_y = placeWindowBottom(area);
            }
        }
    }
    geometry.x = geo_x.x;
    geometry.width = geo_x.width;
    geometry.y = geo_y.y;
    geometry.height = geo_y.height;    

    print(geometry.x + " : " + geometry.y + " : " + geometry.width + " : " + geometry.height);
	window.frameGeometry = geometry;
	return;
}

function placeWindowLeft(area) {
    if (detectRightMonitor(area)) {
        return {x: area.x + border, width: area.width - (border * 2) - secondary_size};
    } else {
        return {x: area.x + border, width: area.width - (border * 2) - master_size};
    }
}
function placeWindowMiddle(area) {
    if (detectRightMonitor(area)) {
        return {x: area.x + border, width: area.width - (border * 2) - minor_gap};
    } else {
        return {x: area.x + border + minor_gap, width: area.width - (border * 2) - minor_gap};
    }
}
function placeWindowRight(area) {
    if (detectRightMonitor(area)) {
        return {x: area.x + border + master_size, width: area.width - (border * 2) - master_size};
    } else {
        return {x: area.x + border + secondary_size, width: area.width - (border * 2) - secondary_size};
    }
}
function placeWindowTop(area) {
        return {y: area.y + border, height: area.height - (border * 2) - vert_middle };
}
function placeWindowCenter(area) {
        return {y: area.y + border, height: area.height - (border * 2) };
}
function placeWindowBottom(area) {
        return {y: area.y + border + vert_middle, height: area.height - (border * 2) - vert_middle };
}



// Helpers

function selectVerticalHeight(window, area) {
	if (window.frameGeometry.height < (vert_middle + border)) {
		position = findMiddleWindow(window, area);
		return position.y;
	}
	return 	vert_area + border;
}

function getArea(window) {
	return workspace.clientArea(KWin.MaximizeArea, window);
}

function findMiddleWindow(window, area) {
	geometry = {x: (window.frameGeometry.x + (window.frameGeometry.width / 2)), y: (window.frameGeometry.y + (window.frameGeometry.height / 2))};
	return geometry
}

function detectRightMonitor(area) {
	if (area.x >= area.width) {
		return true;
	}
	return false;
}

function skipWindow(window) {
  skip = (!window || !window.managed || !window.normalWindow || !window.moveable || !window.resizeable || window.modal || window.specialWindow);
  if (skip) {
		print(String(window.resourceClass).toLowerCase());
		print(String(window.caption).toLowerCase());
  }
  return skip;
}





registerShortcut("ActivityWindowTile", "AWT Tile Window", "Meta+Ctrl+S", function() { onMovedAnonymousWindow(workspace.activeClient); });

registerShortcut("ActivityWindowManagement", "AWT Add Existing Windows", "Meta+Shift+Return", function() { 
    workspace.clientList().forEach(connectAndPlaceDefault); 
});

// registerShortcut("makeWindowMax", "Place windows in max", "Meta+Alt+1", function() { makeWindowMax(workspace.activeClient); });
// registerShortcut("makeWindowMaster", "Place windows in master", "Meta+Alt+2", function() { makeWindowMaster(workspace.activeClient); });
// registerShortcut("makeWindowSecondary", "Place windows in secondary", "Meta+Alt+3", function() { makeWindowSecondary(workspace.activeClient); });

registerShortcut("makeWindowSpecialFloat", "AWT Toggle float window mode", "Meta+Ctrl+0", function() { toggleFloatWindow(workspace.activeClient); });
registerShortcut("makeWindowSpecialMax", "AWT Place windows in special max mode", "Meta+Ctrl+Return", function() { makeWindowSpecialMax(workspace.activeClient); });
registerShortcut("makeWindowSpecialMaxAllMonitors", "AWT Place windows in special all monitors", "Meta+Ctrl+.", function() { makeWindowSpecialMaxAllMonitors(workspace.activeClient); });



registerShortcut("putWindowTopRight", "AWT Place windows in Top Right", "Meta+Ctrl+9", function() { doSpecificPlacement(workspace.activeClient, place_hright, place_vtop); });
registerShortcut("putWindowTopMiddle", "AWT Place windows in Top Middle", "Meta+Ctrl+8", function() { doSpecificPlacement(workspace.activeClient, place_hmiddle, place_vtop); });
registerShortcut("putWindowTopLeft", "AWT Place windows in Top Left", "Meta+Ctrl+7", function() { doSpecificPlacement(workspace.activeClient, place_hleft, place_vtop); });

registerShortcut("putWindowMiddleRight", "AWT Place windows in Top Right", "Meta+Ctrl+6", function() { doSpecificPlacement(workspace.activeClient, place_hright, place_vmiddle); });
registerShortcut("putWindowMiddleMiddle", "AWT Place windows in Top Middle", "Meta+Ctrl+5", function() { doSpecificPlacement(workspace.activeClient, place_hmiddle, place_vmiddle); });
registerShortcut("putWindowMiddleLeft", "AWT Place windows in Top Left", "Meta+Ctrl+4", function() { doSpecificPlacement(workspace.activeClient, place_hleft, place_vmiddle); });

registerShortcut("putWindowBottomRight", "AWT Place windows in Top Right", "Meta+Ctrl+3", function() { doSpecificPlacement(workspace.activeClient, place_hright, place_vbottom); });
registerShortcut("putWindowBottomMiddle", "AWT Place windows in Top Middle", "Meta+Ctrl+2", function() { doSpecificPlacement(workspace.activeClient, place_hmiddle, place_vbottom); });
registerShortcut("putWindowBottomLeft", "AWT Place windows in Top Left", "Meta+Ctrl+1", function() { doSpecificPlacement(workspace.activeClient, place_hleft, place_vbottom); });

registerShortcut("moveWindowLeft", "AWT Move Window Left", "", function() { moveWindowHorizontally(workspace.activeClient, -1); });
registerShortcut("moveWindowRight", "AWT Move Window Right", "", function() { moveWindowHorizontally(workspace.activeClient, 1); });
registerShortcut("moveWindowUp", "AWT Move Window Up", "", function() { moveWindowVertically(workspace.activeClient, -1); });
registerShortcut("moveWindowDown", "AWT Move Window Down", "", function() { moveWindowVertically(workspace.activeClient, 1); });
