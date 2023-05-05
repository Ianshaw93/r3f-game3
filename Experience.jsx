import { Physics, Debug } from '@react-three/rapier'
import Lights from './Lights.jsx'
import { Level } from './Level.jsx'
import Player from './components/Player'

// click events on canvas as props; send to player
export default function Experience({canvasIsClicked, canvasRef})
{


    return <>
        <Physics>
            {/* <Debug /> */}
            <Lights />
            <Level 
                count = {5}
            />
            <Player 
                canvasIsClicked={canvasIsClicked} 
                canvasRef={canvasRef}
            />
        </Physics>



    </>
}