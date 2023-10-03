import { gql } from "../helpfunctions/helpfunctions"


function gqlLogin(login, password){
    return gql(`query login($login: String!, $password: String!){
        login(login:$login, password: $password)
    }`,{login : login, password : password}
    )
}
// image query (для існуючого автару), imageUpsert mutation( для зміни аватару)
// query trackFind (для всіх треків), query trackFindOne (для якогось одного), mutation trackUpsert (для нових треків)
// id3 інформація про track (обов'язково додати в track)
// playlistFind (для всіх), playlistFindOne (для одного), playlistUpsert (для нового)


 // query playlist{
// 	PlaylistFind(query: "[{}]"){
// 		_id
// 		name
//     description
//     owner {login}
//     tracks {_id id3 {title artist}}
//   }
// } (всі плейлісти)
// query images{
//     ImageFind(query: "[{}]"){
//       _id
//       url
//     }
//   } (всі картинки)
// query tracks{
//     TrackFind(query: "[{}]"){
//       _id
//           owner {login}
//       id3 {title artist}
//     }
//   } (всі треки)
export{gqlLogin}