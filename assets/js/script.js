let filesData = {};
let currentDocument = null;
let searchResults = [];
let currentResultIndex = 0;

document.getElementById('fileInput').addEventListener('change', handleFileUpload);
document.getElementById('searchTerm').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchDocuments();
});

async function handleFileUpload(event) {
    const files = event.target.files;
    if (files.length === 0) return;

    setLoading(true);
    try {
        for (const file of files) {
            const content = await readFile(file);
            filesData[file.name] = content;
        }
        updateFileList();
        setLoading(false);
    } catch (error) {
        console.error('Error reading files:', error);
        setLoading(false);
    }
}

async function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        if (file.name.endsWith('.pdf')) {
            reader.readAsArrayBuffer(file);
            reader.onload = async (e) => {
                try {
                    const pdfData = new Uint8Array(e.target.result);
                    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
                    let fullText = '';
                    
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        fullText += textContent.items.map(item => item.str).join(' ') + '\n';
                    }
                    resolve(fullText);
                } catch (error) {
                    reject(error);
                }
            };
        } else if (file.name.endsWith('.docx')) {
            reader.readAsArrayBuffer(file);
            reader.onload = async (e) => {
                try {
                    const result = await mammoth.extractRawText({
                        arrayBuffer: e.target.result
                    });
                    resolve(result.value);
                } catch (error) {
                    reject(error);
                }
            };
        } else {
            // For txt files
            reader.readAsText(file);
            reader.onload = (e) => resolve(e.target.result);
        }
        
        reader.onerror = () => reject(reader.error);
    });
}

function updateFileList() {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = Object.keys(filesData).map(fileName => `
        <div class="file-item ${currentDocument === fileName ? 'active' : ''}" 
             onclick="viewDocument('${fileName}')">
            ${fileName}
        </div>
    `).join('');
}

function viewDocument(fileName) {
    currentDocument = fileName;
    const searchTerm = document.getElementById('searchTerm').value.trim();
    
    if (searchTerm) {
        // If there's a search term, show highlighted content
        document.getElementById('documentViewer').innerHTML = 
            highlightMatches(filesData[fileName], searchTerm);
    } else {
        // Otherwise show normal content
        document.getElementById('documentViewer').innerHTML = filesData[fileName];
    }
    
    updateFileList();
}

function searchDocuments() {
    const searchTerm = document.getElementById('searchTerm').value.trim();
    if (!searchTerm) {
        alert('Please enter a search term');
        return;
    }

    setLoading(true);
    const documentViewer = document.getElementById('documentViewer');
    const resultsCount = document.getElementById('resultsCount');
    let totalMatches = 0;
    searchResults = [];  // Reset search results
    currentResultIndex = 0;  // Reset current index

    documentViewer.innerHTML = '';
    resultsCount.innerHTML = '';

    // Search through all documents
    Object.entries(filesData).forEach(([fileName, content]) => {
        const matches = findMatches(content, searchTerm);
        if (matches.length > 0) {
            totalMatches += matches.length;
            searchResults.push({ fileName, matches });
        }
    });

    // Update navigation buttons
    updateNavigationButtons();

    // Display results
    if (searchResults.length > 0) {
        // Show first document with matches
        const firstResult = searchResults[0];
        currentDocument = firstResult.fileName;
        
        // Highlight and display content
        const highlightedContent = highlightMatches(filesData[currentDocument], searchTerm);
        documentViewer.innerHTML = highlightedContent;
        
        // Update UI
        updateFileList();
        resultsCount.textContent = `Document ${currentResultIndex + 1} of ${searchResults.length} (${totalMatches} total matches)`;

        // Scroll to first match
        const firstMatch = document.querySelector('.highlight');
        if (firstMatch) {
            firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else {
        resultsCount.textContent = 'No matches found';
        documentViewer.innerHTML = 'No matches found in any document';
    }

    setLoading(false);
}

function findMatches(content, searchTerm) {
    const regex = new RegExp(searchTerm, 'gi');
    return Array.from(content.matchAll(regex));
}

function highlightMatches(content, searchTerm) {
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return content.replace(regex, '<span class="highlight">$1</span>');
}

function setLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function navigateDocuments(direction) {
    if (searchResults.length === 0) return;

    if (direction === 'next' && currentResultIndex < searchResults.length - 1) {
        currentResultIndex++;
    } else if (direction === 'prev' && currentResultIndex > 0) {
        currentResultIndex--;
    }

    // Update current document and display
    const result = searchResults[currentResultIndex];
    currentDocument = result.fileName;
    const searchTerm = document.getElementById('searchTerm').value.trim();
    
    // Update content
    document.getElementById('documentViewer').innerHTML = 
        highlightMatches(filesData[currentDocument], searchTerm);
    
    // Update UI
    updateFileList();
    document.getElementById('resultsCount').textContent = 
        `Document ${currentResultIndex + 1} of ${searchResults.length}`;
    
    // Scroll to first match
    const firstMatch = document.querySelector('.highlight');
    if (firstMatch) {
        firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    updateNavigationButtons();
}

function updateNavigationButtons() {
    const prevButton = document.getElementById('prevDoc');
    const nextButton = document.getElementById('nextDoc');
    
    prevButton.disabled = currentResultIndex === 0 || searchResults.length === 0;
    nextButton.disabled = currentResultIndex === searchResults.length - 1 || searchResults.length === 0;
}