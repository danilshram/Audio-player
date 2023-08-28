import { configureStore, createSlice } from '@reduxjs/toolkit';
import { jwtDecode } from '../helpfunctions/helpfunctions';
import { localStoredReducer } from '../helpfunctions/helpfunctions';
import { createApi } from '@reduxjs/toolkit/query/react'
import { graphqlRequestBaseQuery } from '@rtk-query/graphql-request-base-query'
import { useDebugValue } from 'react';



const audio = new Audio()
const address = 'http://player.node.ed.asmer.org.ua/'
//Auth reducer
const authSlice = createSlice({
    name: 'auth',
    initialState: {token: null, payload: null},
    reducers: {
        login(state, {payload:token}){
            const payload = jwtDecode(token)
            if (payload){
                state.payload = payload
                state.token   = token
            }
        },
        logout(state){
            state.payload = null
            state.token   = null
        }, 
        setAvatar(state, action){
            const{avatar} = action.payload
            state.payload.avatar = avatar
        },
        setNick(state, action){
            const {nick} = action.payload
            state.payload.nick = nick
        }
    }
})
//Player reducer
const playerSlice = createSlice({
    name: 'player',
    initialState: {
        isPlaying: false, 
        isStopped: true, 
        track: {
            duration: 0,
            _id: "", 
            url: "", 
            id3: {
                title: "",
                artist: ""
            }
        },
        playlist: {
            _id: "", 
            name: "", 
            tracks:[]
        },
        playlistIndex: 0, 
        currentTime: 0, 
        volume: 0
    },
    reducers: {
        play(state, action){
            const {url, index} = action.payload 
            state.track = state.playlist.tracks[index]
            if(url && url !== audio.src){
                state.playlist.tracks[index].url = url 
                audio.src = url
            }
            audio.play()
            state.isPlaying = true
            state.isStopped = false
            state.playlistIndex = index
        },
        pause(state){
            state.isPlaying = false
            state.isStopped = true
            audio.pause()
        },
        stop(state){
            state.isPlaying = false
            state.isStopped = true 
            state.currentTime = 0
            audio.currentTime = 0
            audio.pause()
        },
        setDuration(state, action){
            const {duration, _id} = action.payload
            state.track.duration = duration
            state.playlist.tracks.forEach(track=>{
                if(track._id === _id){
                    track.duration = duration
                }
            })
        },
        nextTrack(state){   
            if(state.playlist.tracks.length > 0){
                const newIndex = (state.playlistIndex === state.playlist.tracks.length - 1) ? 0 : (state.playlistIndex + 1)
                state.playlistIndex = newIndex
                const newTrack = state.playlist.tracks[newIndex]
                if(newTrack.url){
                    audio.src = address + newTrack.url
                    state.track = newTrack
                }
                audio.play()
            }
        },
        prevTrack(state){
            if(state.playlist.tracks.length > 0){
                const newIndex = (state.playlistIndex === 0) ? (state.playlist.tracks.length - 1) : (state.playlistIndex - 1)
                state.playlistIndex = newIndex 
                const newTrack = state.playlist.tracks[newIndex]
                if(newTrack.url){
                    audio.src = address + newTrack.url  
                    state.track = newTrack
                }
                audio.play()
            }
        },
        setPlaylist(state, action){
            const {_id, tracks} = action.payload
            state.playlist._id = _id
            state.playlist.tracks = tracks
        },
        setCurrentTime(state, action){
            const newCurrentTime = action.payload
            if(newCurrentTime !== audio.currentTime){
                audio.currentTime = newCurrentTime
            }
            state.currentTime = audio.currentTime
        }, 
        setVolume(state, action){
            const newVolume = action.payload
            state.volume = newVolume
            audio.volume = newVolume
        }
    }
})

//Api reducer
const api = createApi({
    baseQuery: graphqlRequestBaseQuery({
        url: address + "graphql",
        prepareHeaders(headers, {getState}){
            const { token } = getState().auth 
            if (token){ 
                headers.set('Authorization', "Bearer " + token) 
            }
            return headers
        }
    }),
    endpoints: (builder) => ({
        playlistFind:builder.query({
            query: () => ({
                document: `query playlist{
	                    PlaylistFind(query: "[{}]"){
                            _id
                            name
                            description
                            owner {login}
                            tracks {_id url id3 {title artist}}
                        }}`
                    })}),
                login: builder.mutation({
                    query: ({login, password}) => ({
                        document: `
                            query login($login: String!, $password: String!) {
                                login(login: $login, password: $password) 
                            }
                            `,
                        variables: {login, password}})
                }),
                getUserById: builder.query({
                    query: ({_id}) => ({ 
                        document: `query oneUser($query: String){
                            UserFindOne(query: $query){
                                _id login nick avatar{ url }
                            }
                        }`,
                        variables: {query: JSON.stringify([{_id}])}
                    }),
                    providesTags: (result, error, {_id}) => {  
                        return ([{ type: 'User', id: _id}])
                    }
                }),
                setUserNick: builder.mutation({
                    query: ({_id, nick}) => ({
                        document: `
                            mutation setNick($_id:String, $nick:String) {
                                UserUpsert(user: {_id: $_id, nick: $nick}){
                                    _id nick 
                                }
                            }`,
                        variables: {_id, nick}
                    }),
                    invalidatesTags: (result, error, arg) => ([{type: 'User', id: arg._id}])
                }),
                playlistFindOne: builder.query({
                    query: ({_id}) => ({
                        document: `query playlist($query: String){
                            PlaylistFindOne(query: $query){
                                _id
                                owner {login}
                                name
                                tracks {_id url id3 {title artist}}
                          } 
                        }`, variables: {query: JSON.stringify([{_id}])}
                    })
                }), 
                setUserAvatar: builder.mutation({
                    query:({id, avatarId}) => ({
                            document: `mutation setAvatar($id: String, $avatarId:ID){
                                UserUpsert(user:{_id: $id, avatar: {_id: $avatarId}}){
                                    _id, avatar{
                                        _id 
                                    }
                                }
                            }`, variables: {id, avatarId}
                    })
                }),
                setPassword: builder.mutation({
                    query:({password, newPassword}) => ({
                        document: `mutation changePassword($password: String!, $newPassword: String!){
                            changePassword(password:$password, newPassword: $newPassword)
                          }`, variables: {password, newPassword}
                    })
                }),
                findPlaylist: builder.query({
                    query:({playlistName}) => ({
                        document:`query findPlaylist($query: String){
                            PlaylistFind(query: $query){
                                _id
                                owner{login}
                                name
                                tracks{id3 {title, artist}}
                            }
                        }`, variables: {query: JSON.stringify([{name:`/${playlistName}/`}])}
                    })
                }), 
                userRegistration: builder.mutation({
                    query:({login, password}) => ({
                        document: `mutation register($login:String!, $password: String!){
                            createUser(login:$login, password: $password){
                              login
                            }
                          }`, variables: {login,password}
                    })
                }),
                newTrack: builder.mutation({
                    query:({id}) => ({
                        document: `mutation addTrack($id:ID){
                            TrackUpsert(track:{_id: $id}){
                                _id url id3{title, artist}
                            }
                        }`, variables: {id}
                    })
                }),
                newPlaylist: builder.mutation({
                    query:({name, description, tracks}) => ({
                        document:`mutation addPlaylist($name: String, $description: String, $tracks:[TrackInput]){
                            PlaylistUpsert(playlist:{name:$name, description:$description, tracks:$tracks}){
                                _id owner{login} name description tracks{_id, id3{title, artist}}
                            }
                        }`, variables:{name, description, tracks}
                    })
                }), 
                findMyPlaylists: builder.query({
                    query:({_id}) => ({
                        document: `query findPlaylist($query: String){
                            PlaylistFind(query:$query){
                              _id
                              owner{login}
                              name
                              tracks{_id url id3 {title, artist}}
                        }
                    }`, variables:{query: JSON.stringify([{___owner: _id}])}
                    })
                })
    })
})


//Thunks and hooks
const loginThunk = api.endpoints.login.initiate
const getUserByIdThunk = api.endpoints.getUserById.initiate
const registrationThunk = api.endpoints.userRegistration.initiate
const {usePlaylistFindQuery, useLoginMutation, useGetUserByIdQuery, useSetUserNickMutation, usePlaylistFindOneQuery, useSetUserAvatarMutation, useSetPasswordMutation, useFindPlaylistQuery, useUserRegistrationMutation, useNewTrackMutation, useNewPlaylistMutation, useFindMyPlaylistsQuery} = api

//store
const reducers = {
    [authSlice.name]: localStoredReducer(authSlice.reducer, 'authToken'),
    [api.reducerPath] : api.reducer,
    [playerSlice.name] : localStoredReducer(playerSlice.reducer, "player")
}
const store = configureStore({reducer: reducers, 
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware)})
    
store.subscribe(() => console.log(store.getState()))
//audio settings
audio.ontimeupdate = () => store.dispatch(playerSlice.actions.setCurrentTime(audio.currentTime))
audio.onloadedmetadata = () => store.dispatch(playerSlice.actions.setDuration({duration: audio.duration, _id: store.getState().player.track._id}))
audio.onended = () => store.dispatch(playerSlice.actions.nextTrack({index: store.getState().player.playlistIndex}))


export{usePlaylistFindQuery, 
    useLoginMutation,
    loginThunk,
    getUserByIdThunk,
    useGetUserByIdQuery,
    useSetUserNickMutation, 
    usePlaylistFindOneQuery,
    useSetUserAvatarMutation,
    authSlice,
    playerSlice,
    address,
    useSetPasswordMutation,
    useFindPlaylistQuery,
    registrationThunk,
    useUserRegistrationMutation,
    useNewTrackMutation,
    useNewPlaylistMutation,
    useFindMyPlaylistsQuery,
    audio
}
export default store