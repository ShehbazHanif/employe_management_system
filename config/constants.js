require('dotenv').config();

module.exports = {
  OFFICE_COORDINATES: {
    lat: parseFloat(process.env.OFFICE_LAT),
    lng: parseFloat(process.env.OFFICE_LNG),
  },
  MAX_GEOFENCE_DISTANCE_KM: parseFloat(process.env.MAX_DISTANCE_KM),
};