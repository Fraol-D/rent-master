import React, { useState, useEffect, useRef } from 'react';
import '../../CSS/ImageInteractor.css';
import RightArrow from '../../../assets/assets/Dark mode/Right arrow.png';
import {
  AddRoomImageToFiles,
  deleteRoomImage,
  getRoomImages,
} from 'Backend/localServerApis';

interface ImageInteractorProps {
  room?: RoomType;
  isAddRoomImage?: boolean;
  refreshState?: boolean;
  SetRefreshState?: (newval: boolean) => void;
  AddRoomState?: boolean;
}

const ImageInteractor2: React.FC<ImageInteractorProps> = ({
  room,
  isAddRoomImage = false,
  refreshState,
  SetRefreshState,AddRoomState
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  useEffect(() => {
    if (isAddRoomImage) {
      if (refreshState) {
        fetchRoomImages2();
        if (SetRefreshState) SetRefreshState(false);
      }
    }
  }, [refreshState]);
  useEffect(() => {
    if (!isAddRoomImage && room) {
      fetchRoomImages();
    }
  }, [room?.id, isAddRoomImage]);
  useEffect(() => {
    if (isAddRoomImage) {
      fetchRoomImages2();
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (images.length > 1) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isHovering, images.length]);

  const fetchRoomImages = async () => {
    if (room) {
      const roomImages = await getRoomImages(room.id);
      if (roomImages && roomImages.images) {
        setImages(roomImages.images);
      }
    }
  };
  const fetchRoomImages2 = async () => {
    if(AddRoomState){const roomImages = await getRoomImages('Add a room images');
    console.log(roomImages);
    if (roomImages && roomImages.images) {
      setImages(roomImages.images);
    } else {
      setImages([]);
    }}
  };
  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    );
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
          const folderText = isAddRoomImage
            ? 'Add a room images'
            : room
            ? `Floor ${room.floor}, Room ${room.roomIndex} - ${room.id}`
            : '';
          const results = await AddRoomImageToFiles(files, folderText);
          if (results) {
            console.log('Images uploaded successfully:', results);
            if (!isAddRoomImage && room) {
              fetchRoomImages();
            } else {
              fetchRoomImages2();
            }
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
    if (room) {
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
    } else {
      const currentImage = images[currentIndex];
      const fileName = currentImage.split('/').pop();
      const result = await deleteRoomImage('Add a room images', fileName);
      if (result && result.message === 'Image deleted successfully') {
        setImages((prevImages) =>
          prevImages.filter((img) => img !== currentImage)
        );
        if (currentIndex >= images.length - 1) {
          setCurrentIndex((prevIndex) => Math.max(0, prevIndex - 1));
        }
      }
    }
  };

  const handleShowInExplorer = (imagePath: string) => {
    window.electron.ipcRenderer.send('show-item-in-folder', imagePath);
  };

  return (
    <div
      ref={containerRef}
      className="image-interactor"
      style={{ width: '100%', height: '100%' }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {images.length > 0 ? (
        <>
          <div
            className="image-container"
            style={{ position: 'relative', width: '100%', height: '100%' }}
          >
            <img
              src={images[currentIndex]}
              alt={`Room image ${currentIndex + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
            <button
              className="arrow-button left"
              onClick={prevImage}
              style={{ position: 'absolute', left: 0, top: '50%' }}
            >
              <img
                src={RightArrow}
                alt="Previous"
                style={{ transform: 'rotate(180deg)' }}
              />
            </button>
            <button
              className="arrow-button right"
              onClick={nextImage}
              style={{ position: 'absolute', right: 0, top: '50%' }}
            >
              <img src={RightArrow} alt="Next" />
            </button>
            <div
              className="controls"
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <button onClick={handleDeleteImage}>Del</button>
              <button
                onClick={() => handleShowInExplorer(images[currentIndex])}
              >
                Files
              </button>
              <div
                style={{ marginTop: '-15px', flexWrap:"wrap", justifyContent:"flex-start" }}
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
              <button onClick={handleOnAddImage}>Add</button>
            </div>
          </div>
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

export default ImageInteractor2;
