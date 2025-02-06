# Document Search Application

A lightweight web-based document search tool that allows users to search through multiple document types (PDF, DOCX, TXT) simultaneously.

[Try Here](https://multi-doc-search.vercel.app/)

## Features

- **Multi-Document Support**: Search across multiple documents at once
- **Multiple File Formats**: Supports PDF, DOCX, and TXT files
- **Real-time Search**: Instantly see search results with highlighted matches
- **Document Navigation**: Easy switching between documents
- **Match Highlighting**: Clear visual highlighting of search terms
- **Match Counter**: Shows total number of matches found
- **Responsive Design**: Works on both desktop and mobile devices

## Usage

1. **Upload Documents**
   - Click "Choose Files" button
   - Select one or more documents (PDF, DOCX, or TXT)
   - Files will appear in the left sidebar

2. **Search**
   - Enter search term in the search box
   - Press Enter or click Search button
   - Results will show with highlighted matches
   - Total match count will be displayed

3. **Navigate Documents**
   - Click on document names in the sidebar to switch between documents
   - Search highlights persist when switching documents
   - First match is automatically scrolled into view

## Technical Details

### Dependencies
- PDF.js (v2.16.105) - For PDF file processing
- Mammoth.js (v1.4.2) - For DOCX file processing

### Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge

### File Size Limits
- PDF: Unlimited
- DOCX: Unlimited
- TXT: Unlimited

## Implementation Notes

The application uses:
- Modern JavaScript (ES6+)
- Async/await for file processing
- Regular expressions for search
- CSS Grid for layout
- CSS Variables for theming

## Security

- All processing is done client-side
- No data is sent to any server
- Files are only stored in browser memory
- Memory is cleared when page is refreshed

## Performance

The application is optimized for:
- Fast search across multiple documents
- Efficient memory usage
- Smooth scrolling to matches
- Quick document switching

## Limitations

- Large PDF files may take longer to process
- Search is case-insensitive
- No persistent storage (files are cleared on page refresh)
- Limited to text-based search (no image search)

## Future Improvements

Potential features for future versions:
- Case-sensitive search option
- Whole word search
- Search history
- File persistence
- Export search results
- Dark mode
- Advanced search filters

## Contributing

Feel free to fork and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.

## License

MIT License - feel free to use this in your own projects.

## Credits

Built with:
- PDF.js by Mozilla
- Mammoth.js for DOCX processing 
