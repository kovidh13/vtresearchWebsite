// Client/myCV.js

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const user = getUserFromToken();
  
    if (!token || user.role !== 'student') {
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
        .then(response => response.json())
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
              <a href="/download-cv/${cv.filename}" target="_blank">Download</a>
            `;
            cvList.appendChild(cvItem);
          });
          cvListDiv.appendChild(cvList);
        })
        .catch(error => {
          console.error('Error fetching CVs:', error);
          cvListDiv.innerHTML = '<p>Error loading your CVs.</p>';
        });
    }
  
    // Load the CVs when the page loads
    loadCVs();
  
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
          messageDiv.innerHTML = '<p class="success">CV uploaded successfully!</p>';
          loadCVs(); // Refresh the CV list
        } else {
          messageDiv.innerHTML = `<p class="error">${data.message}</p>`;
        }
      })
      .catch(error => {
        console.error('Error uploading CV:', error);
        messageDiv.innerHTML = '<p class="error">An error occurred. Please try again later.</p>';
      });
    });

  });
  