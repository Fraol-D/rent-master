import React, { useState, useEffect, useRef } from 'react';

import RightArrow from '../../../../assets/assets/Dark mode/Right arrow.png';
import {
  AddRoomImageToFiles,
  deleteRoomImage,
  downloadImage,
  getRoomImages,
} from 'Backend/localServerApis';
import { useAlert } from 'renderer/components/useAlert';

interface ImageInteractorProps {
  onAddImage: () => void;
  onDeleteImage: (index: number) => void;
  onShowInExplorer: (path: string) => void;
  room: RoomType;
}
import { v4 as uuidv4 } from 'uuid';
import { useConfirm } from 'renderer/components/useConfirm';

const ImageInteractor: React.FC<ImageInteractorProps> = ({
  onDeleteImage,
  onShowInExplorer,
  room,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const [images, setImages] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState(0);

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
          const filteredFiles = Array.from(files).filter(file => file.size <= 5 * 1024 * 1024); // 5MB limit
          
          if(filteredFiles.length === 0){
            showAlert('All files are above the 5MB limit.', 'error');
            setIsUploading(false);
            return;
          } else if (filteredFiles.length < files.length) {
            showAlert('Some files exceeded the 5MB limit and were not uploaded.', 'error');
          }

          const folderText = `Floor ${room.floor}, Room ${room.roomIndex} - ${room.id}`;
          
          for (let i = 0; i < filteredFiles.length; i++) {
            const results = await AddRoomImageToFiles([filteredFiles[i]], folderText);
            if (results) {
              setUploadedFiles(prev => prev + 1);
              setUploadProgress(((i + 1) / filteredFiles.length) * 100);
            }
          }
          
          fetchRoomImages();
          showAlert('Images uploaded successfully!', 'success');

        } catch (error) {
          console.error('Error uploading files:', error);
          showAlert('An error occurred while uploading files. Please try again.');
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
    const choice = await confirm('Are you sure you want to delete this image?', {
      type: 'danger',
      title: 'Delete Image',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if(choice){
    const currentImage = window.electron ? images[currentIndex] : images[currentIndex].fullPath;
    const fileName = currentImage.split('/').pop();
    console.log(room.id, fileName, currentImage);
    const result = await deleteRoomImage(room.id, fileName);
 
    if (result && result.message === 'Image deleted successfully') {
    console.log(result);
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
  useEffect(() => {
    fetchRoomImages();
  }, [room.id]);
  const fetchRoomImages = async () => {
    const roomImages = await getRoomImages(room.id);
    if (roomImages && roomImages.images) {
      if (window.electron) {
       
        const IMAGESS =   roomImages.images.map((image: any) => {
          delete image.fullUrl;
          delete image.url;
          return Object.values(image).join('');
        })
        setImages(
        IMAGESS
        );
       
      } else {
        setImages(roomImages.images);
   
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
    <div className={`${isFullScreen ? 'fullscreen' : ''} image-interactor`}>
      {isUploading && (
        <div style={{
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
          borderRadius: 'inherit'
        }}>
          <div style={{
            color: 'white',
            padding: '20px',
            borderRadius: '5px',
            textAlign: 'center'
          }}>
            <div>Uploading Images...</div>
            <div style={{marginTop: '10px'}}>
              {uploadedFiles} of {totalFiles} files uploaded
            </div>
            <div style={{
              width: '200px',
              height: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              marginTop: '10px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${uploadProgress}%`,
                height: '100%',
                backgroundColor: 'white',
                transition: 'width 0.3s ease-in-out'
              }} />
            </div>
            <div style={{marginTop: '5px'}}>{Math.round(uploadProgress)}%</div>
          </div>
        </div>
      )}
      {images.length > 0 ? (
        <>
          <div className="image-container">
            <button className="arrow-button left" onClick={prevImage}>
              ◀
            </button>
            <div className="image-wrapper">
              <button
                onClick={handleDeleteImage}
                className={`DeleteImageOnImageIntercator`}
                style={
                  isFullScreen
                    ? { marginLeft: 'var(--350px-V)', marginBottom: '82vh' }
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
                    ? { marginRight: window.electron ? 'var(--350px-V)' : 'var(--320px-V)', marginTop: '82vh' }
                    : {marginRight: window.electron ? 'var(--350px-V)' : 'var(--320px-V)',}
                }
              >
                {window.electron ? 'Files' : 'Download'}
              </button>

              <button
                onClick={handleOnAddImage}
                className={`AddImageOnImageIntercator`}
                style={isFullScreen ? { marginTop: '82vh' } : {}}
              >
                Add Image
              </button>
              <button
                onClick={toggleFullScreen}
                className={`FullScreenImageOnImageIntercator`}
                style={
                  isFullScreen
                    ? { marginLeft: 'var(--305px-V)', marginTop: '82vh' }
                    : {}
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
                src={
                  window.electron
                    ? images[currentIndex]
                    : images[currentIndex].fullUrl
                }
                alt={`Room image ${currentIndex + 1}`}
                className="main-image"
              />
            </div>
            <button className="arrow-button right" onClick={nextImage}>
            ▶
            </button>
          </div>
          <div className="controls"></div>
        </>
      ) : (
        <div className="no-images">
          <p>No images available</p>
          <button
            onClick={handleOnAddImage}
            style={{
              boxShadow:
                'var(--2px-V) var(--2px-V) var(--6px-V) var(--Text-Color-Reverse)',
            }}
          >
            Add Image
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(ImageInteractor);
