import React, { useState, useEffect, useRef } from 'react';
import '../../../CSS/ImageInteractor.css';
import RightArrow from '../../../../assets/assets/Dark mode/Right arrow.png';
import {
  AddRoomImageToFiles,
  deleteRoomImage,
  getRoomImages,
} from 'Backend/localServerApis';

interface ImageInteractorProps {
  onAddImage: () => void;
  onDeleteImage: (index: number) => void;
  onShowInExplorer: (path: string) => void;
  room: RoomType;
}
const { v4: uuidv4 } = require('uuid');

const ImageInteractor: React.FC<ImageInteractorProps> = ({
  onDeleteImage,
  onShowInExplorer,
  room,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const [images, setImages] = useState('');
  useEffect(() => {
    if (images.length > 0) {
      const img = new Image();
      img.src = images[currentIndex];
      img.onload = () => {
        if (imageRef.current) {
          const aspectRatio = img.width / img.height;
          if (isFullScreen) {
            imageRef.current.style.width = '80vw';
            imageRef.current.style.height = '80vh';
          } else if (aspectRatio > 1) {
            imageRef.current.style.width = '400px';
            imageRef.current.style.height = 'auto';
          } else if (aspectRatio < 1) {
            imageRef.current.style.width = 'auto';
            imageRef.current.style.height = '400px';
          } else {
            imageRef.current.style.width = '400px';
            imageRef.current.style.height = '400px';
          }
        }
      };
    }
  }, [currentIndex, images, isFullScreen]);
  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    );
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };
  const handleOnAddImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;

    input.onchange = async (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        try {
          const folderText = `Floor ${room.floor}, Room ${room.roomIndex} - ${room.id}`;
          const results = await AddRoomImageToFiles(files, folderText);
          if (results) {
            console.log('Images uploaded successfully:', results);
            fetchRoomImages();
          } else {
            console.error('Failed to upload images');
          }
        } catch (error) {
          console.error('Error uploading files:', error);
        }
      }
    };

    input.click();
  };
  const handleDeleteImage = async () => {
    const currentImage = images[currentIndex];
    const fileName = currentImage.split('/').pop();
    const result = await deleteRoomImage(room.id, fileName);
    if (result && result.message === 'Image deleted successfully') {
      setImages((prevImages) =>
        prevImages.filter((img) => img !== currentImage)
      );
      if (currentIndex >= images.length - 1) {
        setCurrentIndex((prevIndex) => Math.max(0, prevIndex - 1));
      }
    }
  };
  useEffect(() => {
    fetchRoomImages();
  }, [room.id]);
  const fetchRoomImages = async () => {
    const roomImages = await getRoomImages(room.id);
    if (roomImages && roomImages.images) {
      setImages(roomImages.images);
    }
  };
  const handleShowInExplorer = (imagePath: string) => {
    window.electron.ipcRenderer.send('show-item-in-folder', imagePath);
  };
  return (
    <div className={`${isFullScreen ? 'fullscreen' : ''} image-interactor`}>
      {images.length > 0 ? (
        <>
          <div className="image-container">
            <button className="arrow-button left" onClick={prevImage}>
              <img
                src={RightArrow}
                alt="Previous"
                style={{ transform: 'rotate(180deg)' }}
              />
            </button>
            <div className="image-wrapper">
              <button
                onClick={handleDeleteImage}
                className={`DeleteImageOnImageIntercator`}
                style={
                  isFullScreen
                    ? { marginLeft: '350px', marginBottom: '85vh' }
                    : {}
                }
              >
                Del
              </button>
              <button
  className={`ExplorerImageOnImageIntercator`}
  onClick={() => handleShowInExplorer(images[currentIndex])}
  style={
    isFullScreen
      ? { marginRight: '350px', marginTop: '85vh' }
      : {}
  }
>
  Files
</button>

              <button
                onClick={handleOnAddImage}
                className={`AddImageOnImageIntercator`}
                style={isFullScreen ? { marginTop: '85vh' } : {}}
              >
                Add Image
              </button>
              <button
                onClick={toggleFullScreen}
                className={`FullScreenImageOnImageIntercator`}
                style={
                  isFullScreen ? { marginLeft: '305px', marginTop: '85vh' } : {}
                }
              >
                {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
              </button>
              <div
                style={isFullScreen ? { marginTop: '80vh' } : {}}
                className="CounterImageOnImageIntercator image-counter"
              >
                {images.map((_, index) => (
                  <div
                    key={index}
                    className={`counter-bar ${
                      index === currentIndex ? 'active' : ''
                    }`}
                  />
                ))}
              </div>
              <img
                ref={imageRef}
                src={images[currentIndex]}
                alt={`Room image ${currentIndex + 1}`}
                className="main-image"
              />
            </div>
            <button className="arrow-button right" onClick={nextImage}>
              <img src={RightArrow} alt="Next" />
            </button>
          </div>
          <div className="controls"></div>
        </>
      ) : (
        <div className="no-images">
          <p>No images available</p>
          <button onClick={handleOnAddImage}>Add Image</button>
        </div>
      )}
    </div>
  );
};

export default ImageInteractor;
