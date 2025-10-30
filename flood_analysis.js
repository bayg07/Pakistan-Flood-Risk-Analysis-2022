
var pakistan = ee.FeatureCollection('FAO/GAUL/2015/level0')
  .filter(ee.Filter.eq('ADM0_NAME', 'Pakistan'));

var sindh = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.eq('ADM1_NAME', 'Sindh'));

var balochistan = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.eq('ADM1_NAME', 'Balochistan'));

var kpk = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.eq('ADM1_NAME', 'Khyber Pakhtunkhwa'));

var punjab = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.eq('ADM1_NAME', 'Punjab'));

var studyArea = sindh.merge(balochistan).merge(kpk).merge(punjab);


var preFlood = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(studyArea)
  .filterDate('2022-06-01', '2022-06-30')
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
  .select('VV')
  .mean()
  .clip(studyArea);

var duringFlood = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(studyArea)
  .filterDate('2022-08-15', '2022-09-30')
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
  .select('VV')
  .mean()
  .clip(studyArea);


// Calculate difference (water appears darker in SAR)
var floodDifference = duringFlood.subtract(preFlood);

// Threshold for flood detection (-3 dB is standard)
var floodMask = floodDifference.lt(-3);

// Calculate flood area in square kilometers
var floodArea = floodMask.multiply(ee.Image.pixelArea()).divide(1000000);

var totalFloodArea = floodArea.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: studyArea,
  scale: 100,
  maxPixels: 1e13
});

print('Total Flooded Area (sq km):', totalFloodArea.get('VV'));


// Get elevation data
var elevation = ee.Image('USGS/SRTMGL1_003').clip(studyArea);

// Calculate slope
var slope = ee.Terrain.slope(elevation);

// Low-lying areas (<50m elevation) + Low slope (<5 degrees) = High risk
var lowElevation = elevation.lt(50);
var flatSlope = slope.lt(5);
var highRiskZone = lowElevation.and(flatSlope);


// Center map on Pakistan
Map.centerObject(studyArea, 6);

// Add layers
Map.addLayer(studyArea, {color: 'gray'}, 'Study Area', false);
Map.addLayer(preFlood, {min: -25, max: 0, palette: ['blue', 'white']}, 'Pre-Flood (June 2022)', false);
Map.addLayer(duringFlood, {min: -25, max: 0, palette: ['blue', 'white']}, 'During Flood (Aug-Sep 2022)', false);
Map.addLayer(floodMask.selfMask(), {palette: ['0000FF']}, 'Detected Flood Extent');
Map.addLayer(highRiskZone.selfMask(), {palette: ['FF0000']}, 'High Risk Zones (Terrain-based)', false);


// Export flood extent as GeoTIFF
Export.image.toDrive({
  image: floodMask.byte(),
  description: 'Pakistan_Flood_Extent_2022',
  folder: 'GEE_Exports',
  region: studyArea,
  scale: 100,
  maxPixels: 1e13
});

// Export high risk zones
Export.image.toDrive({
  image: highRiskZone.byte(),
  description: 'Pakistan_Flood_HighRisk_Zones',
  folder: 'GEE_Exports',
  region: studyArea,
  scale: 100,
  maxPixels: 1e13
});


// Calculate flood area for each province separately
var sindhFlood = floodArea.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: sindh,
  scale: 100,
  maxPixels: 1e13
});

var balochistanFlood = floodArea.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: balochistan,
  scale: 100,
  maxPixels: 1e13
});

var kpkFlood = floodArea.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: kpk,
  scale: 100,
  maxPixels: 1e13
});

var punjabFlood = floodArea.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: punjab,
  scale: 100,
  maxPixels: 1e13
});

// Print results
print('Sindh Flooded Area (sq km):', sindhFlood.get('VV'));
print('Balochistan Flooded Area (sq km):', balochistanFlood.get('VV'));
print('KPK Flooded Area (sq km):', kpkFlood.get('VV'));
print('Punjab Flooded Area (sq km):', punjabFlood.get('VV'));

// Create manual statistics for export
var stats = ee.FeatureCollection([
  ee.Feature(null, {
    'Province': 'Sindh',
    'Flood_Area_sqkm': sindhFlood.get('VV')
  }),
  ee.Feature(null, {
    'Province': 'Balochistan',
    'Flood_Area_sqkm': balochistanFlood.get('VV')
  }),
  ee.Feature(null, {
    'Province': 'KPK',
    'Flood_Area_sqkm': kpkFlood.get('VV')
  }),
  ee.Feature(null, {
    'Province': 'Punjab',
    'Flood_Area_sqkm': punjabFlood.get('VV')
  })
]);

// Export statistics
Export.table.toDrive({
  collection: stats,
  description: 'Flood_Statistics_by_Province',
  fileFormat: 'CSV'
});

print('✅ Analysis Complete!');
print('Click on "Tasks" tab to export results to Google Drive');