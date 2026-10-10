const assert = require("node:assert/strict");
const test = require("node:test");
const {
  GEOFENCE_RADIUS_METERS,
  distanceInMeters,
  isValidCoordinates,
} = require("../features/tourism/geo");

test("tourism geofence uses the configured 200 meter limit", () => {
  assert.equal(GEOFENCE_RADIUS_METERS, 200);
  assert.equal(
    distanceInMeters(
      { latitude: 10, longitude: 78 },
      { latitude: 10, longitude: 78 }
    ),
    0
  );
  assert.ok(
    distanceInMeters(
      { latitude: 10, longitude: 78 },
      { latitude: 10.001, longitude: 78 }
    ) < GEOFENCE_RADIUS_METERS
  );
  assert.ok(
    distanceInMeters(
      { latitude: 10, longitude: 78 },
      { latitude: 10.002, longitude: 78 }
    ) > GEOFENCE_RADIUS_METERS
  );
});

test("tourism geofence rejects invalid coordinate values", () => {
  assert.equal(isValidCoordinates(10, 78), true);
  assert.equal(isValidCoordinates(-90, 180), true);
  assert.equal(isValidCoordinates(90.1, 78), false);
  assert.equal(isValidCoordinates(10, -181), false);
  assert.equal(isValidCoordinates("10", 78), false);
  assert.equal(isValidCoordinates(Number.NaN, 78), false);
});
