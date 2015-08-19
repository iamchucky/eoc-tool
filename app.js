document.addEventListener('DOMContentLoaded', function() {
  var apiKey = 'AIzaSyA4rAT0fdTZLNkJ5o0uaAwZ89vVPQpr_Kc';

  var map;
  var drawingManager;
  var polygonGroups = {};
  var groupNames = [];
  var currPolygonGroup = null;
  var colors = ['ff0000', '0000ff', '00ff00', 'ff00ff', '00ffff', 'ffff00', '000000'];

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
      var c = '#'+colors[groupNames.indexOf(currPolygonGroup)];
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
      var c = '#'+colors[groupNames.indexOf(currPolygonGroup)];
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
    var polyColor = '#'+colors[groupNames.length -1] || '#000000';
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
        importFromFile(result.target.result);
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

  function importFromFile(text) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(text, 'text/xml');

    // clear all
    clearAllPolygon();
    groupNames = [];
    document.getElementById('group-list').innerHTML = '';

    var folders = doc.querySelectorAll('Document > Folder');
    for (var i = 0; i < folders.length; ++i) {
      var f = folders[i];
      var groupName = f.getElementsByTagName('name')[0].textContent;
      addNewGroup(groupName);

      var polys = f.getElementsByTagName('coordinates');
      for (var j = 0; j < polys.length; ++j) {
        var p = polys[j].textContent.replace(/\n/g, '').split(' ');
        var coords = [];
        for (var k = 0; k < p.length; ++k) {
          var v = p[k];
          if (!v) continue;

          v = v.split(',');
          coords.push({ lat: parseFloat(v[1]), lng: parseFloat(v[0]) });
        }

        // push the polygon
        var c = '#'+colors[groupNames.indexOf(groupName)];
        var poly = new google.maps.Polygon({
          paths: coords,
          strokeColor: c,
          fillColor: c,
          editable: true
        });

        poly.groupName = groupName;
        poly.setMap(map);
        registerPolyClickHandler(poly);
        polygonGroups[groupName].push(poly);
      }
    }

    // once populated
    currPolygonGroup = groupNames[0];
  }



  function exportToFile() {
    var kmlHead = '<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n<Document>\n';
    var styleBlock = '';
    // loop through the groupNames to get colors
    for (var i = 0; i < groupNames.length; ++i) {
      var g = groupNames[i];
      var c = colors[groupNames.indexOf(g)];
      c = c.slice(4) + c.slice(2, 4) + c.slice(0, 2);
      // append style to style block
      styleBlock += '<Style id="group'+i+'" groupname="'+g+'">\n';
      styleBlock += '\t<LineStyle>\n';
      styleBlock += '\t\t<color>ff'+c+'</color>\n';
      styleBlock += '\t\t<width>2</width>\n';
      styleBlock += '\t</LineStyle>\n';
      styleBlock += '\t<PolyStyle>\n';
      styleBlock += '\t\t<color>7f'+c+'</color>\n';
      styleBlock += '\t</PolyStyle>\n';
      styleBlock += '</Style>\n';
    }

    var folderBlock = '';
    for (var k = 0; k < groupNames.length; ++k) {
      var group = groupNames[k];
      folderBlock += '<Folder>\n';
      folderBlock += '\t<name>'+group+'</name>\n';

      var polys = polygonGroups[group];
      for (var i = 0; i < polys.length; ++i) {
        folderBlock += '\t<Placemark>\n';
        folderBlock += '\t\t<name>placemark'+k+'_'+i+'</name>\n';
        folderBlock += '\t\t<styleUrl>#group'+k+'</styleUrl>\n';
        folderBlock += '\t\t<ExtendedData>\n\t\t\t<SimpleData name="groupName">'+group+'</SimpleData>\n\t\t</ExtendedData>\n';
        folderBlock += '\t\t<Polygon>\n';
        folderBlock += '\t\t\t<outerBoundaryIs>\n\t\t\t\t<LinearRing>\n\t\t\t\t\t<coordinates>';
        var path = polys[i].getPath().getArray();
        var p = [];
        for (var j = 0; j < path.length; ++j) {
          var v = path[j];
          p.push(' ' + v.lng() + ',' + v.lat() + ',0');
        }
        folderBlock += p.join('\n');

        folderBlock += ' </coordinates>\n\t\t\t\t</LinearRing>\n\t\t\t</outerBoundaryIs>\n';
        folderBlock += '\t\t</Polygon>\n';
        folderBlock += '\t</Placemark>\n';
      }

      folderBlock += '</Folder>\n';
    }

    // blob to save file
    var blob = new Blob([kmlHead+styleBlock+folderBlock+'</Document>\n</kml>'], { type: 'application/xml' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.download = 'exported.kml';
    a.href = url;
    var virtEvent = document.createEvent('MouseEvents');
    virtEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, true, false, false, false, 0, null);
    a.dispatchEvent(virtEvent);
  }

  google.maps.event.addDomListener(window, 'load', initialize);
}, false);
