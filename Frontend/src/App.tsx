import './App.css'
import { BrowserRouter as Router,Routes ,Route } from 'react-router-dom'
import Sender from './pages/Sender'
import Receiver from './pages/Reciever'
function App(){
  return <div>
     <Router>
        <Routes>
           <Route path='/sender' element={<Sender/>}/>
           <Route path='/receiver' element={<Receiver/>}/>
        </Routes>
     </Router>
  </div>

}
export default App
