let filesData = {};
let currentDocument = null;
let searchResults = [];
let currentResultIndex = 0;
let currentWordIndex = 0;
let currentMatches = [];

document.getElementById('fileInput').addEventListener('change', handleFileUpload);
document.getElementById('additionalFiles').addEventListener('change', handleFileUpload);
document.getElementById('clearFiles').addEventListener('click', clearFiles);
document.getElementById('searchTerm').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchDocuments();
});

async function handleFileUpload(event) {
    const files = event.target.files;
    if (files.length === 0) return;

    setLoading(true);
    try {
        // Create a temporary object for new files
        const newFiles = {};
        for (const file of files) {
            const content = await readFile(file);
            newFiles[file.name] = content;
        }
        
        // Merge new files with existing files, putting new ones first
        filesData = { ...newFiles, ...filesData };
        
        updateFileList();
        setLoading(false);
        
        // Show/hide appropriate buttons
        document.getElementById('uploadLabel').style.display = 'none';
        document.getElementById('addMoreLabel').style.display = 'flex';
        document.getElementById('clearFiles').style.display = 'flex';
        
        // Clear the input value to allow uploading the same file again
        event.target.value = '';
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
    const fileCount = Object.keys(filesData).length;
    const searchTerm = document.getElementById('searchTerm').value.trim();
    
    if (fileCount > 0) {
        fileList.innerHTML = Object.keys(filesData)
            .map(fileName => {
                // Check if file contains search term
                const hasMatches = searchTerm && 
                    searchResults.some(result => result.fileName === fileName);
                
                return `
                    <div class="file-item ${currentDocument === fileName ? 'active' : ''}" 
                         onclick="viewDocument('${fileName}')">
                        <i class="fas fa-file-alt"></i>
                        ${fileName}
                        ${hasMatches ? '<span class="has-matches"></span>' : ''}
                    </div>
                `;
            }).join('');
    } else {
        fileList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>No documents uploaded yet</p>
            </div>
        `;
    }
}

function viewDocument(fileName) {
    currentDocument = fileName;
    const searchTerm = document.getElementById('searchTerm').value.trim();
    
    if (searchTerm) {
        document.getElementById('documentViewer').innerHTML = 
            highlightMatches(filesData[fileName], searchTerm);
        
        setTimeout(() => {
            updateCurrentHighlight();
        }, 100);
    } else {
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
    const navigationContainer = document.getElementById('navigationContainer');
    
    let totalMatches = 0;
    searchResults = [];
    currentResultIndex = 0;
    currentWordIndex = 0;

    documentViewer.innerHTML = '';
    resultsCount.style.display = 'none';
    navigationContainer.style.display = 'none';

    // Search through all documents
    Object.entries(filesData).forEach(([fileName, content]) => {
        const matches = findMatches(content, searchTerm);
        if (matches.length > 0) {
            totalMatches += matches.length;
            searchResults.push({ fileName, matches });
        }
    });

    // Update file list to show indicators
    updateFileList();

    // Update navigation buttons
    updateNavigationButtons();

    // Display results
    if (searchResults.length > 0) {
        const firstResult = searchResults[0];
        currentDocument = firstResult.fileName;
        
        documentViewer.innerHTML = highlightMatches(filesData[currentDocument], searchTerm);
        
        updateFileList();
        resultsCount.textContent = `Document ${currentResultIndex + 1} of ${searchResults.length} (${totalMatches} total matches)`;
        
        // Show results count and navigation
        resultsCount.style.display = 'block';
        navigationContainer.style.display = 'flex';

        const firstMatch = document.querySelector('.highlight');
        if (firstMatch) {
            firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        const highlights = document.querySelectorAll('.highlight');
        updateWordNavigation(highlights.length);

        currentWordIndex = 0;
        setTimeout(() => {
            updateCurrentHighlight();
        }, 100);
    } else {
        resultsCount.textContent = 'No matches found';
        resultsCount.style.display = 'block';
        documentViewer.innerHTML = 'No matches found in any document';
        navigationContainer.style.display = 'none';
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
    const loading = document.getElementById('loading');
    if (show) {
        loading.style.display = 'block';
    } else {
        loading.style.display = 'none';
    }
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

function navigateWords(direction) {
    const highlights = document.querySelectorAll('.highlight');
    if (highlights.length === 0) return;

    if (direction === 'next' && currentWordIndex < highlights.length - 1) {
        currentWordIndex++;
    } else if (direction === 'prev' && currentWordIndex > 0) {
        currentWordIndex--;
    }

    updateCurrentHighlight();

    highlights[currentWordIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });

    updateWordNavigation(highlights.length);
}

function updateWordNavigation(totalMatches) {
    const prevWordBtn = document.getElementById('prevWord');
    const nextWordBtn = document.getElementById('nextWord');
    
    prevWordBtn.disabled = currentWordIndex === 0;
    nextWordBtn.disabled = currentWordIndex === totalMatches - 1;
    
    // Update results count to include current match
    if (totalMatches > 0) {
        document.getElementById('resultsCount').textContent = 
            `Match ${currentWordIndex + 1} of ${totalMatches} in document ${currentResultIndex + 1} of ${searchResults.length}`;
    }
}

function updateCurrentHighlight() {
    // Remove current class from all highlights
    document.querySelectorAll('.highlight').forEach(el => {
        el.classList.remove('current');
    });
    
    // Add current class to the active highlight
    const highlights = document.querySelectorAll('.highlight');
    if (highlights.length > 0 && highlights[currentWordIndex]) {
        highlights[currentWordIndex].classList.add('current');
    }
}

function clearFiles() {
    filesData = {};
    currentDocument = null;
    searchResults = [];
    currentResultIndex = 0;
    currentWordIndex = 0;
    currentMatches = [];
    
    // Reset UI
    updateFileList();
    document.getElementById('documentViewer').innerHTML = '';
    document.getElementById('resultsCount').style.display = 'none';
    document.getElementById('navigationContainer').style.display = 'none';
    document.getElementById('loading').style.display = 'none';
    
    // Reset buttons
    document.getElementById('uploadLabel').style.display = 'flex';
    document.getElementById('addMoreLabel').style.display = 'none';
    document.getElementById('clearFiles').style.display = 'none';
    
    // Reset file inputs
    document.getElementById('fileInput').value = '';
    document.getElementById('additionalFiles').value = '';
    
    // Disable navigation buttons
    document.getElementById('prevDoc').disabled = true;
    document.getElementById('nextDoc').disabled = true;
    document.getElementById('prevWord').disabled = true;
    document.getElementById('nextWord').disabled = true;
}