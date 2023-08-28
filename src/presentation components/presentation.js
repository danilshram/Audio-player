import React, {useState, useEffect, useRef, Children} from 'react';
import { actionFullLogin, actionFullRegister } from '../helpfunctions/helpfunctions';
import { Provider, connect, useDispatch, useSelector} from 'react-redux';
import { authSlice,
   usePlaylistFindQuery, 
   useSetUserNickMutation, 
   playerSlice, 
   usePlaylistFindOneQuery, 
   address, 
   useSetUserAvatarMutation, 
   useSetPasswordMutation, 
   useFindPlaylistQuery, 
   useFindMyPlaylistsQuery} from '../reducers/slices';
import {Router, Route, Link, Redirect, useParams, Switch, useLocation} from 'react-router-dom/cjs/react-router-dom.min';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import LoginIcon from '@mui/icons-material/Login';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { history } from '../App';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import StopIcon from '@mui/icons-material/Stop';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import {useCallback} from 'react'
import {useDropzone} from 'react-dropzone'
import PersonIcon from '@mui/icons-material/Person';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';

//Dropzone
function MyDropzone({onFileUploaded}) {
  const token = useSelector(state => state.auth.token)
  const formData = new FormData()
  const onDrop = useCallback(acceptedFiles => {
    const handleFileUploaded = (fileId) => {
    onFileUploaded(fileId);
  }
    formData.append("photo", acceptedFiles[0])
    const onFile = async() => fetch(address + 'upload', {
      method: "POST",
      headers: token ? {Authorization: 'Bearer ' + token} : {},
      body: formData
    }).then(res => res.json()).then(data => handleFileUploaded(data))
  onFile()
  }, []) 
  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})
  return (
    <div {...getRootProps()} className="dropzone">
      <input {...getInputProps()} className='dropzone-input' />
      {
        isDragActive ?
          <p style={{fontSize: "15px", margin: "10px"}}>Drop the files here ...</p> :
          <p style={{fontSize: "15px", margin: "10px"}}>Drag 'n' drop some files here, or click to select files</p>
      }
    </div>
  )
}

//Main page
const MakePlaylist = () => {
  const token = useSelector(state => state.auth.token)
  const login = useSelector(state => state.auth.payload.sub.login)
  return (
    <div style={{margin:"10px"}}>
    {token ? <Link to={`/${login}/createplaylist`}>Create playlist</Link> : null}
    </div>
  )
}
const ShowMyPlaylistsLink =() => {
  const token = useSelector(state => state.auth.token)
  return (
    <div style={{margin:"10px"}}>
      {token ? <Link to={`/myplaylists`}>My playlists</Link> : null}
    </div>
  )
}
const About = () => {
  return (
    <div className='about-page'>
      <div className='about-text'>
        <h1>WebAudioPlayer</h1>
        <p>This is my first project with React</p>
      </div>
      <a href="https://github.com/danilshram">GitHub</a>
    </div>
  )
}
//Footer
const Footer = () => {
  return (
    <footer className='footer'>
      <div className='about'><Link to="/about">About</Link></div>
      <div className='line'></div>
      <div className='social-media'>
        <a href="https://www.instagram.com/danilshram/"><InstagramIcon style={{fontSize: '2em'}}/></a>
        <a href="https://www.linkedin.com/in/daniel-shram-3b96501bb/"><LinkedInIcon style={{fontSize: '2em'}}/></a>
        <a href="https://twitter.com/Danil_Shram"><TwitterIcon style={{fontSize: '2em'}}/></a>
      </div>
    </footer>
  )
}
const MainPage = () => {
  return (
    <div>
      <MakePlaylist/>
      <ShowMyPlaylistsLink/>
      <PlaylistCart/>
    </div>
  )
}
const Header = () => {
  const token = useSelector(state => state.auth.token)
  return (
    <>
      <header className='header'>
          <MainIcon/>
          <SearchIcon/>
          {token ? <AccountIcon/> : 
          <>
          <LoginIconComponent/>
          <RegistrationIcon/>
          </>}
      </header>
    </>
  )
}


//helpFunctions
const trackTime = (time) => {
  const minutes = Math.floor((time % 3600) / 60)
  const seconds = Math.floor(time % 60)
  return minutes + ":"  + seconds
}
//Audio Bar
const TrackDuration = ({duration}) => {
  return (
    <p style={{margin: "10px"}}>{trackTime(duration)}</p>
  )
}

const AudioCanvas = () => {
  const duration = useSelector(state => state.player.track?.duration)
  const currentTime = useSelector(state => state.player.currentTime)
  const [currentTrackTime, setCurrentTrackTime] = useState(currentTime)
  const dispatch = useDispatch()
  const handlePlay = (e) => {
    setCurrentTrackTime(e.target.value)
    dispatch(playerSlice.actions.setCurrentTime(currentTrackTime))
  }
  return (
    <input type='range' id='current-time' value={currentTime} min={0} max={duration} step={1}  onChange={handlePlay}></input>
  )
}

const StopButton = () => {
  const dispatch = useDispatch()
  return (
    <StopIcon onClick={() => dispatch(playerSlice.actions.stop())}/>
  )
}

const VolumeButton = () => {
  const volume = useSelector(state => state.player.volume)
  const[trackVolume, setTrackVolume] = useState(volume)
  const dispatch = useDispatch()
  const handleVolume = (e) => {
    setTrackVolume(e.target.value)
    dispatch(playerSlice.actions.setVolume(trackVolume))
  }
  return (
    <div className="volume-bar">
      <VolumeUpIcon/>
      <input type="range" id="volume" value={volume} min={0} max={1} step={0.1} onChange={handleVolume}></input>
    </div>
  )
}

const PlayerButtons = () => {
  const dispatch = useDispatch()
  const currentTrack = useSelector(state => state.player.track)
  const trackIndex = useSelector(state => state.player.playlistIndex)
  const playlist = useSelector(state => state.player.playlist)
  const [indexTrack, setIndex] = useState(trackIndex)
  const playNext = () => {
    const newIndex = (trackIndex === playlist.tracks.length - 1) ? 0 : trackIndex + 1
    setIndex(newIndex)
    dispatch(playerSlice.actions.nextTrack())
  }
  const playPrev = () => {
    const newIndex = (trackIndex === 0) ? playlist.tracks.length - 1 : trackIndex - 1
    setIndex(newIndex)
    dispatch(playerSlice.actions.prevTrack())
  }
  return (
    <div className='player-buttons'>
      <ArrowBackIosNewIcon onClick= {() => playPrev()}/>
      <PlayPauseButton url={currentTrack?.url && currentTrack.url} index={indexTrack}/>
      <StopButton/>
      <ArrowForwardIosIcon onClick ={() => playNext()}/>
    </div>
  )
}

const AudioBar = () => {
  const duration = useSelector(state => state.player.track?.duration)
  return(
    <div className='audio-bar'>
      <PlayerButtons/>
      <AudioCanvas/>
      <VolumeButton/>
      <TrackDuration duration={duration}/>
    </div>
  ) 
}
//Playlist
const PlayPauseButton = ({url, index}) => {
  const dispatch = useDispatch()
  const trackUrl = useSelector(state => state.player.track?.url)
  const isPlaying = useSelector(state => state.player.isPlaying)
  return (
    <>
    {(url === trackUrl && isPlaying) ? 
        <PauseIcon onClick ={() => dispatch(playerSlice.actions.pause())}/> : <PlayArrowIcon onClick = {() => url ? dispatch(playerSlice.actions.play({url, index})) : null}/>
    }
    </>
  )
}

const PlayTrackPlaylist = ({url, index, artist, title, onDelete, isDeleteButtonShow}) => {
  return (
    <>
      <div className='track-container'> 
        <div className='play-pause'>
          <span>{index+ 1}</span> 
          <PlayPauseButton url={url} index={index}/>
        </div>
        <p>{artist || title ? `${artist || "noname"} - ${title || "no title"}` : "noname - no title"}</p>  
        {isDeleteButtonShow && <button onClick={onDelete}>Delete</button>}
        
      </div>
    </>
  )
}

const ShowPlaylist = () => {
  let {id} = useParams()
  const dispatch = useDispatch()
  const {isLoading, data} = usePlaylistFindOneQuery({_id: id})
  const [index, setIndex] = useState(0)
  const trackUrl = useSelector(state=> state.player.track.url)
  const login = useSelector(state => state.auth.payload.sub.login)
  const ownerLogin = data?.PlaylistFindOne?.owner?.login
  useEffect(() => {
    if(data){
      setIndex((index + 1) % data.PlaylistFindOne.tracks.length)
    }}, [id]);
  return (
      <div className='tracks-container'>
        {isLoading ? "Loading" : data.PlaylistFindOne.tracks.map((track, i) => {
          const isDeleteButtonShow = ((login === ownerLogin) && (trackUrl !== address + track.url))
          const deleteFunction = (deleteTrack) => {
            if((login === ownerLogin)){
              data.PlaylistFindOne.tracks.filter(track => track._id !== deleteTrack._id)
            }
          }
          dispatch(playerSlice.actions.setPlaylist({_id: id, tracks: data.PlaylistFindOne?.tracks}))
          return(
            <PlayTrackPlaylist key={track._id} url={track.url ? (track.url.includes(address) ? track.url : address + track.url) : ''} index={i} id={track._id} artist={track.id3?.artist} title={track.id3?.title} onDelete={deleteFunction} isDeleteButtonShow={isDeleteButtonShow}/>
      )
    })
}  
      </div>
  )
}

const PlaylistCart = () => {
  const {isLoading, data} = usePlaylistFindQuery()
  const userId = useSelector(state => state.auth.payload.sub.id)
  const {isLoading1, data: data1} = useFindMyPlaylistsQuery({_id: userId})
  const location = useLocation()
  const pathName = location.pathname === '/myplaylists'
  const playlists = pathName ? data1?.PlaylistFind : data?.PlaylistFind
  return (
    <div className = "playlist-wrapper">
      {(isLoading && isLoading1) ? "Loading" : playlists && playlists.map((playlist) => {
        return (
        (playlist.tracks.length === 0) ? null : (
        <Link key={playlist._id} className='one-playlist-container' to = {`/playlist/${playlist._id}`}>
          <div className='text-container'>
            <h2>{playlist.name ? playlist.name : "no name"}</h2>
            <p>made by: {playlist.owner.login}</p>
            <p>{playlist.tracks.length} tracks</p>
          </div>
        </Link>
        ))
      })}
    </div>
  )
}
//Login, Registration
const LoginForm = () => {
  const dispatch = useDispatch()
  const [login1, setLogin] = useState("")
  const [password, setPassword] = useState("")
  return (
    <>
      <div className='loginDiv'>
        <div className='loginForm'>
          <h1 style={{color: "green"}}>Log in to AudioPlayer</h1>
          <label htmlFor='login' style={{color: "green"}}>LOGIN</label>
          <input
            placeholder='login...'
            id='login'
            type = 'text'
            value = {login1}
            onChange = {(e) => setLogin(e.target.value)}>
          </input>
          <label htmlFor='password' style={{color: "green"}}>PASSWORD</label>
          <input 
            placeholder='password...'
            id='password'
            type = 'password'
            value ={password}
            onChange ={(e) => setPassword(e.target.value)}>
          </input>
          <button
            className='loginButton'
            disabled ={(!login1 || !password) && true }
            onClick ={() =>{
              history.push("/")
              dispatch(actionFullLogin(login1, password))}
            } >LOG IN</button>
          </div>
      </div>
    </>
    )
}

const RegistrationForm = () => {
  const dispatch = useDispatch()
  const [login1, setLogin] = useState("")
  const [password1, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  return (
    <div className='registrationDiv'>
      <div className='registration-form'>
        <h1 style={{color: "green"}}>Registration</h1>
        <label htmlFor='login1' style={{color: "green"}}>LOGIN</label>
        <input
          placeholder='login...'
          id='login1'
          type = 'text'
          value = {login1}
          onChange = {(e) => setLogin(e.target.value)}>
        </input>
        <label htmlFor='password1' style={{color: "green"}}>PASSWORD</label>
        <input 
          placeholder='password...'
          id='password1'
          type = 'password'
          value = {password1}
          onChange ={(e) => setPassword(e.target.value)}>
        </input>
        <label htmlFor='repeatPassword' style={{color: 'green'}}>REPEAT PASSWORD</label>
        <input
          placeholder='repeat password'
          id="repeatPassword"
          type='password'
          value={repeatPassword}
          onChange = {(e) => setRepeatPassword(e.target.value)}
        ></input>
        <button
            disabled ={(!login1 || !password1 || !repeatPassword || (password1 !== repeatPassword)) && true }
            onClick ={() =>{
              history.push("/")
              dispatch(actionFullRegister(login1, password1))}}>Sign Up</button>
      </div>
    </div>
  )
}

//Search
const Search = () => {
  const[playlistName, setPlaylistName] = useState("")
  const {isLoading, data} = useFindPlaylistQuery({playlistName})
  const playlists = data?.PlaylistFind
  const [showResult, setShowResult] = useState(false)
  return (
    <>
      <div className="search-field">
      <input
        type="text"
        value={playlistName}
        onChange={(e) => {
          setPlaylistName(e.target.value)
          setShowResult(true)
        }}
        placeholder="playlist name"
      />
      <SearchOutlinedIcon
        className="searchIcon-image"
        style={{ fontSize: "1em" }}
        onClick={() => setShowResult(true)}
      />
      </div>
      <div className="playlist-results">
        {(!isLoading && showResult) && (playlists.map((playlist) => (
          <Link key={playlist._id} className='one-playlist-container' to = {`/playlist/${playlist._id}`}>
          <div className='text-container'>
            <h2>{playlist.name ? playlist.name : "no name"}</h2>
            <p>made by: {playlist.owner.login}</p>
            <p>{playlists.length} tracks</p>
          </div>
        </Link>
        ))
    )}
      </div>
    </>
  )
}
// Account Settings
const SetNick = () => {
  const [nick2, setNick] = useState("")
  const id = "64c8da032ac84510258c0bc7"
  const [setBackNick, {isLoading}] = useSetUserNickMutation()
  const dispatch = useDispatch()
  const login = useSelector(state => state.auth.payload.sub.login)
  return (
  <>
  <div className='nickForm' style ={{display: "flex", flexFlow: 'column wrap', alignItems: 'center'}}>
      <input
        type = 'text'
        value = {nick2}
        onChange = {(e) => setNick(e.target.value)}>
      </input>
      <button
        onClick ={() => {
          history.push(`/${login}`)
          dispatch(authSlice.actions.setNick({nick: nick2}))
          setBackNick({_id: id, nick2})}}>Change nick</button>
  </div>
  </>
  )
}

const LogoutButton = () => {
  const token = useSelector(state => state.auth.token)
  const dispatch = useDispatch()
  return (
    token ? <button onClick={() => {
      history.push("/")
      dispatch(authSlice.actions.logout())
    }}>LOGOUT</button> : null
  )
}

const ChangeAvatar = () => {
  const [setAvatar, {isLoading}] = useSetUserAvatarMutation()
  const dispatch = useDispatch()
  const userId = useSelector(state=> state.auth.payload.sub.id)
  const [uploadedFileId, setUploadedFileId] = useState(null);
  const login = useSelector(state => state.auth.payload.sub.login)
  const handleFileUploaded = (fileId) => {
    setUploadedFileId(fileId);
  }
  return (
    <>
    <div className='dropzone-wrapper'>
      <MyDropzone onFileUploaded={handleFileUploaded}/>
        <button onClick={() => {
          history.push(`/${login}`)
          dispatch(authSlice.actions.setAvatar({avatar:uploadedFileId}))
          setAvatar({id: userId, avatarId: uploadedFileId._id})}}>Avatar</button>
    </div>
    </>
  )
}

const AccountInfo = () => {
  const avatar = useSelector(state=> state.auth.payload?.avatar)
  const login = useSelector(state => state.auth.payload?.sub?.login)
  const nick = useSelector(state => state.auth.payload?.nick)
  return (
    <>
      {avatar? <img src={address + avatar.url} style={{width:"200px", height:"200px", borderRadius:"50%"}}></img> : <PersonIcon style={{fontSize: "5em", color: "green"}}/>}
      <h2>{login}</h2>
      {nick ? <h3>{nick}</h3> : null}
    </>
  )
}

const ChangePassword = () => {
  const[password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [changePassword, {isLoading}] = useSetPasswordMutation()
  const login = useSelector(state => state.auth.payload.sub.login)
  return (
    <>
    <input
      style={{borderColor: "green", borderRadius:"20px"}}
      type="password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder='password'></input>
    <input 
      style={(newPassword === repeatPassword ? {borderColor: "green",  borderRadius:"20px"} : {borderColor: "red",  borderRadius:"20px"})}
      type="password"
      value={newPassword}
      onChange ={(e) => setNewPassword(e.target.value)}
      placeholder='new password'></input>
    <input
      style={(newPassword === repeatPassword ?{borderColor: "green",  borderRadius:"20px"} : {borderColor: "red",  borderRadius:"20px"})}
      type="password"
      value={repeatPassword}
      onChange = {(e) => setRepeatPassword(e.target.value)}
      placeholder='repeat new password'></input>
    <button disabled={(newPassword === repeatPassword) ? false : true} onClick= {() =>{
      history.push(`/${login}`)
      changePassword({password, newPassword})}}>Change password</button>
    </>
  )
}

const MyAccount = () => {
  const authLogin = useSelector(state => state.auth.payload?.sub?.login)
  const location = useLocation();
  const changenickActive = location.pathname.endsWith("/changenick");
  const changepasswordActive = location.pathname.endsWith("/changepassword");
  const changeavatarActive = location.pathname.endsWith("/changeavatar");
  return (
    <div className='account-info'>
      <div className='account-settings'>
        <Link to={`/${authLogin}/changenick`}>Change nick</Link>
        <Link to={`/${authLogin}/changepassword`}>Change password</Link>
        <Link to={`/${authLogin}/changeavatar`}>Change Avatar</Link>
        <LogoutButton/>
      </div>
      <div className='account'>
        {changenickActive && <SetNick/>}
        {changepasswordActive && <ChangePassword/>}
        {changeavatarActive && <ChangeAvatar/>}
        {(!changenickActive && !changepasswordActive && !changeavatarActive) && <AccountInfo/>}
      </div>
    </div>
  )
}

//Header 
const MainIcon = () => {
  return (
    <>
      <div className='mainIcon' onClick={() => history.push("/") }>
        <HomeOutlinedIcon style={{fontSize: "3em", color: "green"}}/>
        <Link to="/">Main page</Link>
      </div>
      <div className='line'></div>
    </>
  )
}
const SearchIcon = () => {
  return (
    <>
      <div className='searchIcon' onClick={() => history.push("/search")} >
        <SearchOutlinedIcon style ={{fontSize: "3em", color:"green"}}/>
        <Link to='/search'>Search</Link>
      </div>
      <div className='line'></div>
    </>
  )
}
const LoginIconComponent = () => {
  return (
    <>
      <div className='loginIcon' onClick={() => history.push("/login")}>
        <LoginIcon style={{fontSize: "3em", color: "green"}}/>
        <Link to='/login'>Log in</Link>
      </div>
      <div className='line'></div>
    </>
  )
}
const RegistrationIcon = () => {
  return (
    <>
      <div className='registrationIcon' onClick={() => history.push("/registration")}>
        <HowToRegIcon style={{fontSize: "3em", color: "green"}}/>
        <Link to= "/registration">Registration</Link>
      </div>
    </>
  )
}
const AccountIcon = () => {
  const login = useSelector(state => state.auth.payload?.sub?.login)
  const avatar = useSelector(state => state.auth.payload?.avatar)
  return (
    <div className='accountIcon' onClick={() => history.push(`/${login}`)}>
      {avatar? <img src={address + avatar.url} style={{width:"48px", height:"48px", borderRadius:"50%"}}></img> : <PersonIcon style={{fontSize: "3em", color: "green"}}/>}
      <Link to= {`/myaccount/${login}`}>My account</Link>
    </div>
  )
}

export {LoginForm,
  LogoutButton,
  Header, 
  MainPage, 
  PlayTrackPlaylist, 
  AudioBar, 
  ShowPlaylist, 
  PlaylistCart, 
  RegistrationForm, 
  Search, 
  SetNick, 
  ChangePassword, 
  MakePlaylist, 
  ChangeAvatar, 
  MyAccount, 
  Footer, 
  About}