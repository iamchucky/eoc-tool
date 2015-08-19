document.addEventListener('DOMContentLoaded', function() {
  var apiKey = 'AIzaSyA4rAT0fdTZLNkJ5o0uaAwZ89vVPQpr_Kc';

  var map;
  var drawingManager;
  var polygonGroups = {};
  var groupNames = [];
  var currPolygonGroup = null;
  var colors = ['red', 'blue', '#0f0', 'magenta', 'cyan', 'yellow', 'black'];

  function initialize() {
    map = new google.maps.Map(document.getElementById('map-canvas'), {
      zoom: 14,
      center: { lat: 25.05, lng: 121.54 },
      zoomControl: true,
      disableDefaultUI: true
    });
    // Enables the polyline drawing control. Click on the map to start drawing a
    // polyline. Each click will add a new vertice. Double-click to stop drawing.
    drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
          google.maps.drawing.OverlayType.POLYGON,
        ]
      },
      polygonOptions: {
        editable: true,
        fillColor: 'gray',
        strokeColor: 'gray'
      }
    });
    drawingManager.setMap(map);

    drawingManager.addListener('polygoncomplete', function(poly) {
      if (!currPolygonGroup) {
        var groupName = prompt('群組名稱:', '新群組');
        if (groupName != null) {
          addNewGroup(groupName);
        } else {
          poly.setMap(null);
          return;
        }
      }

      poly.groupName = currPolygonGroup;
      registerPolyClickHandler(poly);
      polygonGroups[currPolygonGroup].push(poly);
      var c = colors[groupNames.indexOf(currPolygonGroup)];
      poly.setOptions({ fillColor: c, strokeColor: c });
    });

    addGroupControl();
  }

  var lastInfoWindowPoly = null;
  var infoWindow = new google.maps.InfoWindow;
  infoWindow.setContent('<button id="info-clear">清除</button><br><button id="info-switch">換組</button>');
  infoWindow.addListener('closeclick', function() {
    lastInfoWindowPoly = null;
  });
  infoWindow.addListener('domready', function() {
    document.getElementById('info-clear').onclick = function() {
      lastInfoWindowPoly.setMap(null);
      var ind = polygonGroups[lastInfoWindowPoly.groupName].indexOf(lastInfoWindowPoly);
      if (ind > -1) {
        polygonGroups[lastInfoWindowPoly.groupName].splice(ind, 1);
      }
      lastInfoWindowPoly = null;
      infoWindow.close();
    };
    document.getElementById('info-switch').onclick = function() {
      // remove from current
      var ind = polygonGroups[lastInfoWindowPoly.groupName].indexOf(lastInfoWindowPoly);
      if (ind > -1) {
        polygonGroups[lastInfoWindowPoly.groupName].splice(ind, 1);
      }
      lastInfoWindowPoly.groupName = currPolygonGroup;
      // push to new
      polygonGroups[lastInfoWindowPoly.groupName].push(lastInfoWindowPoly);

      // set color
      var c = colors[groupNames.indexOf(currPolygonGroup)];
      lastInfoWindowPoly.setOptions({
        strokeColor: c,
        fillColor: c
      });
    };
  });

  function registerPolyClickHandler(poly) {
    poly.addListener('click', function(e) {
      infoWindow.setPosition(e.latLng);
      infoWindow.open(map);
      lastInfoWindowPoly = poly;
    });
  }

  function addNewGroup(newGroupName) {
    if (!newGroupName || polygonGroups[newGroupName]) return;

    var isFirst = groupNames.length == 0;
    polygonGroups[newGroupName] = [];
    groupNames.push(newGroupName);
    if (isFirst) {
      currPolygonGroup = newGroupName;
    }

    var l = document.createElement('input');
    l.type = 'radio';
    l.textContent = newGroupName;
    l.name = 'groupname';
    l.value = newGroupName;
    l.checked = isFirst;

    var c = document.createElement('div');
    var polyColor = colors[groupNames.length -1] || 'black';
    c.style.cssText = 'display:inline-block; width:15px; height:1em; margin-right:5px; background-color:'+polyColor;

    var label = document.createElement('label');
    label.appendChild(l);
    label.appendChild(c);
    label.appendChild(document.createTextNode(newGroupName));

    label.onclick = function() {
      currPolygonGroup = newGroupName;
    };

    document.getElementById('group-list').appendChild(label);
  }

  function addGroupControl() {
    var controlDiv = document.createElement('div');
    var controlUI = document.createElement('div');
    controlUI.className = 'group-controls';
    controlDiv.appendChild(controlUI);

    var controlContent = document.createElement('div');
    var explanation = document.createElement('div');
    var html = '<span>說明:</span><ol style="margin-top:0;"><li>按新增群組</li>';
    html += '<li>開始在地圖上劃大概的區塊</li>';
    html += '<li>點兩下即可完成現在區塊</li>';
    html += '<li>點"手"的圖示並點區塊邊上的點即可微調</li>';
    html += '<li>在區塊上點一下可以選擇清除區塊或者是換群組</li>';
    html += '<li>畫區塊之前也可先點下方群組項目來選擇下一次畫的區塊群組</li>';
    html += '<li>若需畫下一個區塊, 請點"多邊形"圖示</li>';
    html += '</ol><hr>';
    explanation.innerHTML = html;
    controlContent.appendChild(explanation);
    controlUI.appendChild(controlContent);

    var centerControlDiv = document.createElement('div');
    centerControlDiv.className = 'center-controls';

    var addGroupButton = document.createElement('div');
    addGroupButton.onclick = function() {
      var groupName = prompt('群組名稱:', '新群組');
      if (groupName != null) {
        addNewGroup(groupName);
      }
    };
    addGroupButton.textContent = '新增群組';
    centerControlDiv.appendChild(addGroupButton);

    var importButton = document.createElement('div');
    importButton.onclick = function() {
      // trigger file input
      var virtEvent = document.createEvent('MouseEvents');
      virtEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, true, false, false, false, 0, null);
      importInput.dispatchEvent(virtEvent);
    };
    importButton.textContent = '匯入';
    centerControlDiv.appendChild(importButton);

    var exportButton = document.createElement('div');
    exportButton.onclick = function() {
      exportToFile();
    };
    exportButton.textContent = '匯出';
    centerControlDiv.appendChild(exportButton);

    var importInput = document.getElementById('import-file-input');
    importInput.addEventListener('click', function(e) {
      importInput.value = null;
    });
    importInput.addEventListener('change', function(e) {
      if (!e.target.files) return;
      var f = e.target.files[0];
      var reader = new FileReader();
      reader.onload = function(result) {
        var json = JSON.parse(result.target.result);
        importFromFile(json);
      };
      reader.readAsText(f);
    });

    var groupList = document.createElement('form');
    groupList.id = 'group-list';
    controlContent.appendChild(groupList);

    controlDiv.index = 1;
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(controlDiv);
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(centerControlDiv);
  }

  function clearAllPolygon() {
    for (var g in polygonGroups) {
      var l = polygonGroups[g];
      for (var i = 0; i < l.length; ++i) {
        var p = l[i];
        p.setMap(null);
      }
    }
    polygonGroups = {};
  }

  function importFromFile(data) {
    // clear all
    clearAllPolygon();
    groupNames = [];
    document.getElementById('group-list').innerHTML = '';

    // if success, populate
    for (var g in data.polygons) {
      var l = data.polygons[g]; // group
      addNewGroup(g);
      for (var i = 0; i < l.length; ++i) {
        var p = l[i]; // polygon in the group
        var coords = [];
        for (var j = 0; j < p.length; ++j) {
          var v = p[j]; // each vertex
          coords.push({ lat: v[0], lng: v[1] });
        }
        
        // push the polygon
        var c = colors[groupNames.indexOf(g)];
        var poly = new google.maps.Polygon({
          paths: coords,
          strokeColor: c,
          fillColor: c,
          editable: true
        });

        poly.groupName = g;
        poly.setMap(map);
        registerPolyClickHandler(poly);
        polygonGroups[g].push(poly);
      }
    }

    // once populated
    currPolygonGroup = groupNames[0];
  }

  function exportToFile() {
    // json object to export
    var out = {
      groups: groupNames,
      polygons: {}
    };

    // save polygons object into just array of vertices
    for (var group in polygonGroups) {
      var polys = polygonGroups[group];
      out.polygons[group] = [];
      for (var i = 0; i < polys.length; ++i) {
        var path = polys[i].getPath().getArray();
        var p = [];
        for (var j = 0; j < path.length; ++j) {
          var v = path[j];
          p.push([v.lat(), v.lng()]);
        }
        out.polygons[group].push(p);
      }
    }

    // blob to save file
    var blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.download = 'exported_data.json';
    a.href = url;
    var virtEvent = document.createEvent('MouseEvents');
    virtEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, true, false, false, false, 0, null);
    a.dispatchEvent(virtEvent);
  }

  google.maps.event.addDomListener(window, 'load', initialize);
}, false);
