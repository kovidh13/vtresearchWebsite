// Client/myCV.js

document.addEventListener('DOMContentLoaded', function() {
  const token = localStorage.getItem('token');
  const user = getUserFromToken();

  if (!token || !user || user.role !== 'student') {
    alert('Access denied. Only students can access this page.');
    window.location.href = 'researchIndex.html';
    return;
  }

  const form = document.getElementById('cv-upload-form');
  const messageDiv = document.getElementById('cv-message');
  const cvListDiv = document.getElementById('cv-list');

  // Function to fetch and display the list of CVs
  function loadCVs() {
    fetch('/api/my-cvs', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error fetching CVs: ${response.statusText}`);
        }
        return response.json();
      })
      .then(cvs => {
        cvListDiv.innerHTML = '';
        if (cvs.length === 0) {
          cvListDiv.innerHTML = '<p>You have not uploaded any CVs yet.</p>';
          return;
        }
        const cvList = document.createElement('ul');
        cvs.forEach(cv => {
          const cvItem = document.createElement('li');
          cvItem.innerHTML = `
            ${cv.filename} - Uploaded on ${new Date(cv.uploadedAt).toLocaleString()}
            <a href="#" class="download-cv-link">Download</a>
            <button class="delete-cv-button" data-cvid="${cv._id}">Delete</button>
          `;

          // Attach event listener for download
          const downloadLink = cvItem.querySelector('.download-cv-link');
          downloadLink.addEventListener('click', function(e) {
            e.preventDefault();
            downloadCV(cv.filename);
          });

          cvList.appendChild(cvItem);
        });
        cvListDiv.appendChild(cvList);

        // Attach event listeners to delete buttons
        const deleteButtons = document.querySelectorAll('.delete-cv-button');
        deleteButtons.forEach(button => {
          button.addEventListener('click', function() {
            const cvId = this.getAttribute('data-cvid');
            if (confirm(`Are you sure you want to delete this CV?`)) {
              deleteCV(cvId);
            }
          });
        });
      })
      .catch(error => {
        console.error('Error fetching CVs:', error);
        cvListDiv.innerHTML = '<p>Error loading your CVs.</p>';
      });
  }

  // Function to handle CV deletion
  function deleteCV(cvId) {
    fetch(`/api/delete-cv/${cvId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => { throw new Error(data.message || 'Error deleting CV'); });
      }
      return response.json();
    })
    .then(data => {
      if (data.message === 'CV deleted successfully') {
        messageDiv.innerHTML = '<p class="success">CV deleted successfully.</p>';
        loadCVs(); // Refresh the CV list
      } else {
        messageDiv.innerHTML = `<p class="error">Error: ${data.message}</p>`;
      }
    })
    .catch(error => {
      console.error('Error deleting CV:', error);
      messageDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    });
  }

  // Function to handle CV download
  function downloadCV(filename) {
    fetch(`/download-cv/${filename}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => { throw new Error(data.message || 'Error downloading CV'); });
      }
      return response.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    })
    .catch(error => {
      console.error('Error downloading CV:', error);
      messageDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    });
  }

  // Load the CVs when the page loads
  loadCVs();

  // Handle CV upload
  form.addEventListener('submit', function(event) {
    event.preventDefault();

    const fileInput = document.getElementById('cv-file');
    const file = fileInput.files[0];

    if (!file) {
      messageDiv.innerHTML = '<p class="error">Please select a file to upload.</p>';
      return;
    }

    const formData = new FormData();
    formData.append('cv', file);

    // Optional: Show a loading indicator
    messageDiv.innerHTML = '<p>Uploading CV...</p>';

    fetch('/api/upload-cv', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    })
    .then(response => response.json())
    .then(data => {
      if (data.message === 'CV uploaded successfully') {
        messageDiv.innerHTML = '<p class="success">CV uploaded successfully.</p>';
        fileInput.value = ''; // Reset the file input
        loadCVs(); // Refresh the CV list
      } else {
        messageDiv.innerHTML = `<p class="error">Error: ${data.message}</p>`;
      }
    })
    .catch(error => {
      console.error('Error uploading CV:', error);
      messageDiv.innerHTML = '<p class="error">An error occurred while uploading the CV.</p>';
    });
  });

  // Function to get user information from token
  function getUserFromToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));
      return decodedPayload;
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  }
});
