const StopTime = require('../../models/gtfs/stop-time');

/*
 * Give a list of TripUpdates
 */
const updateStoptimes = async (query = {}, updateDoc) => {
  if (query.agency_key === 'undefined') {
    throw new Error('`agency_key` is a required parameter.');
  }

  const opt = {
    multi: false,
    upsert: false,
    maxTimeMS: 1000
  }
  let where = {
    agency_key:query.agency_key,
    stop_id: query.stop_id,
    trip_id: query.trip_id
  }
  // where = {};
  if(typeof updateDoc.stop_time_update === "string") {
    console.log("stop time update was a string")
    updateDoc.stop_time_update = JSON.parse(updateDoc.stop_time_update)
  }

  let update = {
      stop_time_update: updateDoc.stop_time_update
  }


  console.log('### updating stop ' + where.agency_key + " " + where.stop_id);
  StopTime.update(where, update, opt, function (err, raw) {
    if (err) {
      console.log(err);
    }
    console.log('The raw response from Mongo was ', raw);
  })

  // console.log('attempting a find')
  // StopTime.findOne(where, function(err, doc) {
  //     if (err) {
  //       console.log(err);
  //     }
  //     if(doc != null) {
  //       doc.set({stop_time_update: updateDoc.stop_time_update});
  //       // console.log("update is: " + JSON.stringify(updateDoc.stop_time_update))
  //       // console.log("Mongo found a doc? " + JSON.stringify(doc));
  //
  //       doc.save((error, succ) => {
  //         if (error) {
  //           console.log(error);
  //         }
  //         console.log("saved doc update is: " + JSON.stringify(succ))
  //       })
  //     } else {
  //       console.error("## got a null doc!");
  //     }
  // })

  // StopTime.findByIdAndUpdate(where, updateDoc, opt, function (err, doc) {
  //   if (err) {
  //     console.log(err);
  //   }
  //   console.log('The findbyIdandUpdate raw response from Mongo was ', JSON.stringify(doc));
  // })
  // return StopTime.find(query, projection, options);
};

const processStopTimeUpdate = async (update, agencyKey, tripId) => {
  let stopId = update.stop_id
  try {
    //convert the Longs to seconds, will need to multiply by 1000 later to convert to Date()
    update.arrival.time = update.arrival.time.toString()
    update.departure.time = update.departure.time.toString()
  } catch (e){}

  const updateDoc = {
    stop_time_update: update
  }

  return updateStoptimes({
    agency_key: agencyKey,
    trip_id: tripId,
    stop_id: update.stop_id
  }, updateDoc)
}

exports.processRealtimeEntity = async (agencyKey, feed) => {
  feed.entity.forEach(function(entity) {
    if (entity.trip_update) {
      // console.log(entity.trip_update);
      let stopTimeUpdates = entity.trip_update.stop_time_update;
      let tripId = entity.trip_update.trip.trip_id;
      stopTimeUpdates.forEach((update) => {
        processStopTimeUpdate(update, agencyKey, tripId);
      });
    }
  });
}
