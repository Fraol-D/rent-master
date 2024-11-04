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
            imageRef.current.style.width = 'var(--400px-V)';
            imageRef.current.style.height = 'auto';
          } else if (aspectRatio < 1) {
            imageRef.current.style.width = 'auto';
            imageRef.current.style.height = 'var(--400px-V)';
          } else {
            imageRef.current.style.width = 'var(--400px-V)';
            imageRef.current.style.height = 'var(--400px-V)';
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
    input.accept = 'image/jpeg,image/png,image/gif,image/svg+xml';
    input.multiple = true;

    input.onchange = async (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const validFiles = Array.from(files).filter(file => file.size <= 5 * 1024 * 1024); // 5MB limit
        if (validFiles.length === 0) {
          alert('All selected files exceed the 5MB size limit. Please select smaller images.');
          console.error('All selected files exceed the 5MB size limit');
          return;
        }
        if (validFiles.length < files.length) {
          alert(`${files.length - validFiles.length} file(s) were skipped because they exceed the 5MB size limit.`);
        }
        try {
          const folderText = `Floor ${room.floor}, Room ${room.roomIndex} - ${room.id}`;
          const results = await AddRoomImageToFiles(validFiles, folderText);
          if (results) {
            console.log('Images uploaded successfully:', results);
            fetchRoomImages();
          } else {
            console.error('Failed to upload images');
            alert('Failed to upload images. Please try again.');
          }
        } catch (error) {
          console.error('Error uploading files:', error);
          alert('An error occurred while uploading files. Please try again.');
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
                    ? { marginLeft: 'var(--350px-V)', marginBottom: '85vh' }
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
      ? { marginRight: 'var(--350px-V)', marginTop: '85vh' }
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
                  isFullScreen ? { marginLeft: 'var(--305px-V)', marginTop: '85vh' } : {}
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
          <button onClick={handleOnAddImage} style={{boxShadow: 'var(--2px-V) var(--2px-V) var(--6px-V) var(--Text-Color-Reverse)'}}>Add Image</button>
        </div>
      )}
    </div>
  );
};

export default React.memo(ImageInteractor);
