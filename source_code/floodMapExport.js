// This function will be called by the main script to download the flood map.

// Define a function to smoothen the raster and export the shapefile
var getFloodShpUrl = function(floodLayer, value, radius, aoi, cellSize, filename){
  // Define a boxcar or low-pass kernel.
  var boxcar = ee.Kernel.square({
    radius: radius, units: 'pixels', magnitude: 1
  });
  
  // Smoothen and threshold the binary flood raster
  var smooth_flood = floodLayer.eq(value).convolve(boxcar);
  var smooth_flood_binary = smooth_flood.updateMask(smooth_flood.gt(0.5)).gt(0)
  
  // Vectorise the binary flood raster
  var vectors = smooth_flood_binary.reduceToVectors({
    geometry: aoi,
    crs: floodLayer.projection(),
    scale: cellSize,
    geometryType: 'polygon',
    eightConnected: false,
    labelProperty: 'zone',
    maxPixels: 9e12
    });
  
  // Convert the vector to feature collection
  var flood_vector = ee.FeatureCollection(vectors);

// Function to export each flood class
  var exportFloodClass = function(floodClass, classValue, filename) {
    var classFlood = floodClass.eq(classValue);
    var vectors = classFlood.reduceToVectors({
      geometry: aoi,
      crs: floodClass.projection(),
      scale: cellSize,
      geometryType: 'polygon',
      eightConnected: false,
      labelProperty: 'zone',
      maxPixels: 9e12
    });

    var flood_vector = ee.FeatureCollection(vectors);
    var vector_url = flood_vector.getDownloadURL('kml', [], filename + '_class_' + classValue);
    return vector_url;
  };

  // Array of flood classes (0 to 4)
  var floodClasses = [0, 1, 2, 3, 4];
  
  // Create an array of URLs for each flood class
  var floodUrls = floodClasses.map(function(classValue) {
    return exportFloodClass(smooth_flood_binary, classValue, filename);
  });

  // Return the array of URLs
  return floodUrls;
}

exports.getFloodShpUrl = getFloodShpUrl;
;
