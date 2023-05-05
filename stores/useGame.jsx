import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware"
import { checkIfOnTarget } from "../hooks/onTarget";


export default create(subscribeWithSelector((set) => {
    return {
        startingNumPapers: 6,
        papersLeft: 6,
        papersDelivered: 0, // use onTarget
        thrownPaperLocations: [],
        targetLocations: [], 

        /**
         * Time
         */
        startTime: 0,
        endTime: 0,

        /**
         * Phases
         */
        phase: 'ready',
        start: () => {
            set((state) => {
                if (state.phase==='ready')
                    return { phase: 'playing', startTime: Date.now() }
                return {}
                
            })
        },
        restart: () => { // perhaps also have reset/respawn -> maintain score and respawn
            console.log("restart")
            set((state) => {
                if (state.phase==='playing')
                    return { phase: 'ready'}            
                return {}
            })
        },
        end: () => {
            set((state) => {
                if (state.phase==='playing' || state.phase ==='ended')
                    return { phase: 'ended', endTime: Date.now() }
                return {}
            })
        },


        // function to remove paper from papersLeft -> called from Player
        subtractPaperLeft: () => {
            set((state) => {
                if (state.papersLeft > 0) 
                return { papersLeft: state.papersLeft - 1}
                return{}
            })
        },

        resetPapers: () => {
            // reset papersLeft startingNumPapers
            set((state) => {
                return { papersLeft: state.startingNumPapers}
            })
            // reset paperLocations
            set(() => {
                return { thrownPaperLocations: [] }
            })
            // unclear why this resets to previous value
            set(() => {
                return { papersDelivered: 0 }
            })
            return {}
        },
        
        addPaperLocation: (newLocation) => {
            console.log("useGame addLocation: ", newLocation)
            
            set((state) => ({
                thrownPaperLocations: [...state.thrownPaperLocations, newLocation]
                
            }))
            
            
            /** 
             * check location of thrown paper against property/houses locations
             * if on property add to papersDelivered 
             * 
             *  */ 
            set((state) => {                
                if (checkIfOnTarget(newLocation, state.targetLocations)) {
                // if so add to papers delivered
                    return { papersDelivered: state.papersDelivered + 1}
                }
                return{}

            })
        },

        setTargetLocations: (locationArray) => {
            set(() => ({
                targetLocations: locationArray
            }))
        }

    }
}))