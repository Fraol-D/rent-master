import React, { useState, useEffect, useRef } from 'react';
import '../../../CSS/ImageInteractor.css';
import RightArrow from '../../../../assets/assets/Dark mode/Right arrow.png';
import {
  AddRoomImageToFiles,
  deleteRoomImage,
  downloadImage,
  getRealFile,
  getRoomImages,
} from 'Backend/localServerApis';
import { useAlert } from 'renderer/components/useAlert';
import { useConfirm } from 'renderer/components/useConfirm';

interface ImageInteractorProps {
  room?: RoomType;
  isAddRoomImage?: boolean;
  refreshState?: boolean;
  SetRefreshState?: (newval: boolean) => void;
  AddRoomState?: boolean;
  setIsMoreThanOneImage?: any;
}

const ImageInteractor2: React.FC<ImageInteractorProps> = ({
  room,
  isAddRoomImage = false,
  refreshState,
  SetRefreshState,
  AddRoomState,
  setIsMoreThanOneImage,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [images, setImages] = useState([]);
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
    if (AddRoomState) {
      if (images.length > 0) {
        setIsMoreThanOneImage(true);
      } else {
        setIsMoreThanOneImage(false);
      }
    }
  }, [AddRoomState, images]);
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (images.length > 1) {
      interval = setInterval(() => {
        //setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isHovering, images.length]);

  const fetchRoomImages = async () => {
    if (room) {
      const roomImages = await getRoomImages(room.id);
      if (roomImages && roomImages.images) {
        if (window.electron)
          setImages(
            roomImages.images.map((image: any) => {
              delete image.fullUrl;
              delete image.url;
              return Object.values(image).join('');
            })
          );
        else {
          setImages(roomImages.images);
        }
      } else {
        setImages([]);
      }
    }
  };
  const fetchRoomImages2 = async () => {
    if (AddRoomState) {
      const roomImages = await getRoomImages('Add a room images');
      console.log(roomImages);
      if (roomImages && roomImages.images) {
        console.log(roomImages.images);
        if (window.electron) {
          setImages(
            roomImages.images.map((image: any) => {
              delete image.fullUrl;
              delete image.url;
              return Object.values(image).join('');
            })
          );
        } else {
          setImages(roomImages.images);
        }
      } else {
        setImages([]);
      }
    }
  };
  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    );
  };
  const { showAlert } = useAlert();
  const handleOnAddImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/gif,image/svg+xml';
    input.multiple = true;

    input.onchange = async (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const filteredFiles = Array.from(files).filter(file => file.size <= 5 * 1024 * 1024); // 5MB limit
        if(filteredFiles.length === 0){
          showAlert('All files are above the 5MB limit.', 'error');
          return;
        } else if (filteredFiles.length < files.length) {
          showAlert('Some files exceeded the 5MB limit and were not uploaded.', 'error');
        }

        try {
          const folderText = isAddRoomImage
            ? 'Add a room images'
            : room
            ? `Floor ${room.floor}, Room ${room.roomIndex} - ${room.id}`
            : '';
          const results = await AddRoomImageToFiles(filteredFiles, folderText);
          if (results) {
            if (!isAddRoomImage && room) {
              fetchRoomImages();
            } else {
              fetchRoomImages2();
            }
            showAlert('Images uploaded successfully!', 'success');
          } else {
            console.error('Failed to upload images');
            showAlert('Failed to upload images. Please try again.');
          }
        } catch (error) {
          console.error('Error uploading files:', error);
          showAlert(
            'An error occurred while uploading files. Please try again.'
          );
        }
      }
    };

    input.click();
  };
  const { confirm } = useConfirm();
  const handleDeleteImage = async () => {
    const choice = await confirm('Are you sure you want to delete this image?', {
      type: 'danger',
      title: 'Delete Image',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if(choice)if (room) {
      const currentImage = window.electron ? images[currentIndex] : images[currentIndex].fullPath;
      const fileName = currentImage.split('/').pop();
      const result = await deleteRoomImage(room.id, fileName);
      if (result && result.message === 'Image deleted successfully') {
        showAlert('Image deleted successfully', 'success');
        setImages((prevImages) =>
          prevImages.filter((img) => window.electron ? img !== currentImage : img.fullPath !== currentImage)
        );
        if (currentIndex >= images.length - 1) {
          setCurrentIndex((prevIndex) => Math.max(0, prevIndex - 1));
        }
      }
    } else {
      console.log(images[currentIndex]);
      const currentImage = window.electron ? images[currentIndex] : images[currentIndex].fullPath;
      const fileName = currentImage.split('/').pop();
      const result = await deleteRoomImage('Add a room images', fileName);
      if (result && result.message === 'Image deleted successfully') {
        showAlert('Image deleted successfully', 'success');
        setImages((prevImages) =>
          prevImages.filter((img) => window.electron ? img !== currentImage : img.fullPath !== currentImage)
        );
        if (currentIndex >= images.length - 1) {
          setCurrentIndex((prevIndex) => Math.max(0, prevIndex - 1));
        }
      }
    }
  };

  const handleShowInExplorer = (imagePath: string) => {
    if (window.electron) {
      window.electron.ipcRenderer.send('show-item-in-folder', imagePath);
    } else {
      // Web version - download the image
      // Web version - download the image
    try {
      const pathParts = imagePath.fullPath.split(/[/\\]/);
      const fileName = pathParts[pathParts.length - 1];
      const roomId = room?.id || 'Add a room images';
      
      if (fileName) {
        downloadImage(roomId, fileName)
          .catch(error => {
            console.error('Error downloading image:', error);
            alert('Failed to download image. Please try again.');
          });
      }
    } catch (error) {
      console.error('Error processing image path:', error);
      alert('Failed to process image path. Please try again.');
    }
  }}

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
              src={
                window.electron
                  ? images[currentIndex]
                  : images[currentIndex].fullUrl
              }
              alt={`Room image ${currentIndex + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
            <button
              className="arrow-button left"
              onClick={prevImage}
              style={{ position: 'absolute', left: 0, top: '25%' }}
            >
              ◀
            </button>
            <button
              className="arrow-button right"
              onClick={nextImage}
              style={{ position: 'absolute', right: 0, top: '25%' }}
            >
            ▶
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
               {window.electron ? 'Files' : 'Download'}
              </button>
              <div
                style={{
                  marginTop: 'var(---15px-V)',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-start',
                }}
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
          <button onClick={handleOnAddImage} style={{}}>
            Add Image
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(ImageInteractor2);
