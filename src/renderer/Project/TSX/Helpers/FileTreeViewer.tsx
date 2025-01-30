import React, { useState, useEffect, useRef } from 'react';
import {
  FaFolder,
  FaFile,
  FaFileImage,
  FaFilePdf,
  FaTrash,
  FaPencilAlt,
  FaEye,
  FaSearch,
  FaFolderPlus,
  FaUpload,
  FaChevronDown,
  FaChevronRight,
  FaArrowRight,
  FaFileWord,
  FaCopy,
  FaCut,
  FaFolderOpen,
} from 'react-icons/fa';
import { useAlert } from 'renderer/components/useAlert';
import { useConfirm } from 'renderer/components/useConfirm';
import LoadingGif from 'renderer/assets/assets/Loading/Rolling-1s-200px.gif';
import {
  getFileTreeDirectory,
  getFileInfo,
  renameFileTreeItem,
  deleteFileTreeItem,
  createFolder,
  moveFileTreeItem,
  copyFileTreeItem,
  uploadFiles,
  downloadFile,
  downloadFolder,
  searchFiles,
  compressAndDownloadFolder,
} from 'Backend/FileTreeApis';

// Types
interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileItem[];
  extension?: string;
  size?: number;
  modifiedAt?: string | Date;
  isExpanded?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  item: FileItem;
  onClose: () => void;
  onOpen: () => void;
  onCut: () => void;
  onCopy: () => void;
  onRename: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

interface MoveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (destination: string) => void;
  files: FileItem[];
  selectedItems: Set<string>;
}

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onUpload: (files: FileList) => void;
}

interface DragItem {
  id: string;
  type: 'file' | 'folder';
  path: string;
}

// Replace dummy fileOperations with real API calls
const fileOperations = {
  get: async (path: string): Promise<FileItem | null> => {
    const response = await getFileInfo(path);
    return response;
  },

  getMultiple: async (directoryPath: string): Promise<FileItem[]> => {
    const response = await getFileTreeDirectory(directoryPath);
    return response || [];
  },

  open: async (path: string): Promise<void> => {
    if (window.electron) {
      await window.electron.shell.openPath(path);
    } else {
      await downloadFile(path);
    }
  },

  rename: async (path: string, newName: string): Promise<boolean> => {
    const response = await renameFileTreeItem(path, newName);
    return !!response;
  },

  delete: async (path: string): Promise<boolean> => {
    const response = await deleteFileTreeItem(path);
    return !!response;
  },

  move: async (
    sourcePath: string,
    destinationPath: string
  ): Promise<boolean> => {
    const response = await moveFileTreeItem(sourcePath, destinationPath);
    return !!response;
  },

  copy: async (
    sourcePath: string,
    destinationPath: string
  ): Promise<boolean> => {
    const response = await copyFileTreeItem(sourcePath, destinationPath);
    return !!response;
  },

  createFolder: async (parentPath: string, name: string): Promise<boolean> => {
    const response = await createFolder(parentPath, name);
    return !!response;
  },

  upload: async (parentPath: string, files: FileList): Promise<boolean> => {
    const response = await uploadFiles(parentPath, files);
    return !!response;
  },

  download: async (path: string, isFolder: boolean): Promise<void> => {
    if (isFolder) {
      await downloadFolder(path);
    } else {
      await downloadFile(path);
    }
  },

  search: async (term: string): Promise<FileItem[]> => {
    const response = await searchFiles(term);
    return response || [];
  },

  compressAndDownloadFolder: async (path: string): Promise<boolean> => {
    const response = await compressAndDownloadFolder(path);
    return !!response;
  },
};

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  item,
  onClose,
  onOpen,
  onRename,
  onDelete,
  onDownload,
}) => {
  return (
    <div
      className="context-menu"
      style={{
        left: x,
        top: y,
      }}
    >
      {item.type === 'file' && (
        <>
          <div onClick={onOpen}>Open</div>
          <div onClick={onRename}>Rename</div>
          <div onClick={onDelete}>Delete</div>
          <div onClick={onDownload}>Download</div>
        </>
      )}
      {item.type === 'folder' && (
        <>
          <div onClick={onOpen}>Open</div>
          <div onClick={onRename}>Rename</div>
          <div onClick={onDelete}>Delete</div>
        </>
      )}
    </div>
  );
};

const MoveDialog: React.FC<MoveDialogProps> = ({
  isOpen,
  onClose,
  onMove,
  files,
  selectedItems,
}) => {
  const [selectedDestination, setSelectedDestination] = useState<string>('');

  if (!isOpen) return null;

  const renderFolderOptions = (items: FileItem[], depth = 0): JSX.Element[] => {
    return items.flatMap((item) => {
      if (item.type === 'folder' && !selectedItems.has(item.id)) {
        return [
          <option key={item.id} value={item.path}>
            {'  '.repeat(depth) + item.name}
          </option>,
          ...(item.children
            ? renderFolderOptions(item.children, depth + 1)
            : []),
        ];
      }
      return [];
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Move Items</h2>
        <select
          value={selectedDestination}
          onChange={(e) => setSelectedDestination(e.target.value)}
          style={{ width: '100%', marginBottom: 'var(--16px-V)' }}
        >
          <option value="">Select destination folder</option>
          {renderFolderOptions(files)}
        </select>
        <div className="modal-buttons">
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={() => {
              onMove(selectedDestination);
              onClose();
            }}
            disabled={!selectedDestination}
          >
            Move
          </button>
        </div>
      </div>
    </div>
  );
};

const UploadDialog: React.FC<UploadDialogProps> = ({
  isOpen,
  onClose,
  currentPath,
  onUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Upload Files</h2>
        <p>Upload to: {currentPath}</p>
        <input
          type="file"
          ref={fileInputRef}
          multiple
          style={{ marginBottom: 'var(--16px-V)' }}
          onChange={(e) => {
            if (e.target.files) {
              onUpload(e.target.files);
              onClose();
            }
          }}
        />
        <div className="modal-buttons">
          <button onClick={onClose}>Cancel</button>
          <button onClick={() => fileInputRef.current?.click()}>
            Select Files
          </button>
        </div>
      </div>
    </div>
  );
};

// Add a helper function to safely parse dates
const parseDate = (dateString: string | Date | undefined): Date => {
  if (!dateString) return new Date();
  if (dateString instanceof Date) return dateString;
  return new Date(dateString);
};

const FileTreeViewer: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: FileItem;
  } | null>(null);
  const [clipboard, setClipboard] = useState<{
    action: 'cut' | 'copy';
    items: FileItem[];
  } | null>(null);
  const [lastClickedItem, setLastClickedItem] = useState<{
    id: string;
    time: number;
  } | null>(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');
  const DOUBLE_CLICK_DELAY = 300; // milliseconds
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [expandTimeout, setExpandTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [renamingItem, setRenamingItem] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [lastSelectedItem, setLastSelectedItem] = useState<string | null>(null);

  const getFileIcon = (item: FileItem) => {
    if (item.type === 'folder') return <FaFolder color="#f8d775" />;
    switch (item.extension) {
      case 'pdf':
        return <FaFilePdf color="#ff4444" />;
      case 'jpg':
      case 'png':
        return <FaFileImage color="#4CAF50" />;
      case 'doc':
      case 'docx':
        return <FaFileWord color="#2196F3" />;
      default:
        return <FaFile color="#9e9e9e" />;
    }
  };

  const getFileType = (item: FileItem): string => {
    if (item.type === 'folder') return 'Folder';
    if (!item.extension) return 'File';
    return item.extension.toUpperCase();
  };

  const handleOpen = async (item: FileItem, isArrowClick: boolean = false) => {
    if (item.type === 'file') {
      window.open(
        `/api/fileTree/open/${encodeURIComponent(item.path)}`,
        '_blank'
      );
      return;
    }

    if (isArrowClick || !expandedFolders.has(item.id)) {
      if (!expandedFolders.has(item.id)) {
        setLoadingFolders((prev) => new Set(prev).add(item.id));
        try {
          const children = await fileOperations.getMultiple(item.path);
          setFiles((prevFiles) =>
            updateFileTreeItem(prevFiles, item.id, {
              children,
            })
          );
          setExpandedFolders((prev) => new Set(prev).add(item.id));
        } finally {
          setLoadingFolders((prev) => {
            const newSet = new Set(prev);
            newSet.delete(item.id);
            return newSet;
          });
        }
      } else if (isArrowClick) {
        setExpandedFolders((prev) => {
          const newSet = new Set(prev);
          newSet.delete(item.id);
          return newSet;
        });
      }
    }
  };

  const handleDoubleClick = (item: FileItem) => {
    if (item.type === 'folder') {
      setExpandedFolders((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(item.id)) {
          newSet.delete(item.id);
        }
        return newSet;
      });
    }
  };

  const handleRename = async (item: FileItem) => {
    // Check if folder is under protected paths
    if (
      item.type === 'folder' &&
      (item.path.startsWith('/Room Documents/') ||
        item.path.startsWith('/Room Pictures/') ||
        item.path.startsWith('/Room Documents') ||
        item.path.startsWith('/Room Pictures'))
    ) {
      showAlert(
        'Cannot rename folders under Room Documents or Room Pictures. Becuase they are used by the app.'
      );
      return;
    }

    setRenamingItem(item.id);
    setNewItemName(item.name);
  };

  const handleRenameSave = async (item: FileItem) => {
    if (newItemName && newItemName !== item.name) {
      await fileOperations.rename(item.path, newItemName);
      refreshCurrentDirectory();
    }
    setRenamingItem(null);
    setNewItemName('');
  };
  const { confirm } = useConfirm();
  const handleDelete = async (item: FileItem) => {
    const confirmed = await confirm('Confirm Delete', {
      title: 'Confirm Delete',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });

    if (confirmed) {
      await fileOperations.delete(item.path);
      refreshCurrentDirectory();
    }
  };

  const handleContextMenu = (e: React.MouseEvent, item: FileItem) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
    });
  };

  const handleItemClick = (e: React.MouseEvent, item: FileItem) => {
    e.stopPropagation();

    // Handle shift + click for multiple selection
    if (e.shiftKey && lastSelectedItem) {
      const allItems = getAllItems(files);
      const startIndex = allItems.findIndex((i) => i.id === lastSelectedItem);
      const endIndex = allItems.findIndex((i) => i.id === item.id);

      if (startIndex !== -1 && endIndex !== -1) {
        const start = Math.min(startIndex, endIndex);
        const end = Math.max(startIndex, endIndex);

        const newSelection = new Set(selectedItems);
        for (let i = start; i <= end; i++) {
          if (allItems[i].type === 'file') {
            // Only select files, not folders
            newSelection.add(allItems[i].id);
          }
        }
        setSelectedItems(newSelection);
      }
      return;
    }

    // Handle ctrl/cmd + click for individual selection
    if (e.ctrlKey || e.metaKey) {
      setSelectedItems((prev) => {
        const newSelection = new Set(prev);
        if (item.type === 'file') {
          // Only allow file selection
          if (newSelection.has(item.id)) {
            newSelection.delete(item.id);
          } else {
            newSelection.add(item.id);
          }
        }
        return newSelection;
      });
    } else {
      // Regular click - select single item
      if (item.type === 'file') {
        // Only allow file selection
        setSelectedItems(new Set([item.id]));
      }
    }

    setLastSelectedItem(item.id);
  };

  const handleCollapseAll = () => {
    const collapseFiles = (items: FileItem[]): FileItem[] => {
      return items.map((item) => ({
        ...item,
        isExpanded: false,
        children: item.children ? collapseFiles(item.children) : undefined,
      }));
    };
    setFiles(collapseFiles(files));
  };

  const handleNewFolder = async () => {
    const folderName = await prompt({
      title: 'Create Folder',
      message: 'Enter folder name:',
      defaultValue: 'New Folder',
    });

    if (folderName) {
      await fileOperations.createFolder(currentPath, folderName);
      refreshCurrentDirectory();
    }
  };

  const handleMove = async (destination: string) => {
    const selectedFiles = Array.from(selectedItems)
      .map((itemId) => {
        const items = getAllItems(files);
        return items.find((item) => item.id === itemId);
      })
      .filter(
        (item): item is FileItem => item !== undefined && item.type === 'file'
      );

    if (selectedFiles.length === 0) {
      alert('Please select files to move');
      return;
    }

    try {
      const movePromises = selectedFiles.map((file) => {
        const newPath = `${destination}/${file.name}`;
        console.log(`Moving ${file.path} to ${newPath}`);
        return fileOperations.move(file.path, newPath);
      });

      await Promise.all(movePromises);
      await refreshCurrentDirectory();
      setSelectedItems(new Set());
      setShowMoveDialog(false);
    } catch (error) {
      console.error('Error moving files:', error);
      alert('Failed to move some files');
    }
  };

  const handleUpload = async (files: FileList) => {
    setIsLoading(true);
    try {
      if (!files || files.length === 0) {
        throw new Error('No files selected');
      }

      await fileOperations.upload(currentPath, files);
      await refreshCurrentDirectory();
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files: ' + error.message);
    } finally {
      setIsLoading(false);
      setShowUploadDialog(false);
    }
  };
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term) {
      const results = await fileOperations.search(term);
      setFiles(results);
    } else {
      // Reset to root directory
      const rootFiles = await fileOperations.getMultiple('/');
      setFiles(rootFiles);
    }
  };

  const filterItems = (items: FileItem[], term: string): FileItem[] => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(term);
      const childMatches = item.children
        ? filterItems(item.children, term).length > 0
        : false;
      return matchesSearch || childMatches;
    });
  };

  const toggleFolder = (e: React.MouseEvent, item: FileItem) => {
    e.stopPropagation(); // Prevent triggering selection
    if (item.type === 'folder') {
      setFiles((prevFiles) => {
        const updateFiles = (items: FileItem[]): FileItem[] => {
          return items.map((file) => {
            if (file.id === item.id) {
              return { ...file, isExpanded: !file.isExpanded };
            }
            if (file.children) {
              return { ...file, children: updateFiles(file.children) };
            }
            return file;
          });
        };
        return updateFiles(prevFiles);
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Update formatDate function
  const formatDate = (date: string | Date | undefined): string => {
    const parsedDate = parseDate(date);
    return (
      parsedDate.toLocaleDateString() + ' ' + parsedDate.toLocaleTimeString()
    );
  };

  // Update getLatestModifiedDate function
  const getLatestModifiedDate = (item: FileItem): Date => {
    if (item.type === 'file') {
      return parseDate(item.modifiedAt);
    }

    if (!item.children || item.children.length === 0) {
      return parseDate(item.modifiedAt);
    }

    const childDates = item.children.map((child) =>
      getLatestModifiedDate(child)
    );
    return new Date(Math.max(...childDates.map((date) => date.getTime())));
  };

  const getSelectedItems = (): FileItem[] => {
    const items: FileItem[] = [];
    const findItems = (fileItems: FileItem[]) => {
      for (const item of fileItems) {
        if (selectedItems.has(item.id)) {
          items.push(item);
        }
        if (item.children) {
          findItems(item.children);
        }
      }
    };
    findItems(files);
    return items;
  };
  const { showAlert } = useAlert();
  const renderToolbarButtons = () => {
    const selectedFileItems = getSelectedItems();
    const hasSelection = selectedItems.size > 0;
    const hasFileSelected = selectedFileItems.some(
      (item) => item.type === 'file'
    );
    const hasFolderSelected = selectedFileItems.some(
      (item) => item.type === 'folder'
    );

    return (
      <div className="toolbar-buttons">
        <button
          onClick={handleCollapseAll}
          style={{ opacity: 1 }} // Always active
        >
          Collapse All
        </button>
        <button
          onClick={handleNewFolder}
          style={{ opacity: 1 }} // Always active
        >
          <FaFolderPlus /> New Folder
        </button>
      </div>
    );
  };

  const handleCut = () => {
    const selectedFileItems = getSelectedItems();
    setClipboard({ action: 'cut', items: selectedFileItems });
  };

  const handleCopy = () => {
    const selectedFileItems = getSelectedItems();
    setClipboard({ action: 'copy', items: selectedFileItems });
  };

  const handlePaste = async (targetFolder: FileItem) => {
    if (!clipboard || !clipboard.items.length) return;

    const operations = clipboard.items.map((item) => {
      let newName = item.name;
      let counter = 1 + Math.random().toFixed(2);
      let newPath = `${targetFolder.path}/${newName}`;

      // Check if file exists and append (1), (2) etc until we find unused name

      const ext = newName.includes('.') ? '.' + newName.split('.').pop() : '';
      const baseName = newName.includes('.')
        ? newName.substring(0, newName.lastIndexOf('.'))
        : newName;
      newName = `${baseName} (${counter})${ext}`;
      newPath = `${targetFolder.path}/${newName}`;

      return clipboard.action === 'cut'
        ? fileOperations.move(item.path, newPath)
        : fileOperations.copy(item.path, newPath);
    });

    await Promise.all(operations);
    if (clipboard.action === 'cut') {
      setClipboard(null);
    }
    refreshCurrentDirectory();
  };

  const renderActionButtons = () => {
    const selectedFileItems = getSelectedItems();
    const hasSelection = selectedItems.size > 0;
    const hasFileSelected = selectedFileItems.some(
      (item) => item.type === 'file'
    );
    const hasFolderSelected = selectedFileItems.some(
      (item) => item.type === 'folder'
    );
    const selectedItem = selectedFileItems[0];

    return (
      <div
        className="action-buttons"
        style={{ display: 'flex', flexDirection: 'row', gap: 'var(--8px-V)' }}
      >
        <button
          onClick={() => handleOpen(selectedItem)}
          style={{ opacity: hasSelection ? 1 : 0.5 }}
          disabled={!hasSelection}
        >
          <FaEye /> Open
        </button>
        {window?.electron && (
          <button
            onClick={() =>
              window.electron.shell.showItemInFolder(selectedItem.path)
            }
            style={{ opacity: hasSelection ? 1 : 0.5 }}
            disabled={!hasSelection}
          >
            <FaFolderOpen /> Show in Explorer
          </button>
        )}
        <button
          onClick={() => handleCut()}
          style={{ opacity: hasSelection ? 1 : 0.5 }}
          disabled={!hasSelection}
        >
          <FaCut /> Cut
        </button>
        <button
          onClick={() => handleCopy()}
          style={{ opacity: hasSelection ? 1 : 0.5 }}
          disabled={!hasSelection}
        >
          <FaCopy /> Copy
        </button>
        <button
          onClick={() => handleRename(selectedItem)}
          style={{ opacity: hasSelection ? 1 : 0.5 }}
          disabled={!hasSelection}
        >
          <FaPencilAlt /> Rename
        </button>
        {selectedItem?.type === 'folder' && clipboard && (
          <button
            onClick={() => handlePaste(selectedItem)}
            style={{ opacity: 1 }}
          >
            Paste
          </button>
        )}
        {hasFolderSelected && (
          <button
            onClick={() => compressAndDownloadFolder(selectedItem.path)}
            style={{ opacity: 1 }}
          >
            Compress & Download
          </button>
        )}
        {hasFileSelected && (
          <button
            onClick={() => downloadFile(selectedItem.path)}
            style={{ opacity: 1 }}
          >
            Download
          </button>
        )}
        <button
          onClick={() => handleDelete(selectedItem)}
          style={{ opacity: hasSelection ? 1 : 0.5 }}
          disabled={!hasSelection}
        >
          <FaTrash /> Delete
        </button>
        <button
          onClick={() => setShowUploadDialog(true)}
          style={{ opacity: !hasSelection || hasFolderSelected ? 1 : 0.5 }}
          disabled={hasSelection && !hasFolderSelected}
        >
          <FaUpload /> Upload
        </button>
      </div>
    );
  };

  const handleDragStart = (e: React.DragEvent, item: FileItem) => {
    e.stopPropagation();
    setDraggedItem({
      id: item.id,
      type: item.type,
      path: item.path,
    });
    e.dataTransfer.setData('text/plain', item.path);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, item: FileItem) => {
    e.preventDefault();
    e.stopPropagation();

    if (item.type === 'folder' && draggedItem && item.id !== draggedItem.id) {
      setDragOverItem(item.id);

      // Auto-expand folder after hovering for a short time
      if (!item.isExpanded) {
        if (expandTimeout) clearTimeout(expandTimeout);
        const timeout = setTimeout(() => {
          setFiles((prevFiles) => {
            const updateFiles = (items: FileItem[]): FileItem[] => {
              return items.map((file) => {
                if (file.id === item.id) {
                  return { ...file, isExpanded: true };
                }
                if (file.children) {
                  return { ...file, children: updateFiles(file.children) };
                }
                return file;
              });
            };
            return updateFiles(prevFiles);
          });
        }, 800); // Delay before auto-expanding
        setExpandTimeout(timeout);
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent, item: FileItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (expandTimeout) {
      clearTimeout(expandTimeout);
      setExpandTimeout(null);
    }
    setDragOverItem(null);
  };

  const handleDrop = async (e: React.DragEvent, targetItem: FileItem) => {
    e.preventDefault();
    setDragOverItem(null);

    // Handle files being dropped from outside
    if (e.dataTransfer.files.length > 0) {
      if (targetItem.type === 'folder') {
        await handleUpload(e.dataTransfer.files);
        return;
      }
    }

    // Handle internal file moves
    if (targetItem.type !== 'folder') {
      return;
    }

    const selectedFiles = Array.from(selectedItems)
      .map((itemId) => {
        const items = getAllItems(files);
        return items.find((item) => item.id === itemId);
      })
      .filter(
        (item): item is FileItem => item !== undefined && item.type === 'file'
      );

    if (selectedFiles.length === 0) {
      return;
    }

    console.log(`Moving ${selectedFiles.length} files to ${targetItem.path}`);
    await handleMove(targetItem.path);
  };

  // Update renderTree where the date is used
  const renderTree = (items: FileItem[], depth: number = 0) => {
    return items.map((item) => {
      const isSelected = selectedItems.has(item.id);
      const isDraggedOver = dragOverItem === item.id;
      const isRenaming = renamingItem === item.id;
      const isLoadingChildren = loadingFolders.has(item.id);
      const isExpanded = expandedFolders.has(item.id);
      const modifiedDate =
        item.type === 'folder'
          ? getLatestModifiedDate(item)
          : parseDate(item.modifiedAt);

      return (
        <div
          key={item.id}
          style={{
            paddingLeft: `${depth * 20}px`,
          }}
        >
          <div
            className={`file-tree-item ${isSelected ? 'selected' : ''} ${
              isDraggedOver ? 'drag-over' : ''
            }`}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: 'var(--4px-V)',
              cursor: 'pointer',
              backgroundColor: isDraggedOver
                ? 'var(--Primary-Color25)'
                : isSelected
                ? 'var(--Secondary-Color30)'
                : 'transparent',
              border: isDraggedOver
                ? '1px dashed var(--Primary-Color)'
                : '1px solid transparent',
            }}
            onClick={(e) => handleItemClick(e, item)}
            onContextMenu={(e) => handleContextMenu(e, item)}
            draggable={true}
            onDragStart={(e) => handleDragStart(e, item)}
            onDragOver={(e) => handleDragOver(e, item)}
            onDragLeave={(e) => handleDragLeave(e, item)}
            onDrop={(e) => handleDrop(e, item)}
            onDoubleClick={() => handleDoubleClick(item)}
          >
            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              {item.type === 'folder' && (
                <span
                  className="expand-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpen(item, true);
                  }}
                >
                  {isLoadingChildren ? (
                    <img
                      src={LoadingGif}
                      alt="Loading..."
                      style={{
                        width: 'var(--20px-V)',
                        height: 'var(--20px-V)',
                      }}
                    />
                  ) : isExpanded ? (
                    <FaChevronDown />
                  ) : (
                    <FaChevronRight />
                  )}
                </span>
              )}
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--8px-V)',
                }}
                onClick={
                  item.type === 'folder' ? (e) => handleOpen(item) : undefined
                }
              >
                {getFileIcon(item)}
                {isRenaming ? (
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRenameSave(item);
                      } else if (e.key === 'Escape') {
                        setRenamingItem(null);
                        setNewItemName('');
                      }
                    }}
                    onBlur={() => handleRenameSave(item)}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: 'var(--Secondary-Color)',
                      border: '1px solid var(--Primary-Color)',
                      borderRadius: 'var(--3px-V)',
                      padding: 'var(--2px-V) var(--4px-V)',
                      width: '200px',
                      color: 'var(--Text-Color)',
                    }}
                  />
                ) : (
                  <span>{item.name}</span>
                )}
              </span>
            </div>

            <div className="file-info">
              <span className="file-type">{getFileType(item)}</span>
              {item.type === 'file' && (
                <span className="file-size">
                  {formatFileSize(item.size || 0)}
                </span>
              )}
              <span className="file-date">{formatDate(modifiedDate)}</span>
            </div>
          </div>
          {item.children && isExpanded && renderTree(item.children, depth + 1)}
        </div>
      );
    });
  };

  const refreshCurrentDirectory = async () => {
    setIsLoading(true);
    try {
      const updatedFiles = await fileOperations.getMultiple(currentPath);

      // Recursively load children for expanded folders
      const loadExpandedFolders = async (
        items: FileItem[]
      ): Promise<FileItem[]> => {
        const results = await Promise.all(
          items.map(async (item) => {
            if (item.type === 'folder' && expandedFolders.has(item.id)) {
              const children = await fileOperations.getMultiple(item.path);
              return {
                ...item,
                children: await loadExpandedFolders(children),
              };
            }
            return item;
          })
        );
        return results;
      };

      const filesWithExpandedFolders = await loadExpandedFolders(updatedFiles);
      setFiles(filesWithExpandedFolders);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialFiles = async () => {
      const rootFiles = await fileOperations.getMultiple('/');
      setFiles(rootFiles);
    };
    loadInitialFiles();
  }, []);

  return (
    <div className="file-tree-viewer">
      <div className="file-tree-toolbar">
        <div className="search-bar">
          <FaSearch />
          <input
            type="text"
            placeholder="Search files..."
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        {renderToolbarButtons()}
      </div>

      <div className="action-toolbar">{renderActionButtons()}</div>

      <div className="file-tree-content">
        {isLoading ? (
          <div className="loading-container">
            <img
              src={LoadingGif}
              alt="Loading..."
              style={{
                width: 'var(--30px-V)',
                height: 'var(--30px-V)',
              }}
            />
            <span>Loading...</span>
          </div>
        ) : (
          renderTree(searchTerm ? filterItems(files, searchTerm) : files)
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          item={contextMenu.item}
          onClose={() => setContextMenu(null)}
          onOpen={() => handleOpen(contextMenu.item)}
          onCut={() => {
            /* implement */
          }}
          onCopy={() => {
            /* implement */
          }}
          onRename={() => handleRename(contextMenu.item)}
          onDownload={() => {
            /* implement */
          }}
          onDelete={() => handleDelete(contextMenu.item)}
        />
      )}

      <MoveDialog
        isOpen={showMoveDialog}
        onClose={() => setShowMoveDialog(false)}
        onMove={handleMove}
        files={files}
        selectedItems={selectedItems}
      />

      <UploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        currentPath={currentPath}
        onUpload={handleUpload}
      />

      <style>
        {`
          .file-tree-viewer {
            display: flex;
            flex-direction: column;
            height: 100%;
            background: var(--Background-Color);
            color: var(--Text-Color);
          }

          .file-tree-toolbar {
            display: flex;
            padding: var(--8px-V);
            gap: var(--8px-V);
            background: var(--Background-Color2);
            border-bottom: 1px solid var(--Secondary-Color);
          }

          .action-toolbar {
            display: flex;
            flex-direction: row;
            padding: var(--8px-V);
            gap: var(--8px-V);
            background: var(--Background-Color2);
            border-bottom: 1px solid var(--Secondary-Color);
          }

          .search-bar {
            display: flex;
            align-items: center;
            gap: var(--8px-V);
            flex: 1;
          }

          .search-bar input {
            flex: 1;
            min-width: 0;
          }

          .toolbar-buttons {
            display: flex;
            gap: var(--8px-V);
          }

          .file-tree-content {
            flex: 1;
            overflow: auto;
            padding: var(--8px-V);
          }

          .file-tree-item {
            border-radius: var(--3px-V);
          }

         .file-action-buttons{
         display: 'flex',
width: '100%',
gap: '10px'}

          .file-info {
            display: flex;
            gap: var(--16px-V);
            color: var(--Text-Color-Grey);
            font-size: var(--13px-V);
            margin-left: auto;
            padding-right: var(--8px-V);
          }

          .file-type {
            min-width: var(--80px-V);
            text-align: right;
          }

          .file-size {
            min-width: var(--80px-V);
            text-align: right;
          }

          .file-date {
            min-width: var(--150px-V);
            text-align: right;
          }

          .context-menu-item {
            padding: var(--5px-V) var(--10px-V);
            cursor: pointer;
            border-radius: var(--3px-V);
          }

          .context-menu-item:hover {
            background-color: var(--Primary-Color25);
          }

          .expand-icon {
            width: var(--20px-V);
            display: flex;
            align-items: center;
            justify-content: center;
          }


          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
          }

          .modal-content {
            background: var(--Background-Color);
            padding: var(--24px-V);
            border-radius: var(--8px-V);
            min-width: var(--400px-V);
            max-width: 90%;
            max-height: 90%;
            overflow-y: auto;
          }

          .modal-buttons {
            display: flex;
            justify-content: flex-end;
            gap: var(--8px-V);
            margin-top: var(--16px-V);
          }

          .modal-content h2 {
            margin-top: 0;
            margin-bottom: var(--16px-V);
          }

          select {
            padding: var(--8px-V);
            border-radius: var(--4px-V);
            border: 1px solid var(--Secondary-Color);
            background: var(--Background-Color2);
            color: var(--Text-Color);
          }

          select option {
            padding: var(--4px-V);
          }

          .file-tree-item {
            transition: background-color 0.2s, border 0.2s;
          }

          .file-tree-item.drag-over {
            background-color: var(--Primary-Color25);
            border: 1px dashed var(--Primary-Color);
          }

          .file-tree-item[draggable=true]:active {
            opacity: 0.7;
          }

          .loading-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--10px-V);
            padding: var(--20px-V);
            color: var(--Text-Color);
          }
        `}
      </style>
    </div>
  );
};

// Helper function to update a file tree item
const updateFileTreeItem = (
  files: FileItem[],
  id: string,
  updates: Partial<FileItem>
): FileItem[] => {
  return files.map((file) => {
    if (file.id === id) {
      return { ...file, ...updates };
    }
    if (file.children) {
      return {
        ...file,
        children: updateFileTreeItem(file.children, id, updates),
      };
    }
    return file;
  });
};

// Helper function to get all items in a flat array
const getAllItems = (items: FileItem[]): FileItem[] => {
  let result: FileItem[] = [];
  items.forEach((item) => {
    result.push(item);
    if (item.children) {
      result = result.concat(getAllItems(item.children));
    }
  });
  return result;
};

export default FileTreeViewer;
