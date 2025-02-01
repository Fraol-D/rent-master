import React, { useState, useEffect, useRef } from 'react';

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
import { useGlobal } from 'renderer/components/GlobalContext';

interface ImageInteractorProps {
  room?: RoomType;
  isAddRoomImage?: boolean;
  refreshState?: boolean;
  SetRefreshState?: (newval: boolean) => void;
  AddRoomState?: boolean;
  setIsMoreThanOneImage?: any;
  sidebarState?: boolean;
}

const ImageInteractor2: React.FC<ImageInteractorProps> = ({
  room,
  isAddRoomImage = false,
  refreshState,
  SetRefreshState,
  AddRoomState,
  setIsMoreThanOneImage,
  sidebarState,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [images, setImages] = useState([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState(0);

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
      if (sidebarState) {
        fetchRoomImages2();
      }
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
        //fz((prevIndex) => (prevIndex + 1) % images.length);
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
  useEffect(() => {
    if (AddRoomState) {
      if (sidebarState) {
        fetchRoomImages2();
      }
    }
  }, [sidebarState]);
  const fetchRoomImages2 = async () => {
    if (AddRoomState) {
      if (sidebarState) {
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
        try {
          setIsUploading(true);
          setTotalFiles(files.length);
          setUploadedFiles(0);
          const filteredFiles = Array.from(files).filter(
            (file) => file.size <= 5 * 1024 * 1024
          ); // 5MB limit
          if (filteredFiles.length === 0) {
            showAlert(
              text.app.roomPage.sidebar.ImageInteractor.alert
                .AllFilesAreAboveThe5MBLimit,
              'error'
            );
            setIsUploading(false);
            return;
          } else if (filteredFiles.length < files.length) {
            showAlert(
              text.app.roomPage.sidebar.ImageInteractor.alert
                .SomeFilesExceededThe5MBLimitAndWereNotUploaded,
              'error'
            );
          }

          const folderText = isAddRoomImage
            ? 'Add a room images'
            : room
            ? `Floor ${room.floor}, Room ${room.roomIndex} - ${room.id}`
            : '';

          for (let i = 0; i < filteredFiles.length; i++) {
            const results = await AddRoomImageToFiles(
              [filteredFiles[i]],
              folderText
            );
            if (results) {
              setUploadedFiles((prev) => prev + 1);
              setUploadProgress(((i + 1) / filteredFiles.length) * 100);
            }
          }

          if (!isAddRoomImage && room) {
            fetchRoomImages();
          } else {
            fetchRoomImages2();
          }
          showAlert(
            text.app.roomPage.sidebar.ImageInteractor.alert
              .ImagesUploadedSuccessfully,
            'success'
          );
        } catch (error) {
          console.error('Error uploading files:', error);
          showAlert(
            text.app.roomPage.sidebar.ImageInteractor.alert
              .AnErrorOccurredWhileUploadingFilesPleaseTryAgain
          );
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
          setTotalFiles(0);
          setUploadedFiles(0);
        }
      }
    };

    input.click();
  };
  const { confirm } = useConfirm();
  const handleDeleteImage = async () => {
    const choice = await confirm(
      text.app.roomPage.sidebar.ImageInteractor.alert
        .AreYouSureYouWantToDeleteThisImage,
      {
        type: 'danger',
        title: 'Delete Image',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      }
    );
    if (choice)
      if (room) {
        const currentImage = window.electron
          ? images[currentIndex]
          : images[currentIndex].fullPath;
        const fileName = currentImage.split('/').pop();
        const result = await deleteRoomImage(room.id, fileName);
        if (result && result.message === 'Image deleted successfully') {
          showAlert(
            text.app.roomPage.sidebar.ImageInteractor.alert
              .ImageDeletedSuccessfully,
            'success'
          );
          setImages((prevImages) =>
            prevImages.filter((img) =>
              window.electron
                ? img !== currentImage
                : img.fullPath !== currentImage
            )
          );
          if (currentIndex >= images.length - 1) {
            setCurrentIndex((prevIndex) => Math.max(0, prevIndex - 1));
          }
        }
      } else {
        console.log(images[currentIndex]);
        const currentImage = window.electron
          ? images[currentIndex]
          : images[currentIndex].fullPath;
        const fileName = currentImage.split('/').pop();
        const result = await deleteRoomImage('Add a room images', fileName);
        if (result && result.message === 'Image deleted successfully') {
          showAlert(
            text.app.roomPage.sidebar.ImageInteractor.alert
              .ImageDeletedSuccessfully,
            'success'
          );
          setImages((prevImages) =>
            prevImages.filter((img) =>
              window.electron
                ? img !== currentImage
                : img.fullPath !== currentImage
            )
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
          downloadImage(roomId, fileName).catch((error) => {
            console.error('Error downloading image:', error);
            showAlert('Failed to download image. Please try again.');
          });
        }
      } catch (error) {
        console.error('Error processing image path:', error);
        showAlert('Failed to process image path. Please try again.');
      }
    }
  };
  const { text } = useGlobal();
  return (
    <div
      ref={containerRef}
      className="image-interactor"
      style={{ width: '100%', height: '100%', position: 'relative' }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {isUploading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            borderRadius: 'inherit',
          }}
        >
          <div
            style={{
              color: 'white',
              padding: '20px',
              borderRadius: '5px',
              textAlign: 'center',
            }}
          >
            <div>
              {text.app.roomPage.sidebar.ImageInteractor.UploadingImages}
            </div>
            <div style={{ marginTop: '10px' }}>
              {text.app.roomPage.sidebar.ImageInteractor.UploadedFiles(
                uploadedFiles,
                totalFiles
              )}
            </div>
            <div
              style={{
                width: '200px',
                height: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                marginTop: '10px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  backgroundColor: 'white',
                  transition: 'width 0.3s ease-in-out',
                }}
              />
            </div>
            <div style={{ marginTop: '5px' }}>
              {Math.round(uploadProgress)}%
            </div>
          </div>
        </div>
      )}
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
              <button onClick={handleDeleteImage} disabled={isUploading}>
                {text.app.roomPage.sidebar.ImageInteractor.Del}
              </button>
              <button
                onClick={() => handleShowInExplorer(images[currentIndex])}
                disabled={isUploading}
              >
                {window.electron
                  ? text.app.roomPage.sidebar.ImageInteractor.Files
                  : text.app.roomPage.sidebar.ImageInteractor.Download}
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
              <button onClick={handleOnAddImage} disabled={isUploading}>
                {text.app.roomPage.sidebar.add}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="no-images">
          <p>{text.app.roomPage.sidebar.ImageInteractor.noImagesAvailable}</p>
          <button onClick={handleOnAddImage} disabled={isUploading} style={{}}>
            {text.app.roomPage.sidebar.ImageInteractor.addImage}
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(ImageInteractor2);
