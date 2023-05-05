export default function Spinner() {
    return <>
        <mesh scale={ [ 1.5, 0.5, 0.25 ] }  >
            <boxGeometry args={[1,1,1]} />
        </mesh>
    </>
}