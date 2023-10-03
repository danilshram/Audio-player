import {Router, Route, Link, Redirect, useParams, Switch} from 'react-router-dom/cjs/react-router-dom.min';
import './App.css';
import { createBrowserHistory } from "history";
import React, {useState, useEffect, useRef} from 'react';
import { Provider, connect, useDispatch, useSelector} from 'react-redux';
import store from './reducers/slices';
import { LoginForm, Header, PlaylistCart, ShowMe, SetNick, MainPage, ShowPlaylist, AudioBar, MyAccount, ChangeAvatar, ChangePassword, Search, RegistrationForm, Footer, About} from './presentation components/presentation';
import { createApi } from '@reduxjs/toolkit/query/react'
import { graphqlRequestBaseQuery } from '@rtk-query/graphql-request-base-query'
import { audio, address, playerSlice } from './reducers/slices';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import Boss from './boss/boss';
import { actionAboutMe } from './helpfunctions/helpfunctions';




let history = createBrowserHistory()
export {history}
function App() {
  return (
    <Router history = {history}>
      <Provider store={store}>
        <Header>
        </Header>
        <Switch>
        <Route exact path = "/" component = {MainPage}/>
        <Route path = "/search" component={Search}/>
        <Route path= "/about" component={About}/>
        <Route path = "/login" component = {LoginForm}/>
        <Route path="/registration" component={RegistrationForm}/>
        <Route path ="/:login/createplaylist" component={Boss}/>
        <Route path="/myplaylists" component={MainPage}/>
        <Route path = "/playlist/:id" component={ShowPlaylist}/>
        <Route path ="/:login" component={MyAccount}/>
        <Route path="/:login/changepassword" component={ChangePassword}/>
        <Route path="/:login/changeavatar" component={ChangeAvatar}/>
        <Route path=":login/changenick" component={SetNick}/>
        </Switch>
        <AudioBar/>
        <Footer/>
      </Provider>
    </Router>
  );
}

export default App;
