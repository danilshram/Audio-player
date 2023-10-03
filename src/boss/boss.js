import {useEffect, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors, useDroppable
} from "@dnd-kit/core";
import { history } from '../App';
import { Provider, connect, useDispatch, useSelector} from 'react-redux';
import { sortableKeyboardCoordinates, rectSortingStrategy, SortableContext, useSortable, horizontalListSortingStrategy  } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {arrayMoveImmutable} from 'array-move';

import React, {useCallback} from 'react'
import {useDropzone} from 'react-dropzone'
import { PlayTrackPlaylist } from '../presentation components/presentation';
import { useNewTrackMutation, useNewPlaylistMutation, address} from '../reducers/slices';


function MyDropzone({onFileUploaded}) {
  const token = useSelector(state => state.auth.token)
  const onDrop = useCallback(acceptedFiles => {
    const handleFileUploaded = (fileId) => {
      onFileUploaded(fileId);
    }
    const formData = new FormData()
    acceptedFiles.forEach(file => formData.append("track", file))
    const onFile = async() => {
      return fetch(address + 'track', {
        method: "POST",
        headers: token ? {Authorization: 'Bearer ' + token} : {},
        body: formData
        }).then(res => res.json()).then(data => handleFileUploaded(data))
    }
  onFile()
  }, [])
  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})
  
  return (
    <div {...getRootProps()} className='dropzone'>
      <input {...getInputProps()} className='dropzone-input' />
      {
        isDragActive ?
          <p>Drop the files here ...</p> :
          <p>Drag 'n' drop some files here, or click to select files</p>
      }
    </div>
  )
}


const SortableItem = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: props.id });

  const itemStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    //width: 110,
    //height: 30,
    //display: "flex",
    //alignItems: "center",
    //paddingLeft: 5,
    //border: "1px solid gray",
    //borderRadius: 5,
    //marginBottom: 5,
    //userSelect: "none",
    cursor: "grab",
    //boxSizing: "border-box"
  };
    
    const Render = props.render

  return (
    <div style={itemStyle} ref={setNodeRef} {...attributes} {...listeners}>
      <Render {...{[props.itemProp]:props.item}}/>
    </div>
  );
};


const Droppable = ({ id, items, itemProp, keyField, render }) => {
  const { setNodeRef } = useDroppable({ id });

  const droppableStyle = {
    //padding: "20px 10px",
    //border: "1px solid black",
    //borderRadius: "5px",
    //minWidth: 110
  };

  return (
    <SortableContext id={id} items={items} strategy={rectSortingStrategy}>
        {items.map((item) => (
          <SortableItem render={render} key={item[keyField]} id={item} 
                        itemProp={itemProp} item={item}/>
        ))}
    </SortableContext>
  );
};


function Dnd({track:startItems,render, itemProp, keyField, onChange, horizontal}) {
    const [items, setItems] = useState(startItems)
    useEffect(() =>{
      setItems(startItems)
    } , [startItems])

    useEffect(() => {
        if (typeof onChange === 'function'){
            onChange(items)
        }
    },[items])

    const sensors = useSensors(
        useSensor(PointerSensor,  { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    );

    const handleDragEnd = ({ active, over }) => {
        const activeIndex = active.data.current.sortable.index;
        const overIndex = over.data.current?.sortable.index || 0;

        setItems((items) => {
            return arrayMoveImmutable( items, activeIndex, overIndex)
        });
    }

    const containerStyle = { display: horizontal ? "flex" : '' };
  return (
    <DndContext
      sensors={sensors}
      onDragEnd={handleDragEnd}
    >
      <div style={containerStyle}>
          <Droppable id="aaa" 
                     items={items} 
                     itemProp={itemProp} 
                     keyField={keyField} 
                     render={render}/>
      </div>
    </DndContext>
  );
}

const PostTrack = ({track,index, onDelete, isDeleteButtonShow}) => {
    return (<PlayTrackPlaylist id={track._id} url={address + track.url} index={index} key={track._id} onDelete={() => onDelete(track)} isDeleteButtonShow={isDeleteButtonShow}/>)
}

const MyPlaylist = () => {
    const [newTrack, {isLoading}] = useNewTrackMutation()
    const [newPlaylist, {isLoading1}] = useNewPlaylistMutation()
    const trackUrl = useSelector(state => state.player.track?.url)
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [tracks, setTracks] = useState([])
    const handleFileUploaded = (uploadedTrackFile) => {
      newTrack({id: uploadedTrackFile._id}).then(data => {
        setTracks(tracks => [...tracks,{
                            _id: uploadedTrackFile._id,
                            url: data.data.TrackUpsert.url
                            }])
                          }
      )}                   
    const deleteTrack = (trackDelete) => {
        setTracks(tracks => tracks.filter(track => track._id !== trackDelete._id))
    }

    const LocalPostTrack  = ({track}) => {
      const index = tracks.findIndex(({_id}) => track._id === _id)
      return (
        <PostTrack track={track} index={index} onDelete={deleteTrack} isDeleteButtonShow={(trackUrl !== (address + track.url))}/>
      )
    }
    return (
        <div className='create-playlist'>
            <input type='text' value={name} placeholder="name"
                    onChange = {e => setName(e.target.value)}/>
            <input type='text' value={description} placeholder="description"
                    onChange = {e => setDescription(e.target.value)}/>
           
              <MyDropzone onFileUploaded={handleFileUploaded}/>
              <div> 
                
                <Dnd track={tracks} render={LocalPostTrack} itemProp="track" keyField="_id"
                     onChange={tracks => setTracks(tracks)}/> 
                <button onClick = {() => {
                  history.push('/myplaylists')
                  newPlaylist({name: name, description: description, tracks: tracks.map(track => ({_id: track._id}))})}}>Save Playlist</button>           
    </div>
        </div>
    )
}

function Boss() {
    return (
      <div>
        <MyPlaylist onSave={track => console.log(track)}/>
      </div>
    );
}

export default Boss;