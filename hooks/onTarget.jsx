// goal -> compare locations of target meshes to thrown papers
// send in paper location
// traverse scene
// find locations of each target mesh (bounding box or similar)
// check if newspaper within target area
// return true/false

export function checkIfOnTarget(paperLocation, targetLocations) { 

  console.log("paperL: ", paperLocation)  
  for (let i=0; i<targetLocations.length; i++) {
      // vector paperLocation to centre of current
      let currentTarget = targetLocations[i]
      let currentCentre = currentTarget.centre
      let currentMaxDelta = currentTarget.maxDelta 

      let currentVectorDelta = [
                                paperLocation.x-currentCentre[0], 
                                paperLocation.y-currentCentre[1], 
                                paperLocation.z-currentCentre[2]
                              ]
      console.log("currentVectorDelta: ", currentVectorDelta, currentMaxDelta)
      /**
       * check that paper location is on any target area
       * check that y delta not goofing it
       */

      if (Math.abs(currentVectorDelta[0]) <= Math.abs(currentMaxDelta[0]) && Math.abs(currentVectorDelta[1]) <= (Math.abs(currentMaxDelta[1]) + 1) && Math.abs(currentVectorDelta[2]) <= Math.abs(currentMaxDelta[2])) {
        console.log("hit")
        return true
      }

    }

  return false;
}