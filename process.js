document.addEventListener('DOMContentLoaded', function() {
  var map;
  var polygonGroups = {};
  var groupNames = [];
  var currPolygonGroup = null;
  var colors = ['ff0000', '0000ff', '00ff00', 'ff00ff', '00ffff', 'ffff00', '000000'];

  function getGroup(latLng) {
    for (var g in polygonGroups) {
      var l = polygonGroups[g];
      for (var i = 0; i < l.length; ++i) {
        var p = l[i];
        if (google.maps.geometry.poly.containsLocation(latLng, p)) {
          return g;
        }
      }
    }
    return 'none';
  }

  function initialize() {
    map = new google.maps.Map(document.getElementById('map-canvas'), {
      zoom: 14,
      center: { lat: 25.05, lng: 121.54 },
      zoomControl: true,
      disableDefaultUI: true
    });

    registerHandlers();
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
    l.type = 'checkbox';
    l.value = newGroupName;
    l.checked = true;
    l.addEventListener('change', function() {
      hideShowDataList();
    });

    var c = document.createElement('div');
    var polyColor = '#'+colors[groupNames.length -1] || '#000000';
    c.style.cssText = 'display:inline-block; width:15px; height:1em; margin-right:5px; background-color:'+polyColor;

    var label = document.createElement('label');
    label.appendChild(l);
    label.appendChild(c);
    label.appendChild(document.createTextNode(newGroupName));

    label.addEventListener('click', function() {
      currPolygonGroup = newGroupName;
    });

    var outerDiv = document.createElement('div');
    outerDiv.className = 'checkbox';
    outerDiv.appendChild(label);

    document.getElementById('group-list').appendChild(outerDiv);
  }

  function registerFileInputHandler(elemId, callback) {
    var input = document.getElementById(elemId);
    input.addEventListener('click', function(e) {
      input.value = null;
    });
    input.addEventListener('change', function(e) {
      if (!e.target.files) return;
      var f = e.target.files[0];
      var reader = new FileReader();
      reader.onload = function(result) {
        if (callback) {
          callback(result.target.result);
        }
      };
      reader.readAsText(f);
    });
    return input;
  }

  function registerHandlers() {
    var importPolygonInput = registerFileInputHandler('import-polygon-file-input', importPolygonFromFile);
    var importDataInput = registerFileInputHandler('import-data-file-input', importDataFromFile);


    var importPolygonFileButton = document.getElementById('import-polygon-file-btn');
    importPolygonFileButton.addEventListener('click', function(e) {
      // trigger file input
      var virtEvent = document.createEvent('MouseEvents');
      virtEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, true, false, false, false, 0, null);
      importPolygonInput.dispatchEvent(virtEvent);
    });

    var importDataFileButton = document.getElementById('import-data-file-btn');
    importDataFileButton.addEventListener('click', function(e) {
      // trigger file input
      var virtEvent = document.createEvent('MouseEvents');
      virtEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, true, false, false, false, 0, null);
      importDataInput.dispatchEvent(virtEvent);
    });
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

  function appendToDataList(data, groupInd) {
    var dataListContainer = document.getElementById('data-list-container');
    var handled = data['CaseComplete'] == 'true';
    var handledCssText = handled?'case-handled':'case-not-handled';
    var caseLabel = 'case-label-'+labels.indexOf(data['PName']);

    var polyColor = '#'+colors[groupInd] || '#000000';
    var groupColorCss = 'display:inline-block; width:15px; height:1em; margin-left:5px; background-color:'+polyColor;

    var elem = document.createElement('div');
    elem.className = 'panel panel-default '+handledCssText+' '+caseLabel;
    elem.innerHTML = '<div class="panel-heading">'+data['Name']+'<div style="'+groupColorCss+'"></div></div><div class="panel-body">'+data['CaseLocationDescription']+'<br>'+data['CaseDescription']+'<hr>'+data['CaseTime']+'</div><div class="panel-footer"">'+(handled?'<div class="label label-success">已處理</div>':'<div class="label label-danger">未處理</div>')+'<div class="label label-default">'+data['PName']+'</div></div>';
    dataListContainer.appendChild(elem);

    return elem;
  }

  var grouped = {};
  var labels = [];
  function importDataFromFile(text) {
    document.getElementById('data-list-container').innerHTML = '';

    var data = JSON.parse(text);
    data = data['DataSet']['diffgr:diffgram']['NewDataSet']['CASE_SUMMARY'];

    grouped['none'] = [];
    for (var i = 0; i < groupNames.length; ++i) {
      var g = groupNames[i];
      grouped[g] = [];
    }

    for (var i = 0; i < data.length; ++i) {
      var r = data[i];
      var latLng = new google.maps.LatLng(r['Wgs84Y'], r['Wgs84X']);
      var g = getGroup(latLng);
      var groupInd = groupNames.indexOf(g);
      var c = '#'+colors[groupInd];

      if (g != 'none') {
        var m = new google.maps.Marker({
          position: latLng,
          map: map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            strokeColor: c,
            strokeWeight: 4,
            scale: 2
          }
        });
        var handled = r['CaseComplete'] == 'true';
        var info = new google.maps.InfoWindow({ maxWidth: 400 });
        var contentStr = '<div id="info-content"><h3>'+r['Name']+'</h3><p>'+r['CaseLocationDescription']+'</p><p>'+r['CaseDescription']+'</p><p>'+r['CaseTime']+'</p>'+(handled?'<div class="label label-success">已處理</div>':'<div class="label label-danger">未處理</div>')+'<div class="label label-default">'+r['PName']+'</div></div>';
        m.addListener('click', (function(m, content) {
          return function() {
            info.setOptions({ content: content });
            info.open(map, m);
          };
        })(m, contentStr));
        r.marker = m;

        if (labels.indexOf(r['PName']) < 0) {
          labels.push(r['PName']);
        }
        r.listElem = appendToDataList(r, groupInd);
      }
      grouped[g].push(r);
    }

    // populate label filter
    var labelFilter = document.getElementById('label-filter');
    labelFilter.innerHTML = '';

    function appendLabel(l, style) {
      var labelElem = document.createElement('div');
      labelElem.textContent = l;
      labelElem.className = 'label label-'+style;
      labelElem.style.cssText = 'cursor:pointer;';
      labelFilter.appendChild(labelElem);
    }
    labelFilter.addEventListener('click', function(e) {
      if (e.target && e.target.classList.contains('label')) {
        e.target.classList.toggle('opac');

        // now we update the list
        hideShowDataList();
      }
    });

    appendLabel('已處理', 'success');
    appendLabel('未處理', 'danger');
    for (var i = 0; i < labels.length; ++i) {
      var l = labels[i];
      appendLabel(l, 'default');
    }

    for (var i = 0; i < groupNames.length; ++i) {
      var g = groupNames[i];
      console.log(g + ': ' + grouped[g].length);
    }
    console.log('none: ' + grouped['none'].length);
  }

  function hideShowDataList() {
    var child = document.getElementById('label-filter').children;
    var labelShow = {};
    for (var i = 0; i < child.length; ++i) {
      labelShow[child[i].textContent] = !child[i].classList.contains('opac');
    }

    var groupShow = {};
    var groupElems = document.querySelectorAll('#group-list input');
    for (var i = 0; i < groupElems.length; ++i) {
      var elem = groupElems[i];
      var g = elem.parentElement.textContent;
      var checked = elem.checked;
      groupShow[g] = checked;
    }

    for (var i = 0; i < groupNames.length; ++i) {
      var g = groupNames[i];
      for (var j = 0; j < grouped[g].length; ++j) {
        var r = grouped[g][j];
        var handled = r['CaseComplete'] == 'true' ? '已處理':'未處理';

        if (groupShow[g] && (labelShow[r['PName']] || labelShow[handled])) {
          r.listElem.style.display = 'block';
        } else {
          r.listElem.style.display = 'none';
        }
      }
    }
  }

  function importPolygonFromFile(text) {
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
        //poly.setMap(map);
        polygonGroups[groupName].push(poly);
      }
    }

    // once populated
    currPolygonGroup = groupNames[0];
  }



  function exportToFile() {

    /*
    // blob to save file
    var blob = new Blob([kmlHead+styleBlock+folderBlock+'</Document>\n</kml>'], { type: 'application/xml' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.download = 'exported.kml';
    a.href = url;
    var virtEvent = document.createEvent('MouseEvents');
    virtEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, true, false, false, false, 0, null);
    a.dispatchEvent(virtEvent);
    */
  }

  google.maps.event.addDomListener(window, 'load', initialize);
}, false);
