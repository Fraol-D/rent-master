// Configure multer storage for gallery and news images
const galleryStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(baseDir, 'gallery');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const newsStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(baseDir, 'news');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadGallery = multer({
  storage: galleryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  },
});

const uploadNews = multer({
  storage: newsStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  },
});

// Add gallery image
app.post(
  '/api/gallery/upload',
  uploadGallery.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const imageUrl = `/gallery/${req.file.filename}`;
      const { title, description } = req.body;

      // Insert gallery item into database
      pool.getConnection((err, connection) => {
        if (err) {
          logger.error('Database connection error:', err);
          return res.status(500).json({ error: 'Database connection error' });
        }

        const galleryItem = {
          title,
          description,
          imageUrl,
          date: new Date().toISOString(),
        };

        connection.query(
          'INSERT INTO gallery SET ?',
          galleryItem,
          (error, result) => {
            connection.release();
            if (error) {
              logger.error('Error inserting gallery item:', error);
              return res
                .status(500)
                .json({ error: 'Failed to save gallery item' });
            }
            res.json({
              message: 'Gallery image uploaded successfully',
              imageUrl,
              id: result.insertId,
            });
          }
        );
      });
    } catch (error) {
      logger.error('Error uploading gallery image:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  }
);

// Add news image
app.post(
  '/api/news/upload',
  uploadNews.array('images', 5),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No image files provided' });
      }

      const imageUrls = req.files.map((file) => `/news/${file.filename}`);
      const { title, content } = req.body;

      // Insert news item into database
      pool.getConnection((err, connection) => {
        if (err) {
          logger.error('Database connection error:', err);
          return res.status(500).json({ error: 'Database connection error' });
        }

        const newsItem = {
          title,
          content,
          images: JSON.stringify(imageUrls),
          date: new Date().getTime(),
        };

        connection.query(
          'INSERT INTO news SET ?',
          newsItem,
          (error, result) => {
            connection.release();
            if (error) {
              logger.error('Error inserting news item:', error);
              return res
                .status(500)
                .json({ error: 'Failed to save news item' });
            }
            res.json({
              message: 'News images uploaded successfully',
              imageUrls,
              id: result.insertId,
            });
          }
        );
      });
    } catch (error) {
      logger.error('Error uploading news images:', error);
      res.status(500).json({ error: 'Failed to upload images' });
    }
  }
);

// Serve gallery and news images
app.use('/gallery', express.static(path.join(baseDir, 'gallery')));
app.use('/news', express.static(path.join(baseDir, 'news')));

// Get gallery items
app.get('/api/gallery', (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      logger.error('Database connection error:', err);
      return res.status(500).json({ error: 'Database connection error' });
    }

    connection.query(
      'SELECT * FROM gallery ORDER BY date DESC',
      (error, results) => {
        connection.release();
        if (error) {
          logger.error('Error fetching gallery items:', error);
          return res
            .status(500)
            .json({ error: 'Failed to fetch gallery items' });
        }
        res.json(results);
      }
    );
  });
});

// Get news items
app.get('/api/news', (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      logger.error('Database connection error:', err);
      return res.status(500).json({ error: 'Database connection error' });
    }

    connection.query(
      'SELECT * FROM news ORDER BY date DESC',
      (error, results) => {
        connection.release();
        if (error) {
          logger.error('Error fetching news items:', error);
          return res.status(500).json({ error: 'Failed to fetch news items' });
        }

        // Parse the images JSON string for each news item
        const processedResults = results.map((item) => ({
          ...item,
          images: JSON.parse(item.images),
        }));

        res.json(processedResults);
      }
    );
  });
});

// Delete gallery image
app.delete('/api/gallery/:id', (req, res) => {
  const { id } = req.params;

  pool.getConnection((err, connection) => {
    if (err) {
      logger.error('Database connection error:', err);
      return res.status(500).json({ error: 'Database connection error' });
    }

    // First get the image URL to delete the file
    connection.query(
      'SELECT imageUrl FROM gallery WHERE id = ?',
      [id],
      (error, results) => {
        if (error) {
          connection.release();
          logger.error('Error fetching gallery item:', error);
          return res
            .status(500)
            .json({ error: 'Failed to fetch gallery item' });
        }

        if (results.length === 0) {
          connection.release();
          return res.status(404).json({ error: 'Gallery item not found' });
        }

        const imagePath = path.join(baseDir, results[0].imageUrl);

        // Delete the file
        fs.unlink(imagePath, (unlinkError) => {
          if (unlinkError) {
            logger.error('Error deleting gallery image file:', unlinkError);
          }

          // Delete from database
          connection.query(
            'DELETE FROM gallery WHERE id = ?',
            [id],
            (deleteError) => {
              connection.release();
              if (deleteError) {
                logger.error(
                  'Error deleting gallery item from database:',
                  deleteError
                );
                return res
                  .status(500)
                  .json({ error: 'Failed to delete gallery item' });
              }
              res.json({ message: 'Gallery item deleted successfully' });
            }
          );
        });
      }
    );
  });
});

// Delete news item
app.delete('/api/news/:id', (req, res) => {
  const { id } = req.params;

  pool.getConnection((err, connection) => {
    if (err) {
      logger.error('Database connection error:', err);
      return res.status(500).json({ error: 'Database connection error' });
    }

    // First get the image URLs to delete the files
    connection.query(
      'SELECT images FROM news WHERE id = ?',
      [id],
      (error, results) => {
        if (error) {
          connection.release();
          logger.error('Error fetching news item:', error);
          return res.status(500).json({ error: 'Failed to fetch news item' });
        }

        if (results.length === 0) {
          connection.release();
          return res.status(404).json({ error: 'News item not found' });
        }

        const imageUrls = JSON.parse(results[0].images);

        // Delete all image files
        const deletePromises = imageUrls.map((imageUrl) => {
          const imagePath = path.join(baseDir, imageUrl);
          return new Promise((resolve) => {
            fs.unlink(imagePath, (unlinkError) => {
              if (unlinkError) {
                logger.error('Error deleting news image file:', unlinkError);
              }
              resolve();
            });
          });
        });

        Promise.all(deletePromises).then(() => {
          // Delete from database
          connection.query(
            'DELETE FROM news WHERE id = ?',
            [id],
            (deleteError) => {
              connection.release();
              if (deleteError) {
                logger.error(
                  'Error deleting news item from database:',
                  deleteError
                );
                return res
                  .status(500)
                  .json({ error: 'Failed to delete news item' });
              }
              res.json({ message: 'News item deleted successfully' });
            }
          );
        });
      }
    );
  });
});
