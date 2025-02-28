import './App.css'
import { BrowserRouter as Router,Routes ,Route } from 'react-router-dom'
import Sender from './pages/Sender'
import Receiver from './pages/Reciever'
import Home from './pages/Home'
function App(){
  return <div>
     <Router>
        <Routes>
          <Route path='/' element={<Home/>}/>
           <Route path='/sender' element={<Sender/>}/>
           <Route path='/receiver' element={<Receiver/>}/>
        </Routes>
     </Router>
  </div>

}
export default App
