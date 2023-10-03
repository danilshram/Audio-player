import { authSlice, loginThunk, getUserByIdThunk, registrationThunk } from "../reducers/slices"
//token
function jwtDecode(token){ 
    try{
        let tokenParts = token.split('.')
        let tokenSecondPart = tokenParts[1]
        let tokenJSON = atob(tokenSecondPart)
        let normalToken = JSON.parse(tokenJSON)
        return normalToken
    }
    catch(e){ 
    }
}

//LocalStoreReducer
function localStoredReducer(originalReducer, localStorageKey){
    function wrapper(state, action){
        if(state === undefined){            
            try {
                return JSON.parse(localStorage[localStorageKey])
            } catch (error) {
                console.log("Ексепшен в localStoredReducer " + error)
            }
        }
        let newState = originalReducer(state, action)
        localStorage[localStorageKey] = JSON.stringify(newState)
        return newState
    }    
    return wrapper
}
//Actions for login, registration and info about myself
const actionFullLogin = (login, password) =>
    async dispatch => {
        const token = await dispatch(loginThunk({login, password})) 
        if (token?.data?.login){
            dispatch(authSlice.actions.login(token.data.login))
            await dispatch(actionAboutMe()) 
        }
}
const actionFullRegister = (login, password) =>
  async dispatch => {
    const registerInfo = await dispatch(registrationThunk({login, password}))
    const token = await dispatch(loginThunk({login, password}))
    if (registerInfo && token?.data?.login) {
      dispatch(actionFullLogin(login, password))
    }
  }
const actionAboutMe = () => 
    async (dispatch, getState) => {
        const {auth} = getState()
        if (auth.payload){
            const {id} = auth.payload.sub
            await dispatch(getUserByIdThunk({_id: id}))
        }
}
export {actionFullLogin, actionAboutMe, actionFullRegister, localStoredReducer, jwtDecode}
