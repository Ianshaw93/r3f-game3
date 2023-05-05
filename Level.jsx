import * as THREE from 'three'
import { CylinderCollider, Debug, Physics, RigidBody } from '@react-three/rapier'
import { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import useGame from './stores/useGame'
import { setUserData } from './helperFunctions'
import {House} from './components/House.jsx'
import { PickupTruck } from './components/PickupTruck.jsx'


THREE.ColorManagement.legacyMode = false

const boxGeometry = new THREE.BoxGeometry(1, 1, 1)

const floor1Material = new THREE.MeshStandardMaterial({ color: 'limegreen' })
const floor2Material = new THREE.MeshStandardMaterial({ color: 'red' })
const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 'blue' })
const wallMaterial = new THREE.MeshStandardMaterial({ color: 'yellow' })
const pickupScale = 0.6

function BlockStart({ position = [ 0, 0, 0 ]}) {
    return <group position={position} >
            <RigidBody type="fixed">
                <mesh geometry={ boxGeometry } material={ floor1Material } position={ [ 0, - 0.1, 0 ] } scale={ [ 4, 0.2, 4 ] }  receiveShadow />
            </RigidBody>
    </group>
}

export function BlockSpinner({ position = [ 0, 0, 0 ]}) {
        const obstacleRef = useRef()
        const [ speed ] = useState(() => (Math.random() + 0.2) * (Math.random() < 0.5 ? -1 : 1))
    
        useFrame((state) => {
            const time = state.clock.getElapsedTime()
            const eulerRotation = new THREE.Euler(0, time * speed, 0)
            const quarternionRotation = new THREE.Quaternion().setFromEuler(eulerRotation)
            obstacleRef.current.setNextKinematicRotation(quarternionRotation, true)

        })
    
    return <group position={position} >
        <RigidBody type="fixed">
            <mesh geometry={ boxGeometry } material={floor2Material} position={ [ 0, -0.1, 0 ] } scale={ [ 4, 0.2, 4 ] } receiveShadow />
        </RigidBody>
        <RigidBody
            type="kinematicPosition"
            ref={obstacleRef}
            position={[0,-0.125,0]}
            restitution={0.2}
            friction={0}
        >
            <PickupTruck scale={pickupScale}/>
            {/* <mesh geometry={boxGeometry} material={obstacleMaterial} scale={ [ 3.5, 0.3, 0.3 ] } castShadow /> */}
        </RigidBody>
    
    </group>
}

export function BlockLimbo({ position = [ 0, 0, 0 ]}) {
    const obstacleRef = useRef()
    const [ timeOffset ] = useState(() => Math.random()*2*Math.PI)

    useFrame((state) => {
        const time = state.clock.getElapsedTime()
        const y = Math.sin(time + timeOffset) + 1.15
        obstacleRef.current.setNextKinematicTranslation({x: y, y: position[1], z: position[2]})

    })

return <group position={position} >
    <RigidBody type="fixed">
        <mesh geometry={ boxGeometry } material={floor2Material} position={ [ 0, -0.1, 0 ] } scale={ [ 4, 0.2, 4 ] } receiveShadow />
    </RigidBody>
    <RigidBody
        type="kinematicPosition"
        ref={obstacleRef}
        position={[2,0.2,0]}
        restitution={0.2}
        friction={0}
    >   
    {/* 
        TODO: have car move only when player is close

    */}
        <PickupTruck scale={pickupScale} rotation={[0, Math.PI / 2, 0]}/>
        {/* <mesh geometry={boxGeometry} material={obstacleMaterial} scale={ [ 3.5, 0.3, 0.3 ] } castShadow /> */}
    </RigidBody>

</group>
}

export function BlockAxe({ position = [ 0, 0, 0 ]}) {
const obstacleRef = useRef()
const [ timeOffset ] = useState(() => Math.random()*2*Math.PI)

useFrame((state) => {
    const time = state.clock.getElapsedTime()
    const y = Math.sin(time + timeOffset) + 1.15
    obstacleRef.current.setNextKinematicTranslation({x: position[0], y: y, z: position[2]})

})

return <group position={position} >
<RigidBody type="fixed">
    <mesh geometry={ boxGeometry } material={floor2Material} position={ [ 0, -0.1, 0 ] } scale={ [ 4, 0.2, 4 ] } receiveShadow />
</RigidBody>
<RigidBody
    type="kinematicPosition"
    ref={obstacleRef}
    position={[0,0.2,0]}
    restitution={0.2}
    friction={0}
>
    <mesh geometry={boxGeometry} material={obstacleMaterial} scale={ [ 3.5, 0.3, 0.3 ] } castShadow />
</RigidBody>

</group>
}


export function BlockEnd({ position = [ 0, 0, 0 ]}) {
    return <group position={position} >
        
                <RigidBody type='fixed'>
                    <mesh geometry={ boxGeometry } material={floor1Material} position={ [0, 0, 0] } scale={ [ 4, 0.2, 4 ] } receiveShadow />
                </RigidBody>

        </group>
}
// TODO: create garden walls -> can only ride on road


// TODO: create stand in houses etc off to both sides
// mesh1.userData = { needsBoundingBox: true }; // Set custom user data o
export function Property({ position }) {

    // userData params
    let isTarget = true
    let isPlayer = false
    // perhaps have points per location later?
    return (<>
            <RigidBody type="fixed">
                <mesh 
                    geometry={ boxGeometry } 
                    material={ wallMaterial } 
                    position={ position } 
                    scale={ [ 4, 0.2, 4 ] }  
                    receiveShadow 
                    userData= {setUserData(isTarget, isPlayer)}
                />
                {/* insert house on top here */}
                <House position={[position[0], position[1] + 0.01, position[2]]} scale={0.1}/>
            </RigidBody>
            </>)
 
}

export function Level({ count = 5, types = [ BlockSpinner, BlockLimbo, BlockAxe ]}) {
    
    const setTargetLocations = useGame((state) => {return state.setTargetLocations})
    // create house component -> insert into property

    const blocks = useMemo(() => {
        const blocks = []

        for(let i = 0; i < count; i++) {
            const type = types[ Math.floor(Math.random() * types.length) ]
            blocks.push(type)
        }
        return blocks
    }, [ count ])

    

    // useEffect for when thrownPaperLocations changes
    const properties = useMemo(() => {
        // possibly include below in useeffect
        const housePositions = [] // add to useGame
        const properties = []
        for (let i = 0; i < count; i ++) {
            // one lhs
            let x = -4
            let y = 0
            let z = -4*i -4
            let maxDelta = [2, 0, 2]
            let centre = [x, y, z] 
            properties.push(
            <Property position = {[ x, y, z ]} key={i}/>
            )
            housePositions.push({"centre": centre, "maxDelta": maxDelta})
            // one rhs
            x = 4
            y = 0
            z = -4*i -4
            centre = [x, y, z] 
            properties.push(
                <Property position = {[ x, y, z ]} key={count + i}/>
                )
            housePositions.push({"centre": centre, "maxDelta": maxDelta})
        }
        setTargetLocations(housePositions)

        return properties
    }, [count])
       
    // console.log("housePositions: ", housePositions)
    
    // console.log("properties: ", properties[0].props.position) // hacky way to pass location -> not centre!!

    return(

    <>
        
            <BlockStart position={[0, 0, 0]}/>
            { blocks.map((Block, index) => 
                <Block key={index} position={[0, 0, -(index+1)*4]}/>
                )}
            <BlockEnd position={[0, 0, -(blocks.length+1)*4]}/>
            {properties}

    </>
    )
}