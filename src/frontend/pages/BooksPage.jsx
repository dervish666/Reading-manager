/**
 * Books Page
 * Manage book library
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Book as BookIcon,
  Search as SearchIcon,
  FileDownload as ExportIcon,
  FileUpload as ImportIcon
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';

function BooksPage() {
  const { state, api } = useApp();
  const { books, genres } = state;

  // Debug logging
  console.log('BooksPage rendered with:', { booksCount: books.length, genresCount: genres.length });

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Import/Export state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genreIds: [],
    readingLevel: '',
    ageRange: ''
  });

  // OpenLibrary search state
  const [externalSearchOpen, setExternalSearchOpen] = useState(false);
  const [externalSearchQuery, setExternalSearchQuery] = useState('');
  const [externalSearchResults, setExternalSearchResults] = useState([]);
  const [externalSearchLoading, setExternalSearchLoading] = useState(false);
  const [previewBook, setPreviewBook] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Author lookup state
  const [authorLookupOpen, setAuthorLookupOpen] = useState(false);
  const [authorLookupResults, setAuthorLookupResults] = useState([]);
  const [authorLookupLoading, setAuthorLookupLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          api.getBooks(),
          api.getGenres()
        ]);
      } catch (error) {
        console.error('Error loading books data:', error);
        setSnackbar({ open: true, message: 'Failed to load books data', severity: 'error' });
      }
    };

    if (books.length === 0 && genres.length === 0) {
      loadData();
    }
  }, [api, books.length, genres.length]);

  // Filter books
  const filteredBooks = books.filter(book => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.author && book.author.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesGenre = !selectedGenre || book.genreIds.includes(selectedGenre);

    return matchesSearch && matchesGenre;
  });

  const handleCreateBook = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      genreIds: [],
      readingLevel: '',
      ageRange: ''
    });
    setDialogOpen(true);
  };

  const handleEditBook = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      genreIds: book.genreIds || [],
      readingLevel: book.readingLevel || '',
      ageRange: book.ageRange || ''
    });
    setDialogOpen(true);
  };

  const handleDeleteBook = async (bookId) => {
    if (window.confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      try {
        await api.deleteBook(bookId);
        setSnackbar({ open: true, message: 'Book deleted successfully', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: 'Failed to delete book', severity: 'error' });
      }
    }
  };

  const handleSaveBook = async () => {
    try {
      if (editingBook) {
        await api.updateBook(editingBook.id, formData);
        setSnackbar({ open: true, message: 'Book updated successfully', severity: 'success' });
      } else {
        await api.createBook(formData);
        setSnackbar({ open: true, message: 'Book created successfully', severity: 'success' });
      }
      setDialogOpen(false);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save book', severity: 'error' });
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBook(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // OpenLibrary search handlers
  const handleOpenExternalSearch = () => {
    setExternalSearchOpen(true);
    setExternalSearchQuery('');
    setExternalSearchResults([]);
  };

  const handleCloseExternalSearch = () => {
    setExternalSearchOpen(false);
    setExternalSearchQuery('');
    setExternalSearchResults([]);
  };

  const handleExternalSearch = async () => {
    if (!externalSearchQuery.trim()) return;

    setExternalSearchLoading(true);
    try {
      const response = await fetch(`/api/books/search/external?q=${encodeURIComponent(externalSearchQuery.trim())}&limit=20`);
      const result = await response.json();

      if (response.ok) {
        setExternalSearchResults(result.data);
      } else {
        setSnackbar({ open: true, message: result.error?.message || 'Search failed', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to search external library', severity: 'error' });
    } finally {
      setExternalSearchLoading(false);
    }
  };

  const handlePreviewBook = async (book) => {
    try {
      const response = await fetch(`/api/books/external/${book.externalId}`);
      const result = await response.json();

      if (response.ok) {
        setPreviewBook({ ...book, ...result.data });
        setPreviewOpen(true);
      } else {
        setSnackbar({ open: true, message: result.error?.message || 'Failed to load book details', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to load book details', severity: 'error' });
    }
  };

  const handleImportBook = async (bookData) => {
    try {
      const response = await fetch('/api/books/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          externalId: bookData.externalId,
          genreIds: [],
          readingLevel: '',
          ageRange: ''
        })
      });

      const result = await response.json();

      if (response.ok) {
        setSnackbar({ open: true, message: 'Book imported successfully', severity: 'success' });
        setPreviewOpen(false);
        // Refresh books data
        await api.getBooks();
      } else {
        setSnackbar({ open: true, message: result.error?.message || 'Failed to import book', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to import book', severity: 'error' });
    }
  };

  // Author lookup handlers
  const handleOpenAuthorLookup = async () => {
    if (!formData.title.trim()) return;

    setAuthorLookupOpen(true);
    setAuthorLookupLoading(true);
    setAuthorLookupResults([]);

    try {
      // Search OpenLibrary for books matching the title to find authors
      const response = await fetch(`/api/books/search/external?q=${encodeURIComponent(formData.title.trim())}&limit=10`);
      const result = await response.json();

      if (response.ok) {
        // Extract unique authors from search results
        const authors = [];
        const authorSet = new Set();

        result.data.forEach(book => {
          if (book.author && !authorSet.has(book.author.toLowerCase())) {
            authorSet.add(book.author.toLowerCase());
            authors.push({
              name: book.author,
              bookTitle: book.title,
              source: 'openlibrary'
            });
          }
        });

        setAuthorLookupResults(authors);
      } else {
        setSnackbar({ open: true, message: 'Failed to search for authors', severity: 'error' });
        setAuthorLookupOpen(false);
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to search for authors', severity: 'error' });
      setAuthorLookupOpen(false);
    } finally {
      setAuthorLookupLoading(false);
    }
  };

  const handleCloseAuthorLookup = () => {
    setAuthorLookupOpen(false);
    setAuthorLookupResults([]);
  };

  const handleSelectAuthor = (authorName) => {
    setFormData({ ...formData, author: authorName });
    setAuthorLookupOpen(false);
    setAuthorLookupResults([]);
  };

  const handleOpenImportDialog = () => {
    setImportDialogOpen(true);
  };

  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
    setImportFile(null);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setImportFile(file);
  };

  const handleImportBooks = async () => {
    if (!importFile) {
      setSnackbar({ open: true, message: 'Please select a file to import', severity: 'error' });
      return;
    }

    setImportLoading(true);
    try {
      const fileContent = await importFile.text();
      const importData = JSON.parse(fileContent);

      if (!Array.isArray(importData)) {
        setSnackbar({ open: true, message: 'Invalid file format. Expected an array of books.', severity: 'error' });
        return;
      }

      const response = await fetch('/api/books/batch-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(importData),
      });

      const result = await response.json();

      if (response.ok) {
        setSnackbar({
          open: true,
          message: result.message,
          severity: 'success'
        });
        handleCloseImportDialog();
        // Refresh books list
        await api.getBooks();
      } else {
        setSnackbar({
          open: true,
          message: result.error?.message || 'Failed to import books',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to import books. Please check the file format.',
        severity: 'error'
      });
    } finally {
      setImportLoading(false);
    }
  };

  const handleExportBooks = async () => {
    setExportLoading(true);
    try {
      const response = await fetch('/api/books/export');
      const exportData = await response.json();

      if (response.ok) {
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `books_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setSnackbar({
          open: true,
          message: 'Books exported successfully',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to export books',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to export books',
        severity: 'error'
      });
    } finally {
      setExportLoading(false);
    }
  };

  const getBookGenres = (genreIds) => {
    return genres.filter(genre => genreIds.includes(genre.id));
  };

  // Show loading while data is being fetched
  if (state.loading && books.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading books...</Typography>
      </Box>
    );
  }

  // Show error state if there's an error and no books
  if (state.error && books.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Box textAlign="center">
          <Typography variant="h6" color="error" gutterBottom>
            Error Loading Books
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {state.error}
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Retry
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Books
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<ImportIcon />}
            onClick={handleOpenImportDialog}
            disabled={importLoading}
          >
            Import Books
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportBooks}
            disabled={exportLoading}
          >
            {exportLoading ? 'Exporting...' : 'Export Books'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<SearchIcon />}
            onClick={handleOpenExternalSearch}
          >
            Search Library
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateBook}
          >
            Add Book
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search books"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Filter by Genre</InputLabel>
                <Select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  label="Filter by Genre"
                >
                  <MenuItem value="">All Genres</MenuItem>
                  {genres.map((genre) => (
                    <MenuItem key={genre.id} value={genre.id}>
                      {genre.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Books Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Author</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Age Range</TableCell>
              <TableCell>Genres</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBooks.map((book) => (
              <TableRow key={book.id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    {book.coverImage ? (
                      <img
                        src={book.coverImage}
                        alt={`${book.title} cover`}
                        style={{
                          width: 40,
                          height: 56,
                          objectFit: 'cover',
                          borderRadius: 4,
                          marginRight: 12,
                          border: '1px solid #e0e0e0'
                        }}
                      />
                    ) : (
                      <BookIcon sx={{ fontSize: 32, color: 'primary.main', mr: 1 }} />
                    )}
                    <Typography variant="body1" fontWeight="medium">
                      {book.title}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{book.author || '-'}</TableCell>
                <TableCell>
                  {book.readingLevel && (
                    <Chip
                      label={book.readingLevel}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </TableCell>
                <TableCell>
                  {book.ageRange && (
                    <Chip
                      label={book.ageRange}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    {getBookGenres(book.genreIds).map((genre) => (
                      <Chip
                        key={genre.id}
                        label={genre.name}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEditBook(book)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteBook(book.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredBooks.length === 0 && (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <BookIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No books found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {searchTerm || selectedGenre
                ? 'Try adjusting your search or filter criteria'
                : 'Start building your library by adding your first book'
              }
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Book Form Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingBook ? 'Edit Book' : 'Add New Book'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Book Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" gap={1}>
                <TextField
                  fullWidth
                  label="Author (optional)"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                />
                <Button
                  variant="outlined"
                  onClick={handleOpenAuthorLookup}
                  disabled={!formData.title.trim()}
                  sx={{ minWidth: 'auto', px: 2 }}
                >
                  <SearchIcon />
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Genres</InputLabel>
                <Select
                  multiple
                  value={formData.genreIds}
                  onChange={(e) => setFormData({ ...formData, genreIds: e.target.value })}
                  label="Genres"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const genre = genres.find(g => g.id === value);
                        return genre ? (
                          <Chip key={value} label={genre.name} size="small" />
                        ) : null;
                      })}
                    </Box>
                  )}
                >
                  {genres.map((genre) => (
                    <MenuItem key={genre.id} value={genre.id}>
                      {genre.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Reading Level"
                value={formData.readingLevel}
                onChange={(e) => setFormData({ ...formData, readingLevel: e.target.value })}
                placeholder="e.g., Beginner, Intermediate, Advanced"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Age Range"
                value={formData.ageRange}
                onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                placeholder="e.g., 5-7 years, 8-10 years"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveBook}
            variant="contained"
            disabled={!formData.title.trim()}
          >
            {editingBook ? 'Update' : 'Add Book'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* External Library Search Dialog */}
      <Dialog open={externalSearchOpen} onClose={handleCloseExternalSearch} maxWidth="md" fullWidth>
        <DialogTitle>
          Search External Library
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              label="Search for books by title or author"
              value={externalSearchQuery}
              onChange={(e) => setExternalSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleExternalSearch()}
              placeholder="e.g., Harry Potter, J.K. Rowling"
            />
            <Button
              variant="contained"
              onClick={handleExternalSearch}
              disabled={externalSearchLoading || !externalSearchQuery.trim()}
            >
              {externalSearchLoading ? 'Searching...' : 'Search'}
            </Button>
          </Box>

          {externalSearchResults.length > 0 && (
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {externalSearchResults.map((book, index) => (
                <ListItem key={index} divider>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    {book.coverImage && (
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        style={{ width: 50, height: 70, objectFit: 'cover', marginRight: 16 }}
                      />
                    )}
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        {book.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        by {book.author}
                      </Typography>
                      {book.firstPublishYear && (
                        <Typography variant="caption" color="textSecondary">
                          First published: {book.firstPublishYear}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleImportBook(book)}
                      >
                        Add to Library
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handlePreviewBook(book)}
                      >
                        Preview
                      </Button>
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExternalSearch}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Book Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Book Preview
        </DialogTitle>
        <DialogContent>
          {previewBook && (
            <Box>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                {previewBook.coverImage && (
                  <img
                    src={previewBook.coverImage}
                    alt={previewBook.title}
                    style={{ width: 120, height: 160, objectFit: 'cover' }}
                  />
                )}
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {previewBook.title}
                  </Typography>
                  <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                    by {previewBook.author}
                  </Typography>
                  {previewBook.firstPublishYear && (
                    <Typography variant="body2" color="textSecondary">
                      First published: {previewBook.firstPublishYear}
                    </Typography>
                  )}
                  {previewBook.pageCount && (
                    <Typography variant="body2" color="textSecondary">
                      Pages: {previewBook.pageCount}
                    </Typography>
                  )}
                </Box>
              </Box>

              {previewBook.description && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2">
                    {previewBook.description}
                  </Typography>
                </Box>
              )}

              {previewBook.subjects && previewBook.subjects.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Subjects
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {previewBook.subjects.slice(0, 8).map((subject, index) => (
                      <Chip key={index} label={subject} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}

              {previewBook.authorBio && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    About the Author
                  </Typography>
                  <Typography variant="body2">
                    {previewBook.authorBio}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => handleImportBook(previewBook)}
          >
            Import to Library
          </Button>
        </DialogActions>
      </Dialog>

      {/* Author Lookup Dialog */}
      <Dialog open={authorLookupOpen} onClose={handleCloseAuthorLookup} maxWidth="sm" fullWidth>
        <DialogTitle>
          Select Author
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mb: 2 }}>
            Found potential authors for "{formData.title}":
          </Typography>

          {authorLookupLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <Typography>Searching for authors...</Typography>
            </Box>
          ) : authorLookupResults.length > 0 ? (
            <List>
              {authorLookupResults.map((author, index) => (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={author.name}
                    secondary={`From: ${author.bookTitle}`}
                  />
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleSelectAuthor(author.name)}
                    >
                      Select
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box textAlign="center" p={3}>
              <Typography color="textSecondary">
                No authors found for this title.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAuthorLookup}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Import Books Dialog */}
      <Dialog open={importDialogOpen} onClose={handleCloseImportDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Import Books
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Select a JSON file containing books to import. The file should be in the format exported by this application.
            </Typography>
            <Box sx={{ mt: 3, mb: 2 }}>
              <input
                accept=".json"
                style={{ display: 'none' }}
                id="import-file"
                type="file"
                onChange={handleFileSelect}
              />
              <label htmlFor="import-file">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  startIcon={<ImportIcon />}
                >
                  {importFile ? importFile.name : 'Choose JSON File'}
                </Button>
              </label>
            </Box>
            {importFile && (
              <Alert severity="info" sx={{ mt: 2 }}>
                File selected: {importFile.name}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImportDialog}>Cancel</Button>
          <Button
            onClick={handleImportBooks}
            variant="contained"
            disabled={!importFile || importLoading}
          >
            {importLoading ? 'Importing...' : 'Import Books'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default BooksPage;