import { CuboidCollider, CylinderCollider, RigidBody, useRapier } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useKeyboardControls } from "@react-three/drei";
import { useEffect, useRef, useState, createRef } from "react";
import * as THREE from "three"
import useGame from "../stores/useGame";

// isCanvasClicked sent as prop 
export default function Player({canvasIsClicked}) {
    
    // Zustand states and functions
    const papersLeft = useGame((state) => {return state.papersLeft})
    const thrownPaperLocations = useGame((state) => {return state.thrownPaperLocations}) // probably not needed in this component
    const subtractPaperLeft = useGame((state) => state.subtractPaperLeft)
    const addPaperLocation = useGame((state) => state.addPaperLocation)
    const start = useGame((state) => state.start)
    const restart = useGame((state) => state.restart)
    const end = useGame((state) => state.end)
    const resetPapers = useGame((state) => state.resetPapers)

    // playerModel.scene.children.forEach((mesh) =>
    // {
    //     mesh.castShadow = true
    // })

    let startingNumPapers = 6
    /**
     * ref array created for all papers users can throw
     * Bug: position triggered when < -3 y but paper yet to be thrown
     * perhaps add to thrown state array -> check that current has been thrown
     */
    const paperRefs = useRef(Array.from({length: startingNumPapers}, () => createRef()))
    const [ currentThrowingPaper, setCurrentThrowingPaper ] = useState(0)

    const playerRef = useRef()
    const bodyMesh = useRef()
    
    let throwingNewspaper = paperRefs.current[currentThrowingPaper]
    const [ subscribeKeys, getKeys ] = useKeyboardControls()
    const { rapier, world } = useRapier()
    const rapierWorld = world.raw()
    const [ smoothedCameraPositon ] = useState(() => new THREE.Vector3(10, 10, 10))
    const [ smoothedCameraTarget ] = useState(() => new THREE.Vector3())
    const [ aiming, setAiming ] = useState(false)
    const [ pointLocation, setPointLocation ] = useState(0)
    const [ thrown, setThrown ] = useState(false)
    const [thrownIndexArray, setThrownIndexArray] = useState([])

    const jump = () => {

        const origin = playerRef.current.translation()
        origin.y -= 0.31
        const direction = { x:0, y:-1, z:0 }
        const ray = new rapier.Ray(origin, direction)
        const hit = rapierWorld.castRay(ray, 10, true)
        if (hit.toi < 0.1) {
            playerRef.current.applyImpulse({ x:0, y:0.05, z:0 })
        }
        
    }

    const reset = () => {
        // need to reset scores also 
        restartPlayer() 
        resetPapers()  
    }
    
    const restartPlayer = () => {
        playerRef.current.setTranslation({ x: 0, y: 1, z: 0 })
        playerRef.current.setLinvel({ x: 0, y: 0, z: 0 })
        playerRef.current.setAngvel({ x: 0, y: 0, z: 0 }) 

    }

    // const resetPapers = () => {
    //     // recreate array?
    //     // reset throwing paper to index zero
    //     // reset score
    // }

    // TODO: how to have an eventlistener for mouse down here?
    useEffect(() => {
        const unsubscribeReset = useGame.subscribe(
            (state) => state.phase,
            (value) =>
            {
                if(value === 'ready')
                    reset()
            }
        )
        // subscribekeys notes when they change state from pressed, to not pressed
        const unsubscribeJump = subscribeKeys((state) => {
            return state.jump
        }, (value) => {
            if(value) {jump()}
        })
      
        const unsubscribeKeys = subscribeKeys((state) => {
            start()
            // or mouse
        })
        return () => {
            unsubscribeReset()
            unsubscribeJump()
            unsubscribeKeys()
        }
    }, [])

    console.log("thrown indexes: ", thrownIndexArray)

    useFrame((state, delta) => {
        const { forward, backward, leftward, rightward} = getKeys()

        const impulse = { x:0, y:0, z:0 }
        const torque = { x:0, y:0, z:0 }

        const impulseStrength = 1 * delta
        const torqueStrength = 1 * delta

        if (forward) {
            impulse.z -= impulseStrength
        } 

        if (backward) {
            impulse.z = impulseStrength
        } 
        
        if (leftward) {
            impulse.x -= impulseStrength
        } 

        if (rightward) {
            impulse.x = impulseStrength
        } 


        playerRef.current.applyImpulse(impulse)
        playerRef.current.applyTorqueImpulse(torque)

        /**
         * Camera
         */
        const playerPosition = playerRef.current.translation()

        // array of previous and current positions
        // find difference in the vectors
        // below was trial and error to get the newspaper to follow the player 
        // get the difference in the vectors and applyTranslation to the newspaper
        // translation can be applied to kinematic rigidbody

        const cameraPosition = new THREE.Vector3()
        cameraPosition.copy(playerPosition)
        cameraPosition.z += 2.5
        cameraPosition.y += 0.9
        
        const cameraTarget = new THREE.Vector3()
        cameraTarget.copy(playerPosition)

        smoothedCameraPositon.lerp(cameraPosition, 5 * delta)
        smoothedCameraTarget.lerp(cameraTarget, 5 * delta)

        state.camera.position.copy(smoothedCameraPositon)
        state.camera.lookAt(smoothedCameraTarget)
        /**
         * Phases
         */
        if (playerPosition.z < - (5* 4 + 2)) { 
            end()
        }

        if (playerPosition.y < - 3) {
            restart()
        }
        
        if (aiming && canvasIsClicked) { // aiming
            /**
             * moves paper before throw is actioned on mouse up
            */
           
           if(!thrown && throwingNewspaper.current){
                console.log("throwingNewspaper.current: ", throwingNewspaper.current)
                // attempt -> paper always above body and transaparent paper with hand??
                // bug fixed: 2nd paper onwards throwing downwards
                // setLinVel == 0 to overcome velocity from free falling pre throw
                throwingNewspaper.current.setLinvel({x: 0, y: 0, z: 0})
                throwingNewspaper.current.setAngvel({ x: 0, y: 0, z: 0 }) 
                throwingNewspaper.current.setTranslation({x: playerPosition.x, y: playerPosition.y+0.6, z: playerPosition.z + 0.2})
                
                // console.log("paperQuantity: ", paperQuantity)
            }
            



            // Later have html or sprite arrow for aiming direction
            // Aim: to have newspaper move back to pointer position, like loading for a throw
            // impulse direction taken from pointer position in relation to body
            // when canvasIsClicke == False; apply impulse
            // camera looks at centre in x and y

        }
        // throwing when pointer lifted
        if (aiming && !canvasIsClicked && throwingNewspaper.current) {
            // use pointer location @ release -> -1 to 1
            // TODO: use magnitude of each x and y
            // setThrowing(true)
            // first thoughts: yPointer == yImpulse and zImpulse takes yPointer magnitude
            // let impulse = { x:-state.pointer.x/100, y:0.01, z:state.pointer.y/100 } // impulse for when paper follows pointer
            // calc y from magnitude
            // let magnitudePointer = Math.sqrt((state.pointer.x/50)**2 + (state.pointer.y/50)**2)
            let magnitudePointer = Math.max(Math.abs(state.pointer.x/50), Math.abs(state.pointer.y/50))
            let impulse = { x:-state.pointer.x/50, y: magnitudePointer, z:state.pointer.y/50 } // impulse paper in one spot

            throwingNewspaper.current.applyImpulse(impulse)
            setThrown(true)
            setThrownIndexArray((prev) => [...prev, currentThrowingPaper]) // add further index to list
            setAiming(false)
            // below should be actioned on aiming but returned to pile if not thrown
            // setPaperQuantity((current) => current - 1)
            subtractPaperLeft()
            /**
             * below changes throwing newspaper to next in ref array
             * not actioned when last in ref array -> no further paper mesh to reference
             */
            if (currentThrowingPaper < startingNumPapers - 2) {

                throwingNewspaper = paperRefs.current[currentThrowingPaper + 1]

                // setCurrentThrowingPaper((current) => (current < papersLeft - 2 ) ? current + 1 : current)
            }
            /**
             * below changes state for current throwing newspaper
             * unclear if this should be actioned when last in ref array
             * perhaps set to null after final throw? -> would need checks that not null in throwing logic
             */
            setCurrentThrowingPaper(Math.min(startingNumPapers - 1 ,startingNumPapers - papersLeft + 1))            
        }
        
        /**
         * bug: linvel null after final paper is thrown
         * bug fixed: -3y triggered before paper is thrown
         * by checking that index is in the thrownIndexArray
         */
        if (thrownPaperLocations.length < currentThrowingPaper || (currentThrowingPaper == startingNumPapers - 1 && thrownPaperLocations.length == currentThrowingPaper)) { // perhaps check that current > 0 as players may throw 2 in quick succession
            // if not last index; use current index subtract 1. Otherwise if last index use current index.
            let diff = currentThrowingPaper - thrownPaperLocations.length
            let chosenIndex = currentThrowingPaper - diff
            let currentMesh = paperRefs.current[chosenIndex].current
            console.log("currentMeshTranslation: ",currentMesh.linvel() && currentMesh.linvel())
            console.log("thrownIndexArray.includes(chosenIndex) :", chosenIndex,thrownIndexArray.includes(chosenIndex) )
                if ( thrownIndexArray.includes(chosenIndex) && ((currentMesh.linvel().y == 0 && currentMesh.linvel().z == 0) || currentMesh.translation().y < -3)) {
                    // add location to array
                    let newLocation = currentMesh.translation()
                    addPaperLocation(newLocation)

                }
        }
    })

    function initAim(event) {
        
        if (thrown) { // not actioned on first go; only after at least 1 has been thrown
            setThrown(false)
        }
        if (papersLeft > 0) {

            // only if newspapers are left to throw!
            // Done: have object in place of newspaper - > cube for now
            // TODO: allow for drag of mouse -> distance of drag more force
            setPointLocation(event.point)
            setAiming(true)
            // on release -> throw newspaper
        }
    }

    const newspaperShell = (
    <>
        <boxGeometry args={ [ 0.03, 0.1, 0.5 ] } />
        <meshStandardMaterial flatShading color="white" />        
    </>
    )

    /**
     *     // TODO: sense that paper landed on house tile -> throwing paper before moved again
    // perhaps change thrown with normal paper mesh
    // each time thrown selected -> add mesh location to array -> if mesh velocity == 0
     */


    return <>

    <RigidBody
        ref={ playerRef }
        restitution={ 0.2 }
        friction={ 1 } 
        linearDamping={ 0.5 }
        angularDamping={ 0.5 }
        position={ [ 0, 1, 0 ] }
        collisionGroup={1}
        >
        {/* TODO: allow click and drag to set and aim for throw; release for throw */}
        {/* Later: click area should be near character, allow from not on character later */}
        <mesh
            ref={ bodyMesh } 
            castShadow
            onPointerDown={initAim}
            >
            {/* <primitive object={ playerModel.scene } scale={ 0.2 } /> */}

            <boxGeometry args={ [ 0.3, 0.3, 0.3 ] } />
            <meshStandardMaterial flatShading color="mediumpurple" />
        </mesh>
    </RigidBody>

    {Array.from({length: startingNumPapers}, (_, index) => {
        return( ((aiming || thrown) && index <= currentThrowingPaper) ?
        <RigidBody
            ref={paperRefs.current[index]}
            restitution={ 0.2 }
            friction={ 1 } 
            linearDamping={ 0.5 }
            angularDamping={ 0.5 }
            // hack -> position off screen, then teleported above box when aiming
            position={[ 0, -5, -1 ]}
            collisionGroup={2}
            key={index}
        >
            <mesh castShadow>
            <>
        <boxGeometry args={ [ 0.03, 0.1, 0.5 ] } />
        <meshStandardMaterial flatShading color="white" />        
            </>
            </mesh>
        </RigidBody> : null
        )       
    })}
    </>
}