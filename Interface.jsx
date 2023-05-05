import { useEffect, useRef } from "react"
import useGame from "./stores/useGame"
import { addEffect } from "@react-three/fiber"

export default function Interface() {
    const papersLeft = useGame((state) => {return state.papersLeft}) 
    const startingNumPapers = useGame((state) => {return state.startingNumPapers}) 
    const papersDelivered = useGame((state) => state.papersDelivered) 
    let pDelivered = 0
    const deliveredRef = useRef()

    useEffect(() => {
        const unsubscribeEffect = addEffect(() => {
            const state = useGame.getState()
            console.log(state)

            let elapsedTime = 0
            if (state.phase === 'playing') {
                elapsedTime = Date.now() - state.startTime
            }
            else if (state.phase === 'ended') {
                elapsedTime = state.endTime - state.startTime
            }
            elapsedTime /= 1000
            elapsedTime = elapsedTime.toFixed(2)

            // if (time.current) {
            //     time.current.textContent = elapsedTime
            // }
            /**
             * bug delivered resetting from zero back to previous total
             * for mvp reset location only not papers thrown allow refresh restart
             */
            pDelivered = state.papersDelivered
            if (deliveredRef.current) {
                deliveredRef.current.textContent = pDelivered
            }
        })

        return () => {
            unsubscribeEffect()
        }
    } ,[])

    let papersThrown = startingNumPapers - papersLeft
    // cross emojis
    let crosses = ''
    for (let i = 0; i < papersThrown; i ++ ) {
        crosses += '❌'
    }

    let papers = ''
    for (let i = 0; i < startingNumPapers; i ++ ) {
        papers += '🗞️'
    }
    /**
     * issue -> this component is outside of React
     */
    console.log("delivered", papersDelivered)
    return (<div className="interface">
        <div className="papersLeft">{papers}</div>
        <div className="crossOverlayPapersLeft">{crosses}</div>
        <div className="papersDelivered">📰 <span ref={deliveredRef}>{pDelivered}</span>/ {startingNumPapers} </div>
    </div>)
}