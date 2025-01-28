import React, { useState, useEffect, useRef } from 'react';
import { FaFolder, FaFile, FaFileImage, FaFilePdf, FaFileWord, FaTrash, FaPencilAlt, FaEye, FaSearch, FaFolderPlus, FaUpload, FaChevronDown, FaChevronRight } from 'react-icons/fa';

// Types
interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileItem[];
  extension?: string;
  size?: number;
  modifiedAt?: Date;
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

// Dummy data
const dummyFiles: FileItem[] = [
  {
    id: '1',
    name: 'Room Documents',
    type: 'folder',
    path: '/Room Documents',
    children: [
      {
        id: '2',
        name: 'Room 1, Floor 1 - abc123', 
        type: 'folder',
        path: '/Room Documents/Room 1',
        children: [
          {
            id: '3',
            name: 'document.pdf',
            type: 'file',
            path: '/Room Documents/Room 1/document.pdf',
            extension: 'pdf',
            size: 1024,
            modifiedAt: new Date()
          },
          {
            id: '4',
            name: 'specifications.docx',
            type: 'file',
            path: '/Room Documents/Room 1/specifications.docx',
            extension: 'docx',
            size: 512,
            modifiedAt: new Date()
          }
        ]
      },
      {
        id: '5',
        name: 'Room 2, Floor 1 - def456',
        type: 'folder',
        path: '/Room Documents/Room 2',
        children: [
          {
            id: '6',
            name: 'maintenance.pdf',
            type: 'file',
            path: '/Room Documents/Room 2/maintenance.pdf',
            extension: 'pdf',
            size: 2048,
            modifiedAt: new Date()
          }
        ]
      }
    ]
  },
  {
    id: '7',
    name: 'Room Pictures',
    type: 'folder',
    path: '/Room Pictures',
    children: [
      {
        id: '8',
        name: 'Floor 1',
        type: 'folder',
        path: '/Room Pictures/Floor 1',
        children: [
          {
            id: '9',
            name: 'room1.jpg',
            type: 'file',
            path: '/Room Pictures/Floor 1/room1.jpg',
            extension: 'jpg',
            size: 2048,
            modifiedAt: new Date()
          },
          {
            id: '10',
            name: 'room2.jpg',
            type: 'file',
            path: '/Room Pictures/Floor 1/room2.jpg',
            extension: 'jpg',
            size: 1536,
            modifiedAt: new Date()
          }
        ]
      },
      {
        id: '11',
        name: 'Floor 2',
        type: 'folder',
        path: '/Room Pictures/Floor 2',
        children: [
          {
            id: '12',
            name: 'room3.jpg',
            type: 'file',
            path: '/Room Pictures/Floor 2/room3.jpg',
            extension: 'jpg',
            size: 1792,
            modifiedAt: new Date()
          }
        ]
      }
    ]
  },
  {
    id: '13',
    name: 'Building Plans',
    type: 'folder',
    path: '/Building Plans',
    children: [
      {
        id: '14',
        name: 'floor1_blueprint.pdf',
        type: 'file',
        path: '/Building Plans/floor1_blueprint.pdf',
        extension: 'pdf',
        size: 5120,
        modifiedAt: new Date()
      },
      {
        id: '15',
        name: 'floor2_blueprint.pdf',
        type: 'file',
        path: '/Building Plans/floor2_blueprint.pdf',
        extension: 'pdf',
        size: 4096,
        modifiedAt: new Date()
      }
    ]
  }
];

// File operations
const fileOperations = {
  get: async (path: string): Promise<FileItem | null> => {
    // Simulate API call
    const findFile = (items: FileItem[], targetPath: string): FileItem | null => {
      for (const item of items) {
        if (item.path === targetPath) return item;
        if (item.children) {
          const found = findFile(item.children, targetPath);
          if (found) return found;
        }
      }
      return null;
    };
    return findFile(dummyFiles, path);
  },

  getMultiple: async (directoryPath: string): Promise<FileItem[]> => {
    // Simulate API call
    const findDirectory = (items: FileItem[], targetPath: string): FileItem[] => {
      for (const item of items) {
        if (item.path === targetPath && item.type === 'folder') {
          return item.children || [];
        }
        if (item.children) {
          const found = findDirectory(item.children, targetPath);
          if (found.length) return found;
        }
      }
      return [];
    };
    return findDirectory(dummyFiles, directoryPath);
  },

  open: async (path: string): Promise<void> => {
    // Simulate opening file with default application
    console.log(`Opening file: ${path}`);
    // In real implementation, use electron's shell.openPath(path)
  },

  rename: async (path: string, newName: string): Promise<boolean> => {
    // Simulate API call
    console.log(`Renaming ${path} to ${newName}`);
    return true;
  },

  delete: async (path: string): Promise<boolean> => {
    // Simulate API call
    console.log(`Deleting ${path}`);
    return true;
  }
};

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, item, onClose, onOpen, onCut, onCopy, onRename, onDownload, onDelete }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: y,
        left: x,
        backgroundColor: 'var(--Background-Color2)',
        border: '1px solid var(--Secondary-Color)',
        borderRadius: 'var(--5px-V)',
        padding: 'var(--5px-V)',
        zIndex: 1000,
        minWidth: '150px',
      }}
    >
      <div className="context-menu-item" onClick={onOpen}>Open</div>
      <div className="context-menu-item" onClick={onCut}>Cut</div>
      <div className="context-menu-item" onClick={onCopy}>Copy</div>
      <div className="context-menu-item" onClick={onRename}>Rename</div>
      <div className="context-menu-item" onClick={onDownload}>Download</div>
      <div className="context-menu-item" onClick={onDelete}>Delete</div>
    </div>
  );
};

const FileTreeViewer: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>(dummyFiles);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, item: FileItem} | null>(null);
  const [clipboard, setClipboard] = useState<{action: 'cut' | 'copy', items: FileItem[]} | null>(null);
  const [lastClickedItem, setLastClickedItem] = useState<{id: string, time: number} | null>(null);
  const DOUBLE_CLICK_DELAY = 300; // milliseconds

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

  const handleOpen = async (item: FileItem) => {
    if (item.type === 'file') {
      await fileOperations.open(item.path);
    }
  };

  const handleRename = async (item: FileItem) => {
    const newName = prompt('Enter new name:', item.name);
    if (newName && newName !== item.name) {
      const success = await fileOperations.rename(item.path, newName);
      if (success) {
        // Update UI (in real implementation, refresh from API)
        console.log('File renamed successfully');
      }
    }
  };

  const handleDelete = async (item: FileItem) => {
    if (confirm(`Are you sure you want to delete ${item.name}?`)) {
      const success = await fileOperations.delete(item.path);
      if (success) {
        // Update UI (in real implementation, refresh from API)
        console.log('File deleted successfully');
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent, item: FileItem) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item
    });
  };

  const handleItemClick = (e: React.MouseEvent, item: FileItem) => {
    e.stopPropagation();
    const currentTime = Date.now();

    // Handle selection
    const newSelected = new Set(selectedItems);
    
    if (e.ctrlKey) {
      if (selectedItems.has(item.id)) {
        newSelected.delete(item.id);
      } else {
        newSelected.add(item.id);
      }
    } else {
      newSelected.clear();
      newSelected.add(item.id);
    }
    setSelectedItems(newSelected);

    // Handle folder expansion on double click
    if (item.type === 'folder') {
      if (lastClickedItem && 
          lastClickedItem.id === item.id && 
          currentTime - lastClickedItem.time < DOUBLE_CLICK_DELAY) {
        // Double click - toggle folder
        toggleFolder(e, item);
        setLastClickedItem(null);
      } else {
        // First click - update last clicked
        setLastClickedItem({ id: item.id, time: currentTime });
      }
    }
  };

  const handleCollapseAll = () => {
    const collapseFiles = (items: FileItem[]): FileItem[] => {
      return items.map(item => ({
        ...item,
        isExpanded: false,
        children: item.children ? collapseFiles(item.children) : undefined
      }));
    };
    setFiles(collapseFiles(files));
  };

  const handleNewFolder = () => {
    // Implementation for creating new folder
  };

  const handleUpload = () => {
    // Implementation for file upload
  };

  const handleSearch = (searchTerm: string) => {
    setSearchTerm(searchTerm.toLowerCase());
  };

  const filterItems = (items: FileItem[], term: string): FileItem[] => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(term);
      const childMatches = item.children ? filterItems(item.children, term).length > 0 : false;
      return matchesSearch || childMatches;
    });
  };

  const toggleFolder = (e: React.MouseEvent, item: FileItem) => {
    e.stopPropagation(); // Prevent triggering selection
    if (item.type === 'folder') {
      setFiles(prevFiles => {
        const updateFiles = (items: FileItem[]): FileItem[] => {
          return items.map(file => {
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

  const calculateFolderSize = (item: FileItem): number => {
    if (item.type === 'file') return item.size || 0;
    
    if (!item.children) return 0;
    
    return item.children.reduce((total, child) => total + calculateFolderSize(child), 0);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getLatestModifiedDate = (item: FileItem): Date => {
    if (item.type === 'file') return item.modifiedAt || new Date();
    
    if (!item.children || item.children.length === 0) return item.modifiedAt || new Date();
    
    const childDates = item.children.map(child => getLatestModifiedDate(child));
    return new Date(Math.max(...childDates.map(date => date.getTime())));
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

  const renderToolbarButtons = () => {
    const selectedFileItems = getSelectedItems();
    const hasSelection = selectedItems.size > 0;
    const hasFileSelected = selectedFileItems.some(item => item.type === 'file');
    const hasFolderSelected = selectedFileItems.some(item => item.type === 'folder');

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
        <button 
          onClick={handleUpload}
          style={{ opacity: 1 }} // Always active
        >
          <FaUpload /> Upload
        </button>
      </div>
    );
  };

  const renderActionButtons = () => {
    const selectedFileItems = getSelectedItems();
    const hasSelection = selectedItems.size > 0;
    const hasFileSelected = selectedFileItems.some(item => item.type === 'file');
    const hasFolderSelected = selectedFileItems.some(item => item.type === 'folder');

    return (
      <div className="action-buttons">
        <button 
          onClick={() => handleOpen(selectedFileItems[0])}
          style={{ opacity: hasSelection ? 1 : 0.5 }}
          disabled={!hasSelection}
        >
          <FaEye /> Open
        </button>
        <button 
          onClick={() => {/* implement cut */}}
          style={{ opacity: hasSelection ? 1 : 0.5 }}
          disabled={!hasSelection}
        >
          <FaTrash /> Cut
        </button>
        <button 
          onClick={() => {/* implement copy */}}
          style={{ opacity: hasSelection ? 1 : 0.5 }}
          disabled={!hasSelection}
        >
          Copy
        </button>
        <button 
          onClick={() => handleRename(selectedFileItems[0])}
          style={{ opacity: hasSelection ? 1 : 0.5 }}
          disabled={!hasSelection}
        >
          <FaPencilAlt /> Rename
        </button>
        <button 
          onClick={() => {/* implement download */}}
          style={{ opacity: hasFileSelected ? 1 : 0.5 }}
          disabled={!hasFileSelected}
        >
          Download
        </button>
        <button 
          onClick={() => handleDelete(selectedFileItems[0])}
          style={{ opacity: hasSelection ? 1 : 0.5 }}
          disabled={!hasSelection}
        >
          <FaTrash /> Delete
        </button>
      </div>
    );
  };

  const renderTree = (items: FileItem[], depth: number = 0) => {
    return items.map(item => {
      const isSelected = selectedItems.has(item.id);
      const folderSize = item.type === 'folder' && item.isExpanded ? calculateFolderSize(item) : undefined;
      const modifiedDate = item.type === 'folder' ? getLatestModifiedDate(item) : (item.modifiedAt || new Date());
      
      return (
        <div
          key={item.id}
          style={{
            paddingLeft: `${depth * 20}px`,
          }}
        >
          <div 
            className={`file-tree-item ${isSelected ? 'selected' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: 'var(--4px-V)',
              cursor: 'pointer',
              backgroundColor: isSelected ? 'var(--Primary-Color25)' : 'transparent',
            }}
            onClick={(e) => handleItemClick(e, item)}
            onContextMenu={(e) => handleContextMenu(e, item)}
          >
            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              {item.type === 'folder' && (
                <span 
                  className="expand-icon"
                  onClick={(e) => toggleFolder(e, item)}
                >
                  {item.isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                </span>
              )}
              <span 
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--8px-V)' }}
                onClick={item.type === 'folder' ? (e) => toggleFolder(e, item) : undefined}
              >
                {getFileIcon(item)}
                <span>{item.name}</span>
              </span>
            </div>
            
            <div className="file-info">
              {(item.type === 'file' || folderSize !== undefined) && (
                <span className="file-size">
                  {item.type === 'file' ? formatFileSize(item.size || 0) : formatFileSize(folderSize || 0)}
                </span>
              )}
              <span className="file-date">{formatDate(modifiedDate)}</span>
            </div>
          </div>
          {item.children && item.isExpanded && renderTree(item.children, depth + 1)}
        </div>
      );
    });
  };

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

      <div className="action-toolbar">
        {renderActionButtons()}
      </div>
      
      <div className="file-tree-content">
        {renderTree(searchTerm ? filterItems(files, searchTerm) : files)}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          item={contextMenu.item}
          onClose={() => setContextMenu(null)}
          onOpen={() => handleOpen(contextMenu.item)}
          onCut={() => {/* implement */}}
          onCopy={() => {/* implement */}}
          onRename={() => handleRename(contextMenu.item)}
          onDownload={() => {/* implement */}}
          onDelete={() => handleDelete(contextMenu.item)}
        />
      )}

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

         

          .file-info {
            display: flex;
            gap: var(--16px-V);
            color: var(--Text-Color-Grey);
            font-size: var(--13px-V);
            margin-left: auto;
            padding-right: var(--8px-V);
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

          button {
            display: flex;
            align-items: center;
            gap: var(--4px-V);
          }
        `}
      </style>
    </div>
  );
};

export default FileTreeViewer;