const haversine = require('../utils/haversine');
const { OFFICE_COORDINATES, MAX_GEOFENCE_DISTANCE_KM } = require('../config/constants');
const  verifyLocation =  (req, res, next) =>{
  const { lat, lng } = req.body;
  console.log("body",req.body)

  if (!lat || !lng) {
    return res.status(400).json({
      status: 'fail',
      message: 'Latitude and longitude are required',
    });
  }

  const distance = haversine({ lat, lng }, OFFICE_COORDINATES);
  if (distance > MAX_GEOFENCE_DISTANCE_KM) {
    return res.status(403).json({
      status: 'fail',
      message: `You are outside the geofence (Distance: ${distance.toFixed(2)} km)`,
    });
  }

  // Attach valid location to request for later use
  req.validLocation = { lat, lng };

  // Continue to controller
  next();
};

module.exports = verifyLocation;
